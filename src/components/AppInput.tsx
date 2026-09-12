import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZE } from 'theme/Theme';

interface Props extends TextInputProps {
  label?: string;
}

const AppInput = ({ label, style, ...props }: Props) => (
  <View style={{ marginBottom: SPACING.sm }}>
    {!!label && <Text style={styles.label}>{label}</Text>}
    <TextInput style={[styles.input, style]} placeholderTextColor={COLORS.textFaint} {...props} />
  </View>
);

const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZE.label, fontWeight: '600', color: COLORS.textMuted, marginBottom: SPACING.sm },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 15, color: COLORS.cacaoDark },
});

export default AppInput;