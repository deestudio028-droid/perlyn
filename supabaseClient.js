if (!window.supabaseClient) {
  if (!window.ENV || !window.ENV.SUPABASE_URL || !window.ENV.SUPABASE_ANON_KEY) {
    console.error("🔴 Missing Supabase Environment Variables. Ensure env.js is loaded before supabaseClient.js.");
  } else {
    window.supabaseClient = window.supabase.createClient(
      window.ENV.SUPABASE_URL,
      window.ENV.SUPABASE_ANON_KEY
    );
    window.supabaseReady = true;
    console.log("🟢 Centralized Supabase client initialized");
  }
}
