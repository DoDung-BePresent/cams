### FOLDER STRUCTURE

```
src/
├── assets/                 # Các file tĩnh (Images, Global Icons)
├── components/             # SHARED COMPONENTS (Dùng chung cho toàn app)
│   ├── ui/                 # Shadcn UI components (Button, Input, Card...) - Tự động gen vào đây
│   ├── common/             # Component chung logic (LoadingSpinner, ErrorState, SEOHead)
│   └── layouts/            # MainLayout, AuthLayout, Sidebar, Header
├── config/                 # Biến môi trường (env.ts), Constants
├── features/               # FEATURE MODULES (Logic nghiệp vụ chính)
│   ├── auth/               # Đăng nhập, phân quyền, Profile
│   ├── dashboard/          # Thống kê tổng quan (Admin/Manager view)
│   ├── music-player/       # Trình phát nhạc, Playlist, AI Controls
│   ├── pos-integration/    # Kết nối dữ liệu POS, xem log transaction
│   └── stores/             # Quản lý danh sách cửa hàng, thiết bị Edge
├── hooks/                  # Global hooks (useTheme, useClickOutside)
├── lib/                    # Cấu hình 3rd party (Axios, React Query, Utils)
├── providers/              # Context Providers (AppProvider wrap toàn bộ app)
├── routes/                 # Cấu hình React Router
├── types/                  # Global TS Interfaces (API Response chung, User role)
├── utils/                  # Helper functions (Format date, currency)
└── App.tsx
```
