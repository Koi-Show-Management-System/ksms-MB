import { router } from "expo-router";
import React from "react";
import { Button, View } from "react-native";

function HomeScreen() {
  const navigateToHomepage = () => {
    router.push("/homepage");
  };

  const navigateToWelcome = () => {
    router.push("/welcomeScreen");
  };

  const navigateToSignup = () => {
    router.push("/signUp");
  };

  const navigateToSignin = () => {
    router.push("/signIn");
  };

  const navigateToRegistration = () => {
    router.push("/koiRegistration");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Go to Homepage" onPress={navigateToHomepage} />
      <Button title="Go to Welcome" onPress={navigateToWelcome} />
      <Button title="Go to Sign Up" onPress={navigateToSignup} />
      <Button title="Go to Sign In" onPress={navigateToSignin} />
      <Button title="Go to Registration" onPress={navigateToRegistration} />
    </View>
  );
}

export default HomeScreen;
