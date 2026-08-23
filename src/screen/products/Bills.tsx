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

  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(async () => {
    const db = getFirestore();

    const catSnap = await getDocs(
      collection(db, 'shops', shopId, 'categories'),
    );
    setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const txSnap = await getDocs(
      query(
        collection(db, 'shops', shopId, 'transactions'),
        where('date', '==', today),
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
  }, [shopId, today]);

  React.useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openReturn = (item: any) => {
    console.log('openReturn called', item);
    console.log('returnedQty:', item.returnedQty, 'quantity:', item.quantity);

    setReturningItem(item);
    setReturnQty(String(item.quantity - item.returnedQty));
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

  const todaysTotal = bills.reduce((sum, b) => sum + b.total, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  console.log('render, returningItem is:', returningItem);

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Today's Bills</Text>
        <Text style={styles.subtitle}>
          {bills.length} bill{bills.length !== 1 ? 's' : ''} · ₹
          {todaysTotal.toFixed(2)} total
        </Text>

        {bills.length === 0 && (
          <Text style={styles.empty}>No sales yet today.</Text>
        )}

        {bills.map(bill => (
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
                  {item.subVarietyName} ({item.quantity}
                  {item.unit})
                  {item.returnedQty > 0
                    ? ` — ${item.returnedQty}${item.unit} returned`
                    : ''}
                </Text>
                <Text style={styles.itemAmount}>
                  ₹{item.netAmount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.footerRow}>
              <View style={styles.leftGroup}>
                <View
                  style={[
                    styles.badge,
                    bill.paymentMethod === 'gpay'
                      ? styles.badgeGpay
                      : styles.badgeCash,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      bill.paymentMethod === 'gpay'
                        ? styles.badgeTextGpay
                        : styles.badgeTextCash,
                    ]}
                  >
                    {bill.paymentMethod === 'gpay' ? 'GPay' : 'Cash'}
                  </Text>
                </View>
                <Text style={styles.staffName}>{bill.staffName}</Text>
              </View>
              <Text style={styles.amount}>₹{bill.total.toFixed(2)}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingTop: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF4EC',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 13, color: '#7A4A2B', marginTop: 4, marginBottom: 20 },
  empty: { color: '#7A4A2B', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E6D5',
  },
  itemText: { fontSize: 13, color: '#2B160C', flex: 1, paddingRight: 8 },
  itemAmount: { fontSize: 13, fontWeight: '600', color: '#2B160C' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeCash: { backgroundColor: '#E1EADD' },
  badgeGpay: { backgroundColor: '#DCE8F5' },
  badgeText: { fontSize: 10.5, fontWeight: '700' },
  badgeTextCash: { color: '#5C7D57' },
  badgeTextGpay: { color: '#3A6EA5' },
  staffName: { fontSize: 12, color: '#9C8768', fontWeight: '500' },
  amount: { fontSize: 15, fontWeight: '700', color: '#5C3620' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,22,12,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: { backgroundColor: '#fff', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2B160C' },
  modalMeta: { fontSize: 12, color: '#7A4A2B', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#7A4A2B', marginBottom: 8 },
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
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999, // Android needs elevation too, zIndex alone isn't always enough
  },
});

export default Bills;
