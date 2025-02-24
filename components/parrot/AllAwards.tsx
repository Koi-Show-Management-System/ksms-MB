import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface AwardWinner {
  title: string;
  koiName: string;
  ownerName: string;
  ownerLastName: string;
  image: string;
}

const AllAwards: React.FC = () => {
  const awardWinners: AwardWinner[] = [
    {
      title: 'Grand Champion',
      koiName: 'Shiro Utsuri',
      ownerName: 'Hiroshi',
      ownerLastName: 'Tanaka',
      image: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-15.png',
    },
    {
      title: 'Mature Champion',
      koiName: 'Kohaku',
      ownerName: 'Yuki',
      ownerLastName: 'Nakamura',
      image: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-18.png',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Award-Winning Koi</Text>
      
      <View style={styles.categoriesHeader}>
        <Text style={styles.categoryLabel}>Grand Champions</Text>
        <Text style={styles.categoryLabel}>Category Champions</Text>
        <Text style={styles.categoryLabel}>Best in Sizes</Text>
      </View>

      {awardWinners.map((winner, index) => (
        <View key={index} style={styles.awardCard}>
          <Text style={styles.cardTitle}>{winner.title}</Text>
          <View style={styles.cardContent}>
            <Image source={{ uri: winner.image }} style={styles.koiImage} />
            <View style={styles.koiDetails}>
              <Text style={styles.koiName}>Koi Name: {winner.koiName}</Text>
              <Text style={styles.ownerName}>Owner: {winner.ownerName} {winner.ownerLastName}</Text>
            </View>
            <TouchableOpacity style={styles.viewDetailsButton}>
              <Text style={styles.buttonText}>View</Text>
              <Text style={styles.buttonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minWidth: 320,
    padding: 16,
    backgroundColor: 'inherit',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#030303',
    marginBottom: 16,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#030303',
  },
  awardCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#030303',
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  koiImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  koiDetails: {
    flex: 1,
    marginLeft: 16,
  },
  koiName: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#030303',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#030303',
  },
  viewDetailsButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FEFEFE',
    fontSize: 15,
    fontFamily: 'Roboto',
    fontWeight: '700',
  },
});

export default AllAwards;

