import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AwardCardProps {
  title: string;
  koiName: string;
  owner: string;
  image: string;
  onViewDetails?: () => void;
}

const AwardScreen: React.FC = () => {
  const windowWidth = Dimensions.get("window").width;
  const [selectedCategory, setSelectedCategory] = useState("Grand Champions");

  const majorAwards = {
    grandChampion: {
      title: "Grand Champion",
      koiName: "Shiro Utsuri",
      owner: "Hiroshi Tanaka",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-6.png",
    },
    matureChampion: {
      title: "Mature Champion",
      koiName: "Kohaku",
      owner: "Yuki Nakamura",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-9.png",
    },
  };

  const awardsByCategory = {
    "Grand Champions": [
      {
        title: "Grand Champion",
        koiName: "Shiro Utsuri",
        owner: "Hiroshi Tanaka",
        image:
          "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-15.png",
      },
    ],
    "Category Champions": [
      {
        title: "Mature Champion",
        koiName: "Kohaku",
        owner: "Yuki Nakamura",
        image:
          "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-18.png",
      },
    ],
    "Best in Sizes": [
      {
        title: "Jumbo Champion",
        koiName: "Big Pearl",
        owner: "Kenji Sato",
        image:
          "https://dashboard.codeparrot.ai/api/image/Z7wYT1CHtJJZ6wH5/group-15.png",
      },
    ],
  };

  const AwardCard: React.FC<AwardCardProps> = ({
    title,
    koiName,
    owner,
    image,
    onViewDetails,
  }) => (
    <View style={styles.awardCard}>
      <Image source={{ uri: image }} style={styles.awardImage} />
      <Text style={styles.awardTitle}>{title}</Text>
      <Text style={styles.awardDetail}>Koi Name: {koiName}</Text>
      <Text style={styles.awardDetail}>Owner: {owner}</Text>
      <TouchableOpacity style={styles.viewButton} onPress={onViewDetails}>
        <Text style={styles.viewButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAwardSections = () => {
    return (
      <View>
        {Object.entries(awardsByCategory).map(([category, awards]) => (
          <View key={category} style={styles.allAwardsSection}>
            <View style={styles.categoriesHeader}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(category)}>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category &&
                      styles.selectedCategoryText,
                  ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            </View>
            {awards.map((award, index) => (
              <View key={index} style={styles.listAwardCard}>
                <Text style={styles.cardTitle}>{award.title}</Text>
                <View style={styles.cardContent}>
                  <Image
                    source={{ uri: award.image }}
                    style={styles.koiImageSmall}
                  />
                  <View style={styles.koiDetails}>
                    <Text style={styles.koiName}>Koi: {award.koiName}</Text>
                    <Text style={styles.ownerName}>Owner: {award.owner}</Text>
                  </View>
                  <TouchableOpacity style={styles.viewDetailsButton}>
                    <Text style={styles.buttonText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Banner */}
        <View style={styles.banner}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z63xHAHZk1kkvbvp/frame-28.png",
            }}
            style={styles.bannerImage}
          />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Kết quả cuộc thi</Text>
          </View>

          {/* Award Sections */}
          {renderAwardSections()}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  banner: {
    width: "100%",
    height: 200,
    backgroundColor: "#E9E9E9",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  mainContent: {
    padding: 16,
  },
  titleSection: {
    marginVertical: 16,
    alignItems: "center",
  },
  title: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
  },
  scrollContent: {
    paddingBottom: 60, // Giảm padding để loại bỏ khoảng trắng thừa nhưng vẫn đảm bảo nội dung không bị che bởi footer
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  homeButton: {
    padding: 8,
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  heroSection: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  heroImage: {
    height: 150,
    marginVertical: 24,
    resizeMode: "cover",
    borderRadius: 8,
  },
  descriptionContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#030303",
    lineHeight: 24,
  },
  details: {
    fontSize: 14,
    color: "#030303",
    marginVertical: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 24,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  awardsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16,
  },
  awardCard: {
    width: 280, // Fixed width for consistent card size
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  awardImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
    borderRadius: 8,
    marginBottom: 16,
  },
  awardTitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 8,
  },
  awardDetail: {
    fontSize: 14,
    color: "#030303",
    marginVertical: 2,
  },
  viewButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FEFEFE",
  },
  allAwardsSection: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryButton: {
    padding: 8,
    borderRadius: 4,
  },
  selectedCategory: {
    backgroundColor: "#007AFF",
  },
  categoryLabel: {
    fontSize: 14,
    color: "#030303",
  },
  selectedCategoryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listAwardCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  koiImageSmall: {
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
    color: "#030303",
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: "#030303",
  },
  viewDetailsButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FEFEFE",
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  footerIcon: {
    padding: 10,
  },
  footerIconImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});

export default AwardScreen;
