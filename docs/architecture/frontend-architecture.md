# CraveCanteen Frontend Architecture

## Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **PWA**: `vite-plugin-pwa` with automatic service worker registration and offline caching
- **UI Components**: Modern dark/light glassmorphic styling, Tailwind CSS utility classes, Lucide Icons, Recharts for financial visual analytics
- **Barcode & QR**: `react-barcode`, `html5-qrcode`

## Folder Structure (`frontend/src/`)
- `app/`: App entry component (`App.tsx`), layout providers.
- `components/`:
  - `auth/`: `AuthScreen.tsx` (Supports Email, Phone, and Google Auth modal fallback)
  - `menu/`: `FoodCard.tsx`
  - `staff/`: `StaffPortal.tsx` (Live queue, POS counter sales, barcode scanning, menu vault management)
  - `ai/`: `ChatWidget.tsx` (Gemini-powered kitchen assistant chat widget)
  - `layout/`: `Sidebar.tsx`
  - `common/`: `ErrorBoundary.tsx`
- `services/`:
  - `firebase/`: `client.ts` (Browser-safe Firebase client initialization)
  - `api/`: `apiClient.ts` (Centralized API client with dual Firestore real-time listener & LocalStorage fallback)
  - `ai/`: `gemini.ts` (Client-side Gemini API client)
