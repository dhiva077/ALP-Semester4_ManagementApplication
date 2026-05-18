import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { loginService } from '../services/authService';

const USER_DATA_MAP: Record<string, { name: string; role: string }> = {
  'wulan.purnamasari@ciputra.ac.id': { name: 'Wulan Purnamasari', role: 'manager' },
  'amuh0003@student.ciputra.ac.id': { name: 'Fathir', role: 'pic' },
  'dgongxi01@student.ciputra.ac.id': { name: 'Dylon', role: 'pic' },
};

const ALLOWED_DOMAINS = ['@ciputra.ac.id', '@staffpm.ciputra.ac.id', '@student.ciputra.ac.id'];

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const getDefaultNameFromEmail = (email: string) => {
  const localPart = email.split('@')[0];
  return localPart
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'User';
};

export default function useLoginViewModel() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      Alert.alert('Login Ditolak', 'Email tidak boleh kosong.');
      return;
    }

    if (!password) {
      Alert.alert('Login Ditolak', 'Password tidak boleh kosong.');
      return;
    }

    if (!ALLOWED_DOMAINS.some((domain) => normalizedEmail.endsWith(domain))) {
      Alert.alert('Login Ditolak', 'Gunakan email UC yang valid.');
      return;
    }

    try {
      setIsLoading(true);

      const backendUser = await loginService(normalizedEmail, password);
      const mappedUser = USER_DATA_MAP[normalizedEmail];
      const userData = {
        ...backendUser,
        name: backendUser?.name ?? mappedUser?.name ?? getDefaultNameFromEmail(normalizedEmail),
        email: backendUser?.email ?? normalizedEmail,
        role: mappedUser?.role ?? 'pic',
      };

      await AsyncStorage.multiSet([
        ['isLoggedIn', 'true'],
        ['authProvider', 'backend'],
        ['user', JSON.stringify(userData)],
      ]);

      router.replace('/(tabs)/dashboard');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login gagal';
      console.log('Login error:', errorMsg);
      Alert.alert('Login Gagal', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    showPassword,
    togglePasswordVisibility,
    handleLogin,
  };
}