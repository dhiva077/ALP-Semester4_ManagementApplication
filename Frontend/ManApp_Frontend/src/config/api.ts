/**
 * Centralized API Configuration
 * * Configured to target the university's Proxmox VM subdomain
 * so that both Expo Go and production builds hit the online server.
 */

const PRODUCTION_URL = 'https://manapp.mad24.dpdns.org';

// Dikunci langsung ke server Proxmox kampus agar saat discan lewat HP,
// aplikasi langsung mengambil data dari database MySQL server.
export const API_URL = `${PRODUCTION_URL}/api`;

export const API_CONFIG = {
  BASE_URL: API_URL,
  PORT: '443', // Jaringan HTTPS secara default menggunakan port 443
  DEV_HOST: 'manapp.mad24.dpdns.org',
  PRODUCTION_URL,
};

export default API_CONFIG;