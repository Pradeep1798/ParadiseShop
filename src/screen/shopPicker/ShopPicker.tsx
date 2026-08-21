import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  getFirestore,
  collection,
  getDocs,
} from '@react-native-firebase/firestore';
import { SCREENS } from 'roots/RootStack';

interface ShopDoc {
  id: string;
  name: string;
  pin: string;
  staffNames: string[];
}

const ShopPicker = ({ navigation }: any) => {
  const [shops, setShops] = useState<ShopDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadShops = async () => {
      try {
        const db = getFirestore();
        const snapshot = await getDocs(collection(db, 'shops'));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<ShopDoc, 'id'>),
        }));
        setShops(data);
      } catch (e) {
        setError('Could not load shops. Check your internet connection.');
      } finally {
        setLoading(false);
      }
    };
    loadShops();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7A4A2B" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paradise Shop</Text>
      <Text style={styles.subtitle}>Select your shop</Text>

      <FlatList
        style={{ marginTop: 24 }}
        data={shops}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.shopCard}
            onPress={() =>
              navigation.navigate(SCREENS.PIN, {
                shopId: item.id,
                shopName: item.name,
              })
            }
          >
            <Text style={styles.shopName}>{item.name}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.error}>No shops found in Firestore.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    paddingTop: 72,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF4EC',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 14, color: '#7A4A2B', marginTop: 4 },
  shopCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },
  shopName: { fontSize: 16, fontWeight: '600', color: '#2B160C' },
  arrow: { fontSize: 22, color: '#C17A3D' },
  error: { color: '#9C3654', textAlign: 'center' },
});

export default ShopPicker;
