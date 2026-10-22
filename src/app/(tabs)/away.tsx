import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Serving } from '@/api/endpoints';
import { Button, Card, ErrorState, Field, FormError, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT } from '@/i18n';
import { addDays, isIsoDate, isoDate } from '@/lib/dates';
import { formatDay } from '@/lib/format';
import { useMyServing } from '@/lib/serving';
import { Space, usePalette } from '@/theme';

/** Dates the person can't serve. Schedulers see a warning and the auto-fill skips them. */
export default function AwayScreen() {
  const c = usePalette();
  const { t, locale } = useT();
  const { data, error, loading, refreshing, refresh } = useMyServing();
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
      refresh();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ gap: Space.xs, marginTop: Space.sm }}>
        <T variant="title">{t('blockouts')}</T>
        <T variant="muted">{t('awayBody')}</T>
      </View>

      {adding ? (
        <Card>
          <View style={styles.pair}>
            <View style={{ flex: 1, gap: 4 }}>
              <T variant="caption">{t('from')}</T>
              <Field value={form.from} onChangeText={(from) => setForm({ ...form, from })} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <T variant="caption">{t('to')}</T>
              <Field value={form.to} onChangeText={(to) => setForm({ ...form, to })} placeholder="YYYY-MM-DD" />
            </View>
          </View>
          <Field value={form.reason} onChangeText={(reason) => setForm({ ...form, reason })} placeholder={t('reasonOptional')} maxLength={120} />
          <FormError error={err} />
          <View style={styles.pair}>
            <Button title={t('save')} onPress={save} loading={busy} disabled={!valid} style={{ flex: 1 }} />
            <Button title={t('cancel')} variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Button title={`+ ${t('addBlockout')}`} variant="secondary" onPress={() => setAdding(true)} />
      )}

      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error?.message ?? ''} onRetry={refresh} />
      ) : data.blockouts.length > 0 ? (
        <>
          <SectionHeader title={t('comingUp')} />
          {data.blockouts.map((b) => (
            <Card key={b.id} style={styles.row}>
              <Ionicons name="airplane-outline" size={18} color={c.textMuted} />
              <View style={{ flex: 1 }}>
                <T variant="bodyBold">
                  {formatDay(b.from, locale)}
                  {b.to !== b.from ? ` – ${formatDay(b.to, locale)}` : ''}
                </T>
                {b.reason ? <T variant="caption">{b.reason}</T> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('remove')}
                hitSlop={10}
                onPress={async () => {
                  await Serving.deleteBlockout(b.id);
                  refresh();
                }}>
                <Ionicons name="trash-outline" size={18} color={c.danger} />
              </Pressable>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: Space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});
