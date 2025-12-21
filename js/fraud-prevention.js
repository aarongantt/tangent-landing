/**
 * Tangent Fraud Prevention - Frontend Integration
 * Handles device fingerprinting, CAPTCHA, and signup validation
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_BASE_URL: 'https://tangent-backend.vercel.app', // ✅ Your Vercel backend URL
    FINGERPRINT_ENABLED: true,
    CAPTCHA_ENABLED: true,
    CAPTCHA_SITE_KEY: '0x4AAAAAACH4XH54xTTzYasF', // ✅ Production Cloudflare Turnstile key
    PHONE_VERIFICATION_ENABLED: false // Set to true if you want to require phone verification for signups
  };

  // Global state
  let deviceFingerprint = null;
  let captchaToken = null;
  let fingerprintJS = null;

  /**
   * Initialize FingerprintJS for device identification
   */
  async function initializeFingerprinting() {
    if (!CONFIG.FINGERPRINT_ENABLED) {
      console.log('[Fraud Prevention] Device fingerprinting disabled');
      return null;
    }

    try {
      // Load FingerprintJS Pro (free tier: 200 API calls/month)
      // Alternative: Use open-source FingerprintJS for unlimited usage
      const fpPromise = import('https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js')
        .then(FingerprintJS => FingerprintJS.load());

      const fp = await fpPromise;
      const result = await fp.get();

      deviceFingerprint = result.visitorId;
      console.log('[Fraud Prevention] Device fingerprint generated:', deviceFingerprint);

      return deviceFingerprint;
    } catch (err) {
      console.error('[Fraud Prevention] Error generating device fingerprint:', err);
      // Continue without fingerprint (graceful degradation)
      return null;
    }
  }

  /**
   * Initialize Cloudflare Turnstile CAPTCHA
   */
  let captchaInitialized = false;
  let captchaWidgetId = null;

  function initializeCaptcha(containerId) {
    if (!CONFIG.CAPTCHA_ENABLED) {
      console.log('[Fraud Prevention] CAPTCHA disabled');
      return Promise.resolve(null);
    }

    // Prevent duplicate initialization
    if (captchaInitialized) {
      console.log('[Fraud Prevention] CAPTCHA already initialized');
      return Promise.resolve(captchaToken);
    }

    return new Promise((resolve, reject) => {
      // Load Turnstile script
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('[Fraud Prevention] Turnstile CAPTCHA loaded');

        // Render CAPTCHA widget (invisible mode)
        const container = document.getElementById(containerId);
        if (window.turnstile && container) {
          try {
            // Clear any existing widgets
            container.innerHTML = '';

            captchaWidgetId = window.turnstile.render('#' + containerId, {
              sitekey: CONFIG.CAPTCHA_SITE_KEY,
              theme: 'dark',
              size: 'invisible', // Make it invisible - only shows for suspicious users
              callback: function(token) {
                captchaToken = token;
                console.log('[Fraud Prevention] CAPTCHA completed (invisible)');
                resolve(token);
              },
              'error-callback': function() {
                console.error('[Fraud Prevention] CAPTCHA error');
                reject(new Error('CAPTCHA verification failed'));
              },
              'expired-callback': function() {
                console.warn('[Fraud Prevention] CAPTCHA expired');
                captchaToken = null;
              }
            });

            captchaInitialized = true;
          } catch (err) {
            console.error('[Fraud Prevention] Error rendering CAPTCHA:', err);
            resolve(null); // Graceful degradation
          }
        }
      };

      script.onerror = () => {
        console.error('[Fraud Prevention] Failed to load CAPTCHA script');
        resolve(null); // Graceful degradation
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Validate signup with backend fraud detection before creating account
   */
  async function validateSignup(email) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/validate-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          deviceFingerprint: deviceFingerprint,
          captchaPassed: !!captchaToken
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup validation failed');
      }

      if (!result.allowed) {
        throw new Error(result.error || 'Signup blocked due to suspicious activity');
      }

      console.log('[Fraud Prevention] Signup validated successfully', result);
      return result;
    } catch (err) {
      console.error('[Fraud Prevention] Signup validation error:', err);
      throw err;
    }
  }

  /**
   * Request phone verification code
   */
  async function requestPhoneVerification(phoneNumber, authToken) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/phone-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          action: 'create',
          phoneNumber: phoneNumber
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send verification code');
      }

      console.log('[Fraud Prevention] Phone verification code sent');
      return result;
    } catch (err) {
      console.error('[Fraud Prevention] Phone verification request error:', err);
      throw err;
    }
  }

  /**
   * Verify phone verification code
   */
  async function verifyPhoneCode(phoneNumber, code, authToken) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/phone-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          action: 'verify',
          phoneNumber: phoneNumber,
          code: code
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      console.log('[Fraud Prevention] Phone verified successfully');
      return result;
    } catch (err) {
      console.error('[Fraud Prevention] Phone verification error:', err);
      throw err;
    }
  }

  /**
   * Enhanced signup flow with fraud prevention
   */
  async function enhancedSignup(email, password, supabaseClient) {
    console.log('[Fraud Prevention] Starting enhanced signup for:', email);

    // Step 1: Validate with fraud detection API
    const validation = await validateSignup(email);

    // Step 2: Create Supabase auth account
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      throw error;
    }

    console.log('[Fraud Prevention] Supabase account created successfully');

    // Step 3: Phone verification (if enabled and user is signed in)
    if (CONFIG.PHONE_VERIFICATION_ENABLED && data.session) {
      console.log('[Fraud Prevention] Phone verification required');
      return {
        success: true,
        requiresPhoneVerification: true,
        userData: data
      };
    }

    return {
      success: true,
      requiresPhoneVerification: false,
      userData: data
    };
  }

  /**
   * Refresh CAPTCHA widget (e.g., when modal is reopened)
   */
  function refreshCaptcha(containerId) {
    if (!CONFIG.CAPTCHA_ENABLED) return;
    if (captchaInitialized) return; // Don't re-render if already initialized

    // Remove existing CAPTCHA widget
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Re-render CAPTCHA (invisible mode)
    if (window.turnstile) {
      try {
        captchaWidgetId = window.turnstile.render('#' + containerId, {
          sitekey: CONFIG.CAPTCHA_SITE_KEY,
          theme: 'dark',
          size: 'invisible',
          callback: function(token) {
            captchaToken = token;
            console.log('[Fraud Prevention] CAPTCHA refreshed and completed (invisible)');
          },
          'error-callback': function() {
            console.error('[Fraud Prevention] CAPTCHA error');
          },
          'expired-callback': function() {
            console.warn('[Fraud Prevention] CAPTCHA expired');
            captchaToken = null;
          }
        });
        captchaInitialized = true;
      } catch (err) {
        console.error('[Fraud Prevention] Error refreshing CAPTCHA:', err);
      }
    }
  }

  // Expose public API
  window.TangentFraudPrevention = {
    config: CONFIG,
    initialize: async function() {
      console.log('[Fraud Prevention] Initializing...');
      await initializeFingerprinting();
      return true;
    },
    initializeCaptcha: initializeCaptcha,
    refreshCaptcha: refreshCaptcha,
    validateSignup: validateSignup,
    enhancedSignup: enhancedSignup,
    requestPhoneVerification: requestPhoneVerification,
    sendPhoneVerification: requestPhoneVerification, // Alias for consistency
    verifyPhoneCode: verifyPhoneCode,
    getDeviceFingerprint: function() { return deviceFingerprint; },
    getCaptchaToken: function() { return captchaToken; }
  };

  console.log('[Fraud Prevention] Module loaded');
})();
