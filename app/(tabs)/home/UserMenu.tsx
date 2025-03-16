// app/(tabs)/home/UserMenu.tsx
import { router } from "expo-router"; // Import router from expo-router
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UserMenuProps {
  onNavigate?: (route: string) => void;
  activeRoute?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({
  onNavigate = () => {},
  activeRoute = "mykoi",
}) => {
  const menuItems = [
    {
      id: "koilist",
      label: "My Koi",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame.png",
    },
    // {
    //   id: "cart",
    //   label: "Cart",
    //   icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-2.png",
    // },
    {
      id: "notification",
      label: "Notification",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-3.png",
    },
    // {
    //   id: "dashboard",
    //   label: "Dashboard",
    //   icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-4.png",
    // },
    // {
    //   id: "transactions",
    //   label: "Transactions",
    //   icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
    // },
    {
      id: "myorders",
      label: "My Orders",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
    },
    {
      id: "profile",
      label: "User Profile",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
    },
    {
      id: "competitionsjoined",
      label: "Competitions Joined",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
    },
  ];

  // Function to handle navigation
  const handleNavigation = (routeId: string) => {
    // Call the onNavigate prop for backward compatibility
    onNavigate(routeId);

    // Handle navigation based on route ID
    switch (routeId) {
      case "koilist":
        router.push("/(user)/KoiList");
        break;
      case "notification":
        router.push("/(user)/Notification");
        break;
      // case "cart":
      //   router.push("/(user)/Cart");
      //   break;
      case "profile":
        router.push("/(user)/UserProfile");
        break;
      case "transactions":
        router.push("/(user)/Transactions");
        break;
      case "myorders":
        router.push("/(user)/MyOrders");
        break;
      case "competitionsjoined":
        router.push("/(user)/CompetitionJoined");
        break;
      // default:
      //   // Handle default case or mykoi route
      //   router.push("/(user)/MyKoi");
      //   break;
    }
    // Add other navigation cases as needed
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              /* Add search functionality here if needed */
            }}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-6.png",
              }}
              style={styles.searchIcon}
            />
          </TouchableOpacity>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/group-6.png",
            }}
            style={styles.profileImage}
          />
        </View>
      </View>
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              activeRoute === item.id && styles.activeMenuItem,
            ]}
            onPress={() => handleNavigation(item.id)}>
            <Image source={{ uri: item.icon }} style={styles.menuIcon} />
            <Text
              style={[
                styles.menuText,
                activeRoute === item.id && styles.activeMenuText,
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Poppins",
    color: "#030303",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchButton: {
    padding: 8,
  },
  searchIcon: {
    width: 18,
    height: 18,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  menuContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  activeMenuItem: {
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#bdbdbd",
  },
  menuIcon: {
    width: 20,
    height: 20,
  },
  menuText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#030303",
  },
  activeMenuText: {
    color: "#0056b3",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E6E6E6",
  },
  bottomNavItem: {
    padding: 8,
  },
  bottomNavIcon: {
    width: 28,
    height: 28,
  },
});

export default UserMenu;
