# Plan Update Dashboard Brand Manager Frontend

## Summary

- Thay dashboard Brand Manager hiện tại từ kiểu tự gom dữ liệu bằng `useStores` + nhiều request context từng store sang một snapshot API duy nhất: `GET /api/cms/brands/me/dashboard`.
- Giữ đúng feature-slice frontend hiện có: types/services/hooks/components nằm trong `features/brand`, shared chỉ dùng lại component/hook thật sự chung.
- Mapping 1:1 với backend DTO, enum dùng numeric value giống backend, FE chỉ map sang label/color để hiển thị.
- Realtime dùng `/hubs/store` hiện có, join `JoinBrandManagerRoomAsync(user.brandId)`, nghe `BrandDashboardChanged`, debounce rồi invalidate/refetch dashboard snapshot.

## Key Changes

- Data contract:
  - Thêm `brandDashboardTypes.ts` trong brand types, khai báo đầy đủ `BrandDashboardResponse`, `BrandDashboardFilter`, các enum: `BrandDashboardPeriodEnum`, `IotHealthStatusEnum`, `BrandStoreHealthStatusEnum`, `BrandStoreHealthReasonEnum`, `IotHealthReasonEnum`, `TrackScopeEnum`, `WalletLockStatusEnum`, `BrandDashboardChangedAreaEnum`.
  - Field TS dùng camelCase đúng response JSON: `brandId`, `generatedAtUtc`, `iotSpaceHealth`, `topTracks`, `contextIntelligence`, v.v.
  - `period` gửi numeric enum: `Day=1`, `Week=2`, `Month=3`, `Year=4`, `Custom=5`; không gửi string `"day"`.

- Service/hooks:
  - Thêm `brandDashboardService.getDashboard(filter)` gọi `/api/cms/brands/me/dashboard`.
  - Thêm `useBrandDashboard(filter)` dùng React Query, `staleTime: STALE_TIME.short`, query key dạng `['brand-dashboard', filter]`.
  - Thêm `useBrandDashboardRealtime({ brandId, filter })`: dùng `useSignalR('/hubs/store')`, invoke `JoinBrandManagerRoomAsync`, listen `BrandDashboardChanged`, debounce 500-1000ms rồi invalidate dashboard query.
  - Bỏ luồng cũ trong dashboard: `useStores`, `useQueries` context từng store, `storeService.getContextAggregate`, `getContextTimeSeries`.

- UI composition:
  - Giữ `BrandDashboard` page làm orchestration mỏng: filter state, query hook, realtime hook, layout.
  - Tách component trong `Dashboard/components`: `DashboardHero`, `PeriodFilterBar`, `OverviewKpiGrid`, `StoreHealthPanel`, `IotSpaceHealthPanel`, `LivePlaybackPanel`, `ContextIntelligencePanel`, `TopTracksPanel`, `TopMoodsPanel`, `BillingAiSummaryPanel`, `QuickActionsPanel`.
  - Tận dụng shared hiện có: `Seo`, `DataTable` khi cần bảng, Ant Design `Row/Col`, `Tag`, `Badge`, `Progress`, `Segmented`, `Skeleton`, `Empty`, `Tooltip`.
  - Giữ style hiện có: dark surface `#18181b`, border `#2d2528`, accent đỏ `#ef4444`, text muted/subtle như dashboard hiện tại; không đổi layout/sidebar/theme global.

- Dashboard layout đề xuất:
  - Hero compact: brand name, period đang xem, trạng thái realtime connected/refetching.
  - KPI row: stores active, spaces playing, total plays, IoT online/offline/stale/unknown, token balance.
  - Operations row: store health list bên trái, IoT space health bên phải.
  - Live playback row: thay thế panel live playback cũ bằng một `LiveSpacePlayerCarousel` chỉ hiển thị 1 `SpacePlayerCard`-style card tại một thời điểm; trượt/nút trái-phải để chuyển sang space khác.
  - Music analytics row: top tracks/top moods đặt bên dưới hoặc cạnh live player, không chen nhiều mini player vào cùng khu vực.
  - Intelligence row: context summary, AI generation, billing summary.
  - Quick actions cuối trang: Stores, Playlists, Schedules, Tracks, AI Music, Billing.

- Live playback carousel behavior:
  - `LivePlaybackPanel` nhận `livePlayback.items` và render active item thành một card lớn mô phỏng `SpacePlayerCard` read-only.
  - Card chỉ hiển thị 1 space: store name, space name, space type, current track, artist, mood tag, playback progress, volume/mute, manual override/paused state, IoT badge nếu có thể map từ `iotSpaceHealth` theo `spaceId`.
  - Queue preview trong card dùng queue riêng của space. Nếu DTO snapshot chưa có `spaceQueueItems`, FE v1 hiển thị current track + placeholder/summary queue count; khi backend bổ sung queue preview thì map 1:1 vào card.
  - Navigation dùng arrow buttons, keyboard left/right, dots counter `currentIndex / total`, và không auto-slide để tránh gây rối khi manager đang quan sát.
  - Visual reuse từ `SpacePlayerCard`: circular visualizer, wave layer, progress bar, control pill read-only, mood theme color.
  - Mood theme mapping: Chill/Calm = `#10b981`, Focus = `#3b82f6`, Energetic/Uplifting/Social = `#f59e0b`, fallback = `#818cf8`.

## Display Mapping Rules

- IoT:
  - `healthStatus` là source chính để hiển thị badge.
  - `NoDevice`: default/gray, label “No device”.
  - `Online`: success/green, label “Online”.
  - `Offline`: error/red, label “Offline”.
  - `Stale`: warning/orange, label “Stale”.
  - `Unknown`: default/gray, label “Unknown”.
  - Tooltip lấy từ `healthReason` enum map sang text FE, không hiển thị raw enum number.

- Store health:
  - `Healthy`: green.
  - `Attention`: orange/red accent.
  - `Inactive`: gray.
  - `healthReason` map sang text ngắn: operational, inactive, IoT offline/stale/unknown, no active playback.

- Track scope:
  - `Global`: tag “Global”.
  - `BrandOwned`: tag “Brand-owned”.
  - `Unknown`: tag “Unknown”.
  - Top tracks hiển thị rank, title, artist, scope, plays, total minutes, last played.

- Empty/loading/error:
  - Loading dùng `Skeleton` theo từng panel.
  - Empty brand data không crash, hiển thị `Empty` hoặc “No data in selected period”.
  - API error dùng alert gọn, giữ quick actions để user vẫn điều hướng được.

## Test Plan

- Type-check: `npm run type-check`.
- Build: `npm run build`.
- Manual scenarios:
  - Dashboard load thành công với `period=Day`, `top=10`.
  - Đổi period Day/Week/Month/Year refetch đúng query param numeric.
  - Custom range chỉ gọi API khi đủ `fromUtc` và `toUtc`.
  - Brand không có store/space/playback vẫn render không lỗi.
  - IoT panel hiển thị đủ NoDevice/Online/Offline/Stale/Unknown theo enum.
  - SignalR connected thì join brand room, nhận `BrandDashboardChanged` thì dashboard refetch sau debounce.
  - SignalR lỗi hoặc thiếu `brandId` thì dashboard vẫn dùng REST snapshot bình thường.
  - Live playback carousel chỉ render 1 space player card tại một thời điểm; arrow/dots chuyển đúng space và không làm mất state filter.
  - Responsive: desktop 2 cột cho operational panels, mobile xếp 1 cột, text không tràn card/button.

## Assumptions

- Backend đã trả JSON camelCase từ DTO C# hiện tại.
- FE không cần tự tính lại aggregate từ store/context APIs nữa.
- Realtime event chỉ là invalidation hint, không merge từng phần vào state local.
- Implementation sẽ chỉ update frontend trong `cams`, backend đã có endpoint/DTO tương ứng.

