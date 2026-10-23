import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Carols } from '@/api/endpoints';
import { Button, Card, ErrorState, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT } from '@/i18n';
import { daysUntil } from '@/lib/dates';
import { formatDay, formatTime, greetingKey } from '@/lib/format';
import { useMyServing, type ServingItem } from '@/lib/serving';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Brand, Fonts, Radius, Space, usePalette } from '@/theme';

/** Home of the team app: requests waiting for a reply, then everything coming up. */
export default function ScheduleScreen() {
  const { t } = useT();
  const { session, signOut } = useSession();
  const { data, error, loading, refreshing, refresh } = useMyServing();

  // Coming back from an assignment shows the reply straight away.
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (loading) return <Screen><Loading /></Screen>;
  if (error || !data) return <Screen><ErrorState message={error?.message ?? ''} onRetry={refresh} /></Screen>;

  // Removed from the team since signing in.
  if (data.teams.length === 0)
    return (
      <Screen>
        <View style={{ gap: Space.sm, marginTop: Space.xl }}>
          <T variant="title">{t('notOnTeamTitle')}</T>
          <T variant="muted">{t('notOnTeamBody', { church: session!.church.name })}</T>
        </View>
        <Button title={t('checkAgain')} onPress={refresh} />
        <Button title={t('signOut')} variant="ghost" onPress={signOut} />
      </Screen>
    );

  const pending = data.assignments.filter((a) => a.status === 'pending');
  const accepted = data.assignments.filter((a) => a.status === 'accepted');
  const declined = data.assignments.filter((a) => a.status === 'declined');
  const next = accepted[0];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ marginTop: Space.sm }}>
        <T variant="muted">{t(greetingKey())},</T>
        <T variant="title">{session!.member.firstName}</T>
        <T variant="caption">{t('signedInFor', { team: session!.team.name })}</T>
      </View>

      {next && <NextUp a={next} />}

      <CarolsCard />

      {pending.length > 0 && (
        <>
          <SectionHeader title={t('needsReply')} />
          {pending.map((a) => <Row key={a.id} a={a} />)}
        </>
      )}

      {accepted.length === 0 && pending.length === 0 ? (
        <Card>
          <T variant="muted">{t('noServing')}</T>
        </Card>
      ) : accepted.length > 1 ? (
        <>
          <SectionHeader title={t('comingUp')} />
          {accepted.slice(1).map((a) => <Row key={a.id} a={a} />)}
        </>
      ) : null}

      {declined.length > 0 && (
        <>
          <SectionHeader title={t('declinedList')} />
          {declined.map((a) => <Row key={a.id} a={a} />)}
        </>
      )}
    </Screen>
  );
}

function when(a: ServingItem, t: ReturnType<typeof useT>['t']) {
  const d = daysUntil(a.event.startsAt);
  return d <= 0 ? t('today') : d === 1 ? t('tomorrow') : t('inDays', { n: d });
}

/** Shows only in carol season, when the office has given this team some nights. */
function CarolsCard() {
  const c = usePalette();
  const { t } = useT();
  const { session } = useSession();
  const carols = useApi(() => Carols.mine(session!.team.id), [session!.team.id]);
  const nights = carols.data?.nights ?? [];
  if (nights.length === 0) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/carols')}>
      {({ pressed }) => (
        <Card style={[styles.row, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={[styles.date, { backgroundColor: Brand.saffron }]}>
            <Ionicons name="musical-notes" size={24} color={Brand.ink} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="bodyBold">{carols.data?.season?.name ?? t('carolsCard')}</T>
            <T variant="caption">{t('carolsCardBody', { n: nights.length })}</T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
        </Card>
      )}
    </Pressable>
  );
}

function NextUp({ a }: { a: ServingItem }) {
  const { t, locale } = useT();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/assignment/${a.id}`)} style={({ pressed }) => [styles.hero, { opacity: pressed ? 0.9 : 1 }]}>
      <T style={styles.eyebrow}>
        {t('nextUp')} · {when(a, t)}
      </T>
      <T style={styles.heroTitle}>{a.event.title}</T>
      <T style={styles.heroMeta}>
        {formatDay(a.event.startsAt, locale)} · {formatTime(a.event.startsAt, locale)}
        {a.event.location ? ` · ${a.event.location}` : ''}
      </T>
      <View style={styles.rolePill}>
        <T style={styles.roleText}>{a.positionName}</T>
      </View>
    </Pressable>
  );
}

function Row({ a }: { a: ServingItem }) {
  const c = usePalette();
  const { t, locale } = useT();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/assignment/${a.id}`)}>
      {({ pressed }) => (
        <Card style={[styles.row, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={[styles.date, { backgroundColor: c.tint }]}>
            <T style={[styles.dateNum, { color: c.primary }]}>{new Date(a.event.startsAt).getDate()}</T>
            <T variant="caption">{new Date(a.event.startsAt).toLocaleDateString(locale, { month: 'short' })}</T>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="bodyBold" numberOfLines={1}>
              {a.event.title}
            </T>
            <T variant="caption">
              {a.positionName} · {formatTime(a.event.startsAt, locale)} · {when(a, t)}
            </T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Brand.pasture, borderRadius: Radius.lg, padding: Space.lg, gap: 6 },
  eyebrow: { fontFamily: Fonts.displayMedium, fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', color: Brand.mint },
  heroTitle: { fontFamily: Fonts.displayBold, fontSize: 24, lineHeight: 30, color: '#FFFFFF' },
  heroMeta: { fontFamily: Fonts.body, fontSize: 15, color: '#E8F3F0' },
  rolePill: { alignSelf: 'flex-start', backgroundColor: Brand.saffron, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: Space.xs },
  roleText: { fontFamily: Fonts.displayMedium, fontSize: 14, color: Brand.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  date: { width: 48, height: 52, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  dateNum: { fontFamily: Fonts.displayBold, fontSize: 20, lineHeight: 22 },
});
