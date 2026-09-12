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

  const StatRow = ({
    label,
    value,
    tone,
    bold,
  }: {
    label: string;
    value: number;
    tone: 'income' | 'expense' | 'neutral' | 'warning';
    bold?: boolean;
  }) => {
    const toneStyles = {
      income: {
        background: '#EEF5EC',
        color: '#4F704B',
        icon: '↗',
      },
      expense: {
        background: '#FBECEF',
        color: '#9C3654',
        icon: '↘',
      },
      neutral: {
        background: '#F5EEE8',
        color: '#6B452D',
        icon: '₹',
      },
      warning: {
        background: '#FFF7DF',
        color: '#A77A18',
        icon: '!',
      },
    };

    const current = toneStyles[tone];

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: current.background,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.rowIcon,
              {
                backgroundColor: COLORS.white,
              },
            ]}
          >
            <Text style={[styles.rowIconText, { color: current.color }]}>
              {current.icon}
            </Text>
          </View>

          <Text
            style={[
              styles.rowLabel,
              { color: current.color },
              bold && styles.bold,
            ]}
          >
            {label}
          </Text>
        </View>

        <Text
          style={[
            styles.rowValue,
            { color: current.color },
            bold && styles.bold,
          ]}
        >
          {formatCurrency(value)}
        </Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',

      minHeight: 42,
      paddingHorizontal: 10,
      paddingVertical: 6,

      borderRadius: 9,
      marginBottom: 6,
    },

    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    rowIcon: {
      width: 26,
      height: 26,
      borderRadius: 13,

      justifyContent: 'center',
      alignItems: 'center',
    },

    rowIconText: {
      fontSize: 14,
      fontWeight: '800',
    },

    rowLabel: {
      fontSize: 13.5,
      fontWeight: '600',
    },

    rowValue: {
      fontSize: 13.5,
      fontWeight: '700',
    },

    bold: {
      fontWeight: '800',
      fontSize: 14.5,
    },
  });

export default StatRow;