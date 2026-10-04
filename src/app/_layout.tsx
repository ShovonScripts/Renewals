import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useStore } from '@/store/store';
import { startNotificationSync } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hasHydrated = useStore((state) => state.hasHydrated);
  const themeSetting = useStore((state) => state.settings.theme);

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [hasHydrated]);

  useEffect(() => {
    startNotificationSync();
  }, []);

  const isDark = themeSetting === 'dark' || (themeSetting === 'system' && colorScheme === 'dark');

  if (!hasHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item/new" options={{ presentation: 'modal', headerShown: true, title: 'Add Item' }} />
        <Stack.Screen name="item/[id]" options={{ headerShown: true, title: 'Item Details' }} />
        <Stack.Screen name="item/[id]/edit" options={{ presentation: 'modal', headerShown: true, title: 'Edit Item' }} />
        <Stack.Screen name="renew/[id]" options={{ presentation: 'modal', headerShown: true, title: 'Mark as Renewed' }} />
        <Stack.Screen name="backup" options={{ headerShown: true, title: 'Backup & Restore' }} />
        <Stack.Screen name="help-reminders" options={{ headerShown: true, title: 'Not Getting Reminders?' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
