const nodemailer = require('nodemailer');

/**
 * Email Service for RoundBuy
 * Handles all email sending functionality
 */

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
  if (transporter) return transporter;

  // Get email configuration from environment variables
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };

  // For development, use a test account if no credentials provided
  if (!emailConfig.auth.user && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  No SMTP credentials provided. Emails will be logged to console only.');
    return null;
  }

  transporter = nodemailer.createTransport(emailConfig);

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service error:', error);
    } else {
      console.log('✅ Email service is ready');
    }
  });

  return transporter;
};

/**
 * Send email verification code
 * @param {string} email - User's email address
 * @param {string} fullName - User's full name
 * @param {string} verificationToken - Verification token
 */
const sendVerificationEmail = async (email, fullName, verificationToken) => {
  const appName = process.env.APP_NAME || 'RoundBuy';
  const appUrl = process.env.APP_URL || 'https://roundbuy.com';

  const mailOptions = {
    from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: `Verify your ${appName} account`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .verification-code { background-color: #fff; border: 2px solid #4CAF50; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${fullName}!</h2>
            <p>Thank you for registering with ${appName}. To complete your registration, please verify your email address.</p>
            
            <p><strong>Your verification code is:</strong></p>
            <div class="verification-code">${verificationToken.substring(0, 6).toUpperCase()}</div>
            
            <p>This code will expire in 24 hours.</p>
            
            <p>If you didn't create an account with ${appName}, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to ${appName}, ${fullName}!
      
      Your verification code is: ${verificationToken.substring(0, 6).toUpperCase()}
      
      This code will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
    `
  };

  return sendEmail(mailOptions);
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} fullName - User's full name
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (email, fullName, resetToken) => {
  const appName = process.env.APP_NAME || 'RoundBuy';
  const appUrl = process.env.APP_URL || 'https://roundbuy.com';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: `Reset your ${appName} password`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .reset-code { background-color: #fff; border: 2px solid #FF9800; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}</h2>
            <p>We received a request to reset your ${appName} password.</p>
            
            <p><strong>Your password reset code is:</strong></p>
            <div class="reset-code">${resetToken.substring(0, 6).toUpperCase()}</div>
            
            <p>This code will expire in 1 hour.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${fullName},
      
      We received a request to reset your ${appName} password.
      
      Your password reset code is: ${resetToken.substring(0, 6).toUpperCase()}
      
      This code will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
    `
  };

  return sendEmail(mailOptions);
};

/**
 * Send welcome email after successful subscription purchase
 * @param {string} email - User's email address
 * @param {string} fullName - User's full name
 * @param {object} subscriptionDetails - Subscription plan details
 */
const sendWelcomeEmail = async (email, fullName, subscriptionDetails) => {
  const appName = process.env.APP_NAME || 'RoundBuy';
  const { planName, startDate, endDate, amountPaid, currency } = subscriptionDetails;

  const mailOptions = {
    from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: `Welcome to ${appName}! Your subscription is active`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .info-box { background-color: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${appName}!</h1>
          </div>
          <div class="content">
            <h2>Congratulations, ${fullName}!</h2>
            <p>Your subscription is now active. You can now enjoy all the benefits of your <strong>${planName}</strong> membership.</p>
            
            <div class="info-box">
              <h3>Subscription Details</h3>
              <div class="info-row">
                <strong>Plan:</strong>
                <span>${planName}</span>
              </div>
              <div class="info-row">
                <strong>Start Date:</strong>
                <span>${new Date(startDate).toLocaleDateString()}</span>
              </div>
              <div class="info-row">
                <strong>Valid Until:</strong>
                <span>${new Date(endDate).toLocaleDateString()}</span>
              </div>
              <div class="info-row">
                <strong>Amount Paid:</strong>
                <span>${currency} ${amountPaid}</span>
              </div>
            </div>
            
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Browse and search for products around you</li>
              <li>Create your own advertisements</li>
              <li>Connect with buyers and sellers</li>
              <li>Enjoy premium features</li>
            </ul>
            
            <p>Thank you for choosing ${appName}!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to ${appName}, ${fullName}!
      
      Your ${planName} subscription is now active.
      
      Subscription Details:
      - Plan: ${planName}
      - Start Date: ${new Date(startDate).toLocaleDateString()}
      - Valid Until: ${new Date(endDate).toLocaleDateString()}
      - Amount Paid: ${currency} ${amountPaid}
      
      Start exploring and enjoy your premium features!
    `
  };

  return sendEmail(mailOptions);
};

/**
 * Send subscription expiry reminder
 * @param {string} email - User's email address
 * @param {string} fullName - User's full name
 * @param {Date} expiryDate - Subscription expiry date
 */
const sendSubscriptionExpiryReminder = async (email, fullName, expiryDate) => {
  const appName = process.env.APP_NAME || 'RoundBuy';
  const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

  const mailOptions = {
    from: `"${appName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: `Your ${appName} subscription expires soon`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Expiring Soon</h1>
          </div>
          <div class="content">
            <h2>Hello, ${fullName}</h2>
            <p>Your ${appName} subscription will expire in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
            <p>Expiry Date: <strong>${new Date(expiryDate).toLocaleDateString()}</strong></p>
            
            <p>To continue enjoying all premium features, please renew your subscription before it expires.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${fullName},
      
      Your ${appName} subscription will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.
      Expiry Date: ${new Date(expiryDate).toLocaleDateString()}
      
      Please renew your subscription to continue enjoying premium features.
    `
  };

  return sendEmail(mailOptions);
};

/**
 * Generic email sender
 * @param {object} mailOptions - Nodemailer mail options
 */
const sendEmail = async (mailOptions) => {
  try {
    const emailTransporter = initializeTransporter();

    // If no transporter (development mode without credentials), just log
    if (!emailTransporter) {
      console.log('📧 Email (would be sent in production):');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Content:', mailOptions.text);
      return { success: true, dev: true };
    }

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSubscriptionExpiryReminder,
  sendEmail
};