import { NORMALIZED_API_URL } from '../config/apiConfig';

export const sendVerificationEmail = async (
  email: string,
  _code?: string, // i kept it for development purposes, but does nothing currently
  username?: string
): Promise<{ success: boolean, isExistingCode?: boolean, message?: string }> => {
  try {
    const response = await fetch(`${NORMALIZED_API_URL}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        username
      }),
      credentials: 'include'
    });

    const data = await response.json();
    
    return {
      success: data.success,
      isExistingCode: data.message?.includes('already have a valid verification code') || data.message?.includes('existing code'),
      message: data.message
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { 
      success: false,
      message: 'Server error occurred while sending verification email'
    };
  }
};