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
import LayoutWithFooter from "../../../components/LayoutWithFooter";

const ConfirmRegister: React.FC = () => {
  // States
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  // Bank data
  const banks = [
    {
      id: "bankA",
      name: "Bank A",
      icon: "https://dashboard.codeparrot.ai/api/image/Z6I6oavsm-LWpeaZ/group-5.png",
    },
    {
      id: "bankB",
      name: "Bank B",
      icon: "https://dashboard.codeparrot.ai/api/image/Z6I6oavsm-LWpeaZ/group-7.png",
    },
    {
      id: "bankC",
      name: "Bank C",
      icon: "https://dashboard.codeparrot.ai/api/image/Z6I6oavsm-LWpeaZ/group-9.png",
    },
  ];

  const handlePayment = () => {
    console.log("Payment processed", {
      cardNumber,
      expiryDate,
      cvc,
      nameOnCard,
      selectedBank,
    });
  };

  return (
    <LayoutWithFooter>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity>
                <Text style={styles.homeText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoContainer}>
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z6I6oavsm-LWpeaZ/group-10.png",
                  }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Banner */}
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z6I6oavsm-LWpeaZ/vector.png",
              }}
              style={styles.bannerImage}
            />

            {/* Participation Confirmation */}
            <View style={styles.participationSection}>
              <Text style={styles.sectionTitle}> Your Participation</Text>
              <Text style={styles.description}>
                Join the competition by paying a registration fee of $0.5. Show
                off your koi and win amazing prizes!
              </Text>
            </View>

            {/* Payment Details */}
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Details</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="Enter card number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>MM/YY</Text>
                  <TextInput
                    style={styles.input}
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="MM/YY"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>CVC</Text>
                  <TextInput
                    style={styles.input}
                    value={cvc}
                    onChangeText={setCvc}
                    placeholder="CVC"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name on Card</Text>
                <TextInput
                  style={styles.input}
                  value={nameOnCard}
                  onChangeText={setNameOnCard}
                  placeholder="Enter name on card"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Bank Selection */}
            <View style={styles.bankSection}>
              <Text style={styles.sectionTitle}>Select Your Bank</Text>
              {banks.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankOption,
                    selectedBank === bank.id && styles.selectedBank,
                  ]}
                  onPress={() => setSelectedBank(bank.id)}>
                  <Image source={{ uri: bank.icon }} style={styles.bankIcon} />
                  <Text style={styles.bankName}>{bank.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pay Button */}
            <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
              <Text style={styles.payButtonText}>Pay $0.5</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LayoutWithFooter>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  logoContainer: {
    width: 40,
    height: 40,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  bannerImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 20,
  },
  participationSection: {
    width: "90%",
    padding: 16,
    alignItems: "center",
  },
  sectionTitle: {
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
    textAlign: "center",
    lineHeight: 24,
  },
  paymentSection: {
    width: "90%",
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  halfWidth: {
    width: "48%",
  },
  label: {
    fontSize: 13,
    fontFamily: "Lexend Deca",
    color: "#94A3B8",
    marginBottom: 4,
  },
  input: {
    height: 41,
    borderWidth: 0.93,
    borderColor: "#ECECEC",
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    fontFamily: "Lexend Deca",
    fontSize: 14,
  },
  bankSection: {
    width: "90%",
    padding: 16,
  },
  bankOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  selectedBank: {
    borderColor: "#4A90E2",
    backgroundColor: "#F5F9FF",
  },
  bankIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  bankName: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#030303",
  },
  payButton: {
    width: "90%",
    height: 50,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 20,
  },
  payButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default ConfirmRegister;
