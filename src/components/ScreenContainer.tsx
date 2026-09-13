import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  RefreshControl,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface Props {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle; // add this
}

const ScreenContainer = ({
  children,
  refreshing,
  onRefresh,
  style,
  contentContainerStyle,
}: Props) => {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, style]}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#FBF4EC',
    padding: 24,
    // paddingTop: 48,
  },
});

export default ScreenContainer;
