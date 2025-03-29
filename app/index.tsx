import { router } from "expo-router";
import React from "react";
import { Button, View } from "react-native";
import Footer from "../components/Footer";

function testpage() {
  const navigateToHomepage = () => {
    router.push("/(tabs)/home/homepage");
  };

  const navigateToWelcome = () => {
    router.push("/(auth)/welcomeScreen");
  };

  const navigateToSignup = () => {
    router.push("/(auth)/signUp");
  };

  const navigateToSignin = () => {
    router.push("/(auth)/signIn");
  };

  const navigateToRegistration = () => {
    router.push("/(tabs)/shows/LiveStream");
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Button title="Go to Homepage" onPress={navigateToHomepage} />
        <Button title="Go to Welcome" onPress={navigateToWelcome} />
        <Button title="Go to Sign Up" onPress={navigateToSignup} />
        <Button title="Go to Sign In" onPress={navigateToSignin} />
        <Button title="Go to live stream" onPress={navigateToRegistration} />
      </View>
      
      <Footer activeTab="home" />
    </View>
  );
}

export default testpage;
