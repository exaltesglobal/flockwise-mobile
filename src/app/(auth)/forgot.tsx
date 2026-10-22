import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { Auth } from '@/api/endpoints';
import { PasswordField } from '@/components/password-field';
import { TeamPicker } from '@/components/team-picker';
import { Button, Field, FormError, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { isUsingMocks } from '@/lib/config';
import { useSession } from '@/lib/session';
import { Space } from '@/theme';

/** Forgot password: a code goes to the email, then the person sets a new password and is signed in. */
export default function Forgot() {
  const { t } = useT();
  const { signIn } = useSession();
  const params = useLocalSearchParams<{ email?: string; teamId?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [teamId, setTeamId] = useState(params.teamId ?? '');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={{ gap: Space.sm, marginTop: Space.xl }}>
          <T variant="title">{t('resetTitle')}</T>
          <T variant="muted">{sent ? t('resetCodeSent', { email: email.trim() }) : t('resetBody')}</T>
        </View>
        {!sent ? (
          <>
            <Field placeholder={t('emailLabel')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} />
            <FormError error={error} />
            <Button
              title={t('sendCode')}
              loading={busy}
              disabled={!/^\S+@\S+\.\S+$/.test(email.trim())}
              onPress={() =>
                run(async () => {
                  await Auth.forgot(email.trim());
                  setSent(true);
                })
              }
            />
          </>
        ) : (
          <>
            <Field placeholder={t('codeLabel')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode" />
            <PasswordField placeholder={t('newPassword')} value={password} onChangeText={setPassword} autoComplete="new-password" textContentType="newPassword" />
            <T variant="caption">{t('passwordHint')}</T>
            <T variant="label">{t('yourTeam')}</T>
            <TeamPicker value={teamId} onChange={setTeamId} />
            <FormError error={error} />
            <Button
              title={t('setPassword')}
              loading={busy}
              disabled={code.trim().length !== 6 || password.length < 8 || !teamId}
              onPress={() => run(async () => signIn(await Auth.reset({ email: email.trim(), code: code.trim(), newPassword: password, teamId })))}
            />
            {isUsingMocks() && <T variant="caption">{t('resetDemoHint')}</T>}
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
