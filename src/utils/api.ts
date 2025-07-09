const defaultOptions: RequestInit = {
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json'
  }
};

export const api = {
  get: async (endpoint: string, options?: { params?: Record<string, any> }) => {
    let url = endpoint;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }
    
    const response = await fetch(url, {
      ...defaultOptions,
      method: 'GET'
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetch(endpoint, {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetch(endpoint, {
      ...defaultOptions,
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    
    return response.json();
  },

  patch: async (endpoint: string, data: any) => {
    const response = await fetch(endpoint, {
      ...defaultOptions,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    
    return response.json();
  },

  delete: async (endpoint: string) => {
    console.log('🗑️ API: Making DELETE request to:', endpoint);
    const response = await fetch(endpoint, {
      ...defaultOptions,
      method: 'DELETE'
    });
    console.log('🗑️ API: DELETE response status:', response.status);
    
    if (!response.ok) {
      console.error('🗑️ API: DELETE request failed:', response.status, response.statusText);
      
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    
    const result = await response.json();
    console.log('🗑️ API: DELETE response body:', result);
    return result;
  }
};

export default api; 