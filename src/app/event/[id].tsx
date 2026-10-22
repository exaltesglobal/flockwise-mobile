import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Events } from '@/api/endpoints';
import type { RsvpStatus } from '@/api/types';
import { Button, Card, ErrorState, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { formatDay, formatTime } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { Space } from '@/theme';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useT();
  const { data: ev, setData, error, loading, refresh } = useApi(() => Events.get(id), [id]);
  const [busy, setBusy] = useState<RsvpStatus | null>(null);

  async function rsvp(status: RsvpStatus) {
    setBusy(status);
    try {
      setData(await Events.rsvp(id, status));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading />;
  if (error || !ev) return <ErrorState message={error?.message ?? ''} onRetry={refresh} />;

  const spots = ev.capacity ? ev.capacity - ev.goingCount : null;

  return (
    <Screen edges={[]}>
      <T variant="title">{ev.title}</T>
      <Card>
        <T variant="bodyBold">
          {formatDay(ev.startsAt, locale)} · {formatTime(ev.startsAt, locale)} – {formatTime(ev.endsAt, locale)}
        </T>
        <T variant="muted">{ev.location}</T>
        <T variant="caption">
          {t('peopleGoing', { count: ev.goingCount })}
          {spots !== null ? ` · ${spots > 0 ? t('spotsLeft', { count: spots }) : t('full')}` : ''}
        </T>
      </Card>
      <T>{ev.description}</T>
      <View style={{ gap: Space.sm, marginTop: Space.md }}>
        <Button
          title={ev.myRsvp === 'going' ? `✓ ${t('going')}` : t('imGoing')}
          variant={ev.myRsvp === 'going' ? 'primary' : 'accent'}
          loading={busy === 'going'}
          disabled={spots === 0 && ev.myRsvp !== 'going'}
          onPress={() => rsvp('going')}
        />
        <Button
          title={t('notGoing')}
          variant={ev.myRsvp === 'not_going' ? 'primary' : 'secondary'}
          loading={busy === 'not_going'}
          onPress={() => rsvp('not_going')}
        />
      </View>
    </Screen>
  );
}
