export const getEnv = (key: string, defaultValue: string = ''): string => {
  if (key === 'VITE_API_URL' && import.meta.env.DEV) {
    const override = window.localStorage.getItem('__neighborville_api_override');
    if (override) return override;
  }
  
  return import.meta.env[key] || defaultValue;
};

export default {
  isDev: import.meta.env.DEV,
  apiUrl: getEnv('VITE_API_URL', 'http://localhost:3001')
}; 