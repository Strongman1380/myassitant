// Default to same-origin API (works on Vercel); override via VITE_API_URL for local/remote servers
export const API_URL = (import.meta as any).env?.VITE_API_URL || '';
