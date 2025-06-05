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
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
      <div style="min-height: 100vh; padding: 20px; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; max-width: 600px; width: 100%; border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; position: relative;">
            <div style="background: rgba(255,255,255,0.15); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2);">
              <div style="font-size: 36px;">🏘️</div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: -0.5px;">NeighborVille</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; font-weight: 400;">Build your dream neighborhood!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px;">🔐</span>
              </div>
              <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 28px; font-weight: 600; letter-spacing: -0.25px;">Verification Required</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">Hello <strong style="color: #10b981; font-weight: 600;">${displayName}</strong>! I need to verify your email address to complete your NeighborVille account setup.</p>
            </div>
            
            <!-- Verification Code Box -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #10b981; border-radius: 20px; padding: 30px; text-align: center; margin: 30px 0; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="position: absolute; top: -1px; left: -1px; right: -1px; height: 3px; background: linear-gradient(90deg, #10b981, #059669, #0d9488); border-radius: 20px 20px 0 0;"></div>
              <p style="color: #374151; margin: 0 0 15px; font-size: 16px; font-weight: 500;">Your verification code is:</p>
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 24px; border-radius: 16px; font-size: 36px; font-weight: 700; letter-spacing: 12px; margin: 0 auto; display: inline-block; box-shadow: 0 10px 25px rgba(16,185,129,0.25); border: 2px solid rgba(255,255,255,0.2);">
                ${code}
              </div>
              <p style="color: #6b7280; margin: 20px 0 0; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span style="background: #fef3c7; color: #d97706; padding: 6px 12px; border-radius: 8px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
                  ⏰ <span>Expires in 10 minutes</span>
                </span>
              </p>
            </div>
            
            <!-- Instructions -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid #10b981; padding: 24px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <span>🚀</span> What's next?
              </h3>
              <ul style="color: #4b5563; margin: 0; padding-left: 0; line-height: 1.8; list-style: none;">
                <li style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: #10b981; font-weight: 600;">1.</span>
                  <span>Enter this code in the verification field</span>
                </li>
                <li style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: #10b981; font-weight: 600;">2.</span>
                  <span>Start building your dream neighborhood</span>
                </li>
                <li style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: #10b981; font-weight: 600;">3.</span>
                  <span>Connect with neighbors and grow your community</span>
                </li>
                <li style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: #10b981; font-weight: 600;">4.</span>
                  <span>Unlock achievements and level up your city!</span>
                </li>
              </ul>
            </div>
            
            <!-- Security Notice -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="color: #dc2626; margin: 0; font-size: 14px; display: flex; align-items: flex-start; gap: 8px;">
                <span style="font-size: 16px;">🔒</span>
                <span><strong>Security tip:</strong> Never share this code with anyone. I'll never ask for it via phone or email.</span>
              </p>
            </div>
            
            <!-- Game Features Preview -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #bae6fd;">
              <h3 style="color: #0c4a6e; margin: 0 0 16px; font-size: 18px; font-weight: 600; text-align: center;">🎮 Ready to build your city?</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin-top: 16px;">
                <div style="text-align: center; padding: 12px;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🏠</div>
                  <div style="color: #0c4a6e; font-size: 12px; font-weight: 500;">Build Houses</div>
                </div>
                <div style="text-align: center; padding: 12px;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🏪</div>
                  <div style="color: #0c4a6e; font-size: 12px; font-weight: 500;">Open Shops</div>
                </div>
                <div style="text-align: center; padding: 12px;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🌳</div>
                  <div style="color: #0c4a6e; font-size: 12px; font-weight: 500;">Add Parks</div>
                </div>
                <div style="text-align: center; padding: 12px;">
                  <div style="font-size: 24px; margin-bottom: 8px;">👥</div>
                  <div style="color: #0c4a6e; font-size: 12px; font-weight: 500;">Meet Neighbors</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0 0 15px; font-size: 14px;">
              Need help? Contact me at <a href="mailto:rutkauskasdomantas@gmail.com" style="color: #10b981; text-decoration: none; font-weight: 500; padding: 4px 8px; background: #f0fdf4; border-radius: 6px;">rutkauskasdomantas@gmail.com</a>
            </p>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © 2025 NeighborVille by <strong>d0mkaaa</strong> (Domantas Rutkauskas)
              </p>
              <p style="color: #9ca3af; margin: 4px 0 0; font-size: 12px;">
                Made with ❤️ for city builders everywhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `Hello ${displayName}!

Your verification code for NeighborVille is: ${code}

This code will expire in 10 minutes.

Enter this code to complete your account setup and start building your dream neighborhood!

Need help? Contact me at rutkauskasdomantas@gmail.com

Thank you,
d0mkaaa (Domantas Rutkauskas)
NeighborVille Developer`;

  const mailOptions = {
    from: `"NeighborVille by d0mkaaa" <${process.env.EMAIL_FROM || 'hello@domka.me'}>`,
    to: email,
    subject: '🏘️ Your NeighborVille Verification Code',
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