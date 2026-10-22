import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Me } from '@/api/endpoints';
import { Card, ErrorState, Loading, Screen, T } from '@/components/ui';
import { useT } from '@/i18n';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { Brand, Fonts, Space } from '@/theme';

export default function CheckinCodeScreen() {
  const { t } = useT();
  const { session } = useSession();
  const { data, error, loading, refresh } = useApi(Me.checkinCode);
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: t('myQr') }} />
      <T variant="muted">{t('myQrBody')}</T>
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error?.message ?? ''} onRetry={refresh} />
      ) : (
        <Card style={styles.card}>
          <View style={styles.qr}>
            <QRCode value={data.qr} size={240} color={Brand.ink} backgroundColor="#FFFFFF" />
          </View>
          <T variant="heading" style={{ textAlign: 'center' }}>
            {data.name}
          </T>
          <T style={styles.code}>{data.code}</T>
          <T variant="caption" style={{ textAlign: 'center' }}>
            {session?.church.name}
          </T>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', paddingVertical: Space.xl, gap: Space.md },
  qr: { padding: Space.md, backgroundColor: '#FFFFFF', borderRadius: 16 },
  code: { fontFamily: Fonts.displayBold, fontSize: 22, letterSpacing: 4, textAlign: 'center' },
});
