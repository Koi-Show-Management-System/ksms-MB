// Transactions.tsx
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { translateStatus } from "../../utils/statusTranslator"; // Import hàm dịch mới

interface Transaction {
  id: string;
  title: string;
  amount: string;
  date: string;
  status: "Completed" | "Pending" | "Failed";
}

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  // Helper function để xác định style dựa trên trạng thái
  const getStatusStyle = () => {
    if (transaction.status === "Completed") {
      return styles.completed;
    } else if (transaction.status === "Pending") {
      return styles.pending;
    } else {
      return styles.failed;
    }
  };
  
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{transaction.title}</Text>
        <Text
          style={[
            styles.cardAmount,
            transaction.status === "Failed" && styles.failedAmount,
          ]}>
          {transaction.amount}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardDate}>{transaction.date}</Text>
        <Text style={[styles.cardStatus, getStatusStyle()]}>
          {translateStatus(transaction.status)}
        </Text>
      </View>
    </View>
  );
};

const Transactions: React.FC = () => {
  const transactions: Transaction[] = [
    {
      id: "1",
      title: "Add Koi",
      amount: "$5.00",
      date: "Oct 5, 2023",
      status: "Completed",
    },
    {
      id: "2",
      title: "Withdraw",
      amount: "-$10.00",
      date: "Oct 4, 2023",
      status: "Completed",
    },
    {
      id: "3",
      title: "Add Koi",
      amount: "$5.00",
      date: "Oct 3, 2023",
      status: "Pending",
    },
    {
      id: "4",
      title: "Top Up",
      amount: "$20.00",
      date: "Oct 2, 2023",
      status: "Completed",
    },
    {
      id: "5",
      title: "Add Koi",
      amount: "$5.00",
      date: "Oct 1, 2023",
      status: "Failed",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            /* Navigate back */
          }}
          style={styles.iconButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79KZHnogYAtZdZX/frame.png",
            }}
            style={styles.icon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity
          onPress={() => {
            /* Implement search */
          }}
          style={styles.iconButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79KZHnogYAtZdZX/frame-2.png",
            }}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={styles.transactionList}>
        {transactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Header Styles
  header: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#030303",
    flex: 1,
    textAlign: "center",
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  searchIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  // ScrollView Styles
  transactionList: {
    flexGrow: 1,
    width: "100%",
  },
  scrollViewContent: {
    alignItems: "center",
    paddingBottom: 80,
  },
  // Transaction Card Styles
  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#030303", // Consistent text color
  },
  cardAmount: {
    fontSize: 16,
    color: "#030303", // Consistent text color
  },
  failedAmount: {
    color: "red",
  },
  cardDate: {
    color: "#888",
    fontSize: 14,
  },
  cardStatus: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  completed: {
    color: "green",
  },
  pending: {
    color: "orange",
  },
  failed: {
    color: "red",
  },
  // Bottom Navigation Styles
  bottomNavigation: {
    width: "100%",
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});

export default Transactions;
