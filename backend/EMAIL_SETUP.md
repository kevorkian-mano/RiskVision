# Email Setup Guide for RiskVision

This guide explains how to configure email functionality to send welcome emails to new users.

## Prerequisites

1. A Gmail account (or other email service)
2. App password for your email account (for Gmail)

## Configuration Steps

### 1. Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Navigate to Security
   - Under "2-Step Verification", click "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

### 2. Environment Variables

Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
FRONTEND_URL=http://localhost:3000
```

### 3. Alternative Email Services

You can modify the email service to use other providers:

#### Outlook/Hotmail
```javascript
// In emailService.js, change the transporter configuration:
return nodemailer.createTransporter({
  service: 'outlook',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

#### Yahoo
```javascript
return nodemailer.createTransporter({
  service: 'yahoo',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

#### Custom SMTP Server
```javascript
return nodemailer.createTransporter({
  host: 'smtp.yourprovider.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Production Recommendations

For production environments, consider using dedicated email services:

### SendGrid
```javascript
return nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### AWS SES
```javascript
return nodemailer.createTransporter({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASSWORD
  }
});
```

## Testing Email Functionality

1. Start your backend server
2. Create a new user through the admin dashboard
3. Check the console logs for email sending status
4. Check the user's email inbox for the welcome message

## Troubleshooting

### Common Issues

1. **"Invalid login" error**:
   - Ensure you're using an app password, not your regular password
   - Verify 2-factor authentication is enabled

2. **"Less secure app access" error**:
   - Use app passwords instead of regular passwords
   - Enable 2-factor authentication

3. **Email not sending**:
   - Check console logs for error messages
   - Verify environment variables are set correctly
   - Test with a different email service

### Debug Mode

To enable detailed email logging, add this to your email service:

```javascript
const transporter = nodemailer.createTransporter({
  // ... your config
  debug: true, // Enable debug output
  logger: true // Log to console
});
```

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of regular passwords
- Consider using environment-specific email services for production
- Regularly rotate email credentials
- Monitor email sending logs for suspicious activity 