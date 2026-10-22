import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Serving } from '@/api/endpoints';
import type { MyServing } from '@/api/types';
import { Badge, Button, Card, ErrorState, Field, FormError, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT } from '@/i18n';
import { addDays, isIsoDate, isoDate } from '@/lib/dates';
import { formatDay, formatTime } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { Space, usePalette } from '@/theme';

type Item = MyServing['assignments'][number];

export default function ServingScreen() {
  const { t } = useT();
  const { data, error, loading, refreshing, refresh } = useApi(Serving.mine);
  return (
    <Screen edges={[]} refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: t('tabServing') }} />
      <T variant="muted">{t('servingBody')}</T>
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error?.message ?? ''} onRetry={refresh} />
      ) : (
        <>
          {data.assignments.length === 0 ? (
            <Card>
              <T variant="muted">{t('noServing')}</T>
            </Card>
          ) : (
            data.assignments.map((a) => <AssignmentCard key={a.id} a={a} onChanged={refresh} />)
          )}
          {data.teams.length > 0 && (
            <>
              <SectionHeader title={t('myTeams')} />
              <Card>
                {data.teams.map((team) => (
                  <View key={team.id}>
                    <T variant="bodyBold">{team.name}</T>
                    <T variant="caption">{team.positions.join(', ')}</T>
                  </View>
                ))}
              </Card>
            </>
          )}
          <Blockouts items={data.blockouts} onChanged={refresh} />
        </>
      )}
    </Screen>
  );
}

function AssignmentCard({ a, onChanged }: { a: Item; onChanged: () => void }) {
  const { t, locale } = useT();
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<unknown>(null);

  async function answer(status: 'accepted' | 'declined') {
    setBusy(status);
    setErr(null);
    try {
      await Serving.respond(a.id, status);
      onChanged();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <T variant="subheading">
            {a.teamName} · {a.positionName}
          </T>
          <T variant="caption">
            {a.event.title} · {formatDay(a.event.startsAt, locale)}, {formatTime(a.event.startsAt, locale)}
          </T>
        </View>
        {a.status === 'accepted' ? (
          <Badge label={t('accepted')} tone="ok" />
        ) : a.status === 'declined' ? (
          <Badge label={t('declined')} />
        ) : (
          <Badge label={t('awaitingReply')} tone="warn" />
        )}
      </View>
      <FormError error={err} />
      <View style={styles.actions}>
        {a.status !== 'accepted' && <Button title={t('accept')} onPress={() => answer('accepted')} loading={busy === 'accepted'} style={{ flex: 1 }} />}
        {a.status !== 'declined' && <Button title={t('decline')} variant="secondary" onPress={() => answer('declined')} loading={busy === 'declined'} style={{ flex: 1 }} />}
      </View>
      {a.plan.length > 0 && (
        <Pressable onPress={() => setOpen(!open)} style={styles.planToggle}>
          <T variant="bodyBold" style={{ color: c.primary }}>
            {t('orderOfService')}
          </T>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.primary} />
        </Pressable>
      )}
      {open &&
        a.plan.map((p, i) => (
          <View key={p.id} style={styles.planRow}>
            <T variant="caption" style={{ width: 20 }}>
              {i + 1}.
            </T>
            <T style={{ flex: 1 }}>
              {p.title}
              {p.key ? ` · ${p.key}` : ''}
              {p.person ? ` · ${p.person}` : ''}
            </T>
            <T variant="caption">{p.minutes} min</T>
          </View>
        ))}
    </Card>
  );
}

function Blockouts({ items, onChanged }: { items: MyServing['blockouts']; onChanged: () => void }) {
  const { t, locale } = useT();
  const c = usePalette();
  const today = isoDate();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ from: today, to: addDays(today, 6), reason: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const valid = isIsoDate(form.from) && isIsoDate(form.to) && form.to >= form.from;

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await Serving.addBlockout({ from: form.from, to: form.to, reason: form.reason.trim() || undefined });
      setAdding(false);
      setForm({ from: today, to: addDays(today, 6), reason: '' });
      onChanged();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionHeader
        title={t('blockouts')}
        action={
          !adding ? (
            <Pressable onPress={() => setAdding(true)}>
              <T variant="bodyBold" style={{ color: c.primary }}>
                + {t('addBlockout')}
              </T>
            </Pressable>
          ) : undefined
        }
      />
      <T variant="caption">{t('blockoutsBody')}</T>
      {adding && (
        <Card>
          <View style={styles.actions}>
            <View style={{ flex: 1, gap: 4 }}>
              <T variant="caption">{t('from')}</T>
              <Field value={form.from} onChangeText={(from) => setForm({ ...form, from })} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <T variant="caption">{t('to')}</T>
              <Field value={form.to} onChangeText={(to) => setForm({ ...form, to })} placeholder="YYYY-MM-DD" />
            </View>
          </View>
          <Field value={form.reason} onChangeText={(reason) => setForm({ ...form, reason })} placeholder={t('reasonOptional')} />
          <FormError error={err} />
          <View style={styles.actions}>
            <Button title={t('save')} onPress={save} loading={busy} disabled={!valid} style={{ flex: 1 }} />
            <Button title={t('cancel')} variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
          </View>
        </Card>
      )}
      {items.map((b) => (
        <Card key={b.id} style={styles.headRow}>
          <Ionicons name="calendar-clear-outline" size={18} color={c.textMuted} />
          <View style={{ flex: 1 }}>
            <T variant="bodyBold">
              {formatDay(b.from, locale)}
              {b.to !== b.from ? ` – ${formatDay(b.to, locale)}` : ''}
            </T>
            {b.reason ? <T variant="caption">{b.reason}</T> : null}
          </View>
          <Pressable
            accessibilityLabel={t('remove')}
            onPress={async () => {
              await Serving.deleteBlockout(b.id);
              onChanged();
            }}>
            <Ionicons name="trash-outline" size={18} color={c.danger} />
          </Pressable>
        </Card>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  actions: { flexDirection: 'row', gap: Space.sm },
  planToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Space.xs },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});
