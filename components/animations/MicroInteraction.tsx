import React, { useState } from 'react';
import { TouchableWithoutFeedback, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface MicroInteractionProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  scaleOnPress?: boolean;
  rotateOnPress?: boolean;
  pulseOnMount?: boolean;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
}

const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  onPress,
  style,
  scaleOnPress = true,
  rotateOnPress = false,
  pulseOnMount = false,
  springConfig = { damping: 10, stiffness: 100, mass: 1 },
}) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const [isPressed, setIsPressed] = useState(false);

  // Pulse animation on mount
  React.useEffect(() => {
    if (pulseOnMount) {
      scale.value = withTiming(1.1, { duration: 300 }, () => {
        scale.value = withTiming(1, { duration: 300 });
      });
    }
  }, []);

  // Handle press in
  const handlePressIn = () => {
    setIsPressed(true);
    if (scaleOnPress) {
      scale.value = withSpring(0.95, springConfig);
    }
    if (rotateOnPress) {
      rotate.value = withTiming(5, { duration: 100 });
    }
  };

  // Handle press out
  const handlePressOut = () => {
    setIsPressed(false);
    if (scaleOnPress) {
      scale.value = withSpring(1, springConfig);
    }
    if (rotateOnPress) {
      rotate.value = withTiming(0, { duration: 200, easing: Easing.elastic(1.5) });
    }
  };

  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotateZ: `${rotate.value}deg` },
      ],
    };
  });

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default MicroInteraction;