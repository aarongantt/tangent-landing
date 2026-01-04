# Phone Verification Test Plan

## ✅ What We Built

1. **Backend API** (`/api/phone-verify`) - Twilio Verify integration
2. **SQL Schema** - Phone verification tracking tables
3. **Frontend Modal** - Phone verification UI in signup flow
4. **Integration** - Auto-triggers after email/password signup

## 🧪 Test Steps

### Test 1: New User Signup with Phone Verification

1. **Go to**: https://www.tangentapp.co/signup
2. **Click**: "Start Free Trial" button
3. **Enter**: New email + password (use a real email you haven't used before)
4. **Click**: "Sign Up"
5. **Expected**: Phone verification modal appears
6. **Enter**: Your phone number (e.g., +1 704 322 6889)
7. **Click**: "Send Verification Code"
8. **Expected**: SMS received with 6-digit code
9. **Enter**: Code from SMS
10. **Click**: "Verify Phone"
11. **Expected**: "Phone verified! Redirecting..." → Account page

### Test 2: Phone Already Used (Anti-Abuse Check)

1. **Create**: Second account with different email
2. **Try**: Same phone number as Test 1
3. **Expected**: Error message "This phone number has already been used for a free trial"

### Test 3: Invalid Code

1. **Start**: New signup flow
2. **Send**: Verification code
3. **Enter**: Wrong code (e.g., 999999)
4. **Expected**: "Invalid code. Please try again."

### Test 4: Resend Code

1. **Start**: New signup flow
2. **Send**: First code
3. **Wait**: Don't enter code
4. **Click**: "Resend Code" button
5. **Expected**: New SMS sent, first code invalidated

### Test 5: Rate Limiting

1. **Try**: Sending codes 4+ times in a row
2. **Expected**: "Too many attempts. Please try again later."

## 🔍 Verification Checklist

- [ ] Modal appears after signup
- [ ] Phone number normalized correctly (+1 auto-added)
- [ ] SMS received via Twilio Verify
- [ ] Code verification works
- [ ] Phone uniqueness enforced
- [ ] Invalid code rejected
- [ ] Resend code works
- [ ] Rate limiting prevents spam
- [ ] Success redirects to /account
- [ ] User's phone_verified = true in database

## 📊 Database Verification

After successful verification, check Supabase:

```sql
-- Check user profile
SELECT id, email, phone_verified, phone_number 
FROM profiles 
WHERE email = 'YOUR_TEST_EMAIL';

-- Check verification records
SELECT * FROM phone_verifications 
WHERE phone_number = '+17043226889' 
ORDER BY created_at DESC;
```

## 🐛 Known Issues

- None yet! Test and report any bugs.

## 📝 Notes

- Twilio Verify Service SID: `VA167e6c7deae6ca461f49f8ebbb85ccb2`
- Backend deployed: ✅
- Frontend deployed: ✅ (auto-deploys via GitHub)
- SQL migration: ✅ (already run)

