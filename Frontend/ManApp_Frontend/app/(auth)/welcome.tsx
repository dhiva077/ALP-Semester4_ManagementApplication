import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Welcome() {
  const router = useRouter();

  const handleContinue = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        
        <Image
          source={require('../../assets/images/logo-manapp.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          <Text style={{ color: '#FF8F29' }}>Selamat Datang di</Text>
          {'\n'}Management Application
        </Text>

        <Text style={styles.desc}>
          Aplikasi ManApp berfokus pada pengelolaan data booking venue yang dilakukan secara otomatis oleh sistem,
          data yang Anda masukkan digunakan sepenuhnya untuk keperluan Administrasi dan tidak disalahgunakan.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Lanjutkan</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 5,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C2C00',
    marginBottom: 10,
  },
  desc: {
    textAlign: 'center',
    fontSize: 13,
    color: '#5C2C00',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF8F29',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});