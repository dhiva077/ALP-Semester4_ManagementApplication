import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

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
    try {
      setIsLoading(true);

      const userData = {
        name: 'Frontend Demo User',
        email: 'demo@ciputra.ac.id',
      };

      await AsyncStorage.multiSet([
        ['isLoggedIn', 'true'],
        ['authProvider', 'frontend-only'],
        ['user', JSON.stringify(userData)],
      ]);

      router.replace('/(tabs)/dashboard');
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