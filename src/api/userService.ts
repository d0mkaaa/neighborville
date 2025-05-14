const API_BASE_URL = import.meta.env.VITE_API_URL;

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
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
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
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      localStorage.removeItem('auth_token');
      return true;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/user/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token
      })
    });
    
    localStorage.removeItem('auth_token');
    
    return response.status === 200;
  } catch (error) {
    console.error('Error during logout:', error);
    localStorage.removeItem('auth_token');
    return false;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return null;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.user) {
      return data.user;
    }
    
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