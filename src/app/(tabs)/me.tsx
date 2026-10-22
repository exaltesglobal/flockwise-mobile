import Constants from 'expo-constants';
import { StyleSheet, Switch, View } from 'react-native';

import { Me } from '@/api/endpoints';
import type { Consent, LanguageCode } from '@/api/types';
import { ListLink } from '@/components/list-link';
import { Button, Card, Chip, Screen, SectionHeader, T } from '@/components/ui';
import { languages, useT } from '@/i18n';
import { canOverrideServer, getApiUrl, isUsingMocks } from '@/lib/config';
import { useMyServing } from '@/lib/serving';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Fonts, Space, usePalette } from '@/theme';

export default function MeScreen() {
  const c = usePalette();
  const { t } = useT();
  const { session, signOut, updateMember } = useSession();
  const m = session!.member;
  const serving = useMyServing();
  const prefs = useApi(Me.preferences);

  function setLanguage(language: LanguageCode) {
    updateMember({ ...m, language });
    Me.update({ language }).catch(() => {});
  }

  async function setConsent(key: keyof Consent, value: boolean) {
    if (prefs.data) prefs.setData({ ...prefs.data, consent: { ...prefs.data.consent, [key]: value } });
    prefs.setData(await Me.updatePreferences({ consent: { [key]: value } }));
  }

  // Rota reminders go out by these channels.
  const channels: { key: keyof Consent; label: string }[] = [
    { key: 'email', label: t('consentEmail') },
    { key: 'whatsapp', label: t('consentWhatsapp') },
    { key: 'sms', label: t('consentSms') },
  ];
  const team = serving.data?.teams[0];

  return (
    <Screen refreshing={prefs.refreshing} onRefresh={prefs.refresh}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}>
          <T style={[styles.initials, { color: c.onPrimary }]}>
            {m.firstName[0]}
            {m.lastName[0] ?? ''}
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T variant="heading">
            {m.firstName} {m.lastName}
          </T>
          <T variant="muted">{session!.church.name}</T>
        </View>
      </View>

      <SectionHeader title={t('yourTeam')} />
      <Card>
        <T variant="subheading">{session!.team.name}</T>
        {team && team.positions.length > 0 ? <T variant="caption">{team.positions.join(', ')}</T> : null}
      </Card>
      <Button title={t('switchTeam')} variant="secondary" onPress={signOut} />

      <SectionHeader title={t('profile')} />
      <Card>
        {m.email ? <T>{m.email}</T> : null}
        {m.phone ? <T>{m.phone}</T> : null}
      </Card>
      <ListLink href="/settings/password" icon="key-outline" title={t('changePassword')} />

      <SectionHeader title={t('language')} />
      <View style={styles.wrap}>
        {(Object.keys(languages) as LanguageCode[]).map((code) => (
          <Chip key={code} label={languages[code].label} selected={m.language === code} onPress={() => setLanguage(code)} />
        ))}
      </View>

      <SectionHeader title={t('privacy')} />
      <Card>
        {channels.map((row) => (
          <View key={row.key} style={styles.switchRow}>
            <T style={{ flex: 1 }}>{row.label}</T>
            <Switch value={!!prefs.data?.consent[row.key]} disabled={!prefs.data} onValueChange={(v) => setConsent(row.key, v)} trackColor={{ true: c.primary }} />
          </View>
        ))}
      </Card>

      {canOverrideServer() && (
        <>
          <SectionHeader title={t('server')} />
          <ListLink href="/settings/server" icon="server-outline" title={isUsingMocks() ? t('usingDemoData') : getApiUrl()} subtitle={t('serverBody')} />
        </>
      )}

      <Button title={t('signOut')} variant="ghost" onPress={signOut} style={{ marginTop: Space.lg }} />
      <T variant="caption" style={{ textAlign: 'center' }}>
        {t('version', { version: Constants.expoConfig?.version ?? '' })}
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.sm },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: Fonts.displayBold, fontSize: 24 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: 4 },
});
