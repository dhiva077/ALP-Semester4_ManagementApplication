import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();

  const circleScale = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoTranslateX = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = async () => {
      console.log("🔥 SPLASH SCREEN");

      Animated.sequence([
        Animated.parallel([
          Animated.timing(circleScale, {
            toValue: 10,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1.2,
            duration: 2200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(logoTranslateX, {
            toValue: -60,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateX, {
            toValue: 40,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(async () => {
        setTimeout(() => {
          router.replace('/(auth)/welcome');
        }, 800);
      });
    };

    run();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          { transform: [{ scale: circleScale }] },
        ]}
      />

      <View style={styles.wrapper}>
        <Animated.Image
          source={require('../assets/images/logo-manapp.png')}
          style={[
            styles.logo,
            {
              transform: [
                { scale: logoScale },
                { translateX: logoTranslateX },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateX: textTranslateX }],
            },
          ]}
        >
          <Text style={styles.title}>Management</Text>
          <Text style={styles.subtitle}>Application</Text>
        </Animated.View>
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
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF8F29',
    top: height / 2 - 100,
    left: width / 2 - 100,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    zIndex: 10,
  },
  textContainer: {
    position: 'absolute',
    left: '2%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
});