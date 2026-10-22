import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { isUsingMocks } from '@/lib/config';
import { Fonts, Radius, Space, usePalette } from '@/theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'bodyBold' | 'muted' | 'caption' | 'label';

export function T({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  const c = usePalette();
  const color = variant === 'muted' || variant === 'caption' ? c.textMuted : c.text;
  return <Text style={[{ color }, text[variant], style]} {...rest} />;
}

const text = StyleSheet.create({
  title: { fontFamily: Fonts.displayBold, fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: Fonts.display, fontSize: 22, lineHeight: 28 },
  subheading: { fontFamily: Fonts.display, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: Fonts.body, fontSize: 16, lineHeight: 23 },
  bodyBold: { fontFamily: Fonts.bodyBold, fontSize: 16, lineHeight: 23 },
  muted: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: Fonts.displayMedium, fontSize: 13, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' },
});

export function Screen({
  children,
  refreshing,
  onRefresh,
  scroll = true,
  edges = ['top'],
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
}) {
  const c = usePalette();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.primary} /> : undefined}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, { flex: 1 }]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.background }}>
      {isUsingMocks() && <DemoBanner />}
      {body}
    </SafeAreaView>
  );
}

function DemoBanner() {
  const c = usePalette();
  const { t } = useT();
  return (
    <View style={[styles.banner, { backgroundColor: c.accent }]}>
      <T variant="caption" style={{ color: c.onAccent, textAlign: 'center' }}>
        {t('demoBanner')}
      </T>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...rest
}: PressableProps & { title: string; variant?: 'primary' | 'accent' | 'secondary' | 'ghost'; loading?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  const bg = { primary: c.primary, accent: c.accent, secondary: c.tint, ghost: 'transparent' }[variant];
  const fg = { primary: c.onPrimary, accent: c.onAccent, secondary: c.text, ghost: c.primary }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
      {...rest}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { backgroundColor: selected ? c.primary : c.card, borderColor: selected ? c.primary : c.border }]}>
      <Text style={[styles.chipText, { color: selected ? c.onPrimary : c.text }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <T variant="label">{title}</T>
      {action}
    </View>
  );
}

export function Loading() {
  const c = usePalette();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useT();
  return (
    <View style={[styles.center, { gap: Space.md }]}>
      <T variant="subheading">{t('somethingWrong')}</T>
      <T variant="muted" style={{ textAlign: 'center' }}>
        {message}
      </T>
      <Button title={t('retry')} variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: Space.md, paddingBottom: Space.xxl, gap: Space.md },
  banner: { paddingVertical: 6, paddingHorizontal: Space.md },
  card: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, padding: Space.md, gap: Space.sm },
  button: { minHeight: 50, borderRadius: Radius.pill, paddingHorizontal: Space.lg, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.display, fontSize: 16 },
  chip: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontFamily: Fonts.displayMedium, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl, minHeight: 240 },
});
