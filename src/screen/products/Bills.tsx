import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
} from 'services/Service';

import { excludeVoided } from 'utils/SalesCalculation';
import { useFocusRefresh } from 'utils/hooks';
import { COLORS } from 'theme/Theme';

const Bills = ({ route }: any) => {
const { shopId, staffName, role } = route.params;
  const [bills, setBills] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [returningItem, setReturningItem] = useState<any>(null);
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

  // Void state
  const [voidingBill, setVoidingBill] = useState<any>(null);
  const [voidApprover, setVoidApprover] = useState<string | null>(null);
  const [managementStaff, setManagementStaff] = useState<any[]>([]);
  const [voidPasswordInput, setVoidPasswordInput] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [voidSaving, setVoidSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

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

    const salesToday = excludeVoided(all.filter((t: any) => t.type === 'sale'));
    const returns = all.filter((t: any) => t.type === 'return');

    const grouped: Record<string, any> = {};
    salesToday.forEach((t: any) => {
      if (!grouped[t.billId]) {
        grouped[t.billId] = {
          billId: t.billId,
          staffName: t.staffName,
          paymentMethod: t.paymentMethod,
          timestamp: t.timestamp,
          items: [],
        };
      }
      const returnedForThisItem = returns
        .filter((r: any) => r.originalTransactionId === t.id)
        .reduce((sum: number, r: any) => sum + r.quantity, 0);
      const refundForThisItem = returns
        .filter((r: any) => r.originalTransactionId === t.id)
        .reduce((sum: number, r: any) => sum + r.refundAmount, 0);

      grouped[t.billId].items.push({
        ...t,
        returnedQty: returnedForThisItem,
        netAmount: t.finalAmount - refundForThisItem,
      });
    });

    const billsList = Object.values(grouped).map((bill: any) => ({
      ...bill,
      total: bill.items.reduce((sum: number, i: any) => sum + i.netAmount, 0),
    }));

    setBills(billsList.sort((a: any, b: any) => b.timestamp - a.timestamp));
  }, [shopId, selectedDate]);

  const { loading, refreshing, onRefresh } = useFocusRefresh(load, [load]);
  const staffOptions = Array.from(new Set(bills.map(b => b.staffName)));
  const activeFilterCount = (staffFilter ? 1 : 0) + (paymentFilter ? 1 : 0);

  React.useEffect(() => {
    getManagementStaff(shopId).then(setManagementStaff);
  }, [shopId]);

  const openReturn = (item: any) => {
    setReturningItem(item);
    setReturnQty(String(item.quantity - item.returnedQty));
    setRefundPayment(
      item.paymentMethod === 'split' ? 'cash' : item.paymentMethod,
    );
    setReturnError('');
  };

  const confirmReturn = async () => {
    const qty = parseFloat(returnQty);
    const maxReturnable = returningItem.quantity - returningItem.returnedQty;
    if (!qty || qty <= 0) {
      setReturnError('Enter a valid quantity');
      return;
    }
    if (qty > maxReturnable) {
      setReturnError(
        `Only ${maxReturnable}${returningItem.unit} can be returned`,
      );
      return;
    }

    setReturnSaving(true);
    setReturnError('');
    try {
      const refundAmount = Number(
        ((qty / returningItem.quantity) * returningItem.finalAmount).toFixed(2),
      );
      const restoreAmount = computeStockDelta(returningItem.unit, qty);
      const category = categories.find(c => c.id === returningItem.categoryId);
      if (!category) {
        setReturnError('Category not found. Try again.');
        return;
      }
      const updatedSubVarieties = category.subVarieties.map((sv: any) =>
        sv.id === returningItem.subVarietyId
          ? { ...sv, stock: sv.stock + restoreAmount }
          : sv,
      );
      await updateCategoryStock(
        shopId,
        returningItem.categoryId,
        updatedSubVarieties,
      );

      await addTransaction(shopId, {
        type: 'return',
        billId: returningItem.billId,
        originalTransactionId: returningItem.id,
        date: new Date().toISOString().slice(0, 10),
        timestamp: Date.now(),
        staffName,
        categoryId: returningItem.categoryId,
        categoryName: returningItem.categoryName,
        subVarietyId: returningItem.subVarietyId,
        subVarietyName: returningItem.subVarietyName,
        quantity: qty,
        unit: returningItem.unit,
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

  const updateBillPayment = async (bill: any, newMethod: 'cash' | 'gpay') => {
    setPaymentSaving(true);
    try {
      await Promise.all(
        bill.items.map((item: any) =>
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

  const openVoid = (bill: any) => {
    setVoidingBill(bill);
    setVoidApprover(null);
    setVoidPasswordInput('');
    setVoidReason('');
    setVoidError('');
  };

  const confirmVoid = async () => {
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
      const byCategory: Record<string, any[]> = {};
      voidingBill.items.forEach((item: any) => {
        if (!byCategory[item.categoryId]) byCategory[item.categoryId] = [];
        byCategory[item.categoryId].push(item);
      });
      for (const categoryId of Object.keys(byCategory)) {
        const category = categories.find(c => c.id === categoryId);
        const itemsForThisCategory = byCategory[categoryId];
        const updatedSubVarieties = category.subVarieties.map((sv: any) => {
          const restore = itemsForThisCategory
            .filter(i => i.subVarietyId === sv.id)
            .reduce(
              (sum, i) =>
                sum + computeStockDelta(sv.unit, i.quantity - i.returnedQty),
              0,
            );
          return restore > 0 ? { ...sv, stock: sv.stock + restore } : sv;
        });
        await updateCategoryStock(shopId, categoryId, updatedSubVarieties);
      }

      await Promise.all(
        voidingBill.items.map((item: any) =>
          updateTransaction(shopId, item.id, { voided: true }),
        ),
      );

      await addVoidRecord(shopId, {
        billId: voidingBill.billId,
        items: voidingBill.items.map((i: any) => ({
          name: i.subVarietyName,
          qty: i.quantity,
          unit: i.unit,
          amount: i.finalAmount,
        })),
        originalAmount: voidingBill.total,
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.textMuted} />
      </View>
    );
  }

  return (
    <>
      <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => changeDay(-1)}
            style={styles.dateNavBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.dateNavArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.dateNavLabel}>
            {formatDateHeader(selectedDate)}
          </Text>
          <TouchableOpacity
            onPress={() => changeDay(1)}
            style={styles.dateNavBtn}
            disabled={isToday}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.dateNavArrow,
                isToday && styles.dateNavArrowDisabled,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.subtitle}>
            {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} ·{' '}
            {formatCurrency(filteredBills.reduce((s, b) => s + b.total, 0))}{' '}
            total
          </Text>
          <TouchableOpacity
            style={styles.filterIconBtn}
            onPress={() => setFilterVisible(v => !v)}
            activeOpacity={0.75}
          >
            <Text style={styles.filterIconText}>
              🔍 Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {filterVisible && (
          <View style={styles.filterPanel}>
            <SectionLabel>Staff</SectionLabel>
            <PillGroup
              options={[
                { key: '', label: 'All' },
                ...staffOptions.map(name => ({ key: name, label: name })),
              ]}
              selectedKey={staffFilter ?? ''}
              onSelect={key => setStaffFilter(key || null)}
            />
            <View style={styles.filterSectionGap} />
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
              style={styles.applyBtn}
              onPress={() => setFilterVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}

        {bills.length === 0 && <EmptyState text="No sales yet today." />}

        {filteredBills.map(bill => {
          const billDiscountTotal = bill.items.reduce(
            (sum: number, i: any) => sum + (i.discount || 0),
            0,
          );
          const billExcessTotal = bill.items.reduce(
            (sum: number, i: any) => sum + (i.excess || 0),
            0,
          );
          const isVoided = bill.items.every((i: any) => i.voided);

          return (
            <Card
              key={bill.billId}
              style={isVoided ? styles.voidedCard : undefined}
            >
              {isVoided && <Text style={styles.voidedBadge}>VOIDED</Text>}

              {bill.items.map((item: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={styles.itemRow}
                  onPress={() =>
                    item.returnedQty < item.quantity &&
                    openReturn({ ...item, billId: bill.billId })
                  }
                  disabled={item.returnedQty >= item.quantity}
                  activeOpacity={item.returnedQty < item.quantity ? 0.7 : 1}
                >
                  <Text style={styles.itemText}>
                    {item.subVarietyName} ({item.quantity} {item.unit})
                    {item.returnedQty > 0
                      ? ` — ${item.returnedQty}${item.unit} returned`
                      : ''}
                  </Text>
                  <Text style={styles.itemAmount}>
                    {formatCurrency(item.billAmount ?? item.finalAmount)}
                  </Text>
                </TouchableOpacity>
              ))}

              {billDiscountTotal > 0 && (
                <View style={styles.itemRow}>
                  <Text style={[styles.itemText, styles.discountText]}>
                    Discount
                  </Text>
                  <Text style={[styles.itemAmount, styles.discountText]}>
                    -{formatCurrency(billDiscountTotal)}
                  </Text>
                </View>
              )}

              {billExcessTotal > 0 && (
                <View style={styles.itemRow}>
                  <Text style={[styles.itemText, styles.excessText]}>
                    Excess
                  </Text>
                  <Text style={[styles.itemAmount, styles.excessText]}>
                    +{formatCurrency(billExcessTotal)}
                  </Text>
                </View>
              )}

              {!!bill.items[0]?.note && (
                <Text style={styles.noteText}>📝 {bill.items[0].note}</Text>
              )}

              <View style={styles.footerRow}>
                <View style={styles.leftGroup}>
                  {editingPayment === bill.billId ? (
                    <View style={styles.paymentEditRow}>
                      <TouchableOpacity
                        style={[styles.badge, styles.badgeCash]}
                        onPress={() => updateBillPayment(bill, 'cash')}
                        disabled={paymentSaving}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.badgeText, styles.badgeTextCash]}>
                          Cash
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.badge, styles.badgeGpay]}
                        onPress={() => updateBillPayment(bill, 'gpay')}
                        disabled={paymentSaving}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.badgeText, styles.badgeTextGpay]}>
                          GPay
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setEditingPayment(bill.billId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.paymentBadgeContent}>
                        <Text
                          style={[
                            styles.badgeText,
                            bill.paymentMethod === 'gpay'
                              ? styles.badgeTextGpay
                              : bill.paymentMethod === 'split'
                              ? styles.badgeTextSplit
                              : styles.badgeTextCash,
                          ]}
                        >
                          {bill.paymentMethod === 'split'
                            ? 'Split'
                            : bill.paymentMethod === 'gpay'
                            ? 'GPay'
                            : 'Cash'}
                        </Text>
                        <Text style={styles.editIcon}>✎</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.staffName} numberOfLines={1}>
                    {bill.staffName} · {formatTime(bill.timestamp)}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(bill.total)}</Text>
              </View>

              {!isVoided && canRequestVoid && (
                <TouchableOpacity onPress={() => openVoid(bill)}>
                  <Text style={styles.voidLink}>Delete this bill</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })}

        <View style={styles.bottomSpace} />
      </ScreenContainer>

      <ModalOverlay visible={!!returningItem}>
        <Text style={styles.modalTitle}>Return Item</Text>
        <Text style={styles.modalTitle}>{returningItem?.name}</Text>
        <AppInput
          label={`Quantity (Available: ${returningItem?.soldQty ?? 0})`}
          value={returnQty}
          onChangeText={setReturnQty}
          keyboardType="numeric"
          placeholder="Enter quantity"
          editable={!returnSaving}
        />
        <Text style={[styles.subtitle, { marginBottom: 4 }]}>
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
        {!!returnError && <Text style={styles.error}>{returnError}</Text>}
        <View style={styles.modalButtonRow}>
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
        <Text style={styles.modalTitle}>Void Bill</Text>
        <Text style={styles.modalMeta}>
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

        {!!voidError && <Text style={styles.error}>{voidError}</Text>}

        <View style={styles.modalButtonRow}>
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
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },

  subtitle: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  dateNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateNavArrow: {
    fontSize: 25,
    lineHeight: 28,
    color: COLORS.caramel,
    fontWeight: '600',
  },

  dateNavArrowDisabled: {
    color: COLORS.border,
  },

  dateNavLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.cacaoDark,
    minWidth: 150,
    textAlign: 'center',
  },

  filterIconBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  filterIconText: {
    fontSize: 12.5,
    color: COLORS.cacao,
    fontWeight: '600',
  },

  filterPanel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  filterSectionGap: {
    height: 12,
  },

  applyBtn: {
    marginTop: 14,
    backgroundColor: COLORS.caramel,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  applyBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DD',
  },

  itemText: {
    flex: 1,
    paddingRight: 12,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cacaoDark,
    lineHeight: 19,
  },

  itemAmount: {
    minWidth: 75,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.cacao,
  },

  discountText: {
    color: '#A33D5B',
    fontWeight: '600',
  },

  excessText: {
    color: COLORS.success,
    fontWeight: '600',
  },

  noteText: {
    fontSize: 11.5,
    color: '#806452',
    fontStyle: 'italic',
    backgroundColor: '#FCF7F2',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 7,
    marginBottom: 5,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8D8C7',
  },

  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },

  staffName: {
    flexShrink: 1,
    fontSize: 11,
    color: '#9A806C',
    fontWeight: '500',
  },

  amount: {
    minWidth: 90,
    textAlign: 'right',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.caramel,
  },

  paymentEditRow: {
    flexDirection: 'row',
    gap: 6,
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    minWidth: 52,
    alignItems: 'center',
  },

  badgeCash: {
    backgroundColor: '#E8F0E5',
  },

  badgeGpay: {
    backgroundColor: '#E5EEF8',
  },

  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  badgeTextCash: {
    color: '#52734E',
  },

  badgeTextGpay: {
    color: '#3A6EA5',
  },

  badgeTextSplit: {
    color: '#C21858',
  },

  paymentBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  editIcon: {
    fontSize: 11,
    color: '#8B6B56',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cacaoDark,
  },

  modalMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },

  input: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },

  paymentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },

  paymentBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },

  paymentBtnActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },

  pillText: {
    color: COLORS.cacaoDark,
    fontWeight: '500',
  },

  pillTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

  error: {
    color: COLORS.danger,
    marginTop: 10,
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3E6D5',
  },

  cancelBtnText: {
    color: COLORS.cacao,
    fontWeight: '600',
  },

  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.danger,
  },

  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },

  bottomSpace: {
    height: 40,
  },
  voidLink: {
    color: '#9C3654',
    fontSize: 11,
    marginTop: 8,
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
  voidedCard: { opacity: 0.6, borderColor: COLORS.danger },
  voidedBadge: {
    color: COLORS.danger,
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 6,
  },
});

export default Bills;