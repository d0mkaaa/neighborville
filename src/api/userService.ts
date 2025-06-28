import { NORMALIZED_API_URL } from '../config/apiConfig';

const API_BASE_URL = NORMALIZED_API_URL;

export interface User {
  id: string;
  email: string;
  username: string;
  verified: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export const register = async (
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        username
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Error during registration:', error);
    return {
      success: false,
      message: 'Network error during registration'
    };
  }
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    return {
      success: false,
      message: 'Network error during login'
    };
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log('getCurrentUser: Making request to /api/user/me with cookie authentication');
    const response = await fetch(`${API_BASE_URL}/api/user/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log('getCurrentUser: Response status:', response.status);
    
    if (response.status === 401) {
      console.log('getCurrentUser: Received 401, user not authenticated');
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.user) {
      console.log('getCurrentUser: Successfully retrieved user:', data.user.username);
      return data.user;
    }
    
    console.log('getCurrentUser: No user data in response');
    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

export const verifyEmail = async (
  email: string,
  code: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        code
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error during email verification:', error);
    return false;
  }
};

export const resendVerification = async (
  email: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error resending verification email:', error);
    return false;
  }
};

export const check2FAStatus = async (email: string): Promise<{
  success: boolean;
  has2FA: boolean;
  isNewUser: boolean;
  verified: boolean;
  userId?: string;
  username?: string;
  message?: string;
  needsUsernameUpdate?: boolean;
}> => {
  try {
    if (!email || !email.trim()) {
      return {
        success: false,
        has2FA: false,
        isNewUser: false,
        verified: false,
        message: 'Email is required'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        success: false,
        has2FA: false,
        isNewUser: false,
        verified: false,
        message: 'Please enter a valid email address'
      };
    }

    console.log('userService: Calling check-2fa-status with email:', email.trim());
    const requestBody = { email: email.trim() };
    console.log('userService: Request body:', requestBody);
    
    if (!requestBody.email) {
      console.error('userService: Email is empty after trim!');
      return {
        success: false,
        has2FA: false,
        isNewUser: false,
        verified: false,
        message: 'Email is required'
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/api/user/check-2fa-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    console.log('userService: Response status:', response.status);
    const data = await response.json();
    console.log('userService: Response data:', data);
    return data;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return {
      success: false,
      has2FA: false,
      isNewUser: false,
      verified: false,
      message: 'Network error - please check your connection'
    };
  }
};

export const verifyLogin = async (
  email: string,
  verificationCode?: string,
  twoFactorToken?: string,
  username?: string
): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  requires2FA?: boolean;
  userId?: string;
  skipEmailVerification?: boolean;
  isNewRegistration?: boolean;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/verify-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        verificationCode,
        twoFactorToken,
        username,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error during login verification:', error);
    return {
      success: false,
      message: 'Network error occurred'
    };
  }
};

export const updateLegalAcceptance = async (acceptanceData: {
  termsOfService?: boolean;
  privacyPolicy?: boolean;
  marketingConsent?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/legal-acceptance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(acceptanceData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating legal acceptance:', error);
    return {
      success: false,
      message: 'Network error occurred'
    };
  }
}; 

export const updateUsername = async (email: string, newUsername: string): Promise<{
  success: boolean;
  message?: string;
  username?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/update-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, newUsername }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating username:', error);
    return {
      success: false,
      message: 'Network error - please check your connection'
    };
  }
}; 