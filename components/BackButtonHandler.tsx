// components/BackButtonHandler.tsx
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { BackHandler } from "react-native";

export function BackButtonHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  return null;
}
