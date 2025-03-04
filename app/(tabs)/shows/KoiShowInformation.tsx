// KoiShowInformation.tsx

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getKoiShowById } from "../../../services/showService";

const KoiShowInformation = ({ id }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showData, setShowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Remove the expandedSections state as MUI Accordion manages its own state

  // Fetch show data
  useEffect(() => {
    const fetchShowData = async () => {
      try {
        setLoading(true);
        const data = await getKoiShowById(id);
        setShowData(data);
        setError("");
      } catch (err) {
        console.error("Failed to fetch show details:", err);
        setError("Failed to load show details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchShowData();
    } else {
      setError("No show ID provided");
      setLoading(false);
    }
  }, [id]);

  // If loading, show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading show details...</Text>
      </View>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <div className="koi-show-container">
      {/* Other content like show title, images, etc. */}

      {/* Event Details Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="event-details-content"
          id="event-details-header">
          <Typography fontWeight="bold">Event Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {/* Display event details from showData */}
            {showData?.eventDetails || "No details available"}
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Awards Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="awards-content"
          id="awards-header">
          <Typography fontWeight="bold">Awards</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {showData?.awards || "No award information available"}
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Rules & Regulations Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="rules-content"
          id="rules-header">
          <Typography fontWeight="bold">Rules & Regulations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{showData?.showRules || "No rules available"}</Typography>
        </AccordionDetails>
      </Accordion>

      {/* Entering Koi Section */}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="entering-koi-content"
          id="entering-koi-header">
          <Typography fontWeight="bold">Entering Koi in Show</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {showData?.enteringKoi || "No information available"}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

// Add these new styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: "#fff",
    padding: 16,
  },
  carouselContainer: {
    height: 232,
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  carouselControls: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    top: "50%",
    transform: [{ translateY: -16 }],
  },
  carouselButton: {
    width: 32,
    height: 32,
    backgroundColor: "#E5E5E5",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselButtonImage: {
    width: 16,
    height: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
    marginVertical: 16,
    fontFamily: "Poppins",
  },
  sectionContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 24, // Consistent spacing between sections
    backgroundColor: "#E5E5E5", // Added background color
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#E5E5E5", // Updated background color
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600", // Slightly less bold than the main title
    color: "#030303",
    fontFamily: "Lexend Deca",
  },
  arrow: {
    width: 14,
    height: 14,
  },
  sectionContent: {
    backgroundColor: "#E5E5E5", // Consistent white background for content
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    marginVertical: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  awardText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  specialAwardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  rulesContainer: {
    borderRadius: 8,
    paddingHorizontal: 0, // Consistent with other sections
    marginHorizontal: 16,
    marginBottom: 16, //Consistent Spacing
  },
  mainHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 16,
    paddingHorizontal: 16, //Consistent Spacing
    fontFamily: "Lexend Deca",
  },
  ruleText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    marginBottom: 8,
    fontFamily: "Lexend Deca",
    lineHeight: 20,
  },
  noteContainer: {
    backgroundColor: "#E5E5E5",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
  },
  noteText: {
    fontSize: 14,
    color: "#FF4433",
    fontFamily: "Lexend Deca",
    lineHeight: 20,
    fontStyle: "italic",
  },
  noteButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FFA500",
  },
  noteButtonText: {
    color: "#FFA500",
    fontSize: 14,
    fontFamily: "Lexend Deca",
    fontWeight: "500",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: 16,
  },
  actionButton: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    width: "48%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Roboto",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 12,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mt16: {
    marginTop: 16,
  },
  mb16: {
    marginBottom: 16,
  },
  py16: {
    paddingVertical: 16,
  },
  animatedSection: {
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
});

export default KoiShowInformation;
