// KoiInformation.tsx
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Interfaces ---
interface Achievement {
  icon: string;
  title: string;
  category: string;
  year: number;
}

interface CompetitionEntry {
  year: number;
  showName: string;
  location: string;
  result: string;
}

interface KoiData {
  // Define the structure of your Koi data
  name: string;
  status: "Owned" | "Sold" | string; //  add other possible statuses
  breed: string;
  size: string;
  age: number;
  gender: "Male" | "Female" | string; //  add other genders if needed
  mainColors: string;
  purchaseDate: string;
  origin: string;
  idNumber: string;
  description: string;
  achievements: Achievement[];
  competitionHistory: CompetitionEntry[];
  images: string[];
  videos: string[]; // Assuming you'll store video URLs
}

// --- Main Component ---
const KoiInformation: React.FC = () => {
  // Sample data (Replace with data from API or navigation props)
  const koiData: KoiData = {
    name: "Sakura",
    status: "Owned",
    breed: "Kohaku",
    size: "45 cm",
    age: 3,
    gender: "Female",
    mainColors: "Red, White",
    purchaseDate: "12/08/2020",
    origin: "Nishikigoi Farm",
    idNumber: "123456789",
    description:
      "This koi fish stands out with its vivid red and white pattern, symbolizing strength and beauty.",
    achievements: [
      {
        icon: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame-2.png",
        title: "Grand Champion",
        category: "Kohaku",
        year: 2022,
      },
      // Add more achievements as needed
    ],
    competitionHistory: [
      {
        year: 2022,
        showName: "All Japan Koi Show",
        location: "Tokyo, Japan",
        result: "Grand Champion",
      },
      // Add more competition entries
    ],
    images: [
      "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/group-3.png",
      "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/group-4.png",
      "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/group-5.png",
      // Add more image URLs
    ],
    videos: [
      // Add video URLs here
    ],
  };
  const [selectedImage, setSelectedImage] = useState<string | null>(
    koiData.images[0]
  );

  const handleImagePress = (image: string) => {
    setSelectedImage(image);
  };
  const handleAddImageVideo = () => {
    // Placeholder for adding image/video.  Use a library like react-native-image-picker.
    Alert.alert("Add Image/Video", "Select an image or video to add.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => {
          // Implement image/video selection and update state.
          console.log("Add image/video");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            /* Navigate Back */
          }}
          style={styles.backButtonContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame.png",
            }}
            style={styles.backButtonIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Koi Fish Information</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Image
          source={{ uri: selectedImage || koiData.images[0] }}
          style={styles.koiFishImage}
        />

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>{koiData.name}</Text>
          <Text style={styles.statusText}>Status: {koiData.status}</Text>
          <Text style={styles.subSectionTitle}>Detailed Information</Text>
          <View style={styles.detailsGrid}>
            <Text style={styles.detailText}>Breed: {koiData.breed}</Text>
            <Text style={styles.detailText}>Size: {koiData.size}</Text>
            <Text style={styles.detailText}>Age: {koiData.age} years</Text>
            <Text style={styles.detailText}>Gender: {koiData.gender}</Text>
            <Text style={styles.detailText}>
              Main Colors: {koiData.mainColors}
            </Text>
            <Text style={styles.detailText}>
              Purchase Date: {koiData.purchaseDate}
            </Text>
            <Text style={styles.detailText}>Origin: {koiData.origin}</Text>
            <Text style={styles.detailText}>ID Number: {koiData.idNumber}</Text>
          </View>
          <Text style={styles.descriptionText}>{koiData.description}</Text>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={styles.subSectionTitle}>Achievements</Text>
          {koiData.achievements.map((achievement, index) => (
            <View key={index} style={styles.achievement}>
              <Image
                source={{ uri: achievement.icon }}
                style={styles.achievementIcon}
              />
              <View style={styles.achievementTextContainer}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementSubtext}>
                  {achievement.category} - {achievement.year}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.competitionSection}>
          <Text style={styles.subSectionTitle}>Competition History</Text>
          {koiData.competitionHistory.map((entry, index) => (
            <View key={index} style={styles.competitionEntry}>
              <Text style={styles.competitionTitle}>
                {entry.year} - {entry.showName}
              </Text>
              <Text style={styles.competitionSubtext}>{entry.location}</Text>
              <Text style={styles.competitionSubtext}>
                Result: {entry.result}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  /* Navigate to result details */
                }}>
                <Text style={styles.linkText}>View Result Details</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.gallerySection}>
          <Text style={styles.subSectionTitle}>Images & Videos</Text>
          <View style={styles.imageGrid}>
            {koiData.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleImagePress(image)}>
                <Image source={{ uri: image }} style={styles.galleryImage} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddImageVideo}>
            <Text style={styles.addButtonText}>Add Image/Video</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => {
            /* Navigate to Home */
          }}
          style={styles.footerButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame-4.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            /* Navigate to Profile */
          }}
          style={styles.footerButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame-5.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            /* Navigate to Gallery */
          }}
          style={styles.footerButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame-6.png",
            }}
            style={styles.footerIcon}
          />
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
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginTop: 20, // Add top margin
    width: "100%", // Full width
  },
  backButtonContainer: {
    width: 28, // Increased size
    height: 28,
  },
  backButtonIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 20,
    fontFamily: "Poppins-Bold", // Ensure this font is loaded
    color: "#000000",
  },

  // ScrollView
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center", // Center content horizontally
    paddingBottom: 20, // Padding at the bottom
  },

  // Koi Fish Image
  koiFishImage: {
    width: "100%",
    height: 200,
  },

  // Details Section
  detailsSection: {
    padding: 16,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#4B5563",
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 12,
  },
  detailsGrid: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#1F2937",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#1F2937",
    lineHeight: 21,
  },

  // Achievements Section
  achievementsSection: {
    padding: 16,
    width: "100%",
  },
  achievement: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  achievementIcon: {
    width: 28, // Increased size
    height: 28,
    marginRight: 8,
    marginTop: 2,
  },
  achievementTextContainer: {
    flex: 1, // Allow text to wrap
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#1F2937",
  },
  achievementSubtext: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#4B5563",
  },

  // Competition Section
  competitionSection: {
    padding: 16,
    width: "100%",
  },
  competitionEntry: {
    marginBottom: 16,
  },
  competitionTitle: {
    fontSize: 14,
    fontFamily: "Poppins",
    color: "#1F2937",
  },
  competitionSubtext: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#4B5563",
  },
  linkText: {
    fontSize: 12,
    fontFamily: "Poppins",
    color: "#007AFF",
    marginTop: 4,
  },

  // Gallery Section
  gallerySection: {
    padding: 16,
    width: "100%",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap", // Allow images to wrap to the next line
    justifyContent: "space-between", // Space out images
    marginBottom: 16,
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 8, // Add margin to the bottom of each image
  },
  addButton: {
    alignItems: "center",
    padding: 10, // Increased padding
    backgroundColor: "#007AFF",
    borderRadius: 8, // Increased border radius
  },
  addButtonText: {
    fontSize: 16, // Increased font size
    fontFamily: "Poppins-Bold",
    color: "#FEFEFE",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF", // Consistent background
    width: "100%",
  },
  footerButton: {
    padding: 8, // Add padding
  },
  footerIcon: {
    width: 28, // Increased size
    height: 28,
  },
});

export default KoiInformation;
