import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Rules = () => {
  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quy tắc và Quy định</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Section 1 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. THÔNG TIN CHUNG</Text>

            <Text style={styles.subSectionTitle}>1.1 Tham Gia</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Số lượng tham gia triển lãm có hạn và dựa trên đăng ký trước.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Người tham gia cần tham khảo lịch trình chi tiết của triển lãm
                để biết thời gian và ngày cụ thể.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Việc đăng ký sẽ đóng lại khi đạt số lượng tối đa cho mỗi hạng
                mục.
              </Text>
            </View>

            <Text style={styles.subSectionTitle}>1.2 Đăng Ký</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Tất cả cá Koi tham gia phải được đăng ký trước sự kiện thông qua
                hệ thống đăng ký chính thức.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Mỗi người tham gia phải cung cấp thông tin chính xác về cá Koi
                của mình bao gồm giống, kích thước và tuổi.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Phí đăng ký phải được thanh toán đầy đủ trước ngày triển lãm.
              </Text>
            </View>
          </View>

          {/* Section 2 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. CẤU TRÚC CUỘC THI</Text>

            <Text style={styles.subSectionTitle}>2.1 Các Vòng Thi</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Mỗi hạng mục trong cuộc thi bao gồm ba giai đoạn đánh giá riêng
                biệt:
              </Text>
            </View>
            <View style={[styles.ruleItem, styles.indentedItem]}>
              <Text style={styles.bulletPoint}>-</Text>
              <Text style={styles.ruleText}>Vòng Sơ Khảo (1 vòng)</Text>
            </View>
            <View style={[styles.ruleItem, styles.indentedItem]}>
              <Text style={styles.bulletPoint}>-</Text>
              <Text style={styles.ruleText}>Vòng Đánh Giá Chính (2 vòng)</Text>
            </View>
            <View style={[styles.ruleItem, styles.indentedItem]}>
              <Text style={styles.bulletPoint}>-</Text>
              <Text style={styles.ruleText}>Vòng Chung Kết (1 vòng)</Text>
            </View>

            <Text style={styles.subSectionTitle}>2.2 Vòng Sơ Khảo</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Tất cả cá Koi đã đăng ký sẽ được đánh giá ban đầu.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Chấm điểm dựa trên tiêu chí Đạt/Không Đạt.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Giám khảo sẽ xác minh xem cá Koi có thuộc đúng hạng mục đã đăng
                ký hay không.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Chỉ những cá Koi đạt yêu cầu ở vòng này mới được tiếp tục vào
                Vòng Đánh Giá Chính.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Cá Koi bị loại phải được đưa ra khỏi khu vực thi đấu ngay lập
                tức.
              </Text>
            </View>

            <Text style={styles.subSectionTitle}>2.3 Vòng Đánh Giá Chính</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Bao gồm hai vòng chấm điểm riêng biệt, cả hai vòng đều áp dụng
                cùng một bộ tiêu chí đánh giá.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Tiêu chí chấm điểm chỉ phụ thuộc vào loại Vòng Đánh Giá Chính,
                không thay đổi giữa vòng 1 và vòng 2.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Cá sẽ được đánh giá dựa trên các tiêu chí cụ thể cho từng hạng
                mục.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Tiêu chí có thể bao gồm hình dáng cơ thể, kiểu mẫu màu sắc, chất
                lượng da và sức khỏe tổng thể.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Điểm số sẽ được trao theo hệ thống chấm điểm.
              </Text>
            </View>

            <Text style={styles.subSectionTitle}>2.4 Vòng Chung Kết</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Những cá Koi có điểm cao nhất từ Vòng Đánh Giá Chính sẽ thi đấu.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Đánh giá dựa trên các tiêu chí giống như Vòng Đánh Giá Chính.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Điểm số cuối cùng xác định người chiến thắng và thứ hạng trong
                mỗi hạng mục.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Quyết định của giám khảo là cuối cùng và không thể tranh cãi.
              </Text>
            </View>
          </View>

          {/* Section 3 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. TIÊU CHÍ CHẤM ĐIỂM</Text>

            <Text style={styles.subSectionTitle}>
              3.1 Tiêu Chí Đặc Thù Theo Hạng Mục
            </Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Mỗi hạng mục có tiêu chí chấm điểm riêng phù hợp với đặc điểm
                của giống cá.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Chi tiết về tiêu chí đặc thù theo hạng mục sẽ được cung cấp
                trong tài liệu triển lãm.
              </Text>
            </View>
          </View>

          {/* Section 4 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              4. TRÁCH NHIỆM CỦA NGƯỜI THAM GIA
            </Text>

            <Text style={styles.subSectionTitle}>4.1 Xử Lý và Chăm Sóc</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Người tham gia chịu trách nhiệm về việc xử lý đúng cách cá Koi
                của mình.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Tất cả cá Koi phải được thích nghi đầy đủ trước khi được đặt vào
                bể triển lãm.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Bất kỳ cá Koi nào có dấu hiệu bệnh tật hoặc căng thẳng sẽ bị
                loại khỏi cuộc thi.
              </Text>
            </View>

            <Text style={styles.subSectionTitle}>4.2 Quản Lý Thời Gian</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Người tham gia phải tuân thủ lịch trình đã công bố cho tất cả
                các vòng.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Đến muộn có thể dẫn đến việc bị loại khỏi cuộc thi.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Cá Koi phải sẵn sàng để chấm điểm trong khoảng thời gian quy
                định cho mỗi vòng.
              </Text>
            </View>
          </View>

          {/* Section 5 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. GIẢI THƯỞNG VÀ DANH HIỆU</Text>

            <Text style={styles.subSectionTitle}>
              5.1 Giải Thưởng Theo Hạng Mục
            </Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Giải thưởng sẽ được trao cho vị trí nhất, nhì và ba trong mỗi
                hạng mục.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Có thể có sự công nhận đặc biệt cho các cá thể xuất sắc.
              </Text>
            </View>
          </View>

          {/* Section 6 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. THÔNG TIN BỔ SUNG</Text>

            <Text style={styles.subSectionTitle}>6.1 Thay Đổi Lịch Trình</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Ban tổ chức có quyền điều chỉnh lịch trình nếu cần thiết.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Tất cả các thay đổi sẽ được thông báo kịp thời đến những người
                tham gia đã đăng ký.
              </Text>
            </View>

            <Text style={styles.subSectionTitle}>
              6.2 Tranh Chấp và Khiếu Nại
            </Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Bất kỳ mối quan ngại nào về việc chấm điểm phải được gửi bằng
                văn bản đến ban tổ chức.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Quyết định của ban tổ chức về các tranh chấp là cuối cùng.
              </Text>
            </View>
          </View>

          {/* Section 7 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. QUY TẮC ỨNG XỬ</Text>

            <Text style={styles.subSectionTitle}>7.1 Hành Vi Đạo Đức</Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Tất cả người tham gia phải thể hiện sự tôn trọng đối với những
                người tham gia khác, giám khảo và nhân viên.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Hành vi thiếu tinh thần thể thao có thể dẫn đến việc bị loại và
                đưa ra khỏi sự kiện.
              </Text>
            </View>

            <Text style={styles.subSectionTitle}>
              7.2 Chụp Ảnh và Truyền Thông
            </Text>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Chụp ảnh chỉ được phép ở những khu vực được chỉ định.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.ruleText}>
                Tất cả đại diện truyền thông phải có sự cho phép trước.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },
  ruleItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingRight: 8,
  },
  indentedItem: {
    marginLeft: 16,
  },
  bulletPoint: {
    width: 16,
    fontSize: 14,
    color: "#4B5563",
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },
});

export default Rules;
