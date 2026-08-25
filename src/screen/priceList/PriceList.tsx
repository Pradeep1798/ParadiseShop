import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
} from '@react-native-firebase/firestore';
import { getQuantityUnitLabel, computeAmount } from 'utils/HelperFn';

const PriceList = ({ route }: any) => {
  const { shopId } = route.params || {};
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadCategories = useCallback(async () => {
    if (!shopId) {
      console.log('shopId is missing, skipping fetch');
      return;
    }
    const db = getFirestore();
    const snap = await getDocs(collection(db, 'shops', shopId, 'categories'));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, [shopId]);

  React.useEffect(() => {
    loadCategories().finally(() => setLoading(false));
  }, [loadCategories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const toggleCategory = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7A4A2B" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Price List</Text>

      {categories.length === 0 && (
        <Text style={styles.empty}>No products found.</Text>
      )}

      {categories.map(cat => {
        const isOpen = !!expanded[cat.id];
        return (
          <View key={cat.id} style={styles.categoryBox}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(cat.id)}
            >
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.chevron}>{isOpen ? '▾' : '▸'}</Text>
            </TouchableOpacity>

            {isOpen &&
              (cat.subVarieties || []).map((sv: any) => (
                <View key={sv.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{sv.name}</Text>
                  <View style={styles.priceWrap}>
                    {sv.presetAmounts && sv.presetAmounts.length > 0 ? (
                      sv.presetAmounts.map((amt: number) => (
                        <Text key={amt} style={styles.priceTag}>
                          {amt}
                          {getQuantityUnitLabel(sv.unit)} — ₹
                          {computeAmount(sv.unit, amt, sv.pricePerKg).toFixed(
                            0,
                          )}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.priceTag}>₹{sv.pricePerKg} / kg</Text>
                    )}
                  </View>
                </View>
              ))}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2B160C',
    marginBottom: 16,
  },
  empty: { color: '#7A4A2B', textAlign: 'center', marginTop: 30 },
  categoryBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryName: { fontSize: 15, fontWeight: '700', color: '#5C3620' },
  chevron: { fontSize: 16, color: '#C17A3D' },
  itemRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3E6D5',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B160C',
    marginBottom: 4,
  },
  priceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceTag: {
    fontSize: 12.5,
    color: '#C17A3D',
    fontWeight: '600',
    backgroundColor: '#F3E6D5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});

export default PriceList;
