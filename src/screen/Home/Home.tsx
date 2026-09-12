import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { splitProportionally } from 'utils/SalesCalculation';
import {
  getQuantityUnitLabel,
  getStockUnitLabel,
  computeAmount,
  computeStockDelta,
  formatCurrency,
} from 'utils/HelperFn';
import { printReceipt } from 'utils/Printer';
import ScreenContainer from 'components/ScreenContainer';
import { useFocusRefresh } from 'utils/hooks';
import {
  addTransaction,
  getCategories,
  updateCategoryStock,
} from 'services/Service';
import PillGroup from 'components/PillGroup';
import { COLORS } from 'theme/Theme';
import SectionLabel from 'components/SectionLabel';
import CartSummary from './Cart';

const Home = ({ route }: any) => {
  const { shopId, shopName, staffName } = route.params || {};
  const [categories, setCategories] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [grams, setGrams] = useState('');
  const [count, setCount] = useState('1');
  const [cart, setCart] = useState<any[]>([]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [billDiscount, setBillDiscount] = useState('0');
  const [billExcess, setBillExcess] = useState('0');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'gpay' | 'split'>(
    'cash',
  );
  const [splitCash, setSplitCash] = useState('0');
  const [splitGpay, setSplitGpay] = useState('0');

  const load = useCallback(async () => {
    setCategories(await getCategories(shopId));
  }, [shopId]);

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [load]);

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
      const billId = `${Date.now()}_${staffName}`;
      const weights = cart.map(i => i.billAmount);

      const discounts = splitProportionally(weights, discountNum);
      const excesses = splitProportionally(weights, excessNum);

      const itemsWithFinal = cart.map((item, i) => ({
        ...item,
        discount: discounts[i],
        excess: excesses[i],
        finalAmount: Number(
          (item.billAmount - discounts[i] + excesses[i]).toFixed(2),
        ),
      }));

      const finalTotal = itemsWithFinal.reduce((s, i) => s + i.finalAmount, 0);
      const cashAmount =
        paymentMode === 'cash'
          ? finalTotal
          : paymentMode === 'gpay'
          ? 0
          : splitCashNum;
      const cashPortions = splitProportionally(
        itemsWithFinal.map(i => i.finalAmount),
        cashAmount,
      );

      const itemsWithPayment = itemsWithFinal.map((item, i) => ({
        ...item,
        cashPortion: cashPortions[i],
        gpayPortion: Number((item.finalAmount - cashPortions[i]).toFixed(2)),
      }));

      const byCategory: Record<string, any[]> = {};
      itemsWithPayment.forEach(item => {
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
        await updateCategoryStock(shopId, categoryId, updatedSubVarieties);
      }

      for (const item of itemsWithPayment) {
        await addTransaction(shopId, {
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
          paymentMethod: paymentMode,
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
      await load();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.textMuted} />
      </View>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      {cart.length > 0 && (
        <CartSummary
          cart={cart}
          subtotal={cartSubtotal}
          total={cartTotal}
          showMoreOptions={showMoreOptions}
          onToggleOptions={() => setShowMoreOptions(prev => !prev)}
          discount={billDiscount}
          excess={billExcess}
          note={note}
          onDiscountChange={setBillDiscount}
          onExcessChange={setBillExcess}
          onNoteChange={setNote}
          onRemove={removeFromCart}
        />
      )}

      <SectionLabel>Quick Sell</SectionLabel>
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

      <SectionLabel>Category</SectionLabel>
      <PillGroup
        options={categories.map(cat => ({
          key: cat.id,
          label: cat.name,
        }))}
        selectedKey={selectedCategory?.id ?? null}
        onSelect={key => {
          const category = categories.find(cat => cat.id === key);

          setSelectedCategory(category);
          setSelectedSub(null);
        }}
      />

      {selectedCategory && (
        <>
          <SectionLabel>Item</SectionLabel>

          <PillGroup
            options={(selectedCategory.subVarieties || []).map((sv: any) => ({
              key: sv.id,
              label: `${sv.name} (${sv.stock.toFixed(2)}${getStockUnitLabel(
                sv.unit,
              )})`,
            }))}
            selectedKey={selectedSub?.id ?? null}
            onSelect={key => {
              const subVariety = selectedCategory.subVarieties?.find(
                (sv: any) => sv.id === key,
              );

              if (subVariety) {
                selectItem(selectedCategory, subVariety);
              }
            }}
          />
        </>
      )}

      {selectedSub && (
        <>
          <SectionLabel>
            Quantity ({getQuantityUnitLabel(selectedSub.unit)})
          </SectionLabel>
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
              <SectionLabel>How many?</SectionLabel>
              <TextInput
                style={styles.input}
                value={count}
                onChangeText={setCount}
                keyboardType="number-pad"
                placeholder="1"
              />
            </>
          )}

          <SectionLabel>
            Amount: {formatCurrency(billAmount)}{' '}
            {countNum > 1
              ? `(${countNum} × ${formatCurrency(perUnitAmount)})`
              : ''}
          </SectionLabel>

          <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
            <Text style={styles.addBtnText}>+ Add to bill</Text>
          </TouchableOpacity>
        </>
      )}

      {cart.length > 0 && (
        <>
          <SectionLabel>Payment method</SectionLabel>
          <PillGroup
            options={[
              { key: 'cash', label: 'Cash' },
              { key: 'gpay', label: 'GPay' },
              { key: 'split', label: 'Split' },
            ]}
            selectedKey={paymentMode}
            equalWidth
            onSelect={key => {
              const mode = key as 'cash' | 'gpay' | 'split';

              setPaymentMode(mode);

              if (mode === 'split') {
                setSplitCash(cartTotal.toFixed(2));
                setSplitGpay('0');
              }
            }}
          />

          {paymentMode === 'split' && (
            <>
              <SectionLabel>Cash amount (₹)</SectionLabel>
              <TextInput
                style={styles.input}
                value={splitCash}
                onChangeText={setSplitCash}
                keyboardType="decimal-pad"
              />
              <SectionLabel>GPay amount (₹)</SectionLabel>
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
                = {formatCurrency(splitTotal)}{' '}
                {splitMismatch
                  ? `(should be ${formatCurrency(cartTotal)})`
                  : '✓'}
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
              <ActivityIndicator color={COLORS.white} />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    backgroundColor: COLORS.cacao,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  quickBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  presetBtn: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  presetText: { color: COLORS.cacao, fontWeight: '600', fontSize: 13 },
  splitErrorText: { color: COLORS.danger, fontSize: 12.5, marginTop: 6 },
  splitOkText: { color: COLORS.success, fontSize: 12.5, marginTop: 6 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  addBtn: {
    marginTop: 16,
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  error: { color: COLORS.danger, marginTop: 12 },
  button: {
    marginTop: 24,
    backgroundColor: COLORS.caramel,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});

export default Home;
