export const getApiUrl = (path) => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = typeof envApiUrl === 'string' && envApiUrl.length > 0
    ? envApiUrl
    : import.meta.env.DEV
      ? ''
      : (typeof window !== 'undefined' ? window.location.origin : '');

  return `${baseUrl}${path}`;
};
