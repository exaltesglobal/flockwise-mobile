import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Prayer } from '@/api/endpoints';
import type { PrayerView } from '@/api/types';
import { Badge, Button, Card, Chip, ErrorState, Field, FormError, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { relativeTime } from '@/lib/dates';
import { useApi } from '@/lib/use-api';
import { Space, usePalette } from '@/theme';

export default function PrayerScreen() {
  const { t, locale } = useT();
  const c = usePalette();
  const { data, setData, error, loading, refreshing, refresh } = useApi(() => Prayer.list());
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<'church' | 'pastors'>('church');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const replace = (p: PrayerView) => setData((prev) => (prev ? { ...prev, data: prev.data.map((x) => (x.id === p.id ? p : x)) } : prev));

  async function share() {
    setBusy(true);
    setErr(null);
    try {
      await Prayer.create(text.trim(), visibility);
      setText('');
      refresh();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={[]} refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: t('prayerTitle') }} />
      <T variant="muted">{t('prayerBody')}</T>
      <Card>
        <Field value={text} onChangeText={setText} placeholder={t('prayerPlaceholder')} multiline />
        <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' }}>
          <Chip label={t('visibilityChurch')} selected={visibility === 'church'} onPress={() => setVisibility('church')} />
          <Chip label={t('visibilityPastors')} selected={visibility === 'pastors'} onPress={() => setVisibility('pastors')} />
        </View>
        <FormError error={err} />
        <Button title={t('shareRequest')} onPress={share} loading={busy} disabled={!text.trim()} />
      </Card>

      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error?.message ?? ''} onRetry={refresh} />
      ) : data.data.length === 0 ? (
        <T variant="muted">{t('noPrayer')}</T>
      ) : (
        data.data.map((p) => (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.sm }}>
              <T variant="bodyBold">{p.name}</T>
              {p.mine && <Badge label={t('yours')} />}
              {p.visibility === 'pastors' && <Badge label={`🔒 ${t('visibilityPastors')}`} />}
              {p.status === 'answered' && <Badge label={`✓ ${t('answered')}`} tone="ok" />}
              <T variant="caption">{relativeTime(p.createdAt, locale)}</T>
            </View>
            <T>{p.text}</T>
            {p.answeredNote ? <T style={{ color: c.primary }}>{p.answeredNote}</T> : null}
            <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                title={p.iPrayed ? `🙏 ${t('prayedCount', { count: p.prayedCount })}` : `🙏 ${t('iPrayed')}`}
                variant={p.iPrayed ? 'primary' : 'secondary'}
                disabled={p.iPrayed}
                onPress={async () => replace(await Prayer.pray(p.id))}
                style={{ minHeight: 40 }}
              />
              {!p.iPrayed && p.prayedCount > 0 && <T variant="caption">{t('prayedCount', { count: p.prayedCount })}</T>}
              {p.mine && p.status === 'open' && (
                <Button title={t('markAnswered')} variant="ghost" onPress={async () => replace(await Prayer.update(p.id, { status: 'answered' }))} style={{ minHeight: 40 }} />
              )}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
