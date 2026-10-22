import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Giving } from '@/api/endpoints';
import { Badge, Button, Card, Chip, ErrorState, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { financialYear } from '@/lib/dates';
import { formatDay, formatMoney } from '@/lib/format';
import { shareStatementPdf } from '@/lib/statement-pdf';
import { useApi } from '@/lib/use-api';
import { Space } from '@/theme';

export default function StatementScreen() {
  const { t, locale } = useT();
  const current = financialYear();
  const previous = financialYear(new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1));
  const [fy, setFy] = useState(current);
  const { data, error, loading, refresh } = useApi(() => Giving.statement(fy), [fy]);
  const [busy, setBusy] = useState(false);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t('statementTitle') }} />
      <View style={styles.row}>
        <Chip label={`FY ${current}`} selected={fy === current} onPress={() => setFy(current)} />
        <Chip label={`FY ${previous}`} selected={fy === previous} onPress={() => setFy(previous)} />
      </View>
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error?.message ?? ''} onRetry={refresh} />
      ) : (
        <>
          <T variant="muted">{t('statementBody', { year: data.financialYear })}</T>
          <View style={styles.row}>
            <Card style={{ flex: 1 }}>
              <T variant="caption">{t('total')}</T>
              <T variant="heading">{formatMoney(data.total, data.currency, locale)}</T>
            </Card>
            <Card style={{ flex: 1 }}>
              <T variant="caption">{t('eligible80g')}</T>
              <T variant="heading">{formatMoney(data.eligible80g, data.currency, locale)}</T>
            </Card>
          </View>
          {data.gifts.map((g) => (
            <Card key={g.id} style={styles.gift}>
              <View style={{ flex: 1, gap: 2 }}>
                <T variant="bodyBold">{g.fundName}</T>
                <T variant="caption">
                  {formatDay(g.date, locale)}
                  {g.receiptNumber ? ` · ${g.receiptNumber}` : ''}
                </T>
                {g.eligible80g && <Badge label="80G" tone="ok" />}
              </View>
              <T variant="subheading">{formatMoney(g.amount, data.currency, locale)}</T>
            </Card>
          ))}
          <Button
            title={t('printStatement')}
            variant="secondary"
            disabled={!data.gifts.length}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await shareStatementPdf(data);
              } catch (e) {
                Alert.alert(t('somethingWrong'), String(e));
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' },
  gift: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
});
