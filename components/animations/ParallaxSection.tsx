import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface ParallaxSectionProps {
  children: ReactNode;
  scrollY: Animated.SharedValue<number>;
  inputRange: number[];
  outputRange: number[];
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  direction?: 'vertical' | 'horizontal';
  parallaxFactor?: number;
}

const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  scrollY,
  inputRange,
  outputRange,
  style,
  containerStyle,
  direction = 'vertical',
  parallaxFactor = 0.3,
}) => {
  // Animated style for parallax effect
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      inputRange,
      outputRange,
      Extrapolate.CLAMP
    );

    return {
      transform: direction === 'vertical' 
        ? [{ translateY }] 
        : [{ translateX: translateY }],
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.parallaxContent, style, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  parallaxContent: {
    width: '100%',
  },
});

export default ParallaxSection;