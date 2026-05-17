/**
 * PHP API Configuration
 * 
 * This file configures the HTTP client for the SAMS PHP backend.
 * Set the API_BASE_URL to match your PHP server location.
 */

import { Platform } from 'react-native';

const normalizeBaseUrl = (value: string) => (value.endsWith('/') ? value : `${value}/`);

const defaultDevBaseUrl = Platform.select({
  // Android emulator cannot resolve localhost to your host machine.
  android: 'http://10.0.2.2/SAMS_App/api/',
  ios: 'http://localhost/SAMS_App/api/',
  default: 'http://localhost/SAMS_App/api/',
});

// Use runtime override first, then platform-aware defaults.
let apiBaseUrl = normalizeBaseUrl(
  ((globalThis as any).__SAMS_API_BASE_URL__ as string | undefined) ??
    defaultDevBaseUrl ??
    'http://localhost/SAMS_App/api/'
);

// Session token stored after login
let authToken: string | null = null;

/**
 * Override API URL at runtime (useful for real device testing).
 */
export const setApiBaseUrl = (nextBaseUrl: string) => {
  apiBaseUrl = normalizeBaseUrl(nextBaseUrl.trim());
};

export const getApiBaseUrl = () => apiBaseUrl;

/**
 * Make HTTP request to PHP backend
 * @param endpoint - API endpoint (e.g., 'login', 'shifts', 'attendance')
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param data - Request body for POST/PUT requests
 * @returns Response data from PHP backend
 */
export const apiCall = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) => {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${apiBaseUrl}${cleanEndpoint}`;
  
  const headers: any = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (method !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Set auth token after successful login
 */
export const setAuthToken = (token: string) => {
  authToken = token;
};

/**
 * Clear auth token on logout
 */
export const clearAuthToken = () => {
  authToken = null;
};

export default { apiCall, setAuthToken, clearAuthToken, setApiBaseUrl, getApiBaseUrl };
