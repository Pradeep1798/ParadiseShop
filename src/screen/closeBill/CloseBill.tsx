import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { getFirestore, collection, getDocs, query, where, doc, setDoc, getDoc } from '@react-native-firebase/firestore';

const CloseBill = ({ route, navigation }: any) => {
  const { shopId, staffName } = route.params || {};
  const today = new Date().toISOString().slice(0, 10);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [alreadyClosed, setAlreadyClosed] = useState<any>(null);
  const [excessOrShortage, setExcessOrShortage] = useState('0');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const db = getFirestore();

    const closingDoc = await getDoc(doc(db, 'shops', shopId, 'dailyClosings', today));
    if (closingDoc.exists()) setAlreadyClosed(closingDoc.data());

    const txSnap = await getDocs(query(collection(db, 'shops', shopId, 'transactions'), where('date', '==', today)));
    const expSnap = await getDocs(query(collection(db, 'shops', shopId, 'expenses'), where('date', '==', today)));

    let cash = 0, gpay = 0;
 txSnap.docs.forEach(d => {
   const t = d.data() as any;
   if (t.type !== 'sale') return;
   if (t.cashPortion !== undefined) {
     // new-style record
     cash += t.cashPortion;
     gpay += t.gpayPortion;
   } else {
     // old record, before split payments existed
     if (t.paymentMethod === 'gpay') gpay += t.finalAmount;
     else cash += t.finalAmount;
   }
 });
    let expenseTotal = 0;
    expSnap.docs.forEach((d) => { expenseTotal += (d.data() as any).amount; });

    setSummary({ sale: cash + gpay, cash, gpay, expenseTotal, calculatedHand: cash - expenseTotal });
  }, [shopId, today]);

  React.useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const diff = Number(excessOrShortage) || 0;
      await setDoc(doc(db, 'shops', shopId, 'dailyClosings', today), {
        date: today,
        closedBy: staffName,
        closedAt: Date.now(),
        calculatedSale: summary.sale,
        calculatedCash: summary.cash,
        calculatedGpay: summary.gpay,
        calculatedExpense: summary.expenseTotal,
        calculatedHand: summary.calculatedHand,
        excessOrShortage: diff,
        finalHand: summary.calculatedHand + diff,
        note: note.trim() || null,
      });
      navigation.navigate('Home', route.params);
    } catch (e) {
      setError('Could not close the bill — try again');
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Close Today's Bill</Text>
      <Text style={styles.subtitle}>{today}</Text>

      {alreadyClosed && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Already closed by {alreadyClosed.closedBy} at {new Date(alreadyClosed.closedAt).toLocaleTimeString()}.
            Submitting again will overwrite that record.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Row label="Sale" value={summary.sale} />
        <Row label="Cash" value={summary.cash} />
        <Row label="GPay" value={summary.gpay} />
        <Row label="Expenses" value={summary.expenseTotal} />
        <View style={styles.divider} />
        <Row label="Calculated Hand" value={summary.calculatedHand} bold />
      </View>

      <Text style={styles.label}>Excess (+) or Shortage (−) amount (₹)</Text>
      <TextInput
        style={styles.input}
        value={excessOrShortage}
        onChangeText={setExcessOrShortage}
        keyboardType="numbers-and-punctuation"
        placeholder="0 (enter negative for shortage, e.g. -50)"
      />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. missed one bill during rush, found extra 50 in till"
        multiline
      />

      <View style={styles.finalBox}>
        <Text style={styles.finalLabel}>Final Hand (after adjustment)</Text>
        <Text style={styles.finalValue}>₹{(summary.calculatedHand + (Number(excessOrShortage) || 0)).toFixed(2)}</Text>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm & Close</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const Row = ({ label, value, bold }: any) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
    <Text style={[styles.rowValue, bold && styles.bold]}>₹{value.toFixed(2)}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF4EC', padding: 24, paddingTop: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBF4EC' },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 13, color: '#7A4A2B', marginBottom: 20 },
  warningBox: { backgroundColor: '#F3DEE2', borderRadius: 10, padding: 12, marginBottom: 16 },
  warningText: { color: '#9C3654', fontSize: 12.5 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 12, padding: 16, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rowLabel: { fontSize: 13, color: '#7A4A2B' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#2B160C' },
  bold: { fontWeight: '800', fontSize: 14.5 },
  divider: { height: 1, backgroundColor: '#E2CFAF', marginVertical: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#7A4A2B', marginTop: 12, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 10, padding: 12, fontSize: 15 },
  finalBox: { backgroundColor: '#F3E6D5', borderRadius: 12, padding: 16, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finalLabel: { fontWeight: '700', color: '#5C3620' },
  finalValue: { fontWeight: '800', fontSize: 18, color: '#5C3620' },
  error: { color: '#9C3654', marginTop: 12 },
  button: { marginTop: 20, backgroundColor: '#5C3620', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default CloseBill;