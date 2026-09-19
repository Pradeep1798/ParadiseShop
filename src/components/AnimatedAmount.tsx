import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { formatCurrency } from 'utils/HelperFn';

interface Props {
  value: number;
  style?: TextStyle;
  duration?: number;
}

const AnimatedAmount = ({ value, style, duration = 500 }: Props) => {
  const animatedValue = useSharedValue(value);
  const [displayValue, setDisplayValue] = React.useState(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
    });
  }, [value, duration]);

  useAnimatedReaction(
    () => Math.round(animatedValue.value),
    current => {
      runOnJS(setDisplayValue)(current);
    },
    [],
  );

  return (
    <Animated.Text style={style}>{formatCurrency(displayValue)}</Animated.Text>
  );
};

export default AnimatedAmount;
