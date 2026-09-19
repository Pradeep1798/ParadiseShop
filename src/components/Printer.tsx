import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { connectPrinter, scanPrinters } from 'utils/Printer';
import { COLORS, RADIUS, SPACING } from 'theme/Theme';

const PrinterSetup = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState('');

  const scan = async () => {
    setScanning(true);
    setError('');
    try {
      const found = await scanPrinters();
      setDevices(found);
    } catch (e: any) {
      setError(
        'Could not scan — make sure Bluetooth is on and the printer is powered on',
      );
    } finally {
      setScanning(false);
    }
  };

  const connect = async (device: any) => {
    setConnecting(device.inner_mac_address);
    setError('');
    try {
      await connectPrinter(device.inner_mac_address);
      setConnected(device.device_name || device.inner_mac_address);
    } catch (e) {
      setError('Could not connect to that printer');
    } finally {
      setConnecting('');
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Printer Setup</Text>
      <Text style={styles.subtitle}>
        Turn on your Bluetooth printer, then scan for it below.
      </Text>

      {!!connected && (
        <Text style={styles.connected}>✓ Connected to {connected}</Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={scan}
        disabled={scanning}
      >
        {scanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Scan for Printers</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={devices}
        keyExtractor={item => item.inner_mac_address}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !scanning ? (
            <Text style={styles.emptyText}>
              No paired printers found. Turn on the printer and scan again.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceCard}
            onPress={() => connect(item)}
            disabled={!!connecting}
          >
            <Text style={styles.deviceName}>
              {item.device_name || 'Unknown device'}
            </Text>
            {connecting === item.inner_mac_address ? (
              <ActivityIndicator color={COLORS.caramel} />
            ) : (
              <Text style={styles.deviceAddress}>{item.inner_mac_address}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: 24,
    paddingTop: 48,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.cacaoDark },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  connected: { color: COLORS.success, fontWeight: '600', marginBottom: 12 },
  error: { color: COLORS.danger, marginBottom: 12 },
  button: {
    backgroundColor: COLORS.cacao,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontWeight: '700' },
  listContent: { paddingTop: SPACING.lg, paddingBottom: SPACING.lg },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  deviceCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: { fontSize: 14, fontWeight: '600', color: COLORS.cacaoDark },
  deviceAddress: { fontSize: 11, color: COLORS.textFaint },
});

export default PrinterSetup;
