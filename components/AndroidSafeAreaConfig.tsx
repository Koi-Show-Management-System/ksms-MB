import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Component to configure Android-specific settings for SafeAreaView
 * This component should be included in your app's root layout
 */
const AndroidSafeAreaConfig: React.FC = () => {
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Set the status bar to translucent to enable edge-to-edge display
      StatusBar.setTranslucent(true);
      
      // Set the status bar background color based on theme
      StatusBar.setBackgroundColor('transparent');
      
      // Set the status bar text color based on theme
      StatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content');
    }
  }, [colorScheme]);

  return null;
};

export default AndroidSafeAreaConfig;
