import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { connectDirectMac, getSavedPrinter, scanPrinters } from 'utils/Printer';

import { COLORS, RADIUS, SPACING } from 'theme/Theme';

const SAVED_PRINTER_KEY = 'saved_printer_mac';

type PrinterDevice = {
  name: string;
  address: string;
};

const PrinterSetup = () => {
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState('');
  const [error, setError] = useState('');
  const [savedMac, setSavedMac] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSavedPrinter();
  }, []);

  const loadSavedPrinter = async () => {
    try {
      const mac = await getSavedPrinter();

      if (mac) {
        setSavedMac(mac);
      }
    } catch (error) {
      console.error('Failed to load printer:', error);
    }
  };

  const scan = async () => {
    if (scanning) return;

    setScanning(true);
    setError('');
    setMessage('');

    try {
      const found = await scanPrinters();

      /*
       * Prefer devices whose names look like printers.
       *
       * Your Mindpure currently appears as:
       * "BlueTooth Printer"
       */
      const printerDevices = found.filter(device => {
        const name = (device.name || '').toLowerCase();

        return (
          name.includes('printer') ||
          name.includes('print') ||
          name.includes('thermal') ||
          name.includes('pos') ||
          name.includes('mindpure')
        );
      });

      /*
       * If the library doesn't identify the printer by name,
       * don't hide everything. Show the complete paired list
       * as a fallback.
       */
      const result = printerDevices.length > 0 ? printerDevices : found;

      setDevices(result);

      if (result.length === 0) {
        setError(
          'No Bluetooth devices found. Make sure the printer is paired in Android Bluetooth settings.',
        );
      } else {
        setMessage(
          `${result.length} Bluetooth device${
            result.length === 1 ? '' : 's'
          } found.`,
        );
      }
    } catch (e: any) {
      console.error('❌ Printer scan error:', e);

      setError(e?.message || 'Could not scan for Bluetooth devices.');
    } finally {
      setScanning(false);
    }
  };

  const connectPrinter = async (device: PrinterDevice) => {
    if (connecting) return;

    const mac = device.address?.trim();

    if (!mac) {
      setError('This device does not have a valid Bluetooth address.');
      return;
    }

    setConnecting(mac);
    setError('');
    setMessage('');

    try {
      const connectedMac = await connectDirectMac(mac);

      setSavedMac(connectedMac);

      setMessage(`✓ ${device.name || 'Printer'} connected successfully.`);
    } catch (e: any) {
      console.error('❌ Printer connection error:', e);

      setError(e?.message || 'Failed to connect to the printer.');
    } finally {
      setConnecting('');
    }
  };

  const clearPrinter = async () => {
    try {
      await AsyncStorage.removeItem(SAVED_PRINTER_KEY);

      setSavedMac('');
      setMessage('Printer configuration cleared.');
      setError('');
    } catch (e) {
      console.error('Failed to clear printer:', e);
      setError('Could not clear printer configuration.');
    }
  };

  const testPrint = async () => {
    if (!savedMac) {
      setError('Please connect a printer first.');
      return;
    }

    setError('');
    setMessage('');

    try {
      /*
       * Import dynamically so PrinterSetup doesn't need
       * to change the rest of the printer architecture.
       */
      const { BluetoothEscposPrinter } = await import(
        '@vardrz/react-native-bluetooth-escpos-printer'
      );

      const { BluetoothManager } = await import(
        '@vardrz/react-native-bluetooth-escpos-printer'
      );

      const enabled = await BluetoothManager.isBluetoothEnabled();

      if (!enabled) {
        await BluetoothManager.enableBluetooth();
      }

      await BluetoothManager.connect(savedMac);

      await BluetoothEscposPrinter.printText('\x1B\x40', {});

      await BluetoothEscposPrinter.printText('\n', {});

      await BluetoothEscposPrinter.printText('PARADISE SHOP\n', {
        encoding: 'GBK',
        codepage: 0,
      });

      await BluetoothEscposPrinter.printText('Printer Test Successful\n', {
        encoding: 'GBK',
        codepage: 0,
      });

      await BluetoothEscposPrinter.printText(
        '-------------------------------\n',
        {},
      );

      await BluetoothEscposPrinter.printText(`MAC: ${savedMac}\n`, {});

      await BluetoothEscposPrinter.printText(
        'Bluetooth connection OK\n\n\n\n',
        {},
      );

      try {
        if (typeof (BluetoothEscposPrinter as any).printerCut === 'function') {
          await (BluetoothEscposPrinter as any).printerCut();
        }
      } catch (e) {
        console.warn('Cut failed:', e);
      }

      setMessage('✓ Test print sent successfully.');
    } catch (e: any) {
      console.error('❌ TEST PRINT FAILED:', e);

      setError(
        e?.message ||
          'Test print failed. Make sure the printer is switched on.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Printer Setup</Text>

      <Text style={styles.subtitle}>
        Configure the Bluetooth thermal printer used for automatic bill
        printing.
      </Text>

      {/* CURRENT PRINTER */}

      {savedMac ? (
        <View style={styles.currentCard}>
          <View style={styles.printerIcon}>
            <Text style={styles.printerIconText}>🖨️</Text>
          </View>

          <View style={styles.currentInfo}>
            <Text style={styles.currentTitle}>Printer Connected</Text>

            <Text style={styles.currentName}>Bluetooth Thermal Printer</Text>

            <Text style={styles.mac}>{savedMac}</Text>

            <View style={styles.statusRow}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>
                Configured for automatic printing
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.notConfiguredCard}>
          <Text style={styles.notConfiguredTitle}>
            🖨️ No Printer Configured
          </Text>

          <Text style={styles.notConfiguredText}>
            Scan for your Mindpure printer below and connect it once.
          </Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {!!message && (
        <View style={styles.successBox}>
          <Text style={styles.success}>{message}</Text>
        </View>
      )}

      {/* ACTIONS */}

      {savedMac ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={testPrint}>
            <Text style={styles.buttonText}>🧾 TEST PRINT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setSavedMac('');
              setDevices([]);
              setMessage('');
              setError('');
            }}
          >
            <Text style={styles.secondaryButtonText}>CHANGE PRINTER</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearPrinter}>
            <Text style={styles.clearButtonText}>CLEAR PRINTER</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* SCANNER */}

      <Text style={styles.sectionTitle}>
        {savedMac ? 'Change Printer' : 'Find Your Printer'}
      </Text>

      <Text style={styles.sectionDescription}>
        Make sure your Mindpure printer is switched on and paired in Android
        Bluetooth settings.
      </Text>

      <TouchableOpacity
        style={[styles.scanButton, scanning && styles.disabledButton]}
        onPress={scan}
        disabled={scanning}
      >
        {scanning ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buttonText}>SCANNING...</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>🔍 SCAN BLUETOOTH DEVICES</Text>
        )}
      </TouchableOpacity>

      {/* DEVICES */}

      <FlatList
        data={devices}
        keyExtractor={item => item.address}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !scanning ? (
            <Text style={styles.emptyText}>
              Tap "Scan Bluetooth Devices" to find your paired printer.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const isConnecting = connecting === item.address;

          const isCurrent =
            savedMac.toLowerCase() === item.address.toLowerCase();

          return (
            <TouchableOpacity
              style={[styles.deviceCard, isCurrent && styles.selectedDevice]}
              onPress={() => connectPrinter(item)}
              disabled={!!connecting}
            >
              <View style={styles.deviceLeft}>
                <Text style={styles.deviceIcon}>
                  {item.name?.toLowerCase().includes('printer') ? '🖨️' : '📱'}
                </Text>

                <View>
                  <Text style={styles.deviceName}>{item.name}</Text>

                  <Text style={styles.deviceAddress}>{item.address}</Text>
                </View>
              </View>

              {isConnecting ? (
                <ActivityIndicator color={COLORS.caramel} />
              ) : isCurrent ? (
                <Text style={styles.connectedBadge}>CONNECTED</Text>
              ) : (
                <Text style={styles.connectText}>CONNECT</Text>
              )}
            </TouchableOpacity>
          );
        }}
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

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.cacaoDark,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 5,
    marginBottom: 18,
    lineHeight: 19,
  },

  currentCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },

  printerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.creamAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  printerIconText: {
    fontSize: 25,
  },

  currentInfo: {
    flex: 1,
  },

  currentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.success,
  },

  currentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cacaoDark,
    marginTop: 3,
  },

  mac: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  notConfiguredCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 16,
  },

  notConfiguredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cacaoDark,
  },

  notConfiguredText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 5,
    lineHeight: 18,
  },

  errorBox: {
    backgroundColor: COLORS.creamAlt,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 12,
  },

  error: {
    color: COLORS.danger,
    fontSize: 13,
  },

  successBox: {
    backgroundColor: COLORS.creamAlt,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 12,
  },

  success: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },

  actions: {
    marginBottom: 20,
  },

  primaryButton: {
    backgroundColor: COLORS.cacao,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: 9,
  },

  buttonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },

  secondaryButton: {
    backgroundColor: COLORS.creamAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: 9,
  },

  secondaryButtonText: {
    color: COLORS.cacaoDark,
    fontWeight: '800',
    fontSize: 12,
  },

  clearButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },

  clearButtonText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 11,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cacaoDark,
    marginBottom: 4,
  },

  sectionDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },

  scanButton: {
    backgroundColor: COLORS.textMuted,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  disabledButton: {
    opacity: 0.65,
  },

  listContent: {
    paddingBottom: 30,
  },

  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    lineHeight: 19,
  },

  deviceCard: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedDevice: {
    borderColor: COLORS.success,
  },

  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  deviceIcon: {
    fontSize: 22,
    marginRight: 12,
  },

  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cacaoDark,
  },

  deviceAddress: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  connectText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.caramel,
  },

  connectedBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.success,
  },
});

export default PrinterSetup;
