import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from '@vardrz/react-native-bluetooth-escpos-printer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import qrcode from 'qrcode-generator';
import { formatCurrencyPlain } from './HelperFn';

const SAVED_PRINTER_KEY = 'saved_printer_mac';

// ============================================================
// PRINTER CONNECTION
// ============================================================

export async function connectDirectMac(address: string) {
  const cleanAddress = address.trim().toUpperCase();

  if (!cleanAddress) {
    throw new Error('Invalid MAC address');
  }

  const hasPermission = await requestBluetoothPermissions();

  if (!hasPermission) {
    throw new Error('Bluetooth permission not granted');
  }

  const enabled = await BluetoothManager.isBluetoothEnabled();

  if (!enabled) {
    await BluetoothManager.enableBluetooth();
  }

  await BluetoothManager.connect(cleanAddress);

  await AsyncStorage.setItem(SAVED_PRINTER_KEY, cleanAddress);

  const saved = await AsyncStorage.getItem(SAVED_PRINTER_KEY);

  if (saved !== cleanAddress) {
    throw new Error('Printer connected, but MAC address could not be saved.');
  }

  return cleanAddress;
}

// ============================================================
// GET SAVED PRINTER
// ============================================================

export async function getSavedPrinter() {
  const mac = await AsyncStorage.getItem(SAVED_PRINTER_KEY);

  return mac;
}

// ============================================================
// SCAN PRINTERS
// ============================================================

export async function scanPrinters() {
  const hasPermission = await requestBluetoothPermissions();

  if (!hasPermission) {
    throw new Error(
      'Bluetooth permission was not granted. Go to Android Settings → Apps → Paradise Shop → Permissions.',
    );
  }

  const enabled = await BluetoothManager.isBluetoothEnabled();

  if (!enabled) {
    await BluetoothManager.enableBluetooth();
  }

  let raw: any;

  try {
    raw = await BluetoothManager.scanDevices();
  } catch (err) {
    console.error('❌ Native scan failed:', err);

    throw new Error(
      'Scan failed — ' + (err instanceof Error ? err.message : String(err)),
    );
  }

  let parsed: any = raw;

  // First JSON parse
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {}
  }

  // Some versions return JSON encoded twice
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {}
  }

  const rawPaired = Array.isArray(parsed?.paired) ? parsed.paired : [];

  const rawFound = Array.isArray(parsed?.found) ? parsed.found : [];

  const parseItem = (item: any) => {
    if (typeof item === 'string') {
      try {
        return JSON.parse(item);
      } catch (e) {
        return null;
      }
    }

    return item;
  };

  const paired = rawPaired.map(parseItem).filter(Boolean);
  const found = rawFound.map(parseItem).filter(Boolean);

  const byAddress = new Map<string, any>();

  [...paired, ...found].forEach((device: any) => {
    const address =
      device?.address ||
      device?.inner_mac_address ||
      device?.macAddress ||
      device?.mac;

    const name =
      device?.name ||
      device?.device_name ||
      device?.deviceName ||
      'Thermal Printer';

    if (address) {
      const cleanAddress = String(address).trim().toUpperCase();

      byAddress.set(cleanAddress, {
        name,
        address: cleanAddress,
      });
    }
  });

  const devices = Array.from(byAddress.values());

  return devices;
}

// ============================================================
// TEXT FORMATTING
// ============================================================

function padColumns(left: string, right: string, width = 32) {
  const availableLeft = Math.max(1, width - right.length - 1);

  const trimmedLeft =
    left.length > availableLeft
      ? `${left.slice(0, Math.max(1, availableLeft - 3))}...`
      : left;

  const space = Math.max(1, width - trimmedLeft.length - right.length);

  return trimmedLeft + ' '.repeat(space) + right + '\n';
}

// ============================================================
// AUTO CONNECT
// ============================================================

export async function autoConnectSavedPrinter(): Promise<string | null> {
  try {
    const savedMac = await getSavedPrinter();

    if (!savedMac) {
      return null;
    }

    const enabled = await BluetoothManager.isBluetoothEnabled();

    if (!enabled) {
      await BluetoothManager.enableBluetooth();
    }

    await BluetoothManager.connect(savedMac);

    return savedMac;
  } catch (error) {
    console.warn('Auto-connect to printer failed:', error);

    return null;
  }
}

// ============================================================
// BLUETOOTH PERMISSIONS
// ============================================================

async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    return (
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

// ============================================================
// QR CODE -> BMP IMAGE
//
// We generate the QR matrix ourselves and create a BMP image.
// This avoids the printer's broken native printQRCode() command.
// ============================================================

function createQrBmpBase64(
  text: string,
  options?: {
    moduleSize?: number;
    quietZone?: number;
  },
): string {
  const moduleSize = options?.moduleSize ?? 5;
  const quietZone = options?.quietZone ?? 4;

  // ----------------------------------------------------------
  // Generate QR matrix
  // ----------------------------------------------------------

  const qr = qrcode(0, 'M');

  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();

  // Total pixels of QR image
  const qrPixelSize = (moduleCount + quietZone * 2) * moduleSize;

  // ----------------------------------------------------------
  // BMP requires each row padded to 4-byte boundary
  // ----------------------------------------------------------

  const rowBytes = Math.ceil((qrPixelSize * 3) / 4) * 4;

  const pixelDataSize = rowBytes * qrPixelSize;

  const fileHeaderSize = 14;
  const dibHeaderSize = 40;

  const pixelOffset = fileHeaderSize + dibHeaderSize;

  const fileSize = pixelOffset + pixelDataSize;

  const buffer = new Uint8Array(fileSize);

  // ----------------------------------------------------------
  // BMP FILE HEADER
  // ----------------------------------------------------------

  // Signature "BM"
  buffer[0] = 0x42;
  buffer[1] = 0x4d;

  writeUInt32LE(buffer, 2, fileSize);

  // Reserved
  writeUInt16LE(buffer, 6, 0);
  writeUInt16LE(buffer, 8, 0);

  // Pixel data offset
  writeUInt32LE(buffer, 10, pixelOffset);

  // ----------------------------------------------------------
  // DIB HEADER
  // ----------------------------------------------------------

  // Header size
  writeUInt32LE(buffer, 14, dibHeaderSize);

  // Width
  writeInt32LE(buffer, 18, qrPixelSize);

  // Height
  // Positive height means bottom-up BMP.
  writeInt32LE(buffer, 22, qrPixelSize);

  // Planes
  writeUInt16LE(buffer, 26, 1);

  // Bits per pixel
  // 24-bit RGB
  writeUInt16LE(buffer, 28, 24);

  // Compression = BI_RGB
  writeUInt32LE(buffer, 30, 0);

  // Image size
  writeUInt32LE(buffer, 34, pixelDataSize);

  // Horizontal resolution
  writeInt32LE(buffer, 38, 2835);

  // Vertical resolution
  writeInt32LE(buffer, 42, 2835);

  // Number of colors
  writeUInt32LE(buffer, 46, 0);

  // Important colors
  writeUInt32LE(buffer, 50, 0);

  // ----------------------------------------------------------
  // DRAW PIXELS
  // ----------------------------------------------------------

  let pixelOffsetIndex = pixelOffset;

  for (let bmpY = 0; bmpY < qrPixelSize; bmpY++) {
    // BMP is bottom-up
    const sourceY = qrPixelSize - 1 - bmpY;

    const qrY = Math.floor(sourceY / moduleSize) - quietZone;

    for (let x = 0; x < qrPixelSize; x++) {
      const qrX = Math.floor(x / moduleSize) - quietZone;

      let dark = false;

      if (qrX >= 0 && qrX < moduleCount && qrY >= 0 && qrY < moduleCount) {
        dark = qr.isDark(qrY, qrX);
      }

      const value = dark ? 0 : 255;

      // BGR order
      buffer[pixelOffsetIndex++] = value;
      buffer[pixelOffsetIndex++] = value;
      buffer[pixelOffsetIndex++] = value;
    }

    // Row padding
    const usedBytes = qrPixelSize * 3;

    const padding = rowBytes - usedBytes;

    for (let p = 0; p < padding; p++) {
      buffer[pixelOffsetIndex++] = 0;
    }
  }

  return uint8ArrayToBase64(buffer);
}

// ============================================================
// LITTLE-ENDIAN HELPERS
// ============================================================

function writeUInt16LE(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >> 8) & 0xff;
}

function writeUInt32LE(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >> 8) & 0xff;
  buffer[offset + 2] = (value >> 16) & 0xff;
  buffer[offset + 3] = (value >> 24) & 0xff;
}

function writeInt32LE(buffer: Uint8Array, offset: number, value: number) {
  const unsigned = value < 0 ? 0x100000000 + value : value;

  writeUInt32LE(buffer, offset, unsigned);
}

// ============================================================
// UINT8ARRAY -> BASE64
//
// No Buffer / Node dependency required.
// ============================================================

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  let result = '';

  let i = 0;

  while (i < bytes.length) {
    const byte1 = bytes[i++] ?? 0;
    const byte2 = i < bytes.length ? bytes[i++] : undefined;
    const byte3 = i < bytes.length ? bytes[i++] : undefined;

    const enc1 = byte1 >> 2;

    const enc2 = ((byte1 & 3) << 4) | ((byte2 ?? 0) >> 4);

    const enc3 =
      byte2 === undefined ? 64 : ((byte2 & 15) << 2) | ((byte3 ?? 0) >> 6);

    const enc4 = byte3 === undefined ? 64 : byte3 & 63;

    result += chars.charAt(enc1);
    result += chars.charAt(enc2);
    result += enc3 === 64 ? '=' : chars.charAt(enc3);

    result += enc4 === 64 ? '=' : chars.charAt(enc4);
  }

  return result;
}

// ============================================================
// PRINT BITMAP QR
// ============================================================

async function printLocationQr(locationUrl: string) {
  // Generate QR image.
  //
  // moduleSize = 5
  // quietZone = 4
  //
  // This normally produces a QR around
  // 200–250 dots depending on QR version.
  //
  // That is a good size for a 58mm printer.
  const qrBase64 = createQrBmpBase64(locationUrl, {
    moduleSize: 5,
    quietZone: 4,
  });

  // printPic expects the base64 image WITHOUT
  // "data:image/..." prefix.
  //
  // The library documentation supports printPic()
  // with a width in printer dots.
  await BluetoothEscposPrinter.printPic(qrBase64, {
    width: 240,
    center: true,
    paperSize: 58,
    autoCut: false,
  });
}

// ============================================================
// PRINT RECEIPT
// ============================================================

export async function printReceipt({
  shopName,
  billItems,
  discount,
  total,
  paymentMethod,
  staffName,
  timestamp,
  locationUrl,
  billId,
}: {
  shopName: string;
  billItems: {
    name: string;
    qty: string;
    amount: number;
  }[];
  discount: number;
  total: number;
  paymentMethod: string;
  staffName: string;
  timestamp: number;
  locationUrl?: string;
  billId?: string;
}) {
  const savedMac = await getSavedPrinter();

  if (!savedMac) {
    throw new Error(
      'No printer is configured. Please connect your Mindpure printer from Printer Setup first.',
    );
  }

  // ==========================================================
  // CONNECT TO SAVED PRINTER
  // ==========================================================

  try {
    const enabled = await BluetoothManager.isBluetoothEnabled();

    if (!enabled) {
      await BluetoothManager.enableBluetooth();
    }

    let needsConnection = true;

    try {
      const current = await BluetoothManager.getConnectedDevice();

      if (
        current?.address &&
        current.address.toLowerCase() === savedMac.toLowerCase()
      ) {
        needsConnection = false;
      }
    } catch (e) {
      // No current connection.
    }

    if (needsConnection) {
      await BluetoothManager.connect(savedMac);

      await AsyncStorage.setItem(SAVED_PRINTER_KEY, savedMac);
    }
  } catch (connectError) {
    console.error('Printer connection failed:', connectError);

    throw new Error(
      `Could not connect to printer (${savedMac}). Make sure the printer is switched on and paired in Android Bluetooth settings.`,
    );
  }

  // ==========================================================
  // RESET PRINTER
  // ==========================================================

  try {
    await BluetoothEscposPrinter.printText('\x1B\x40', {});
  } catch (e) {
    console.warn('Printer reset failed:', e);
  }

  // ==========================================================
  // RECEIPT TEXT
  // ==========================================================

  let receipt = '';

  receipt += `${shopName}\n`;

  receipt += `${new Date(timestamp).toLocaleString('en-IN')}\n`;

  receipt += '--------------------------------\n';

  billItems.forEach(item => {
    receipt += padColumns(
      `${item.name} (${item.qty})`,
      formatCurrencyPlain(item.amount),
    );

    receipt += '\n';
  });

  receipt += '--------------------------------\n';

  if (discount > 0) {
    receipt += padColumns('Discount', formatCurrencyPlain(discount));
  }

  receipt += padColumns('TOTAL', formatCurrencyPlain(total));

  receipt += `\nPaid via: ${paymentMethod.toUpperCase()}\n`;

  receipt += `Served by: ${staffName}\n`;

  receipt += '\nThank you, visit again!\n\n';

  await BluetoothEscposPrinter.printText(receipt, {
    encoding: 'GBK',
    codepage: 0,
  });

  // ==========================================================
  // BILL BARCODE
  // ==========================================================

  if (billId) {
    try {
      if (typeof (BluetoothEscposPrinter as any).printerAlign === 'function') {
        await (BluetoothEscposPrinter as any).printerAlign(1);
      }

      await BluetoothEscposPrinter.printBarCode(billId, 8, 2, 80, 2, 0);

      await BluetoothEscposPrinter.printText('\n', {});
    } catch (bcErr) {
      console.warn('⚠️ 1D Barcode print failed:', bcErr);
    }
  }

  // ==========================================================
  // LOCATION QR
  //
  // IMPORTANT:
  // DO NOT use printQRCode() anymore.
  //
  // The Mindpure printer was only producing a dot with
  // the native QR command.
  //
  // We now generate a real bitmap and use printPic().
  // ==========================================================

  if (locationUrl) {
    try {
      if (typeof (BluetoothEscposPrinter as any).printerAlign === 'function') {
        await (BluetoothEscposPrinter as any).printerAlign(1);
      }

      await BluetoothEscposPrinter.printText('Scan to Find Us\n', {
        encoding: 'GBK',
        codepage: 0,
      });

      await printLocationQr(locationUrl);

      await BluetoothEscposPrinter.printText('\n', {});

      if (typeof (BluetoothEscposPrinter as any).printerAlign === 'function') {
        await (BluetoothEscposPrinter as any).printerAlign(0);
      }
    } catch (qrErr) {
      console.warn('❌ Bitmap QR Code print failed:', qrErr);

      // Restore left alignment
      try {
        if (
          typeof (BluetoothEscposPrinter as any).printerAlign === 'function'
        ) {
          await (BluetoothEscposPrinter as any).printerAlign(0);
        }
      } catch {}
    }
  }

  // ==========================================================
  // FEED PAPER
  // ==========================================================

  await BluetoothEscposPrinter.printText('\n\n\n\n', {});

  // ==========================================================
  // CUT PAPER
  // ==========================================================

  try {
    if (typeof (BluetoothEscposPrinter as any).printerCut === 'function') {
      await (BluetoothEscposPrinter as any).printerCut();
    }
  } catch (cutErr) {
    console.warn('Paper cut failed:', cutErr);
  }
}
