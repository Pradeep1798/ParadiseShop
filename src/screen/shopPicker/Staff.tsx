import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { setDeviceSession } from 'utils/HelperFn';
import { SCREENS } from 'roots/RootStack';

const Staff = ({ route, navigation }: any) => {
  const { shopId, shopName } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<{ name: string; role: string }[]>(
    [],
  );

  useEffect(() => {
    const loadNames = async () => {
      try {
        const db = getFirestore();
        const shopDoc = await getDoc(doc(db, 'shops', shopId));
        const data = shopDoc.data();
        setStaffList(data?.staff || []);
      } catch (e) {
        setError('Could not load staff list. Check your internet connection.');
      } finally {
        setLoading(false);
      }
    };
    loadNames();
  }, [shopId]);

  const choose = async (person: { name: string; role: string }) => {
    setSaving(true);
    try {
      await setDeviceSession({
        shopId,
        shopName,
        staffName: person.name,
        role: person.role,
      });
      navigation.reset({
        index: 0,
        routes: [
          {
            name: SCREENS.HOME,
            params: {
              shopId,
              shopName,
              staffName: person.name,
              role: person.role,
            },
          },
        ],
      });
    } catch (e) {
      setError('Could not save your selection, try again');
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7A4A2B" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{shopName}</Text>
      <Text style={styles.subtitle}>Who's entering data?</Text>
      <Text style={styles.note}>
        This phone will remember your choice, so you won't be asked again.
      </Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {staffList.map(person => (
        <TouchableOpacity
          key={person.name}
          style={styles.nameCard}
          onPress={() => choose(person)}
          disabled={saving}
        >
          <Text style={styles.nameText}>{person.name}</Text>
        </TouchableOpacity>
      ))}

      {staffList.length === 0 && !error && (
        <Text style={styles.error}>
          No staff names set up for this shop yet. Ask the owner to add them.
        </Text>
      )}

      {saving && (
        <ActivityIndicator style={{ marginTop: 16 }} color="#7A4A2B" />
      )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF4EC',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2B160C' },
  subtitle: { fontSize: 14, color: '#7A4A2B', marginTop: 4 },
  note: {
    fontSize: 11.5,
    color: '#9C8768',
    marginTop: 6,
    marginBottom: 28,
    textAlign: 'center',
  },
  nameCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  nameText: { fontSize: 17, fontWeight: '600', color: '#2B160C' },
  error: { color: '#9C3654', textAlign: 'center', marginBottom: 16 },
});

export default Staff;
