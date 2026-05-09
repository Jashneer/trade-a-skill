// API Configuration
// In development: uses Vite proxy (http://localhost:5173 proxies to backend)
// In production: uses the backend URL from environment variable

const getApiUrl = () => {
  // During development with Vite dev server, use relative paths (proxied)
  if (import.meta.env.DEV) {
    console.log('[API Config] Development mode - using Vite proxy');
    return '';  // Relative URLs will be proxied by Vite
  }

  // In production, use the backend URL from environment variable
  const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
  
  // Log for debugging
  console.log('[API Config] Production mode');
  console.log('[API Config] VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
  console.log('[API Config] Using backend URL:', backendUrl);
  
  return backendUrl;
};

export const API_BASE_URL = getApiUrl();

// Helper function to construct API endpoints
export const getApiEndpoint = (path) => {
  const endpoint = `${API_BASE_URL}${path}`;
  console.log('[API] Requesting:', endpoint);
  return endpoint;
};
