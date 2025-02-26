// KoiList.tsx
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

interface KoiData {
  id: string; // Add an ID for key prop and easier management
  name: string;
  age: number;
  breed: string;
  image: string;
  size?: string; // Optional, as it's in the form
  description?: string; // Optional
  videoUri?: string;
}

const KoiList: React.FC = () => {
  const [koiList, setKoiList] = useState<KoiData[]>([
    {
      id: "1",
      name: "Kohaku",
      age: 3,
      breed: "Kohaku",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/group-3.png",
    },
    {
      id: "2",
      name: "Shiro Utsuri",
      age: 2,
      breed: "Shiro Utsuri",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/group-5.png",
    },
    {
      id: "3",
      name: "Tancho",
      age: 4,
      breed: "Tancho",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/group-7.png",
    },
  ]);

  const [newKoi, setNewKoi] = useState<KoiData>({
    id: "", // Will be set on add
    name: "",
    age: 0, // Default age
    breed: "",
    image: "", // Will be set on image selection
    size: "15 Bu - Under 15cm or 6", // Default size
    description: "",
    videoUri: "",
  });

  const [selectedSize, setSelectedSize] = useState("15 Bu - Under 15cm or 6");
  const sizes = [
    "15 Bu - Under 15cm or 6",
    '20 Bu - 15-20cm or 6-8"',
    '25 Bu - 20-25cm or 8-10"',
  ]; // Add more sizes

  const handleSizeSelection = (size: string) => {
    setNewKoi({ ...newKoi, size: size });
    setSelectedSize(size);
  };

  const handleInputChange = (field: keyof KoiData, value: string | number) => {
    // Ensure age is handled as a number
    if (field === "age") {
      setNewKoi({ ...newKoi, [field]: Number(value) });
    } else {
      setNewKoi({ ...newKoi, [field]: value });
    }
  };
  const handleImageUpload = () => {
    // Placeholder for image upload.  Use react-native-image-picker or similar.
    Alert.alert("Upload Image", "Select an image for your Koi.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => {
          // Simulate setting an image URI
          const sampleUri = "https://example.com/new_koi_image.jpg"; // Replace!
          setNewKoi({ ...newKoi, image: sampleUri });
        },
      },
    ]);
  };
  const handleVideoUpload = () => {
    // Placeholder for image upload.  Use react-native-image-picker or similar.
    Alert.alert("Upload Video", "Select an Video for your Koi.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => {
          // Simulate setting an image URI
          const sampleUri = "https://example.com/new_koi_video.mp4"; // Replace!
          setNewKoi({ ...newKoi, videoUri: sampleUri });
        },
      },
    ]);
  };

  const handleAddKoi = () => {
    // Basic validation
    if (!newKoi.name || !newKoi.breed || !newKoi.size) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (Name, Breed, Size)."
      );
      return;
    }
    if (!newKoi.image) {
      Alert.alert("Error", "Please upload an image of your Koi.");
      return;
    }

    // Add the new Koi to the list
    const updatedKoiList = [...koiList, { ...newKoi, id: String(Date.now()) }]; // Generate unique ID
    setKoiList(updatedKoiList);

    // Clear the form (reset to default values)
    setNewKoi({
      id: "",
      name: "",
      age: 0,
      breed: "",
      image: "",
      size: "15 Bu - Under 15cm or 6",
      description: "",
      videoUri: "",
    });
    setSelectedSize("15 Bu - Under 15cm or 6");

    // Show success message
    Alert.alert("Success", "New Koi added!");
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              /* Navigate to Home */
            }}>
            <Text style={styles.headerTitle}>Home</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => {
                /* Implement Search */
              }}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-2.png",
                }}
                style={styles.searchIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                /* Navigate to profile */
              }}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/group-8.png",
                }}
                style={styles.profileIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Koi Title */}
        <Text style={styles.sectionTitle}>My Koi</Text>

        {/* Koi List */}
        <View style={styles.koiList}>
          {koiList.map((koi) => (
            <View key={koi.id} style={styles.koiCard}>
              <Image source={{ uri: koi.image }} style={styles.koiImage} />
              <View style={styles.koiInfo}>
                <Text style={styles.koiName}>{koi.name}</Text>
                <Text style={styles.koiDetail}>Age: {koi.age} years</Text>
                <Text style={styles.koiDetail}>Breed: {koi.breed}</Text>
                {koi.size && (
                  <Text style={styles.koiDetail}>Size: {koi.size}</Text>
                )}
                {koi.description && (
                  <Text style={styles.koiDetail}>
                    Description: {koi.description}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Add New Koi Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Add new Koi</Text>

          <Text style={styles.label}>Koi Entry Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Your Koi Name"
            placeholderTextColor="#94a3b8"
            value={newKoi.name}
            onChangeText={(text) => handleInputChange("name", text)}
          />

          <Text style={styles.label}>Koi Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Koi Age (years)"
            placeholderTextColor="#94a3b8"
            value={newKoi.age > 0 ? newKoi.age.toString() : ""} // Display age as string, handle 0
            onChangeText={(text) => handleInputChange("age", text)}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Koi Size</Text>
          <View style={styles.dropdownInput}>
            <Text style={styles.placeholderText}>{selectedSize}</Text>
            <TouchableOpacity
              onPress={() => {
                // Show a picker or modal for size selection
                Alert.alert(
                  "Select Koi Size",
                  "Choose a size for your Koi",
                  sizes.map((size) => ({
                    text: size,
                    onPress: () => handleSizeSelection(size),
                  }))
                );
              }}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-4.png",
                }}
                style={styles.dropdownIcon}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Koi Variety</Text>
          <TextInput
            style={styles.input}
            value={newKoi.breed}
            onChangeText={(text) => handleInputChange("breed", text)}
          />

          <Text style={styles.infoText}>
            The information will be double checked by the organizer.
          </Text>

          <Text style={styles.label}>Koi Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={newKoi.description}
            onChangeText={(text) => handleInputChange("description", text)}
          />

          <Text style={styles.label}>Upload Koi Image</Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={handleImageUpload}>
            {newKoi.image ? (
              <Image
                source={{ uri: newKoi.image }}
                style={styles.uploadedImage}
              />
            ) : (
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-3.png",
                }}
                style={styles.uploadIcon}
              />
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Vertical photo preferred and larger photos are recommended. Jpg or
            Png files accepted. Minimum size: width 320px x height 500px. Up to
            3 images allowed.
          </Text>

          <Text style={styles.label}>Upload Koi Videos</Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={handleVideoUpload}>
            {newKoi.videoUri ? (
              <Image
                source={{ uri: newKoi.videoUri }}
                style={styles.uploadedImage}
              />
            ) : (
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-8.png",
                }}
                style={styles.uploadIcon}
              />
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>
            The accepted video can be up to 10 minutes long and must not exceed
            100MB in size. A maximum of 2 videos can be uploaded.
          </Text>

          <TouchableOpacity style={styles.addButton} onPress={handleAddKoi}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => {
              /* Navigate to home */
            }}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-5.png",
              }}
              style={styles.footerIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              /* Navigate to notifications */
            }}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-7.png",
              }}
              style={styles.footerIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              /* Open Camera / Media Library */
            }}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-6.png",
              }}
              style={styles.footerIcon}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 20, // Add top margin
  },
  headerTitle: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  searchIcon: {
    width: 18, // Increased
    height: 18, // Increased
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "400",
    color: "#030303",
    marginLeft: 16,
    marginBottom: 16,
  },
  koiList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  koiCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  koiImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  koiInfo: {
    marginLeft: 16,
    justifyContent: "center",
    flex: 1, // Allow text to take up remaining space
  },
  koiName: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
  },
  koiDetail: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303",
    marginTop: 4,
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "400",
    color: "#030303",
    marginBottom: 24,
  },
  label: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303",
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8, // Increased border radius
    paddingHorizontal: 12,
    marginBottom: 16,
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303", // Changed text color
  },
  dropdownInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8, // Increased border radius
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholderText: {
    color: "#A9A9A9",
    fontFamily: "Lexend Deca",
    fontSize: 14,
  },
  dropdownIcon: {
    width: 14,
    height: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  infoText: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#5664F5",
    marginBottom: 16,
  },
  uploadBox: {
    height: 150,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8, // Increased border radius
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#f8f8f8", // Light background
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8, // Match border radius
  },
  uploadIcon: {
    width: 30,
    height: 30,
  },
  helperText: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#5664F5",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#000000",
    borderRadius: 8, // Increased border radius
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  addButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  footerIcon: {
    width: 28, // Increased
    height: 28, // Increased
  },
});

export default KoiList;
