import { useState } from 'react';
import { View } from 'react-native';

import { Groups } from '@/api/endpoints';
import type { Group } from '@/api/types';
import { Button, Card, ErrorState, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { useApi } from '@/lib/use-api';
import { Space, usePalette } from '@/theme';

export default function GroupsScreen() {
  const { t } = useT();
  const { data, setData, error, loading, refreshing, refresh } = useApi(() => Groups.list());

  const replace = (g: Group) => setData((prev) => (prev ? { ...prev, data: prev.data.map((x) => (x.id === g.id ? g : x)) } : prev));

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <T variant="title">{t('tabGroups')}</T>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refresh} />
      ) : (
        data?.data.map((g) => <GroupCard key={g.id} group={g} onChange={replace} />)
      )}
    </Screen>
  );
}

function GroupCard({ group, onChange }: { group: Group; onChange: (g: Group) => void }) {
  const c = usePalette();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <T variant="subheading">{group.name}</T>
      <T variant="muted">{group.description}</T>
      <T variant="caption">
        {group.meetingSchedule} · {group.location} · {t('ledBy', { name: group.leaderName })} · {t('members', { count: group.memberCount })}
      </T>
      <View style={{ marginTop: Space.xs }}>
        {group.membership === 'member' ? (
          <T variant="bodyBold" style={{ color: c.primary }}>
            ✓ {t('youreMember')}
          </T>
        ) : (
          <Button
            title={group.membership === 'requested' ? t('requested') : t('joinGroup')}
            variant="secondary"
            disabled={group.membership === 'requested'}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                onChange(await Groups.requestToJoin(group.id));
              } finally {
                setBusy(false);
              }
            }}
          />
        )}
      </View>
    </Card>
  );
}
