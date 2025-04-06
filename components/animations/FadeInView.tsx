import React, { useEffect } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface FadeInViewProps extends ViewProps {
  delay?: number;
  duration?: number;
  from?: {
    opacity?: number;
    translateY?: number;
    translateX?: number;
    scale?: number;
  };
  style?: any;
  children: React.ReactNode;
}

const FadeInView: React.FC<FadeInViewProps> = ({
  delay = 0,
  duration = 500,
  from = { opacity: 0, translateY: 20 },
  style,
  children,
  ...props
}) => {
  // Animation values
  const opacity = useSharedValue(from.opacity ?? 0);
  const translateY = useSharedValue(from.translateY ?? 0);
  const translateX = useSharedValue(from.translateX ?? 0);
  const scale = useSharedValue(from.scale ?? 1);

  // Start animation on component mount
  useEffect(() => {
    const animation = withTiming(1, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    opacity.value = withDelay(delay, withTiming(1, { duration }));
    
    if (from.translateY !== undefined) {
      translateY.value = withDelay(delay, withTiming(0, { duration }));
    }
    
    if (from.translateX !== undefined) {
      translateX.value = withDelay(delay, withTiming(0, { duration }));
    }
    
    if (from.scale !== undefined) {
      scale.value = withDelay(delay, withTiming(1, { duration }));
    }
  }, []);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
};

export default FadeInView;