import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from 'theme/Theme';

interface PillOption {
  key: string;
  label: string;
}

interface Props {
  options: PillOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

const PillGroup = ({ options, selectedKey, onSelect }: Props) => (
  <View style={styles.row}>
    {options.map((opt) => {
      const active = opt.key === selectedKey;
      return (
        <TouchableOpacity key={opt.key} style={[styles.pill, active && styles.pillActive]} onPress={() => onSelect(opt.key)}>
          <Text style={active ? styles.textActive : styles.text}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pill: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xs },
  pillActive: { backgroundColor: COLORS.cacao, borderColor: COLORS.cacao },
  text: { color: COLORS.cacaoDark, fontWeight: '500' },
  textActive: { color: '#fff', fontWeight: '600' },
});

export default PillGroup;