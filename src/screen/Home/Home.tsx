import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from '@react-native-firebase/firestore';
import {
  getQuantityUnitLabel,
  getStockUnitLabel,
  computeAmount,
  computeStockDelta,
  formatCurrency,
} from 'utils/HelperFn';
import { printReceipt } from 'utils/Printer';
import ScreenContainer from 'components/ScreenContainer';

const Home = ({ route, navigation }: any) => {
  const { shopId, shopName, staffName, role } = route.params || {};
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [grams, setGrams] = useState('');
  const [count, setCount] = useState('1');
  const [cart, setCart] = useState<any[]>([]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [billDiscount, setBillDiscount] = useState('0');
  const [billExcess, setBillExcess] = useState('0');
  const [payment, setPayment] = useState<'cash' | 'gpay'>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'gpay' | 'split'>(
    'cash',
  );
  const [splitCash, setSplitCash] = useState('0');
  const [splitGpay, setSplitGpay] = useState('0');

  const loadCategories = useCallback(async () => {
    const db = getFirestore();
    const snap = await getDocs(collection(db, 'shops', shopId, 'categories'));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, [shopId]);

  React.useEffect(() => {
    loadCategories().finally(() => setLoading(false));
  }, [loadCategories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const quickItems = categories
    .flatMap(cat =>
      (cat.subVarieties || []).map((sv: any) => ({
        ...sv,
        categoryId: cat.id,
        categoryName: cat.name,
      })),
    )
    .filter(sv => sv.pricePerKg > 300)
    .slice(0, 8);

  const perUnitAmount =
    selectedSub && grams
      ? computeAmount(
          selectedSub.unit,
          parseFloat(grams) || 0,
          selectedSub.pricePerKg,
        )
      : 0;
  const countNum = selectedSub?.unit === 'pcs' ? 1 : parseInt(count) || 1;
  const billAmount = perUnitAmount * countNum;

  const selectItem = (cat: any, sv: any, presetGrams?: number) => {
    setSelectedCategory(cat);
    setSelectedSub(sv);
    setGrams(presetGrams ? String(presetGrams) : '');
    setCount('1');
  };

  const addToCart = () => {
    const gramsNum = parseFloat(grams);
    if (!selectedCategory || !selectedSub || !gramsNum || gramsNum <= 0) {
      setError('Pick an item and enter a valid quantity');
      return;
    }
    const totalQty = gramsNum * countNum;
    const kgNeeded = computeStockDelta(selectedSub.unit, totalQty);
    const alreadyInCart = cart
      .filter(
        c =>
          c.subVarietyId === selectedSub.id &&
          c.categoryId === selectedCategory.id,
      )
      .reduce((sum, c) => sum + computeStockDelta(c.unit, c.quantity), 0);
    if (kgNeeded + alreadyInCart > selectedSub.stock) {
      setError(
        `Only ${(selectedSub.stock - alreadyInCart).toFixed(
          2,
        )}${getStockUnitLabel(selectedSub.unit)} of ${selectedSub.name} left`,
      );
      return;
    }

    setCart(prev => [
      ...prev,
      {
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        subVarietyId: selectedSub.id,
        subVarietyName: selectedSub.name,
        quantity: totalQty,
        unit: selectedSub.unit,
        pieceInfo:
          countNum > 1
            ? `${countNum} × ${gramsNum}${getQuantityUnitLabel(
                selectedSub.unit,
              )}`
            : null,
        billAmount: Number(billAmount.toFixed(2)),
      },
    ]);
    setSelectedCategory(null);
    setSelectedSub(null);
    setGrams('');
    setCount('1');
    setError('');
  };

  const removeFromCart = (index: number) =>
    setCart(prev => prev.filter((_, i) => i !== index));

  const cartSubtotal = cart.reduce((sum, item) => sum + item.billAmount, 0);
  const discountNum = parseFloat(billDiscount) || 0;
  const excessNum = parseFloat(billExcess) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountNum + excessNum);
  const splitCashNum = parseFloat(splitCash) || 0;
  const splitGpayNum = parseFloat(splitGpay) || 0;
  const splitTotal = splitCashNum + splitGpayNum;
  const splitMismatch =
    paymentMode === 'split' && Math.abs(splitTotal - cartTotal) > 0.01;

  const submitBill = async () => {
    if (cart.length === 0) {
      setError('Add at least one item before completing the sale');
      return;
    }
    if (splitMismatch) {
      setError('Cash + GPay must equal the final total');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const billId = `${Date.now()}_${staffName}`;

      const itemsWithFinal = cart.map((item, index) => {
        const isLastItem = index === cart.length - 1;
        const share = cartSubtotal > 0 ? item.billAmount / cartSubtotal : 0;
        let itemDiscount: number, itemExcess: number;
        if (isLastItem) {
          const discountSoFar = cart
            .slice(0, -1)
            .reduce(
              (sum, i) =>
                sum +
                Number(
                  (
                    discountNum *
                    (cartSubtotal > 0 ? i.billAmount / cartSubtotal : 0)
                  ).toFixed(2),
                ),
              0,
            );
          const excessSoFar = cart
            .slice(0, -1)
            .reduce(
              (sum, i) =>
                sum +
                Number(
                  (
                    excessNum *
                    (cartSubtotal > 0 ? i.billAmount / cartSubtotal : 0)
                  ).toFixed(2),
                ),
              0,
            );
          itemDiscount = Number((discountNum - discountSoFar).toFixed(2));
          itemExcess = Number((excessNum - excessSoFar).toFixed(2));
        } else {
          itemDiscount = Number((discountNum * share).toFixed(2));
          itemExcess = Number((excessNum * share).toFixed(2));
        }
        return {
          ...item,
          discount: itemDiscount,
          excess: itemExcess,
          finalAmount: Number(
            (item.billAmount - itemDiscount + itemExcess).toFixed(2),
          ),
        };
      });

      // Now split each item's finalAmount into cash/gpay portions proportionally
      const finalTotal = itemsWithFinal.reduce((s, i) => s + i.finalAmount, 0);
      const cashAmount =
        paymentMode === 'cash'
          ? finalTotal
          : paymentMode === 'gpay'
          ? 0
          : splitCashNum;

      const itemsWithPayment = itemsWithFinal.map((item, index) => {
        const isLastItem = index === itemsWithFinal.length - 1;
        const share = finalTotal > 0 ? item.finalAmount / finalTotal : 0;
        let cashPortion: number, gpayPortion: number;
        if (isLastItem) {
          const cashSoFar = itemsWithFinal
            .slice(0, -1)
            .reduce(
              (s, i) =>
                s +
                Number(
                  (
                    cashAmount *
                    (finalTotal > 0 ? i.finalAmount / finalTotal : 0)
                  ).toFixed(2),
                ),
              0,
            );
          cashPortion = Number((cashAmount - cashSoFar).toFixed(2));
          gpayPortion = Number((item.finalAmount - cashPortion).toFixed(2));
        } else {
          cashPortion = Number((cashAmount * share).toFixed(2));
          gpayPortion = Number((item.finalAmount - cashPortion).toFixed(2));
        }
        return { ...item, cashPortion, gpayPortion };
      });

      const byCategory: Record<string, any[]> = {};
      itemsWithFinal.forEach(item => {
        if (!byCategory[item.categoryId]) byCategory[item.categoryId] = [];
        byCategory[item.categoryId].push(item);
      });

      for (const categoryId of Object.keys(byCategory)) {
        const category = categories.find(c => c.id === categoryId);
        const itemsForThisCategory = byCategory[categoryId];
        const updatedSubVarieties = category.subVarieties.map((sv: any) => {
          const deductions = itemsForThisCategory
            .filter(i => i.subVarietyId === sv.id)
            .reduce(
              (sum, i) => sum + computeStockDelta(sv.unit, i.quantity),
              0,
            );
          return deductions > 0 ? { ...sv, stock: sv.stock - deductions } : sv;
        });
        await updateDoc(doc(db, 'shops', shopId, 'categories', categoryId), {
          subVarieties: updatedSubVarieties,
        });
      }

      for (const item of itemsWithPayment) {
        await addDoc(collection(db, 'shops', shopId, 'transactions'), {
          type: 'sale',
          billId,
          date: new Date().toISOString().slice(0, 10),
          timestamp: Date.now(),
          staffName,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          subVarietyId: item.subVarietyId,
          subVarietyName: item.subVarietyName,
          quantity: item.quantity,
          unit: item.unit,
          billAmount: item.billAmount,
          discount: item.discount,
          excess: item.excess,
          finalAmount: item.finalAmount,
          cashPortion: item.cashPortion,
          gpayPortion: item.gpayPortion,
          paymentMethod: paymentMode, // 'cash' | 'gpay' | 'split' — kept for display/badges
          note: note.trim() || null,
        });
      }
      try {
        await printReceipt({
          shopName,
          billItems: itemsWithPayment.map(i => ({
            name: i.subVarietyName,
            qty: i.pieceInfo || `${i.quantity}${i.unit}`,
            amount: i.billAmount,
          })),
          discount: discountNum,
          // excess: excessNum,
          total: cartTotal,
          paymentMethod: paymentMode,
          staffName,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.log('Print skipped or failed:', e);
      }
      setCart([]);
      setBillDiscount('0');
      setBillExcess('0');
      setNote('');
      setSplitCash('0');
      setSplitGpay('0');
      setShowMoreOptions(false);
      await loadCategories();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      {cart.length > 0 && (
        <View style={styles.cartBox}>
          {/* Cart Header */}
          <View style={styles.cartHeader}>
            <View>
              <Text style={styles.cartTitle}>Current Bill</Text>
              <Text style={styles.cartItemCount}>
                {cart.length} item{cart.length > 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.billIcon}>
              <Text style={styles.billIconText}>₹</Text>
            </View>
          </View>

          {/* Items */}
          <View style={styles.cartItems}>
            {cart.map((item, i) => (
              <View key={i} style={styles.cartRow}>
                <View style={styles.cartItemLeft}>
                  <View style={styles.itemNumber}>
                    <Text style={styles.itemNumberText}>{i + 1}</Text>
                  </View>

                  <View style={styles.itemDetails}>
                    <Text style={styles.cartItemText} numberOfLines={1}>
                      {item.subVarietyName}
                    </Text>

                    <Text style={styles.cartQuantity}>
                      {item.pieceInfo ||
                        `${item.quantity}${getQuantityUnitLabel(item.unit)}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.cartItemRight}>
                  <Text style={styles.cartItemAmount}>
                    {formatCurrency(item.billAmount)}
                  </Text>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFromCart(i)}
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

            <Text style={styles.subtotalValue}>
              {formatCurrency(cartSubtotal)}
            </Text>
          </View>

          {/* More Options */}
          <TouchableOpacity
            style={styles.moreOptionsBtn}
            onPress={() => setShowMoreOptions(s => !s)}
            activeOpacity={0.7}
          >
            <View style={styles.moreOptionsLeft}>
              <View style={styles.optionsIcon}>
                <Text style={styles.optionsIconText}>+</Text>
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

            <Text style={styles.optionsArrow}>
              {showMoreOptions ? '⌃' : '⌄'}
            </Text>
          </TouchableOpacity>

          {/* Extra Options */}
          {showMoreOptions && (
            <View style={styles.optionsBox}>
              <Text style={styles.optionLabel}>Discount</Text>

              <TextInput
                style={styles.optionInput}
                value={billDiscount}
                onChangeText={setBillDiscount}
                keyboardType="decimal-pad"
                placeholder="₹ 0"
                placeholderTextColor="#B89C88"
              />

              <Text style={styles.optionLabel}>Excess</Text>

              <TextInput
                style={styles.optionInput}
                value={billExcess}
                onChangeText={setBillExcess}
                keyboardType="decimal-pad"
                placeholder="₹ 0"
                placeholderTextColor="#B89C88"
              />

              <Text style={styles.optionLabel}>Note</Text>

              <TextInput
                style={[styles.optionInput, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                placeholderTextColor="#B89C88"
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

            <Text style={styles.finalTotalValue}>
              {formatCurrency(cartTotal)}
            </Text>
          </View>
        </View>
      )}
      <Text style={styles.label}>Quick Sell</Text>
      <View style={styles.wrapRow}>
        {quickItems.map(sv => (
          <TouchableOpacity
            key={sv.id}
            style={styles.quickBtn}
            onPress={() =>
              selectItem(
                { id: sv.categoryId, name: sv.categoryName },
                sv,
                sv.presetAmounts[0],
              )
            }
          >
            <Text style={styles.quickBtnText}>{sv.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.wrapRow}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.pill,
              selectedCategory?.id === cat.id && styles.pillActive,
            ]}
            onPress={() => {
              setSelectedCategory(cat);
              setSelectedSub(null);
            }}
          >
            <Text
              style={
                selectedCategory?.id === cat.id
                  ? styles.pillTextActive
                  : styles.pillText
              }
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedCategory && (
        <>
          <Text style={styles.label}>Item</Text>
          <View style={styles.wrapRow}>
            {selectedCategory?.subVarieties?.map((sv: any) => (
              <TouchableOpacity
                key={sv.id}
                style={[
                  styles.pill,
                  selectedSub?.id === sv.id && styles.pillActive,
                ]}
                onPress={() => selectItem(selectedCategory, sv)}
              >
                <Text
                  style={
                    selectedSub?.id === sv.id
                      ? styles.pillTextActive
                      : styles.pillText
                  }
                >
                  {sv.name} ({sv.stock.toFixed(2)}
                  {getStockUnitLabel(sv.unit)})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {selectedSub && (
        <>
          <Text style={styles.label}>
            Quantity ({getQuantityUnitLabel(selectedSub.unit)})
          </Text>
          <View style={styles.wrapRow}>
            {(selectedSub.presetAmounts || []).map((g: number) => (
              <TouchableOpacity
                key={g}
                style={styles.presetBtn}
                onPress={() => setGrams(String(g))}
              >
                <Text style={styles.presetText}>
                  {g}
                  {getQuantityUnitLabel(selectedSub.unit)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={grams}
            onChangeText={setGrams}
            keyboardType="decimal-pad"
            placeholder="or custom amount"
          />

          {selectedSub.unit !== 'pcs' && (
            <>
              <Text style={styles.label}>How many?</Text>
              <TextInput
                style={styles.input}
                value={count}
                onChangeText={setCount}
                keyboardType="number-pad"
                placeholder="1"
              />
            </>
          )}

          <Text style={styles.label}>
            Amount: {formatCurrency(billAmount)}{' '}
            {countNum > 1
              ? `(${countNum} × ${formatCurrency(perUnitAmount)})`
              : ''}
          </Text>

          <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
            <Text style={styles.addBtnText}>+ Add to bill</Text>
          </TouchableOpacity>
        </>
      )}

      {cart.length > 0 && (
        <>
          <Text style={styles.label}>Payment method</Text>
          <View style={styles.wrapRow}>
            <TouchableOpacity
              style={[
                styles.paymentBtn,
                paymentMode === 'cash' && styles.paymentBtnActive,
              ]}
              onPress={() => setPaymentMode('cash')}
            >
              <Text
                style={
                  paymentMode === 'cash'
                    ? styles.pillTextActive
                    : styles.pillText
                }
              >
                Cash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentBtn,
                paymentMode === 'gpay' && styles.paymentBtnActive,
              ]}
              onPress={() => setPaymentMode('gpay')}
            >
              <Text
                style={
                  paymentMode === 'gpay'
                    ? styles.pillTextActive
                    : styles.pillText
                }
              >
                GPay
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentBtn,
                paymentMode === 'split' && styles.paymentBtnActive,
              ]}
              onPress={() => {
                setPaymentMode('split');
                setSplitCash(cartTotal.toFixed(2));
                setSplitGpay('0');
              }}
            >
              <Text
                style={
                  paymentMode === 'split'
                    ? styles.pillTextActive
                    : styles.pillText
                }
              >
                Split
              </Text>
            </TouchableOpacity>
          </View>

          {paymentMode === 'split' && (
            <>
              <Text style={styles.label}>Cash amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={splitCash}
                onChangeText={setSplitCash}
                keyboardType="decimal-pad"
              />
              <Text style={styles.label}>GPay amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={splitGpay}
                onChangeText={setSplitGpay}
                keyboardType="decimal-pad"
              />
              <Text
                style={
                  splitMismatch ? styles.splitErrorText : styles.splitOkText
                }
              >
                {formatCurrency(splitCashNum)} + {formatCurrency(splitGpayNum)}{' '}
                = {formatCurrency(splitTotal)}
                {splitMismatch ? `(should be ₹${cartTotal.toFixed(2)})` : '✓'}
              </Text>
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={submitBill}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Complete sale — {formatCurrency(cartTotal)}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {cart.length === 0 && !!error && (
        <Text style={styles.error}>{error}</Text>
      )}
      <View style={{ height: 40 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    // paddingTop: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF4EC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  menuBtn: { padding: 6 },
  menuIcon: { fontSize: 24, color: '#5C3620' },
  shopName: { fontSize: 18, fontWeight: '700', color: '#2B160C' },
  staffLabel: { fontSize: 12, color: '#7A4A2B' },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A4A2B',
    // marginTop: 16,
    marginBottom: 8,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  pillActive: { backgroundColor: '#5C3620', borderColor: '#5C3620' },
  pillText: { color: '#2B160C', fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  quickBtn: {
    backgroundColor: '#5C3620',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  quickBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  presetBtn: {
    backgroundColor: '#E9D5BC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  presetText: { color: '#5C3620', fontWeight: '600', fontSize: 13 },
  paymentBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  paymentBtnActive: { backgroundColor: '#C17A3D', borderColor: '#C17A3D' },
  splitErrorText: { color: '#9C3654', fontSize: 12.5, marginTop: 6 },
  splitOkText: { color: '#5C7D57', fontSize: 12.5, marginTop: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  addBtn: {
    marginTop: 16,
    backgroundColor: '#5C7D57',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cartBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,

    shadowColor: '#5C3620',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  /* ---------- HEADER ---------- */

  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  cartTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B160C',
  },

  cartItemCount: {
    fontSize: 11.5,
    color: '#9A755D',
    marginTop: 2,
  },

  billIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F7EBDD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  billIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C17A3D',
  },

  /* ---------- ITEMS ---------- */

  cartItems: {
    borderTopWidth: 1,
    borderTopColor: '#F0E2D3',
  },

  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    minHeight: 58,
    paddingVertical: 8,

    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DD',
  },

  cartItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  itemNumber: {
    width: 27,
    height: 27,
    borderRadius: 8,

    backgroundColor: '#F8EEE5',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,
  },

  itemNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5A3C',
  },

  itemDetails: {
    flex: 1,
  },

  cartItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2B160C',
  },

  cartQuantity: {
    fontSize: 11.5,
    color: '#9A755D',
    marginTop: 3,
  },

  cartItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 105,
    justifyContent: 'flex-end',
  },

  cartItemAmount: {
    width: 72,
    textAlign: 'right',

    fontSize: 13.5,
    fontWeight: '700',
    color: '#5C3620',

    marginRight: 8,
  },

  removeBtn: {
    width: 27,
    height: 27,
    borderRadius: 8,

    backgroundColor: '#FBECEF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  removeText: {
    fontSize: 19,
    lineHeight: 20,
    fontWeight: '500',
    color: '#9C3654',
  },

  /* ---------- SUBTOTAL ---------- */

  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingTop: 13,
    marginTop: 3,

    borderTopWidth: 1,
    borderTopColor: '#E2CFAF',
  },

  subtotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A4A2B',
  },

  subtotalValue: {
    width: 80,
    textAlign: 'right',

    fontSize: 14,
    fontWeight: '700',
    color: '#5C3620',
  },

  /* ---------- MORE OPTIONS ---------- */

  moreOptionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,

    backgroundColor: '#FCF7F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0E2D3',
  },

  moreOptionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionsIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,

    backgroundColor: '#E9D5BC',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,
  },

  optionsIconText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5C3620',
  },

  moreOptionsTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5C3620',
  },

  moreOptionsSubtitle: {
    fontSize: 10.5,
    color: '#A17D65',
    marginTop: 2,
  },

  optionsArrow: {
    fontSize: 18,
    color: '#7A4A2B',
    fontWeight: '600',
  },

  /* ---------- OPTIONS FORM ---------- */

  optionsBox: {
    marginTop: 8,
    padding: 12,

    backgroundColor: '#FFF9F4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0E2D3',
  },

  optionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A4A2B',

    marginBottom: 5,
    marginTop: 5,
  },

  optionInput: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 9,

    paddingHorizontal: 11,
    paddingVertical: 9,

    fontSize: 14,
    color: '#2B160C',
  },

  noteInput: {
    minHeight: 65,
    textAlignVertical: 'top',
  },

  /* ---------- FINAL TOTAL ---------- */

  finalTotalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,

    backgroundColor: '#F6E8D8',

    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8CDAF',
  },

  finalTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5C3620',
  },

  finalTotalHint: {
    fontSize: 10.5,
    color: '#9A755D',
    marginTop: 2,
  },

  finalTotalValue: {
    minWidth: 100,
    textAlign: 'right',

    fontSize: 19,
    fontWeight: '800',
    color: '#C17A3D',
  },
  // cartBox: {
  //   backgroundColor: '#fff',
  //   borderWidth: 1,
  //   borderColor: '#E2CFAF',
  //   borderRadius: 12,
  //   padding: 14,
  //   marginBottom: 20,
  // },
  // cartTitle: { fontWeight: '700', color: '#2B160C', marginBottom: 8 },
  // cartRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   paddingVertical: 6,
  //   borderTopWidth: 1,
  //   borderTopColor: '#F3E6D5',
  // },
  // cartItemText: { fontSize: 13, color: '#2B160C', flex: 1 },
  // cartItemAmount: { fontSize: 13, fontWeight: '600', color: '#5C3620' },
  // removeText: { color: '#9C3654', fontWeight: '700', fontSize: 15 },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2CFAF',
  },
  cartTotalLabel: { fontWeight: '700', color: '#2B160C' },
  cartTotalValue: { fontWeight: '700', color: '#C17A3D', fontSize: 16 },
  finalLabel: { fontSize: 16, color: '#5C3620' },
  moreOptionsLink: {
    color: '#7A4A2B',
    fontSize: 12.5,
    marginTop: 12,
    textDecorationLine: 'underline',
  },
  error: { color: '#9C3654', marginTop: 12 },
  button: {
    marginTop: 24,
    backgroundColor: '#C17A3D',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default Home;
