import { Stack } from "expo-router";
import { useEffect, useState } from "react";
// Accessibility: aria-label managed internally
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ToastProvider from "../components/Toast";
import { ExpenseProvider } from "../context/ExpenseContext";
import { isOnboardingDone } from "../storage/onboarding";
import {
  getFCMToken,
  requestUserPermission,
  setupBackgroundMessageHandler,
  setupForegroundMessageHandler
} from "../utils/firebaseNotifications";

// Initialize the Firebase Background Message Handler globally (outside React Lifecycle)
// This is strictly required for Android to process notifications when the app is killed/closed for a long time.
setupBackgroundMessageHandler();

// Ignore generic React Native Warnings that pollute the console
LogBox.ignoreLogs([
  "\"shadow*\" style props are deprecated",
  "props.pointerEvents is deprecated",
  "Animated: `useNativeDriver` is not supported"
]);

// ROOT LAYOUT IS SINGLE SOURCE OF TRUTH FOR STARTUP ROUTING
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true); // Default to onboarding

  useEffect(() => {
    // Check onboarding status at startup
    const checkOnboarding = async () => {
      try {
        const done = await isOnboardingDone();
        // Production: only show onboarding if not completed
        setShowOnboarding(!done);
      } catch (e) {
        setShowOnboarding(false);
      } finally {
        setIsReady(true);
      }
    };
    checkOnboarding();

    // --- Firebase Push Notification Setup ---
    const initPushNotifications = async () => {
      await requestUserPermission();
      await getFCMToken(); // Fetches and logs the token
    };

    initPushNotifications();
    const unsubscribeForeground = setupForegroundMessageHandler();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, []);

  // Show neutral loading gate - blocks tabs/dashboard from rendering
  if (!isReady) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ExpenseProvider>
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              gestureEnabled: false, // Disable gestures globally for clean transitions
            }}
            initialRouteName={showOnboarding ? "onboarding" : "(tabs)"}
          >
            <Stack.Screen
              name="onboarding"
              options={{
                animation: "fade",
                gestureEnabled: false,
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="add"
              options={{
                animation: "slide_from_bottom",
                gestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="manage-payment-methods"
              options={{
                animation: "slide_from_bottom",
                gestureEnabled: true,
              }}
            />
          </Stack>
        </ToastProvider>
      </ExpenseProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
