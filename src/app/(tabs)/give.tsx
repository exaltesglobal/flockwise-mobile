import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Giving } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import type { GiveFrequency } from '@/api/types';
import { ListLink } from '@/components/list-link';
import { Button, Card, Chip, ErrorState, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT } from '@/i18n';
import { isUsingMocks } from '@/lib/config';
import { formatDay, formatMoney } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Fonts, Radius, Space, usePalette } from '@/theme';

const PRESETS = [50000, 100000, 250000, 500000]; // minor units: ₹500, ₹1,000, ...

export default function GiveScreen() {
  const c = usePalette();
  const { t, locale } = useT();
  const { session } = useSession();
  const church = session!.church;
  const funds = useApi(Giving.funds);
  const history = useApi(() => Giving.history());

  const [fundId, setFundId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(PRESETS[1]);
  const [custom, setCustom] = useState('');
  const [frequency, setFrequency] = useState<GiveFrequency>('once');
  const [indianCitizen, setIndianCitizen] = useState(true);
  const [pan, setPan] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedFund = fundId ?? funds.data?.[0]?.id ?? null;
  const isIndia = church.country === 'IN';
  const value = custom ? Math.round(Number(custom.replace(/[^\d.]/g, '')) * 100) : amount;

  async function give() {
    if (!selectedFund || !value) return;
    setBusy(true);
    try {
      const intent = await Giving.createIntent({
        fundId: selectedFund,
        amount: value,
        currency: church.currency,
        frequency,
        donorCitizenship: indianCitizen ? 'IN' : 'OTHER',
        pan: pan.trim() || undefined,
      });
      // The backend creates a hosted Razorpay/Stripe checkout on the church's own account.
      if (!isUsingMocks()) await WebBrowser.openBrowserAsync(intent.checkoutUrl);
      Alert.alert(t('thankYou'));
      history.refresh();
    } catch (e) {
      Alert.alert(t('somethingWrong'), e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen refreshing={funds.refreshing} onRefresh={() => (funds.refresh(), history.refresh())}>
      <T variant="title">{t('giveTitle')}</T>
      <T variant="muted">{t('giveBody', { church: church.name })}</T>

      {funds.loading ? (
        <Loading />
      ) : funds.error ? (
        <ErrorState message={funds.error.message} onRetry={funds.refresh} />
      ) : (
        <>
          <SectionHeader title={t('fund')} />
          <View style={styles.wrap}>
            {funds.data?.map((f) => (
              <Chip key={f.id} label={f.name} selected={f.id === selectedFund} onPress={() => setFundId(f.id)} />
            ))}
          </View>
          {funds.data?.find((f) => f.id === selectedFund)?.taxDeductible && isIndia && (
            <T variant="caption">✓ {t('taxDeductible')} (80G)</T>
          )}

          <SectionHeader title={t('amount')} />
          <View style={styles.wrap}>
            {PRESETS.map((p) => (
              <Chip
                key={p}
                label={formatMoney(p, church.currency, locale)}
                selected={!custom && amount === p}
                onPress={() => {
                  setCustom('');
                  setAmount(p);
                }}
              />
            ))}
          </View>
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
            placeholder={`${t('amount')} (${church.currency})`}
            placeholderTextColor={c.textMuted}
            keyboardType="decimal-pad"
            value={custom}
            onChangeText={setCustom}
          />

          <View style={styles.wrap}>
            <Chip label={t('once')} selected={frequency === 'once'} onPress={() => setFrequency('once')} />
            <Chip label={t('monthly')} selected={frequency === 'monthly'} onPress={() => setFrequency('monthly')} />
          </View>

          {isIndia && (
            <Card>
              <View style={styles.switchRow}>
                <T variant="bodyBold" style={{ flex: 1 }}>
                  {t('citizenship')}
                </T>
                <Switch value={indianCitizen} onValueChange={setIndianCitizen} trackColor={{ true: c.primary }} />
              </View>
              <T variant="caption">{t('citizenshipHelp')}</T>
              <TextInput
                style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.background }]}
                placeholder={t('pan')}
                placeholderTextColor={c.textMuted}
                autoCapitalize="characters"
                maxLength={10}
                value={pan}
                onChangeText={setPan}
              />
            </Card>
          )}

          <Button
            title={t('giveNow', { amount: value ? formatMoney(value, church.currency, locale) : '' })}
            variant="accent"
            onPress={give}
            loading={busy}
            disabled={!value || !selectedFund}
          />
          <T variant="caption">{frequency === 'monthly' ? t('monthlyNote') : t('checkoutNote')}</T>
        </>
      )}

      <SectionHeader title={t('quickLinks')} />
      <ListLink href="/member/pledges" icon="flag-outline" title={t('pledges')} subtitle={t('makePledge')} />
      {isIndia && <ListLink href="/member/statement" icon="document-text-outline" title={t('statementTitle')} subtitle={t('printStatement')} />}

      <SectionHeader title={t('givingHistory')} />
      {history.data?.data.map((d) => (
        <Card key={d.id} style={styles.historyRow}>
          <View style={{ flex: 1 }}>
            <T variant="bodyBold">{d.fundName}</T>
            <T variant="caption">
              {formatDay(d.createdAt, locale)} · {t(d.frequency === 'monthly' ? 'monthly' : 'once')}
            </T>
          </View>
          <T variant="subheading">{formatMoney(d.amount, d.currency, locale)}</T>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, height: 50, fontSize: 16, fontFamily: Fonts.body },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
});
