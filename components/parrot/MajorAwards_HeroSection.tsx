import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';

interface AwardCardProps {
  title: string;
  koiName: string;
  owner: string;
  image: string;
  onViewDetails?: () => void;
}

interface MajorAwardsHeroSectionProps {
  competitionName?: string;
  duration?: string;
  location?: string;
  awards?: {
    grandChampion: AwardCardProps;
    matureChampion: AwardCardProps;
  };
}

const defaultProps: MajorAwardsHeroSectionProps = {
  competitionName: '[Competition Name]',
  duration: '12th - 14th October',
  location: 'Tokyo, Japan',
  awards: {
    grandChampion: {
      title: 'Grand Champion',
      koiName: 'Koi Name: Shiro Utsuri',
      owner: 'Owner: Hiroshi Tanaka',
      image: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-6.png',
    },
    matureChampion: {
      title: 'Mature Champion',
      koiName: 'Koi Name: Kohaku',
      owner: 'Owner: Yuki Nakamura',
      image: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-9.png',
    },
  },
};

const AwardCard: React.FC<AwardCardProps> = ({ title, koiName, owner, image, onViewDetails }) => (
  <View style={styles.awardCard}>
    <Image source={{ uri: image }} style={styles.awardImage} />
    <Text style={styles.awardTitle}>{title}</Text>
    <Text style={styles.awardDetail}>{koiName}</Text>
    <Text style={styles.awardDetail}>{owner}</Text>
    <TouchableOpacity 
      style={styles.viewButton} 
      onPress={onViewDetails}
    >
      <Text style={styles.viewButtonText}>View Details</Text>
    </TouchableOpacity>
  </View>
);

const MajorAwards_HeroSection: React.FC<MajorAwardsHeroSectionProps> = (props) => {
  const { competitionName, duration, location, awards } = { ...defaultProps, ...props };
  const windowWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <View style={styles.heroContent}>
        <Text style={styles.title}>{competitionName} - Award-</Text>
        <Text style={styles.title}>Winning Koi Results</Text>
        <Image 
          source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-4.png' }} 
          style={[styles.heroImage, { width: Math.min(windowWidth - 32, 300) }]} 
        />
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>Join us for the annual Koi competition,</Text>
          <Text style={styles.description}>showcasing the finest Koi from around</Text>
          <Text style={styles.description}>the world.</Text>
        </View>
        <Text style={styles.details}>Duration: {duration}</Text>
        <Text style={styles.details}>Location: {location}</Text>
      </View>
      
      <Text style={styles.sectionTitle}>Major Awards</Text>
      <View style={[styles.awardsContainer, { 
        flexDirection: windowWidth > 768 ? 'row' : 'column'
      }]}>
        <AwardCard
          {...awards?.grandChampion}
          onViewDetails={() => console.log('Grand Champion details clicked')}
        />
        <AwardCard
          {...awards?.matureChampion}
          onViewDetails={() => console.log('Mature Champion details clicked')}
        />
      </View>
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
  heroContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Roboto',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 4,
  },
  heroImage: {
    height: 150,
    marginVertical: 24,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  descriptionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  description: {
    fontFamily: 'Poppins',
    fontSize: 16,
    textAlign: 'center',
    color: '#030303',
    lineHeight: 24,
  },
  details: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#030303',
    marginVertical: 2,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: '#030303',
    marginBottom: 24,
  },
  awardsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  awardCard: {
    width: 250,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  awardImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 16,
  },
  awardTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 8,
  },
  awardDetail: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#030303',
    marginVertical: 2,
  },
  viewButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
    alignItems: 'center',
  },
  viewButtonText: {
    fontFamily: 'Roboto',
    fontSize: 15,
    fontWeight: '700',
    color: '#FEFEFE',
  },
});

export default MajorAwards_HeroSection;
