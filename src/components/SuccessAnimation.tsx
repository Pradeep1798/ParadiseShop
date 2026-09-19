import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from 'theme/Theme';

interface Props {
  visible: boolean;
  message?: string;
  onFinished?: () => void;
}

const SuccessAnimation = ({
  visible,
  message = 'Done!',
  onFinished,
}: Props) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      scale.value = 0.5;
      opacity.value = 0;
      return;
    }

    scale.value = withSequence(
      withTiming(1.12, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(1, {
        duration: 160,
      }),
    );

    opacity.value = withTiming(1, {
      duration: 180,
    });

    const timer = setTimeout(() => {
      onFinished?.();
    }, 900);

    return () => clearTimeout(timer);
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 22,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  checkCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '800',
  },
  message: {
    marginTop: 10,
    color: COLORS.cacaoDark,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SuccessAnimation;