import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, ScrollView, Platform } from 'react-native';
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, orderBy } from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

const Attendance = ({ route }: any) => {
  const { shopId, staffName } = route.params || {};
  const [staffList, setStaffList] = useState<{ name: string; role: string }[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStaff = useCallback(async () => {
    const db = getFirestore();
    const shopDoc = await getDoc(doc(db, 'shops', shopId));
    setStaffList(shopDoc.data()?.staff || []);
  }, [shopId]);

  const loadLeaves = useCallback(async () => {
    const db = getFirestore();
    const snap = await getDocs(query(collection(db, 'shops', shopId, 'leaves'), orderBy('fromDate', 'desc')));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const monthStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
    setLeaves(all.filter((l) => l.fromDate.startsWith(monthStr) || l.toDate.startsWith(monthStr)));
  }, [shopId, selectedMonth]);

  React.useEffect(() => {
    Promise.all([loadStaff(), loadLeaves()]).finally(() => setLoading(false));
  }, [loadStaff, loadLeaves]);

  const changeMonth = (offset: number) => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + offset);
    setSelectedMonth(d);
  };

  const daysBetween = (from: Date, to: Date) => {
    const diff = Math.round((to.getTime() - from.getTime()) / 86400000);
    return diff + 1; // inclusive of both start and end day
  };

  const submitLeave = async () => {
    if (!selectedStaff) {
      setError('Pick a staff member');
      return;
    }
    if (toDate < fromDate) {
      setError('End date must be on or after start date');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      const fromStr = fromDate.toISOString().slice(0, 10);
      const toStr = toDate.toISOString().slice(0, 10);
      await addDoc(collection(db, 'shops', shopId, 'leaves'), {
        staffName: selectedStaff,
        fromDate: fromStr,
        toDate: toStr,
        daysCount: daysBetween(fromDate, toDate),
        note: note.trim() || null,
        loggedBy: staffName,
        timestamp: Date.now(),
      });
      setSelectedStaff(null);
      setNote('');
      setFromDate(new Date());
      setToDate(new Date());
      await loadLeaves();
    } catch (e) {
      setError('Could not save — try again');
    } finally {
      setSaving(false);
    }
  };

  const removeLeave = async (id: string) => {
    const db = getFirestore();
    await deleteDoc(doc(db, 'shops', shopId, 'leaves', id));
    await loadLeaves();
  };

  const totalsByStaff: Record<string, number> = {};
  leaves.forEach((l) => { totalsByStaff[l.staffName] = (totalsByStaff[l.staffName] || 0) + l.daysCount; });

  const monthLabel = selectedMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Attendance / Leave</Text>

      <Text style={styles.label}>Staff Member</Text>
      <View style={styles.wrapRow}>
        {staffList.map((p) => (
          <TouchableOpacity key={p.name} style={[styles.pill, selectedStaff === p.name && styles.pillActive]} onPress={() => setSelectedStaff(p.name)}>
            <Text style={selectedStaff === p.name ? styles.pillTextActive : styles.pillText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>From</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
        <Text style={styles.dateBtnText}>{fromDate.toLocaleDateString('en-IN')}</Text>
      </TouchableOpacity>
      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, date) => { setShowFromPicker(false); if (date) setFromDate(date); }}
        />
      )}

      <Text style={styles.label}>To</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
        <Text style={styles.dateBtnText}>{toDate.toLocaleDateString('en-IN')}</Text>
      </TouchableOpacity>
      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, date) => { setShowToPicker(false); if (date) setToDate(date); }}
        />
      )}

      <Text style={styles.label}>Reason (optional)</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="e.g. sick leave, personal" />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={submitLeave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log Leave</Text>}
      </TouchableOpacity>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.monthNavArrow}>‹</Text></TouchableOpacity>
        <Text style={styles.monthNavLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.monthNavArrow}>›</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Summary for {monthLabel}</Text>
        {Object.keys(totalsByStaff).length === 0 && <Text style={styles.empty}>No leave recorded this month.</Text>}
        {Object.entries(totalsByStaff).map(([name, days]) => (
          <View key={name} style={styles.summaryRow}>
            <Text style={styles.summaryName}>{name}</Text>
            <Text style={styles.summaryDays}>{days} day{days !== 1 ? 's' : ''}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Entries</Text>
        {leaves.length === 0 && <Text style={styles.empty}>No entries this month.</Text>}
        {leaves.map((l) => (
          <View key={l.id} style={styles.entryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryName}>{l.staffName} — {l.daysCount} day{l.daysCount !== 1 ? 's' : ''}</Text>
              <Text style={styles.entryDates}>{l.fromDate} to {l.toDate}{l.note ? ` · ${l.note}` : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => removeLeave(l.id)}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF4EC', padding: 24, paddingTop: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBF4EC' },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#7A4A2B', marginTop: 14, marginBottom: 8 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 10, padding: 12, marginBottom: 4 },
  pillActive: { backgroundColor: '#5C3620', borderColor: '#5C3620' },
  pillText: { color: '#2B160C', fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  dateBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 10, padding: 12 },
  dateBtnText: { color: '#2B160C', fontWeight: '500' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 10, padding: 12, fontSize: 15 },
  error: { color: '#9C3654', marginTop: 12 },
  button: { marginTop: 20, backgroundColor: '#5C3620', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 30, marginBottom: 16 },
  monthNavArrow: { fontSize: 24, color: '#C17A3D', fontWeight: '700' },
  monthNavLabel: { fontSize: 15, fontWeight: '700', color: '#2B160C', minWidth: 160, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2CFAF', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#5C3620', marginBottom: 10 },
  empty: { color: '#7A4A2B', fontSize: 13 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F3E6D5' },
  summaryName: { fontSize: 13.5, color: '#2B160C', fontWeight: '500' },
  summaryDays: { fontSize: 13.5, fontWeight: '700', color: '#C17A3D' },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3E6D5' },
  entryName: { fontSize: 13, fontWeight: '600', color: '#2B160C' },
  entryDates: { fontSize: 11.5, color: '#9C8768', marginTop: 2 },
  removeText: { color: '#9C3654', fontWeight: '700', fontSize: 15, paddingLeft: 10 },
});

export default Attendance;