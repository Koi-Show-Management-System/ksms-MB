import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';

const Footer: React.FC = () => {
  const handleHomePress = () => {
    // Handle home navigation
    console.log('Home pressed');
  };

  const handleNotificationPress = () => {
    // Handle notification navigation
    console.log('Notifications pressed');
  };

  const handleGalleryPress = () => {
    // Handle gallery navigation
    console.log('Gallery pressed');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.iconContainer} 
        onPress={handleHomePress}
      >
        <Image 
          source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group.png' }}
          style={styles.icon}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconContainer}
        onPress={handleNotificationPress}
      >
        <Image 
          source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-2.png' }}
          style={styles.icon}
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconContainer}
        onPress={handleGalleryPress}
      >
        <Image 
          source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-3.png' }}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 70,
    minWidth: 375,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  iconContainer: {
    padding: 10,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  }
});

export default Footer;

