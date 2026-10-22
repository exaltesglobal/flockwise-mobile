import { router } from 'expo-router';
import { useState, useSyncExternalStore } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Auth } from '@/api/endpoints';
import { PasswordField } from '@/components/password-field';
import { TeamPicker } from '@/components/team-picker';
import { Button, Field, FormError, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { getChurch, onChurchChange } from '@/lib/church';
import { isUsingMocks } from '@/lib/config';
import { useSession } from '@/lib/session';
import { Fonts, Radius, Space, usePalette } from '@/theme';

/** Team sign-in: the person picks their team, then signs in with the password the church admin emailed them. */
export default function SignIn() {
  const c = usePalette();
  const { t } = useT();
  const { signIn } = useSession();
  // Teams belong to a church, so the team list follows the church picked here.
  const church = useSyncExternalStore(onChurchChange, getChurch);
  const [teamId, setTeamId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const ready = !!teamId && /^\S+@\S+\.\S+$/.test(email.trim()) && password.length > 0;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(await Auth.signIn({ email: email.trim(), password, teamId }));
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={{ gap: Space.sm, marginTop: Space.xl }}>
          <T variant="title">{t('signInTitle')}</T>
          <T variant="muted">{t('teamSignInBody')}</T>
        </View>

        <Pressable
          onPress={() => {
            setTeamId('');
            router.push('/church');
          }}
          accessibilityRole="button"
          style={[styles.church, { borderColor: c.border, backgroundColor: c.card }]}>
          <View style={{ flex: 1 }}>
            {church ? (
              <>
                <T style={{ fontFamily: Fonts.bodyBold }}>{church.name}</T>
                {church.city ? <T variant="caption">{church.city}</T> : null}
              </>
            ) : (
              <T variant="muted">{t('churchPick')}</T>
            )}
          </View>
          <T style={{ color: c.primary, fontFamily: Fonts.bodyBold }}>{church ? t('churchChange') : '›'}</T>
        </Pressable>

        <T variant="label">{t('yourTeam')}</T>
        <TeamPicker key={church?.slug ?? 'default'} value={teamId} onChange={setTeamId} />

        <Field
          placeholder={t('emailLabel')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          autoCorrect={false}
        />
        <PasswordField
          placeholder={t('passwordLabel')}
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={() => ready && submit()}
        />
        <FormError error={error} />
        <Button title={t('signInButton')} onPress={submit} loading={busy} disabled={!ready} />
        <Button title={t('forgotPassword')} variant="ghost" onPress={() => router.push({ pathname: '/forgot', params: { email: email.trim(), teamId } })} />
        {isUsingMocks() && <T variant="caption">{t('teamDemoHint')}</T>}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  church: { flexDirection: 'row', alignItems: 'center', gap: Space.md, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, paddingVertical: Space.sm + 4 },
});
