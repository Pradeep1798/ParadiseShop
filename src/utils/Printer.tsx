import { BLEPrinter } from 'react-native-thermal-receipt-printer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrencyPlain } from './HelperFn';

const SAVED_PRINTER_KEY = 'saved_printer_mac';
let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await BLEPrinter.init();
    initialized = true;
  }
}

export async function scanPrinters() {
  await ensureInit();
  return BLEPrinter.getDeviceList(); // returns already-paired BLE devices
}

export async function connectPrinter(mac: string) {
  await ensureInit();
  await BLEPrinter.connectPrinter(mac);
  await AsyncStorage.setItem(SAVED_PRINTER_KEY, mac);
}

export async function getSavedPrinter() {
  return AsyncStorage.getItem(SAVED_PRINTER_KEY);
}

// Pads two strings to line up as left/right columns on a fixed-width receipt line.
// width=32 fits a standard 58mm printer's character width; use 48 for 80mm printers.
function padColumns(left: string, right: string, width = 32) {
  const space = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(space) + right + '\n';
}

export async function printReceipt({
  shopName,
  billItems,
  discount,
  //   excess,
  total,
  paymentMethod,
  staffName,
  timestamp,
}: {
  shopName: string;
  billItems: { name: string; qty: string; amount: number }[];
  discount: number;
  //   excess: number;
  total: number;
  paymentMethod: string;
  staffName: string;
  timestamp: number;
}) {
  const savedMac = await getSavedPrinter();
  if (!savedMac) throw new Error('No printer connected yet');
  await ensureInit();
  await BLEPrinter.connectPrinter(savedMac);

  let receipt = '';
  receipt += `${shopName}\n`;
  receipt += `${new Date(timestamp).toLocaleString('en-IN')}\n`;
  receipt += '--------------------------------\n';

  billItems.forEach(item => {
    receipt += padColumns(
      `${item.name} (${item.qty})`,
      formatCurrencyPlain(item.amount),
    );
  });

  receipt += '--------------------------------\n';
  if (discount > 0)
    receipt += padColumns('Discount', formatCurrencyPlain(discount));
  //   if (excess > 0) receipt += padColumns('Excess', `+Rs.${excess.toFixed(2)}`);
  receipt += padColumns('TOTAL', formatCurrencyPlain(total));
  receipt += `\nPaid via: ${paymentMethod.toUpperCase()}\n`;
  receipt += `Served by: ${staffName}\n`;
  receipt += '\nThank you, visit again!\n\n\n';

  BLEPrinter.printBill(receipt, { beep: true, cut: true, encoding: 'UTF-8' });
}