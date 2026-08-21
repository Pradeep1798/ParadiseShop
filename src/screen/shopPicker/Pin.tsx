import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { setDeviceSession } from 'utils/HelperFn';
import { SCREENS } from 'roots/RootStack';

const Pin = ({ route, navigation }: any) => {
  const { shopId, shopName } = route.params;
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (pin.length < 4) {
      setError('Enter your shop PIN');
      return;
    }
    setChecking(true);
    setError('');
    try {
      const db = getFirestore();
      const shopDoc = await getDoc(doc(db, 'shops', shopId));
      const data = shopDoc.data();

      if (!data || data.pin !== pin) {
        setError('Incorrect PIN, try again');
        setChecking(false);
        return;
      }

      navigation.navigate(SCREENS.STAFF, { shopId, shopName });
    } catch (e) {
      setError('Could not load shops. Check your internet connection.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{shopName}</Text>
      <Text style={styles.subtitle}>Enter shop PIN</Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={t => {
          setPin(t.replace(/[^0-9]/g, ''));
          setError('');
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="••••"
        autoFocus
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={submit}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16 }}
      >
        <Text style={styles.back}>← Choose a different shop</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    paddingTop: 96,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 14, color: '#7A4A2B', marginTop: 4, marginBottom: 32 },
  input: {
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
    width: 180,
    borderBottomWidth: 2,
    borderBottomColor: '#C17A3D',
    paddingVertical: 8,
    color: '#2B160C',
  },
  error: { color: '#9C3654', marginTop: 16 },
  button: {
    marginTop: 32,
    backgroundColor: '#5C3620',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  back: { color: '#7A4A2B', fontSize: 13 },
});

export default Pin;
