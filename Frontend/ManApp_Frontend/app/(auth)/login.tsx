import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import useLoginViewModel from '../../src/viewmodels/useLoginViewModel';

export default function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    showPassword,
    togglePasswordVisibility,
    handleLogin,
  } = useLoginViewModel();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome ManApp</Text>

        <Text style={styles.subtitle}>
          Booking Venue Universitas Ciputra Makassar
        </Text>

        <Text style={styles.signInText}>
          Sign In to your UC Account
        </Text>

        {/* EMAIL */}
        <View style={styles.inputWrapper}>
          <Ionicons
            name="mail-outline"
            size={18}
            color="#5C2C00"
          />

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

        {/* PASSWORD */}
        <View style={styles.inputWrapper}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color="#5C2C00"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#5C2C00"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={
                showPassword
                  ? 'eye-outline'
                  : 'eye-off-outline'
              }
              size={18}
              color="#5C2C00"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.infoSubText}>
          Gunakan email dengan domain
          @staffPM.ciputra.ac.id
        </Text>

        {/* BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Lanjutkan
            </Text>
          )}
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
});