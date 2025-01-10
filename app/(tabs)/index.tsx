import { router } from "expo-router";
import React from "react";
import { Button, View } from "react-native";

function HomeScreen() {
  const navigateToHomepage = () => {
    router.push("/homepage"); // Điều hướng đến route `homePage`
  };

  const navigateToWelcome = () => {
    router.push("/welcomeScreen"); // Điều hướng đến route `welcomeScreen`
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Go to Homepage" onPress={navigateToHomepage} />
      <Button title="Go to Welcome" onPress={navigateToWelcome} />
    </View>
  );
}

export default HomeScreen;
