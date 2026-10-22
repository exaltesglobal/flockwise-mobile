import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Auth } from '@/api/endpoints';
import { useT } from '@/i18n';
import { useApi } from '@/lib/use-api';
import { Fonts, Radius, Space, usePalette } from '@/theme';

import { ErrorState, Loading, T } from './ui';

/**
 * Team dropdown for sign-in. The list is the teams the church admin set up (GET /team/teams);
 * a church with one team picks it for you.
 */
export function TeamPicker({ value, onChange }: { value: string; onChange: (teamId: string) => void }) {
  const c = usePalette();
  const { t } = useT();
  const teams = useApi(Auth.teams);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (teams.data?.length === 1 && !value) onChange(teams.data[0].id);
  }, [teams.data, value, onChange]);

  if (teams.loading) return <Loading />;
  if (teams.error || !teams.data) return <ErrorState message={teams.error?.message ?? ''} onRetry={teams.refresh} />;
  if (teams.data.length === 0) return <T variant="muted">{t('noTeamsYet')}</T>;
  const selected = teams.data.find((team) => team.id === value);

  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={t('yourTeam')}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: c.border, backgroundColor: c.card }]}>
        {selected && <View style={[styles.dot, { backgroundColor: selected.color }]} />}
        <T style={{ flex: 1, color: selected ? c.text : c.textMuted }}>{selected?.name ?? t('chooseTeam')}</T>
        <Ionicons name="chevron-down" size={20} color={c.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={t('cancel')}>
          <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: c.background }]}>
            {/* Taps inside the sheet must not close it. */}
            <Pressable onPress={() => undefined} accessible={false}>
              <T style={styles.sheetTitle}>{t('chooseTeam')}</T>
              <ScrollView style={{ maxHeight: 420 }}>
                {teams.data.map((team) => {
                  const on = team.id === value;
                  return (
                    <Pressable
                      key={team.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      onPress={() => {
                        onChange(team.id);
                        setOpen(false);
                      }}
                      style={({ pressed }) => [styles.option, { borderBottomColor: c.border, backgroundColor: pressed || on ? c.tint : 'transparent' }]}>
                      <View style={[styles.dot, { backgroundColor: team.color }]} />
                      <T variant={on ? 'bodyBold' : 'body'} style={{ flex: 1 }}>
                        {team.name}
                      </T>
                      {on && <Ionicons name="checkmark" size={20} color={c.primary} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: Space.md, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, height: 54 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,33,31,0.45)' },
  sheet: { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, paddingTop: Space.md, paddingBottom: Space.md },
  sheetTitle: { fontFamily: Fonts.display, fontSize: 18, paddingHorizontal: Space.lg, paddingBottom: Space.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.lg, minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth },
});
