import AsyncStorage from "@react-native-async-storage/async-storage";
import { Expense } from "../types/expense";

const KEY = "EXPENSE_DATA";
const PROFILE_PIC_KEY = "PROFILE_PIC_URI";
const PROFILE_NAME_KEY = "PROFILE_NAME";
const PROFILE_EMAIL_KEY = "PROFILE_EMAIL";
const APP_USAGE_KEY = "APP_USAGE_DATA";
const CATEGORIES_KEY = "CUSTOM_CATEGORIES";
const APP_SETUP_COMPLETE_KEY = "APP_SETUP_COMPLETE";

export type AppUsage = {
    date: string;
  minutes: number;
};

export type CustomCategory = {
  id: string;
  icon: string;
  title: string;
  color: string;
};

export const saveExpenses = async (data: Expense[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
};

export const loadExpenses = async (): Promise<Expense[]> => {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProfilePic = async (uri: string) => {
  await AsyncStorage.setItem(PROFILE_PIC_KEY, uri);
};

export const loadProfilePic = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(PROFILE_PIC_KEY);
};

export const saveProfileName = async (name: string) => {
  await AsyncStorage.setItem(PROFILE_NAME_KEY, name);
};

export const loadProfileName = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(PROFILE_NAME_KEY);
};

export const saveProfileEmail = async (email: string) => {
  await AsyncStorage.setItem(PROFILE_EMAIL_KEY, email);
};

export const loadProfileEmail = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(PROFILE_EMAIL_KEY);
};

export const saveAppUsage = async (usage: AppUsage[]) => {
  await AsyncStorage.setItem(APP_USAGE_KEY, JSON.stringify(usage));
};

export const loadAppUsage = async (): Promise<AppUsage[]> => {
  const data = await AsyncStorage.getItem(APP_USAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveCustomCategories = async (categories: CustomCategory[]) => {
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const loadCustomCategories = async (): Promise<CustomCategory[]> => {
  const data = await AsyncStorage.getItem(CATEGORIES_KEY);
  return data ? JSON.parse(data) : [];
};
