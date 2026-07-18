const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends HIGH RISK alert email to user
 * @param {string} toEmail - User's email address
 * @param {string} username - User's username
 * @param {string} reason - Why they're high risk
 */
async function sendHighRiskEmail(toEmail, username, reason) {
  console.log(`📧 Sending HIGH RISK email to: ${toEmail}`);
  
  try {
    const msg = {
      to: toEmail,
      from: process.env.FROM_EMAIL,
      subject: `🚨 URGENT: High Security Risk Detected for ${username}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
            .header { background: #dc3545; color: white; padding: 15px; border-radius: 5px; text-align: center; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
            .button { 
              display: inline-block; 
              padding: 12px 25px; 
              background: #dc3545; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              font-weight: bold;
            }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🚨 Security Alert</h2>
            </div>
            
            <h3>Dear ${username},</h3>
            
            <div class="warning">
              <strong>⚠️ HIGH RISK DETECTED</strong>
              <p style="margin-top: 10px;"><strong>Reason:</strong> ${reason}</p>
            </div>
            
            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Please log in to the dashboard immediately</li>
              <li>Click the <strong>"Mark as Fixed"</strong> button</li>
              <li>Our system will send you a confirmation email</li>
            </ul>
            
            <p style="text-align: center; margin: 20px 0;">
              <a href="#" class="button">Go to Dashboard</a>
            </p>
            
            <div class="footer">
              <p>This is an automated security alert from CloudRisk AI.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);
    console.log(`✅ HIGH RISK email sent to ${toEmail}`);
    return { success: true, message: 'High risk email sent' };
    
  } catch (error) {
    console.log('❌ Failed to send high risk email:', error.message);
    // Don't fail the whole request just because email failed
    return { success: false, message: 'Email failed' };
  }
}

/**
 * Sends THANK YOU email after user fixes the issue
 * @param {string} toEmail - User's email address
 * @param {string} username - User's username
 */
async function sendThankYouEmail(toEmail, username) {
  console.log(`📧 Sending THANK YOU email to: ${toEmail}`);
  
  try {
    const msg = {
      to: toEmail,
      from: process.env.FROM_EMAIL,
      subject: `✅ Thank You! Your Account is Now Secure, ${username}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
            .header { background: #28a745; color: white; padding: 15px; border-radius: 5px; text-align: center; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Security Resolved</h2>
            </div>
            
            <h3>Dear ${username},</h3>
            
            <div class="success">
              <strong>🎉 Thank you for resolving the security issue!</strong>
              <p style="margin-top: 10px;">Your account is now secure. Risk level has been downgraded to <strong>LOW</strong>.</p>
            </div>
            
            <p><strong>What was done:</strong></p>
            <ul>
              <li>Security issue has been marked as resolved</li>
              <li>Risk level updated to LOW in our system</li>
              <li>Your account is now secure</li>
            </ul>
            
            <div class="footer">
              <p>Thank you for keeping your account secure!</p>
              <p style="margin-top: 10px; font-size: 11px;">CloudRisk AI Security Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sgMail.send(msg);
    console.log(`✅ THANK YOU email sent to ${toEmail}`);
    return { success: true, message: 'Thank you email sent' };
    
  } catch (error) {
    console.log('❌ Failed to send thank you email:', error.message);
    return { success: false, message: 'Email failed' };
  }
}

module.exports = { sendHighRiskEmail, sendThankYouEmail };