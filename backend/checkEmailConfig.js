require('dotenv').config();

console.log('🔍 Checking Email Configuration...\n');

// Check required environment variables
const requiredVars = [
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'MONGO_URI',
  'JWT_SECRET',
  'PORT'
];

console.log('📋 Environment Variables Check:');
console.log('================================');

let missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('PASSWORD') ? '***SET***' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    missingVars.push(varName);
  }
});

console.log('\n📧 Email Configuration Status:');
console.log('==============================');

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  console.log('✅ Email credentials are configured');
  console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
  console.log(`🔑 Email Password: ${process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET'}`);
  
  // Test email service
  console.log('\n🧪 Testing Email Service...');
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email service test failed:');
      console.log('   Error:', error.message);
      console.log('\n💡 Common Solutions:');
      console.log('   1. Make sure 2-Factor Authentication is enabled on your Gmail account');
      console.log('   2. Generate an App Password (not your regular password)');
      console.log('   3. Use the 16-character app password in EMAIL_PASSWORD');
      console.log('   4. Check that EMAIL_USER is your full Gmail address');
    } else {
      console.log('✅ Email service is working correctly!');
      console.log('   Server is ready to send emails');
    }
  });
  
} else {
  console.log('❌ Email configuration is incomplete');
  console.log('\n💡 To fix this, add to your .env file:');
  console.log('   EMAIL_USER=your_email@gmail.com');
  console.log('   EMAIL_PASSWORD=your_app_password');
  console.log('\n📖 For Gmail setup:');
  console.log('   1. Enable 2-Factor Authentication on your Gmail account');
  console.log('   2. Go to Google Account settings → Security → App passwords');
  console.log('   3. Generate a new app password for "Mail"');
  console.log('   4. Use that 16-character password as EMAIL_PASSWORD');
}

if (missingVars.length > 0) {
  console.log('\n⚠️  Missing Environment Variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n📝 Example .env file:');
  console.log('====================');
  console.log('MONGO_URI=mongodb://localhost:27017/riskvision');
  console.log('JWT_SECRET=your_jwt_secret');
  console.log('PORT=5000');
  console.log('EMAIL_USER=your_email@gmail.com');
  console.log('EMAIL_PASSWORD=your_app_password');
  console.log('FRONTEND_URL=http://localhost:3000');
  console.log('NODE_ENV=development');
} 