# Changelog

All notable changes to the Stoic Expense Tracker will be documented in this file.

## [Unreleased] - 2024-03-02

### Added
- **Digital Storefront**: Added the new `(tabs)/store.tsx` view featuring interactive products and Moti-powered parity animations.
- **Store Tab Integration**: Updated `app/(tabs)/_layout.tsx` to include the storefront tab with a `storefront-outline` icon.
- **Micro-Interactions**: Integrated `react-native-reanimated` and `Moti` for smooth component parity loops and haptic engine feedback upon interactions.
- **Direct App Routing**: Connected `app/index.tsx` directly to the `/(tabs)` dashboard securely, skipping the onboarding flow entirely as requested.
- **Dynamic Storefront**: Migrated the Static Store UI to a Firebase Cloud Firestore REST backend for dynamic data hydration.
  - Implemented `useStoreProducts` hook to fetch and map data to `StoreCategory` taxonomy.
  - Setup Firestore collection schema for `StoreCategories` and `StoreProducts`.
  - Added seamless `ActivityIndicator` loading state while network requests resolve.
- **Ledger UI Component**: Successfully separated debt/loan states and actions onto a standalone view with floating action buttons.
- **App Update Notification Service**: Established a Firebase Push Notification listener pipeline (`firebaseNotifications.ts`) allowing developers to alert users directly without updating the client codebase.

### Fixed
- Fixed Metro Bundler import crashes by restoring missing `Components` and `Hooks` folders that were accidentally wiped out by a conflicting NPM Script.
- Converted emoji strings in `components/onboarding/CategoriesStep` back into valid `Ionicons` to satisfy Vector Icon constraints and prevent bundle errors.
- Fixed unhandled Promise Rejection bug when attempting to delete Default Categories on iOS/Android devices.
- Implemented a specialized `Platform.OS === 'web'` fallback for `Alert.alert` that circumvented unresponsive deletion actions on Web builds.
- Resolved TypeScript compilation errors caused by mismatched data modeling in the Product Details View by unifying static mock fallbacks.

### Removed
- **Static Store Mock Arrays**: Purged `STORE_CATEGORIES` static variables from the UI layers into `utils/demoData.ts` to fully isolate offline and online feature states.

## [1.2.0] - 2026-03-02

### Added
- **Product Details Page**: Added new dynamic product detail page at `app/product/[id].tsx` with Firebase Firestore integration.
- **Store Service**: Created new `services/storeService.ts` for centralized store data management.
- **Babel Configuration**: Added `babel.config.js` for custom transpilation settings.
- **Expense Context Enhancement**: Extended `context/ExpenseContext.tsx` with 156 new lines of functionality for better state management.
- **Demo Data Updates**: Updated `utils/demoData.ts` with fresh sample data.

### Changed
- **Tab Layout**: Added store tab to `app/(tabs)/_layout.tsx` with `storefront-outline` icon.
- **Transactions View**: Updated `app/(tabs)/transactions.tsx` with 6 lines of modifications.
- **Onboarding Flow**: Modified `app/onboarding.tsx` with 3 lines of changes.
- **Categories Step**: Updated `components/onboarding/CategoriesStep.tsx` with 22 lines of improvements.
- **Firebase Notifications**: Enhanced `utils/firebaseNotifications.ts` with additional notification handling.
- **EAS Configuration**: Updated `eas.json` with new build configurations.
- **Package Updates**: Updated `package.json` and `package-lock.json` with new dependencies.

### Fixed
- **Backend Database**: Fixed data inconsistencies in `backend/db.json` with 51 lines of corrections.
- **Server Logging**: Added comprehensive server logging in `backend/server.log` for better debugging.

### Removed
- **Legacy Debt Screen**: Removed standalone `app/add-debt.tsx` (functionality merged into main add screen).
