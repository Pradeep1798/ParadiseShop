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
import ScreenContainer from 'components/ScreenContainer';
import {
  computeAmount,
  computeStockDelta,
  getQuantityUnitLabel,
  getStockUnitLabel,
} from 'utils/HelperFn';

const Sell = ({ route, navigation }: any) => {
  const { shopId, staffName } = route.params || {};
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [grams, setGrams] = useState('');
  const [count, setCount] = useState('1');
  const [cart, setCart] = useState<any[]>([]);
  const [billDiscount, setBillDiscount] = useState('0');
  const [payment, setPayment] = useState<'cash' | 'gpay'>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [billExcess, setBillExcess] = useState('0');

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

  console.log(
    'selectedSub.unit:',
    selectedSub?.unit,
    'pricePerKg:',
    selectedSub?.pricePerKg,
    'grams:',
    grams,
  );

  const priceMissing =
    selectedSub &&
    (selectedSub.pricePerKg === undefined || selectedSub.pricePerKg === null);

  const pickGrams = (g: number) => setGrams(String(g));
  const perUnitAmount =
    selectedSub && grams
      ? computeAmount(
          selectedSub.unit,
          parseFloat(grams) || 0,
          selectedSub.pricePerKg,
        )
      : 0;
  const countNum = parseInt(count) || 1;
  const billAmount = perUnitAmount * countNum;

  console.log('billAmount:', billAmount);

  const addToCart = () => {
    const gramsNum = parseFloat(grams);
    const countNum = parseInt(count) || 1;
    if (
      !selectedCategory ||
      !selectedSub ||
      !gramsNum ||
      gramsNum <= 0 ||
      countNum <= 0
    ) {
      setError('Pick a category, sub-variety, and enter a valid quantity');
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
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.billAmount, 0);
  const discountNum = parseFloat(billDiscount) || 0;
  const excessNum = parseFloat(billExcess) || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountNum + excessNum);

  const submitBill = async () => {
    if (cart.length === 0) {
      setError('Add at least one item before completing the sale');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const billId = `${Date.now()}_${staffName}`;

      // Spread the one bill-level discount across items proportionally,
      // so each item's finalAmount still adds up to the bill total.
      const itemsWithFinal = cart.map((item, index) => {
        const isLastItem = index === cart.length - 1;
        const share = cartSubtotal > 0 ? item.billAmount / cartSubtotal : 0;

        let itemDiscount: number;
        let itemExcess: number;

        if (isLastItem) {
          const discountSoFar = cart.slice(0, -1).reduce((sum, i) => {
            const s = cartSubtotal > 0 ? i.billAmount / cartSubtotal : 0;
            return sum + Number((discountNum * s).toFixed(2));
          }, 0);
          const excessSoFar = cart.slice(0, -1).reduce((sum, i) => {
            const s = cartSubtotal > 0 ? i.billAmount / cartSubtotal : 0;
            return sum + Number((excessNum * s).toFixed(2));
          }, 0);
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

      for (const item of itemsWithFinal) {
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
          excess: item.excess, // ← new field
          finalAmount: item.finalAmount,
          paymentMethod: payment,
          note: note.trim() || null,
        });
      }
      setCart([]);
      setBillDiscount('0');
      setBillExcess('0');
      setNote('');
      navigation.goBack();
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
      <Text style={styles.title}>Sell</Text>

      {cart.length > 0 && (
        <View style={styles.cartBox}>
          <Text style={styles.cartTitle}>
            Bill ({cart.length} item{cart.length > 1 ? 's' : ''})
          </Text>
          {cart.map((item, i) => (
            <View key={i} style={styles.cartRow}>
              <Text style={styles.cartItemText}>
                {item.subVarietyName} —{' '}
                {item.pieceInfo ||
                  `${item.quantity}${getQuantityUnitLabel(item.unit)}`}
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Text style={styles.cartItemAmount}>₹{item.billAmount}</Text>
                <TouchableOpacity onPress={() => removeFromCart(i)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.cartTotalRow}>
            <Text style={styles.cartTotalLabel}>Subtotal</Text>
            <Text style={styles.cartTotalValue}>
              ₹{cartSubtotal.toFixed(2)}
            </Text>
          </View>

          <Text style={styles.label}>Discount for whole bill (₹)</Text>
          <TextInput
            style={styles.input}
            value={billDiscount}
            onChangeText={setBillDiscount}
            keyboardType="decimal-pad"
            placeholder="0"
          />

          <Text style={styles.label}>Excess amount for whole bill (₹)</Text>
          <TextInput
            style={styles.input}
            value={billExcess}
            onChangeText={setBillExcess}
            keyboardType="decimal-pad"
            placeholder="0"
          />

          <View style={styles.cartTotalRow}>
            <Text style={[styles.cartTotalLabel, styles.finalLabel]}>
              Final total
            </Text>
            <Text style={[styles.cartTotalValue, styles.finalLabel]}>
              ₹{cartTotal.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

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
              console.log('cat', cat);

              setSelectedCategory(cat);
              setSelectedSub(null);
              setGrams('');
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
          <Text style={styles.label}>Sub-variety</Text>
          <View style={styles.wrapRow}>
            {selectedCategory.subVarieties.map((sv: any) => (
              <TouchableOpacity
                key={sv.id}
                style={[
                  styles.pill,
                  selectedSub?.id === sv.id && styles.pillActive,
                ]}
                onPress={() => {
                  setSelectedSub(sv);
                  setGrams('');
                  setCount('1');
                }}
              >
                <Text
                  style={
                    selectedSub?.id === sv.id
                      ? styles.pillTextActive
                      : styles.pillText
                  }
                >
                  {sv.name} ({sv.stock.toFixed(2)}
                  {''} {getStockUnitLabel(sv.unit)} left)
                  {sv.pricePerKg === undefined || sv.pricePerKg === null
                    ? ' ⚠️ no price set'
                    : ''}
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
                onPress={() => pickGrams(g)}
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
            placeholder={`or type a custom amount (${getQuantityUnitLabel(
              selectedSub.unit,
            )})`}
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
            Amount: ₹{billAmount.toFixed(2)}{' '}
            {countNum > 1 ? `(${countNum} × ₹${perUnitAmount.toFixed(2)})` : ''}
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
                payment === 'cash' && styles.paymentBtnActive,
              ]}
              onPress={() => setPayment('cash')}
            >
              <Text
                style={
                  payment === 'cash' ? styles.pillTextActive : styles.pillText
                }
              >
                Cash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentBtn,
                payment === 'gpay' && styles.paymentBtnActive,
              ]}
              onPress={() => setPayment('gpay')}
            >
              <Text
                style={
                  payment === 'gpay' ? styles.pillTextActive : styles.pillText
                }
              >
                GPay
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. regular customer, delivery order"
          />

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
                Complete sale — ₹{cartTotal.toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 80 }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    paddingTop: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF4EC',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2B160C',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A4A2B',
    marginTop: 16,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  cartTitle: { fontWeight: '700', color: '#2B160C', marginBottom: 8 },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  cartItemText: { fontSize: 13, color: '#2B160C', flex: 1 },
  cartItemAmount: { fontSize: 13, fontWeight: '600', color: '#5C3620' },
  removeText: { color: '#9C3654', fontWeight: '700', fontSize: 15 },
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

export default Sell;
