### FOLDER STRUCTURE

```
src/
├── assets/                 # Các file static (images, icons)
├── components/             # Components dùng chung (Shared Components)
│   ├── layouts/            # Main Layout, Sidebar, Header
│   └── ui/                 # "Core" components custom từ Antd
│       ├── Button/         # Ví dụ: Custom Button
│       │   ├── index.tsx
│       │   └── styles.module.css (nếu cần scope style đặc biệt ngoài tailwind)
│       ├── Card/
│       └── Typography/
├── config/                 # Các biến môi trường, constants
│   └── env.ts
├── features/               # FEATURE-BASED MODULES
│   ├── auth/               # Đăng nhập/Đăng ký
│   ├── dashboard/          # Màn hình chính (như hình bạn gửi)
│   │   ├── api/            # React Query hooks (useStats, useChartData)
│   │   ├── components/     # Widget cụ thể (SalesChart, ActivityLog)
│   │   └── pages/          # DashboardPage.tsx
│   ├── stores/             # Quản lý danh sách cửa hàng
│   └── music-gen/          # Quản lý AI Music Generation
├── hooks/                  # Global hooks (useTheme, useAuth)
├── lib/                    # Cấu hình các thư viện bên thứ 3
│   ├── axios.ts            # Cấu hình Axios instance, interceptors
│   ├── react-query.ts      # QueryClient configuration
│   └── antd-theme.ts       # Config token cho Antd ConfigProvider
├── providers/              # Context Providers
│   └── AppProvider.tsx     # Gom ConfigProvider, QueryClientProvider, HelmetProvider
├── routes/                 # Định tuyến
│   └── index.tsx
├── types/                  # TypeScript types/interfaces chung
├── utils/                  # Helper functions
├── App.tsx
├── index.css               # Tailwind v4 imports (@import "tailwindcss";)
└── main.tsx
```
