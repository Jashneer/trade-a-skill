/**
 * Generates the full API URL by combining the base Render URL with the specific path.
 * Ensures no double-slashes and handles development vs production environments.
 */
export const getApiUrl = (path) => {
  // 1. Prioritize the Vercel Environment Variable (The Render Link)
  const envApiUrl = import.meta.env.VITE_API_URL;

  // 2. Determine the Base URL
  // If we are in production, we MUST use the Render URL. 
  // If in development (localhost), we use the local backend port.
  const baseUrl = (typeof envApiUrl === 'string' && envApiUrl.length > 0)
    ? envApiUrl.replace(/\/$/, '') // Remove trailing slash if present
    : import.meta.env.DEV 
      ? 'http://localhost:5000' 
      : ''; // Fallback for safety

  // 3. Normalize the Path
  // Ensure the path starts with exactly one slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 4. Final Construction
  const finalUrl = `${baseUrl}${cleanPath}`;
  
  // Lead's Debug Log (Optional: remove after confirming everything works)
  if (import.meta.env.DEV) {
    console.log(`[API Helper] Requesting: ${finalUrl}`);
  }

  return finalUrl;
};