import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ChurchEvent } from '@/api/types';
import { useT } from '@/i18n';
import { formatDay, formatTime } from '@/lib/format';
import { Fonts, Radius, Space, usePalette } from '@/theme';

import { Card, T } from './ui';

export function EventCard({ event }: { event: ChurchEvent }) {
  const c = usePalette();
  const { t, locale } = useT();
  const d = new Date(event.startsAt);
  return (
    <Link href={{ pathname: '/event/[id]', params: { id: event.id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card style={styles.row}>
          <View style={[styles.date, { backgroundColor: c.tint }]}>
            <T style={[styles.month, { color: c.primary }]}>{d.toLocaleDateString(locale, { month: 'short' })}</T>
            <T style={[styles.day, { color: c.primary }]}>{d.getDate()}</T>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="subheading">{event.title}</T>
            <T variant="muted">
              {formatDay(event.startsAt, locale)} · {formatTime(event.startsAt, locale)} · {event.location}
            </T>
            {event.myRsvp === 'going' && (
              <T variant="caption" style={{ color: c.primary, fontFamily: Fonts.bodyBold }}>
                ✓ {t('going')}
              </T>
            )}
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  date: { width: 56, height: 60, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  month: { fontFamily: Fonts.displayMedium, fontSize: 12, textTransform: 'uppercase' },
  day: { fontFamily: Fonts.displayBold, fontSize: 22, lineHeight: 26 },
});
