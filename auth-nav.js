// Unified auth-aware navigation script for ALL pages
// This handles loading header, checking auth state, and showing correct nav buttons

(async function() {
  const SUPABASE_URL = "https://xnuqrfnfokxtuvhlgslc.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudXFyZm5mb2t4dHV2aGxnc2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNDcwODAsImV4cCI6MjA3ODYyMzA4MH0.AAmo_H2aXdeEzYVFDLXlvER9O0y5teRwkEVnbcsO0bg";

  // Initialize Supabase client
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true }
  });

  // Expose globally for other scripts (auth-modal.js, etc.)
  window.supabaseClient = supabase;

  // Load header HTML
  try {
    const response = await fetch('/header.html');
    const html = await response.text();
    const placeholder = document.getElementById('header-placeholder');
    if (placeholder) {
      placeholder.innerHTML = html;
    }
  } catch (error) {
    console.error('Failed to load header:', error);
  }

  // Check auth state
  const {data, error} = await supabase.auth.getSession();
  const loggedIn = !error && data?.session;

  // Helper to show/hide elements
  function toggle(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? '' : 'none';
  }

  // Desktop nav elements
  const navSignOut = document.getElementById('navSignOut');
  const navLogin = document.getElementById('navLogin');
  const navSubscribe = document.getElementById('navSubscribe');
  const navAccount = document.getElementById('navAccount');

  // Show correct nav buttons based on auth state
  if (loggedIn) {
    // LOGGED IN: Show Sign Out + Account, hide Log In + Subscribe
    toggle('navSignOut', true);
    toggle('navAccount', true);
    toggle('navLogin', false);
    toggle('navSubscribe', false);

    // Attach sign out handler
    if (navSignOut) {
      navSignOut.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = '/';
      });
    }
  } else {
    // LOGGED OUT: Show Log In + Subscribe, hide Sign Out + Account
    toggle('navSignOut', false);
    toggle('navAccount', false);
    toggle('navLogin', true);
    toggle('navSubscribe', true);

    // Wire up Log In button to auth modal (if modal script is loaded)
    if (navLogin && typeof window.openTangentLogin === 'function') {
      navLogin.addEventListener('click', (e) => {
        e.preventDefault();
        window.openTangentLogin();
      });
    }
  }

  // OPTIONAL: Mobile nav elements (for index.html and demo.html)
  const mobileNavSubscribe = document.getElementById('mobileNavSubscribe');
  const mobileNavLogin = document.getElementById('mobileNavLogin');
  const mobileNavSignOut = document.getElementById('mobileNavSignOut');
  const mobileNavAccount = document.getElementById('mobileNavAccount');

  if (mobileNavSubscribe || mobileNavLogin) {
    // Mobile nav exists on this page
    if (loggedIn) {
      toggle('mobileNavSubscribe', false);
      toggle('mobileNavLogin', false);
      toggle('mobileNavSignOut', true);
      toggle('mobileNavAccount', true);

      if (mobileNavSignOut) {
        mobileNavSignOut.addEventListener('click', async (e) => {
          e.preventDefault();
          await supabase.auth.signOut();
          window.location.href = '/';
        });
      }
    } else {
      toggle('mobileNavSubscribe', true);
      toggle('mobileNavLogin', true);
      toggle('mobileNavSignOut', false);
      toggle('mobileNavAccount', false);

      if (mobileNavLogin && typeof window.openTangentLogin === 'function') {
        mobileNavLogin.addEventListener('click', (e) => {
          e.preventDefault();
          window.openTangentLogin();
        });
      }
    }
  }

  // OPTIONAL: Hero CTA elements (for index.html and demo.html)
  const heroCtas = document.getElementById('heroCtas');
  const heroStartTrial = document.getElementById('heroStartTrial');
  const heroSignUp = document.getElementById('heroSignUp');

  if (heroCtas) {
    // Hero CTAs exist on this page
    if (loggedIn) {
      heroCtas.style.display = 'none';
    } else {
      heroCtas.style.display = 'flex';

      if (heroStartTrial && typeof window.openTangentLogin === 'function') {
        heroStartTrial.addEventListener('click', (e) => {
          e.preventDefault();
          window.openTangentLogin();
        });
      }

      if (heroSignUp && typeof window.openTangentLogin === 'function') {
        heroSignUp.addEventListener('click', (e) => {
          e.preventDefault();
          window.openTangentLogin();
        });
      }
    }
  }

  // Make nav visible (remove guard class)
  const nav = document.getElementById('navRoot');
  if (nav) {
    nav.classList.remove('nav-guard');
    nav.style.opacity = '1';
    nav.style.visibility = 'visible';
  }
})();
