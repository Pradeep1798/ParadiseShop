import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import { computeStockDelta, formatCurrency } from 'utils/HelperFn';

import ScreenContainer from 'components/ScreenContainer';
import SectionLabel from 'components/SectionLabel';
import Card from 'components/Card';
import EmptyState from 'components/EmptyState';
import ModalOverlay from 'components/ModalOverlay';
import PillGroup from 'components/PillGroup';
import AppButton from 'components/AppButton';
import AppInput from 'components/AppInput';

import {
  addTransaction,
  getCategories,
  getTransactionsForDate,
  updateCategoryStock,
  updateTransaction,
  addVoidRecord,
  getManagementStaff,
  getShopLocationUrl,
} from 'services/Service';

import { excludeVoided } from 'utils/SalesCalculation';
import { useFocusRefresh } from 'utils/hooks';
import { COLORS } from 'theme/Theme';
import { printReceipt } from 'utils/Printer';
import { BillStyles } from './BillStyles';
import AnimatedAmount from 'components/AnimatedAmount';
import ChocolateLoader from 'components/ChocolateLoader';
import {
  BillItem,
  BillRecord,
  Category,
  StaffMember,
  SubVariety,
  Transaction,
} from 'types/Domain';

const Bills = ({ route }: { route: { params: Record<string, string> } }) => {
  const { shopId, staffName, role } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [returningItem, setReturningItem] = useState<BillItem | null>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnSaving, setReturnSaving] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [refundPayment, setRefundPayment] = useState<'cash' | 'gpay'>('cash');
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [staffFilter, setStaffFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'cash' | 'gpay' | null>(
    null,
  );
  const [voidingBill, setVoidingBill] = useState<BillRecord | null>(null);
  const [voidApprover, setVoidApprover] = useState<string | null>(null);
  const [managementStaff, setManagementStaff] = useState<StaffMember[]>([]);
  const [voidPasswordInput, setVoidPasswordInput] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [voidSaving, setVoidSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [printingBillId, setPrintingBillId] = useState<string | null>(null);
  const [printError, setPrintError] = useState('');

  const canRequestVoid = role === 'owner' || role === 'manager';

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const changeDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const newDate = d.toISOString().slice(0, 10);
    if (newDate > new Date().toISOString().slice(0, 10)) return;
    setSelectedDate(newDate);
  };

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const todayStr = new Date().toISOString().slice(0, 10);
    const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yestStr) return 'Yesterday';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const load = useCallback(async () => {
    const [cats, all] = await Promise.all([
      getCategories(shopId),
      getTransactionsForDate(shopId, selectedDate),
    ]);
    setCategories(cats);

    const salesToday = excludeVoided(all.filter(t => t.type === 'sale'));
    const returns = all.filter(t => t.type === 'return');

    const grouped: Record<string, BillRecord> = {};
    salesToday.forEach((t: Transaction) => {
      if (!t.billId) return;
      if (!grouped[t.billId]) {
        grouped[t.billId] = {
          billId: t.billId,
          staffName: t.staffName,
          paymentMethod: t.paymentMethod || 'cash',
          timestamp: t.timestamp,
          items: [],
          total: 0,
        };
      }
      const returnedForThisItem = returns
        .filter(r => r.originalTransactionId === t.id)
        .reduce((sum, r) => sum + r.quantity, 0);
      const refundForThisItem = returns
        .filter(r => r.originalTransactionId === t.id)
        .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

      grouped[t.billId].items.push({
        ...t,
        returnedQty: returnedForThisItem,
        netAmount: (t.finalAmount || 0) - refundForThisItem,
      });
    });

    const billsList = Object.values(grouped).map(bill => ({
      ...bill,
      total: bill.items.reduce((sum, i) => sum + i.netAmount, 0),
    }));

    setBills(billsList.sort((a, b) => b.timestamp - a.timestamp));
  }, [shopId, selectedDate]);

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [load]);
  const staffOptions = Array.from(new Set(bills.map(b => b.staffName)));
  const activeFilterCount = (staffFilter ? 1 : 0) + (paymentFilter ? 1 : 0);

  React.useEffect(() => {
    getManagementStaff(shopId).then(setManagementStaff);
  }, [shopId]);

  const openReturn = (item: BillItem) => {
    setReturningItem(item);
    setReturnQty(String(item.quantity - item.returnedQty));
    setRefundPayment(
      item.paymentMethod === 'split' || item.paymentMethod === 'cash'
        ? 'cash'
        : item.paymentMethod === 'gpay'
        ? 'gpay'
        : 'cash',
    );
    setReturnError('');
  };

  const confirmReturn = async () => {
    if (!returningItem) {
      setReturnError('No item selected');
      return;
    }

    const item = returningItem;
    const qty = parseFloat(returnQty);
    const maxReturnable = item.quantity - item.returnedQty;
    if (!qty || qty <= 0) {
      setReturnError('Enter a valid quantity');
      return;
    }
    if (qty > maxReturnable) {
      setReturnError(`Only ${maxReturnable}${item.unit} can be returned`);
      return;
    }

    setReturnSaving(true);
    setReturnError('');
    try {
      const refundAmount = Number(
        (
          (qty / item.quantity) *
          (item.finalAmount ?? item.billAmount ?? 0)
        ).toFixed(2),
      );
      const restoreAmount = computeStockDelta(item.unit, qty);
      const category = categories.find(c => c.id === item.categoryId);
      if (!category) {
        setReturnError('Category not found. Try again.');
        return;
      }
      const updatedSubVarieties = category.subVarieties.map((sv: SubVariety) =>
        sv.id === item.subVarietyId
          ? { ...sv, stock: sv.stock + restoreAmount }
          : sv,
      );
      await updateCategoryStock(shopId, item.categoryId, updatedSubVarieties);

      await addTransaction(shopId, {
        type: 'return',
        billId: item.billId,
        originalTransactionId: item.id,
        date: new Date().toISOString().slice(0, 10),
        timestamp: Date.now(),
        staffName,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        subVarietyId: item.subVarietyId,
        subVarietyName: item.subVarietyName,
        quantity: qty,
        unit: item.unit,
        refundAmount,
        refundMethod: refundPayment,
      });

      setReturningItem(null);
      setReturnQty('');
      await load();
    } catch (e) {
      setReturnError('Something went wrong, try again');
    } finally {
      setReturnSaving(false);
    }
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const updateBillPayment = async (
    bill: BillRecord,
    newMethod: 'cash' | 'gpay',
  ) => {
    setPaymentSaving(true);
    try {
      await Promise.all(
        bill.items.map(item =>
          updateTransaction(shopId, item.id, {
            paymentMethod: newMethod,
            cashPortion: newMethod === 'cash' ? item.finalAmount : 0,
            gpayPortion: newMethod === 'gpay' ? item.finalAmount : 0,
          }),
        ),
      );
      setEditingPayment(null);
      await load();
    } catch (e) {
      console.log('Could not update payment method');
    } finally {
      setPaymentSaving(false);
    }
  };

  const openVoid = (bill: BillRecord) => {
    setVoidingBill(bill);
    setVoidApprover(null);
    setVoidPasswordInput('');
    setVoidReason('');
    setVoidError('');
  };

  const confirmVoid = async () => {
    if (!voidingBill) {
      setVoidError('No bill selected');
      return;
    }

    const bill = voidingBill;
    const approver = managementStaff.find(p => p.name === voidApprover);
    if (!approver) {
      setVoidError('Select who is approving this void');
      return;
    }
    if (!voidReason.trim()) {
      setVoidError('Enter a reason for voiding this bill');
      return;
    }
    if (voidPasswordInput !== approver.password) {
      setVoidError('Incorrect password');
      return;
    }

    setVoidSaving(true);
    setVoidError('');
    try {
      const byCategory: Record<string, BillItem[]> = {};
      bill.items.forEach(item => {
        if (!byCategory[item.categoryId]) byCategory[item.categoryId] = [];
        byCategory[item.categoryId].push(item);
      });
      for (const categoryId of Object.keys(byCategory)) {
        const category = categories.find(c => c.id === categoryId);
        if (!category) continue;
        const itemsForThisCategory = byCategory[categoryId];
        const updatedSubVarieties = category.subVarieties.map(
          (sv: SubVariety) => {
            const restore = itemsForThisCategory
              .filter(i => i.subVarietyId === sv.id)
              .reduce(
                (sum, i) =>
                  sum + computeStockDelta(sv.unit, i.quantity - i.returnedQty),
                0,
              );
            return restore > 0 ? { ...sv, stock: sv.stock + restore } : sv;
          },
        );
        await updateCategoryStock(shopId, categoryId, updatedSubVarieties);
      }

      await Promise.all(
        bill.items.map(item =>
          updateTransaction(shopId, item.id, { voided: true }),
        ),
      );

      await addVoidRecord(shopId, {
        billId: bill.billId,
        items: bill.items.map(i => ({
          name: i.subVarietyName,
          qty: i.quantity,
          unit: i.unit,
          amount: i.finalAmount ?? i.billAmount ?? 0,
        })),
        originalAmount: bill.total,
        requestedBy: staffName,
        approvedBy: approver.name,
        reason: voidReason.trim(),
        timestamp: Date.now(),
        date: new Date().toISOString().slice(0, 10),
      });

      setVoidingBill(null);
      await load();
    } catch (e) {
      setVoidError('Something went wrong, try again');
    } finally {
      setVoidSaving(false);
    }
  };

  const filteredBills = bills.filter(bill => {
    if (staffFilter && bill.staffName !== staffFilter) return false;
    if (paymentFilter && bill.paymentMethod !== paymentFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <View style={BillStyles.center}>
        <ChocolateLoader
          size="medium"
          text="Good Sales too many bills......."
        />
      </View>
    );
  }

  const handlePrint = async (bill: BillRecord) => {
    const locationUrl = await getShopLocationUrl(shopId);
    setPrintingBillId(bill.billId);
    setPrintError('');
    try {
      await printReceipt({
        shopName: route.params.shopName,
        billItems: bill.items.map(i => ({
          name: i.subVarietyName,
          qty: i.pieceInfo || `${i.quantity}${i.unit}`,
          amount: i.billAmount ?? i.finalAmount ?? 0,
        })),
        discount: bill.items.reduce(
          (sum: number, i) => sum + (i.discount || 0),
          0,
        ),
        total: bill.total,
        paymentMethod: bill.paymentMethod,
        staffName: bill.staffName,
        timestamp: bill.timestamp,
        locationUrl: locationUrl || undefined,
        billId: bill.billId,
      });
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Could not print — check the printer is on and paired.';
      console.log('Print error:', msg);
      setPrintError(msg);
    } finally {
      setPrintingBillId(null);
    }
  };

  return (
    <>
      <ScreenContainer
        refreshing={refreshing}
        onRefresh={onRefresh}
        allowWideContent={isTablet}
      >
        <View style={BillStyles.dateNav}>
          <TouchableOpacity
            onPress={() => changeDay(-1)}
            style={BillStyles.dateNavBtn}
            activeOpacity={0.75}
          >
            <Text style={BillStyles.dateNavArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={BillStyles.dateNavLabel}>
            {formatDateHeader(selectedDate)}
          </Text>
          <TouchableOpacity
            onPress={() => changeDay(1)}
            style={BillStyles.dateNavBtn}
            disabled={isToday}
            activeOpacity={0.75}
          >
            <Text
              style={[
                BillStyles.dateNavArrow,
                isToday && BillStyles.dateNavArrowDisabled,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={BillStyles.filterRow}>
          <Text style={BillStyles.subtitle}>
            {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} ·{' '}
            {formatCurrency(filteredBills.reduce((s, b) => s + b.total, 0))}{' '}
            total
          </Text>
          <TouchableOpacity
            style={BillStyles.filterIconBtn}
            onPress={() => setFilterVisible(v => !v)}
            activeOpacity={0.75}
          >
            <Text style={BillStyles.filterIconText}>
              🔍 Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {filterVisible && (
          <View style={BillStyles.filterPanel}>
            <SectionLabel>Staff</SectionLabel>
            <PillGroup
              options={[
                { key: '', label: 'All' },
                ...staffOptions.map(name => ({ key: name, label: name })),
              ]}
              selectedKey={staffFilter ?? ''}
              onSelect={key => setStaffFilter(key || null)}
            />
            <View style={BillStyles.filterSectionGap} />
            <SectionLabel>Payment Mode</SectionLabel>
            <PillGroup
              options={[
                { key: '', label: 'All' },
                { key: 'cash', label: 'Cash' },
                { key: 'gpay', label: 'GPay' },
              ]}
              selectedKey={paymentFilter ?? ''}
              onSelect={key =>
                setPaymentFilter(key ? (key as 'cash' | 'gpay') : null)
              }
            />
            <TouchableOpacity
              style={BillStyles.applyBtn}
              onPress={() => setFilterVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={BillStyles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}

        {bills.length === 0 && <EmptyState text="No sales yet today." />}

        <View style={isTablet ? BillStyles.tabletGrid : undefined}>
          {filteredBills.map(bill => {
            const billDiscountTotal = bill.items.reduce(
              (sum: number, i) => sum + (i.discount || 0),
              0,
            );
            const billExcessTotal = 0;
            const isVoided = bill.items.every(i => i.voided);

            return (
              <Card
                key={bill.billId}
                style={
                  isTablet || isVoided
                    ? [
                        isTablet ? BillStyles.tabletCard : null,
                        isVoided ? BillStyles.voidedCard : null,
                      ]
                    : undefined
                }
              >
                {isVoided && <Text style={BillStyles.voidedBadge}>VOIDED</Text>}

                {bill.items.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={BillStyles.itemRow}
                    onPress={() =>
                      item.returnedQty < item.quantity &&
                      openReturn({ ...item, billId: bill.billId })
                    }
                    disabled={item.returnedQty >= item.quantity}
                    activeOpacity={item.returnedQty < item.quantity ? 0.7 : 1}
                  >
                    <Text style={BillStyles.itemText}>
                      {item.subVarietyName} ({item.quantity} {item.unit})
                      {item.returnedQty > 0
                        ? ` — ${item.returnedQty}${item.unit} returned`
                        : ''}
                    </Text>
                    <Text style={BillStyles.itemAmount}>
                      {formatCurrency(item.billAmount ?? item.finalAmount ?? 0)}
                    </Text>
                  </TouchableOpacity>
                ))}

                {billDiscountTotal > 0 && (
                  <View style={BillStyles.itemRow}>
                    <Text
                      style={[BillStyles.itemText, BillStyles.discountText]}
                    >
                      Discount
                    </Text>
                    <Text
                      style={[BillStyles.itemAmount, BillStyles.discountText]}
                    >
                      -{formatCurrency(billDiscountTotal)}
                    </Text>
                  </View>
                )}

                {billExcessTotal > 0 && (
                  <View style={BillStyles.itemRow}>
                    <Text style={[BillStyles.itemText, BillStyles.excessText]}>
                      Excess
                    </Text>
                    <Text
                      style={[BillStyles.itemAmount, BillStyles.excessText]}
                    >
                      +{formatCurrency(billExcessTotal)}
                    </Text>
                  </View>
                )}

                {!!bill.items[0]?.note && (
                  <Text style={BillStyles.noteText}>
                    📝 {bill.items[0].note}
                  </Text>
                )}

                <View style={BillStyles.footerRow}>
                  <View style={BillStyles.leftGroup}>
                    {editingPayment === bill.billId ? (
                      <View style={BillStyles.paymentEditRow}>
                        <TouchableOpacity
                          style={[BillStyles.badge, BillStyles.badgeCash]}
                          onPress={() => updateBillPayment(bill, 'cash')}
                          disabled={paymentSaving}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              BillStyles.badgeText,
                              BillStyles.badgeTextCash,
                            ]}
                          >
                            Cash
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[BillStyles.badge, BillStyles.badgeGpay]}
                          onPress={() => updateBillPayment(bill, 'gpay')}
                          disabled={paymentSaving}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              BillStyles.badgeText,
                              BillStyles.badgeTextGpay,
                            ]}
                          >
                            GPay
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setEditingPayment(bill.billId)}
                        activeOpacity={0.7}
                      >
                        <View style={BillStyles.paymentBadgeContent}>
                          <Text
                            style={[
                              BillStyles.badgeText,
                              bill.paymentMethod === 'gpay'
                                ? BillStyles.badgeTextGpay
                                : bill.paymentMethod === 'split'
                                ? BillStyles.badgeTextSplit
                                : BillStyles.badgeTextCash,
                            ]}
                          >
                            {bill.paymentMethod === 'split'
                              ? 'Split'
                              : bill.paymentMethod === 'gpay'
                              ? 'GPay'
                              : 'Cash'}
                          </Text>
                          <Text style={BillStyles.editIcon}>✎</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    <Text style={BillStyles.staffName} numberOfLines={1}>
                      {bill.staffName} · {formatTime(bill.timestamp)}
                    </Text>
                  </View>
                  <AnimatedAmount
                    value={bill.total}
                    style={BillStyles.amount}
                  />
                </View>

                <View style={BillStyles.cardActionsRow}>
                  <TouchableOpacity
                    style={BillStyles.printButton}
                    onPress={() => handlePrint(bill)}
                    disabled={printingBillId === bill.billId}
                    activeOpacity={0.75}
                  >
                    <Text style={BillStyles.printButtonText}>
                      {printingBillId === bill.billId ? 'Printing…' : '🖨 Print'}
                    </Text>
                  </TouchableOpacity>

                  {!isVoided && canRequestVoid && (
                    <TouchableOpacity
                      style={BillStyles.voidButton}
                      onPress={() => openVoid(bill)}
                      activeOpacity={0.75}
                    >
                      <Text style={BillStyles.voidButtonText}>Void bill</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {printError && printingBillId === null && (
                  <Text style={BillStyles.error}>{printError}</Text>
                )}
              </Card>
            );
          })}
        </View>

        <View style={BillStyles.bottomSpace} />
      </ScreenContainer>

      <ModalOverlay visible={!!returningItem}>
        <Text style={BillStyles.modalTitle}>Return Item</Text>
        <Text style={BillStyles.modalTitle}>
          {returningItem?.subVarietyName ?? 'Item'}
        </Text>
        <AppInput
          label={`Quantity (Available: ${
            returningItem
              ? returningItem.quantity - returningItem.returnedQty
              : 0
          })`}
          value={returnQty}
          onChangeText={setReturnQty}
          keyboardType="numeric"
          placeholder="Enter quantity"
          editable={!returnSaving}
        />
        <Text style={[BillStyles.subtitle, { marginBottom: 4 }]}>
          Refund Payment
        </Text>
        <PillGroup
          options={[
            { key: 'cash', label: 'Cash' },
            { key: 'gpay', label: 'GPay' },
          ]}
          selectedKey={refundPayment}
          onSelect={key => setRefundPayment(key as 'cash' | 'gpay')}
          equalWidth
        />
        {!!returnError && <Text style={BillStyles.error}>{returnError}</Text>}
        <View style={BillStyles.modalButtonRow}>
          <AppButton
            label="Confirm Return"
            variant="danger"
            loading={returnSaving}
            disabled={!returnQty}
            onPress={confirmReturn}
            style={{ flex: 1 }}
          />
          <AppButton
            label="Cancel"
            variant="outline"
            disabled={returnSaving}
            onPress={() => {
              setReturningItem(null);
              setReturnQty('');
              setReturnError('');
            }}
            style={{ flex: 1 }}
          />
        </View>
      </ModalOverlay>

      <ModalOverlay visible={!!voidingBill}>
        <Text style={BillStyles.modalTitle}>Void Bill</Text>
        <Text style={BillStyles.modalMeta}>
          Requires a manager or owner to approve. Stock will be restored, but
          the original bill stays on record permanently.
        </Text>

        <SectionLabel>Approved by</SectionLabel>
        <PillGroup
          options={managementStaff.map(p => ({ key: p.name, label: p.name }))}
          selectedKey={voidApprover}
          onSelect={setVoidApprover}
        />

        {!!voidApprover && (
          <AppInput
            label={`${voidApprover}'s password`}
            value={voidPasswordInput}
            onChangeText={setVoidPasswordInput}
            secureTextEntry
          />
        )}

        <AppInput
          label="Reason for voiding"
          value={voidReason}
          onChangeText={setVoidReason}
          placeholder="e.g. wrong item entered by mistake"
        />

        {!!voidError && <Text style={BillStyles.error}>{voidError}</Text>}

        <View style={BillStyles.modalButtonRow}>
          <AppButton
            label="Cancel"
            variant="outline"
            onPress={() => setVoidingBill(null)}
            style={{ flex: 1 }}
          />
          <AppButton
            label="Confirm Void"
            variant="danger"
            loading={voidSaving}
            onPress={confirmVoid}
            style={{ flex: 1 }}
          />
        </View>
      </ModalOverlay>
    </>
  );
};

export default Bills;
