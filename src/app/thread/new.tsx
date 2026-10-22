import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Hub } from '@/api/endpoints';
import { Button, Chip, ErrorState, Field, FormError, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Space } from '@/theme';

/** Starts a smaller chat with some team mates. The server only allows people on this team. */
export default function NewThread() {
  const { t } = useT();
  const { session } = useSession();
  const teamId = session!.team.id;
  const meKey = `p:${session!.member.id}`;
  const threads = useApi(() => Hub.threads(teamId), [teamId]);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (threads.loading) return <Loading />;
  if (threads.error || !threads.data) return <ErrorState message={threads.error?.message ?? ''} onRetry={threads.refresh} />;
  const mates = (threads.data.find((c) => c.kind === 'team')?.members ?? []).filter((m) => m.key !== meKey);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const ch = await Hub.startThread(teamId, name.trim(), picked);
      router.replace({ pathname: '/thread/[id]', params: { id: ch.id, name: ch.name } });
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  const toggle = (key: string) => setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  return (
    <Screen edges={[]}>
      <Field placeholder={t('threadName')} value={name} onChangeText={setName} maxLength={80} />
      <T variant="label">{t('pickPeople')}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.xs }}>
        {mates.map((m) => (
          <Chip key={m.key} label={m.name} selected={picked.includes(m.key)} onPress={() => toggle(m.key)} />
        ))}
      </View>
      <FormError error={error} />
      <Button title={t('startThread')} onPress={start} loading={busy} disabled={!name.trim() || picked.length === 0} />
    </Screen>
  );
}
