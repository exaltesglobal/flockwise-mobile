import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Carols } from '@/api/endpoints';
import type { CarolNightView, CarolStop, CarolStopStatus } from '@/api/types';
import { Button, Card, Chip, ErrorState, Field, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT, type StringKey } from '@/i18n';
import { isoDate } from '@/lib/dates';
import { formatDay, formatMoney } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Brand, Fonts, Radius, Space, usePalette } from '@/theme';

const STATUSES: { status: CarolStopStatus; label: StringKey }[] = [
  { status: 'visited', label: 'statusVisited' },
  { status: 'not_home', label: 'statusNotHome' },
  { status: 'skipped', label: 'statusSkipped' },
];

/** The team's carol nights: homes in order with arrival times, marked at the door. */
export default function CarolsScreen() {
  const { t } = useT();
  const { session } = useSession();
  const teamId = session!.team.id;
  const carols = useApi(() => Carols.mine(teamId), [teamId]);

  if (carols.loading) return <Loading />;
  if (carols.error || !carols.data) return <ErrorState message={carols.error?.message ?? ''} onRetry={carols.refresh} />;
  const { season, nights } = carols.data;
  const today = isoDate();
  const upcoming = nights.filter((n) => n.date >= today);
  const past = nights.filter((n) => n.date < today).reverse();
  const replace = (next: CarolNightView) => carols.setData((d) => d && { ...d, nights: d.nights.map((n) => (n.id === next.id ? next : n)) });

  return (
    <Screen refreshing={carols.refreshing} onRefresh={carols.refresh} edges={[]}>
      <Stack.Screen options={{ title: season?.name ?? t('carolsTitle') }} />
      {nights.length === 0 && (
        <Card>
          <T variant="muted">{t('noCarols')}</T>
        </Card>
      )}
      {upcoming.map((n, i) => (
        <Night key={n.id} night={n} teamId={teamId} open={i === 0} today={n.date === today} onChange={replace} />
      ))}
      {past.length > 0 && <SectionHeader title={t('pastNights')} />}
      {past.map((n) => (
        <Night key={n.id} night={n} teamId={teamId} open={false} today={false} onChange={replace} />
      ))}
    </Screen>
  );
}

function Night({ night, teamId, open: startOpen, today, onChange }: { night: CarolNightView; teamId: string; open: boolean; today: boolean; onChange: (n: CarolNightView) => void }) {
  const c = usePalette();
  const { t, locale } = useT();
  const { session } = useSession();
  const [open, setOpen] = useState(startOpen);
  const currency = session!.church.currency;
  return (
    <View style={{ gap: Space.sm }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)}>
        <View style={[styles.nightHead, today && { backgroundColor: Brand.pasture }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <T style={[styles.nightTitle, today && { color: '#FFFFFF' }]}>
              {today ? t('tonight') : formatDay(`${night.date}T12:00:00`, locale)}
              {night.area ? ` · ${night.area}` : ''}
            </T>
            <T style={[styles.nightMeta, { color: today ? '#E8F3F0' : c.textMuted }]}>
              {[t('startsAt', { time: night.startTime }), t('homesDone', { done: night.visited, n: night.total }), night.offering ? t('offeringTotal', { amount: formatMoney(night.offering, currency, locale) }) : null]
                .filter(Boolean)
                .join(' · ')}
            </T>
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={today ? '#FFFFFF' : c.textMuted} />
        </View>
      </Pressable>
      {open && (
        <>
          {night.stops.length > 0 && <Button title={t('openMaps')} variant="secondary" onPress={() => Linking.openURL(night.mapsUrl)} />}
          {night.stops.map((s) => (
            <Stop key={s.familyKey} stop={s} night={night} teamId={teamId} currency={currency} onChange={onChange} />
          ))}
        </>
      )}
    </View>
  );
}

function Stop({ stop, night, teamId, currency, onChange }: { stop: CarolStop; night: CarolNightView; teamId: string; currency: string; onChange: (n: CarolNightView) => void }) {
  const c = usePalette();
  const { t, locale } = useT();
  const [amount, setAmount] = useState(stop.offering != null ? String(stop.offering / 100) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: { status?: CarolStopStatus; offering?: number | null }) {
    setBusy(true);
    setError(null);
    try {
      onChange(await Carols.updateStop(teamId, night.id, stop.familyKey, patch));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const rupees = amount.trim() === '' ? null : Number(amount.replace(/,/g, ''));
  const amountOk = rupees === null || (Number.isFinite(rupees) && rupees >= 0);
  const minor = rupees === null ? null : Math.round(rupees * 100);
  const done = stop.status !== 'planned';
  return (
    <Card style={done ? { opacity: 0.85 } : undefined}>
      <View style={styles.stopHead}>
        <View style={[styles.eta, { backgroundColor: done ? c.tint : Brand.saffron }]}>
          <T style={[styles.etaText, { color: Brand.ink }]}>{stop.eta}</T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="bodyBold">{stop.familyName}</T>
          {stop.address ? <T variant="caption">{stop.address}</T> : null}
        </View>
        {stop.phone ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('callHome')} hitSlop={8} onPress={() => Linking.openURL(`tel:${stop.phone}`)} style={[styles.call, { backgroundColor: c.tint }]}>
            <Ionicons name="call" size={18} color={c.primary} />
          </Pressable>
        ) : null}
      </View>
      {stop.note ? <T variant="caption">{stop.note}</T> : null}
      <View style={styles.statuses}>
        {STATUSES.map((s) => (
          <Chip key={s.status} label={t(s.label)} selected={stop.status === s.status} onPress={busy ? undefined : () => save({ status: stop.status === s.status ? 'planned' : s.status })} />
        ))}
      </View>
      {stop.status === 'visited' && (
        <View style={styles.offering}>
          <Field
            style={{ flex: 1 }}
            placeholder={t('offeringLabel')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            accessibilityLabel={t('offeringLabel')}
          />
          <Button title={t('save')} variant="secondary" disabled={!amountOk || minor === stop.offering} loading={busy} onPress={() => save({ offering: minor })} />
        </View>
      )}
      {stop.status === 'visited' && stop.offering != null && <T variant="caption">{t('offeringTotal', { amount: formatMoney(stop.offering, currency, locale) })}</T>}
      {error && <T style={{ color: c.danger }}>{error}</T>}
    </Card>
  );
}

const styles = StyleSheet.create({
  nightHead: { flexDirection: 'row', alignItems: 'center', gap: Space.md, borderRadius: Radius.md, padding: Space.md, backgroundColor: 'rgba(31,107,92,0.08)' },
  nightTitle: { fontFamily: Fonts.display, fontSize: 18 },
  nightMeta: { fontFamily: Fonts.body, fontSize: 14 },
  stopHead: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  eta: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 6, minWidth: 58, alignItems: 'center' },
  etaText: { fontFamily: Fonts.displayBold, fontSize: 15 },
  call: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statuses: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.xs },
  offering: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});
