import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginService = async () => {
  await AsyncStorage.setItem('isLoggedIn', 'true');
};