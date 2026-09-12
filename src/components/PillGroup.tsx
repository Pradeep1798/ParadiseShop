import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZE } from 'theme/Theme';

interface PillOption {
  key: string;
  label: string;
}

interface Props {
  options: PillOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  equalWidth?: boolean;
}

const PillGroup = ({
  options,
  selectedKey,
  onSelect,
  equalWidth = false,
}: Props) => {
  return (
    <View style={styles.row}>
      {options.map(opt => {
        const active = opt.key === selectedKey;

        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.pill,
              equalWidth && styles.pillEqual,
              active && styles.pillActive,
            ]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  pill: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },

  pillActive: {
    backgroundColor: COLORS.cacao,
    borderColor: COLORS.cacao,
  },
  pillEqual: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    color: COLORS.cacaoDark,
    fontSize: FONT_SIZE.body,
    fontWeight: '500',
  },

  textActive: {
    color: COLORS.white,
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
  },
});

export default PillGroup;