import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from 'theme/Theme';
import { formatCurrency } from 'utils/HelperFn';

type Tone = 'income' | 'expense' | 'neutral' | 'warning';

const TONE_COLORS: Record<Tone, string> = {
  income: COLORS.success,
  expense: COLORS.danger,
  neutral: COLORS.cacao,
  warning: COLORS.warning,
};

const StatRow = ({ label, value, tone = 'neutral', bold }: { label: string; value: number; tone?: Tone; bold?: boolean }) => {
  const color = TONE_COLORS[tone];
  return (
    <View style={[styles.row, { borderLeftColor: color }]}>
      <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.value, { color }, bold && styles.bold]}>{formatCurrency(value)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, paddingLeft: SPACING.sm, borderLeftWidth: 3, marginBottom: SPACING.xs, backgroundColor: COLORS.cream, borderRadius: 4 },
  label: { fontSize: 13, color: COLORS.textMuted },
  value: { fontSize: 13, fontWeight: '600' },
  bold: { fontWeight: '800', fontSize: 14.5 },
});

export default StatRow;