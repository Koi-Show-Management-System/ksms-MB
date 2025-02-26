import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const KoiCompetitionApp: React.FC = () => {
  // States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [koiName, setKoiName] = useState("");
  const [koiDescription, setKoiDescription] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariety, setSelectedVariety] = useState("");

  // Handlers
  const handleImageUpload = () => {
    console.log("Image upload triggered");
  };

  const handleVideoUpload = () => {
    console.log("Video upload triggered");
  };

  const handleSubmit = () => {
    if (isChecked) {
      console.log("Form submitted", {
        koiName,
        koiDescription,
        selectedSize,
        selectedVariety,
      });
      router.push("/(tabs)/shows/ConfirmRegister");
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <Text style={styles.homeText}>Home</Text>
          </View>
          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.searchIconContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-3.png",
                }}
                style={styles.searchIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/group-6.png",
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Register for Koi Competition</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Koi Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select your Koi</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
              <Text style={styles.dropdownText}>Kowana</Text>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-7.png",
                }}
                style={styles.dropdownIcon}
              />
            </TouchableOpacity>
            <Text style={styles.addNewText}>Or add new Koi</Text>
          </View>

          {/* Koi Details */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koi Entry Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Koi Name"
                placeholderTextColor="#94a3b8"
                value={koiName}
                onChangeText={setKoiName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koi Size</Text>
              <TouchableOpacity style={styles.dropdown}>
                <Text style={styles.dropdownText}>
                  {selectedSize || '15 Bu - Under 15cm or 6"'}
                </Text>
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-2.png",
                  }}
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koi Variety</Text>
              <TouchableOpacity style={styles.dropdown}>
                <Text style={styles.dropdownText}>
                  {selectedVariety || "Select variety"}
                </Text>
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-2.png",
                  }}
                  style={styles.dropdownIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koi Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline={true}
                numberOfLines={4}
                placeholder="Enter description"
                placeholderTextColor="#94a3b8"
                value={koiDescription}
                onChangeText={setKoiDescription}
              />
            </View>
          </View>

          {/* Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Koi Image</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handleImageUpload}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/group-3.png",
                }}
                style={styles.uploadIcon}
              />
            </TouchableOpacity>
            <Text style={styles.infoText}>
              Vertical photo preferred and larger photos are recommended. Jpg or
              Png files accepted.
            </Text>

            <Text style={styles.sectionTitle}>Upload Koi Videos</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handleVideoUpload}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/group-8.png",
                }}
                style={styles.uploadIcon}
              />
            </TouchableOpacity>
            <Text style={styles.infoText}>
              The accepted video can be up to 10 minutes long and must not
              exceed 100MB in size.
            </Text>
          </View>

          {/* Agreement Section */}
          <View style={styles.section}>
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesText}>
                Read the full details of all rules and regulations
              </Text>
            </View>

            <View style={styles.agreementContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsChecked(!isChecked)}>
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By clicking register, you confirm that you have read and will
                comply with our rules.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !isChecked && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isChecked}>
              <Text style={styles.submitText}>Submit Registration</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.iconContainer}>
            <TouchableOpacity style={styles.iconWrapper}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-4.png",
                }}
                style={styles.footerIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconWrapper}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-6.png",
                }}
                style={styles.footerIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconWrapper}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-5.png",
                }}
                style={styles.footerIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    height: 60,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  searchIconContainer: {
    marginRight: 8,
    padding: 4,
  },
  searchIcon: {
    width: 13,
    height: 13,
  },
  profileContainer: {
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  titleSection: {
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontFamily: "Lexend Deca",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
  },
  mainContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303",
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303",
    marginBottom: 8,
  },
  input: {
    height: 35,
    borderWidth: 0.93,
    borderColor: "#d0d3f5",
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  dropdown: {
    height: 35,
    borderWidth: 0.93,
    borderColor: "#D0D3F5",
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#A9A9A9",
  },
  dropdownIcon: {
    width: 14,
    height: 14,
  },
  addNewText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303",
    textAlign: "center",
    marginTop: 8,
  },
  uploadBox: {
    width: "100%",
    height: 150,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#5664F5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadIcon: {
    width: 40,
    height: 40,
  },
  infoText: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#5664F5",
    marginBottom: 16,
  },
  rulesContainer: {
    backgroundColor: "#E5E7EB",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 16,
  },
  rulesText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#030303",
  },
  agreementContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#FF0031",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkmark: {
    color: "#FF0031",
    fontSize: 14,
  },
  termsText: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#FF0031",
  },
  submitButton: {
    backgroundColor: "#000000",
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  submitText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    height: 70,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 100,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  footerIcon: {
    width: "100%",
    height: "100%",
  },
});

export default KoiCompetitionApp;
