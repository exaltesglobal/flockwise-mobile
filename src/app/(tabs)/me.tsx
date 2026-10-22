import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Me } from '@/api/endpoints';
import type { LanguageCode } from '@/api/types';
import { Button, Card, Chip, Screen, SectionHeader, T } from '@/components/ui';
import { languages, useT } from '@/i18n';
import { canOverrideServer, getApiUrl, isUsingMocks } from '@/lib/config';
import { useSession } from '@/lib/session';
import { Fonts, Space, usePalette } from '@/theme';

export default function MeScreen() {
  const c = usePalette();
  const { t } = useT();
  const { session, signOut, updateMember } = useSession();
  const m = session!.member;

  async function setLanguage(language: LanguageCode) {
    updateMember({ ...m, language });
    Me.update({ language }).catch(() => {});
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}>
          <T style={[styles.initials, { color: c.onPrimary }]}>
            {m.firstName[0]}
            {m.lastName[0]}
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T variant="heading">
            {m.firstName} {m.lastName}
          </T>
          <T variant="muted">{session!.church.name}</T>
        </View>
      </View>

      <SectionHeader title={t('profile')} />
      <Card>
        {m.phone && <T>{m.phone}</T>}
        {m.email && <T>{m.email}</T>}
        {m.householdName && <T variant="muted">{`${t('household')}: ${m.householdName}`}</T>}
      </Card>

      <SectionHeader title={t('language')} />
      <View style={styles.wrap}>
        {(Object.keys(languages) as LanguageCode[]).map((code) => (
          <Chip key={code} label={languages[code].label} selected={m.language === code} onPress={() => setLanguage(code)} />
        ))}
      </View>

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
});
