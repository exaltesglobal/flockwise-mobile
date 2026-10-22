import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Auth } from '@/api/endpoints';
import { PasswordField } from '@/components/password-field';
import { Button, FormError, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { useSession } from '@/lib/session';
import { Space } from '@/theme';

/** Change password. Shown on its own right after signing in with the admin's temporary password. */
export default function ChangePassword() {
  const { t } = useT();
  const { session, passwordChanged, signOut } = useSession();
  const forced = !!session?.mustChangePassword;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await Auth.changePassword(current, next);
      passwordChanged();
      if (forced) router.replace('/schedule');
      else setDone(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={forced ? ['top', 'bottom'] : []}>
      <Stack.Screen options={{ title: t('changePassword'), headerShown: !forced }} />
      {forced && (
        <View style={{ gap: Space.sm, marginTop: Space.xl }}>
          <T variant="title">{t('changePasswordTitle')}</T>
          <T variant="muted">{t('changePasswordBody')}</T>
        </View>
      )}
      <PasswordField placeholder={t('currentPassword')} value={current} onChangeText={setCurrent} autoComplete="current-password" textContentType="password" />
      <PasswordField placeholder={t('newPassword')} value={next} onChangeText={setNext} autoComplete="new-password" textContentType="newPassword" />
      <T variant="caption">{t('passwordHint')}</T>
      <FormError error={error} />
      {done && <T variant="bodyBold">{t('passwordChanged')}</T>}
      <Button title={t('changePassword')} onPress={save} loading={busy} disabled={!current || next.length < 8} />
      {forced && <Button title={t('signOut')} variant="ghost" onPress={signOut} />}
    </Screen>
  );
}
