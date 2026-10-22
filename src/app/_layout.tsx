import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { SessionProvider, useSession } from '@/lib/session';
import { Colors, Fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': require('@/assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Medium': require('@/assets/fonts/Outfit-Medium.ttf'),
    'Outfit-SemiBold': require('@/assets/fonts/Outfit-SemiBold.ttf'),
    'Outfit-Bold': require('@/assets/fonts/Outfit-Bold.ttf'),
    'SourceSans3-Regular': require('@/assets/fonts/SourceSans3-Regular.ttf'),
    'SourceSans3-SemiBold': require('@/assets/fonts/SourceSans3-SemiBold.ttf'),
  });

  return (
    <SessionProvider>
      <RootNavigator fontsLoaded={fontsLoaded} />
    </SessionProvider>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const scheme = useColorScheme();
  const { status, session } = useSession();
  const ready = fontsLoaded && status !== 'loading';
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, primary: c.primary, background: c.background, card: c.card, text: c.text, border: c.border },
      }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerTintColor: c.primary,
          headerTitleStyle: { fontFamily: Fonts.display, color: c.text },
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={status === 'signedIn' && !session?.mustChangePassword}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="assignment/[id]" options={{ title: '', headerBackTitle: ' ' }} />
          <Stack.Screen name="settings/server" options={{ title: 'Server', presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="settings/password" options={{ title: '', headerBackTitle: ' ' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
