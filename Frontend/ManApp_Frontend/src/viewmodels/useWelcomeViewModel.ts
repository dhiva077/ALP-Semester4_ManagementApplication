import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function useWelcomeViewModel() {
  const router = useRouter();

  const handleContinue = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/(auth)/login');
  };

  return {
    handleContinue,
  };
}