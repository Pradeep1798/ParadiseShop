import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from 'theme/Theme';

const EmptyState = ({ text }: { text: string }) => <Text style={styles.text}>{text}</Text>;

const styles = StyleSheet.create({
  text: { color: COLORS.textMuted, textAlign: 'center', marginTop: 20, fontSize: 13 },
});

export default EmptyState;