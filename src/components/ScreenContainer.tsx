import React from 'react';
import {
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { COLORS } from 'theme/Theme';

interface Props {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  allowWideContent?: boolean;
}
const MAX_CONTENT_WIDTH = 480; // roughly phone-width, feels natural, prevents stretch

const ScreenContainer = ({
  children,
  refreshing,
  onRefresh,
  style,
  contentContainerStyle,
  allowWideContent = false,
}: Props) => {
  const { width } = useWindowDimensions();
  const isWide = width > MAX_CONTENT_WIDTH;

  return (
    <KeyboardAwareScrollView
      style={[styles.container, style]}
      contentContainerStyle={[
        contentContainerStyle,
        isWide &&
          !allowWideContent && {
            maxWidth: MAX_CONTENT_WIDTH,
            alignSelf: 'center',
            width: '100%',
          },
      ]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: 18,
    paddingTop: 18,
  },
});

export default ScreenContainer;