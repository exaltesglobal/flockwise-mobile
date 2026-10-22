import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Space, usePalette } from '@/theme';

import { T } from './ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** A tappable row with an icon, used on Me. */
export function ListLink({ href, icon, title, subtitle }: { href: Href; icon: IconName; title: string; subtitle?: string }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.row, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}>
        <View style={[styles.icon, { backgroundColor: c.tint }]}>
          <Ionicons name={icon} size={20} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <T variant="bodyBold">{title}</T>
          {subtitle ? <T variant="caption">{subtitle}</T> : null}
        </View>
      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.md, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
