import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RADIUS, SPACING } from 'theme/Theme';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  visible: boolean;
  children: React.ReactNode;
}

const OPEN_DURATION = 200;
const CLOSE_DURATION = 160;

const ModalOverlay = ({ visible, children }: Props) => {
  const [mounted, setMounted] = useState(visible);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    if (visible) {
      // Mount first, then animate in.
      setMounted(true);

      opacity.value = withTiming(1, {
        duration: OPEN_DURATION,
      });

      scale.value = withTiming(1, {
        duration: OPEN_DURATION,
      });
    } else if (mounted) {
      // Animate out before unmounting.
      opacity.value = withTiming(0, {
        duration: CLOSE_DURATION,
      });

      scale.value = withTiming(
        0.96,
        {
          duration: CLOSE_DURATION,
        },
        finished => {
          if (finished) {
            runOnJS(setMounted)(false);
          }
        },
      );
    }
  }, [visible, mounted, opacity, scale]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const boxAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <View
      style={styles.overlayContainer}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.backdropColor,
            backdropAnimatedStyle,
          ]}
        />

        <Animated.View style={[styles.box, boxAnimatedStyle]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
  },

  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },

  backdropColor: {
    backgroundColor: 'rgba(43,22,12,0.5)',
  },

  box: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: 20,
    maxHeight: '85%',
    maxWidth: 480,
    width: '90%',
    alignSelf: 'center',
  },
});

export default ModalOverlay;
