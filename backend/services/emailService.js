const nodemailer = require('nodemailer');

// Create transporter for sending emails
const createTransporter = () => {
  // For development/testing, you can use Gmail or other email services
  // For production, consider using services like SendGrid, AWS SES, etc.
  
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASSWORD // Your email password or app password
    }
  });
};

// Send welcome email to new user
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"RiskVision System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Welcome to RiskVision - Your Account Has Been Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">RiskVision</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px;">Financial Fraud Detection System</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${user.name}!</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Your account has been successfully created in the RiskVision system. You can now access the platform with your assigned role and permissions.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
              <h3 style="color: #1976d2; margin-top: 0;">Account Details:</h3>
              <p><strong>Name:</strong> ${user.name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
              <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #1976d2;">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a></p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Role Permissions:</h3>
              ${getRoleDescription(user.role)}
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              <strong>Important:</strong> Please contact your system administrator to get your initial password or to set up password reset if needed.
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions or need assistance, please contact your system administrator.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px;">
                This is an automated message from the RiskVision system.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Get role description for email
const getRoleDescription = (role) => {
  const roleDescriptions = {
    admin: `
      <ul style="margin: 0; padding-left: 20px;">
        <li>Full system access and administration</li>
        <li>User management and role assignment</li>
        <li>System configuration and monitoring</li>
        <li>Risk rule creation and management</li>
      </ul>
    `,
    compliance: `
      <ul style="margin: 0; padding-left: 20px;">
        <li>Monitor transactions and risk scores</li>
        <li>Create fraud cases from suspicious transactions</li>
        <li>Assign cases to investigators</li>
        <li>Review and close cases</li>
      </ul>
    `,
    investigator: `
      <ul style="margin: 0; padding-left: 20px;">
        <li>Handle assigned fraud cases</li>
        <li>Make investigation decisions</li>
        <li>Add comments and evidence</li>
        <li>Update case status and close cases</li>
      </ul>
    `,
    auditor: `
      <ul style="margin: 0; padding-left: 20px;">
        <li>View system audit logs</li>
        <li>Monitor user activities</li>
        <li>Generate compliance reports</li>
        <li>Review system security</li>
      </ul>
    `
  };
  
  return roleDescriptions[role] || '<p>Standard user access</p>';
};

// Send password reset email (for future use)
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'RiskVision - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">RiskVision</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello, ${user.name}!</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              You have requested to reset your password for your RiskVision account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" 
                 style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this password reset, please ignore this email or contact your system administrator.
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              This link will expire in 1 hour for security reasons.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px;">
                This is an automated message from the RiskVision system.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send custom email to user from admin
const sendCustomEmail = async (user, subject, message, adminName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"RiskVision Announcements" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `RiskVision - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">RiskVision</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px;">Administrative Message</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello, ${user.name}!</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
              <h3 style="color: #1976d2; margin-top: 0;">Message from ${adminName}:</h3>
              <div style="white-space: pre-wrap; color: #555; line-height: 1.6;">
                ${message}
              </div>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions or need assistance, please contact your system administrator.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #888; font-size: 14px;">
                This message was sent by an administrator from the RiskVision system.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Custom email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Error sending custom email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendCustomEmail
}; 