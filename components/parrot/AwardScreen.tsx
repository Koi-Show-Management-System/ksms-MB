import React from 'react';
import { View, StyleSheet } from 'react-native';
import MajorAwards_HeroSection from './MajorAwards_HeroSection';
import AllAwards from './AllAwards';
import Header from './Header';
import Footer from './Footer';

const AwardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.heroSection}>
        <MajorAwards_HeroSection />
      </View>
      <View style={styles.allAwardsSection}>
        <AllAwards />
      </View>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
  heroSection: {
    flexGrow: 1,
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  allAwardsSection: {
    flexGrow: 1,
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
});

export default AwardScreen;

