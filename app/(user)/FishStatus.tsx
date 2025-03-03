import { useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Fish Profile Header ---
interface FishProfileHeaderProps {
  fishName: string;
  fishImage: string;
}

const FishProfileHeader: React.FC<FishProfileHeaderProps> = ({
  fishName,
  fishImage,
}) => {
  return (
    <View style={styles.headerContainer}>
      <Image
        source={{ uri: fishImage }}
        style={styles.headerFishImage}
        resizeMode="cover"
      />
      <Text style={styles.headerFishName}>{fishName}</Text>
    </View>
  );
};

// --- Fish Details ---
interface FishDetailsProps {
  breed: string;
  size: string;
  category: string;
}

const FishDetails: React.FC<FishDetailsProps> = ({ breed, size, category }) => {
  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsContent}>
        <Text style={styles.detailsText}>Breed: {breed}</Text>
        <Text style={styles.detailsText}>Size: {size}</Text>
        <Text style={styles.detailsText}>Competition Category: {category}</Text>
      </View>
    </View>
  );
};

// --- Current Status ---
interface CurrentStatusProps {
  status: string;
  prize?: string; // Prize is optional
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ status, prize }) => {
  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusText}>{status}</Text>
      {prize && <Text style={styles.prizeText}>{prize}</Text>}
    </View>
  );
};

// --- Status History ---
interface StatusItem {
  time: string;
  description: string;
}

const StatusHistory: React.FC = () => {
  const statusItems: StatusItem[] = [
    { time: "10:00 AM:", description: "Checked in at the competition area." },
    { time: "11:30 AM:", description: "Waiting for evaluation." },
    { time: "2:00 PM:", description: "Under evaluation (criteria: Shape)." },
    { time: "3:30 PM:", description: "Evaluation completed - Did not win." },
    { time: "4:00 PM:", description: "Awarded consolation prize." },
  ];

  return (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Status History</Text>
      <View style={styles.timelineContainer}>
        {statusItems.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                {" " + item.description}
              </Text>
            </View>
            {index !== statusItems.length - 1 && (
              <View style={styles.timelineLine} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// --- Detailed Results ---
interface DetailedResultsProps {
  award?: string;
  score: number;
  coloration: number;
  shape: number;
  pattern: number;
  size: number;
  comments: string[];
}

const DetailedResults: React.FC<DetailedResultsProps> = ({
  award = "Consolation Prize",
  score,
  coloration,
  shape,
  pattern,
  size,
  comments,
}) => {
  return (
    <View style={styles.resultsContainer}>
      <Text style={styles.resultsTitle}>Detailed Results</Text>

      <View style={styles.resultsContent}>
        <Text style={styles.resultsText}>Award: {award}</Text>
        <Text style={styles.resultsText}>Score: {score}/100</Text>
        <Text style={styles.resultsText}>Coloration: {coloration}/30</Text>
        <Text style={styles.resultsText}>Shape: {shape}/30</Text>
        <Text style={styles.resultsText}>Pattern: {pattern}/20</Text>
        <Text style={styles.resultsText}>Size: {size}/20</Text>
      </View>
      <View style={styles.commentsContainer}>
        <Text style={styles.resultsText}>
          Judges' Comments: {comments.join(" ")}
        </Text>
      </View>
    </View>
  );
};

// --- Main Component ---

const FishStatus: React.FC = () => {
  const params = useLocalSearchParams();

  // Convert parameters to the expected format
  const fishData = {
    fishName: params.fishName as string,
    fishImage: params.fishImage as string,
    breed: params.breed as string,
    size: params.size as string,
    category: params.category as string,
    status: params.status as string,
    prize: params.prize as string,
    award: params.award as string,
    score: Number(params.score || 75),
    coloration: Number(params.coloration || 25),
    shape: Number(params.shape || 20),
    pattern: Number(params.pattern || 15),
    fishSize: Number(params.fishSize || 15),
    comments: [(params.comments as string) || "No comments provided."],
  };

  //Default data
  const defaultFishData = {
    fishName: "[Fish Name]",
    fishImage:
      "https://dashboard.codeparrot.ai/api/image/Z8McVVj1kitRpYQA/group.png",
    breed: "Kohaku",
    size: "24 inches",
    category: "Large Koi",
    status: "Current Status",
    prize: "Awarded consolation prize",
    award: "Consolation Prize",
    score: 75,
    coloration: 25,
    shape: 20,
    pattern: 15,
    fishSize: 15,
    comments: [
      "Beautiful coloration and",
      "unique pattern, but needs improvement in",
      "shape.",
    ],
  };
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <FishProfileHeader
          fishName={fishData.fishName || defaultFishData.fishName}
          fishImage={fishData.fishImage || defaultFishData.fishImage}
        />
        <FishDetails
          breed={fishData.breed || defaultFishData.breed}
          size={fishData.size || defaultFishData.size}
          category={fishData.category || defaultFishData.category}
        />
        <CurrentStatus
          status={fishData.status || defaultFishData.status}
          prize={fishData.prize}
        />
        <StatusHistory />
        <DetailedResults
          award={fishData.award || defaultFishData.award}
          score={fishData.score || defaultFishData.score}
          coloration={fishData.coloration || defaultFishData.coloration}
          shape={fishData.shape || defaultFishData.shape}
          pattern={fishData.pattern || defaultFishData.pattern}
          size={fishData.fishSize || defaultFishData.fishSize}
          comments={fishData.comments || defaultFishData.comments}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerIconButton}
          onPress={() => {
            /* Navigate to Screen */
          }}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8McVVj1kitRpYQA/frame.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerIconButton}
          onPress={() => {
            /* Navigate to Screen */
          }}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8McVVj1kitRpYQA/frame-3.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerIconButton}
          onPress={() => {
            /* Navigate to Screen */
          }}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8McVVj1kitRpYQA/frame-2.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // ScrollView
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center", // Center content horizontally
    paddingBottom: 20, // Padding at the bottom
    width: "100%", // Take full width
    padding: 16,
  },

  // Fish Profile Header Styles
  headerContainer: {
    width: "100%", // Take full width
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "transparent", // Or set your desired background
  },
  headerFishImage: {
    width: "100%",
    height: 200,
    marginBottom: 8,
  },
  headerFishName: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },

  // Fish Details Styles
  detailsContainer: {
    width: "100%", // Take full width
    padding: 8,
    backgroundColor: "transparent", // Or set your desired background
    marginTop: 20, // Add top margin
  },
  detailsContent: {
    flexDirection: "column",
    alignItems: "flex-start", // Align text to the left
    justifyContent: "center",
  },
  detailsText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    lineHeight: 24,
  },

  // Current Status Styles
  statusContainer: {
    width: "100%",
    padding: 8,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "transparent", // Or set your desired background
    marginVertical: 16, // Add vertical margin
  },
  statusText: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
  },
  prizeText: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },

  // Status History Styles
  historyContainer: {
    width: "100%",
    padding: 16,
    backgroundColor: "#fff", // Or set your desired background
  },
  historyTitle: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  timelineContainer: {
    flexDirection: "column",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  timelineDot: {
    width: 10, // Slightly larger dot
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000000",
    marginTop: 6,
  },
  timelineLine: {
    position: "absolute",
    left: 4, // Adjust position based on dot size
    top: 16, // Adjust position based on dot size
    width: 2,
    height: 24,
    backgroundColor: "#000000",
  },
  timelineContent: {
    marginLeft: 12,
    flex: 1,
  },
  timelineText: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#030303",
  },
  timelineTime: {
    fontWeight: "400",
  },

  // Detailed Results Styles
  resultsContainer: {
    width: "100%", // Take full width
    padding: 16,
    backgroundColor: "#fff", // Or your desired background
    flexDirection: "column",
    alignItems: "flex-start", // Align content to the left
    justifyContent: "flex-start",
  },
  resultsTitle: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 10,
  },
  resultsContent: {
    width: "100%", // Ensure the content stretches to fill the container
    flexDirection: "column",
    marginBottom: 10,
  },
  resultsText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "400",
    color: "#000000",
    marginBottom: 5,
  },
  commentsContainer: {
    marginTop: 10,
    width: "100%",
  },

  // Footer Styles
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    height: 70,
    backgroundColor: "transparent", // Or your desired background
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerIconButton: {
    padding: 10,
  },
  footerIcon: {
    width: 28, // Consistent size
    height: 28,
    resizeMode: "contain",
  },
});

export default FishStatus;
