import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from 'theme/Theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'outline';
  style?: ViewStyle;
}

const VARIANT_COLORS = {
  primary: COLORS.cacao,
  success: COLORS.success,
  danger: COLORS.danger,
  outline: COLORS.creamAlt,
};

const AppButton = ({ label, onPress, loading, disabled, variant = 'primary', style }: Props) => {
  const bg = disabled ? COLORS.border : VARIANT_COLORS[variant];
  const textColor = variant === 'outline' ? COLORS.cacao : '#fff';
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: bg }, style]} onPress={onPress} disabled={disabled || loading}>
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  text: { fontWeight: '700', fontSize: 15 },
});

export default AppButton;