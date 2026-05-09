import { Platform } from 'react-native';

/**
 * API Configuration yang mendukung berbagai environment
 * 
 * - Web: http://localhost:8000
 * - Physical Android/iOS Device: http://localhost:8000 (IP lokal PC)
 * - Android Emulator: http://10.0.2.2:8000 (special address untuk localhost)
 */

// IP lokal PC Anda - ubah sesuai kebutuhan
const LOCAL_PC_IP = '127.0.0.1';
const PORT = '8000';

let API_BASE_URL: string;

if (Platform.OS === 'web') {
  // Web: gunakan localhost
  API_BASE_URL = `http://localhost:${PORT}/api`;
} else if (Platform.OS === 'android' || Platform.OS === 'ios') {
  // Mobile: cek apakah emulator atau physical device
  // Default ke physical device, bisa diubah manual di sini
  API_BASE_URL = `http://${LOCAL_PC_IP}:${PORT}/api`;
  
  // Kalau pakai Android Emulator, uncomment line di bawah:
  // API_BASE_URL = `http://10.0.2.2:${PORT}/api`;
} else {
  // Default fallback
  API_BASE_URL = `http://${LOCAL_PC_IP}:${PORT}/api`;
}

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  PORT,
  LOCAL_PC_IP,
};

export default API_CONFIG;
