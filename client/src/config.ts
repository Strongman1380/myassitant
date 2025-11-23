const getApiUrl = () => {
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }

  // If running on localhost or 127.0.0.1, assume backend is on 3001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // If accessing via local network IP (e.g. 192.168.x.x), assume backend is on 3001
  // This allows the iPhone to connect to the backend running on your computer
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname) || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname)) {
    return `http://${window.location.hostname}:3001`;
  }

  // In production (Vercel), use the same domain (serverless functions are at /api)
  return window.location.origin;
};

export const API_URL = getApiUrl();
