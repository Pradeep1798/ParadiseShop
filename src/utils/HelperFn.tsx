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
