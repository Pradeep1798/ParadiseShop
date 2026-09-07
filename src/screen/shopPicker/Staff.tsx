import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { setDeviceSession } from 'utils/HelperFn';
import { SCREENS } from 'roots/RootStack';

const Staff = ({ route, navigation }: any) => {
  const { shopId, shopName } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<
    { name: string; role: string; password?: string }[]
  >([]);
  const [passwordPrompt, setPasswordPrompt] = useState<{
    name: string;
    role: string;
    password?: string;
  } | null>(null);
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [checkingPassword, setCheckingPassword] = useState(false);

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

  const choose = async (person: {
    name: string;
    role: string;
    password?: string;
  }) => {
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

  const handleTap = (person: {
    name: string;
    role: string;
    password?: string;
  }) => {
    setPasswordPrompt(person);
    setIsCreatingPassword(!person.password); // no password saved yet -> create mode
    setPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordError('');
  };

  const createPassword = async () => {
    if (passwordInput.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setPasswordError('Passwords do not match');
      return;
    }
    setCheckingPassword(true);
    setPasswordError('');
    try {
      const db = getFirestore();
      const updatedStaff = staffList.map(p =>
        p.name === passwordPrompt!.name ? { ...p, password: passwordInput } : p,
      );
      await updateDoc(doc(db, 'shops', shopId), { staff: updatedStaff });
      setStaffList(updatedStaff);
      setPasswordPrompt(null);
      await choose({ ...passwordPrompt!, password: passwordInput });
    } catch (e) {
      setPasswordError('Something went wrong, try again');
    } finally {
      setCheckingPassword(false);
    }
  };

  const confirmPassword = async () => {
    setCheckingPassword(true);
    setPasswordError('');
    if (passwordInput !== passwordPrompt!.password) {
      setPasswordError('Incorrect password');
      setCheckingPassword(false);
      return;
    }
    setPasswordPrompt(null);
    await choose(passwordPrompt!);
    setCheckingPassword(false);
  };

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
          onPress={() => handleTap(person)}
          disabled={saving}
        >
          <Text style={styles.nameText}>{person.name}</Text>
        </TouchableOpacity>
      ))}

      {!!passwordPrompt && (
        <View style={styles.overlayContainer} pointerEvents="box-none">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {isCreatingPassword ? 'Create Your Password' : 'Enter Password'}
              </Text>
              <Text style={styles.modalMeta}>
                {isCreatingPassword
                  ? `No password set for ${passwordPrompt.name} yet — create one now. You'll use it every time going forward.`
                  : `Enter ${passwordPrompt.name}'s password to continue`}
              </Text>

              <TextInput
                style={styles.input}
                value={passwordInput}
                onChangeText={setPasswordInput}
                placeholder="Password"
                secureTextEntry
                autoFocus
                keyboardType="number-pad"
              />

              {isCreatingPassword && (
                <TextInput
                  style={styles.input}
                  value={confirmPasswordInput}
                  onChangeText={setConfirmPasswordInput}
                  placeholder="Confirm password"
                  secureTextEntry
                  keyboardType="number-pad"
                />
              )}

              {!!passwordError && (
                <Text style={styles.error}>{passwordError}</Text>
              )}

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setPasswordPrompt(null)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={
                    isCreatingPassword ? createPassword : confirmPassword
                  }
                  disabled={checkingPassword}
                >
                  {checkingPassword ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      {isCreatingPassword ? 'Create' : 'Confirm'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
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
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999, // Android needs elevation too, zIndex alone isn't always enough
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,22,12,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: { backgroundColor: '#fff', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2B160C' },
  modalMeta: { fontSize: 12, color: '#7A4A2B', marginTop: 4, marginBottom: 16 },
  nameText: { fontSize: 17, fontWeight: '600', color: '#2B160C' },
  error: { color: '#9C3654', textAlign: 'center', marginBottom: 16 },
  input: {
    backgroundColor: '#FBF4EC',
    borderWidth: 1,
    borderColor: '#E2CFAF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: 'black',
    marginBottom: 10,
  },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3E6D5',
  },
  cancelBtnText: { color: '#5C3620', fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#9C3654',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});

export default Staff;
