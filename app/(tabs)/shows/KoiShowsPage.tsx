import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");

const KoiShowsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const tabWidth = screenWidth / 2;
  const translateX = useSharedValue(0);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    translateX.value = withSpring(index * tabWidth, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  const HeaderSection = () => (
    <View style={[styles.headerContainer, { backgroundColor: "white" }]}>
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.homeContainer}>
          <Text style={styles.homeText}>Home</Text>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7cU1P3atcswnot5/frame.png",
            }}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.centerSection}>
        <Text style={styles.title}>Koi Shows</Text>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7cU1P3atcswnot5/group-2.png",
            }}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const TabsSection = () => (
    <View style={styles.tabsContainer}>
      <View style={styles.tabs}>
        {["Upcoming Shows", "Past"].map((label, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => handleTabChange(index)}>
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.activeTabText,
              ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <View style={styles.bottomBorder} />
    </View>
  );

  const ShowCardItem = ({
    title = "Tokyo Koi Show",
    date = "March 12, 2025",
    location = "Tokyo, Japan",
    imageUrl = "https://images.unsplash.com/photo-1466354424719-343280fe118b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    onPress = () => {},
  }: {
    title?: string;
    date?: string;
    location?: string;
    imageUrl?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.cardTouchable}
      onPress={onPress}
      activeOpacity={0.8}>
      <View style={styles.cardContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardInfo}>Date: {date}</Text>
          <Text style={styles.cardInfo}>Location: {location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleShowPress = () => {
    router.push("/(tabs)/shows/KoiShowInformation");
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.container}>
        <HeaderSection />
        <TabsSection />
        <View style={styles.showCardsContainer}>
          <ShowCardItem onPress={handleShowPress} />
          <ShowCardItem onPress={handleShowPress} />
          <ShowCardItem onPress={handleShowPress} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    minWidth: 320,
    height: 86,
    width: "100%",
  },
  leftSection: {
    flex: 1,
  },
  homeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
    marginRight: 8,
  },
  searchIcon: {
    width: 13,
    height: 13,
  },
  centerSection: {
    flex: 2,
    alignItems: "center",
  },
  title: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  profileIcon: {
    width: 40,
    height: 40,
  },
  moreShowsText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "blue",
    marginTop: 5,
  },
  tabsContainer: {
    minWidth: 375,
    height: 38,
    backgroundColor: "transparent",
    width: "100%",
    position: "relative",
  },
  tabs: {
    flexDirection: "row",
    height: 36,
    width: "100%",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingHorizontal: 10,
  },
  tabText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    opacity: 0.5,
  },
  activeTabText: {
    opacity: 1,
  },
  indicator: {
    height: 2,
    backgroundColor: "#000000",
    position: "absolute",
    bottom: 0,
    left: 0,
    borderRadius: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  bottomBorder: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  activeTab: {},
  showCardsContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
  },
  cardTouchable: {
    width: "90%",
    marginVertical: 10,
  },
  cardContainer: {
    width: "100%",
    height: 196,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 120,
  },
  cardContent: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 4,
    fontFamily: "Roboto",
  },
  cardInfo: {
    fontSize: 14,
    fontWeight: "400",
    color: "#475569",
    marginVertical: 2,
    fontFamily: "Roboto",
  },
});

export default KoiShowsPage;
