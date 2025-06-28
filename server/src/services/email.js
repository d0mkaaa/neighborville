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
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>NeighborVille Verification</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        td { border-collapse: collapse; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        
        @media screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 10px !important; }
          .main-table { width: 100% !important; }
          .mobile-padding { padding: 20px !important; }
          .mobile-text { font-size: 14px !important; line-height: 1.6 !important; }
          .code-box { font-size: 28px !important; letter-spacing: 8px !important; padding: 20px !important; }
          .feature-icon { font-size: 20px !important; }
          .tech-badge { font-size: 10px !important; padding: 3px 6px !important; margin: 2px !important; }
          .mobile-hide { display: none !important; }
          .mobile-center { text-align: center !important; }
        }
        
        @media (prefers-color-scheme: dark) {
          .dark-bg { background-color: #1f2937 !important; }
          .dark-text { color: #f9fafb !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <tr>
          <td style="padding: 20px;" class="container">
            
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); overflow: hidden;" class="main-table">
              
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;" class="mobile-padding">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center;">
                        <div style="background: rgba(255,255,255,0.15); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: inline-block; text-align: center; vertical-align: middle; line-height: 80px; border: 2px solid rgba(255,255,255,0.2);">
                          <span style="font-size: 36px;">🏘️</span>
                        </div>
                        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: -0.5px;">NeighborVille</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; font-weight: 500;">Build your dream neighborhood with love ❤️</p>
                        <div style="margin-top: 15px; display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">
                          v1.0.0-live • Made by d0mkaaa
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 40px 30px;" class="mobile-padding">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    
                    <tr>
                      <td style="text-align: center; padding-bottom: 30px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 16px; margin: 0 auto 20px; display: inline-block; text-align: center; line-height: 60px;">
                          <span style="font-size: 24px;">🔐</span>
                        </div>
                        <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 28px; font-weight: 600; letter-spacing: -0.25px;">Verification Required</h2>
                        <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;" class="mobile-text">Hello <strong style="color: #10b981; font-weight: 600;">${displayName}</strong>! I need to verify your email address to complete your NeighborVille account setup.</p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #10b981; border-radius: 20px; padding: 30px;">
                          <tr>
                            <td style="text-align: center;">
                              <p style="color: #374151; margin: 0 0 15px; font-size: 16px; font-weight: 500;">Your verification code is:</p>
                              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 24px; border-radius: 16px; font-size: 36px; font-weight: 700; letter-spacing: 12px; margin: 0 auto; display: inline-block; box-shadow: 0 10px 25px rgba(16,185,129,0.25);" class="code-box">
                                ${code}
                              </div>
                              <p style="color: #6b7280; margin: 20px 0 0; font-size: 14px; text-align: center;">
                                <span style="background: #fef3c7; color: #d97706; padding: 6px 12px; border-radius: 8px; font-weight: 500; display: inline-block;">
                                  ⏰ Expires in 10 minutes
                                </span>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-left: 4px solid #10b981; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
                          <tr>
                            <td>
                              <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 18px; font-weight: 600;">
                                🚀 What's next?
                              </h3>
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="color: #4b5563; line-height: 1.8; font-size: 15px;" class="mobile-text">
                                    <p style="margin: 8px 0;"><span style="color: #10b981; font-weight: 600;">1.</span> Enter this code in the verification field</p>
                                    <p style="margin: 8px 0;"><span style="color: #10b981; font-weight: 600;">2.</span> Create your first neighborhood with 2000 starting coins</p>
                                    <p style="margin: 8px 0;"><span style="color: #10b981; font-weight: 600;">3.</span> Place buildings, manage resources, and grow your economy</p>
                                    <p style="margin: 8px 0;"><span style="color: #10b981; font-weight: 600;">4.</span> Compete on leaderboards and unlock achievements!</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 10px 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; border-left: 4px solid #ef4444;">
                          <tr>
                            <td>
                              <p style="color: #dc2626; margin: 0; font-size: 14px;" class="mobile-text">
                                <span style="font-size: 16px;">🔒</span>
                                <strong>Security tip:</strong> Never share this code with anyone. I'll never ask for it via phone or email.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; border: 1px solid #bae6fd;">
                          <tr>
                            <td>
                              <h3 style="color: #0c4a6e; margin: 0 0 16px; font-size: 18px; font-weight: 600; text-align: center;">🎮 Experience the full city simulation!</h3>
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td width="25%" style="text-align: center; padding: 12px; vertical-align: top;">
                                    <div style="font-size: 24px; margin-bottom: 8px;" class="feature-icon">🏗️</div>
                                    <div style="color: #0c4a6e; font-size: 12px; font-weight: 500;">City Building</div>
                                  </td>
                                  <td width="25%" style="text-align: center; padding: 12px; vertical-align: top;">
                                    <div style="font-size: 24px; margin-bottom: 8px;" class="feature-icon">💰</div>
                                    <div style="color: #0c4a6e; font-size: 12px; font-weight: 500;">Economy Sim</div>
                                  </td>
                                  <td width="25%" style="text-align: center; padding: 12px; vertical-align: top;">
                                    <div style="font-size: 24px; margin-bottom: 8px;" class="feature-icon">🏆</div>
                                    <div style="color: #0c4a6e; font-size: 12px; font-weight: 500;">Leaderboards</div>
                                  </td>
                                  <td width="25%" style="text-align: center; padding: 12px; vertical-align: top;">
                                    <div style="font-size: 24px; margin-bottom: 8px;" class="feature-icon">💾</div>
                                    <div style="color: #0c4a6e; font-size: 12px; font-weight: 500;">Cloud Saves</div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
              
              <tr>
                <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;" class="mobile-padding">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="color: #6b7280; margin: 0 0 12px; font-size: 13px; font-weight: 600;">Built with cutting-edge technologies:</p>
                        <div style="text-align: center;">
                          <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; display: inline-block;" class="tech-badge">React 18</span>
                          <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; display: inline-block;" class="tech-badge">TypeScript</span>
                          <span style="background: #f3e8ff; color: #7c3aed; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; display: inline-block;" class="tech-badge">Framer Motion</span>
                          <span style="background: #cffafe; color: #0891b2; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; display: inline-block;" class="tech-badge">Tailwind CSS</span>
                          <span style="background: #dcfce7; color: #16a34a; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; display: inline-block;" class="tech-badge">Node.js</span>
                          <span style="background: #dcfce7; color: #16a34a; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; display: inline-block;" class="tech-badge">MongoDB</span>
                          <span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; display: inline-block;" class="tech-badge">Live GitHub</span>
                          <span style="background: #fce7f3; color: #be185d; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; margin: 2px; display: inline-block;" class="tech-badge">Real-time Updates</span>
                        </div>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 10px 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px;">
                          <tr>
                            <td style="text-align: center;">
                              <p style="color: #166534; margin: 0 0 10px; font-size: 14px; font-weight: 600;">
                                💬 Need help or have feedback?
                              </p>
                              <p style="color: #15803d; margin: 0 0 12px; font-size: 13px;" class="mobile-text">
                                I'd love to hear from you! Contact me at:
                              </p>
                              <a href="mailto:rutkauskasdomantas@gmail.com" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; font-weight: 600; padding: 10px 20px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 6px rgba(16,185,129,0.25);">
                                rutkauskasdomantas@gmail.com
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="text-align: center; padding-bottom: 15px;">
                              <div style="display: inline-block; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #fbbf24; border-radius: 12px; padding: 16px;">
                                <p style="color: #92400e; margin: 0; font-size: 13px; font-weight: 600;" class="mobile-text">
                                  👨‍💻 Created by d0mkaaa (Domantas Rutkauskas)
                                </p>
                                <p style="color: #b45309; margin: 4px 0 0; font-size: 12px;" class="mobile-text">
                                  Passionate developer from Lithuania 🇱🇹
                                </p>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="text-align: center; padding-bottom: 15px;">
                              <p style="color: #6b7280; margin: 0; font-size: 12px;" class="mobile-text">
                                Made with ❤️ for city builders everywhere
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="text-align: center;">
                              <p style="color: #9ca3af; margin: 0; font-size: 11px;" class="mobile-text">
                                © 2025 NeighborVille • v1.0.0-live • All rights reserved
                              </p>
                              <p style="color: #9ca3af; margin: 4px 0 0; font-size: 11px;" class="mobile-text">
                                Featuring live GitHub integration and real-time updates! 🚀
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  const textContent = `🏘️ NeighborVille v1.0.0-live - Email Verification

Hello ${displayName}!

Your verification code for NeighborVille is: ${code}

⏰ This code will expire in 10 minutes.

🚀 What's next?
1. Enter this code in the verification field
2. Create your first neighborhood with 2000 starting coins
3. Place buildings, manage resources, and grow your economy
4. Compete on leaderboards and unlock achievements!

🎮 Experience the full city simulation!
City Building • Economy Sim • Leaderboards • Cloud Saves

💬 Need help or have feedback?
I'd love to hear from you! Contact me at: rutkauskasdomantas@gmail.com

Built with cutting-edge technologies:
React 18, TypeScript, Framer Motion, Tailwind CSS, Node.js, MongoDB, Live GitHub, Real-time Updates

👨‍💻 Created by d0mkaaa (Domantas Rutkauskas)
Passionate developer from Lithuania 🇱🇹

Made with ❤️ for city builders everywhere

© 2025 NeighborVille • v1.0.0-live • All rights reserved
Featuring live GitHub integration and real-time updates! 🚀`;

  const mailOptions = {
    from: `"NeighborVille by d0mkaaa" <${process.env.EMAIL_FROM || 'hello@domka.me'}>`,
    to: email,
    subject: '🏘️ Welcome to NeighborVille v1.0 - Verification Code Inside!',
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