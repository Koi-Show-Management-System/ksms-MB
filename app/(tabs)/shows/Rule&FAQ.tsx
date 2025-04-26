// RuleAndFAQ.tsx
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Interfaces ---
interface FAQItem {
  question: string;
  answer: string;
}

// --- Rules Section Component ---
const RulesSection: React.FC = () => {
  const rules = [
    "Entry fee is $5/koi. Donations are welcome.",
    "Team uploads for $10/koi.",
    "Open to koi lovers including hobbyists and breeders.",
    "Entrants must be from the Americas to win awards.",
    "Entries must use personal names, not business names.",
    "Images and information must be owned by the entrant.",
    "No breeder information in submissions.",
    "Entries must be pre-approved by organizers.",
    "Enhancements of images/videos are not allowed once published.",
    "Organizer holds rights to use images/information for marketing.",
  ];

  return (
    <View style={styles.rulesSection}>
      <Text style={styles.rulesSectionTitle}>Rules & Regulations</Text>
      <View style={styles.rulesList}>
        {rules.map((rule, index) => (
          <Text key={index} style={styles.ruleText}>
            {rule}
          </Text>
        ))}
      </View>
    </View>
  );
};

// --- Entering Koi Section Component ---
const EnteringKoiSection: React.FC = () => {
  return (
    <View style={styles.enteringSection}>
      <Text style={styles.enteringSectionTitle}>Entering Koi in Show</Text>
      <Text style={styles.entryText}>
        Submit Koi Name, Description, Size, and Category.{"\n"}
        Upload up to 3 koi pictures and 1 video.{"\n"}
        Provide contact information.{"\n"}
        Categories include Variety and Size.
      </Text>
    </View>
  );
};

// --- FAQ Section Component ---
const FAQSection: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Data structure for rules and FAQs
  const data = [
    {
      title: "General Rules",
      data: [
        {
          id: "g1",
          question: "Who can enter the competition?",
          answer:
            "Any Koi hobbyist or breeder may enter Koi in the competition, provided the fish meets eligibility requirements and proper registration procedures are followed.",
        },
        {
          id: "g2",
          question: "What are the entry requirements?",
          answer:
            "All Koi must be owned by the registrant for at least 6 months prior to the show. Each entry must include complete registration information and appropriate entry fees.",
        },
        {
          id: "g3",
          question: "How many fish can I enter?",
          answer:
            "Each participant may enter up to 5 Koi per size and variety category, with a maximum of 15 total entries per participant.",
        },
      ],
    },
    {
      title: "Judging Criteria",
      data: [
        {
          id: "j1",
          question: "How are Koi judged?",
          answer:
            "Koi are judged on body conformation, skin quality, pattern, color intensity and contrast, and overall impression. Different varieties have specific criteria relevant to their classification.",
        },
        {
          id: "j2",
          question: "Who will judge the competition?",
          answer:
            "Judging will be conducted by certified judges from the All Japan Nishikigoi Promotion Association (AJNPA) and the Zen Nippon Airinkai (ZNA).",
        },
      ],
    },
    {
      title: "Size Categories",
      data: [
        {
          id: "s1",
          question: "What are the size classifications?",
          answer:
            "Size 1: Under 20cm\nSize 2: 20-30cm\nSize 3: 30-40cm\nSize 4: 40-50cm\nSize 5: 50-60cm\nSize 6: Over 60cm",
        },
      ],
    },
    {
      title: "Awards & Recognition",
      data: [
        {
          id: "a1",
          question: "What awards will be given?",
          answer:
            "Awards include Grand Champion, Adult Champion, Young Champion, and 1st, 2nd, and 3rd place in each size and variety category. Special awards for Best in Variety will also be presented.",
        },
        {
          id: "a2",
          question: "When will winners be announced?",
          answer:
            "Judging will take place on the second day of the show, with awards presented during the evening ceremony.",
        },
      ],
    },
    {
      title: "Handling & Care",
      data: [
        {
          id: "h1",
          question: "How are the Koi handled during judging?",
          answer:
            "Only trained staff will handle Koi during the judging process. Fish are carefully netted and placed in viewing bowls for judging, with minimal handling to reduce stress.",
        },
        {
          id: "h2",
          question: "What health precautions are in place?",
          answer:
            "All tanks are equipped with filtration and aeration systems. Water quality is monitored continuously. Emergency veterinary services are available on-site.",
        },
      ],
    },
  ];

  // Render a section header
  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  // Render an item (question and answer)
  const renderItem = ({
    item,
  }: {
    item: { id: string; question: string; answer: string };
  }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => toggleSection(item.id)}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{item.question}</Text>
        <Image
          source={{
            uri: expandedSections[item.id]
              ? "https://dashboard.codeparrot.ai/api/image/Z6Ibg3avl-LWpeaf/up-arrow.png"
              : "https://dashboard.codeparrot.ai/api/image/Z6Ibg3avl-LWpeaf/down-arrow.png",
          }}
          style={styles.arrowIcon}
        />
      </View>

      {expandedSections[item.id] && (
        <Text style={styles.answerText}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.faqSection}>
      <Text style={styles.faqTitle}>FAQ</Text>
      <View style={styles.faqContainer}>
        <SectionList
          sections={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={true}
        />
      </View>
    </View>
  );
};

// --- Main Component ---
const RuleAndFAQ: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <RulesSection />
        <EnteringKoiSection />
        <FAQSection />
      </ScrollView>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // Light grey background
  },

  // ScrollView
  scrollViewContent: {
    flexGrow: 1, // Ensure it takes up all available space
    paddingHorizontal: 16, // Add horizontal padding
    paddingBottom: 60, // Giảm padding để loại bỏ khoảng trắng thừa nhưng vẫn đảm bảo nội dung không bị che bởi footer
    paddingTop: 16, // Add padding at the top since we removed the header
  },

  // Rules Section Styles
  rulesSection: {
    marginTop: 24,
    width: "100%",
  },
  rulesSectionTitle: {
    fontSize: 18, // Slightly smaller title
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  rulesList: {
    gap: 8,
    width: "100%",
  },
  ruleText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },

  // Entering Koi Section Styles
  enteringSection: {
    marginTop: 24,
    width: "100%",
  },
  enteringSectionTitle: {
    fontSize: 18, // Consistent with other sections
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  entryText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 24,
  },

  // FAQ Section Styles
  faqSection: {
    width: "100%",
    paddingVertical: 16, // Add some vertical padding
    paddingHorizontal: 5, // Add some vertical padding
    backgroundColor: "inherit",
    marginTop: 24,
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000000",
  },
  faqContainer: {
    width: "100%",
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionHeaderText: {
    fontSize: 18,
    fontFamily: "Roboto",
    fontWeight: "700",
    color: "#111827",
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionText: {
    fontSize: 16,
    fontFamily: "Roboto",
    fontWeight: "500",
    color: "#111827",
    flex: 1,
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
  answerText: {
    fontSize: 14,
    fontFamily: "Roboto",
    color: "#4B5563",
    marginTop: 12,
    lineHeight: 20,
  },
});

export default RuleAndFAQ;
