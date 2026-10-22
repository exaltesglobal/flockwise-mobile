import { Stack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { View } from 'react-native';

import { Events } from '@/api/endpoints';
import type { RsvpStatus } from '@/api/types';
import { Badge, Button, Card, ErrorState, FormError, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { isUsingMocks } from '@/lib/config';
import { formatDay, formatMoney, formatTime } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Space } from '@/theme';

const HOUR = 3_600_000;

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useT();
  const { session } = useSession();
  const { data: ev, setData, error, loading, refresh } = useApi(() => Events.get(id), [id]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<unknown>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading />;
  if (error || !ev) return <ErrorState message={error?.message ?? ''} onRetry={refresh} />;

  const spots = ev.capacity ? ev.capacity - ev.goingCount : null;
  const paid = !!ev.price;
  const now = Date.now();
  const checkinOpen = now >= Date.parse(ev.startsAt) - HOUR && now <= Date.parse(ev.endsAt);
  const currency = session?.church.currency ?? 'INR';

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: '' }} />
      <T variant="title">{ev.title}</T>
      <Card>
        <T variant="bodyBold">
          {formatDay(ev.startsAt, locale)} · {formatTime(ev.startsAt, locale)} – {formatTime(ev.endsAt, locale)}
        </T>
        <T variant="muted">
          {ev.location}
          {ev.campusName ? ` · ${ev.campusName}` : ''}
        </T>
        <T variant="caption">
          {t('peopleGoing', { count: ev.goingCount })}
          {spots !== null ? ` · ${spots > 0 ? t('spotsLeft', { count: spots }) : t('full')}` : ''}
        </T>
        <Badge label={paid ? formatMoney(ev.price!, currency, locale) : t('free')} tone={paid ? 'warn' : 'neutral'} />
      </Card>
      <T>{ev.description}</T>
      <FormError error={err} />

      <View style={{ gap: Space.sm, marginTop: Space.md }}>
        {ev.checkedIn ? (
          <Badge label={`✓ ${t('checkedIn')}`} tone="ok" />
        ) : (
          checkinOpen && (
            <Button title={t('checkIn')} variant="accent" loading={busy === 'checkin'} onPress={() => run('checkin', async () => setData(await Events.checkIn(id)))} />
          )
        )}

        {paid ? (
          ev.myRsvp === 'going' ? (
            <Badge label={`✓ ${t('ticketPaid')}`} tone="ok" />
          ) : (
            <>
              <Button
                title={t('getTicket', { price: formatMoney(ev.price!, currency, locale) })}
                variant="accent"
                disabled={spots === 0}
                loading={busy === 'ticket'}
                onPress={() =>
                  run('ticket', async () => {
                    const intent = await Events.buyTicket(id);
                    if (intent.checkoutUrl && !isUsingMocks()) await WebBrowser.openBrowserAsync(intent.checkoutUrl);
                    setData(await Events.get(id));
                  })
                }
              />
              <T variant="caption">{t('ticketNote')}</T>
            </>
          )
        ) : (
          <>
            <Button
              title={ev.myRsvp === 'going' ? `✓ ${t('going')}` : t('imGoing')}
              variant={ev.myRsvp === 'going' ? 'primary' : 'accent'}
              loading={busy === 'going'}
              disabled={spots === 0 && ev.myRsvp !== 'going'}
              onPress={() => run('going', async () => setData(await Events.rsvp(id, 'going' as RsvpStatus)))}
            />
            <Button
              title={t('notGoing')}
              variant={ev.myRsvp === 'not_going' ? 'primary' : 'secondary'}
              loading={busy === 'not_going'}
              onPress={() => run('not_going', async () => setData(await Events.rsvp(id, 'not_going')))}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
