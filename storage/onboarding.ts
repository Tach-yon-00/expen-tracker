// storage/onboarding.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ONBOARDING_DONE";

export const setOnboardingDone = async () => {
  await AsyncStorage.setItem(KEY, "true");
};

export const isOnboardingDone = async () => {
  const value = await AsyncStorage.getItem(KEY);
  return value === "true";
};

export const clearOnboarding = async () => {
  await AsyncStorage.removeItem(KEY);
};
