import type { ExpoConfig, ConfigContext } from 'expo/config';

// The backend URL is read at build time. Set EXPO_PUBLIC_API_URL in .env (local)
// or in eas.json (cloud builds). Until the Hostinger backend is live, leave
// EXPO_PUBLIC_USE_MOCKS=true and the app runs on built-in demo data.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.flockwise.church/v1';
const USE_MOCKS = (process.env.EXPO_PUBLIC_USE_MOCKS ?? 'true') === 'true';
const APP_ENV = process.env.APP_ENV ?? 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_ENV === 'production' ? 'Flockwise Team' : `Flockwise Team (${APP_ENV})`,
  slug: 'flockwise',
  owner: process.env.EXPO_OWNER,
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'flockwise',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'church.flockwise.app',
    supportsTablet: true,
    associatedDomains: ['applinks:flockwise.church'],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'church.flockwise.app',
    adaptiveIcon: {
      backgroundColor: '#1F6B5C',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-notifications', { color: '#1F6B5C' }],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Outfit-Regular.ttf',
          './assets/fonts/Outfit-Medium.ttf',
          './assets/fonts/Outfit-SemiBold.ttf',
          './assets/fonts/Outfit-Bold.ttf',
          './assets/fonts/SourceSans3-Regular.ttf',
          './assets/fonts/SourceSans3-SemiBold.ttf',
        ],
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#1F6B5C',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
        dark: { backgroundColor: '#0F3F36', image: './assets/images/splash-icon.png' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: API_URL,
    useMocks: USE_MOCKS,
    appEnv: APP_ENV,
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
