import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Auth } from '@/api/endpoints';
import { useT } from '@/i18n';
import { useApi } from '@/lib/use-api';
import { Radius, Space, usePalette } from '@/theme';

import { ErrorState, Loading, T } from './ui';

/** The church's teams as a one-choice list. A church with one team picks it for you. */
export function TeamPicker({ value, onChange }: { value: string; onChange: (teamId: string) => void }) {
  const c = usePalette();
  const { t } = useT();
  const teams = useApi(Auth.teams);

  useEffect(() => {
    if (teams.data?.length === 1 && !value) onChange(teams.data[0].id);
  }, [teams.data, value, onChange]);

  if (teams.loading) return <Loading />;
  if (teams.error || !teams.data) return <ErrorState message={teams.error?.message ?? ''} onRetry={teams.refresh} />;
  if (teams.data.length === 0) return <T variant="muted">{t('noTeamsYet')}</T>;
  return (
    <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel={t('yourTeam')}>
      {teams.data.map((team) => {
        const on = team.id === value;
        return (
          <Pressable
            key={team.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(team.id)}
            style={[styles.team, { borderColor: on ? c.primary : c.border, backgroundColor: on ? c.tint : c.card }]}>
            <View style={[styles.dot, { backgroundColor: team.color }]} />
            <T variant={on ? 'bodyBold' : 'body'} style={{ flex: 1 }}>
              {team.name}
            </T>
            {on && <T style={{ color: c.primary }}>✓</T>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Space.sm },
  team: { flexDirection: 'row', alignItems: 'center', gap: Space.md, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, minHeight: 52 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
