// Account page initialization script
// This runs AFTER auth-nav.js loads the header and handles auth state
// It then calls renderPlan() to show the user's subscription info

// Wait for auth-nav.js to finish loading header and auth state
// (auth-nav.js sets window.supabaseClient)

// Poll for supabaseClient to be ready
const checkReady = setInterval(() => {
  if (window.supabaseClient) {
    clearInterval(checkReady);
    // Auth is ready, now render the plan
    if (typeof renderPlan === 'function') {
      renderPlan();
    }

    // Check if we should auto-open payment modal (from extension)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'true') {
      const priceId = urlParams.get('priceId');
      const planName = urlParams.get('planName');
      const planPrice = urlParams.get('planPrice');
      const checkoutKind = urlParams.get('kind') || 'subscription';

      if (priceId && planName && planPrice && typeof openPaymentModal === 'function') {
        // Wait a bit for page to fully render, then open modal
        setTimeout(() => {
          openPaymentModal(priceId, planName, planPrice, checkoutKind);
        }, 500);
      }
    }
  }
}, 50); // Check every 50ms

// Timeout after 5 seconds
setTimeout(() => {
  clearInterval(checkReady);
  if (!window.supabaseClient) {
    console.error('[ACCOUNT] Supabase client not ready after 5 seconds');
  }
}, 5000);
