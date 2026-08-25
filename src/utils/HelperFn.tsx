import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'device_session';

interface DeviceSession {
  shopId: string;
  shopName: string;
  staffName: string;
}

export async function getDeviceSession(): Promise<DeviceSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function setDeviceSession(session: DeviceSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearDeviceSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// Central place for "how do we interpret this item's unit" logic,
// so Stock In / Sell / Reports all agree on the same rules.

export function getStockUnitLabel(baseUnit: string): string {
  if (baseUnit === 'g') return 'kg';
  if (baseUnit === 'ml') return 'L';
  if (baseUnit === 'pcs') return 'pcs';
  console.warn('Unexpected unit value:', baseUnit); // flags bad data instead of hiding it
  return baseUnit || 'pcs';
}

export function isCountBased(baseUnit: string): boolean {
  return baseUnit === 'pcs';
}

// Converts an entered quantity (grams, ml, or box-count) into the
// amount to add/subtract from the stored `stock` field.
export function computeStockDelta(
  baseUnit: string,
  enteredQty: number,
): number {
  return isCountBased(baseUnit) ? enteredQty : enteredQty / 1000;
}

// Converts an entered quantity into a price, given the item's rate.
// For weight/volume items, `rate` is price per 1000 units (per kg/litre).
// For count items, `rate` is price per single unit (per box/piece).
export function computeAmount(
  baseUnit: string,
  enteredQty: number,
  rate: number,
): number {
  return isCountBased(baseUnit)
    ? enteredQty * rate
    : (enteredQty / 1000) * rate;
}

// Label for the quantity *entry* field (grams/ml/box), as opposed to
// getStockUnitLabel which is for the *stock display* (kg/L/box).
export function getQuantityUnitLabel(baseUnit: string): string {
  if (baseUnit === 'g') return 'g';
  if (baseUnit === 'ml') return 'ml';
  return 'pcs';
}
