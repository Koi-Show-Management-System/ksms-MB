import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../services/api'; // Đảm bảo đường dẫn đúng
import {
  VotingRegistration,
  GetVotingRegistrationsResponse,
  VotingErrorResponse,
  KoiShowVotingProps,
  VotingResultItem,
  GetVotingResultResponse,
  KoiMedia
} from '../../../types/voting';

// --- Component con để hiển thị một thí sinh ---
interface ContestantItemProps {
  item: VotingRegistration;
  onVote: (registrationId: string) => void;
  isVotingEnabled: boolean;
  hasVoted: boolean; // Trạng thái chung cho biết user đã vote trong show này chưa
}

const ContestantItem: React.FC<ContestantItemProps> = React.memo(({ item, onVote, isVotingEnabled, hasVoted }) => {
  const handleVotePress = useCallback(() => {
    if (isVotingEnabled && !hasVoted) {
      Alert.alert(
        "Xác nhận bình chọn",
        `Bạn có chắc muốn bình chọn cho ${item.koiName} (${item.registrationNumber})?`,
        [
          { text: "Hủy", style: "cancel" },
          { text: "Bình chọn", onPress: () => onVote(item.registrationId) }
        ]
      );
    }
  }, [item, onVote, isVotingEnabled, hasVoted]);

  const firstImage = item.koiMedia.find((media: KoiMedia) => media.mediaType === 'Image');

  return (
    <View style={styles.contestantCard}>
      {firstImage ? (
        <Image source={{ uri: firstImage.mediaUrl }} style={styles.contestantImage} resizeMode="cover" />
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialIcons name="image" size={40} color="#ccc" />
        </View>
      )}
      <View style={styles.contestantInfo}>
        <Text style={styles.koiName}>{item.koiName} ({item.registrationNumber})</Text>
        <Text style={styles.ownerName}>Chủ sở hữu: {item.ownerName}</Text>
        <Text style={styles.categoryName}>Hạng mục: {item.categoryName}</Text>
        <Text style={styles.detailsText}>Size: {item.size}cm - Giống: {item.koiVariety}</Text>
      </View>
      {isVotingEnabled && (
         <TouchableOpacity
           style={[styles.voteButton, hasVoted && styles.disabledVoteButton]}
           onPress={handleVotePress}
           disabled={hasVoted}
         >
           <MaterialIcons name="how-to-vote" size={20} color="#fff" />
           <Text style={styles.voteButtonText}>{hasVoted ? "Đã bình chọn" : "Bình chọn"}</Text>
         </TouchableOpacity>
       )}
    </View>
  );
});

// --- Component con để hiển thị kết quả ---
interface ResultItemProps {
  item: VotingResultItem;
}
const ResultItem: React.FC<ResultItemProps> = React.memo(({ item }) => {
 const firstImage = item.koiMedia.find((media: KoiMedia) => media.mediaType === 'Image');
 const rank = item.rank;

 return (
    <View style={[styles.resultCard, rank === 1 && styles.firstPlace]}>
       {rank !== null && rank > 0 && (
          <View style={[styles.rankBadge, rank > 3 && styles.rankBadgeOther]}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
       )}
       {firstImage ? (
         <Image source={{ uri: firstImage.mediaUrl }} style={styles.resultImage} resizeMode="cover" />
       ) : (
         <View style={styles.placeholderResultImage}>
           <MaterialIcons name="image" size={30} color="#ccc" />
         </View>
       )}
       <View style={styles.resultInfo}>
         <Text style={styles.resultKoiName}>{item.koiName} ({item.registrationNumber})</Text>
         <Text style={styles.resultOwnerName}>Chủ sở hữu: {item.ownerName}</Text>
         {item.award ? (
            <View style={styles.awardContainer}>
              <MaterialIcons name="emoji-events" size={16} color="#ffc107" />
              <Text style={styles.awardText}>{item.award.name}</Text>
            </View>
          ) : (
            <Text style={styles.resultVoteCount}>Số phiếu: {item.voteCount}</Text>
          )}
       </View>
     </View>
 );
});


// --- Component chính ---
export function KoiShowVoting({ showId }: KoiShowVotingProps) {
  const [registrations, setRegistrations] = useState<VotingRegistration[]>([]);
  const [results, setResults] = useState<VotingResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [votingStatus, setVotingStatus] = useState<'loading' | 'not_started' | 'open' | 'voted' | 'closed' | 'error'>('loading');
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);
  const [hasUserVoted, setHasUserVoted] = useState<boolean>(false); // Giả sử ban đầu là chưa vote

  // Hàm tải dữ liệu ban đầu (logic mới: check kết quả trước)
  const loadInitialData = useCallback(async () => {
    console.log(`[${new Date().toISOString()}] Loading initial data for show: ${showId}`);
    setIsLoading(true);
    setError(null);
    setVotingStatus('loading');

    try {
      // 1. Thử lấy kết quả trước
      console.log(`[${new Date().toISOString()}] Attempting to fetch results...`);
      const responseResult = await api.get<GetVotingResultResponse | VotingErrorResponse>(`/api/v1/vote/result/${showId}`);

      if (responseResult.status === 200 && 'data' in responseResult.data) {
        // Thành công: Hiển thị kết quả
        console.log(`[${new Date().toISOString()}] Results fetched successfully.`);
        const sortedResults = responseResult.data.data.sort((a: VotingResultItem, b: VotingResultItem) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || b.voteCount - a.voteCount);
        setResults(sortedResults);
        setVotingStatus('closed');
        // Dừng ở đây nếu có kết quả
      } else {
        // Nếu không thành công (bao gồm 400, 404, 500...), coi như chưa có kết quả và thử lấy danh sách vote
        console.log(`[${new Date().toISOString()}] Results API failed or returned no data (Status: ${responseResult.status}). Attempting to fetch registrations...`);
        await fetchRegistrationsInternal(); // Gọi hàm nội bộ để lấy danh sách vote
      }
    } catch (errResult: any) {
      // Bất kỳ lỗi nào khi gọi API kết quả (network error, server error không trả về JSON hợp lệ...)
      const errorResponse = errResult.response;
      const errorData = errorResponse?.data;
      const errorStatus = errorResponse?.status;
      console.warn(`[${new Date().toISOString()}] Error fetching results: Status ${errorStatus}`, errorData || errResult.message);
      // Khi API kết quả lỗi, thử lấy danh sách vote
      console.log(`[${new Date().toISOString()}] Error fetching results. Attempting to fetch registrations...`);
      await fetchRegistrationsInternal(); // Gọi hàm nội bộ để lấy danh sách vote
    } finally {
      // Đảm bảo isLoading luôn được set false cuối cùng, sau khi tất cả các API call (nếu có) hoàn tất
      console.log(`[${new Date().toISOString()}] Finished loading initial data flow, setting isLoading to false.`);
      setIsLoading(false);
    }
  }, [showId]); // Chỉ phụ thuộc vào showId

  // Hàm nội bộ để lấy danh sách đăng ký (chỉ gọi khi fetchResults thất bại)
  const fetchRegistrationsInternal = async () => {
      try {
          const responseReg = await api.get<GetVotingRegistrationsResponse | VotingErrorResponse>(`/api/v1/vote/get-registration-for-voting/${showId}`);

          if (responseReg.status === 200 && 'data' in responseReg.data) {
            console.log(`[${new Date().toISOString()}] Registrations fetched successfully.`);
            setRegistrations(responseReg.data.data);
            // TODO: Kiểm tra xem user đã vote chưa
            // const userVoted = checkIfUserHasVoted(responseReg.data.data);
            // setHasUserVoted(userVoted);
            // setVotingStatus(userVoted ? 'voted' : 'open');
            setVotingStatus('open'); // Tạm thời
          } else if (responseReg.status === 400 && 'Error' in responseReg.data && responseReg.data.Error === "Chức năng bình chọn chưa được kích hoạt") {
            console.log(`[${new Date().toISOString()}] Voting registration not activated yet.`);
            setVotingStatus('not_started');
          } else {
             const regErrorMsg = (responseReg.data as VotingErrorResponse)?.Error || 'Lỗi không xác định khi lấy danh sách đăng ký.';
             console.error(`[${new Date().toISOString()}] Unknown error fetching registrations:`, responseReg.data);
             setError(regErrorMsg);
             setVotingStatus('error');
          }
        } catch (errReg: any) {
          const regErrorData = errReg.response?.data;
          console.error(`[${new Date().toISOString()}] Error fetching registrations:`, regErrorData || errReg.message);
          setError(regErrorData?.Error || 'Đã xảy ra lỗi khi tải dữ liệu bình chọn.');
          setVotingStatus('error');
        }
  };


  // useEffect gọi hàm tải dữ liệu ban đầu
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleVote = useCallback(async (registrationId: string) => {
    if (isSubmittingVote || hasUserVoted) return;

    setIsSubmittingVote(true);
    try {
      console.log(`[${new Date().toISOString()}] Submitting vote for registrationId: ${registrationId}`);
      const response = await api.post(`/api/v1/vote/create/${registrationId}`);
      if (response.status === 200 || response.status === 201) {
        console.log(`[${new Date().toISOString()}] Vote submitted successfully.`);
        setVotingStatus('voted');
        setHasUserVoted(true);
        Alert.alert("Thành công", "Cảm ơn bạn đã bình chọn!");
      } else {
         const voteErrorMsg = response.data?.Error || "Không thể gửi bình chọn. Vui lòng thử lại.";
         console.error(`[${new Date().toISOString()}] Error submitting vote: Status ${response.status}`, voteErrorMsg);
         Alert.alert("Lỗi", voteErrorMsg);
      }
    } catch (err: any) {
      const voteErrorData = err.response?.data;
      console.error(`[${new Date().toISOString()}] Catch Error submitting vote:`, voteErrorData || err.message);
      Alert.alert("Lỗi", voteErrorData?.Error || "Đã xảy ra lỗi khi gửi bình chọn.");
    } finally {
      setIsSubmittingVote(false);
    }
  }, [isSubmittingVote, hasUserVoted]);

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#0000ff" style={styles.centered} />;
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (votingStatus) {
      case 'not_started':
        return (
          <View style={styles.centeredMessage}>
            <MaterialIcons name="timer-off" size={64} color="#6c757d" />
            <Text style={styles.infoText}>Chức năng bình chọn chưa được kích hoạt.</Text>
            <Text style={styles.subInfoText}>Vui lòng quay lại sau.</Text>
          </View>
        );
      case 'open':
        if (registrations.length === 0) {
          return (
            <View style={styles.centeredMessage}>
              <MaterialIcons name="sentiment-dissatisfied" size={64} color="#6c757d" />
              <Text style={styles.infoText}>Chưa có thí sinh nào để bình chọn.</Text>
            </View>
          );
        }
        return (
          <FlatList
            data={registrations}
            renderItem={({ item }) => (
              <ContestantItem
                item={item}
                onVote={handleVote}
                isVotingEnabled={true}
                hasVoted={hasUserVoted}
              />
            )}
            keyExtractor={(item) => item.registrationId}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={<Text style={styles.listHeader}>Chọn thí sinh bạn yêu thích</Text>}
            extraData={isSubmittingVote || hasUserVoted}
          />
        );
      case 'voted':
        return (
          <View style={styles.centeredMessage}>
            <MaterialIcons name="check-circle-outline" size={64} color="#2ecc71" />
            <Text style={styles.infoText}>Cảm ơn bạn đã bình chọn!</Text>
            <Text style={styles.subInfoText}>Kết quả sẽ được công bố sau khi thời gian bình chọn kết thúc.</Text>
             <TouchableOpacity style={styles.viewResultsButton} onPress={loadInitialData}>
               <Text style={styles.viewResultsButtonText}>Kiểm tra kết quả</Text>
             </TouchableOpacity>
          </View>
        );
      case 'closed':
         if (results.length === 0) {
             return (
               <View style={styles.centeredMessage}>
                 <MaterialIcons name="bar-chart" size={64} color="#6c757d" />
                 <Text style={styles.infoText}>Kết quả bình chọn chưa có hoặc đang được cập nhật.</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
                     <Text style={styles.retryButtonText}>Tải lại kết quả</Text>
                  </TouchableOpacity>
               </View>
             );
           }
        return (
          <FlatList
            data={results}
            renderItem={({ item }) => <ResultItem item={item} />}
            keyExtractor={(item) => item.registrationId}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={<Text style={styles.listHeader}>Kết quả bình chọn</Text>}
          />
        );
      case 'loading': // Fallback
         return <ActivityIndicator size="large" color="#0000ff" style={styles.centered} />;
      case 'error': // Fallback
       return (
         <View style={styles.centered}>
           <MaterialIcons name="error-outline" size={64} color="#e74c3c" />
           <Text style={styles.errorText}>{error || 'Đã xảy ra lỗi không xác định.'}</Text>
           <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
             <Text style={styles.retryButtonText}>Thử lại</Text>
           </TouchableOpacity>
         </View>
       );
      default:
         console.warn(`[${new Date().toISOString()}] Reached default case in renderContent with status: ${votingStatus}`);
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      {isSubmittingVote && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingOverlayText}>Đang gửi bình chọn...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
   centeredMessage: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
     backgroundColor: '#fff',
     margin: 15,
     borderRadius: 10,
     shadowColor: "#000",
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.1,
     shadowRadius: 3,
     elevation: 3,
   },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  infoText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    textAlign: 'center',
  },
   subInfoText: {
     marginTop: 8,
     fontSize: 14,
     color: '#6c757d',
     textAlign: 'center',
   },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  listHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 4,
    color: '#343a40',
  },
  contestantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  contestantImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contestantInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  koiName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  detailsText: {
    fontSize: 13,
    color: '#6c757d',
  },
  voteButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10, // Khoảng cách với phần info
    minWidth: 110, // Đảm bảo nút có độ rộng tối thiểu
  },
  disabledVoteButton: {
    backgroundColor: '#6c757d', // Màu xám khi bị vô hiệu hóa
  },
  voteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
   viewResultsButton: {
     marginTop: 20,
     backgroundColor: '#17a2b8',
     paddingVertical: 10,
     paddingHorizontal: 20,
     borderRadius: 5,
   },
   viewResultsButtonText: {
     color: '#ffffff',
     fontSize: 16,
     fontWeight: 'bold',
   },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingOverlayText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 16,
  },
  // Styles for Result List
   resultCard: {
     backgroundColor: '#ffffff',
     borderRadius: 10,
     marginBottom: 12,
     padding: 15,
     flexDirection: 'row',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#dee2e6',
     position: 'relative', // Cho rank badge
   },
   firstPlace: {
     borderColor: '#ffc107', // Highlight top 1
     borderWidth: 2,
     backgroundColor: '#fffcf1',
   },
   rankBadge: {
     position: 'absolute',
     top: -10,
     left: -10,
     backgroundColor: '#dc3545',
     width: 28,
     height: 28,
     borderRadius: 14,
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 1,
     borderWidth: 1.5, // Dày hơn chút
     borderColor: '#fff',
     shadowColor: "#000", // Thêm shadow cho nổi bật
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.3,
     shadowRadius: 1,
     elevation: 3,
   },
   rankBadgeOther: { // Style khác cho rank > 3
     backgroundColor: '#6c757d', // Màu xám
     width: 24,
     height: 24,
     borderRadius: 12,
   },
   rankText: {
     color: '#fff',
     fontWeight: 'bold',
     fontSize: 12, // Giảm size chữ rank
   },
   resultImage: {
     width: 60,
     height: 60,
     borderRadius: 30, // Hình tròn
     marginRight: 15,
   },
   placeholderResultImage: {
     width: 60,
     height: 60,
     borderRadius: 30,
     marginRight: 15,
     backgroundColor: '#e9ecef',
     justifyContent: 'center',
     alignItems: 'center',
   },
   resultInfo: {
     flex: 1,
     justifyContent: 'center', // Căn giữa thông tin nếu ít
    },
   resultKoiName: {
     fontSize: 15,
     fontWeight: 'bold',
     color: '#212529',
     marginBottom: 2,
   },
   resultOwnerName: {
     fontSize: 13,
     color: '#6c757d',
     marginTop: 2,
   },
   resultVoteCount: {
     fontSize: 14,
     fontWeight: '600',
     color: '#007bff',
     marginTop: 4,
  },
  awardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: '#fff3cd', // Nền vàng nhẹ cho giải thưởng
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignSelf: 'flex-start', // Chỉ chiếm độ rộng cần thiết
  },
  awardText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#856404', // Màu chữ đậm hơn
   },
});

export default KoiShowVoting;