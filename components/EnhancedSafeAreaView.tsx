import React from 'react';
import { StyleSheet, View, Platform, ViewStyle } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

interface EnhancedSafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
  mode?: 'padding' | 'margin';
  backgroundColor?: string;
}

/**
 * Enhanced SafeAreaView component that properly handles Android cutouts and notches
 * 
 * @param children - React components to render inside the safe area
 * @param style - Additional styles to apply to the safe area
 * @param edges - Which edges to apply safe area insets to (default: all edges)
 * @param mode - Whether to apply insets as padding or margin (default: padding)
 * @param backgroundColor - Background color of the safe area (default: white)
 */
const EnhancedSafeAreaView: React.FC<EnhancedSafeAreaViewProps> = ({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
  mode = 'padding',
  backgroundColor = '#FFFFFF',
}) => {
  const insets = useSafeAreaInsets();
  
  // On Android, we need to handle cutouts and notches differently
  if (Platform.OS === 'android') {
    return (
      <SafeAreaView 
        style={[
          styles.container, 
          { backgroundColor },
          style
        ]} 
        edges={edges}
        mode={mode}
      >
        {children}
      </SafeAreaView>
    );
  }
  
  // For iOS and other platforms, use the standard SafeAreaView
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor },
        style
      ]} 
      edges={edges}
      mode={mode}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default EnhancedSafeAreaView;
