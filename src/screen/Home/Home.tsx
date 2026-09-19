import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  applyReturnsToTotals,
  computeCashGpayTotals,
  excludeVoided,
  splitProportionally,
} from 'utils/SalesCalculation';
import {
  getQuantityUnitLabel,
  getStockUnitLabel,
  computeAmount,
  computeStockDelta,
  formatCurrency,
  roundStock,
} from 'utils/HelperFn';
import ScreenContainer from 'components/ScreenContainer';
import { useFocusRefresh } from 'utils/hooks';
import {
  addTransaction,
  getCategories,
  getSalesRecord,
  getTransactionsForDate,
  updateCategoryStock,
  updateSalesRecord,
} from 'services/Service';
import PillGroup from 'components/PillGroup';
import { COLORS } from 'theme/Theme';
import CartSummary from './Cart';
import ConfettiCannon from 'react-native-confetti-cannon';
import { homeStyles } from './styles';
import ChocolateLoader from 'components/ChocolateLoader';
import AnimatedPressable from 'components/AnimatedPressable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Category, SubVariety } from 'types/Domain';
import { useWindowDimensions } from 'react-native';

const Home = ({ route }: { route: { params?: Record<string, string> } }) => {
  const { shopId, shopName, staffName } = route.params || {};
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Pick<
    Category,
    'id' | 'name'
  > | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubVariety | null>(null);
  const [grams, setGrams] = useState('');
  const [count, setCount] = useState('1');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [billDiscount, setBillDiscount] = useState('0');
  const [amountOverride, setAmountOverride] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'gpay' | 'split'>(
    'cash',
  );
  const [splitCash, setSplitCash] = useState('0');
  const [splitGpay, setSplitGpay] = useState('0');
  const [showRecordCelebration, setShowRecordCelebration] = useState(false);
  const [recordAmount, setRecordAmount] = useState(0);

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  React.useEffect(() => {
    if (showRecordCelebration) {
      const timer = setTimeout(() => setShowRecordCelebration(false), 5000); // card stays 5s regardless of confetti
      return () => clearTimeout(timer);
    }
  }, [showRecordCelebration]);

  const load = useCallback(async () => {
    setCategories(await getCategories(shopId));
    checkForUnseenCelebration();
  }, [shopId]);

  const PRIORITY_CATEGORIES = ['chocolate', 'jelly', 'rusk', 'oils items']; // lowercase, matched against cat.name

  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      const aIndex = PRIORITY_CATEGORIES.indexOf(a.name.toLowerCase());
      const bIndex = PRIORITY_CATEGORIES.indexOf(b.name.toLowerCase());
      const aRank = aIndex === -1 ? PRIORITY_CATEGORIES.length : aIndex;
      const bRank = bIndex === -1 ? PRIORITY_CATEGORIES.length : bIndex;
      return aRank - bRank; // priority categories sort first, in the order listed; everything else keeps relative order after
    });
  }, [categories]);

  const checkForUnseenCelebration = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const monthKey = now.toISOString().slice(0, 7);

      const record = await getSalesRecord(shopId, monthKey);
      if (!record || record.date !== today) return; // no record set today, nothing to show

      const seenKey = `seen_record_${shopId}_${today}_${record.amount}`;
      const alreadySeen = await AsyncStorage.getItem(seenKey);
      if (alreadySeen) return; // this device already saw today's current record

      await AsyncStorage.setItem(seenKey, 'true');
      setRecordAmount(record.amount);
      setShowRecordCelebration(true);
    } catch (e) {
      console.log('Celebration check failed:', e);
    }
  };

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [load]);

  const quickItems = useMemo(
    () =>
      categories
        .flatMap(cat =>
          cat.subVarieties.map((sv: SubVariety) => ({
            ...sv,
            categoryId: cat.id,
            categoryName: cat.name,
          })),
        )
        .filter(sv => sv.pricePerKg > 300)
        .slice(0, 8),
    [categories],
  );

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
  const selectItem = (
    cat: Pick<Category, 'id' | 'name'>,
    sv: SubVariety,
    presetGrams?: number,
  ) => {
    setSelectedCategory(cat);
    setSelectedSub(sv);
    setGrams(presetGrams ? String(presetGrams) : '');
    setCount('1');
    setAmountOverride(null); // reset to calculated value for the new item
    setError('');
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
        billAmount: Number(finalItemAmount.toFixed(2)), // ← uses override if present
      },
    ]);
    setSelectedCategory(null);
    setSelectedSub(null);
    setGrams('');
    setCount('1');
    setAmountOverride(null);
    setError('');
  };

  const removeFromCart = (index: number) =>
    setCart(prev => prev.filter((_, i) => i !== index));

  const cartSubtotal = cart.reduce((sum, item) => sum + item.billAmount, 0);

  const discountNum = parseFloat(billDiscount) || 0;

  const cartTotal = Math.max(0, cartSubtotal - discountNum);

  const splitCashNum = parseFloat(splitCash) || 0;
  const splitGpayNum = parseFloat(splitGpay) || 0;
  const splitTotal = splitCashNum + splitGpayNum;

  const splitMismatch =
    paymentMode === 'split' && Math.abs(splitTotal - cartTotal) > 0.01;

  const finalItemAmount =
    amountOverride !== null ? parseFloat(amountOverride) || 0 : billAmount;

  const checkSalesRecord = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const monthKey = now.toISOString().slice(0, 7);

      const allTx = await getTransactionsForDate(shopId, today);
      const sales = excludeVoided(allTx.filter(t => t.type === 'sale'));
      const returns = allTx.filter(t => t.type === 'return');
      const { cash, gpay } = applyReturnsToTotals(
        computeCashGpayTotals(sales),
        sales,
        returns,
      );
      const todayTotal = cash + gpay;

      const record = await getSalesRecord(shopId, monthKey);
      if (!record || todayTotal > record.amount) {
        await updateSalesRecord(shopId, monthKey, todayTotal, today);
      }
    } catch (e) {
      console.log('Sales record check failed:', e);
    }
  };

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
      const discounts = splitProportionally(
        cart.map(i => i.billAmount),
        discountNum,
      );
      const itemsWithFinal = cart.map((item, i) => ({
        ...item,
        discount: discounts[i],
        finalAmount: Number((item.billAmount - discounts[i]).toFixed(2)),
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

      const byCategory: Record<string, CartItem[]> = {};

      itemsWithPayment.forEach(item => {
        if (!byCategory[item.categoryId]) {
          byCategory[item.categoryId] = [];
        }

        byCategory[item.categoryId].push(item);
      });

      for (const categoryId of Object.keys(byCategory)) {
        const category = categories.find(c => c.id === categoryId);

        const itemsForThisCategory = byCategory[categoryId];

        const updatedSubVarieties = category.subVarieties.map(
          (sv: SubVariety) => {
            const deductions = itemsForThisCategory
              .filter(i => i.subVarietyId === sv.id)
              .reduce(
                (sum, i) => sum + computeStockDelta(sv.unit, i.quantity),
                0,
              );

            return deductions > 0
              ? {
                  ...sv,
                  stock: roundStock(sv.stock - deductions),
                }
              : sv;
          },
        );
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
          finalAmount: item.finalAmount,
          cashPortion: item.cashPortion,
          gpayPortion: item.gpayPortion,
          paymentMethod: paymentMode,
          note: note.trim() || null,
        });
      }

      setCart([]);
      setBillDiscount('0');
      setNote('');
      setSplitCash('0');
      setSplitGpay('0');
      setShowMoreOptions(false);
      await load();
      await checkSalesRecord();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={homeStyles.center}>
        <ChocolateLoader text="Loading..." />
      </View>
    );
  }

  const subItems =
    categories.find(category => category.id === selectedCategory?.id)
      ?.subVarieties || [];

  const renderProductSelection = () => (
    <>
      {/* QUICK SELL */}
      <View style={homeStyles.sectionHeader}>
        <View>
          <Text style={homeStyles.sectionTitle}>Quick Sell</Text>
          <Text style={homeStyles.sectionSubtitle}>Frequently sold items</Text>
        </View>
      </View>

      {quickItems.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={homeStyles.quickScroll}
        >
          {quickItems.map(sv => (
            <AnimatedPressable
              key={sv.id}
              style={homeStyles.quickCard}
              onPress={() =>
                selectItem(
                  { id: sv.categoryId, name: sv.categoryName },
                  sv,
                  sv.presetAmounts[0],
                )
              }
            >
              <View style={homeStyles.quickIcon}>
                <Text style={homeStyles.quickIconText}>+</Text>
              </View>
              <Text style={homeStyles.quickName} numberOfLines={1}>
                {sv.name}
              </Text>
              <Text style={homeStyles.quickPrice}>
                {formatCurrency(sv.pricePerKg)}/kg
              </Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      )}

      {/* CATEGORY */}
      <View style={homeStyles.section}>
        <Text style={homeStyles.sectionTitle}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={homeStyles.categoryGridScroll}
        >
          <View style={homeStyles.categoryGrid}>
            {sortedCategories.map(cat => {
              const active = selectedCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    homeStyles.categoryChip,
                    active && homeStyles.categoryChipActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setSelectedSub(null);
                    setGrams('');
                    setCount('1');
                    setError('');
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={
                      active
                        ? homeStyles.categoryChipTextActive
                        : homeStyles.categoryChipText
                    }
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* ITEMS */}
      {selectedCategory && (
        <View style={homeStyles.section}>
          <View style={homeStyles.itemHeader}>
            <View>
              <Text style={homeStyles.sectionTitle}>Items</Text>
              <Text style={homeStyles.sectionSubtitle}>
                Select an item to sell
              </Text>
            </View>
            <View style={homeStyles.itemCountBadge}>
              <Text style={homeStyles.itemCountText}>{subItems.length}</Text>
            </View>
          </View>

          {subItems.length > 0 ? (
            <View style={homeStyles.itemGrid}>
                {subItems.map((sv: SubVariety, index: number) => {
                const active = selectedSub?.id === sv.id;
                const stock = Number(sv.stock || 0);
                const isLowStock = stock <= sv.lowStockThreshold;
                const stockUnit = getStockUnitLabel(sv.unit);
                return (
                  <TouchableOpacity
                    key={sv.id || index}
                    style={[
                      homeStyles.itemCard,
                      active && homeStyles.itemCardActive,
                      !active && isLowStock && homeStyles.itemCardLowStock,
                    ]}
                    onPress={() => selectItem(selectedCategory, sv)}
                    activeOpacity={0.8}
                  >
                    <View style={homeStyles.itemTop}>
                      <View style={homeStyles.itemInfo}>
                        <Text
                          style={[
                            homeStyles.itemName,
                            active && homeStyles.itemNameActive,
                          ]}
                          numberOfLines={2}
                        >
                          {sv.name}
                        </Text>
                        <Text
                          style={[
                            homeStyles.itemPrice,
                            active && homeStyles.itemPriceActive,
                          ]}
                        >
                          {formatCurrency(sv.pricePerKg)}/ {stockUnit}
                        </Text>
                      </View>
                      <View
                        style={[
                          homeStyles.checkCircle,
                          active && homeStyles.checkCircleActive,
                        ]}
                      >
                        {active && <Text style={homeStyles.checkText}>✓</Text>}
                      </View>
                    </View>
                    <View style={homeStyles.stockRow}>
                      <Text
                        style={[
                          homeStyles.stockLabel,
                          active && homeStyles.stockLabelActive,
                        ]}
                      >
                        Stock
                      </Text>
                      <Text
                        style={[
                          homeStyles.stockValue,
                          active && homeStyles.stockValueActive,
                          !active &&
                            isLowStock &&
                            homeStyles.stockValueLowStock,
                        ]}
                      >
                        {stock.toFixed(2)} {stockUnit}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={homeStyles.emptyBox}>
              <Text style={homeStyles.emptyTitle}>No items available</Text>
              <Text style={homeStyles.emptyText}>
                This category has no items.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* QUANTITY / SELL PANEL */}
      {selectedSub && (
        <View style={homeStyles.sellPanel}>
          <View style={homeStyles.sellPanelHeader}>
            <View>
              <Text style={homeStyles.sellPanelTitle}>{selectedSub.name}</Text>
              <Text style={homeStyles.sellPanelSubtitle}>
                Enter quantity to sell
              </Text>
            </View>
            <View style={homeStyles.sellStockBadge}>
              <Text style={homeStyles.sellStockText}>
                {Number(selectedSub.stock || 0).toFixed(2)}{' '}
                {getStockUnitLabel(selectedSub.unit)} left
              </Text>
            </View>
          </View>

          <Text style={homeStyles.fieldLabel}>Quantity</Text>
          <View style={homeStyles.presetRow}>
            {(selectedSub.presetAmounts || []).map((g: number) => {
              const active = grams === String(g);
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    homeStyles.presetBtn,
                    active && homeStyles.presetBtnActive,
                  ]}
                  onPress={() => setGrams(String(g))}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      homeStyles.presetText,
                      active && homeStyles.presetTextActive,
                    ]}
                  >
                    {g}
                    {getQuantityUnitLabel(selectedSub.unit)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={homeStyles.quantityControl}>
            <TouchableOpacity
              style={homeStyles.quantityButton}
              onPress={() => {
                const current = parseFloat(grams || '0');
                const preset = Number(selectedSub.presetAmounts?.[0]) || 0;
                const next = Math.max(0, current - preset);
                setGrams(next > 0 ? String(next) : '');
              }}
              activeOpacity={0.7}
            >
              <Text style={homeStyles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={homeStyles.quantityInput}
              value={grams}
              onChangeText={setGrams}
              keyboardType="decimal-pad"
              placeholder="Quantity"
              placeholderTextColor={COLORS.textFaint}
              textAlign="center"
            />
            <TouchableOpacity
              style={homeStyles.quantityButton}
              onPress={() => {
                const current = parseFloat(grams || '0');
                const preset = Number(selectedSub.presetAmounts?.[0]) || 1;
                setGrams(String(current + preset));
              }}
              activeOpacity={0.7}
            >
              <Text style={homeStyles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {selectedSub.unit !== 'pcs' && (
            <>
              <View style={homeStyles.countHeader}>
                <Text style={homeStyles.fieldLabel}>How many?</Text>
                <Text style={homeStyles.countHint}>Same quantity each</Text>
              </View>
              <View style={homeStyles.countBox}>
                <TouchableOpacity
                  style={homeStyles.countButton}
                  onPress={() =>
                    setCount(
                      String(Math.max(1, (parseInt(count || '1') || 1) - 1)),
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={homeStyles.countButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={homeStyles.countInput}
                  value={count}
                  onChangeText={t => setCount(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={homeStyles.countButton}
                  onPress={() =>
                    setCount(String((parseInt(count || '1') || 1) + 1))
                  }
                  activeOpacity={0.7}
                >
                  <Text style={homeStyles.countButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={homeStyles.amountSummary}>
            <View>
              <Text style={homeStyles.amountLabel}>Amount</Text>
              {countNum > 1 && (
                <Text style={homeStyles.amountCalculation}>
                  {countNum} × {formatCurrency(perUnitAmount)}
                </Text>
              )}
              {amountOverride !== null &&
                parseFloat(amountOverride) !== billAmount && (
                  <Text style={homeStyles.amountCalculation}>
                    Calculated: {formatCurrency(billAmount)}
                  </Text>
                )}
            </View>
            <TextInput
              style={homeStyles.amountInput}
              value={amountOverride ?? billAmount.toFixed(2)}
              onChangeText={setAmountOverride}
              keyboardType="decimal-pad"
              textAlign="right"
            />
          </View>

          {!!error && (
            <View style={homeStyles.errorBox}>
              <View style={homeStyles.errorCircle}>
                <Text style={homeStyles.errorIcon}>!</Text>
              </View>
              <Text style={homeStyles.errorText}>{error}</Text>
            </View>
          )}

          <AnimatedPressable style={homeStyles.addBtn} onPress={addToCart}>
            <Text style={homeStyles.addBtnIcon}>+</Text>
            <Text style={homeStyles.addBtnText}>Add to bill</Text>
          </AnimatedPressable>
        </View>
      )}
    </>
  );

  const renderCartAndPayment = () => (
    <>
      {cart.length > 0 && (
        <View style={homeStyles.cartWrapper}>
          <CartSummary
            cart={cart}
            subtotal={cartSubtotal}
            total={cartTotal}
            showMoreOptions={showMoreOptions}
            onToggleOptions={() => setShowMoreOptions(prev => !prev)}
            discount={billDiscount}
            note={note}
            onDiscountChange={setBillDiscount}
            onNoteChange={setNote}
            onRemove={removeFromCart}
          />
        </View>
      )}

      {cart.length > 0 && (
        <View style={homeStyles.paymentSection}>
          <View style={homeStyles.paymentHeader}>
            <View>
              <Text style={homeStyles.sectionTitle}>Payment</Text>
              <Text style={homeStyles.sectionSubtitle}>
                Choose payment method
              </Text>
            </View>
            <Text style={homeStyles.paymentTotal}>
              {formatCurrency(cartTotal)}
            </Text>
          </View>

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
            <View style={homeStyles.splitBox}>
              <View style={homeStyles.splitInputGroup}>
                <Text style={homeStyles.splitLabel}>Cash</Text>
                <TextInput
                  style={homeStyles.splitInput}
                  value={splitCash}
                  onChangeText={setSplitCash}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={homeStyles.splitInputGroup}>
                <Text style={homeStyles.splitLabel}>GPay</Text>
                <TextInput
                  style={homeStyles.splitInput}
                  value={splitGpay}
                  onChangeText={setSplitGpay}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text
                style={
                  splitMismatch
                    ? homeStyles.splitErrorText
                    : homeStyles.splitOkText
                }
              >
                {formatCurrency(splitCashNum)} + {formatCurrency(splitGpayNum)}{' '}
                = {formatCurrency(splitTotal)}{' '}
                {splitMismatch
                  ? `(should be ${formatCurrency(cartTotal)})`
                  : '✓'}
              </Text>
            </View>
          )}

          {!!error && !selectedSub && (
            <View style={homeStyles.errorBox}>
              <View style={homeStyles.errorCircle}>
                <Text style={homeStyles.errorIcon}>!</Text>
              </View>
              <Text style={homeStyles.errorText}>{error}</Text>
            </View>
          )}

          <AnimatedPressable
            style={[
              homeStyles.completeButton,
              saving && homeStyles.completeButtonDisabled,
            ]}
            onPress={submitBill}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <View style={homeStyles.completeIcon}>
                  <Text style={homeStyles.completeIconText}>✓</Text>
                </View>
                <View>
                  <Text style={homeStyles.completeText}>Complete sale</Text>
                  <Text style={homeStyles.completeSubtext}>
                    {cart.length} item{cart.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={homeStyles.completeAmount}>
                  {formatCurrency(cartTotal)}
                </Text>
              </>
            )}
          </AnimatedPressable>
        </View>
      )}

      {cart.length === 0 && isTablet && (
        <View style={homeStyles.emptyCartHint}>
          <Text style={homeStyles.emptyCartHintText}>
            Add items to see your bill here
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={homeStyles.homeScreen}>
      {isTablet ? (
        <View style={homeStyles.tabletRow}>
          <ScrollView
            style={homeStyles.tabletLeftCol}
            contentContainerStyle={homeStyles.container}
            keyboardShouldPersistTaps="handled"
          >
            {renderProductSelection()}
            <View style={homeStyles.bottomSpace} />
          </ScrollView>
          <ScrollView
            style={homeStyles.tabletRightCol}
            contentContainerStyle={homeStyles.tabletRightColContent}
            keyboardShouldPersistTaps="handled"
          >
            {renderCartAndPayment()}
            <View style={homeStyles.bottomSpace} />
          </ScrollView>
        </View>
      ) : (
        <ScreenContainer
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={homeStyles.container}
        >
          {renderCartAndPayment()}
          {renderProductSelection()}
          <View style={homeStyles.bottomSpace} />
        </ScreenContainer>
      )}

      {showRecordCelebration && (
        <View style={homeStyles.celebrationOverlay} pointerEvents="box-none">
          <ConfettiCannon
            count={200}
            origin={{ x: 200, y: -20 }}
            fadeOut
            autoStart
          />

          <View style={homeStyles.celebrationCard}>
            {/* Top badge */}
            <View style={homeStyles.recordBadge}>
              <Text style={homeStyles.recordBadgeText}>★ SALES RECORD ★</Text>
            </View>

            {/* Icon */}
            <View style={homeStyles.trophyCircle}>
              <Text style={homeStyles.trophyIcon}>🏆</Text>
            </View>

            {/* Title */}
            <Text style={homeStyles.celebrationTitle}>New Best Sales Day!</Text>

            <Text style={homeStyles.celebrationSubtitle}>
              You just reached your highest
              {'\n'}
              sales for this month.
            </Text>

            {/* Amount */}
            <View style={homeStyles.amountBox}>
              <Text style={homeStyles.amountLabelAni}>TODAY'S SALES</Text>

              <Text style={homeStyles.celebrationAmount}>
                {formatCurrency(recordAmount)}
              </Text>
            </View>

            <Text style={homeStyles.celebrationMessage}>
              Great work today — keep it up!
            </Text>

            {/* Bottom decoration */}
            <View style={homeStyles.celebrationDivider}>
              <View style={homeStyles.dividerLine} />
              <Text style={homeStyles.chocolateMark}>🍫</Text>
              <View style={homeStyles.dividerLine} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Home;
