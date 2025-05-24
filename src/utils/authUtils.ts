import { NORMALIZED_API_URL } from '../config/apiConfig';
import { getAuthToken } from '../services/userService';

export const checkAuthenticationStatus = async (): Promise<{
  success: boolean;
  authenticated: boolean;
  user?: any;
  message?: string;
}> => {
  try {
    const token = getAuthToken();
    
    const response = await fetch(`${NORMALIZED_API_URL}/api/user/auth-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include'
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return {
      success: false,
      authenticated: false,
      message: 'Error checking authentication status'
    };
  }
}; 