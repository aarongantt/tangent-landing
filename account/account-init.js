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
    console.log('[ACCOUNT] URL params:', window.location.search);
    console.log('[ACCOUNT] checkout param:', urlParams.get('checkout'));

    if (urlParams.get('checkout') === 'true') {
      const priceId = urlParams.get('priceId');
      const planName = decodeURIComponent(urlParams.get('planName') || '');
      const planPrice = decodeURIComponent(urlParams.get('planPrice') || '');
      const checkoutKind = urlParams.get('kind') || 'subscription';

      console.log('[ACCOUNT] Auto-checkout detected:', { priceId, planName, planPrice, checkoutKind });

      if (priceId && planName && planPrice) {
        // Wait for page to fully render and openPaymentModal to be defined
        let attemptCount = 0;
        const maxAttempts = 3;

        const openModal = () => {
          attemptCount++;
          console.log(`[ACCOUNT] Attempt ${attemptCount}/${maxAttempts} to open modal`);

          if (typeof window.openPaymentModal === 'function') {
            console.log('[ACCOUNT] Opening payment modal...');
            window.openPaymentModal(priceId, planName, planPrice, checkoutKind);
          } else if (attemptCount < maxAttempts) {
            console.log('[ACCOUNT] window.openPaymentModal not ready, will retry...');
            setTimeout(openModal, 500); // Try again in 500ms
          } else {
            console.error('[ACCOUNT] window.openPaymentModal function not found after 3 attempts');
          }
        };

        // Start first attempt after 500ms
        setTimeout(openModal, 500);
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
