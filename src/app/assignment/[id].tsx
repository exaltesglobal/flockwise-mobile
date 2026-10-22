import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Serving } from '@/api/endpoints';
import type { PlanItem } from '@/api/types';
import { Badge, Button, Card, ErrorState, Field, FormError, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT, type StringKey } from '@/i18n';
import { formatDay, formatTime } from '@/lib/format';
import { useMyServing, type ServingItem } from '@/lib/serving';
import { Fonts, Radius, Space, usePalette } from '@/theme';

/** One assignment: where and when, the reply, and the order of service once accepted. */
export default function AssignmentScreen() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, refresh, setData } = useMyServing();
  const a = data?.assignments.find((x) => x.id === id);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: a?.event.title ?? '' }} />
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error?.message ?? ''} onRetry={refresh} />
      ) : !a ? (
        <T variant="muted">{t('noServing')}</T>
      ) : (
        <Detail
          a={a}
          onChanged={async () => {
            // The plan only comes with accepted assignments, so reload rather than patch.
            const fresh = await Serving.mine(a.teamId).catch(() => null);
            if (fresh) setData(fresh);
          }}
        />
      )}
    </Screen>
  );
}

function Detail({ a, onChanged }: { a: ServingItem; onChanged: () => Promise<void> }) {
  const c = usePalette();
  const { t, locale } = useT();
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<unknown>(null);

  async function answer(status: 'accepted' | 'declined') {
    setBusy(status);
    setErr(null);
    try {
      await Serving.respond(a.id, status, status === 'declined' ? note.trim() || undefined : undefined);
      setDeclining(false);
      await onChanged();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <View style={{ gap: Space.xs }}>
        <T variant="title">{a.event.title}</T>
        <Info icon="calendar-outline" text={`${formatDay(a.event.startsAt, locale)} · ${formatTime(a.event.startsAt, locale)}`} />
        {a.event.location ? <Info icon="location-outline" text={a.event.location} /> : null}
      </View>

      <Card>
        <View style={styles.between}>
          <View style={{ flex: 1 }}>
            <T variant="label">{t('yourRole')}</T>
            <T variant="subheading">
              {a.positionName} · {a.teamName}
            </T>
          </View>
          {a.status === 'accepted' ? <Badge label={t('accepted')} tone="ok" /> : a.status === 'declined' ? <Badge label={t('declined')} /> : <Badge label={t('awaitingReply')} tone="warn" />}
        </View>
        {a.note ? <T variant="caption">{a.note}</T> : null}
        {declining && <Field value={note} onChangeText={setNote} placeholder={t('declineNote')} maxLength={300} multiline />}
        <FormError error={err} />
        <View style={styles.actions}>
          {declining ? (
            <>
              <Button title={t('decline')} variant="secondary" onPress={() => answer('declined')} loading={busy === 'declined'} style={{ flex: 1 }} />
              <Button title={t('cancel')} variant="ghost" onPress={() => setDeclining(false)} style={{ flex: 1 }} />
            </>
          ) : (
            <>
              {a.status !== 'accepted' && <Button title={t('accept')} onPress={() => answer('accepted')} loading={busy === 'accepted'} style={{ flex: 1 }} />}
              {a.status !== 'declined' && <Button title={t('decline')} variant="secondary" onPress={() => setDeclining(true)} style={{ flex: 1 }} />}
            </>
          )}
        </View>
      </Card>

      <SectionHeader
        title={t('orderOfService')}
        action={a.plan.length > 0 ? <T variant="caption">{t('totalMinutes', { n: a.plan.reduce((s, p) => s + p.minutes, 0) })}</T> : undefined}
      />
      {a.status !== 'accepted' ? (
        <Card>
          <T variant="muted">{t('runSheetLocked')}</T>
        </Card>
      ) : a.plan.length === 0 ? (
        <Card>
          <T variant="muted">{t('noRunSheet')}</T>
        </Card>
      ) : (
        <Card style={{ gap: 0, paddingVertical: Space.xs }}>
          {a.plan.map((p, i) => (
            <PlanRow key={p.id} p={p} n={i + 1} last={i === a.plan.length - 1} />
          ))}
        </Card>
      )}
      <View style={{ height: Space.lg }} />
      <T variant="caption" style={{ color: c.textMuted, textAlign: 'center' }}>
        {a.teamName}
      </T>
    </>
  );
}

const KIND: Record<PlanItem['kind'], StringKey | null> = {
  song: 'planSong',
  reading: 'planReading',
  sermon: 'planSermon',
  prayer: 'planPrayer',
  announcement: 'planAnnouncement',
  offering: 'planOffering',
  video: 'planVideo',
  other: null,
};

function PlanRow({ p, n, last }: { p: PlanItem; n: number; last: boolean }) {
  const c = usePalette();
  const { t } = useT();
  const kind = KIND[p.kind];
  return (
    <View style={[styles.planRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <T style={[styles.num, { color: c.textMuted }]}>{n}</T>
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="bodyBold">{p.title}</T>
        <T variant="caption">{[kind ? t(kind) : null, p.key ? `${t('planKey')} ${p.key}` : null, p.person || null].filter(Boolean).join(' · ')}</T>
        {p.arrangement?.length ? <T variant="caption">{p.arrangement.join(' → ')}</T> : null}
        {p.notes ? <T variant="caption" style={{ fontStyle: 'italic' }}>{p.notes}</T> : null}
      </View>
      {p.minutes ? (
        <View style={[styles.mins, { backgroundColor: c.tint }]}>
          <T variant="caption">{p.minutes}′</T>
        </View>
      ) : null}
    </View>
  );
}

function Info({ icon, text }: { icon: 'calendar-outline' | 'location-outline'; text: string }) {
  const c = usePalette();
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={16} color={c.textMuted} />
      <T variant="muted">{text}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  actions: { flexDirection: 'row', gap: Space.sm },
  info: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.md, paddingVertical: Space.sm },
  num: { fontFamily: Fonts.displayMedium, fontSize: 15, width: 20, textAlign: 'right', marginTop: 2 },
  mins: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
});
