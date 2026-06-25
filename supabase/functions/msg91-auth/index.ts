import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const MSG91_AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY')
const MSG91_TEMPLATE_ID = Deno.env.get('MSG91_TEMPLATE_ID')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Quick util to map phone to a dummy email for standard auth handling
const phoneToEmail = (phone: string) => `phone_${phone}@perlyn.local`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, phone, otp } = await req.json()

    // Normalize phone number (strip +91 or + if present, keep 10 digits)
    const normalizedPhone = phone.replace(/^\+?91/, '').replace(/\D/g, '')

    if (normalizedPhone.length !== 10) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    if (action === 'send') {
      // 1. Send OTP via MSG91
      const msg91Url = `https://control.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=91${normalizedPhone}&authkey=${MSG91_AUTH_KEY}`
      
      const response = await fetch(msg91Url, { method: 'POST' })
      const data = await response.json()
      
      if (data.type === 'error') {
        throw new Error(data.message || 'Failed to send OTP')
      }
      
      return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } 
    
    else if (action === 'verify') {
      if (!otp || otp.length !== 6) {
        return new Response(JSON.stringify({ error: 'Invalid OTP format' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
      }

      // 1. Verify OTP via MSG91
      const verifyUrl = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=91${normalizedPhone}&authkey=${MSG91_AUTH_KEY}`
      const response = await fetch(verifyUrl, { method: 'POST' })
      const data = await response.json()
      
      if (data.type === 'error') {
        throw new Error(data.message || 'Invalid OTP')
      }

      // 2. OTP is valid! Map phone to an email account in Supabase
      const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      const email = phoneToEmail(normalizedPhone)
      
      // Generate a deterministic strong password based on a secret and the phone number
      const encoder = new TextEncoder();
      const data = encoder.encode(normalizedPhone + SUPABASE_SERVICE_ROLE_KEY);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const deterministicPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + 'Aa1!';
      
      // Check if user exists
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError
      
      let user = usersData.users.find(u => u.email === email)

      if (!user) {
        // Create user with the deterministic password
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: deterministicPassword,
          email_confirm: true,
          user_metadata: { phone: `+91${normalizedPhone}` }
        })
        if (createError) throw createError
        user = createData.user
      }

      // 3. Sign in the user with the deterministic password
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password: deterministicPassword
      })

      if (authError) throw authError

      // 4. Return the session to the frontend
      return new Response(JSON.stringify({
        success: true,
        session: authData.session
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
