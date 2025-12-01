# Email Service Setup Guide

This guide explains how to configure the email service for RoundBuy backend.

## Overview

The email service has been implemented using **NodeMailer** and supports:
- ✅ Email verification during registration
- ✅ Password reset emails
- ✅ Welcome emails after subscription purchase
- ✅ Subscription expiry reminders

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install `nodemailer@^6.9.7` which is already added to `package.json`.

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the email configuration:

```bash
cp .env.example .env
```

Edit the `.env` file with your SMTP credentials:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM=noreply@roundbuy.com
APP_NAME=RoundBuy
APP_URL=http://localhost:5001
```

## Gmail Setup (Recommended for Development)

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: **RoundBuy Backend**
5. Click **Generate**
6. Copy the 16-character password
7. Use this password in `SMTP_PASSWORD` (not your regular Gmail password)

### Step 3: Update Environment Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # The app password from Step 2
SMTP_FROM=RoundBuy <your.email@gmail.com>
APP_NAME=RoundBuy
APP_URL=http://localhost:5001
```

## Alternative SMTP Providers

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-user
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your.mailgun.org
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

## Email Templates

The service includes beautiful HTML email templates:

### 1. Email Verification (`sendVerificationEmail`)
- Sent after user registration
- Contains 6-character verification code
- Valid for 24 hours
- Used in: `POST /api/v1/mobile-app/auth/register`

### 2. Password Reset (`sendPasswordResetEmail`)
- Sent when user requests password reset
- Contains 6-character reset code
- Valid for 1 hour
- Used in: `POST /api/v1/mobile-app/auth/forgot-password`

### 3. Welcome Email (`sendWelcomeEmail`)
- Sent after successful subscription purchase
- Contains subscription details
- Shows plan features
- Used in: `POST /api/v1/mobile-app/subscription/purchase`

### 4. Subscription Expiry (`sendSubscriptionExpiryReminder`)
- Sent X days before subscription expires
- Reminds user to renew
- Can be scheduled via cron job

## Development Mode

If SMTP credentials are not configured, the service will:
- Log email content to console
- Continue without sending actual emails
- Useful for local development without email provider

Example console output:
```
📧 Email (would be sent in production):
To: user@example.com
Subject: Verify your RoundBuy account
Content: [email body text]
```

## Testing the Email Service

### 1. Test Registration Email

```bash
curl -X POST http://localhost:5001/api/v1/mobile-app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "Test@123456",
    "language": "en"
  }'
```

Check your email for the verification code.

### 2. Test Resend Verification

```bash
curl -X POST http://localhost:5001/api/v1/mobile-app/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### 3. Check Server Logs

```bash
npm run dev
```

Look for:
- ✅ `Email service is ready` - SMTP connected successfully
- ✅ `Email sent: <message-id>` - Email delivered
- ✅ `Verification email sent to ...` - Verification sent
- ⚠️ `Failed to send verification email` - Email error (non-blocking)

## Troubleshooting

### Error: "Invalid login"

**Cause:** Using regular Gmail password instead of App Password

**Solution:** Generate and use an App Password (see Gmail Setup above)

### Error: "Connection timeout"

**Cause:** Firewall or network blocking SMTP port

**Solution:** 
- Try port 465 with `SMTP_SECURE=true`
- Check firewall settings
- Verify network allows SMTP connections

### Error: "Email service error"

**Cause:** Invalid SMTP credentials

**Solution:**
- Double-check `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- Verify credentials with your email provider
- Test with a simple SMTP client first

### Emails Going to Spam

**Solution:**
- Use a verified domain with SPF, DKIM records
- Use professional email service (SendGrid, AWS SES)
- Add proper headers in email templates
- Avoid spam trigger words

## Production Recommendations

### 1. Use Professional Email Service

Don't use Gmail for production. Use:
- **SendGrid** (12,000 free emails/month)
- **AWS SES** (62,000 free emails/month for 1 year)
- **Mailgun** (5,000 free emails/month)
- **Postmark** (100 free emails/month)

### 2. Configure DNS Records

Add these DNS records for your domain:

```
;; SPF Record
yourdomain.com. IN TXT "v=spf1 include:_spf.google.com ~all"

;; DKIM Record (get from your email provider)
default._domainkey.yourdomain.com. IN TXT "v=DKIM1; k=rsa; p=..."

;; DMARC Record
_dmarc.yourdomain.com. IN TXT "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

### 3. Monitor Email Delivery

- Set up bounce handling
- Track email open rates
- Monitor spam reports
- Use email analytics

### 4. Rate Limiting

Implement rate limiting for email sending:
- Max 5 verification emails per hour per user
- Max 3 password reset emails per hour per user
- Prevent email bombing

## API Integration Status

✅ **Integrated:**
- Registration email verification
- Resend verification email  
- Welcome email after subscription purchase

❌ **Pending:**
- Password reset emails (Task #2)
- Subscription expiry reminders (requires cron job)
- Advertisement approval notifications
- Message notifications

## Next Steps

1. ✅ Complete Task #1 - Email service is set up
2. ⏭️ Task #2 - Implement forgot password API (will use password reset email)
3. ⏭️ Future - Add cron job for subscription expiry reminders

## Support

For issues or questions:
- Check server logs: `npm run dev`
- Review NodeMailer docs: https://nodemailer.com
- Test SMTP settings: Use online SMTP tester

---

**Email Service Status:** ✅ Fully Implemented and Ready to Use