const getApiUrl = () => {
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  
  // If running on localhost or 127.0.0.1, assume backend is on 3001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // If running on a local network IP (e.g. 192.168.x.x), assume backend is on the same IP at port 3001
  return `http://${window.location.hostname}:3001`;
};

export const API_URL = getApiUrl();
