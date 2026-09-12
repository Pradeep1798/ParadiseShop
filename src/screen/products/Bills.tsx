import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
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
  query,
  where,
} from '@react-native-firebase/firestore';
import { formatCurrency } from 'utils/HelperFn';
import ScreenContainer from 'components/ScreenContainer';

const Bills = ({ route }: any) => {
  const { shopId, staffName } = route.params;
  const [bills, setBills] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [returningItem, setReturningItem] = useState<any>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnSaving, setReturnSaving] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [refundPayment, setRefundPayment] = useState<'cash' | 'gpay'>('cash');
  const [search, setSearch] = useState('');
  const [editingPayment, setEditingPayment] = useState<string | null>(null); // billId being edited
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [staffFilter, setStaffFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'cash' | 'gpay' | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  const changeDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const newDate = d.toISOString().slice(0, 10);
    if (newDate > new Date().toISOString().slice(0, 10)) return; // can't go into the future
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

  const loadData = useCallback(async () => {
    const db = getFirestore();
    const catSnap = await getDocs(
      collection(db, 'shops', shopId, 'categories'),
    );
    setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const txSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'transactions'),
        where('date', '==', selectedDate),
      ),
    );
    const all = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const salesToday = all.filter((t: any) => t.type === 'sale');
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

  React.useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const staffOptions = Array.from(new Set(bills.map(b => b.staffName)));
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      const db = getFirestore();
      const refundAmount = Number(
        ((qty / returningItem.quantity) * returningItem.finalAmount).toFixed(2),
      );
      const kgToRestore = returningItem.unit === 'g' ? qty / 1000 : qty;

      const category = categories.find(c => c.id === returningItem.categoryId);
      const updatedSubVarieties = category.subVarieties.map((sv: any) =>
        sv.id === returningItem.subVarietyId
          ? { ...sv, stock: sv.stock + kgToRestore }
          : sv,
      );
      await updateDoc(
        doc(db, 'shops', shopId, 'categories', returningItem.categoryId),
        {
          subVarieties: updatedSubVarieties,
        },
      );

      await addDoc(collection(db, 'shops', shopId, 'transactions'), {
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
        refundMethod: refundPayment, // ← new field
      });

      setReturningItem(null);
      setReturnQty('');
      await loadData();
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
      const db = getFirestore();
      await Promise.all(
        bill.items.map((item: any) =>
          updateDoc(doc(db, 'shops', shopId, 'transactions', item.id), {
            paymentMethod: newMethod,
            cashPortion: newMethod === 'cash' ? item.finalAmount : 0,
            gpayPortion: newMethod === 'gpay' ? item.finalAmount : 0,
          }),
        ),
      );
      setEditingPayment(null);
      await loadData();
    } catch (e) {
      console.log('Could not update payment method');
    } finally {
      setPaymentSaving(false);
    }
  };

  const searchLower = search.trim().toLowerCase();
  const filteredBills = bills.filter(bill => {
    if (staffFilter && bill.staffName !== staffFilter) return false;
    if (paymentFilter && bill.paymentMethod !== paymentFilter) return false;
    return true;
  });

  const activeFilterCount = (staffFilter ? 1 : 0) + (paymentFilter ? 1 : 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  console.log('render, returningItem is:', returningItem);
  const openReturn = (item: any) => {
    setReturningItem(item);
    setReturnQty(String(item.quantity - item.returnedQty));
    setRefundPayment(
      item.paymentMethod === 'split' ? 'cash' : item.paymentMethod,
    );
    setReturnError('');
  };

  return (
    <>
      <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
        {/* <Text style={styles.title}>Today's Bills</Text> */}
        <View style={styles.dateNav}>
          <TouchableOpacity
            onPress={() => changeDay(-1)}
            style={styles.dateNavBtn}
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
          >
            <Text style={styles.filterIconText}>
              🔍 Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {filterVisible && (
          <View style={styles.filterPanel}>
            <Text style={styles.label}>Staff</Text>
            <View style={styles.wrapRow}>
              <TouchableOpacity
                style={[styles.pill, !staffFilter && styles.pillActive]}
                onPress={() => setStaffFilter(null)}
              >
                <Text
                  style={!staffFilter ? styles.pillTextActive : styles.pillText}
                >
                  All
                </Text>
              </TouchableOpacity>
              {staffOptions.map(name => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.pill,
                    staffFilter === name && styles.pillActive,
                  ]}
                  onPress={() => setStaffFilter(name)}
                >
                  <Text
                    style={
                      staffFilter === name
                        ? styles.pillTextActive
                        : styles.pillText
                    }
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Payment Mode</Text>
            <View style={styles.wrapRow}>
              <TouchableOpacity
                style={[styles.pill, !paymentFilter && styles.pillActive]}
                onPress={() => setPaymentFilter(null)}
              >
                <Text
                  style={
                    !paymentFilter ? styles.pillTextActive : styles.pillText
                  }
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pill,
                  paymentFilter === 'cash' && styles.pillActive,
                ]}
                onPress={() => setPaymentFilter('cash')}
              >
                <Text
                  style={
                    paymentFilter === 'cash'
                      ? styles.pillTextActive
                      : styles.pillText
                  }
                >
                  Cash
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pill,
                  paymentFilter === 'gpay' && styles.pillActive,
                ]}
                onPress={() => setPaymentFilter('gpay')}
              >
                <Text
                  style={
                    paymentFilter === 'gpay'
                      ? styles.pillTextActive
                      : styles.pillText
                  }
                >
                  GPay
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}
        {bills.length === 0 && (
          <Text style={styles.empty}>No sales yet today.</Text>
        )}

        {filteredBills.map(bill => {
          const billDiscountTotal = bill.items.reduce(
            (sum: number, i: any) => sum + (i.discount || 0),
            0,
          );
          const billExcessTotal = bill.items.reduce(
            (sum: number, i: any) => sum + (i.excess || 0),
            0,
          );

          return (
            <View key={bill.billId} style={styles.card}>
              {bill.items.map((item: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={styles.itemRow}
                  onPress={() =>
                    item.returnedQty < item.quantity &&
                    openReturn({ ...item, billId: bill.billId })
                  }
                  disabled={item.returnedQty >= item.quantity}
                >
                  <Text style={styles.itemText}>
                    {item.subVarietyName}
                    {''} ({item.quantity}
                    {''} {item.unit})
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
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.badge, styles.badgeCash]}
                        onPress={() => updateBillPayment(bill, 'cash')}
                        disabled={paymentSaving}
                      >
                        <Text style={[styles.badgeText, styles.badgeTextCash]}>
                          Cash
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.badge, styles.badgeGpay]}
                        onPress={() => updateBillPayment(bill, 'gpay')}
                        disabled={paymentSaving}
                      >
                        <Text style={[styles.badgeText, styles.badgeTextGpay]}>
                          GPay
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setEditingPayment(bill.billId)}
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
                  <Text style={styles.staffName}>
                    {bill.staffName} · {formatTime(bill.timestamp)}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(bill.total)}</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScreenContainer>
      {!!returningItem && (
        <View style={styles.overlayContainer} pointerEvents="box-none">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                Return — {returningItem?.subVarietyName}
              </Text>
              <Text style={styles.modalMeta}>
                Sold: {returningItem?.quantity}
                {returningItem?.unit}
                {returningItem?.returnedQty > 0
                  ? ` (${returningItem.returnedQty}${returningItem.unit} already returned)`
                  : ''}
              </Text>

              <Text style={styles.label}>
                Quantity to return ({returningItem?.unit})
              </Text>
              <TextInput
                style={styles.input}
                value={returnQty}
                onChangeText={setReturnQty}
                keyboardType="decimal-pad"
                autoFocus
              />

              <Text style={styles.label}>Refund via</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <TouchableOpacity
                  style={[
                    styles.paymentBtn,
                    refundPayment === 'cash' && styles.paymentBtnActive,
                  ]}
                  onPress={() => setRefundPayment('cash')}
                >
                  <Text
                    style={
                      refundPayment === 'cash'
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
                    refundPayment === 'gpay' && styles.paymentBtnActive,
                  ]}
                  onPress={() => setRefundPayment('gpay')}
                >
                  <Text
                    style={
                      refundPayment === 'gpay'
                        ? styles.pillTextActive
                        : styles.pillText
                    }
                  >
                    GPay
                  </Text>
                </TouchableOpacity>
              </View>

              {!!returnError && <Text style={styles.error}>{returnError}</Text>}

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setReturningItem(null)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={confirmReturn}
                  disabled={returnSaving}
                >
                  {returnSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm return</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    // paddingTop: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF4EC',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 13, color: '#7A4A2B', marginTop: 1, marginBottom: 20 },
  empty: { color: '#7A4A2B', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8C7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#5C3620',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2CFAF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  dateNavArrow: {
    fontSize: 25,
    lineHeight: 28,
    color: '#C17A3D',
    fontWeight: '600',
  },

  dateNavLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B160C',

    minWidth: 150,
    textAlign: 'center',
  },

  dateNavArrowDisabled: { color: '#E2CFAF' },

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
    color: '#2B160C',
    lineHeight: 19,
  },

  itemAmount: {
    minWidth: 75,
    textAlign: 'right',

    fontSize: 13.5,
    fontWeight: '700',
    color: '#5C3620',
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
    color: '#C17A3D',
  },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,22,12,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterIconBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterIconText: { fontSize: 12.5, color: '#5C3620', fontWeight: '600' },
  filterPanel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  applyBtn: {
    marginTop: 14,
    backgroundColor: '#C17A3D',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modalBox: { backgroundColor: '#fff', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2B160C' },
  modalMeta: { fontSize: 12, color: '#7A4A2B', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#7A4A2B', marginBottom: 8 },
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
  input: {
    backgroundColor: '#FBF4EC',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  error: { color: '#9C3654', marginTop: 10 },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3E6D5',
  },
  cancelBtnText: { color: '#5C3620', fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#9C3654',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
  paymentBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  discountText: {
    color: '#A33D5B',
    fontWeight: '600',
  },

  excessText: {
    color: '#5C7D57',
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
  paymentBtnActive: { backgroundColor: '#9C3654', borderColor: '#9C3654' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999, // Android needs elevation too, zIndex alone isn't always enough
  },
});

export default Bills;
