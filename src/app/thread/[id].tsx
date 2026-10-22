import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hub } from '@/api/endpoints';
import type { HubChannelDetail, HubPost, HubPostKind } from '@/api/types';
import { Button, Chip, ErrorState, Field, FormError, Loading, T } from '@/components/ui';
import { useT } from '@/i18n';
import { isIsoDate } from '@/lib/dates';
import { formatDay, formatWhen } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Brand, Fonts, Radius, Space, usePalette } from '@/theme';

const POLL_MS = 8000;

/** One team chat: pinned notices on top, messages newest at the bottom, and a composer. */
export default function ThreadScreen() {
  const c = usePalette();
  const { t } = useT();
  const { session } = useSession();
  const { id, name, teamId: linkTeam } = useLocalSearchParams<{ id: string; name?: string; teamId?: string }>();
  const teamId = linkTeam ?? session!.team.id;
  const meKey = `p:${session!.member.id}`;

  const detail = useApi(() => Hub.messages(teamId, id), [teamId, id]);
  const [older, setOlder] = useState<{ posts: HubPost[]; cursor: string | null } | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Poll the newest page while the chat is open; older pages stay as loaded.
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => {
        Hub.messages(teamId, id)
          .then((d) => detail.setData(d))
          .catch(() => undefined);
      }, POLL_MS);
      return () => clearInterval(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId, id]),
  );

  if (detail.loading) return <Loading />;
  if (detail.error || !detail.data) return <ErrorState message={detail.error?.message ?? ''} onRetry={detail.refresh} />;
  const d: HubChannelDetail = detail.data;

  const firstIds = new Set(d.posts.map((p) => p.id));
  const posts = [...d.posts, ...(older?.posts.filter((p) => !firstIds.has(p.id)) ?? [])];
  const cursor = older ? older.cursor : d.nextCursor;

  async function loadOlder() {
    if (!cursor) return;
    setLoadingOlder(true);
    try {
      const page = await Hub.messages(teamId, id, cursor);
      setOlder((o) => ({ posts: [...(o?.posts ?? []), ...page.posts], cursor: page.nextCursor }));
    } finally {
      setLoadingOlder(false);
    }
  }

  function sent(p: HubPost) {
    detail.setData((cur) => cur && { ...cur, posts: [p, ...cur.posts], pinned: p.pinned ? [p, ...cur.pinned] : cur.pinned });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: d.channel.name || name || '' }} />
      {d.pinned.length > 0 && (
        <ScrollView style={styles.pinnedWrap} contentContainerStyle={{ gap: Space.xs }}>
          {d.pinned.map((p) => (
            <View key={p.id} style={styles.pinned}>
              <Ionicons name="pin" size={14} color={Brand.ink} />
              <T style={styles.pinnedText} numberOfLines={3}>
                <T style={[styles.pinnedText, { fontFamily: Fonts.bodyBold }]}>{p.authorName}: </T>
                {p.text}
              </T>
            </View>
          ))}
        </ScrollView>
      )}
      <FlatList
        inverted
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: Space.md, gap: Space.sm, flexGrow: 1 }}
        renderItem={({ item }) => <Bubble post={item} mine={item.authorKey === meKey} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <T variant="muted">{t('noMessagesYet')}</T>
          </View>
        }
        ListFooterComponent={cursor ? <Button title={t('loadOlder')} variant="ghost" onPress={loadOlder} loading={loadingOlder} /> : undefined}
      />
      <Composer teamId={teamId} threadId={id} members={d.channel.members.filter((m) => m.key !== meKey)} onSent={sent} />
    </KeyboardAvoidingView>
  );
}

function Bubble({ post, mine }: { post: HubPost; mine: boolean }) {
  const c = usePalette();
  const { t, locale } = useT();
  const notice = post.kind === 'notice';
  const bg = notice ? '#FCEFD6' : mine ? c.primary : c.card;
  const fg = notice ? Brand.ink : mine ? c.onPrimary : c.text;
  return (
    <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.bubble, { backgroundColor: bg, borderColor: c.border }, notice && styles.noticeBubble]}>
        {!mine && <T style={[styles.author, { color: notice ? Brand.ink : c.primary }]}>{post.authorName}</T>}
        {notice && (
          <View style={styles.tag}>
            <Ionicons name="megaphone" size={12} color={Brand.ink} />
            <T style={[styles.tagText, { color: Brand.ink }]}>{t('kindNotice')}</T>
          </View>
        )}
        <T style={{ color: fg, fontSize: 16, lineHeight: 22 }}>{post.text}</T>
        {post.task && (
          <View style={[styles.task, { borderColor: mine ? 'rgba(255,255,255,0.4)' : c.border }]}>
            <Ionicons name={post.task.done ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={fg} />
            <T style={{ color: fg, fontSize: 13, flex: 1 }}>
              {t('taskFor', { name: post.task.assigneeName })}
              {post.task.dueAt ? ` · ${t('due', { date: formatDay(post.task.dueAt, locale) })}` : ''}
            </T>
          </View>
        )}
        <T style={[styles.time, { color: mine && !notice ? 'rgba(255,255,255,0.75)' : c.textMuted }]}>{formatWhen(post.at, locale, t('yesterday'))}</T>
      </View>
    </View>
  );
}

function Composer({ teamId, threadId, members, onSent }: { teamId: string; threadId: string; members: { key: string; name: string }[]; onSent: (p: HubPost) => void }) {
  const c = usePalette();
  const { t } = useT();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<HubPostKind>('message');
  const [assignee, setAssignee] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const dueOk = !due.trim() || isIsoDate(due.trim());
  const ready = text.trim().length > 0 && (kind !== 'task' || (!!assignee && dueOk));

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const task = kind === 'task' ? { assigneeKey: assignee, dueAt: due.trim() ? new Date(`${due.trim()}T18:00:00`).toISOString() : null } : undefined;
      onSent(await Hub.post(teamId, threadId, { kind, text: text.trim(), task }));
      setText('');
      setKind('message');
      setAssignee('');
      setDue('');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.composer, { borderTopColor: c.border, backgroundColor: c.card }]}>
      <View style={styles.kinds}>
        {(['message', 'notice', 'task'] as const).map((k) => (
          <Chip key={k} label={t(k === 'message' ? 'kindMessage' : k === 'notice' ? 'kindNotice' : 'kindTask')} selected={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>
      {kind === 'notice' && <T variant="caption">{t('noticeHint')}</T>}
      {kind === 'task' && (
        <View style={{ gap: Space.sm }}>
          <T variant="label">{t('assignTo')}</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.xs }}>
            {members.map((m) => (
              <Chip key={m.key} label={m.name} selected={assignee === m.key} onPress={() => setAssignee(m.key)} />
            ))}
          </ScrollView>
          <Field placeholder={t('dueDate')} value={due} onChangeText={setDue} autoCapitalize="none" keyboardType="numbers-and-punctuation" />
        </View>
      )}
      <FormError error={error} />
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('messagePlaceholder')}
          placeholderTextColor={c.textMuted}
          multiline
          style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.background }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('send')}
          disabled={!ready || busy}
          onPress={send}
          style={[styles.send, { backgroundColor: c.primary, opacity: !ready || busy ? 0.5 : 1 }]}>
          <Ionicons name="send" size={18} color={c.onPrimary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pinnedWrap: { maxHeight: 132, flexGrow: 0, paddingHorizontal: Space.md, paddingTop: Space.sm },
  pinned: { flexDirection: 'row', gap: 6, backgroundColor: '#FCEFD6', borderLeftWidth: 4, borderLeftColor: Brand.saffron, borderRadius: Radius.sm, padding: Space.sm },
  pinnedText: { flex: 1, fontSize: 14, lineHeight: 19, color: Brand.ink },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ scaleY: -1 }], padding: Space.xl },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '82%', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, gap: 3, borderWidth: StyleSheet.hairlineWidth },
  noticeBubble: { borderLeftWidth: 4, borderLeftColor: Brand.saffron },
  author: { fontFamily: Fonts.displayMedium, fontSize: 13 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontFamily: Fonts.displayMedium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6, marginTop: 2 },
  time: { fontSize: 11, alignSelf: 'flex-end' },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Space.md, paddingTop: Space.sm, paddingBottom: Space.sm, gap: Space.sm },
  kinds: { flexDirection: 'row', gap: Space.xs },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Space.sm },
  input: { flex: 1, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, paddingTop: 12, paddingBottom: 12, minHeight: 46, maxHeight: 120, fontSize: 16, fontFamily: Fonts.body },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
