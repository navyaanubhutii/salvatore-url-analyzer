import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent splash screen from auto-hiding before app is ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash after a short delay to ensure first frame is painted
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0b1120' },
        }}
      />
      <StatusBar style="light" translucent />
    </SafeAreaProvider>
  );
}