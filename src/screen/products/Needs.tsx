import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from '@react-native-firebase/firestore';
import ScreenContainer from 'components/ScreenContainer';

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const Needs = ({ route }: any) => {
  const { shopId, staffName } = route.params;
  const [itemName, setItemName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [header, setHeader] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFulfilled, setShowFulfilled] = useState(false);

  const loadItems = useCallback(async () => {
    const db = getFirestore();
    const snap = await getDocs(collection(db, 'shops', shopId, 'neededItems'));
    const list = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
    setItems(list);
  }, [shopId]);

  React.useEffect(() => {
    loadItems().finally(() => setLoading(false));
  }, [loadItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };
  const addItem = async () => {
    if (!header.trim() || !itemName.trim()) {
      setError('Enter both a header and an item');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'shops', shopId, 'neededItems'), {
        header: header.trim(),
        itemName: itemName.trim(),
        note: note.trim() || null,
        addedBy: staffName,
        timestamp: Date.now(),
        fulfilled: false,
      });
      setItemName(''); // clears
      setNote(''); // clears
      // header stays as-is — removed setHeader('')
      await loadItems();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };
  const toggleFulfilled = async (item: any) => {
    const db = getFirestore();
    await updateDoc(doc(db, 'shops', shopId, 'neededItems', item.id), {
      fulfilled: !item.fulfilled,
      fulfilledBy: !item.fulfilled ? staffName : null,
      fulfilledAt: !item.fulfilled ? Date.now() : null,
    });
    await loadItems();
  };

  const groupByHeader = (list: any[]) => {
    const grouped: Record<string, any[]> = {};
    list.forEach(item => {
      const key = item.header || 'Other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  const pending = items.filter(i => !i.fulfilled);
  const fulfilled = items.filter(i => i.fulfilled);
  const pendingGrouped = groupByHeader(pending);
  const fulfilledGrouped = groupByHeader(fulfilled);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <Text style={styles.title}>Needed Items</Text>
      <Text style={styles.subtitle}>Anything running low? Add it here.</Text>
      <Text style={styles.label}>Header (e.g. Nuts, Mold)</Text>
      <TextInput
        style={styles.input}
        value={header}
        onChangeText={setHeader}
        placeholder="e.g. Nuts"
      />

      <Text style={styles.label}>Item</Text>
      <TextInput
        style={styles.input}
        value={itemName}
        onChangeText={setItemName}
        placeholder="e.g. wafer roll boxes, cashew bits"
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. need at least 5kg"
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={addItem}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.addBtnText}>+ Add to list</Text>
        )}
      </TouchableOpacity>

      <View style={styles.listBox}>
        <Text style={styles.listTitle}>Pending ({pending.length})</Text>
        {pending.length === 0 && (
          <Text style={styles.empty}>Nothing needed right now.</Text>
        )}
        {Object.entries(pendingGrouped).map(([headerName, groupItems]) => (
          <View key={headerName} style={styles.group}>
            <Text style={styles.groupHeader}>{headerName}</Text>
            {(groupItems as any[]).map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => toggleFulfilled(item)}
              >
                <View style={styles.checkbox} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  {!!item.note && (
                    <Text style={styles.itemNote}>{item.note}</Text>
                  )}
                  <Text style={styles.itemMeta}>
                    added by {item.addedBy} · {formatDate(item.timestamp)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => setShowFulfilled(s => !s)}
        style={styles.toggleLink}
      >
        <Text style={styles.toggleLinkText}>
          {showFulfilled ? 'Hide' : 'Show'} bought items ({fulfilled.length})
        </Text>
      </TouchableOpacity>

      {showFulfilled && (
        <View style={styles.listBox}>
          {fulfilled.length === 0 && (
            <Text style={styles.empty}>Nothing marked bought yet.</Text>
          )}
          {fulfilled.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => toggleFulfilled(item)}
            >
              <View style={[styles.checkbox, styles.checkboxChecked]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, styles.itemNameDone]}>
                  {item.itemName}
                </Text>
                {!!item.note && (
                  <Text style={styles.itemNote}>{item.note}</Text>
                )}
                <Text style={styles.itemMeta}>
                  bought by {item.fulfilledBy} · {formatDate(item.fulfilledAt)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    backgroundColor: '#FBF4EC',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 13, color: '#7A4A2B', marginTop: 4, marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A4A2B',
    marginTop: 12,
    marginBottom: 8,
  },
  group: { marginBottom: 14 },
  groupHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#C17A3D',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  error: { color: '#9C3654', marginTop: 12 },
  addBtn: {
    marginTop: 20,
    backgroundColor: '#C17A3D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listBox: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 16,
  },
  listTitle: { fontWeight: '700', color: '#2B160C', marginBottom: 8 },
  empty: { color: '#7A4A2B', fontSize: 13 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#C17A3D',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#5C7D57',
    borderColor: '#5C7D57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#2B160C' },
  itemNameDone: { textDecorationLine: 'line-through', color: '#9C8768' },
  itemNote: { fontSize: 12, color: '#7A4A2B', marginTop: 2 },
  itemMeta: { fontSize: 10.5, color: '#9C8768', marginTop: 3 },
  toggleLink: { marginTop: 16, alignSelf: 'center' },
  toggleLinkText: {
    color: '#7A4A2B',
    fontSize: 12.5,
    textDecorationLine: 'underline',
  },
});

export default Needs;
