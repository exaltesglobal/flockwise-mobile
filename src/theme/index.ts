// Flockwise brand tokens. Source: branding kit "03 Colours" (Flockwise-Colours.json).
import { useColorScheme } from 'react-native';

export const Brand = {
  pasture: '#1F6B5C',
  saffron: '#F2A93B',
  ink: '#14211F',
  mist: '#F4F7F6',
  mint: '#8FD6C2',
  deepPasture: '#0F3F36',
} as const;

const light: Record<
  'background' | 'card' | 'text' | 'textMuted' | 'border' | 'primary' | 'onPrimary' | 'accent' | 'onAccent' | 'tint' | 'danger',
  string
> = {
  background: Brand.mist,
  card: '#FFFFFF',
  text: Brand.ink,
  textMuted: '#5B6B68',
  border: '#DDE5E3',
  primary: Brand.pasture,
  onPrimary: '#FFFFFF',
  accent: Brand.saffron,
  onAccent: Brand.ink,
  tint: '#E3EFEC',
  danger: '#B42318',
};

const dark: typeof light = {
  background: Brand.ink,
  card: '#1C2C29',
  text: '#EEF4F2',
  textMuted: '#9FB3AE',
  border: '#2A3D39',
  primary: Brand.mint,
  onPrimary: Brand.ink,
  accent: Brand.saffron,
  onAccent: Brand.ink,
  tint: '#203A35',
  danger: '#F97066',
};

export const Colors = { light, dark };
export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

// Font family names match the .ttf file names registered by the expo-font plugin.
export const Fonts = {
  display: 'Outfit-SemiBold',
  displayBold: 'Outfit-Bold',
  displayMedium: 'Outfit-Medium',
  body: 'SourceSans3-Regular',
  bodyBold: 'SourceSans3-SemiBold',
} as const;

export const Space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const Radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
