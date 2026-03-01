# CHANGELOG

## [1.1.0] - 2026-03-01

### Added
- **Ledger Integration**:
  - Unified `Transactions` view now beautifully combines standard expenses/income with Ledger debts & loans. 
  - Ledger items are visually distinct with unique icons (`swap-horizontal-outline`), blue accent colors, and display the "Reason" instead of standard categories.
  - Transactions list accurately maps and dates both data sources seamlessly without mixing total expense analytics.
- **Firebase Push Notifications (FCM)**:
  - Setup native Firebase Cloud Messaging targeting via `@react-native-firebase/app` and `@react-native-firebase/messaging`.
  - Added utility (`utils/firebaseNotifications.ts`) to request user permissions and handle the FCM Device Token.
  - Implemented automatic subscription to the `all_users` topic on app launch, allowing global broadcast messages from the Firebase Console.
  - Configured robust Headless Background message handling natively tied to the Android OS lifecycle to receive push notifications when the app is completely closed.
  - Added native foreground alert handler to display push notifications while the app is actively open.

### Changed
- Refactored `app/add.tsx` to handle both Expenses and Ledger inputs natively within a single screen.
- Removed deprecated UI screens (`app/add-debt.tsx` and `app/(tabs)/ledger.tsx`).
- Updated `app/(tabs)/_layout.tsx` to remove the outdated ledger tab routing.
- Transitioned project structure from basic "Expo Go" compatible to a custom Native Development Build architecture (`expo-dev-client`) to support raw Firebase Java/Kotlin dependencies.

### Fixed
- Addressed Android build compilation failures caused by incorrect auto-linked Bubblewrap NDK paths by explicitly setting `local.properties` to target the default Android Studio SDK.
- Resolved Firebase native peer dependency conflicts using force legacy peer-deps resolutions for React 19.
