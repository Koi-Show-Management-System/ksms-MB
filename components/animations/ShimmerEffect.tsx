import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerEffectProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  shimmerColors?: string[];
  shimmerDuration?: number;
}

const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
  shimmerColors = ['#EBEBEB', '#F5F5F5', '#EBEBEB'],
  shimmerDuration = 1500,
}) => {
  // Animation value
  const shimmerValue = useSharedValue(0);

  // Start animation on component mount
  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, {
        duration: shimmerDuration,
        easing: Easing.linear,
      }),
      -1, // Repeat infinitely
      false // Don't reverse
    );
  }, [shimmerDuration]);

  // Animated style for the gradient
  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-width * 2, width * 2],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#EBEBEB',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, width: '200%' }}
        />
      </Animated.View>
    </View>
  );
};

export default ShimmerEffect;