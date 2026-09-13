import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';

import {
  COLORS,
  RADIUS,
  SPACING,
  FONT_SIZE,
} from 'theme/Theme';

import {
  getQuantityUnitLabel,
  formatCurrency,
} from 'utils/HelperFn';

interface CartItem {
  subVarietyName: string;
  quantity: number;
  unit: string;
  pieceInfo?: string | null;
  billAmount: number;
}

interface Props {
  cart: CartItem[];
  subtotal: number;
  total: number;
  showMoreOptions: boolean;
  onToggleOptions: () => void;
  discount: string;
  note: string;
  onDiscountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onRemove: (index: number) => void;
}

const CartSummary = ({
  cart,
  subtotal,
  total,
  showMoreOptions,
  onToggleOptions,
  discount,
  note,
  onDiscountChange,
  onNoteChange,
  onRemove,
}: Props) => {
  if (cart.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Current Bill</Text>

          <Text style={styles.itemCount}>
            {cart.length} item{cart.length > 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.billIcon}>
          <Text style={styles.billIconText}>₹</Text>
        </View>
      </View>

      {/* Cart Items */}
      <View style={styles.items}>
        {cart.map((item, index) => (
          <View key={`${item.subVarietyName}-${index}`} style={styles.itemRow}>
            {/* Left */}
            <View style={styles.itemLeft}>
              {/* Item Number */}
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>{index + 1}</Text>
              </View>

              {/* Product Details */}
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.subVarietyName}
                </Text>

                <Text style={styles.quantity}>
                  {item.pieceInfo ||
                    `${item.quantity}${getQuantityUnitLabel(item.unit)}`}
                </Text>
              </View>
            </View>

            {/* Right */}
            <View style={styles.itemRight}>
              <Text style={styles.itemAmount}>
                {formatCurrency(item.billAmount)}
              </Text>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Subtotal */}
      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalLabel}>Subtotal</Text>

        <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
      </View>

      {/* More Options */}
      <TouchableOpacity
        style={styles.moreOptionsButton}
        onPress={onToggleOptions}
        activeOpacity={0.7}
      >
        <View style={styles.moreOptionsLeft}>
          <View style={styles.optionsIcon}>
            <Text style={styles.optionsIconText}>
              {showMoreOptions ? '−' : '+'}
            </Text>
          </View>

          <View>
            <Text style={styles.moreOptionsTitle}>
              {showMoreOptions ? 'Hide options' : 'More options'}
            </Text>

            {!showMoreOptions && (
              <Text style={styles.moreOptionsSubtitle}>
                Discount, excess & note
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.optionsArrow}>{showMoreOptions ? '⌃' : '⌄'}</Text>
      </TouchableOpacity>

      {/* More Options Form */}
      {showMoreOptions && (
        <View style={styles.optionsBox}>
          {/* Discount */}
          <Text style={styles.optionLabel}>Discount</Text>

          <TextInput
            style={styles.optionInput}
            value={discount}
            onChangeText={onDiscountChange}
            keyboardType="decimal-pad"
            placeholder="₹ 0"
            placeholderTextColor={COLORS.textFaint}
          />
          {/* Note */}
          <Text style={styles.optionLabel}>Note</Text>

          <TextInput
            style={[styles.optionInput, styles.noteInput]}
            value={note}
            onChangeText={onNoteChange}
            placeholder="Add a note (optional)"
            placeholderTextColor={COLORS.textFaint}
            multiline
          />
        </View>
      )}

      {/* Final Total */}
      <View style={styles.finalTotalBox}>
        <View>
          <Text style={styles.finalTotalLabel}>Final Total</Text>

          <Text style={styles.finalTotalHint}>Amount to collect</Text>
        </View>

        <Text style={styles.finalTotalValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg + 4,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,

    shadowColor: COLORS.cacao,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },

  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.cacaoDark,
  },

  itemCount: {
    fontSize: 11.5,
    color: COLORS.textFaint,
    marginTop: 2,
  },

  billIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.creamAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  billIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.caramel,
  },

  /* Items */

  items: {
    borderTopWidth: 1,
    borderTopColor: COLORS.creamAlt,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.creamAlt,
  },

  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },

  itemNumber: {
    width: 27,
    height: 27,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.creamAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 1,
  },

  itemNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cacao,
  },

  itemDetails: {
    flex: 1,
  },

  itemName: {
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
    color: COLORS.cacaoDark,
  },

  quantity: {
    fontSize: 11.5,
    color: COLORS.textFaint,
    marginTop: 3,
  },

  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 105,
    justifyContent: 'flex-end',
  },

  itemAmount: {
    width: 72,
    textAlign: 'right',
    fontSize: FONT_SIZE.body,
    fontWeight: '700',
    color: COLORS.cacao,
    marginRight: SPACING.sm,
  },

  removeButton: {
    width: 27,
    height: 27,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeText: {
    fontSize: 19,
    lineHeight: 20,
    fontWeight: '500',
    color: COLORS.danger,
  },

  /* Subtotal */

  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 13,
    marginTop: 3,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  subtotalLabel: {
    fontSize: FONT_SIZE.body - 0.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  subtotalValue: {
    width: 80,
    textAlign: 'right',
    fontSize: FONT_SIZE.subtitle,
    fontWeight: '700',
    color: COLORS.cacao,
  },

  /* More Options */

  moreOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm + 2,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  moreOptionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionsIcon: {
    width: 27,
    height: 27,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.creamAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 1,
  },

  optionsIconText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.cacao,
  },

  moreOptionsTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.cacao,
  },

  moreOptionsSubtitle: {
    fontSize: 10.5,
    color: COLORS.textFaint,
    marginTop: 2,
  },

  optionsArrow: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  /* Options Form */

  optionsBox: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  optionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 5,
    marginTop: 5,
  },

  optionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm + 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.cacaoDark,
  },

  noteInput: {
    minHeight: 65,
    textAlignVertical: 'top',
  },

  /* Final Total */

  finalTotalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.creamAlt,
    borderRadius: RADIUS.md + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  finalTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.cacao,
  },

  finalTotalHint: {
    fontSize: 10.5,
    color: COLORS.textFaint,
    marginTop: 2,
  },

  finalTotalValue: {
    minWidth: 100,
    textAlign: 'right',
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.caramel,
  },
});

export default CartSummary;
