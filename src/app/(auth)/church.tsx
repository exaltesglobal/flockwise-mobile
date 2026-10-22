import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Churches } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import type { ChurchFound } from '@/api/types';
import { Button, Card, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { setChurch, slugFrom } from '@/lib/church';
import { Fonts, Radius, Space, usePalette } from '@/theme';

// Picks which church on the Flockwise server this app signs in to.
export default function ChooseChurch() {
  const c = usePalette();
  const { t } = useT();
  const [mode, setMode] = useState<'address' | 'email'>('address');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [found, setFound] = useState<ChurchFound[] | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = [styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }];
  const slug = slugFrom(address);

  async function choose(s: string) {
    setBusy(true);
    setError(null);
    try {
      const church = await Churches.bySlug(s);
      await setChurch({ slug: church.slug, name: church.name, city: church.city });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setBusy(false);
    }
  }

  async function find() {
    setBusy(true);
    setError(null);
    try {
      const res = await Churches.find(email.trim());
      setFound(res.churches ?? null);
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={{ gap: Space.sm, marginTop: Space.xl }}>
          <T variant="title">{t('churchTitle')}</T>
          <T variant="muted">{mode === 'address' ? t('churchBody') : t('churchFindBody')}</T>
        </View>

        {mode === 'address' ? (
          <>
            <TextInput
              style={input}
              placeholder={t('churchAddress')}
              placeholderTextColor={c.textMuted}
              value={address}
              onChangeText={setAddress}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              onSubmitEditing={() => slug.length >= 3 && choose(slug)}
            />
            <Button title={t('churchContinue')} onPress={() => choose(slug)} loading={busy} disabled={slug.length < 3} />
            <Button title={t('churchFindByEmail')} variant="ghost" onPress={() => { setMode('email'); setError(null); }} />
          </>
        ) : (
          <>
            <TextInput
              style={input}
              placeholder={t('phoneOrEmail')}
              placeholderTextColor={c.textMuted}
              value={email}
              onChangeText={(v) => { setEmail(v); setSent(false); setFound(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              autoFocus
            />
            <Button title={t('churchFindByEmail')} onPress={find} loading={busy && !found} disabled={!/^\S+@\S+\.\S+$/.test(email.trim())} />
            {found?.map((ch) => (
              <Pressable key={ch.slug} onPress={() => choose(ch.slug)} accessibilityRole="button">
                <Card>
                  <T style={{ fontFamily: Fonts.bodyBold }}>{ch.name}</T>
                  {ch.city ? <T variant="muted">{ch.city}</T> : null}
                </Card>
              </Pressable>
            ))}
            {sent && !found && <T variant="muted">{t('churchFindSent')}</T>}
            <Button title={t('churchUseAddress')} variant="ghost" onPress={() => { setMode('address'); setError(null); }} />
          </>
        )}

        {error && <T style={{ color: c.danger }}>{error}</T>}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Space.md, height: 54, fontSize: 17, fontFamily: Fonts.body },
});
