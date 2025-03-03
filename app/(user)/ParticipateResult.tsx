// ParticipateResult.tsx
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Fish Details Card ---
interface FishDetails {
  name: string;
  breed: string;
  size: string;
  category: string;
  awarded: boolean;
  awardTitle?: string; // Optional, as it's only present when awarded
  ranking: string;
  image: string;
}

interface FishDetailsCardProps {
  fishDetails: FishDetails;
}

const FishDetailsCard: React.FC<FishDetailsCardProps> = ({ fishDetails }) => {
  return (
    <View style={styles.cardContainer}>
      <Image source={{ uri: fishDetails.image }} style={styles.fishImage} />
      <View style={styles.detailsContainer}>
        <Text style={styles.fishName}>Fish Name: {fishDetails.name}</Text>
        <Text style={styles.detailText}>Breed: {fishDetails.breed}</Text>
        <Text style={styles.detailText}>Size: {fishDetails.size}</Text>
        <Text style={styles.detailText}>
          Competition Category: {fishDetails.category}
        </Text>

        <View style={styles.awardContainer}>
          <Image
            source={{
              uri: fishDetails.awarded
                ? "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png"
                : "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame-2.png",
            }}
            style={styles.awardIcon}
          />
          <Text style={styles.detailText}>
            {fishDetails.awarded
              ? `Awarded: ${fishDetails.awardTitle}`
              : "Not Awarded"}
          </Text>
        </View>

        <Text style={styles.detailText}>Ranking: {fishDetails.ranking}</Text>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() =>
            router.push({
              pathname: "/(user)/FishStatus",
              params: {
                fishName: fishDetails.name,
                fishImage: fishDetails.image,
                breed: fishDetails.breed,
                size: fishDetails.size,
                category: fishDetails.category,
                status: fishDetails.awarded ? "Awarded" : "Not Awarded",
                prize: fishDetails.awarded ? fishDetails.awardTitle : undefined,
                award: fishDetails.awarded ? fishDetails.awardTitle : undefined,
                score: 75, // Add default score or pass from your data
                coloration: 25, // Add default values or pass from your data
                shape: 20,
                pattern: 15,
                fishSize: 15,
                comments: ["Beautiful coloration, unique pattern."],
              },
            })
          }>
          <Text style={styles.shareButtonText}>View Detail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
// --- Competition Details ---
//(Assuming you will add details here in the future, I'll create a simple placeholder)

const CompetitionDetails: React.FC = () => {
  return (
    <View style={styles.competitionDetailsContainer}>
      <Text style={styles.competitionDetailsTitle}>Competition Details</Text>
      {/* Add your competition details content here */}
      <Text>Date: November 10, 2024</Text>
      <Text>Location: Grand Convention Center</Text>
      <Text>Total Participants: 200</Text>
    </View>
  );
};

// --- Main Component ---
const ParticipateResult: React.FC = () => {
  const fishData: FishDetails[] = [
    {
      name: "Sakura",
      breed: "Kohaku",
      size: "45 cm",
      category: "Kohaku Tosai",
      awarded: true,
      awardTitle: "Best in show",
      ranking: "1/192",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-4.png",
    },
    {
      name: "Akira",
      breed: "Sanke",
      size: "40 cm",
      category: "Sanke Nisai",
      awarded: false,
      ranking: "84/160",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-5.png",
    },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            /* Navigate to Home */
          }}>
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>

        <View style={styles.headerRightSection}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              /* Implement Search */
            }}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame-3.png",
              }}
              style={styles.headerIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              /* Navigate to Profile */
            }}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-12.png",
              }}
              style={styles.headerProfileIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <CompetitionDetails />
        <View style={styles.fishDetailsContainer}>
          {fishData.map((fish, index) => (
            <FishDetailsCard key={index} fishDetails={fish} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerNavItem}
          onPress={() => {
            /* Navigate to some screen */
          }}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame-3.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerNavItem}
          onPress={() => {
            /* Navigate to some screen */
          }}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame-5.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerNavItem, styles.joinButton]}
          onPress={() => {
            /* Navigate to join other competition */
          }}>
          <Text style={styles.joinButtonText}>Join Other Competitions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Header Styles
  header: {
    width: "100%",
    height: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent", // Or set your desired background
    marginTop: 20, // Add top margin
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  headerRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconButton: {
    padding: 4,
  },
  headerIcon: {
    width: 28, // Increased size
    height: 28,
  },
  headerProfileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // ScrollView
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center", // Center content horizontally
    paddingBottom: 20, // Padding at the bottom
  },
  // Competition Details Styles
  competitionDetailsContainer: {
    width: "90%", // Responsive width
    padding: 16,
    marginVertical: 10, // Space above and below
    backgroundColor: "#f0f0f0", // Light background
    borderRadius: 8,
    alignItems: "center",
  },
  competitionDetailsTitle: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 10,
  },

  // Fish Details Card Styles
  fishDetailsContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
  },
  cardContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fishImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  detailsContainer: {
    padding: 16,
  },
  fishName: {
    fontFamily: "Roboto",
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  detailText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#000",
    marginBottom: 4,
  },
  awardContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  awardIcon: {
    width: 20, // Increased size
    height: 20,
    marginRight: 8,
  },
  shareButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8, // Increased border radius
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 16,
  },
  shareButtonText: {
    color: "#FEFEFE",
    fontFamily: "Roboto",
    fontSize: 16, // Increased font size
    fontWeight: "700",
  },

  // Footer Styles
  footer: {
    width: "100%",
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "inherit", // Or set your desired background
    paddingHorizontal: 20,
    borderTopWidth: 1, // Consistent border
    borderTopColor: "#E0E0E0",
  },
  footerNavItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8, // Added padding
  },
  footerIcon: {
    width: 28, // Increased size
    height: 28,
    resizeMode: "contain",
  },
  joinButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: "#FEFEFE",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
});

export default ParticipateResult;
