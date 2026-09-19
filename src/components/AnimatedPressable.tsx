import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = ({
  children,
  style,
  onPressIn,
  onPressOut,
  ...props
}: Props) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      {...props}
      onPressIn={event => {
        scale.value = withTiming(0.96, { duration: 100 });
        onPressIn?.(event);
      }}
      onPressOut={event => {
        scale.value = withTiming(1, { duration: 100 });
        onPressOut?.(event);
      }}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default AnimatedPressable;
