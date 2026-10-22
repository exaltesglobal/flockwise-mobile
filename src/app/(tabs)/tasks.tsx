import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Hub } from '@/api/endpoints';
import type { MyTask } from '@/api/types';
import { Card, ErrorState, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT } from '@/i18n';
import { daysUntil } from '@/lib/dates';
import { formatDay } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Radius, Space, usePalette } from '@/theme';

/** Tasks given to this person in team chats. Only their own. */
export default function TasksScreen() {
  const { t } = useT();
  const tasks = useApi(Hub.tasks);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else tasks.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (tasks.loading) return <Screen><Loading /></Screen>;
  if (tasks.error || !tasks.data) return <Screen><ErrorState message={tasks.error?.message ?? ''} onRetry={tasks.refresh} /></Screen>;

  const replace = (next: MyTask) => tasks.setData((all) => all?.map((x) => (x.id === next.id ? next : x)) ?? all);
  const open = tasks.data.filter((x) => !x.task?.done);
  const done = tasks.data.filter((x) => x.task?.done);

  return (
    <Screen refreshing={tasks.refreshing} onRefresh={tasks.refresh}>
      <View style={{ marginTop: Space.sm }}>
        <T variant="title">{t('tabTasks')}</T>
      </View>
      {tasks.data.length === 0 && (
        <Card>
          <T variant="muted">{t('noTasks')}</T>
        </Card>
      )}
      {open.length > 0 && <SectionHeader title={t('openTasks')} />}
      {open.map((x) => <TaskRow key={x.id} task={x} onChange={replace} />)}
      {done.length > 0 && <SectionHeader title={t('doneTasks')} />}
      {done.map((x) => <TaskRow key={x.id} task={x} onChange={replace} />)}
    </Screen>
  );
}

function TaskRow({ task, onChange }: { task: MyTask; onChange: (t: MyTask) => void }) {
  const c = usePalette();
  const { t, locale } = useT();
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const done = !!task.task?.done;
  const due = task.task?.dueAt;
  const late = !done && !!due && daysUntil(due) < 0;

  async function toggle() {
    setBusy(true);
    // Show the tick at once; put it back if the server says no.
    onChange({ ...task, task: task.task && { ...task.task, done: !done } });
    try {
      await Hub.setTaskDone(task.id, !done);
    } catch {
      onChange(task);
    } finally {
      setBusy(false);
    }
  }

  // Tasks from another team's chat can't be opened while signed in for this team.
  const canOpen = task.teamId === session!.team.id;
  return (
    <Card style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, busy }}
        accessibilityLabel={done ? t('markNotDone') : t('markDone')}
        onPress={toggle}
        disabled={busy}
        hitSlop={8}
        style={[styles.box, { borderColor: done ? c.primary : c.border, backgroundColor: done ? c.primary : 'transparent' }]}>
        {done && <Ionicons name="checkmark" size={18} color={c.onPrimary} />}
      </Pressable>
      <Pressable
        style={{ flex: 1, gap: 2 }}
        disabled={!canOpen}
        onPress={() => router.push({ pathname: '/thread/[id]', params: { id: task.channelId, name: task.channelName } })}>
        <T style={done ? { textDecorationLine: 'line-through', color: c.textMuted } : undefined}>{task.text}</T>
        <T variant="caption" style={late ? { color: c.danger } : undefined}>
          {[late ? t('overdue') : due ? t('due', { date: formatDay(due, locale) }) : null, t('inThread', { name: task.channelName }), done && task.task?.doneByName ? t('doneBy', { name: task.task.doneByName }) : null]
            .filter(Boolean)
            .join(' · ')}
        </T>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.md },
  box: { width: 26, height: 26, borderRadius: Radius.sm, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
