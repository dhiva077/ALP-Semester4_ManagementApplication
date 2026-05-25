import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

export default function RootLayout() {
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const hideWithDelay = (delayMs: number) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = setTimeout(() => {
        NavigationBar.setVisibilityAsync('hidden');
      }, delayMs);
    };

    NavigationBar.setBehaviorAsync('overlay-swipe');
    NavigationBar.setPositionAsync('absolute');
    NavigationBar.setBackgroundColorAsync('transparent');

    hideWithDelay(0);

    const subscription = NavigationBar.addVisibilityListener(({ visibility }) => {
      if (visibility === 'visible') {
        hideWithDelay(2000);
      }
    });

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      subscription.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/welcome" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}