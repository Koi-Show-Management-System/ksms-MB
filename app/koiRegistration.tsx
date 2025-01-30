import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const KoiRegistration: React.FC = () => {
  const [koiName, setKoiName] = useState("");
  const [koiSize, setKoiSize] = useState("");
  const [koiVariety, setKoiVariety] = useState("");
  const [koiDescription, setKoiDescription] = useState("");

  const handleSubmit = () => {
    // Handle the registration logic here
    console.log("Koi Registration Submitted:", {
      koiName,
      koiSize,
      koiVariety,
      koiDescription,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register for Koi Competition</Text>

      <Text style={styles.label}>Select your Koi</Text>
      <TextInput
        style={styles.input}
        placeholder="Select your Koi or add new Koi"
        value={koiName}
        onChangeText={setKoiName}
      />

      <Text style={styles.label}>Koi Size</Text>
      <TextInput
        style={styles.input}
        placeholder="Koi Size"
        value={koiSize}
        onChangeText={setKoiSize}
      />

      <Text style={styles.label}>Koi Variety</Text>
      <TextInput
        style={styles.input}
        placeholder="Koi Variety"
        value={koiVariety}
        onChangeText={setKoiVariety}
      />

      <Text style={styles.label}>Koi Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Koi Description"
        value={koiDescription}
        onChangeText={setKoiDescription}
        multiline
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
    marginVertical: 20,
  },
  label: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 8,
    alignSelf: "flex-start",
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
  uploadText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 8,
    alignSelf: "flex-start",
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
