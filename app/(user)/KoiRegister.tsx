// KoiRegister.tsx
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface KoiDetailsFormProps {
  onSubmit?: (data: KoiData) => void; // Corrected prop type
  initialData?: KoiData; // Use the defined type
}

// Define a type for the Koi data
interface KoiData {
  koiName: string;
  koiSize: string;
  koiVariety: string;
  koiDescription: string;
  photoUri?: string; // Optional, as it might not be immediately available
  videoUri?: string; // Optional
}

const KoiRegister: React.FC = () => {
  const [koiData, setKoiData] = useState<KoiData>({
    koiName: "Super Koi 10",
    koiSize: "15 Bu - Under 15cm or 6",
    koiVariety: "Kohaku",
    koiDescription: "My koi is the best, I will win this prize",
    photoUri:
      "https://dashboard.codeparrot.ai/api/image/Z78_767obB3a4bxP/group-3.png", // Default image
    videoUri:
      "https://dashboard.codeparrot.ai/api/image/Z78_767obB3a4bxP/group-4.png", // Default Image
  });

  const handleInputChange = (field: keyof KoiData, value: string) => {
    setKoiData({ ...koiData, [field]: value });
  };

  // Placeholder function for image/video selection.  Replace with your actual implementation.
  const handleMediaSelect = (type: "photo" | "video") => {
    Alert.alert(
      "Media Selection",
      `Select ${type === "photo" ? "a photo" : "a video"} for your Koi.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            // In a real app, you'd use a library like react-native-image-picker
            // to let the user select an image/video from their library or camera.
            // For this example, we'll just simulate setting a URI.
            const sampleUri = `https://example.com/${type}.jpg`; // Replace with actual URI
            if (type === "photo") {
              setKoiData({ ...koiData, photoUri: sampleUri });
            } else {
              setKoiData({ ...koiData, videoUri: sampleUri });
            }
          },
        },
      ]
    );
  };

  const handleSubmit = () => {
    // Basic validation
    if (!koiData.koiName || !koiData.koiSize || !koiData.koiVariety) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (Name, Size, Variety)."
      );
      return;
    }

    // Simulate submission (replace with actual API call)
    console.log("Submitting Koi Data:", koiData);
    Alert.alert("Success", "Your Koi has been registered!", [
      {
        text: "OK",
        onPress: () => {
          //Here you can navigate to another screen, e.g., a confirmation screen or back to the home screen.
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              /* Navigate to home, replace with your navigation */
            }}>
            <Text style={styles.headerText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              /* Navigate to profile */
            }}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z78_767obB3a4bxP/group-5.png",
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Register Your Koi</Text>
          <Text style={styles.description}>
            To participate in the Koi competition, a registration fee of $0.5 is
            required. Please fill out the form below to add your Koi to the
            event.
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Koi Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Koi Name</Text>
            <TextInput
              style={styles.input}
              value={koiData.koiName}
              placeholder="Enter koi name"
              onChangeText={(text) => handleInputChange("koiName", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Koi Size</Text>
            <TextInput
              style={styles.input}
              value={koiData.koiSize}
              placeholder="Enter koi size"
              onChangeText={(text) => handleInputChange("koiSize", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Koi Variety</Text>
            <TextInput
              style={styles.input}
              value={koiData.koiVariety}
              placeholder="Enter koi variety"
              onChangeText={(text) => handleInputChange("koiVariety", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Koi Description</Text>
            <TextInput
              style={styles.input}
              value={koiData.koiDescription}
              placeholder="Enter koi description"
              onChangeText={(text) => handleInputChange("koiDescription", text)}
              multiline={true} // Allow multiple lines for description
              numberOfLines={4} // Show 4 lines initially
            />
          </View>

          <View style={styles.mediaSection}>
            <Text style={styles.label}>Photo</Text>
            <TouchableOpacity onPress={() => handleMediaSelect("photo")}>
              <Image
                source={{
                  uri:
                    koiData.photoUri ||
                    "https://dashboard.codeparrot.ai/api/image/Z78_767obB3a4bxP/group-3.png",
                }}
                style={styles.mediaPreview}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.mediaSection}>
            <Text style={styles.label}>Videos</Text>
            <TouchableOpacity onPress={() => handleMediaSelect("video")}>
              <Image
                source={{
                  uri:
                    koiData.videoUri ||
                    "https://dashboard.codeparrot.ai/api/image/Z78_767obB3a4bxP/group-4.png",
                }}
                style={styles.mediaPreview}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Confirm and Pay $0.5</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center", // Center content horizontally
  },
  scrollViewContainer: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 375, // Keep the maximum width
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    width: "100%",
    marginTop: 20, // Add top margin
  },
  headerText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  titleSection: {
    paddingVertical: 16,
    marginBottom: 20,
    width: "100%", // Ensure it takes full width
  },
  mainTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 16,
  },
  description: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#545454",
    lineHeight: 24,
  },
  formContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    width: "100%",
    alignSelf: "center",
  },
  formTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
    width: "100%", // Ensure inputs take full width
  },
  label: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#030303",
    marginBottom: 8,
  },
  input: {
    height: 40, // Increased height slightly
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8, // Slightly more rounded corners
    paddingHorizontal: 12,
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303", // Changed text color to black
    backgroundColor: "#fff",
  },
  mediaSection: {
    marginBottom: 16,
    width: "100%", // Ensure inputs take full width
  },
  mediaPreview: {
    width: "100%", // Make image take full width of container
    aspectRatio: 16 / 9, // Common aspect ratio for images/videos
    borderRadius: 8, // Rounded corners for preview
    marginTop: 8,
    backgroundColor: "#ddd", // Placeholder color
  },
  submitButton: {
    backgroundColor: "#4F46E5",
    height: 48,
    borderRadius: 8, // Consistent rounded corners
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    width: "100%", // Ensure button takes full width
  },
  submitButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#fff",
    fontWeight: "400",
  },
  //Footer
  footerContainer: {
    width: "100%",
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});

export default KoiRegister;
