import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

import {
  getFirestore,
  collection,
  getDocs,
} from '@react-native-firebase/firestore';

import {
  getQuantityUnitLabel,
  computeAmount,
  formatCurrency,
} from 'utils/HelperFn';

import ScreenContainer from 'components/ScreenContainer';
import Card from 'components/Card';
import EmptyState from 'components/EmptyState';
import { getCategories } from 'services/Service';
import { Category, SubVariety } from 'types/Domain';

const PriceList = ({ route }: { route: { params?: { shopId?: string } } }) => {
  const { shopId } = route.params || {};
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadCategories = useCallback(async () => {
    if (!shopId) {
      console.log('shopId is missing, skipping fetch');
      return;
    }

    const data = await getCategories(shopId);
    setCategories(data);
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
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
      {categories.length === 0 && <EmptyState text="No products found." />}

      <View style={isTablet ? styles.tabletGrid : undefined}>
        {categories.map(cat => {
          const isOpen = !!expanded[cat.id];

          return (
            <Card
              key={cat.id}
              style={[
                styles.categoryCard,
                isTablet && styles.tabletCategoryCard,
              ]}
            >
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.categoryName}>{cat.name}</Text>

                <Text style={styles.chevron}>{isOpen ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isOpen &&
                cat.subVarieties.map((sv: SubVariety) => (
                  <View key={sv.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{sv.name}</Text>

                    <View style={styles.priceWrap}>
                      {sv.presetAmounts && sv.presetAmounts.length > 0 ? (
                        sv.presetAmounts.map((amt: number) => (
                          <Text key={amt} style={styles.priceTag}>
                            {amt}
                            {getQuantityUnitLabel(sv.unit)} — ₹
                            {formatCurrency(
                              computeAmount(sv.unit, amt, sv.pricePerKg),
                            )}
                          </Text>
                        ))
                      ) : (
                        <Text style={styles.priceTag}>
                          {formatCurrency(sv.pricePerKg)} / kg
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
            </Card>
          );
        })}
      </View>

      <View style={styles.bottomSpace} />
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

  categoryCard: {
    padding: 0,
    overflow: 'hidden',
  },

  tabletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  tabletCategoryCard: {
    width: '48.5%',
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },

  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5C3620',
  },

  chevron: {
    fontSize: 16,
    color: '#C17A3D',
  },

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

  priceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  priceTag: {
    fontSize: 12.5,
    color: '#C17A3D',
    fontWeight: '600',
    backgroundColor: '#F3E6D5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  bottomSpace: {
    height: 40,
  },
});

export default PriceList;