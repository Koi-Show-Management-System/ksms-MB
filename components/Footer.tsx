import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface FooterProps {
  onHomePress?: () => void;
  onBellPress?: () => void;
  onCameraPress?: () => void;
}

const Footer: React.FC<FooterProps> = ({
  onHomePress = () => {},
  onBellPress = () => {},
  onCameraPress = () => {},
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.navigationContainer}>
        <TouchableOpacity onPress={onHomePress} style={styles.iconContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/assets/Z4FRJgIBBLnlud6e",
            }}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onBellPress} style={styles.iconContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/assets/Z4FRJgIBBLnlud6f",
            }}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCameraPress} style={styles.iconContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/assets/Z4FRJgIBBLnlud6g",
            }}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 70,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    padding: 10,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});

export default Footer;
