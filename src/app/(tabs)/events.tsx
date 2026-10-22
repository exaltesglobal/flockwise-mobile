import { Events } from '@/api/endpoints';
import { EventCard } from '@/components/event-card';
import { ErrorState, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { useApi } from '@/lib/use-api';

export default function EventsScreen() {
  const { t } = useT();
  const { data, error, loading, refreshing, refresh } = useApi(() => Events.list());
  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <T variant="title">{t('tabEvents')}</T>
      {loading ? <Loading /> : error ? <ErrorState message={error.message} onRetry={refresh} /> : data?.data.map((e) => <EventCard key={e.id} event={e} />)}
    </Screen>
  );
}
