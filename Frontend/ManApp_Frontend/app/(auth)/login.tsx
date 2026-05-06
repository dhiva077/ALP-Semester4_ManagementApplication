import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;

      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken);
      }
    }
  }, [response]);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = await response.json();

      if (
        user.email &&
        user.email.toLowerCase().endsWith('@staffpm.ciputra.ac.id')
      ) {
        await handleLogin();
      } else {
        Alert.alert(
          'Login Ditolak',
          'Hanya akun UC Staff dengan domain @staffPM.ciputra.ac.id yang dapat digunakan.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil data akun Google.');
    }
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

    setIsLoading(true);

    setTimeout(async () => {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      setIsLoading(false);
      router.replace('/(tabs)/dashboard');
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome ManApp</Text>

        <Text style={styles.subtitle}>
          Booking Venue Universitas Ciputra Makassar
        </Text>

        <Text style={styles.signInText}>Sign In to your UC Account</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color="#5C2C00" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#5C2C00"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color="#5C2C00" />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#5C2C00"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color="#5C2C00"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.infoSubText}>
          Gunakan email dengan domain @staffPM.ciputra.ac.id
        </Text>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Lanjutkan</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>Or sign in with</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, !request && { opacity: 0.5 }]}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text style={styles.googleText}>Sign in with Google</Text>
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
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5C2C00',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 12,
    color: '#8D6E63',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },

  signInText: {
    fontSize: 14,
    color: '#5C2C00',
    marginTop: 6,
    marginBottom: 18,
    fontWeight: '600',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },

  input: {
    flex: 1,
    paddingVertical: 13,
    marginLeft: 8,
    color: '#5C2C00',
  },

  infoSubText: {
    fontSize: 12,
    color: '#8D6E63',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },

  button: {
    backgroundColor: '#FF8F29',
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCC',
  },

  orText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#8D6E63',
  },

  googleButton: {
    borderWidth: 1,
    borderColor: '#FF8F29',
    borderRadius: 10,
    paddingVertical: 12,
  },

  googleText: {
    textAlign: 'center',
    color: '#FF8F29',
    fontWeight: '600',
  },
});