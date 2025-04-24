import React from "react";
import { StyleSheet, View } from "react-native";
import Footer from "../Footer";
import Header from "../Header";

interface DefaultLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showFooter?: boolean;
}

export function DefaultLayout({
  children,
  title = "KSMS",
  description = "",
  showFooter = true,
}: DefaultLayoutProps) {
  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "right", "bottom", "left"]}>
      <Header title={title} description={description} />
      <View style={styles.content}>{children}</View>
      {showFooter && <Footer />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
});
