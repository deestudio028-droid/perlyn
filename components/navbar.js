// 🌸 Perlyn Navbar Loader + Supabase Auth Control (v2.5 — Singleton Safe)
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 🧱 Load navbar dynamically
    const response = await fetch("components/navbar.html");
    if (!response.ok) throw new Error("Navbar file not found.");

    const navbarWrapper = document.createElement("div");
    navbarWrapper.id = "navbar-wrapper";
    // Ensure the wrapper itself is sticky so the inner header's sticky/scrolling behavior isn't restricted by the wrapper's height
    navbarWrapper.style.position = "sticky";
    navbarWrapper.style.top = "0";
    navbarWrapper.style.zIndex = "1000";
    
    navbarWrapper.innerHTML = await response.text();
    document.body.insertAdjacentElement("afterbegin", navbarWrapper);

    // 🌊 Smart Sticky Navbar Logic
    const header = navbarWrapper.querySelector('.header');
    if (header) {
      let lastScrollY = window.scrollY;
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            
            // 1. At the very top (or bounced past top on Safari)
            if (currentScrollY <= 0) {
              header.classList.remove('header-hidden');
              header.classList.remove('header-scrolled');
            } else {
              // 2. We have scrolled down a bit -> Add backdrop blur
              header.classList.add('header-scrolled');
              
              // We removed the 'header-hidden' logic so it is always visible when scrolling up or down.
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    // ✅ Supabase client is now centrally initialized via supabaseClient.js
    if (!window.supabaseClient) {
      console.error("🔴 Supabase client missing! Ensure env.js and supabaseClient.js are loaded.");
    } else {
      console.log("🟢 Supabase client verified from central configuration");
    }

    // ✅ Resolve immediately for any waiting page
    window.supabaseReady = true;

    // 🍔 Toggle Menu
    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("nav-menu");
    hamburger?.addEventListener("click", () => {
      navMenu.classList.toggle("show");
      hamburger.textContent = navMenu.classList.contains("show") ? "✖" : "☰";
    });

    document.querySelectorAll("#nav-menu a").forEach(link => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("show")) {
          navMenu.classList.remove("show");
          hamburger.textContent = "☰";
        }
      });
    });

    // 🧠 Auth check
    const supa = window.supabaseClient;
    const { data: { session } } = await supa.auth.getSession();

    const logoutBtn = document.getElementById("logoutBtn");
    const accountLink = document.getElementById("accountLink");

if (session) {
  logoutBtn.style.display = "inline-block";
  accountLink.innerText = "My Account";
  accountLink.href = "account.html";
} else {
  logoutBtn.style.display = "none";
  accountLink.innerText = "Login";
  // instead of directly linking to login.html, we call our redirect saver
  accountLink.href = "javascript:void(0)";
  accountLink.onclick = handleLoginRedirect;
}


    logoutBtn?.addEventListener("click", async (e) => {
      e.preventDefault();
      const { error } = await supa.auth.signOut();
      if (error) return alert("Logout failed: " + error.message);
      showToast("💫 Logged out successfully!");
      setTimeout(() => (window.location.href = "login.html"), 1000);
    });
// 🛒 CART COUNT DISPLAY (LIVE)
async function updateCartCount() {
  try {
    const supa = window.supabaseClient;
    const { data: { session } } = await supa.auth.getSession();

    const badge = document.querySelector(".cart-count");
    if (!badge) return;

    let total = 0;

    if (!session) {
      // Guest mode - fetch from localStorage
      const guestCartStr = localStorage.getItem("guestCart");
      const guestCart = (guestCartStr && guestCartStr !== "null") ? JSON.parse(guestCartStr) : [];
      total = (guestCart || []).reduce((sum, item) => sum + parseInt(item.quantity || 1, 10), 0);
    } else {
      // Logged in - fetch from supabase
      const userId = session.user.id;
      const { data: cartItems, error } = await supa
        .from("cart")
        .select("quantity")
        .eq("user_id", userId);

      if (error) throw error;
      total = cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
    }

    if (total > 0) {
      badge.textContent = total;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }

    console.log(`🛍️ Cart items: ${total}`);
  } catch (err) {
    console.error("Cart count error:", err.message);
  }
}

// Call after auth check
updateCartCount();

// Make it globally callable
window.updateCartCount = updateCartCount;

// 🔄 Auto-sync cart globally
window.addEventListener('cartUpdated', updateCartCount);
window.addEventListener('storage', (e) => {
  if (e.key === 'guestCart') {
    updateCartCount();
  }
});

    // 🎯 Highlight active page
    const current = window.location.pathname.split("/").pop();
    document.querySelectorAll("#nav-menu a").forEach(a => {
      if (a.getAttribute("href") === current) {
        a.style.color = "#b98474";
        a.style.fontWeight = "600";
      }
    });

    // 🌸 Toast
    function showToast(msg) {
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add("show"), 10);
      setTimeout(() => toast.remove(), 2500);
    }

    console.log("✨ Navbar loaded + Supabase ready!");
  } catch (err) {
    console.error("Navbar load error:", err);
  }
});
// 🌸 Save current page before navigating to login
function handleLoginRedirect() {
  localStorage.setItem("lastVisitedPage", window.location.href);
  window.location.href = "login.html";
}
window.handleLoginRedirect = handleLoginRedirect;
