import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    // Placeholder for form submission logic
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log(formData);
    // Proceed with form submission, e.g., API call
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z5vae-xZjZ9DnB_f/group-2.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.title}>KSMS</Text>
          <Text style={styles.subtitle}>
            Become a part of the Koi community!
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {["Full Name", "Email address", "Password", "Confirm Password"].map(
            (field, index) => (
              <View key={index} style={styles.inputContainer}>
                <Text style={styles.label}>{field} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    field.includes("Password")
                      ? "**********"
                      : field === "Email address"
                      ? "Email@email.com"
                      : "John Smith"
                  }
                  secureTextEntry={field.includes("Password")}
                  value={
                    formData[
                      field.replace(" ", "").toLowerCase() as keyof FormData
                    ]
                  }
                  onChangeText={(value) =>
                    handleInputChange(
                      field.replace(" ", "").toLowerCase(),
                      value
                    )
                  }
                />
              </View>
            )
          )}
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 34,
    marginVertical: 15,
    color: "#030303",
  },
  subtitle: {
    fontFamily: "Poppins",
    fontWeight: "400",
    fontSize: 16,
    color: "#030303",
  },
  form: {
    width: "100%",
    maxWidth: 334,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
    color: "#030303",
  },
  input: {
    width: "100%",
    height: 47,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#d2d2d7",
    padding: 10,
    backgroundColor: "#f9f9f9d6",
    fontFamily: "Poppins",
    fontSize: 14,
  },
  button: {
    width: "100%",
    maxWidth: 334,
    height: 48,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontFamily: "Poppins",
    fontWeight: "400",
    fontSize: 14,
    color: "#030303",
  },
  footerLink: {
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 14,
    color: "#030303",
    textDecorationLine: "underline",
  },
});

export default Signup;
