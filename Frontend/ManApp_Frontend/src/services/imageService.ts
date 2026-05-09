import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const pickProfileImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Izin dibutuhkan',
      'Izinkan akses galeri untuk mengganti foto profil.'
    );

    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    return result.assets[0].uri;
  }

  return null;
};