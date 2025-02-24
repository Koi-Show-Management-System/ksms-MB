import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface HeaderProps {
  onHomePress?: () => void;
  onSearchPress?: () => void;
  onProfilePress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onHomePress = () => {},
  onSearchPress = () => {},
  onProfilePress = () => {},
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onHomePress} style={styles.homeButton}>
        <Text style={styles.homeText}>Home</Text>
      </TouchableOpacity>
      
      <View style={styles.rightSection}>
        <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
          <Image 
            source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/frame-2.png' }}
            style={styles.icon}
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onProfilePress} style={styles.profileButton}>
          <Image 
            source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-2.png' }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minWidth: 320,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  homeButton: {
    padding: 8,
  },
  homeText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#030303',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default Header;

