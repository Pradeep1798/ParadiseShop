import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { RADIUS, SPACING } from 'theme/Theme';

const ModalOverlay = ({ visible, children }: { visible: boolean; children: React.ReactNode }) => {
  if (!visible) return null;
  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <View style={styles.backdrop}>
        <ScrollView style={styles.box}>{children}</ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: { ...StyleSheet.absoluteFill, zIndex: 999, elevation: 999 },
  backdrop: { flex: 1, backgroundColor: 'rgba(43,22,12,0.5)', justifyContent: 'center', padding: SPACING.xl },
  box: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 20, maxHeight: '85%' },
});

export default ModalOverlay;