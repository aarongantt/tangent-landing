// Shared authentication modal for all pages
// This creates the same modal used on /account page

(function() {
  let loginModal;

  function ensureModal() {
    if (loginModal) return loginModal;
    loginModal = document.createElement("div");
    loginModal.id = "tg-login-modal";
    loginModal.style.position = "fixed";
    loginModal.style.inset = "0";
    loginModal.style.background = "rgba(15,23,42,0.55)";
    loginModal.style.backdropFilter = "blur(8px)";
    loginModal.style.display = "none";
    loginModal.style.alignItems = "center";
    loginModal.style.justifyContent = "center";
    loginModal.style.zIndex = "9999";
    loginModal.innerHTML = `
      <div style="background:#050915;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:22px;width:100%;max-width:420px;box-shadow:0 14px 36px rgba(0,0,0,0.45);color:#e5e7eb;position:relative;">
        <button id="tgLoginClose" style="position:absolute;top:10px;right:10px;background:transparent;border:0;color:#cbd5e1;font-size:18px;cursor:pointer;">×</button>
        <div style="display:flex;justify-content:center;margin-bottom:12px;">
          <img src="/images/tangent_logo.png" alt="Tangent" style="height:28px;" />
        </div>
        <h3 style="margin:0 0 14px 0;font-weight:700;">Sign In:</h3>
        <label style="display:block;margin-bottom:10px;font-weight:600;font-size:13px;">Email
          <input id="tgLoginEmail" type="email" autocomplete="email" style="width:100%;padding:12px 12px;margin-top:4px;border-radius:8px;border:1px solid rgba(255,255,255,0.25);background:rgba(5,6,10,0.7);color:#e5e7eb;box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);" />
        </label>
        <label style="display:block;margin-bottom:14px;font-weight:600;font-size:13px;">Password
          <input id="tgLoginPassword" type="password" autocomplete="current-password" style="width:100%;padding:12px 12px;margin-top:4px;border-radius:8px;border:1px solid rgba(255,255,255,0.25);background:rgba(5,6,10,0.7);color:#e5e7eb;box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);" />
        </label>
        <div style="display:flex;gap:10px;margin-top:12px;">
          <button id="tgLoginSignIn" class="cta-button secondary" style="flex:1;padding:10px 14px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 120ms ease;background:#64748b;color:#fff;">Sign In</button>
          <button id="tgLoginSignUp" class="cta-button secondary" style="flex:1;padding:10px 14px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 120ms ease;background:#64748b;color:#fff;">Sign Up</button>
        </div>
        <p id="tgLoginStatus" style="min-height:18px;font-size:13px;margin-top:10px;"></p>
      </div>
    `;
    document.body.appendChild(loginModal);
    loginModal.addEventListener("click", (e) => { if (e.target === loginModal) closeLoginModal(); });
    loginModal.querySelector("#tgLoginClose").addEventListener("click", closeLoginModal);
    loginModal.querySelector("#tgLoginSignIn").addEventListener("click", () => handleAuth("signin"));
    loginModal.querySelector("#tgLoginSignUp").addEventListener("click", () => handleAuth("signup"));
    const emailInput = loginModal.querySelector("#tgLoginEmail");
    const pwdInput = loginModal.querySelector("#tgLoginPassword");
    const onKey = (e) => { if (e.key === "Enter") { e.preventDefault(); handleAuth("signin"); } };
    emailInput.addEventListener("keydown", onKey);
    pwdInput.addEventListener("keydown", onKey);
    return loginModal;
  }

  function setStatus(msg, isError) {
    const el = loginModal?.querySelector("#tgLoginStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.style.color = isError ? "#f87171" : "#cbd5e1";
  }

  function openLoginModal() {
    ensureModal();
    loginModal.style.display = "flex";
    const emailInput = loginModal.querySelector("#tgLoginEmail");
    if (emailInput) emailInput.focus();
  }

  function closeLoginModal() {
    if (loginModal) loginModal.style.display = "none";
  }

  async function handleAuth(mode) {
    ensureModal();
    const email = loginModal.querySelector("#tgLoginEmail").value.trim();
    const password = loginModal.querySelector("#tgLoginPassword").value;
    if (!email || !password) {
      setStatus("Enter email and password.", true);
      return;
    }
    setStatus(mode === "signin" ? "Signing in…" : "Creating account…", false);
    try {
      // Check if Supabase client exists (loaded from CDN)
      if (!window.supabaseClient) {
        setStatus("Supabase not loaded. Please refresh the page.", true);
        return;
      }

      if (mode === "signin") {
        const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus("Signed in. Redirecting…", false);
        window.location.href = "/account";
      } else {
        const { error } = await window.supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        setStatus("Account created. Check email to confirm, then sign in.", false);
      }
    } catch (e) {
      setStatus(e.message || "Authentication failed.", true);
    }
  }

  // Attach event listener to "Log In / Sign Up" link after header loads
  window.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for header to be injected
    setTimeout(function() {
      const loginLink = document.getElementById('navLogin');
      if (loginLink) {
        loginLink.addEventListener('click', function(e) {
          e.preventDefault();
          openLoginModal();
        });
      }
    }, 100);
  });

  // Expose functions globally for manual use if needed
  window.openTangentLogin = openLoginModal;
  window.closeTangentLogin = closeLoginModal;
})();
