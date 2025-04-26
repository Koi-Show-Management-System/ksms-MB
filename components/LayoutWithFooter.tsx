import { usePathname } from "expo-router";
import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "./Footer";

interface LayoutWithFooterProps {
  children: ReactNode;
  showFooter?: boolean;
}

// Hàm helper để xác định activeTab dựa vào đường dẫn hiện tại
const getActiveTabFromPath = (
  path: string
): "home" | "notifications" | "camera" | "profile" | "shows" | "blog" => {
  if (path.includes("/home")) return "home";
  if (path.includes("/Notification")) return "notifications";
  if (path.includes("/shows")) return "shows";
  if (path.includes("/blog")) return "blog";
  if (
    path.includes("/UserProfile") ||
    path.includes("/Transactions") ||
    path.includes("/TicketDetail") ||
    path.includes("/TicketCheckin") ||
    path.includes("/OrderDetail") ||
    path.includes("/KoiList") ||
    path.includes("/CompetitionTicket") ||
    path.includes("/CompetitionJoined")
  )
    return "profile";

  // Mặc định trả về home
  return "home";
};

const LayoutWithFooter: React.FC<LayoutWithFooterProps> = ({
  children,
  showFooter = true,
}) => {
  const pathname = usePathname();
  const activeTab = getActiveTabFromPath(pathname);
  // Không cần theo dõi keyboardVisible ở đây nữa nếu Footer tự ẩn khi bàn phím mở

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Content sẽ tự động chiếm không gian còn lại */}
      <View style={styles.content}>{children}</View>
      {/* Footer được hiển thị độc lập */}
      {showFooter && <Footer activeTab={activeTab} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FFFFFF", // Đảm bảo nền trắng cho toàn bộ container
  },
  content: {
    flex: 1,
    paddingBottom: 60, // Giảm padding để loại bỏ khoảng trắng thừa nhưng vẫn đảm bảo nội dung không bị che bởi footer
  },
});

export default LayoutWithFooter;
