import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { Auth } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { Button, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { isUsingMocks } from '@/lib/config';
import { useSession } from '@/lib/session';
import { Fonts, Radius, Space, usePalette } from '@/theme';

export default function SignIn() {
  const c = usePalette();
  const { t } = useT();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = [styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }];

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await Auth.requestOtp(email.trim());
      setRequestId(res.requestId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!requestId) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(await Auth.verifyOtp(requestId, code.trim()));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={{ gap: Space.sm, marginTop: Space.xl }}>
          <T variant="title">{t('signInTitle')}</T>
          <T variant="muted">{requestId ? t('codeSentTo', { target: email }) : t('signInBody')}</T>
        </View>

        {!requestId ? (
          <>
            <TextInput
              style={input}
              placeholder={t('email')}
              placeholderTextColor={c.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
            />
            <Button title={t('sendCode')} onPress={sendCode} loading={busy} disabled={!/^\S+@\S+\.\S+$/.test(email.trim())} />
          </>
        ) : (
          <>
            <TextInput
              style={[input, styles.code]}
              placeholder="••••••"
              placeholderTextColor={c.textMuted}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
            />
            <Button title={t('verify')} onPress={verify} loading={busy} disabled={code.length !== 6} />
            <Button
              title={t('changeEmail')}
              variant="ghost"
              onPress={() => {
                setRequestId(null);
                setCode('');
              }}
            />
          </>
        )}

        {error && <T style={{ color: c.danger }}>{error}</T>}
        {isUsingMocks() && <T variant="caption">{t('demoHint')}</T>}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, height: 54, fontSize: 17, fontFamily: Fonts.body },
  code: { fontFamily: Fonts.display, fontSize: 26, letterSpacing: 10, textAlign: 'center' },
});
