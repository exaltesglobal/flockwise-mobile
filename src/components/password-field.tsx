import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';

import { useT } from '@/i18n';
import { Space, usePalette } from '@/theme';

import { Field, T } from './ui';

/** A password box with a Show/Hide toggle. */
export function PasswordField(props: TextInputProps) {
  const c = usePalette();
  const { t } = useT();
  const [shown, setShown] = useState(false);
  return (
    <View style={styles.wrap}>
      <Field autoCapitalize="none" autoCorrect={false} {...props} secureTextEntry={!shown} style={[props.style, styles.input]} />
      <Pressable accessibilityRole="button" onPress={() => setShown(!shown)} style={styles.toggle} hitSlop={8}>
        <T variant="bodyBold" style={{ color: c.primary }}>
          {shown ? t('hide') : t('show')}
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  input: { paddingRight: 72 },
  toggle: { position: 'absolute', right: Space.md },
});
