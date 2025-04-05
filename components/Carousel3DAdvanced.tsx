import React, { memo, useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withDelay,
  runOnJS,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Hook tùy chỉnh để kiểm tra kích thước màn hình
const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  return {
    isSmallScreen: width < 640,
    width,
    height
  };
};

// Interface cho Card Item
interface CardItem {
  uri: string;
  title?: string;
  description?: string;
}

type CardProps = {
  item: CardItem;
  index: number;
  activeIndex: Animated.SharedValue<number>;
  totalCards: number;
  onPress: (item: CardItem, index: number) => void;
  autoPlayEnabled: boolean;
};

// Card Component
const Card = memo(({
  item,
  index,
  activeIndex,
  totalCards,
  onPress,
  autoPlayEnabled
}: CardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  // Animation when card appears
  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    scale.value = withDelay(index * 100, withSpring(1, {
      damping: 20,
      stiffness: 90
    }));
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    // Tính toán vị trí của card dựa trên activeIndex
    const rotation = activeIndex.value;
    const cardRotation = (index * 360) / totalCards;
    
    // Tính rotateY cho mỗi card - đảo ngược để khớp với hướng vuốt
    const rotateY = `${rotation - cardRotation}deg`;
    
    // Tính toán mức độ hiển thị của card dựa trên vị trí tương đối
    const factor = Math.abs(Math.cos(((rotation - cardRotation) * Math.PI) / 180));
    
    // Tính toán translateX dựa trên vị trí tương đối với card trung tâm
    const translateX = 160 * Math.sin(((rotation - cardRotation) * Math.PI) / 180);
    
    // Hiệu ứng nổi bật cho card ở vị trí trung tâm
    const isInFrontView = factor > 0.85;
    const finalScale = isInFrontView ? 
                      (0.7 + 0.3 * factor) * 1.1 : // Scale lớn hơn cho card trung tâm
                      (0.7 + 0.3 * factor);
    
    return {
      opacity: opacity.value * (0.6 + 0.4 * factor), // Kết hợp opacity ban đầu với hiệu ứng mờ theo góc
      transform: [
        { perspective: 1000 },
        { translateX },
        { rotateY },
        { scale: finalScale },
      ] as any,
      zIndex: Math.round(factor * 100), // Card trung tâm có zIndex cao nhất
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }] as any,
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
        onPress={() => onPress(item, index)}
        style={styles.cardTouchable}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        
        <Animated.Image
          source={{ uri: item.uri }}
          style={[styles.cardImage, imageStyle]}
          resizeMode="cover"
          onLoad={() => setIsLoading(false)}
        />
        
        {item.title && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.cardInfo}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </LinearGradient>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

type Carousel3DAdvancedProps = {
  items?: CardItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  onCardPress?: (item: CardItem, index: number) => void;
  containerStyle?: object;
  backgroundColor?: string;
};

// Default images with titles and descriptions
const defaultItems: CardItem[] = [
  { 
    uri: 'https://picsum.photos/400/600?city', 
    title: 'Thành phố', 
    description: 'Khung cảnh đô thị hiện đại với những tòa nhà cao tầng' 
  },
  { 
    uri: 'https://picsum.photos/400/600?night', 
    title: 'Đêm khuya', 
    description: 'Bầu trời đêm đầy sao và ánh đèn thành phố' 
  },
  { 
    uri: 'https://picsum.photos/400/600?nature', 
    title: 'Thiên nhiên', 
    description: 'Vẻ đẹp hoang sơ của thiên nhiên' 
  },
  { 
    uri: 'https://picsum.photos/400/600?beach', 
    title: 'Bãi biển', 
    description: 'Bờ biển cát trắng và nước biển xanh trong' 
  },
  { 
    uri: 'https://picsum.photos/400/600?mountain', 
    title: 'Núi non', 
    description: 'Những ngọn núi hùng vĩ bao phủ bởi mây' 
  },
  { 
    uri: 'https://picsum.photos/400/600?forest', 
    title: 'Rừng', 
    description: 'Khu rừng xanh rì với những tán cây cao' 
  },
  { 
    uri: 'https://picsum.photos/400/600?sunset', 
    title: 'Hoàng hôn', 
    description: 'Cảnh hoàng hôn tuyệt đẹp với những áng mây rực rỡ' 
  },
  { 
    uri: 'https://picsum.photos/400/600?architecture', 
    title: 'Kiến trúc', 
    description: 'Những công trình kiến trúc độc đáo' 
  },
];

const Carousel3DAdvanced = ({
  items = defaultItems,
  autoPlay = true,
  autoPlayInterval = 3000,
  showControls = true,
  onCardPress,
  containerStyle,
  backgroundColor = '#121212'
}: Carousel3DAdvancedProps) => {
  const { isSmallScreen, width: screenWidth } = useResponsive();
  const carouselRotation = useSharedValue(0);
  const [isCarouselActive, setIsCarouselActive] = useState(true);
  const [activeItem, setActiveItem] = useState<CardItem | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const expandedScale = useSharedValue(0);
  const expandedOpacity = useSharedValue(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  
  const totalCards = items.length;

  // Xử lý auto play - đảm bảo chiều di chuyển nhất quán
  useEffect(() => {
    if (autoPlayEnabled && isCarouselActive) {
      autoPlayRef.current = setInterval(() => {
        // Tính góc quay cho card tiếp theo
        const cardAngle = 360 / totalCards;
        const currentCard = Math.round(carouselRotation.value / cardAngle);
        // Đảm bảo di chuyển cùng chiều với vuốt tự nhiên
        const nextCard = (currentCard + 1) % totalCards;
        const nextRotation = nextCard * cardAngle;
        
        carouselRotation.value = withSpring(
          nextRotation, 
          {
            damping: 20,
            stiffness: 90,
          }
        );
      }, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlayEnabled, isCarouselActive, autoPlayInterval, totalCards]);
  
  // Xử lý sự kiện kéo (pan gesture)
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      // Dừng autoplay khi người dùng tương tác
      if (autoPlayEnabled) {
        runOnJS(setAutoPlayEnabled)(false);
      }
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
  const handleCardPress = (item: CardItem, index: number) => {
    if (onCardPress) {
      onCardPress(item, index);
    } else {
      // Xoay carousel để card được chọn ở vị trí trung tâm
      const cardAngle = 360 / totalCards;
      const targetRotation = index * cardAngle;
      
      // Đầu tiên xoay carousel để card được chọn ở trung tâm
      carouselRotation.value = withTiming(targetRotation, {
        duration: 300,
      }, () => {
        // Sau đó mở rộng ảnh
        runOnJS(setActiveItem)(item);
        runOnJS(setActiveItemIndex)(index);
        runOnJS(setIsCarouselActive)(false);
        
        // Dừng autoplay
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      });
      
      expandedScale.value = withTiming(1, { duration: 400 });
      expandedOpacity.value = withTiming(1, { duration: 400 });
    }
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
      runOnJS(setActiveItem)(null);
      runOnJS(setActiveItemIndex)(null);
      runOnJS(setIsCarouselActive)(true);
      
      // Khôi phục autoplay nếu được bật trước đó
      if (autoPlay) {
        runOnJS(setAutoPlayEnabled)(true);
      }
    });
    expandedOpacity.value = withTiming(0, { duration: 300 });
  };

  // Di chuyển đến card trước - đảm bảo hướng di chuyển nhất quán với vuốt
  const goToPrev = useCallback(() => {
    const cardAngle = 360 / totalCards;
    const currentCard = Math.round(carouselRotation.value / cardAngle);
    // Card trước (giảm góc quay)
    const prevCard = (currentCard - 1 + totalCards) % totalCards;
    const prevRotation = prevCard * cardAngle;
    
    carouselRotation.value = withSpring(
      prevRotation,
      {
        damping: 20,
        stiffness: 90,
      }
    );
  }, [totalCards]);

  // Di chuyển đến card tiếp theo - đảm bảo hướng di chuyển nhất quán với vuốt
  const goToNext = useCallback(() => {
    const cardAngle = 360 / totalCards;
    const currentCard = Math.round(carouselRotation.value / cardAngle);
    // Card tiếp theo (tăng góc quay)
    const nextCard = (currentCard + 1) % totalCards;
    const nextRotation = nextCard * cardAngle;
    
    carouselRotation.value = withSpring(
      nextRotation,
      {
        damping: 20,
        stiffness: 90,
      }
    );
  }, [totalCards]);

  // Bật/tắt autoplay
  const toggleAutoPlay = useCallback(() => {
    setAutoPlayEnabled(prev => !prev);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor }, containerStyle]}>
      <StatusBar hidden />
      
      {/* Carousel */}
      <PanGestureHandler
        onGestureEvent={panGestureHandler}
        enabled={isCarouselActive}
      >
        <Animated.View style={styles.carouselContainer}>
          {items.map((item, index) => (
            <Card
              key={`${item.uri}-${index}`}
              item={item}
              index={index}
              activeIndex={carouselRotation}
              totalCards={totalCards}
              onPress={handleCardPress}
              autoPlayEnabled={autoPlayEnabled}
            />
          ))}
        </Animated.View>
      </PanGestureHandler>

      {/* Controls */}
      {showControls && isCarouselActive && (
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={goToPrev}
          >
            <Ionicons name="chevron-back" size={30} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              styles.playButton,
              { backgroundColor: autoPlayEnabled ? '#f06292' : '#555' }
            ]} 
            onPress={toggleAutoPlay}
          >
            <Ionicons 
              name={autoPlayEnabled ? "pause" : "play"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={goToNext}
          >
            <Ionicons name="chevron-forward" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Expanded Image Overlay */}
      {activeItem && (
        <Animated.View style={[styles.expandedOverlay, overlayAnimatedStyle]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseExpandedImage}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.expandedOverlayTouchable}
            activeOpacity={1}
            onPress={handleCloseExpandedImage}
          >
            <BlurView intensity={20} style={styles.blurView}>
              <Animated.Image
                source={{ uri: activeItem.uri }}
                style={[styles.expandedImage, expandedImageAnimatedStyle]}
                resizeMode="contain"
              />
              
              {activeItem.title && (
                <View style={styles.expandedImageInfo}>
                  <Text style={styles.expandedImageTitle}>{activeItem.title}</Text>
                  {activeItem.description && (
                    <Text style={styles.expandedImageDescription}>
                      {activeItem.description}
                    </Text>
                  )}
                </View>
              )}
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
    backgroundColor: '#121212',
  },
  carouselContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: 220,
    height: 350,
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
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDescription: {
    color: '#ddd',
    fontSize: 12,
  },
  expandedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 110,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: '70%',
    borderRadius: 12,
  },
  expandedImageInfo: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    width: '80%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
  expandedImageTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  expandedImageDescription: {
    color: '#ddd',
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  playButton: {
    backgroundColor: '#f06292',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
    borderRadius: 12,
  },
});

export default Carousel3DAdvanced; 