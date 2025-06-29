require('dotenv').config();
const { sendWelcomeEmail } = require('../services/emailService');

// Test user data
const testUser = {
  name: 'Test User',
  email: process.env.TEST_EMAIL || 'test@example.com',
  role: 'investigator'
};

async function testEmail() {
  console.log('Testing email functionality...');
  console.log('Email configuration:');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
  console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');
  console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email configuration missing! Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
    console.log('\nSee EMAIL_SETUP.md for configuration instructions');
    return;
  }
  
  try {
    console.log('\nSending test welcome email...');
    const result = await sendWelcomeEmail(testUser);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Check the inbox of:', testUser.email);
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }
  } catch (error) {
    console.error('❌ Error during email test:', error.message);
  }
}

// Run the test
testEmail().then(() => {
  console.log('\nTest completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
}); 