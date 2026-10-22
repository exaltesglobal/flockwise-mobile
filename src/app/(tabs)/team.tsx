import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Hub } from '@/api/endpoints';
import type { HubChannelView, HubPost } from '@/api/types';
import { Button, Card, ErrorState, Loading, Screen, SectionHeader, T } from '@/components/ui';
import { useT } from '@/i18n';
import { formatWhen } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Brand, Fonts, Radius, Space, usePalette } from '@/theme';

/** The team's notice board and chats. Only the team the person signed in for. */
export default function TeamScreen() {
  const { t } = useT();
  const { session } = useSession();
  const teamId = session!.team.id;
  const hub = useApi(async () => {
    const [notices, threads] = await Promise.all([Hub.notices(teamId), Hub.threads(teamId)]);
    return { notices, threads };
  }, [teamId]);

  // Unread counts change after opening a chat, so reload when coming back.
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else hub.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (hub.loading) return <Screen><Loading /></Screen>;
  if (hub.error || !hub.data) return <Screen><ErrorState message={hub.error?.message ?? ''} onRetry={hub.refresh} /></Screen>;
  const { notices, threads } = hub.data;
  const teamThread = threads.find((c) => c.kind === 'team');

  return (
    <Screen refreshing={hub.refreshing} onRefresh={hub.refresh}>
      <View style={{ marginTop: Space.sm }}>
        <T variant="title">{session!.team.name}</T>
      </View>

      <SectionHeader title={t('notices')} />
      {notices.length === 0 ? (
        <Card>
          <T variant="muted">{t('noNotices')}</T>
        </Card>
      ) : (
        notices.slice(0, 5).map((n) => <Notice key={n.id} post={n} onPress={teamThread ? () => openThread(teamThread) : undefined} />)
      )}

      <SectionHeader title={t('threads')} action={<Button title={t('newThread')} variant="ghost" onPress={() => router.push('/thread/new')} style={{ minHeight: 36 }} />} />
      {threads.map((c) => (
        <ThreadRow key={c.id} thread={c} />
      ))}
    </Screen>
  );
}

function openThread(c: HubChannelView) {
  router.push({ pathname: '/thread/[id]', params: { id: c.id, name: c.name } });
}

function Notice({ post, onPress }: { post: HubPost; onPress?: () => void }) {
  const { t, locale } = useT();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={!onPress}>
      {({ pressed }) => (
        <View style={[styles.notice, { opacity: pressed ? 0.9 : 1 }]}>
          <View style={styles.noticeHead}>
            <Ionicons name="megaphone" size={16} color={Brand.ink} />
            <T style={styles.noticeMeta}>
              {post.authorName} · {formatWhen(post.at, locale, t('yesterday'))}
            </T>
          </View>
          <T style={styles.noticeText}>{post.text}</T>
        </View>
      )}
    </Pressable>
  );
}

function ThreadRow({ thread }: { thread: HubChannelView }) {
  const c = usePalette();
  const { t, locale } = useT();
  const unread = thread.unread > 0;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={thread.name} onPress={() => openThread(thread)}>
      {({ pressed }) => (
        <Card style={[styles.row, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={[styles.avatar, { backgroundColor: thread.kind === 'team' ? c.primary : c.tint }]}>
            <Ionicons name={thread.kind === 'team' ? 'people' : 'chatbubbles'} size={20} color={thread.kind === 'team' ? c.onPrimary : c.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.rowTop}>
              <T variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
                {thread.name}
              </T>
              {thread.lastAt && <T variant="caption">{formatWhen(thread.lastAt, locale, t('yesterday'))}</T>}
            </View>
            <View style={styles.rowTop}>
              <T variant="caption" numberOfLines={1} style={{ flex: 1, fontFamily: unread ? Fonts.bodyBold : Fonts.body }}>
                {thread.lastText || t('teamMates', { n: thread.members.length })}
              </T>
              {unread && (
                <View style={[styles.unread, { backgroundColor: c.accent }]}>
                  <T style={[styles.unreadText, { color: c.onAccent }]}>{thread.unread > 99 ? '99+' : thread.unread}</T>
                </View>
              )}
            </View>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: '#FCEFD6', borderLeftWidth: 4, borderLeftColor: Brand.saffron, borderRadius: Radius.md, padding: Space.md, gap: 6 },
  noticeHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noticeMeta: { fontFamily: Fonts.displayMedium, fontSize: 13, color: Brand.ink },
  noticeText: { fontFamily: Fonts.body, fontSize: 16, lineHeight: 22, color: Brand.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  unread: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  unreadText: { fontFamily: Fonts.displayBold, fontSize: 12 },
});
