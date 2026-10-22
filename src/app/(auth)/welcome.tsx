import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, T } from '@/components/ui';
import { useT } from '@/i18n';
import { Brand, Fonts, Space } from '@/theme';

export default function Welcome() {
  const { t } = useT();
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.hero}>
        <Image source={require('@/assets/brand/logo-horizontal-reverse.png')} style={styles.logo} contentFit="contain" />
        <T style={styles.tagline}>{t('tagline')}</T>
        <T style={styles.body}>{t('welcomeBody')}</T>
      </View>
      <Button title={t('getStarted')} variant="accent" onPress={() => router.push('/sign-in')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.pasture, padding: Space.lg, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', gap: Space.md },
  logo: { width: 240, height: 46 },
  tagline: { fontFamily: Fonts.displayBold, fontSize: 34, lineHeight: 40, color: '#FFFFFF', marginTop: Space.lg },
  body: { fontFamily: Fonts.body, fontSize: 17, lineHeight: 25, color: Brand.mint },
});
