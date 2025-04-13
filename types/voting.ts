// types/voting.ts

export interface KoiMedia {
  id: string;
  mediaUrl: string;
  mediaType: "Image" | "Video";
}

export interface RoundInfo {
  tankNumber: string;
}

export interface VotingRegistration {
  registrationId: string;
  registrationNumber: string;
  registerName: string;
  categoryName: string;
  koiName: string;
  koiVariety: string;
  size: number;
  age: number;
  gender: string;
  bloodline: string;
  ownerName: string;
  koiMedia: KoiMedia[];
  roundInfo: RoundInfo;
  voteCount: number;
  award: string | null;
  // isVotedByUser?: boolean; // Uncomment if needed
}

export interface GetVotingRegistrationsResponse {
  data: VotingRegistration[];
  statusCode: number;
  message: string;
}

export interface VotingErrorResponse {
  StatusCode: number;
  Error: string;
  TimeStamp: string;
}

export interface VoteAward {
  name: string;
  awardType: string; // e.g., "peoples_choice"
  prizeValue: number | null;
}

export interface VotingResultItem {
  registrationId: string;
  registrationNumber: string;
  registerName: string; // Thêm nếu cần từ response
  categoryName: string; // Thêm nếu cần từ response
  koiName: string;
  koiVariety: string; // Thêm nếu cần từ response
  size?: number; // Thêm nếu cần từ response
  age?: number; // Thêm nếu cần từ response
  gender?: string; // Thêm nếu cần từ response
  bloodline?: string; // Thêm nếu cần từ response
  ownerName: string;
  koiMedia: KoiMedia[];
  voteCount: number;
  rank: number | null;
  award: VoteAward | null; // Cập nhật kiểu dữ liệu cho award
}

export interface GetVotingResultResponse {
  data: VotingResultItem[];
  statusCode: number;
  message: string;
}

export interface KoiShowVotingProps {
  showId: string;
}