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
              <ActivityIndicator color="#C17A3D" />
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
    backgroundColor: '#FBF4EC',
    padding: 24,
    paddingTop: 48,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 13, color: '#7A4A2B', marginTop: 4, marginBottom: 20 },
  connected: { color: '#5C7D57', fontWeight: '600', marginBottom: 12 },
  error: { color: '#9C3654', marginBottom: 12 },
  button: {
    backgroundColor: '#5C3620',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  deviceCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: { fontSize: 14, fontWeight: '600', color: '#2B160C' },
  deviceAddress: { fontSize: 11, color: '#9C8768' },
});

export default PrinterSetup;
