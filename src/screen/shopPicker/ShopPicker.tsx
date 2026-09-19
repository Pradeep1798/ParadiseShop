import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from '@react-native-firebase/firestore';
import { SCREENS } from 'roots/RootStack';
import ModalOverlay from 'components/ModalOverlay';
import AppInput from 'components/AppInput';
import AppButton from 'components/AppButton';
import { COLORS } from 'theme/Theme';
import AnimatedPressable from 'components/AnimatedPressable';
import ChocolateLoader from 'components/ChocolateLoader';

const ShopPicker = ({ navigation }: any) => {
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pinModalShop, setPinModalShop] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const db = getFirestore();
        const snap = await getDocs(collection(db, 'shops'));
        setShops(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      } catch (e) {
        setError('Could not load shops. Check your internet connection.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openPinModal = (shop: { id: string; name: string }) => {
    setPinModalShop(shop);
    setPin('');
    setPinError('');
  };

  const submitPin = async () => {
    if (pin.length < 4) {
      setPinError('Enter your shop PIN');
      return;
    }

    setChecking(true);
    setPinError('');

    try {
      const db = getFirestore();
      const shopDoc = await getDoc(doc(db, 'shops', pinModalShop!.id));
      const data = shopDoc.data();

      if (!data || data.pin !== pin) {
        setPinError('Incorrect PIN, try again');
        setChecking(false);
        return;
      }

      const shop = pinModalShop!;
      setPinModalShop(null);

      navigation.navigate(SCREENS.STAFF, {
        shopId: shop.id,
        shopName: shop.name,
      });
    } catch (e) {
      setPinError('Something went wrong, try again');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paradise Shop</Text>
      <Text style={styles.subtitle}>Select your shop</Text>

      {loading && <ChocolateLoader size="medium" text="Loading shops..." />}

      {!!error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && (
        <FlatList
          style={{ marginTop: 20 }}
          data={shops}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AnimatedPressable
              style={styles.shopCard}
              onPress={() => openPinModal(item)}
            >
              <Text style={styles.shopName}>{item.name}</Text>
              <Text style={styles.shopArrow}>›</Text>
            </AnimatedPressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No shops found. Ask the owner to create shops in Firestore under
              the "shops" collection.
            </Text>
          }
        />
      )}

      <ModalOverlay visible={!!pinModalShop}>
        <Text style={styles.modalTitle}>{pinModalShop?.name}</Text>
        <Text style={styles.modalSubtitle}>Enter shop PIN</Text>

        <AppInput
          value={pin}
          onChangeText={(t: string) => {
            setPin(t.replace(/[^0-9]/g, ''));
            setPinError('');
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          placeholder="••••"
          autoFocus
          style={styles.pinInput}
        />

        {!!pinError && <Text style={styles.error}>{pinError}</Text>}

        <View style={styles.modalButtonRow}>
          <AppButton
            label="Cancel"
            variant="outline"
            onPress={() => setPinModalShop(null)}
            style={{ flex: 1 }}
          />

          <AppButton
            label="Continue"
            loading={checking}
            onPress={submitPin}
            style={{ flex: 1 }}
          />
        </View>
      </ModalOverlay>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: 24,
    paddingTop: 72,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.cacaoDark,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  shopCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },

  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cacaoDark,
  },

  shopArrow: {
    fontSize: 22,
    color: COLORS.caramel,
  },

  empty: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },

  error: {
    color: COLORS.danger,
    marginTop: 12,
    textAlign: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.cacaoDark,
    textAlign: 'center',
  },

  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  pinInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});

export default ShopPicker;