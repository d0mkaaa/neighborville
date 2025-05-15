const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const API_URL = isDevelopment 
  ? 'http://localhost:3001'
  : import.meta.env.VITE_API_URL || 'https://api.domka.me';

export { API_URL, isDevelopment };

console.log(`
-------------------------------------
NEIGHBORVILLE ENVIRONMENT:
- Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}
- API URL: ${API_URL}
- Vite DEV: ${import.meta.env.DEV}
- Vite MODE: ${import.meta.env.MODE}
- Vite API URL: ${import.meta.env.VITE_API_URL || '(not set)'}
-------------------------------------
`);