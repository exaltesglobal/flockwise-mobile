import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Directory } from '@/api/endpoints';
import { Button, Card, ErrorState, Field, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { useApi } from '@/lib/use-api';
import { Space, usePalette } from '@/theme';

export default function DirectoryScreen() {
  const { t } = useT();
  const c = usePalette();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setQuery(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);
  const { data, error, loading, refresh } = useApi(() => Directory.search(query || undefined), [query]);
  const optIn = error?.code === 'directory_opt_in';

  const action = (icon: 'call-outline' | 'logo-whatsapp' | 'mail-outline', url: string, label: string) => (
    <Pressable accessibilityLabel={label} onPress={() => Linking.openURL(url)} style={[styles.iconBtn, { backgroundColor: c.tint }]}>
      <Ionicons name={icon} size={18} color={c.primary} />
    </Pressable>
  );

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t('tabDirectory') }} />
      <T variant="muted">{t('directoryBody')}</T>
      {optIn ? (
        <Card>
          <T>{t('directoryOptIn')}</T>
          <Button title={t('tabMe')} onPress={() => router.navigate('/me')} />
        </Card>
      ) : (
        <>
          <Field value={q} onChangeText={setQ} placeholder={t('searchByName')} autoCorrect={false} />
          {loading ? (
            <Loading />
          ) : error || !data ? (
            <ErrorState message={error?.message ?? ''} onRetry={refresh} />
          ) : (
            data.data.map((h) => (
              <Card key={h.householdName}>
                <View style={styles.row}>
                  <T variant="subheading" style={{ flex: 1 }}>
                    {h.householdName}
                  </T>
                  {h.area ? <T variant="caption">{h.area}</T> : null}
                </View>
                {h.people.map((p) => (
                  <View key={p.id} style={styles.row}>
                    <T style={{ flex: 1 }}>{p.name}</T>
                    {p.phone && action('call-outline', `tel:${p.phone}`, p.phone)}
                    {p.phone && action('logo-whatsapp', `https://wa.me/${p.phone.replace(/\D/g, '')}`, 'WhatsApp')}
                    {p.email && action('mail-outline', `mailto:${p.email}`, p.email)}
                  </View>
                ))}
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
