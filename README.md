# Stoic - Expense Tracker App

A mobile expense tracking application built with Expo (React Native) for iOS and Android. The app allows users to track their expenses, view analytics, manage budgets, and maintain their profile.

## Project Overview

**Project Name:** Stoic  
**Version:** 1.0.0  
**Platform:** iOS & Android (React Native via Expo)  
**Framework:** Expo Router 6.0  
**Language:** TypeScript

## Features

- **Transactions:** Add, view, and manage expense transactions
- **Analytics:** View expense analytics and charts
- **Budget:** Track and manage budget limits
- **Profile:** User profile management
- **Camera Integration:** Scan receipts using camera
- **Photo Library:** Select receipt images from gallery

## Tech Stack

### Frontend
- **Framework:** Expo SDK 54
- **Language:** TypeScript
- **UI Library:** React Native 0.81.5
- **Navigation:** Expo Router 6 (file-based routing)
- **State Management:** React Context API
- **Charts:** react-native-svg-charts

### Backend
- **Server:** Express.js
- **Database:** JSON file storage (db.json)

### Key Dependencies
- `@expo/vector-icons` - Icon library (Ionicons)
- `@react-native-async-storage/async-storage` - Local storage
- `expo-image-picker` - Camera and photo library access
- `expo-updates` - Over-the-air updates
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Gesture handling

## Project Structure

```
stoic/
├── app/                        # Expo Router pages (file-based routing)
│   ├── _layout.tsx             # Root layout with ExpenseProvider
│   └── (tabs)/                 # Tab-based navigation
│       ├── _layout.tsx         # Tab navigation layout
│       ├── index.tsx           # Home tab
│       ├── transactions.tsx    # Transactions tab (formerly add.tsx)
│       ├── analytics.tsx       # Analytics tab
│       ├── budget.tsx          # Budget tab (formerly search.tsx)
│       └── profile.tsx         # Profile tab (formerly settings.tsx)
├── assets/                     # Static assets
│   └── images/                 # App icons and images
├── backend/                    # Express backend server
│   ├── server.js               # Express server entry point
│   └── db.json                 # JSON database
├── components/                 # Reusable React components
│   ├── ui/                     # UI components (collapsible, icons)
│   ├── external-link.tsx       # External link component
│   ├── haptic-tab.tsx          # Haptic feedback tab
│   ├── hello-wave.tsx          # Animation component
│   ├── parallax-scroll-view.tsx# Parallax scroll view
│   ├── themed-text.tsx         # Themed text component
│   └── themed-view.tsx         # Themed view component
├── constants/                  # App constants
│   └── theme.ts                # Theme colors and styles
├── context/                    # React Context providers
│   └── ExpenseContext.tsx       # Expense state management
├── hooks/                      # Custom React hooks
│   ├── use-color-scheme.ts      # Color scheme hook
│   ├── use-color-scheme.web.ts # Web color scheme hook
│   └── use-theme-color.ts      # Theme color hook
├── scripts/                    # Build and utility scripts
│   └── reset-project.js        # Project reset script
├── storage/                    # Storage utilities
│   └── storage.ts              # AsyncStorage wrapper
├── types/                      # TypeScript type definitions
│   └── expense.ts              # Expense type definition
├── app.json                    # Expo configuration
├── package.json                 # NPM dependencies
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint configuration
└── eas.json                    # EAS Build configuration
```

## File Descriptions

### App Directory (`app/`)

#### `app/_layout.tsx`
- Root layout component
- Wraps entire app with `ExpenseProvider`
- Sets up Expo Updates for production builds

#### `app/(tabs)/_layout.tsx`
- Tab navigation layout
- Custom tab bar with animated visibility
- Tab routes:
  - `/` - Home (index.tsx)
  - `/transactions` - Transactions (transactions.tsx)
  - `/analytics` - Analytics (analytics.tsx)
  - `/budget` - Budget (budget.tsx)
  - `/profile` - Profile (profile.tsx)

### Components (`components/`)

- **external-link.tsx**: Opens external URLs in browser
- **haptic-tab.tsx**: Tab with haptic feedback
- **hello-wave.tsx**: Animated wave greeting component
- **parallax-scroll-view.tsx**: Parallax scrolling effect
- **themed-text.tsx**: Text component with theme support
- **themed-view.tsx**: View component with theme support
- **ui/collapsible.tsx**: Collapsible UI component
- **ui/icon-symbol.tsx**: Symbol icons for iOS/Android

### Context (`context/`)

#### `ExpenseContext.tsx`
- Global state management for expenses
- Provides expense data and CRUD operations
- Uses AsyncStorage for persistence

### Types (`types/`)

#### `expense.ts`
```
typescript
export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  payment: string;
  note?: string;
};
```

### Backend (`backend/`)

#### `server.js`
- Express.js server
- RESTful API endpoints
- Serves from db.json

#### `db.json`
- JSON-based database
- Stores expense records

## Running the Project

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android)
- Xcode (for iOS)

### Installation
```
bash
npm install
```

### Development
```
bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Build
```
bash
# Android APK
eas build -p android --profile development

# iOS
eas build -p ios --profile development
```

## Configuration

### App Permissions (Android)
- CAMERA - For scanning receipts
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE
- READ_MEDIA_IMAGES

### App Permissions (iOS)
- NSCameraUsageDescription - Camera access for receipts
- NSPhotoLibraryUsageDescription - Photo library access

## Color Scheme

The app uses a unified theme with the following colors:
- Primary: #6a5cff (Purple)
- Background: #ffffff (White)
- Text: #000000 (Black)
- Secondary Text: #777777 (Gray)

## License

Private - All rights reserved
