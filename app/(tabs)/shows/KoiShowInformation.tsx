// KoiShowInformation.tsx

import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Header } from "react-native/Libraries/NewAppScreen";

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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection("eventDetails")}>
        <Text style={styles.sectionTitle}>Event Details</Text>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-6.png",
          }}
          style={[
            styles.arrow,
            {
              transform: [
                { rotate: expandedSections.eventDetails ? "180deg" : "0deg" },
              ],
            },
          ]}
        />
      </TouchableOpacity>

      {expandedSections.eventDetails && (
        <View style={styles.sectionContent}>
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
        </View>
      )}
    </View>
  );

  const renderAwards = () => (
    <View style={styles.awardsContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection("awards")}>
        <Text style={styles.sectionTitle}>Awards</Text>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-10.png",
          }}
          style={[
            styles.arrow,
            {
              transform: [
                { rotate: expandedSections.awards ? "180deg" : "0deg" },
              ],
            },
          ]}
        />
      </TouchableOpacity>

      {expandedSections.awards && (
        <View style={styles.sectionContent}>
          <Text style={styles.awardText}>
            Awards will be announced during virtual award ceremony!
          </Text>
          <Text style={styles.awardText}>
            No Koi can win more than one award, except for special awards.
          </Text>
          <Text style={styles.specialAwardTitle}>Special Awards & Prizes:</Text>
          <Text style={styles.awardText}>• Supreme Kokugyo Prize</Text>
          <Text style={styles.awardText}>• Judge's Award</Text>
        </View>
      )}
    </View>
  );

  const renderRules = () => (
    <View style={styles.rulesContainer}>
      <Text style={styles.mainHeader}>Official Koi Show Rules</Text>

      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection("rules")}>
        <Text style={styles.sectionTitle}>Rules & Regulations</Text>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-7.png",
          }}
          style={[
            styles.arrow,
            {
              transform: [
                { rotate: expandedSections.rules ? "180deg" : "0deg" },
              ],
            },
          ]}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection("enteringKoi")}>
        <Text style={styles.sectionTitle}>Entering Koi In Show</Text>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z5uP-4IayXWIU-OE/frame-8.png",
          }}
          style={[
            styles.arrow,
            {
              transform: [
                { rotate: expandedSections.enteringKoi ? "180deg" : "0deg" },
              ],
            },
          ]}
        />
      </TouchableOpacity>

      {expandedSections.enteringKoi && (
        <View style={styles.sectionContent}>
          <Text style={styles.ruleText}>
            Please review and submit the necessary information with the form
            online:
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
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.buttonText}>Register for events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.buttonText}>Purchase tickets</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navbar}>
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
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Home"
        description="Register for events, purchase tickets, and view results."
      />
      <ScrollView style={styles.scrollView}>
        {renderHeader()}
        {renderAwards()}
        {renderRules()}
      </ScrollView>
      {renderFooter()}
    </View>
  );
};

// Thêm vào phần styles hiện có:

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
    fontFamily: "Lexend Deca",
  },
  arrow: {
    width: 14,
    height: 14,
  },
  sectionContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: "#858585",
    marginBottom: 8,
    fontFamily: "Lexend Deca",
  },
  dateText: {
    fontSize: 14,
    color: "#858585",
    marginVertical: 8,
    fontFamily: "Lexend Deca",
  },
  locationText: {
    fontSize: 14,
    color: "#858585",
    fontFamily: "Lexend Deca",
  },
  awardsContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  awardText: {
    fontSize: 14,
    color: "#858585",
    marginBottom: 8,
    fontFamily: "Lexend Deca",
  },
  specialAwardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#858585",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Lexend Deca",
  },
  rulesContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  mainHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 16,
    fontFamily: "Lexend Deca",
  },
  ruleText: {
    fontSize: 14,
    color: "#858585",
    marginBottom: 16,
    fontFamily: "Lexend Deca",
  },
  bulletPoint: {
    fontSize: 14,
    color: "#858585",
    marginLeft: 8,
    marginBottom: 8,
    fontFamily: "Lexend Deca",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
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
  // Additional utility styles
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
  px16: {
    paddingHorizontal: 16,
  },
  py16: {
    paddingVertical: 16,
  },
});

export default KoiShowInformation;
