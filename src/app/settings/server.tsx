import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Button, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { BuildConfig, getApiUrl, isUsingMocks, setApiUrlOverride } from '@/lib/config';
import { useSession } from '@/lib/session';
import { Fonts, Radius, Space, usePalette } from '@/theme';

// Lets testers switch a preview build from demo data to a live backend
// (e.g. https://staging-api.flockwise.church/v1 on Hostinger) without a rebuild.
// Switching servers signs the user out, because tokens belong to one server.
export default function ServerSettings() {
  const c = usePalette();
  const { t } = useT();
  const { signOut } = useSession();
  const [url, setUrl] = useState(isUsingMocks() ? '' : getApiUrl());
  const valid = /^https?:\/\/[^\s]+$/.test(url.trim());

  async function apply(next: string | null) {
    await setApiUrlOverride(next);
    router.back();
    await signOut();
  }

  return (
    <Screen edges={[]}>
      <T variant="muted">{t('serverBody')}</T>
      <T variant="caption">Build default: {BuildConfig.useMocks ? 'demo data' : BuildConfig.apiUrl}</T>
      <TextInput
        style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
        placeholder="https://api.flockwise.church/v1"
        placeholderTextColor={c.textMuted}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Button title={t('save')} onPress={() => apply(url.trim())} disabled={!valid} />
      <Button title={t('resetToDefault')} variant="ghost" onPress={() => apply(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, height: 50, fontSize: 16, fontFamily: Fonts.body },
});
