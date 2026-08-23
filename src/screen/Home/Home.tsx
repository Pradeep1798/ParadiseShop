import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { clearDeviceSession } from 'utils/HelperFn';
import { SCREENS } from 'roots/RootStack';

const Home = ({ route, navigation }: any) => {
  const { shopName, staffName, shopId } = route.params || {};

  const switchShop = async () => {
    await clearDeviceSession();
    navigation.reset({ index: 0, routes: [{ name: SCREENS.SHOP_PICKER }] });
  };

  const menuItems = [
    { label: 'Stock In', screen: SCREENS.STOCK_IN, color: '#5C7D57' },
    { label: 'Sell', screen: SCREENS.SELL, color: '#C17A3D' },
    { label: 'Expense', screen: SCREENS.EXPENSE, color: '#9C3654' },
    { label: 'Reports', screen: SCREENS.DAILYREPORTS, color: '#5C3620' },
    { label: 'Today Bills', screen: SCREENS.BILLS, color: '#4d3b31' },
    { label: 'Stock Need', screen: SCREENS.NEEDS, color: '#4d3b31' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.shopName}>{shopName}</Text>
        <Text style={styles.staffName}>Signed in as {staffName}</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuButton, { backgroundColor: item.color }]}
            onPress={() =>
              navigation.navigate(item.screen, { shopId, shopName, staffName })
            }
          >
            <Text style={styles.menuButtonText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={switchShop} style={styles.switchLink}>
        <Text style={styles.switchText}>Switch shop</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    paddingTop: 64,
  },
  header: { marginBottom: 32 },
  shopName: { fontSize: 24, fontWeight: '700', color: '#2B160C' },
  staffName: { fontSize: 14, color: '#7A4A2B', marginTop: 4 },
  menu: { gap: 14 },
  menuButton: {
    paddingVertical: 22,
    borderRadius: 14,
    alignItems: 'center',
  },
  menuButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  switchLink: { marginTop: 'auto', alignSelf: 'center', paddingVertical: 20 },
  switchText: {
    color: '#7A4A2B',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default Home;
