import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";

const KoiRegistration: React.FC = () => {
  const [koiName, setKoiName] = useState("");
  const [koiSize, setKoiSize] = useState("");
  const [koiVariety, setKoiVariety] = useState("");
  const [koiDescription, setKoiDescription] = useState("");
  const [selectedKoi, setSelectedKoi] = useState("");

  const koiList = [
    { key: "1", value: "Kowana" },
    { key: "2", value: "Uchiha Naruto" },
    { key: "3", value: "Malenia" },
    { key: "4", value: "Sasuke" },
    { key: "5", value: "Itachi" },
    { key: "6", value: "Or add new Koi" },
  ];

  const koiSizes = [
    { key: "1", value: "15 Bu - Under 15cm or 6" },
    { key: "2", value: "Other Size Options" },
  ];

  const koiVarieties = [
    { key: "1", value: "Select Koi Variety" },
    { key: "2", value: "Variety A" },
    { key: "3", value: "Variety B" },
  ];

  const handleSubmit = () => {
    console.log("Koi Registration Submitted:", {
      selectedKoi,
      koiName,
      koiSize,
      koiVariety,
      koiDescription,
    });
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Register for Koi Competition</Text>

        <Text style={styles.label}>Select your Koi</Text>
        <SelectList
          setSelected={setSelectedKoi}
          data={koiList}
          save="value"
          boxStyles={styles.selectBox}
          dropdownStyles={styles.dropdown}
          placeholder="Select your Koi"
          search={false}
        />

        <Text style={styles.label}>Koi Entry Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Koi Name"
          value={koiName}
          onChangeText={setKoiName}
        />

        <Text style={styles.label}>Koi Size</Text>
        <SelectList
          setSelected={setKoiSize}
          data={koiSizes}
          save="value"
          boxStyles={styles.selectBox}
          dropdownStyles={styles.dropdown}
          placeholder="Select Size"
          search={false}
        />

        <Text style={styles.label}>Koi Variety</Text>
        <SelectList
          setSelected={setKoiVariety}
          data={koiVarieties}
          save="value"
          boxStyles={styles.selectBox}
          dropdownStyles={styles.dropdown}
          placeholder="Select Variety"
          search={false}
        />

        <Text style={styles.label}>Koi Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Koi Description"
          value={koiDescription}
          onChangeText={setKoiDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.uploadText}>Upload Koi Image</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Select Image</Text>
        </TouchableOpacity>

        <Text style={styles.uploadText}>Upload Koi Videos</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Select Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Registration</Text>
        </TouchableOpacity>

        <Text style={styles.confirmText}>
          By clicking register, you confirm that you have read and will comply
          with our rules.
        </Text>
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
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  title: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
    marginVertical: 20,
    textAlign: "center",
  },
  label: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 47,
    backgroundColor: "#F9F9F9D6",
    borderWidth: 1,
    borderColor: "#D2D2D7",
    borderRadius: 4,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  selectBox: {
    width: "100%",
    height: 47,
    backgroundColor: "#F9F9F9D6",
    borderWidth: 1,
    borderColor: "#D2D2D7",
    borderRadius: 4,
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: "#F9F9F9D6",
    borderWidth: 1,
    borderColor: "#D2D2D7",
  },
  uploadText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 8,
  },
  uploadButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#0A0A0A",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  uploadButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  submitButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#0A0A0A",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  confirmText: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#030303",
    marginTop: 20,
    textAlign: "center",
  },
});

export default KoiRegistration;
