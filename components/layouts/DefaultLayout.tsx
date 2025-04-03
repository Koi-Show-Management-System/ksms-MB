import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../Header';
import Footer from '../Footer';

interface DefaultLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showFooter?: boolean;
}

export function DefaultLayout({
  children,
  title = 'KSMS',
  description = '',
  showFooter = true
}: DefaultLayoutProps) {
  return (
    <View style={styles.container}>
      <Header title={title} description={description} />
      <View style={styles.content}>
        {children}
      </View>
      {showFooter && <Footer />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});