// app/(user)/MyCompetitions.tsx
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Define competition data interface
interface CompetitionData {
  id: string;
  name: string;
  date: string;
  location: string;
  status: "upcoming" | "ongoing" | "completed";
  image: string;
  participantCount: number;
  fishCount: number;
  result?: {
    rank?: string;
    awarded: boolean;
    awardTitle?: string;
  };
}

// Competition Card Component
const CompetitionCard: React.FC<{
  competition: CompetitionData;
  onPress: () => void;
}> = ({ competition, onPress }) => {
  // Get status color based on competition status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "#4A90E2"; // Blue
      case "ongoing":
        return "#50C878"; // Green
      case "completed":
        return "#E74C3C"; // Red
      default:
        return "#95A5A6"; // Gray
    }
  };

  // Format status text for display
  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Upcoming";
      case "ongoing":
        return "Ongoing";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  return (
    <TouchableOpacity style={styles.competitionCard} onPress={onPress}>
      <Image
        source={{ uri: competition.image }}
        style={styles.competitionImage}
      />

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.competitionName}>{competition.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(competition.status) },
            ]}>
            <Text style={styles.statusText}>
              {getStatusText(competition.status)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/calendar-icon.png",
              }}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>{competition.date}</Text>
          </View>

          <View style={styles.detailItem}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/location-icon.png",
              }}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>{competition.location}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{competition.participantCount}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{competition.fishCount}</Text>
            <Text style={styles.statLabel}>Fish Entered</Text>
          </View>

          {competition.status === "completed" && (
            <View style={styles.resultContainer}>
              {competition.result?.awarded ? (
                <View style={styles.awardContainer}>
                  <Image
                    source={{
                      uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
                    }}
                    style={styles.awardIcon}
                  />
                  <Text style={styles.awardText}>
                    {competition.result.awardTitle}
                  </Text>
                </View>
              ) : (
                <Text style={styles.rankText}>
                  Rank: {competition.result?.rank || "N/A"}
                </Text>
              )}
            </View>
          )}
        </View>

        {competition.status === "completed" && (
          <View style={styles.viewResultsContainer}>
            <Text style={styles.viewResultsText}>View Results</Text>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/arrow-right.png",
              }}
              style={styles.arrowIcon}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Filter Tab Component
const FilterTab: React.FC<{
  title: string;
  active: boolean;
  onPress: () => void;
}> = ({ title, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterTab, active && styles.activeFilterTab]}
    onPress={onPress}>
    <Text style={[styles.filterTabText, active && styles.activeFilterTabText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// Main Component
const MyCompetitions: React.FC = () => {
  // State for filter
  const [activeFilter, setActiveFilter] = useState<
    "all" | "upcoming" | "ongoing" | "completed"
  >("all");
  const [loading, setLoading] = useState(false);

  // Mock competition data
  const competitions: CompetitionData[] = [
    {
      id: "1",
      name: "Annual Koi Championship 2023",
      date: "November 10, 2023",
      location: "Grand Convention Center",
      status: "completed",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-4.png",
      participantCount: 200,
      fishCount: 350,
      result: {
        rank: "1st",
        awarded: true,
        awardTitle: "Best in Show",
      },
    },
    {
      id: "2",
      name: "Spring Koi Exhibition",
      date: "March 15, 2023",
      location: "Aquatic Center",
      status: "completed",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-5.png",
      participantCount: 150,
      fishCount: 280,
      result: {
        rank: "84/160",
        awarded: false,
      },
    },
    {
      id: "3",
      name: "International Koi Show 2024",
      date: "January 20, 2024",
      location: "Convention Center",
      status: "upcoming",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-6.png",
      participantCount: 300,
      fishCount: 0,
    },
    {
      id: "4",
      name: "Summer Koi Festival",
      date: "July 5, 2023",
      location: "City Park",
      status: "completed",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-7.png",
      participantCount: 120,
      fishCount: 200,
      result: {
        rank: "3rd",
        awarded: true,
        awardTitle: "Best Kohaku",
      },
    },
    {
      id: "5",
      name: "Regional Koi Competition",
      date: "December 1, 2023",
      location: "Aquarium Hall",
      status: "ongoing",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-8.png",
      participantCount: 80,
      fishCount: 150,
    },
  ];

  // Filter competitions based on active filter
  const filteredCompetitions =
    activeFilter === "all"
      ? competitions
      : competitions.filter((comp) => comp.status === activeFilter);

  // Handle competition press// Handle competition press
  const handleCompetitionPress = (competition: CompetitionData) => {
    if (
      competition.status === "completed" ||
      competition.status === "ongoing"
    ) {
      // Navigate to ParticipateResult for both completed and ongoing competitions
      router.push({
        pathname: "/(user)/ParticipateResult",
        params: { competitionId: competition.id },
      });
    } else if (competition.status === "upcoming") {
      // Navigate to TicketCheckin for upcoming competitions
      router.push({
        pathname: "/(user)/TicketCheckin",
        params: { competitionId: competition.id },
      });
    }
  };

  // Refresh competitions
  const refreshCompetitions = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/back-icon.png",
            }}
            style={styles.backIcon}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Competitions</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}>
          <FilterTab
            title="All"
            active={activeFilter === "all"}
            onPress={() => setActiveFilter("all")}
          />
          <FilterTab
            title="Upcoming"
            active={activeFilter === "upcoming"}
            onPress={() => setActiveFilter("upcoming")}
          />
          <FilterTab
            title="Ongoing"
            active={activeFilter === "ongoing"}
            onPress={() => setActiveFilter("ongoing")}
          />
          <FilterTab
            title="Completed"
            active={activeFilter === "completed"}
            onPress={() => setActiveFilter("completed")}
          />
        </ScrollView>
      </View>

      {/* Competition List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading competitions...</Text>
        </View>
      ) : filteredCompetitions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/empty-competitions.png",
            }}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No competitions found</Text>
          <Text style={styles.emptyText}>
            You haven't participated in any{" "}
            {activeFilter !== "all" ? activeFilter : ""} competitions yet.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/(tabs)/shows/KoiShowsPage")}>
            <Text style={styles.browseButtonText}>Browse Competitions</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCompetitions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CompetitionCard
              competition={item}
              onPress={() => handleCompetitionPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshCompetitions}
          refreshing={loading}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/(tabs)/home/homepage")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/home-icon.png",
            }}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/(user)/Notification")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/notification-icon.png",
            }}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/(tabs)/home/UserMenu")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/profile-icon.png",
            }}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: "#4A90E2",
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginRight: 40, // To center the title accounting for the back button
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  activeFilterTab: {
    backgroundColor: "#4A90E2",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  activeFilterTabText: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  competitionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  competitionImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  competitionName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#666666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
  },
  resultContainer: {
    alignItems: "flex-end",
  },
  awardContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  awardIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  awardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E74C3C",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  viewResultsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  viewResultsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
    marginRight: 4,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: "#4A90E2",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingBottom: 20, // Extra padding for iPhone home indicator
  },
  footerButton: {
    alignItems: "center",
  },
  footerIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
  },
});

export default MyCompetitions;
