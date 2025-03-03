// RuleAndFAQ.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon library

// --- Interfaces ---
interface FAQItem {
  question: string;
  answer: string;
}

// --- Header Component ---
const Header: React.FC = () => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => { /* Navigate Home */ }} style={styles.headerIconButton}>
        <Image
          source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z8YbIshTinWyM7HF/group-43.png' }}
          style={styles.headerHomeIcon}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Official Koi Show Rules</Text>
      <View style={styles.headerRightIcons}>
        <TouchableOpacity onPress={() => { /* Navigate Search */ }} style={styles.headerIconButton}>
          <Image
            source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z8YbIshTinWyM7HF/frame-4.png' }}
            style={styles.headerSearchIcon}
          />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z8YbIshTinWyM7HF/group-42.png' }}
          style={styles.headerProfileIcon}
        />
      </View>
    </View>
  );
};

// --- Rules Section Component ---
const RulesSection: React.FC = () => {
  const rules = [
    'Entry fee is $5/koi. Donations are welcome.',
    'Team uploads for $10/koi.',
    'Open to koi lovers including hobbyists and breeders.',
    'Entrants must be from the Americas to win awards.',
    'Entries must use personal names, not business names.',
    'Images and information must be owned by the entrant.',
    'No breeder information in submissions.',
    'Entries must be pre-approved by organizers.',
    'Enhancements of images/videos are not allowed once published.',
    'Organizer holds rights to use images/information for marketing.',
  ];

  return (
    <View style={styles.rulesSection}>
      <Text style={styles.rulesSectionTitle}>Rules & Regulations</Text>
      <View style={styles.rulesList}>
        {rules.map((rule, index) => (
          <Text key={index} style={styles.ruleText}>{rule}</Text>
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    { question: 'How to Enter Koi Show', answer: 'Register your koi today! Add a koi entry or sign up for an account. Use your dashboard to manage entries.' },
    { question: 'What Should I Say About My Koi?', answer: 'Describe your Koi\'s history, pattern information, age, and breeder information.' },
    { question: 'How Do I Take High Quality Koi Photos?', answer: 'Read our blog post about taking clear photos or videos of your koi.' },
  ];

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.faqSection}>
      <Text style={styles.faqTitle}>FAQ</Text>
      <View style={styles.faqContainer}>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            onPress={() => toggleExpand(index)}
          >
            <View style={styles.faqQuestionContainer}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqExpandIcon}>
                {expandedIndex === index ? '-' : '+'}
              </Text>
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// --- Footer Component ---
const Footer: React.FC = () => {
  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity style={styles.footerIconButton} onPress={() => { /* Navigate Home */ }}>
        <Icon name="home" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerIconButton} onPress={() => { /* Navigate Notifications */ }}>
        <Icon name="notifications" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerIconButton} onPress={() => { /* Navigate Profile */ }}>
        <Icon name="person" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

// --- Main Component ---
const RuleAndFAQ: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <RulesSection />
        <EnteringKoiSection />
        <FAQSection />
      </ScrollView>
      <Footer />
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light grey background
  },

  // ScrollView
    scrollViewContent: {
        flexGrow: 1, // Ensure it takes up all available space
        paddingHorizontal: 16, // Add horizontal padding
        paddingBottom: 20
    },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16, // Add horizontal padding
     marginTop: 20, // Add top margin
    width: '100%', // Take full width
    borderBottomWidth: 1, // Add a subtle bottom border
    borderBottomColor: '#E0E0E0', // Light grey border
  },
  headerIconButton: {
    padding: 8,
  },
  headerHomeIcon: {
    width: 47,
    height: 12,
  },
  headerSearchIcon: {
    width: 13,
    height: 13,
  },
  headerProfileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },

  // Rules Section Styles
  rulesSection: {
    marginTop: 24,
      width: '100%',
  },
  rulesSectionTitle: {
    fontSize: 18, // Slightly smaller title
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  rulesList: {
    gap: 8,
      width: '100%'
  },
  ruleText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },

  // Entering Koi Section Styles
  enteringSection: {
    marginTop: 24,
      width: '100%'
  },
  enteringSectionTitle: {
    fontSize: 18, // Consistent with other sections
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  entryText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 24,
  },

  // FAQ Section Styles
  faqSection: {
      width: '100%',
    paddingVertical: 16, // Add some vertical padding
      paddingHorizontal: 5, // Add some vertical padding
    backgroundColor: 'inherit',
      marginTop: 24
  },
  faqTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  faqContainer: {
      width: '100%',
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
      width: '100%'
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1, // Ensure text wraps if needed
  },
  faqExpandIcon: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 8,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
    // Footer Styles
  footerContainer: {
        width: '100%',
        height: 70,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0', // Lighter border color
        backgroundColor: '#FFFFFF', // White background
    },
  footerIconButton: {
        padding: 10,
    },

});

export default RuleAndFAQ;
