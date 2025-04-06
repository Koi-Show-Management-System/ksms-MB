import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface ParallaxItemProps {
  children: ReactNode;
  scrollY: Animated.SharedValue<number>;
  startPosition: number;
  endPosition: number;
  parallaxFactor?: number;
  style?: ViewStyle;
  direction?: 'vertical' | 'horizontal';
}

const ParallaxItem: React.FC<ParallaxItemProps> = ({
  children,
  scrollY,
  startPosition,
  endPosition,
  parallaxFactor = 0.3,
  style,
  direction = 'vertical',
}) => {
  // Animated style for parallax effect
  const animatedStyle = useAnimatedStyle(() => {
    const translateValue = interpolate(
      scrollY.value,
      [startPosition - 500, startPosition, endPosition, endPosition + 500],
      [parallaxFactor * 100, 0, -parallaxFactor * 100, -parallaxFactor * 200],
      Extrapolate.CLAMP
    );

    return {
      transform: direction === 'vertical' 
        ? [{ translateY: translateValue }] 
        : [{ translateX: translateValue }],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default ParallaxItem;