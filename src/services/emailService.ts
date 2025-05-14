const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const sendVerificationEmail = async (
  email: string,
  _code?: string, // i kept it for development purposes, but does nothing currently
  username?: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        username
      })
    });

    const data = await response.json();
    
    if (data.success) {
      if (data.code && import.meta.env.DEV) {
        console.log('==========================================');
        console.log(`📧 DEV MODE: Email to: ${email}`);
        console.log(`📝 DEV MODE: Code: ${data.code}`);
        console.log('==========================================');
      }
      return true;
    } else {
      console.log('Email verification API call failed');
      return false;
    }
  } catch (error) {
    console.error('Error calling email API:', error);
    return false;
  }
};