import { getEnv } from './envConfig';

const rawApiUrl = getEnv('VITE_API_URL', 'http://localhost:3001');

let normalizedUrl = rawApiUrl.endsWith('/') 
  ? rawApiUrl.slice(0, -1) 
  : rawApiUrl;

if (normalizedUrl.endsWith('/api')) {
  normalizedUrl = normalizedUrl.slice(0, -4);
}

export const API_URL = normalizedUrl;
export const NORMALIZED_API_URL = normalizedUrl;