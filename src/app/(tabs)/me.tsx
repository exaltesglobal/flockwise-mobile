import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Church, Me } from '@/api/endpoints';
import type { Consent, LanguageCode } from '@/api/types';
import { ListLink } from '@/components/list-link';
import { Button, Card, Chip, Screen, SectionHeader, T } from '@/components/ui';
import { languages, useT } from '@/i18n';
import { canOverrideServer, getApiUrl, isUsingMocks } from '@/lib/config';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Fonts, Space, usePalette } from '@/theme';

export default function MeScreen() {
  const c = usePalette();
  const { t } = useT();
  const { session, signOut, updateMember } = useSession();
  const m = session!.member;
  const prefs = useApi(Me.preferences);
  const campuses = useApi(Church.campuses);

  async function setLanguage(language: LanguageCode) {
    updateMember({ ...m, language });
    Me.update({ language }).catch(() => {});
  }

  async function setConsent(key: keyof Consent, value: boolean) {
    if (prefs.data) prefs.setData({ ...prefs.data, consent: { ...prefs.data.consent, [key]: value } });
    prefs.setData(await Me.updatePreferences({ consent: { [key]: value } }));
  }

  const consentRows: { key: keyof Consent; label: string }[] = [
    { key: 'email', label: t('consentEmail') },
    { key: 'whatsapp', label: t('consentWhatsapp') },
    { key: 'sms', label: t('consentSms') },
    { key: 'directory', label: t('consentDirectory') },
  ];

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

      <SectionHeader title={t('quickLinks')} />
      <ListLink href="/member/checkin" icon="qr-code-outline" title={t('myQr')} subtitle={t('myQrBody')} />
      <ListLink href="/member/serving" icon="hand-left-outline" title={t('tabServing')} subtitle={t('servingBody')} />
      <ListLink href="/member/prayer" icon="flame-outline" title={t('prayerTitle')} subtitle={t('prayerBody')} />
      <ListLink href="/member/directory" icon="people-circle-outline" title={t('tabDirectory')} subtitle={t('directoryBody')} />

      <SectionHeader title={t('profile')} />
      <Card>
        {m.email ? <T>{m.email}</T> : null}
        {m.phone ? <T>{m.phone}</T> : null}
        {m.householdName ? <T variant="muted">{`${t('household')}: ${m.householdName}`}</T> : null}
      </Card>

      <SectionHeader title={t('language')} />
      <View style={styles.wrap}>
        {(Object.keys(languages) as LanguageCode[]).map((code) => (
          <Chip key={code} label={languages[code].label} selected={m.language === code} onPress={() => setLanguage(code)} />
        ))}
      </View>

      {campuses.data && campuses.data.length > 1 && (
        <>
          <SectionHeader title={t('campus')} />
          <View style={styles.wrap}>
            {campuses.data.map((cp) => (
              <Chip
                key={cp.id}
                label={cp.name}
                selected={prefs.data?.campusId === cp.id}
                onPress={async () => prefs.setData(await Me.updatePreferences({ campusId: cp.id }))}
              />
            ))}
          </View>
        </>
      )}

      <SectionHeader title={t('privacy')} />
      <Card>
        {consentRows.map((row) => (
          <View key={row.key} style={styles.switchRow}>
            <T style={{ flex: 1 }}>{row.label}</T>
            <Switch
              value={!!prefs.data?.consent[row.key]}
              disabled={!prefs.data}
              onValueChange={(v) => setConsent(row.key, v)}
              trackColor={{ true: c.primary }}
            />
          </View>
        ))}
      </Card>

      {canOverrideServer() && (
        <>
          <SectionHeader title={t('server')} />
          <Link href="/settings/server" asChild>
            <Pressable>
              <Card>
                <T variant="bodyBold">{isUsingMocks() ? t('usingDemoData') : getApiUrl()}</T>
                <T variant="caption">{t('serverBody')}</T>
              </Card>
            </Pressable>
          </Link>
        </>
      )}

      <Button title={t('signOut')} variant="secondary" onPress={signOut} style={{ marginTop: Space.lg }} />
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
