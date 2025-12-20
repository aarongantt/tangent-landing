/**
 * Supabase Database Webhook - New User Signup Notification
 *
 * Sends email notification when a new user signs up for TANGENT
 *
 * Setup in Supabase:
 * 1. Go to Database → Webhooks
 * 2. Create webhook for 'profiles' table (INSERT events)
 * 3. Set URL: https://www.tangentapp.co/api/webhook-new-user
 * 4. Add secret header: x-webhook-secret = YOUR_WEBHOOK_SECRET
 */

const ADMIN_EMAIL = 'aaron.gantt@gmail.com';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-here';

// Initialize Resend (for email notifications)
let resend = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret (security)
  const providedSecret = req.headers['x-webhook-secret'];
  if (providedSecret !== WEBHOOK_SECRET) {
    console.error('[webhook-new-user] Invalid webhook secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = req.body;

    // Extract new user data from Supabase webhook payload
    const newUser = payload.record; // The new 'profiles' row
    const { id, email, created_at, trial_granted, trial_started_at } = newUser;

    console.log('[webhook-new-user] New user signup:', email);

    // Send email notification via Resend
    const resendClient = getResend();
    if (resendClient) {
      try {
        await resendClient.emails.send({
          from: 'TANGENT Notifications <notifications@tangentapp.co>',
          to: ADMIN_EMAIL,
          subject: `🎉 New TANGENT Signup: ${email}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">🎉 New User Signup</h2>

              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0;"><strong>User ID:</strong> ${id}</p>
                <p style="margin: 8px 0;"><strong>Signed up:</strong> ${new Date(created_at).toLocaleString()}</p>
                <p style="margin: 8px 0;"><strong>Trial granted:</strong> ${trial_granted ? 'Yes' : 'Not yet'}</p>
                ${trial_started_at ? `<p style="margin: 8px 0;"><strong>Trial started:</strong> ${new Date(trial_started_at).toLocaleString()}</p>` : ''}
              </div>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                <p style="margin: 8px 0; font-size: 14px; color: #6B7280;">
                  <a href="https://supabase.com/dashboard/project/xnuqrfnfokxtuvhlgslc/editor/auth/users"
                     style="color: #4F46E5; text-decoration: none;">View in Supabase →</a>
                </p>
              </div>
            </div>
          `
        });

        console.log('[webhook-new-user] Notification email sent to:', ADMIN_EMAIL);
      } catch (emailError) {
        console.error('[webhook-new-user] Failed to send email:', emailError);
        // Don't fail the webhook if email fails
      }
    } else {
      console.warn('[webhook-new-user] Resend not configured, skipping email');
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      user_email: email
    });

  } catch (error) {
    console.error('[webhook-new-user] Error processing webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}