# Phân tích Cấu trúc Project: ksms-MB

## Tổng quan Công nghệ & Cấu trúc

*   **Framework:** React Native với Expo (Managed workflow).
*   **Ngôn ngữ:** TypeScript.
*   **Routing:** Expo Router (File-based routing trong thư mục `app/`).
*   **State Management:**
    *   **Server State:** TanStack Query (`@tanstack/react-query`) là chủ đạo, quản lý dữ liệu từ API và caching (`context/QueryProvider.tsx`).
    *   **Global Client State:** React Context API cho các state cụ thể (`context/KoiShowContext.tsx`).
    *   **Local Storage:** `@react-native-async-storage/async-storage`.
*   **API Client:** Axios (`axios`).
*   **UI & Styling:**
    *   Sử dụng kết hợp các thư viện icon (`@expo/vector-icons`, `lucide-react`, `@mui/icons-material`, `react-native-vector-icons`, `expo-symbols`).
    *   Có hệ thống theme tùy chỉnh (dựa trên `ThemedText`, `ThemedView`, `hooks/useThemeColor.ts`, `constants/Colors.ts`). Hỗ trợ Dark/Light mode (`hooks/useColorScheme.ts`).
    *   Sử dụng các thư viện UI/animation như `react-native-reanimated`, `lottie-react-native`, `react-native-skeleton-placeholder`, `react-native-snap-carousel`.
    *   Có thể sử dụng `@emotion/styled` cho styled-components.
*   **Đa ngôn ngữ:** Có hỗ trợ (ít nhất là tiếng Việt - `assets/translate/vietnam.ts`).
*   **Build & Development:** EAS Build, Jest, ESLint, Yarn.

## Danh sách Module Chi tiết (Hiện tại)

1.  **Core Infrastructure & UI:**
    *   **Nền tảng:** React Native, Expo SDK (`expo`, `react`, `react-native`).
    *   **Routing:** Expo Router (`expo-router`) quản lý điều hướng dựa trên cấu trúc thư mục `app/`.
        *   Layouts chính: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(user)/_layout.tsx`, etc.
        *   Màn hình gốc: `app/index.tsx`, `app/Welcome.tsx`.
    *   **State Management (Server):** TanStack Query (`@tanstack/react-query`) và Provider (`context/QueryProvider.tsx`).
    *   **State Management (Client):** React Context API (`context/KoiShowContext.tsx`), AsyncStorage (`@react-native-async-storage/async-storage`).
    *   **API Client:** Axios (`axios`) (`services/api.ts`).
    *   **UI Components (`components/`):** Layouts, Theming, Navigation, Common Elements, Specialized UI, Icons, Animations.
    *   **Fonts:** `expo-font`, `@expo-google-fonts/poppins`.
    *   **Build & Dev Tools:** EAS (`eas.json`), Jest (`jest-expo`), ESLint (`expo lint`), TypeScript.

2.  **Authentication Module:**
    *   **Logic:** `services/authService.ts`.
    *   **UI (Dự kiến):** `app/(auth)/`.

3.  **Koi Show & Competition Module (Core Domain):**
    *   **Logic:** `services/competitionService.ts`, `services/contestantService.ts`, `services/koiProfileService.ts`, `services/koiShowService.ts`, `services/showService.ts`, `services/registrationService.ts`.
    *   **UI:** `app/(tabs)/shows/`, `app/(user)/CompetitionJoined.tsx`, `app/(user)/ParticipateResult.tsx`, `components/ticket/*`.
    *   **State:** `context/KoiShowContext.tsx`.

4.  **Payment Module:**
    *   **Logic:** `services/paymentService.ts`.
    *   **UI (Dự kiến):** `app/(payments)/`.

5.  **User Profile & Management Module:**
    *   **Logic:** Có thể một phần trong `services/koiProfileService.ts`.
    *   **UI:** `app/(user)/` (e.g., UserProfileScreen, SettingsScreen, `CompetitionJoined.tsx`, `ParticipateResult.tsx`).

6.  **File Handling Module:**
    *   **Logic:** `services/uploadService.ts`.
    *   **Libraries:** `expo-document-picker`, `expo-image-picker`, `expo-file-system`, `expo-media-library`, `react-native-blob-util`, `@config-plugins/react-native-blob-util`.
    *   **UI:** Tích hợp vào các màn hình khác.

7.  **Notification Module:**
    *   **Logic:** `services/notificationService.ts`.
    *   **Libraries (Tiềm năng):** `expo-notifications`.

8.  **Utilities Module:**
    *   **Logic:** `services/urlHandlerService.ts` (`expo-linking`).
    *   **Libraries:** `date-fns`, `expo-haptics`, `expo-web-browser`, `qrcode`, `react-native-webview`.

## Danh sách Module Tương lai (Dự kiến)

9.  **Livestream Module:**
    *   **Mục tiêu:** Xem trực tiếp các show/cuộc thi.
    *   **Logic:** `livestreamService.ts` (tích hợp dịch vụ streaming).
    *   **UI:** Màn hình xem live (`app/(tabs)/livestream/LiveViewScreen.tsx`?), trình phát video.
    *   **Libraries:** `expo-av` / thư viện video khác, SDK dịch vụ streaming.

10. **Voting Module:**
    *   **Mục tiêu:** Bình chọn cho thí sinh.
    *   **Logic:** `votingService.ts` (liên kết `contestantService`, `competitionService`).
    *   **UI:** Tích hợp vào màn hình thí sinh/livestream.
    *   **State:** Cập nhật `KoiShowContext` hoặc TanStack Query.

11. **Ranking Module:**
    *   **Mục tiêu:** Hiển thị bảng xếp hạng.
    *   **Logic:** `rankingService.ts` hoặc mở rộng service hiện có.
    *   **UI:** Màn hình bảng xếp hạng (`app/(tabs)/ranking/RankingScreen.tsx`?).

12. **News & Blog Module:**
    *   **Mục tiêu:** Cung cấp tin tức, bài viết.
    *   **Logic:** `contentService.ts` / `newsService.ts` (tích hợp CMS/API).
    *   **UI:** Danh sách (`app/(tabs)/news/NewsListScreen.tsx`?), chi tiết (`app/(tabs)/news/[articleId].tsx`?).
    *   **Libraries:** Render HTML/Markdown.

13. **Feedback Module:**
    *   **Mục tiêu:** Thu thập phản hồi người dùng.
    *   **Logic:** `feedbackService.ts`.
    *   **UI:** Màn hình gửi feedback (`app/(user)/feedback/FeedbackScreen.tsx`?).

## Biểu đồ Cấu trúc Tổng thể

```mermaid
graph LR
    subgraph Project [ksms-MB Project]
        direction TB
        subgraph CoreInfrastructure [Core Infrastructure]
            A(React Native + Expo)
            B(Expo Router) --> AppDir[(app/)]
            C(TanStack Query) --> ContextDir[(context/)]
            D(Axios) --> ServicesDir[(services/)]
            E(Theming/Styling) --> ComponentsDir[(components/)]
            F(TypeScript)
            G(Yarn + EAS Build)
        end

        subgraph CurrentModules [Current Modules]
            direction TB
            Auth[Authentication]
            KoiShow[Koi Show/Competition]
            Payments[Payments]
            User[User Profile]
            Files[File Handling]
            Notifications[Notifications]
            Utils[Utilities]
        end

        subgraph FutureModules [Future Modules (Planned)]
             direction TB
             Livestream[Livestreaming]
             Voting[Voting]
             Ranking[Ranking]
             NewsBlog[News & Blog]
             Feedback[Feedback]
         end

        CoreInfrastructure --> CurrentModules
        CoreInfrastructure --> FutureModules
        CurrentModules --> CoreInfrastructure
        FutureModules --> CoreInfrastructure # Future modules will also depend on core

        KoiShow --> Voting # Voting relates to KoiShow
        KoiShow --> Ranking # Ranking relates to KoiShow
        KoiShow --> Livestream # Livestream relates to KoiShow
    end