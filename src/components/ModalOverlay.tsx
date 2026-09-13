import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RADIUS, SPACING } from 'theme/Theme';

const ModalOverlay = ({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) => {
  if (!visible) return null;
  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View style={styles.box}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: { ...StyleSheet.absoluteFill, zIndex: 999, elevation: 999 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,22,12,0.5)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: 20,
    maxHeight: '85%',
  },
});

export default ModalOverlay;