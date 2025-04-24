import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./Header";

interface LayoutWithHeaderProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
}

const LayoutWithHeader: React.FC<LayoutWithHeaderProps> = ({
  children,
  title = "KSMS",
  description = "",
  showHeader = true,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {showHeader && <Header title={title} />}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
});

export default LayoutWithHeader;
