import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Giving } from '@/api/endpoints';
import { Button, Card, Chip, ErrorState, Field, FormError, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT } from '@/i18n';
import { isIsoDate } from '@/lib/dates';
import { formatDay, formatMoney } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Radius, Space, usePalette } from '@/theme';

// Financial year end (31 March) as the default pledge deadline.
function yearEnd() {
  const d = new Date();
  const y = d.getMonth() >= 3 ? d.getFullYear() + 1 : d.getFullYear();
  return `${y}-03-31`;
}

export default function PledgesScreen() {
  const { t, locale } = useT();
  const c = usePalette();
  const { session } = useSession();
  const currency = session!.church.currency;
  const pledges = useApi(Giving.pledges);
  const funds = useApi(Giving.funds);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ fundId: '', amount: '', endDate: yearEnd() });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const fundId = form.fundId || funds.data?.[0]?.id || '';
  const amount = Math.round(Number(form.amount.replace(/[^\d.]/g, '')) * 100);
  const valid = !!fundId && amount > 0 && isIsoDate(form.endDate);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await Giving.createPledge({ fundId, amount, endDate: form.endDate });
      setAdding(false);
      setForm({ fundId: '', amount: '', endDate: yearEnd() });
      pledges.refresh();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={[]} refreshing={pledges.refreshing} onRefresh={pledges.refresh}>
      <Stack.Screen options={{ title: t('pledges') }} />
      <SectionHeader
        title={t('pledges')}
        action={
          !adding ? (
            <Pressable onPress={() => setAdding(true)}>
              <T variant="bodyBold" style={{ color: c.primary }}>
                + {t('makePledge')}
              </T>
            </Pressable>
          ) : undefined
        }
      />
      {adding && (
        <Card>
          <T variant="caption">{t('fund')}</T>
          <View style={styles.wrap}>
            {funds.data?.map((f) => (
              <Chip key={f.id} label={f.name} selected={f.id === fundId} onPress={() => setForm({ ...form, fundId: f.id })} />
            ))}
          </View>
          <Field value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} placeholder={`${t('amount')} (${currency})`} keyboardType="decimal-pad" />
          <T variant="caption">{t('completeBy')}</T>
          <Field value={form.endDate} onChangeText={(v) => setForm({ ...form, endDate: v })} placeholder="YYYY-MM-DD" />
          <FormError error={err} />
          <View style={styles.wrap}>
            <Button title={t('save')} onPress={save} loading={busy} disabled={!valid} style={{ flex: 1 }} />
            <Button title={t('cancel')} variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
          </View>
        </Card>
      )}
      {pledges.loading ? (
        <Loading />
      ) : pledges.error ? (
        <ErrorState message={pledges.error.message} onRetry={pledges.refresh} />
      ) : (
        pledges.data?.map((p) => {
          const pct = Math.min(1, p.amount ? p.given / p.amount : 0);
          return (
            <Card key={p.id}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <T variant="subheading">{p.fundName}</T>
                  <T variant="caption">
                    {t('completeBy')} {formatDay(p.endDate, locale)}
                  </T>
                </View>
                <Pressable
                  accessibilityLabel={t('remove')}
                  onPress={() =>
                    Alert.alert(t('remove'), p.fundName, [
                      { text: t('cancel'), style: 'cancel' },
                      {
                        text: t('remove'),
                        style: 'destructive',
                        onPress: async () => {
                          await Giving.deletePledge(p.id);
                          pledges.refresh();
                        },
                      },
                    ])
                  }>
                  <Ionicons name="trash-outline" size={18} color={c.danger} />
                </Pressable>
              </View>
              <View style={[styles.track, { backgroundColor: c.tint }]}>
                <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: c.accent }]} />
              </View>
              <T variant="caption">
                {t('pledgeProgress', { given: formatMoney(p.given, p.currency, locale), amount: formatMoney(p.amount, p.currency, locale) })}
              </T>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  track: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
