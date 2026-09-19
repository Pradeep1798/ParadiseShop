import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from 'theme/Theme';

interface Props {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const ChocolateLoader = ({ size = 'medium', text }: Props) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.94, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );

    rotate.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 350 }),
        withTiming(6, { duration: 700 }),
        withTiming(0, { duration: 350 }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const fontSize =
    size === 'small' ? 28 : size === 'large' ? 52 : 40;

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.chocolate,
          { fontSize },
          animatedStyle,
        ]}
      >
        🍫
      </Animated.Text>

      {!!text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chocolate: {
    textAlign: 'center',
  },
  text: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ChocolateLoader;