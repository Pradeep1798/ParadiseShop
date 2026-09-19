import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
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
import AnimatedPressable from 'components/AnimatedPressable';

interface NeededItem {
  id: string;
  header: string;
  itemName: string;
  note?: string | null;
  addedBy: string;
  timestamp: number;
  fulfilled: boolean;
  fulfilledBy?: string | null;
  fulfilledAt?: number | null;
}

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

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const Needs = ({
  route,
}: {
  route: { params: { shopId: string; staffName: string } };
}) => {
  const { shopId, staffName } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [itemName, setItemName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [header, setHeader] = useState('');
  const [items, setItems] = useState<NeededItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFulfilled, setShowFulfilled] = useState(false);

  const loadItems = useCallback(async () => {
    const db = getFirestore();

    const snap = await getDocs(collection(db, 'shops', shopId, 'neededItems'));

    const list = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as NeededItem))
      .sort((a, b) => b.timestamp - a.timestamp);

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

      setItemName('');
      setNote('');

      // header stays as-is
      await loadItems();
    } catch (e) {
      setError('Something went wrong, try again');
    } finally {
      setSaving(false);
    }
  };

  const toggleFulfilled = async (item: NeededItem) => {
    const db = getFirestore();

    await updateDoc(doc(db, 'shops', shopId, 'neededItems', item.id), {
      fulfilled: !item.fulfilled,
      fulfilledBy: !item.fulfilled ? staffName : null,
      fulfilledAt: !item.fulfilled ? Date.now() : null,
    });

    await loadItems();
  };

  const groupByHeader = (list: NeededItem[]) => {
    const grouped: Record<string, NeededItem[]> = {};

    list.forEach(item => {
      const key = item.header || 'Other';

      if (!grouped[key]) {
        grouped[key] = [];
      }

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
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={onRefresh}
      allowWideContent={isTablet}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Needed Items</Text>
        <Text style={styles.subtitle}>Anything running low? Add it here.</Text>
      </View>

      <View style={isTablet ? styles.tabletRow : undefined}>
        <View style={isTablet ? styles.tabletFormColumn : undefined}>
          {/* Add Item Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add an item</Text>

            <Text style={styles.label}>Header</Text>
            <TextInput
              style={styles.input}
              value={header}
              onChangeText={setHeader}
              placeholder="e.g. Nuts, Mold"
              placeholderTextColor="#B5A08A"
            />

            <Text style={styles.label}>Item</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g. wafer roll boxes, cashew bits"
              placeholderTextColor="#B5A08A"
            />

            <Text style={styles.label}>Note</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. need at least 5kg"
              placeholderTextColor="#B5A08A"
            />

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addBtn, saving && styles.addBtnDisabled]}
              onPress={addItem}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.addIcon}>+</Text>
                  <Text style={styles.addBtnText}>Add to list</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={isTablet ? styles.tabletListColumn : undefined}>
          {/* Pending */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Pending</Text>
              <Text style={styles.sectionSubtitle}>
                {pending.length === 0
                  ? 'Nothing needed right now'
                  : `${pending.length} item${
                      pending.length !== 1 ? 's' : ''
                    } to buy`}
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pending.length}</Text>
            </View>
          </View>

          <View style={styles.listBox}>
            {pending.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>✓</Text>
                <Text style={styles.emptyTitle}>All caught up</Text>
                <Text style={styles.empty}>Nothing needed right now.</Text>
              </View>
            )}

            {Object.entries(pendingGrouped).map(([headerName, groupItems]) => (
              <View key={headerName} style={styles.group}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupHeader}>{headerName}</Text>

                  <View style={styles.groupLine} />
                </View>

                {groupItems.map(item => (
                  <AnimatedPressable
                    key={item.id}
                    style={styles.itemRow}
                    onPress={() => toggleFulfilled(item)}
                  >
                    <View style={styles.checkbox} />

                    <View style={styles.itemContent}>
                      <Text style={styles.itemName}>{item.itemName}</Text>

                      {!!item.note && (
                        <Text style={styles.itemNote}>{item.note}</Text>
                      )}

                      <Text style={styles.itemMeta}>
                        Added by {item.addedBy} · {formatDate(item.timestamp)}
                      </Text>
                    </View>

                    <Text style={styles.itemArrow}>›</Text>
                  </AnimatedPressable>
                ))}
              </View>
            ))}
          </View>

          {/* Bought Toggle */}
          <TouchableOpacity
            onPress={() => setShowFulfilled(s => !s)}
            style={styles.toggleLink}
            activeOpacity={0.7}
          >
            <View style={styles.toggleInner}>
              <Text style={styles.toggleLinkText}>
                {showFulfilled ? 'Hide' : 'Show'} bought items
              </Text>

              <View style={styles.boughtCount}>
                <Text style={styles.boughtCountText}>{fulfilled.length}</Text>
              </View>

              <Text style={styles.toggleArrow}>
                {showFulfilled ? '⌃' : '⌄'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Bought Items */}
          {showFulfilled && (
            <View style={styles.boughtSection}>
              {fulfilled.length === 0 && (
                <View style={styles.emptyBought}>
                  <Text style={styles.empty}>Nothing marked bought yet.</Text>
                </View>
              )}

              {fulfilled.map(item => (
                <AnimatedPressable
                  key={item.id}
                  style={styles.itemRow}
                  onPress={() => toggleFulfilled(item)}
                >
                  <View style={[styles.checkbox, styles.checkboxChecked]}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>

                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, styles.itemNameDone]}>
                      {item.itemName}
                    </Text>

                    {!!item.note && (
                      <Text style={styles.itemNote}>{item.note}</Text>
                    )}

                    <Text style={styles.itemMeta}>
                      Bought by {item.fulfilledBy} ·{' '}
                      {formatDate(item.fulfilledAt)}
                    </Text>
                  </View>

                  <Text style={styles.itemArrow}>›</Text>
                </AnimatedPressable>
              ))}
            </View>
          )}
        </View>
      </View>

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

  headerSection: {
    marginBottom: 8,
  },

  tabletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  tabletFormColumn: {
    flex: 0.85,
    marginRight: 12,
  },

  tabletListColumn: {
    flex: 1.15,
    marginLeft: 12,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#2B160C',
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 13,
    color: '#8A6B4E',
    marginTop: 4,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D4BC',
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
    shadowColor: '#5C3620',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5C3620',
    marginBottom: 4,
  },

  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A4A2B',
    marginTop: 14,
    marginBottom: 7,
    letterSpacing: 0.2,
  },

  input: {
    backgroundColor: '#FCF8F3',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2B160C',
  },

  errorBox: {
    backgroundColor: '#FBECEF',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginTop: 12,
  },

  error: {
    color: '#9C3654',
    fontSize: 12,
    fontWeight: '600',
  },

  addBtn: {
    marginTop: 18,
    backgroundColor: '#C17A3D',
    minHeight: 48,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  addBtnDisabled: {
    opacity: 0.7,
  },

  addIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '400',
  },

  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 27,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B160C',
  },

  sectionSubtitle: {
    fontSize: 11.5,
    color: '#9C8768',
    marginTop: 2,
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: '#F3E6D5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  countBadgeText: {
    color: '#7A4A2B',
    fontSize: 12,
    fontWeight: '800',
  },

  listBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#5C3620',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  group: {
    marginBottom: 5,
  },

  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 2,
    gap: 9,
  },

  groupHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C17A3D',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  groupLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3E6D5',
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 64,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
    gap: 11,
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C17A3D',
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: '#5C7D57',
    borderColor: '#5C7D57',
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  itemContent: {
    flex: 1,
    paddingRight: 4,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B160C',
  },

  itemNameDone: {
    textDecorationLine: 'line-through',
    color: '#9C8768',
  },

  itemNote: {
    fontSize: 12,
    color: '#7A4A2B',
    marginTop: 3,
  },

  itemMeta: {
    fontSize: 10.5,
    color: '#A18C73',
    marginTop: 5,
  },

  itemArrow: {
    fontSize: 22,
    color: '#C8B39A',
    lineHeight: 22,
    marginTop: 1,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },

  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF2E8',
    color: '#5C7D57',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 38,
    fontSize: 19,
    fontWeight: '800',
    overflow: 'hidden',
  },

  emptyTitle: {
    color: '#5C3620',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 9,
  },

  empty: {
    color: '#8E7962',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },

  toggleLink: {
    marginTop: 17,
    alignSelf: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  toggleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  toggleLinkText: {
    color: '#7A4A2B',
    fontSize: 12.5,
    fontWeight: '600',
  },

  boughtCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#F3E6D5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  boughtCountText: {
    color: '#7A4A2B',
    fontSize: 10,
    fontWeight: '800',
  },

  toggleArrow: {
    color: '#C17A3D',
    fontSize: 17,
    fontWeight: '700',
  },

  boughtSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  emptyBought: {
    paddingVertical: 22,
  },
});

export default Needs;