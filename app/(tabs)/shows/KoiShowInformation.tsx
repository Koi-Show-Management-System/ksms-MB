// KoiShowInformation.tsx

import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
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
import Header from "../../../components/Header"; // Sửa import này

interface EventDetails {
  description: string[];
  date: string;
  location: string[];
}

interface KoiShowInformationProps {
  title?: string;
  images?: string[];
  eventDetails?: EventDetails;
}

const KoiShowInformation: React.FC<KoiShowInformationProps> = ({
  title = "Koi Show Spring 2025",
  images = [
    "https://images.unsplash.com/photo-1552118830-98feacab238f?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1660654581211-b365ba90464a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1713399247260-3b9c33e244ec?q=80&w=2068&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1663962975595-c99565fe3ccf?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ],
  eventDetails = {
    description: [
      "Join us for the annual Koi Show, a spectacular event showcasing the most exquisite koi fish.",
      "Participate in competitions, attend workshops, and enjoy a vibrant community of enthusiasts.",
    ],
    date: "April 15-17, 2025, 9 AM - 6 PM",
    location: ["Sakura Gardens, 123 Blossom Lane, Tokyo"],
  },
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    eventDetails: false,
    awards: false,
    rules: false,
    enteringKoi: false,
  });

  // Add animation values for each section
  const eventDetailsHeight = useSharedValue(0);
  const awardsHeight = useSharedValue(0);
  const rulesHeight = useSharedValue(0);
  const enteringKoiHeight = useSharedValue(0);

  const springConfig = {
    damping: 18, // Slightly adjusted for a smoother feel
    stiffness: 120, // Slightly adjusted
    mass: 0.6, // Slightly adjusted
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newValue = !prev[section];
      // Fine-tuned heights for your content.  *IMPORTANT*
      const heights = {
        eventDetails: 220, // Reduced a bit
        awards: 200, // Reduced a bit
        rules: 190, // Reduced a bit
        enteringKoi: 190, // Reduced a bit
      };

      const targetHeight = heights[section as keyof typeof heights];

      switch (section) {
        case "eventDetails":
          eventDetailsHeight.value = withSpring(
            newValue ? targetHeight : 0,
            springConfig
          );
          break;
        case "awards":
          awardsHeight.value = withSpring(
            newValue ? targetHeight : 0,
            springConfig
          );
          break;
        case "rules":
          rulesHeight.value = withSpring(
            newValue ? targetHeight : 0,
            springConfig
          );
          break;
        case "enteringKoi":
          enteringKoiHeight.value = withSpring(
            newValue ? targetHeight : 0,
            springConfig
          );
          break;
      }
      return { ...prev, [section]: newValue };
    });
  };

  const createSectionStyle = useCallback(
    (heightValue: Animated.SharedValue<number>) =>
      useAnimatedStyle(() => ({
        height: heightValue.value,
        opacity: heightValue.value > 0 ? 1 : 0,
        overflow: "hidden",
        paddingHorizontal: 16,
        paddingBottom: heightValue.value > 0 ? 16 : 0,
        backgroundColor: "#E5E5E5", // Updated background color
      })),
    []
  );

  const eventDetailsStyle = createSectionStyle(eventDetailsHeight);
  const awardsStyle = createSectionStyle(awardsHeight);
  const rulesStyle = createSectionStyle(rulesHeight);
  const enteringKoiStyle = createSectionStyle(enteringKoiHeight);

  const AnimatedArrow = ({ isExpanded }: { isExpanded: boolean }) => {
    const rotateAnimation = useSharedValue(0);

    useEffect(() => {
      rotateAnimation.value = withSpring(isExpanded ? 90 : 0, springConfig);
    }, [isExpanded]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ rotate: `${rotateAnimation.value}deg` }],
      };
    });

    return (
      <Animated.Image
        source={{
          uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-6.png",
        }}
        style={[styles.arrow, animatedStyle]}
      />
    );
  };

  const renderEventDetails = () => (
    <Animated.View style={[styles.sectionContent, eventDetailsStyle]}>
      {eventDetails.description.map((text, index) => (
        <Text key={index} style={styles.descriptionText}>
          {text}
        </Text>
      ))}
      <Text style={styles.dateText}>Date & Time: {eventDetails.date}</Text>
      {eventDetails.location.map((text, index) => (
        <Text key={index} style={styles.locationText}>
          {text}
        </Text>
      ))}
    </Animated.View>
  );

  const renderAwardsContent = () => (
    <Animated.View style={[styles.sectionContent, awardsStyle]}>
      <Text style={styles.awardText}>
        Awards will be announced during virtual award ceremony!
      </Text>
      <Text style={styles.awardText}>
        No Koi can win more than one award, except for special awards.
      </Text>
      <Text style={styles.specialAwardTitle}>Special Awards & Prizes:</Text>
      <Text style={styles.awardText}>• Supreme Kokugyo Prize</Text>
      <Text style={styles.awardText}>• Judge's Award</Text>
    </Animated.View>
  );

  const renderRulesContent = () => (
    <Animated.View style={[styles.sectionContent, rulesStyle]}>
      <Text style={styles.ruleText}>
        Please review and submit the necessary information with the form online:
      </Text>
      <Text style={styles.bulletPoint}>
        • Koi Name - Does your koi have a name?
      </Text>
      <Text style={styles.bulletPoint}>
        • Koi Description - Write a description about this koi
      </Text>
      <Text style={styles.bulletPoint}>
        • Approximate Size and Size category
      </Text>
    </Animated.View>
  );

  const renderEnteringKoiContent = () => (
    <Animated.View style={[styles.sectionContent, enteringKoiStyle]}>
      <Text style={styles.ruleText}>
        Please review and submit the necessary information with the form online:
      </Text>
      <Text style={styles.bulletPoint}>
        • Koi Name - Does your koi have a name?
      </Text>
      <Text style={styles.bulletPoint}>
        • Koi Description - Write a description about this koi
      </Text>
      <Text style={styles.bulletPoint}>
        • Approximate Size and Size category
      </Text>
    </Animated.View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <Image
          source={{ uri: images[currentImageIndex] }}
          style={styles.carouselImage}
        />
        <View style={styles.carouselControls}>
          <TouchableOpacity
            onPress={() =>
              setCurrentImageIndex((prev) =>
                prev === 0 ? images.length - 1 : prev - 1
              )
            }
            style={styles.carouselButton}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame.png",
              }}
              style={styles.carouselButtonImage}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              setCurrentImageIndex((prev) => (prev + 1) % images.length)
            }
            style={styles.carouselButton}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-2.png",
              }}
              style={styles.carouselButtonImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title and Event Details */}
      <Text style={styles.title}>{title}</Text>

      <View style={[styles.sectionContainer, { backgroundColor: "#E5E5E5" }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("eventDetails")}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          <AnimatedArrow isExpanded={expandedSections.eventDetails} />
        </TouchableOpacity>
        {renderEventDetails()}
      </View>

      <View style={[styles.sectionContainer, { backgroundColor: "#E5E5E5" }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("awards")}>
          <Text style={styles.sectionTitle}>Awards</Text>
          <AnimatedArrow isExpanded={expandedSections.awards} />
        </TouchableOpacity>
        {renderAwardsContent()}
      </View>
    </View>
  );

  const renderRules = () => (
    <View style={styles.rulesContainer}>
      <Text style={styles.mainHeader}>Official Koi Show Rules</Text>

      <View
        style={[
          styles.sectionContainer,
          { backgroundColor: "rgba(245, 245, 245, 1)" },
        ]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("rules")}>
          <Text style={styles.sectionTitle}>Rules & Regulations</Text>
          <AnimatedArrow isExpanded={expandedSections.rules} />
        </TouchableOpacity>
        {expandedSections.rules && renderRulesContent()}
      </View>

      <View
        style={[
          styles.sectionContainer,
          { backgroundColor: "rgba(245, 245, 245, 1)" },
        ]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("enteringKoi")}>
          <Text style={styles.sectionTitle}>Entering Koi In Show</Text>
          <AnimatedArrow isExpanded={expandedSections.enteringKoi} />
        </TouchableOpacity>
        {expandedSections.enteringKoi && renderEnteringKoiContent()}
      </View>
    </View>
  );

  const renderNote = () => (
    <View style={styles.noteContainer}>
      <Text style={styles.noteText}>
        Please carefully read the competition rules before registering, such as
        requirements for photos/videos, participation conditions, etc.
      </Text>

      <TouchableOpacity
        style={styles.noteButton}
        // onPress={navigateToRegistration}
      >
        <Text style={styles.noteButtonText}>
          Read the full details of all rules and regulations
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.buttonText}>Register for events</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/(tabs)/shows/BuyTickets")}>
          <Text style={styles.buttonText}>Purchase tickets</Text>
        </TouchableOpacity>
      </View>

      {/* <View style={styles.navbar}>
        <TouchableOpacity>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-3.png",
            }}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-5.png",
            }}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-4.png",
            }}
            style={styles.navIcon}
          />
        </TouchableOpacity>
      </View> */}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Home" description="" />
      <ScrollView style={styles.scrollView}>
        {renderHeader()}
        {renderRules()}
        {renderNote()}
      </ScrollView>
      {renderFooter()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: "#fff",
    padding: 16,
  },
  carouselContainer: {
    height: 232,
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  carouselControls: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    top: "50%",
    transform: [{ translateY: -16 }],
  },
  carouselButton: {
    width: 32,
    height: 32,
    backgroundColor: "#E5E5E5",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselButtonImage: {
    width: 16,
    height: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
    marginVertical: 16,
    fontFamily: "Poppins",
  },
  sectionContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 24, // Consistent spacing between sections
    backgroundColor: "#E5E5E5", // Added background color
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#E5E5E5", // Updated background color
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600", // Slightly less bold than the main title
    color: "#030303",
    fontFamily: "Lexend Deca",
  },
  arrow: {
    width: 14,
    height: 14,
  },
  sectionContent: {
    backgroundColor: "#E5E5E5", // Consistent white background for content
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    marginVertical: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  awardText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  specialAwardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  rulesContainer: {
    borderRadius: 8,
    paddingHorizontal: 0, // Consistent with other sections
    marginHorizontal: 16,
    marginBottom: 16, //Consistent Spacing
  },
  mainHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 16,
    paddingHorizontal: 16, //Consistent Spacing
    fontFamily: "Lexend Deca",
  },
  ruleText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    marginBottom: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  noteContainer: {
    backgroundColor: "#E5E5E5",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
  },
  noteText: {
    fontSize: 14,
    color: "#FF4433",
    fontFamily: "Lexend Deca",
    lineHeight: 20,
    fontStyle: "italic",
  },
  noteButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FFA500",
  },
  noteButtonText: {
    color: "#FFA500",
    fontSize: 14,
    fontFamily: "Lexend Deca",
    fontWeight: "500",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: 16,
  },
  actionButton: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    width: "48%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Roboto",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 12,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mt16: {
    marginTop: 16,
  },
  mb16: {
    marginBottom: 16,
  },
  py16: {
    paddingVertical: 16,
  },
  animatedSection: {
    overflow: "hidden",
  },
});

export default KoiShowInformation;
