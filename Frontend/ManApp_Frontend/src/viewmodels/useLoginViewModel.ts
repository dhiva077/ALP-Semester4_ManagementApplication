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

    if (!email.toLowerCase().endsWith('@staffpm.ciputra.ac.id')) {
      Alert.alert(
        'Login Ditolak',
        'Gunakan email UC Staff dengan domain @staffPM.ciputra.ac.id'
      );
      return;
    }

    try {
      setIsLoading(true);

      await loginService();

      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Error', 'Login gagal');
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