import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface ParallaxHeroSectionProps {
  children: ReactNode;
  height?: number;
  style?: ViewStyle;
  scrollY?: Animated.SharedValue<number>;
  parallaxFactor?: number;
  onScroll?: (event: any) => void;
}

const ParallaxHeroSection: React.FC<ParallaxHeroSectionProps> = ({
  children,
  height = 450,
  style,
  scrollY: externalScrollY,
  parallaxFactor = 0.5,
  onScroll,
}) => {
  // Use external scrollY if provided, otherwise create a new one
  const scrollY = externalScrollY || useSharedValue(0);

  // Handle scroll events if no external scrollY is provided
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (!externalScrollY) {
        scrollY.value = event.contentOffset.y;
      }
      if (onScroll) {
        onScroll(event);
      }
    },
  });

  // Animated style for parallax effect
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-height, 0, height],
      [height * parallaxFactor, 0, -height * parallaxFactor],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-height, 0, height],
      [1 + parallaxFactor, 1, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  return (
    <View style={[styles.container, { height }, style]}>
      <Animated.View style={[styles.parallaxContent, animatedStyle]}>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ParallaxHeroSection;