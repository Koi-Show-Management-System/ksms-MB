import React, { memo, useEffect, useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';

// Hook tùy chỉnh để kiểm tra kích thước màn hình
const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  return {
    isSmallScreen: width < 640,
    width,
    height
  };
};

type CardProps = {
  uri: string;
  index: number;
  activeIndex: Animated.SharedValue<number>;
  totalCards: number;
  onPress: (uri: string, index: number) => void;
};

// Card Component
const Card = memo(({
  uri,
  index,
  activeIndex,
  totalCards,
  onPress
}: CardProps) => {
  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Tính toán vị trí của card dựa trên activeIndex
    // Chúng ta sẽ hiển thị 3 card cùng lúc: trung tâm, trái, phải
    const rotation = activeIndex.value;
    const cardRotation = (index * 360) / totalCards;
    
    // Tính rotateY cho mỗi card
    const rotateY = `${rotation - cardRotation}deg`;
    
    // Tính toán mức độ hiển thị của card dựa trên vị trí tương đối
    const factor = Math.abs(Math.cos(((rotation - cardRotation) * Math.PI) / 180));
    
    // Tính toán translateX dựa trên vị trí tương đối với card trung tâm
    // Card trung tâm sẽ có translateX=0, các card khác sẽ dịch sang trái/phải
    const translateX = 150 * Math.sin(((rotation - cardRotation) * Math.PI) / 180);
    
    // Scale card trung tâm lớn hơn các card khác
    const scale = 0.6 + 0.4 * factor;
    
    return {
      opacity: 0.5 + 0.5 * factor,
      transform: [
        { perspective: 1000 },
        { translateX },
        { rotateY },
        { scale },
      ] as any,
      zIndex: Math.round(factor * 100), // Card trung tâm có zIndex cao nhất
    };
  });

  return (
    <Animated.View
      style={[
        styles.card,
        cardAnimatedStyle as any,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(uri, index)}
        style={styles.cardTouchable}
      >
        <Image
          source={{ uri }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

type Carousel3DProps = {
  images?: string[];
};

const keywords = [
  "night",
  "city",
  "sky",
  "sunset",
  "sunrise",
  "winter",
  "skyscraper",
  "building",
  "cityscape",
  "architecture",
  "street",
  "lights",
  "downtown",
  "bridge",
];

const Carousel3D = ({ images }: Carousel3DProps) => {
  const { isSmallScreen, width: screenWidth } = useResponsive();
  const carouselRotation = useSharedValue(0);
  const [isCarouselActive, setIsCarouselActive] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const expandedScale = useSharedValue(0);
  const expandedOpacity = useSharedValue(0);
  
  // Chuẩn bị danh sách ảnh từ prop hoặc các keyword mặc định
  const cards = images || keywords.map(
    keyword => `https://picsum.photos/400/600?${keyword}`
  );
  
  const totalCards = cards.length;

  // Xử lý sự kiện kéo (pan gesture)
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = carouselRotation.value;
    },
    onActive: (event, context: any) => {
      if (isCarouselActive) {
        // Sử dụng dấu cộng để carousel di chuyển cùng chiều với vuốt
        carouselRotation.value = context.startX + event.translationX * 0.2;
      }
    },
    onEnd: (event) => {
      if (isCarouselActive && Math.abs(event.velocityX) > 5) {
        // Sử dụng cùng dấu với translationX để giữ nhất quán hướng di chuyển
        const endVelocity = event.velocityX * 0.05;
        
        // Xác định vị trí card gần nhất để snap đến
        const cardAngle = 360 / totalCards;
        const targetRotation = carouselRotation.value + endVelocity;
        
        // Tính toán card gần nhất để snap đến
        const targetCard = Math.round(targetRotation / cardAngle);
        const snapTo = targetCard * cardAngle;
        
        // Animation để snap đến card gần nhất
        carouselRotation.value = withSpring(snapTo, {
          velocity: endVelocity,
          damping: 20,
          stiffness: 100,
        });
      } else {
        // Nếu không có đủ vận tốc, snap đến card gần nhất
        const cardAngle = 360 / totalCards;
        const targetCard = Math.round(carouselRotation.value / cardAngle);
        const snapTo = targetCard * cardAngle;
        
        carouselRotation.value = withSpring(snapTo, {
          damping: 20,
          stiffness: 100,
        });
      }
    },
  });

  // Xử lý khi nhấn vào card
  const handleCardPress = (uri: string, index: number) => {
    // Xoay carousel để card được chọn ở vị trí trung tâm
    const cardAngle = 360 / totalCards;
    const targetRotation = index * cardAngle;
    
    // Đầu tiên xoay carousel để card được chọn ở trung tâm
    carouselRotation.value = withTiming(targetRotation, {
      duration: 300,
    }, () => {
      // Sau đó mở rộng ảnh
      runOnJS(setActiveImage)(uri);
      runOnJS(setActiveImageIndex)(index);
      runOnJS(setIsCarouselActive)(false);
    });
    
    expandedScale.value = withTiming(1, { duration: 300 });
    expandedOpacity.value = withTiming(1, { duration: 300 });
  };

  // Animated style cho overlay khi mở ảnh
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: expandedOpacity.value,
    };
  });

  // Animated style cho ảnh mở rộng
  const expandedImageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: expandedScale.value }] as any,
    };
  });

  // Xử lý khi đóng ảnh mở rộng
  const handleCloseExpandedImage = () => {
    expandedScale.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setActiveImage)(null);
      runOnJS(setActiveImageIndex)(null);
      runOnJS(setIsCarouselActive)(true);
    });
    expandedOpacity.value = withTiming(0, { duration: 300 });
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Carousel */}
      <PanGestureHandler
        onGestureEvent={panGestureHandler}
        enabled={isCarouselActive}
      >
        <Animated.View style={styles.carouselContainer}>
          {cards.map((uri, index) => (
            <Card
              key={`${uri}-${index}`}
              uri={uri}
              index={index}
              activeIndex={carouselRotation}
              totalCards={totalCards}
              onPress={handleCardPress}
            />
          ))}
        </Animated.View>
      </PanGestureHandler>

      {/* Expanded Image Overlay */}
      {activeImage && (
        <Animated.View style={[styles.expandedOverlay, overlayAnimatedStyle]}>
          <TouchableOpacity
            style={styles.expandedOverlayTouchable}
            activeOpacity={1}
            onPress={handleCloseExpandedImage}
          >
            <BlurView intensity={20} style={styles.blurView}>
              <Animated.Image
                source={{ uri: activeImage }}
                style={[styles.expandedImage, expandedImageAnimatedStyle]}
                resizeMode="contain"
              />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 500,
    backgroundColor: '#222',
  },
  carouselContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: 200,
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  expandedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  expandedOverlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImage: {
    width: '80%',
    height: '80%',
    borderRadius: 12,
  },
});

export default Carousel3D; 