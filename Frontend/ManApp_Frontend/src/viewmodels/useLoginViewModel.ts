import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { loginService } from '../services/authService';

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
    if (!email || !password) {
      Alert.alert('Error', 'Harap isi email dan password.');
      return;
    }

    const normalized = email.toLowerCase();
    const allowed = ['@ciputra.ac.id', '@staffpm.ciputra.ac.id', '@student.ciputra.ac.id'];
    if (!allowed.some(d => normalized.endsWith(d))) {
      Alert.alert('Login Ditolak', 'Gunakan email UC Staff dengan domain yang valid.');
      return;
    }

    try {
      setIsLoading(true);

      const user = await loginService(email, password);
      if (user) {
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login gagal';
      console.log('Login error:', errorMsg); // Log untuk debugging
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