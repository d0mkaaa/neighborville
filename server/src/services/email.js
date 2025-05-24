import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

export const generateVerificationCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated verification code: ${code}`);
  return code;
};

export const sendVerificationEmail = async (email, code, username) => {
  const displayName = username || email.split('@')[0];
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NeighborVille Verification</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="min-height: 100vh; padding: 40px 20px; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; max-width: 600px; width: 100%; border-radius: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); overflow: hidden;">
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <div style="font-size: 36px;">🏘️</div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">NeighborVille</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; font-weight: 300;">Welcome to your new neighborhood!</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 28px; font-weight: 600;">Verification Required</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello <strong style="color: #10b981;">${displayName}</strong>! We're excited to have you join our community.</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px dashed #10b981; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0; position: relative; overflow: hidden;">
              <p style="color: #374151; margin: 0 0 15px; font-size: 16px; font-weight: 500;">Your verification code is:</p>
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 0 auto; display: inline-block; box-shadow: 0 10px 25px rgba(16,185,129,0.3);">
                ${code}
              </div>
              <p style="color: #6b7280; margin: 15px 0 0; font-size: 14px;">
                <span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 6px; font-weight: 500;">⏰ Expires in 10 minutes</span>
              </p>
            </div>
                      <!-- Instructions -->
            <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin: 0 0 10px; font-size: 18px; font-weight: 600;">What's next?</h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Enter this code in the verification field</li>
                <li>Start building your dream neighborhood</li>
                <li>Connect with neighbors and grow your community</li>
                <li>Unlock achievements and level up your city!</li>
              </ul>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #dc2626; margin: 0; font-size: 14px;">
                🔒 <strong>Security tip:</strong> Never share this code with anyone. We'll never ask for it via phone or email.
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 15px; font-size: 14px;">
              Need help? Contact us at <a href="mailto:support@domka.me" style="color: #10b981; text-decoration: none; font-weight: 500;">support@domka.me</a>
            </p>
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              © 2025 NeighborVille by d0mkaaa. Made with ❤️ for city builders everywhere.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `Hello ${displayName}!\n\nYour verification code for neighborville is: ${code}\n\nThis code will expire in 10 minutes.\n\nThank you,\n d0mkaaa`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'NeighborVille'}" <${process.env.EMAIL_FROM || 'hello@domka.me'}>`,
    to: email,
    subject: 'Your NeighborVille Verification Code',
    text: textContent,
    html: htmlContent
  };

  try {
    if (!process.env.MAILTRAP_PASS) {
      console.warn('⚠️ No SMTP password found, falling back to console logging');
      console.log('==========================================');
      console.log(`📧 Email to: ${email}`);
      console.log(`📝 Verification code: ${code}`);
      console.log(`👤 Username: ${displayName}`);
      console.log('==========================================');
      return { success: true, fallback: true, code };
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      code
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    console.log('==========================================');
    console.log(`📧 FALLBACK: Email to: ${email}`);
    console.log(`📝 FALLBACK: Code: ${code}`);
    console.log(`👤 FALLBACK: Username: ${displayName}`);
    console.log('==========================================');
    
    return { 
      success: true, 
      fallback: true,
      error: error.message,
      code
    };
  }
};