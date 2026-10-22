import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Home } from '@/api/endpoints';
import { EventCard } from '@/components/event-card';
import { Button, Card, ErrorState, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT } from '@/i18n';
import { formatDay, formatTime, greetingKey } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Brand, Fonts, Radius, Space } from '@/theme';

export default function HomeScreen() {
  const { t, locale } = useT();
  const { session } = useSession();
  const { data, error, loading, refreshing, refresh } = useApi(Home.feed);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <T variant="muted">{session?.church.name}</T>
          <T variant="title">
            {t(greetingKey())}, {session?.member.firstName}
          </T>
        </View>
        <Image source={require('@/assets/brand/mark-color.png')} style={styles.mark} contentFit="contain" />
      </View>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : data ? (
        <>
          {data.nextService && (
            <View style={styles.service}>
              <T style={styles.serviceLabel}>{t('nextService')}</T>
              <T style={styles.serviceTitle}>{data.nextService.title}</T>
              <T style={styles.serviceMeta}>
                {formatDay(data.nextService.startsAt, locale)} · {formatTime(data.nextService.startsAt, locale)} · {data.nextService.location}
              </T>
              <Link href={{ pathname: '/event/[id]', params: { id: data.nextService.id } }} asChild>
                <Button title={data.nextService.myRsvp === 'going' ? `✓ ${t('going')}` : t('imGoing')} variant="accent" style={{ marginTop: Space.sm }} />
              </Link>
            </View>
          )}

          {data.announcements.length > 0 && <SectionHeader title={t('announcements')} />}
          {data.announcements.map((a) => (
            <Card key={a.id}>
              <T variant="subheading">{a.title}</T>
              <T variant="muted">{a.body}</T>
            </Card>
          ))}

          <SectionHeader
            title={t('upcoming')}
            action={
              <Link href="/events">
                <T variant="bodyBold" style={{ color: Brand.pasture }}>
                  {t('seeAll')}
                </T>
              </Link>
            }
          />
          {data.upcomingEvents.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.sm },
  mark: { width: 40, height: 40 },
  service: { backgroundColor: Brand.pasture, borderRadius: Radius.lg, padding: Space.lg, gap: 4 },
  serviceLabel: { fontFamily: Fonts.displayMedium, fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: Brand.mint },
  serviceTitle: { fontFamily: Fonts.displayBold, fontSize: 24, lineHeight: 30, color: '#FFFFFF' },
  serviceMeta: { fontFamily: Fonts.body, fontSize: 15, color: '#E3EFEC' },
});
