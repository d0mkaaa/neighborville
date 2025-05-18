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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4a6ee0;">neighborville Verification</h2>
      <p>Hello ${displayName}!</p>
      <p>Your verification code for neighborville is:</p>
      <div style="background-color: #f0f4ff; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
        ${code}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>Thank you,<br>d0mkaaa</p>
    </div>
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