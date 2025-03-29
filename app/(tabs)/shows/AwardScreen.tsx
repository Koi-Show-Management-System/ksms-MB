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
import { router } from "expo-router";
import Footer from "../../../components/Footer";

interface AwardCardProps {
  title: string;
  koiName: string;
  owner: string;
  image: string;
  onViewDetails?: () => void;
}

const AwardScreen: React.FC = () => {
  const windowWidth = Dimensions.get("window").width;
  const [selectedCategory, setSelectedCategory] = useState("Grand Champions");

  const majorAwards = {
    grandChampion: {
      title: "Grand Champion",
      koiName: "Shiro Utsuri",
      owner: "Hiroshi Tanaka",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-6.png",
    },
    matureChampion: {
      title: "Mature Champion",
      koiName: "Kohaku",
      owner: "Yuki Nakamura",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-9.png",
    },
  };

  const awardsByCategory = {
    "Grand Champions": [
      {
        title: "Grand Champion",
        koiName: "Shiro Utsuri",
        owner: "Hiroshi Tanaka",
        image:
          "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-15.png",
      },
    ],
    "Category Champions": [
      {
        title: "Mature Champion",
        koiName: "Kohaku",
        owner: "Yuki Nakamura",
        image:
          "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-18.png",
      },
    ],
    "Best in Sizes": [
      {
        title: "Jumbo Champion",
        koiName: "Big Pearl",
        owner: "Kenji Sato",
        image:
          "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-15.png",
      },
    ],
  };

  const AwardCard: React.FC<AwardCardProps> = ({
    title,
    koiName,
    owner,
    image,
    onViewDetails,
  }) => (
    <View style={styles.awardCard}>
      <Image source={{ uri: image }} style={styles.awardImage} />
      <Text style={styles.awardTitle}>{title}</Text>
      <Text style={styles.awardDetail}>Koi Name: {koiName}</Text>
      <Text style={styles.awardDetail}>Owner: {owner}</Text>
      <TouchableOpacity style={styles.viewButton} onPress={onViewDetails}>
        <Text style={styles.viewButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.push("/(tabs)/home/homepage")}>
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-2.png",
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>Koi Show Competition 2025</Text>
          <Text style={styles.title}>Winning Koi Results</Text>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-4.png",
            }}
            style={[
              styles.heroImage,
              { width: Math.min(windowWidth - 32, 300) },
            ]}
          />
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Congratulations to all winners of the 2024
            </Text>
            <Text style={styles.description}>
              International Koi Show & Competition!
            </Text>
            <Text style={styles.description}>
              Thank you to all participants and visitors.
            </Text>
          </View>
          <Text style={styles.details}>Event Date: October 12-14, 2024</Text>
          <Text style={styles.details}>
            Venue: Tokyo International Exhibition Center
          </Text>
          <Text style={styles.details}>Total Participants: 150 breeders</Text>
        </View>

        {/* Major Awards Section */}
        <Text style={styles.sectionTitle}>Major Awards</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.awardsContainer}>
          <AwardCard
            {...majorAwards.grandChampion}
            onViewDetails={() => console.log("Grand Champion details")}
          />
          <AwardCard
            {...majorAwards.matureChampion}
            onViewDetails={() => console.log("Mature Champion details")}
          />
        </ScrollView>

        {/* All Awards Section */}
        <View style={styles.allAwardsSection}>
          <Text style={styles.sectionTitle}>All Award-Winning Koi</Text>
          <View style={styles.categoriesHeader}>
            {Object.keys(awardsByCategory).map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategory,
                ]}>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category &&
                      styles.selectedCategoryText,
                  ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {awardsByCategory[
            selectedCategory as keyof typeof awardsByCategory
          ].map((winner, index) => (
            <View key={index} style={styles.listAwardCard}>
              <Text style={styles.cardTitle}>{winner.title}</Text>
              <View style={styles.cardContent}>
                <Image
                  source={{ uri: winner.image }}
                  style={styles.koiImageSmall}
                />
                <View style={styles.koiDetails}>
                  <Text style={styles.koiName}>Koi Name: {winner.koiName}</Text>
                  <Text style={styles.ownerName}>Owner: {winner.owner}</Text>
                </View>
                <TouchableOpacity style={styles.viewDetailsButton}>
                  <Text style={styles.buttonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Thêm Footer */}
      <Footer activeTab="shows" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Thêm padding để tránh bị footer che phủ
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  homeButton: {
    padding: 8,
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  heroSection: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#000000",
    marginBottom: 4,
  },
  heroImage: {
    height: 150,
    marginVertical: 24,
    resizeMode: "cover",
    borderRadius: 8,
  },
  descriptionContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#030303",
    lineHeight: 24,
  },
  details: {
    fontSize: 14,
    color: "#030303",
    marginVertical: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 24,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  awardsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16,
  },
  awardCard: {
    width: 280, // Fixed width for consistent card size
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  awardImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
    borderRadius: 8,
    marginBottom: 16,
  },
  awardTitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 8,
  },
  awardDetail: {
    fontSize: 14,
    color: "#030303",
    marginVertical: 2,
  },
  viewButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FEFEFE",
  },
  allAwardsSection: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryButton: {
    padding: 8,
    borderRadius: 4,
  },
  selectedCategory: {
    backgroundColor: "#007AFF",
  },
  categoryLabel: {
    fontSize: 14,
    color: "#030303",
  },
  selectedCategoryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listAwardCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  koiImageSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  koiDetails: {
    flex: 1,
    marginLeft: 16,
  },
  koiName: {
    fontSize: 14,
    color: "#030303",
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: "#030303",
  },
  viewDetailsButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FEFEFE",
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  footerIcon: {
    padding: 10,
  },
  footerIconImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});

export default AwardScreen;
