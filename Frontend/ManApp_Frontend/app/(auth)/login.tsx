import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

type GoogleOauthConfig = {
  clientId?: string;
  expoClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
  webClientId?: string;
};

type GoogleUser = {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
};

type BackendLoginPayload = {
  message?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
};

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
};

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleAuthInProgress, setGoogleAuthInProgress] = useState(false);

  const googleConfig =
    (Constants.expoConfig?.extra?.googleOauth as GoogleOauthConfig | undefined) ??
    {};
  const isExpoGo = Constants.appOwnership === 'expo';
  const fallbackClientId =
    '520666620714-ckgbal9fel0nnonbgb0df9c0n3sutn4p.apps.googleusercontent.com';
  const expoClientId =
    googleConfig.clientId ?? googleConfig.expoClientId ?? fallbackClientId;
  const webClientId = googleConfig.webClientId ?? fallbackClientId;
  const isGoogleConfigured = isExpoGo
    ? !!expoClientId
    : Platform.OS === 'android'
      ? !!googleConfig.androidClientId
      : Platform.OS === 'ios'
        ? !!googleConfig.iosClientId
        : !!webClientId;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: expoClientId ?? 'missing-client-id',
    androidClientId: googleConfig.androidClientId ?? 'missing-android-client-id',
    iosClientId: googleConfig.iosClientId ?? 'missing-ios-client-id',
    webClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;

      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (user: GoogleUser) => {
    if (!user.email) {
      Alert.alert(
        'Login Ditolak',
        'Email Google tidak ditemukan.',
        [{ text: 'Coba Lagi', onPress: () => setGoogleAuthInProgress(false) }]
      );
      return;
    }

    const normalizedEmail = user.email.toLowerCase();

    if (!normalizedEmail.endsWith('@ciputra.ac.id')) {
      Alert.alert(
        'Login Ditolak',
        'Hanya akun UC Staff dengan domain @ciputra.ac.id yang dapat digunakan.',
        [{ text: 'Coba Lagi', onPress: () => setGoogleAuthInProgress(false) }]
      );
      return;
    }

    setGoogleAuthInProgress(false);

    await AsyncStorage.multiSet([
      ['isLoggedIn', 'true'],
      ['authProvider', 'google'],
      ['user', JSON.stringify({ ...user, email: normalizedEmail })],
    ]);

    router.replace('/(tabs)/dashboard');
  };

  const fetchUserInfo = async (token: string) => {
    try {
      const userResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!userResponse.ok) {
        throw new Error('Google userinfo request failed.');
      }

      const user: GoogleUser = await userResponse.json();

      await handleGoogleLogin(user);
    } catch (error) {
      setGoogleAuthInProgress(false);
      Alert.alert(
        'Error',
        'Gagal mengambil data akun Google.',
        [{ text: 'Coba Lagi', onPress: () => setGoogleAuthInProgress(false) }]
      );
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Harap isi email dan password.');
      return;
    }

    const normalizedEmail = email.toLowerCase();

    if (!normalizedEmail.endsWith('@ciputra.ac.id')) {
      Alert.alert(
        'Login Ditolak',
        'Gunakan email UC Staff dengan domain @ciputra.ac.id'
      );
      return;
    }

    setIsLoading(true);

    try {
      const loginResponse = await fetch(`${resolveApiBaseUrl()}/api/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const payload: BackendLoginPayload | null = await loginResponse
        .json()
        .catch(() => null);

      if (!loginResponse.ok) {
        throw new Error(payload?.message ?? 'Email atau password tidak valid.');
      }

      await AsyncStorage.multiSet([
        ['isLoggedIn', 'true'],
        ['authProvider', 'local'],
        [
          'user',
          JSON.stringify({
            id: payload?.user?.id,
            name: payload?.user?.name,
            email: payload?.user?.email ?? normalizedEmail,
          }),
        ],
      ]);

      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert(
        'Login Gagal',
        error instanceof Error ? error.message : 'Terjadi kesalahan saat login.'
      );
    } finally {
      setIsLoading(false);
    }
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
          Gunakan email dengan domain @ciputra.ac.id
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
          onPress={() => {
            if (!isGoogleConfigured) {
              Alert.alert(
                'Google Sign-In belum dikonfigurasi',
                'Isi client ID Google di app.json (extra.googleOauth).'
              );
              return;
            }

            setGoogleAuthInProgress(true);
            promptAsync();
          }}
          disabled={!request || googleAuthInProgress}
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
