import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { BlurredOverlay, BounceInView, FadeInView, PopIn, ScalePressable, SlideUpView } from "../../components/Animations";
import { COLORS, SHADOWS, TYPOGRAPHY } from "../../constants/theme";
import { useExpenses } from "../../context/ExpenseContext";
import { useAppUsage } from "../../hooks/useAppUsage";
import { clearOnboarding } from "../../storage/onboarding";
import { AppUsage, loadAppUsage, loadProfilePic, saveProfilePic } from "../../storage/storage";
import { PROTECTED_CATEGORY_TITLES } from "../../utils/categoryUtils";
import { navVisibility } from "./_layout";

type Category = {
  id: string;
  icon: string;
  title: string;
  color: string;
};

// Icon picker icons using Ionicons (50 icons)
const ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
  "fast-food-outline", "cafe-outline", "beer-outline", "wine-outline", "pizza-outline",
  "restaurant-outline", "fish-outline", "nutrition-outline", "leaf-outline", "water-outline",
  "car-outline", "bus-outline", "train-outline", "airplane-outline", "bicycle-outline",
  "bag-outline", "cart-outline", "gift-outline", "card-outline", "cash-outline",
  "medical-outline", "medkit-outline", "fitness-outline", "heart-outline", "bandage-outline",
  "film-outline", "game-controller-outline", "musical-notes-outline", "headset-outline", "radio-outline",
  "book-outline", "school-outline", "library-outline", "pencil-outline", "journal-outline",
  "home-outline", "bed-outline", "business-outline", "prism-outline",
  "shirt-outline", "watch-outline", "glasses-outline", "diamond-outline", "paw-outline",
  "flower-outline", "sunny-outline", "moon-outline"
];

// Color options for categories
const COLOR_OPTIONS = [
  "#FF6B6B", "#F59E0B", "#3B82F6", "#EC4899", "#22C55E",
  "#0EA5E9", "#06B6D4", "#EF4444", "#10B981", "#F97316"
];

// Default category titles that cannot be deleted

export default function Profile() {
  const router = useRouter();
  const { state, isPremium, addCategory, deleteCategory, updateCurrency, updateUser, updatePreferences, dispatch } = useExpenses();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const userName = state.user?.name || "User1234";
  const userEmail = state.user?.email || "user1234@email.com";
  const [isEditingName, setIsEditingName] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

  // New settings states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [shareData, setShareData] = useState(true);
  const [targetedAds, setTargetedAds] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    Alert.alert("Success", "Password changed successfully");
  };

  const handleSavePrivacy = () => {
    setShowPrivacyModal(false);
    Alert.alert("Success", "Privacy settings saved");
  };
  const [appUsageData, setAppUsageData] = useState<AppUsage[]>([]);
  // Fix: Notification/Budget toggles default OFF, now synced with backend
  const notificationsEnabled = state.preferences?.pushNotifications || false;
  const budgetAlertsEnabled = state.preferences?.budgetAlerts || false;

  const toggleNotifications = async (value: boolean) => {
    await updatePreferences({ pushNotifications: value, budgetAlerts: budgetAlertsEnabled });
  };

  const toggleBudgetAlerts = async (value: boolean) => {
    await updatePreferences({ pushNotifications: notificationsEnabled, budgetAlerts: value });
  };

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>("fast-food-outline");
  const [selectedColor, setSelectedColor] = useState("#FF6B6B");
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColorInput, setCustomColorInput] = useState("#");

  const handleOpenCategoryModal = () => {
    const customCategoriesCount = state.categories.filter((cat: any) => !PROTECTED_CATEGORY_TITLES.includes(cat.title)).length;
    if (!isPremium && customCategoriesCount >= 2) {
      if (Platform.OS === "web") {
        window.alert("Free users are limited to 2 custom categories. Upgrade to Premium to manage unlimited custom categories.");
        setShowPremiumModal(true);
      } else {
        Alert.alert(
          "Upgrade to Premium",
          "Free users are limited to 2 custom categories. Upgrade to Premium to unlock unlimited custom categories and more awesome features.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Learn More", onPress: () => setShowPremiumModal(true) }
          ]
        );
      }
      return;
    }
    setShowCategoryModal(true);
  };

  // Function to apply custom color
  const applyCustomColor = () => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(customColorInput)) {
      setSelectedColor(customColorInput);
      setShowCustomColor(false);
      setCustomColorInput("#");
    } else {
      Alert.alert("Invalid Color", "Please enter a valid hex color (e.g., #FF6B6B)");
    }
  };

  // Track app usage automatically
  useAppUsage();

  useEffect(() => {
    loadSavedProfileData();
    loadAppUsageData();
  }, []);

  // Refresh app usage data when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadAppUsageData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadSavedProfileData = async () => {
    const savedPic = await loadProfilePic();
    if (savedPic) setProfilePic(savedPic);
  };

  const loadAppUsageData = async () => {
    const data = await loadAppUsage();
    setAppUsageData(data);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);
      await saveProfilePic(uri);
    }
  };

  const handleEditName = () => {
    setEditedName(userName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    const profanityList = ["fuck", "shit", "bitch", "ass", "cunt", "dick", "pussy", "whore", "slut", "bastard", "damn"];
    const lowerName = trimmed.toLowerCase();
    if (profanityList.some(word => lowerName.includes(word))) {
      Alert.alert("Error", "Please choose an appropriate name");
      return;
    }
    await updateUser({ name: trimmed, email: userEmail });
    setIsEditingName(false);
  };

  const handleEditEmail = () => {
    setEditedEmail(userEmail);
    setIsEditingEmail(true);
  };

  const handleSaveEmail = async () => {
    await updateUser({ name: userName, email: editedEmail });
    setIsEditingEmail(false);
  };
  // Add new custom category - saves to server (db.json)
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    // PREMIUM GATING: Free users limit applied
    const customCategoriesCount = state.categories.filter((cat: any) => !PROTECTED_CATEGORY_TITLES.includes(cat.title)).length;

    if (!isPremium && customCategoriesCount >= 2) {
      return;
    }

    const newCat: Category = {
      id: Date.now().toString(),
      icon: selectedIcon,
      title: newCategoryName.trim(),
      color: selectedColor
    };

    // Add to context which syncs with server (db.json)
    await addCategory(newCat);

    setNewCategoryName("");
    setSelectedIcon("fast-food-outline");
    setSelectedColor("#FF6B6B");
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async (id: string, title: string) => {
    if (PROTECTED_CATEGORY_TITLES.includes(title)) {
      if (Platform.OS === "web") {
        window.alert(`"${title}" is a default category and cannot be removed.`);
      } else {
        Alert.alert("Cannot Delete", `"${title}" is a default category and cannot be removed.`);
      }
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to delete this category?");
      if (confirmed) {
        try {
          await deleteCategory(id);
        } catch (error) {
          window.alert("Failed to delete category: Default categories cannot be deleted.");
        }
      }
      return;
    }

    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(id);
            } catch (error) {
              Alert.alert("Error", "Failed to delete category: Default categories cannot be deleted.");
            }
          }
        }
      ]
    );
  };

  // Calculate app usage (hours) for the last 7 days from actual app usage data
  const { bars, dayLabels, totalHoursToday } = useMemo(() => {
    const today = new Date();
    const hours: number[] = [];
    const labels: string[] = [];
    let todayTotal = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Get day abbreviation
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      labels.push(dayNames[date.getDay()]);

      // Find usage for this day from app usage data
      const dayUsage = appUsageData.find((u: AppUsage) => u.date === dateStr);
      const minutes = dayUsage ? dayUsage.minutes : 0;

      // Store today's total
      if (i === 0) {
        todayTotal = minutes;
      }

      // Convert minutes to hours for display, scale for bar height
      const hoursValue = minutes / 60;
      // Scale for bar: minimum 5, max 100
      const barHeight = hoursValue > 0 ? Math.max(Math.min(hoursValue * 10, 100), 10) : 5;
      hours.push(barHeight);
    }

    return {
      bars: hours,
      dayLabels: labels,
      totalHoursToday: todayTotal / 60
    };
  }, [appUsageData]);

  // Get total hours this week
  const totalHoursThisWeek = useMemo(() => {
    return appUsageData.reduce((sum: number, u: AppUsage) => sum + u.minutes, 0) / 60;
  }, [appUsageData]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: navVisibility } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* HEADER */}
        <View style={styles.header} />

        {/* CONTENT */}
        <FadeInView style={styles.content}>
          <PopIn delay={100}>
            <ScalePressable onPress={handlePickImage} style={styles.avatarContainer}>
              <Image
                source={{ uri: profilePic || "https://i.pravatar.cc/150?img=12" }}
                style={styles.avatar}
              />
              <BounceInView delay={400} style={styles.editButton}>
                <Ionicons name="camera" size={14} color="#fff" />
              </BounceInView>
            </ScalePressable>
          </PopIn>
          <Text style={{ fontSize: 12, color: COLORS.gray400, marginTop: 8, marginBottom: -4 }}>Tap to change</Text>

          <View style={styles.nameContainer}>
            <TouchableOpacity onPress={handleEditName} style={styles.nameRow}>
              <Text style={styles.name}>{userName}</Text>
              <Ionicons name="pencil" size={16} color={COLORS.primary} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.emailContainer}>
            <TouchableOpacity onPress={handleEditEmail} style={styles.emailRow}>
              <Text style={styles.email}>{userEmail}</Text>
              <Ionicons name="mail-outline" size={16} color={COLORS.gray400} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* PREMIUM */}
        <FadeInView delay={200} style={styles.premiumCard}>
          <Text style={styles.plan}>★ PREMIUM PLAN</Text>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.premiumTitle}>Go Premium</Text>
              <Text style={styles.premiumSub}>Unlock advanced analytics and reports</Text>
            </View>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => setShowPremiumModal(true)}>
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* APP USAGE CHART - Hidden temporarily due to inaccurate tracking */}

        {/* CATEGORIES */}
        <FadeInView delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CATEGORIES</Text>
            <TouchableOpacity style={styles.plusBtn} onPress={handleOpenCategoryModal}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {state.categories.length === 0 ? (
              <Text style={styles.emptyText}>No categories yet. Tap + to add one.</Text>
            ) : (
              state.categories.map((item: any) => {
                const isDefault = PROTECTED_CATEGORY_TITLES.includes(item.title);
                return (
                  <View key={item.id} style={styles.categoryRow}>
                    <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon as any} size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.catTitle}>{item.title}</Text>
                        {isDefault && (
                          <View style={{ backgroundColor: COLORS.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontSize: 9, fontWeight: "700", color: COLORS.primary }}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.catSub}>Category</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.deleteBtn, { opacity: isDefault ? 0.3 : 1 }]}
                      onPress={() => handleDeleteCategory(item.id, item.title)}
                    >
                      <Ionicons name={isDefault ? "lock-closed" : "trash-outline"} size={20} color={isDefault ? COLORS.gray400 : COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </FadeInView>

        {/* SETTINGS */}
        <FadeInView delay={450}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SETTINGS</Text>
          </View>
          <View style={styles.card}>
            {/* Dev Toggle */}
            <View style={styles.securityRow}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="star-outline" size={20} color={COLORS.success} />
              </View>
              <Text style={styles.securityText}>Dev: Premium Status</Text>
              <Switch
                value={state.isPremium}
                onValueChange={(val) => dispatch({ type: "SET_PREMIUM", payload: val })}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
              />
            </View>
            <View style={styles.separator} />
            {/* Currency */}
            <TouchableOpacity style={styles.securityRow} onPress={() => setShowCurrencyModal(true)}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.securityText}>Currency</Text>
              <Text style={styles.settingValue}>{state.currency}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray300} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <View style={styles.separator} />
            {/* Push Notifications */}
            <View style={styles.securityRow}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.warningLight }]}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.securityText}>Push Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
              />
            </View>
            <View style={styles.separator} />
            {/* Budget Alerts */}
            <View style={styles.securityRow}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.dangerLight }]}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
              </View>
              <Text style={styles.securityText}>Budget Alerts</Text>
              <Switch
                value={budgetAlertsEnabled}
                onValueChange={toggleBudgetAlerts}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
              />
            </View>
          </View>
        </FadeInView>

        {/* EXPORT DATA */}
        <FadeInView delay={500}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EXPORT DATA</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.exportRow}>
              <TouchableOpacity style={styles.exportBtn}>
                <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                <Text style={styles.exportText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn}>
                <Ionicons name="receipt-outline" size={24} color={COLORS.success} />
                <Text style={styles.exportText}>PDF</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.exportSub}>Download a full history of your transactions including dates, categories, notes, and payment methods for external accounting.</Text>
          </View>
        </FadeInView>

        {/* SECURITY & ACCOUNT SETTINGS (Redesigned matching image) */}
        <FadeInView delay={550}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SECURITY & ACCOUNT</Text>
          </View>
        </FadeInView>

        <FadeInView delay={600}>
          <View style={[styles.card, { paddingVertical: 8, paddingHorizontal: 0, borderRadius: 24 }]}>
            <TouchableOpacity style={styles.simpleRow} onPress={() => router.push("/manage-payment-methods" as any)}>
              <Text style={styles.simpleRowText}>Manage Payment Methods</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: 'rgba(0,0,0,0.05)', height: 1.5, marginHorizontal: 20 }]} />

            <TouchableOpacity style={styles.simpleRow} onPress={() => setShowPasswordModal(true)}>
              <Text style={styles.simpleRowText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: 'rgba(0,0,0,0.05)', height: 1.5, marginHorizontal: 20 }]} />

            <TouchableOpacity style={styles.simpleRow} onPress={() => setShowPrivacyModal(true)}>
              <Text style={styles.simpleRowText}>Privacy Settings</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* LOGOUT */}
        <FadeInView delay={700} style={styles.logoutCard}>
          <Text style={styles.logoutHint}>Your data is safe and stored locally.</Text>
          <ScalePressable
            style={styles.logoutBtn}
            onPress={() => Alert.alert("Log Out", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Log Out", style: "destructive", onPress: async () => {
                  await AsyncStorage.clear();
                  await clearOnboarding(); // Fix: Wiping the flag specifically
                  router.replace("/onboarding" as any);
                }
              }
            ])}
          >
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </ScalePressable>
        </FadeInView>
      </Animated.ScrollView>

      {/* MODALS */}
      <Modal visible={isEditingName} transparent animationType="fade">
        <BlurredOverlay visible={isEditingName} onPress={() => setIsEditingName(false)} />
        <View style={styles.modalOverlay}>
          <PopIn style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsEditingName(false)}>
                <Ionicons name="close" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Your name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditingName(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </PopIn>
        </View>
      </Modal>

      <Modal visible={isEditingEmail} transparent animationType="fade">
        <BlurredOverlay visible={isEditingEmail} onPress={() => setIsEditingEmail(false)} />
        <View style={styles.modalOverlay}>
          <PopIn style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Email</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsEditingEmail(false)}>
                <Ionicons name="close" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={editedEmail}
              onChangeText={setEditedEmail}
              placeholder="Your email"
              autoFocus
              keyboardType="email-address"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditingEmail(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEmail}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </PopIn>
        </View>
      </Modal>

      {/* CURRENCY PICKER MODAL */}
      <Modal visible={showCurrencyModal} transparent animationType="fade">
        <BlurredOverlay visible={showCurrencyModal} onPress={() => setShowCurrencyModal(false)} />
        <View style={styles.modalOverlay}>
          <PopIn style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, paddingVertical: 10 }}>
              {["₹", "$", "€", "£", "¥"].map((sym) => (
                <TouchableOpacity
                  key={sym}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderRadius: 12,
                    backgroundColor: state.currency === sym ? COLORS.primary : COLORS.gray50,
                    minWidth: 60,
                    alignItems: "center"
                  }}
                  onPress={() => {
                    updateCurrency(sym);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: "700", color: state.currency === sym ? "#fff" : COLORS.textHeader }}>{sym}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </PopIn>
        </View>
      </Modal>

      <Modal visible={showCategoryModal} transparent animationType="fade">
        <BlurredOverlay visible={showCategoryModal} onPress={() => setShowCategoryModal(false)} />
        <View style={styles.modalOverlay}>
          <SlideUpView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>CATEGORY NAME</Text>
              <TextInput
                style={styles.input}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="e.g., Coffee"
                autoFocus
              />
              <Text style={styles.inputLabel}>SELECT ICON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
                {ICON_OPTIONS.map((icon, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons name={icon} size={24} color={selectedIcon === icon ? "#fff" : COLORS.gray400} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.inputLabel}>SELECT COLOR</Text>
              <View style={styles.colorPicker}>
                {COLOR_OPTIONS.map((color, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.colorOptionSelected]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.customColorBtn} onPress={() => setShowCustomColor(true)}>
                <Text style={styles.customColorText}>+ Add Custom Color</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddCategory}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </SlideUpView>
        </View>
      </Modal>

      <Modal visible={showCustomColor} transparent animationType="fade">
        <BlurredOverlay visible={showCustomColor} onPress={() => setShowCustomColor(false)} />
        <View style={styles.modalOverlay}>
          <PopIn style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom Color</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCustomColor(false)}>
                <Ionicons name="close" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={customColorInput}
              onChangeText={setCustomColorInput}
              placeholder="#FF6B6B"
              autoFocus
              maxLength={7}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCustomColor(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={applyCustomColor}>
                <Text style={styles.saveBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </PopIn>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <BlurredOverlay visible={showPasswordModal} onPress={() => setShowPasswordModal(false)} />
        <View style={styles.modalOverlay}>
          <PopIn style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Enter current password"
            />
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Enter new password"
            />
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm new password"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </PopIn>
        </View>
      </Modal>

      {/* Privacy Settings Modal */}
      <Modal visible={showPrivacyModal} transparent animationType="fade">
        <BlurredOverlay visible={showPrivacyModal} onPress={() => setShowPrivacyModal(false)} />
        <View style={styles.modalOverlay}>
          <PopIn style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Settings</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.securityRow}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.infoLight }]}>
                <Ionicons name="analytics-outline" size={20} color={COLORS.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.securityText}>Share Analytics Data</Text>
                <Text style={{ fontSize: 12, color: COLORS.gray400 }}>Help us improve the app</Text>
              </View>
              <Switch
                value={shareData}
                onValueChange={setShareData}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.securityRow}>
              <View style={[styles.settingIcon, { backgroundColor: COLORS.warningLight }]}>
                <Ionicons name="megaphone-outline" size={20} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.securityText}>Allow Targeted Ads</Text>
                <Text style={{ fontSize: 12, color: COLORS.gray400 }}>Show relevant advertisements</Text>
              </View>
              <Switch
                value={targetedAds}
                onValueChange={setTargetedAds}
                trackColor={{ false: COLORS.gray200, true: COLORS.primary }}
              />
            </View>

            <View style={[styles.modalButtons, { marginTop: 24 }]}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSavePrivacy}>
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
          </PopIn>
        </View>
      </Modal>

      {/* Premium Upgrade Modal */}
      <Modal visible={showPremiumModal} transparent animationType="slide">
        <BlurredOverlay visible={showPremiumModal} onPress={() => setShowPremiumModal(false)} />
        <View style={styles.modalOverlay}>
          <SlideUpView style={[styles.modalContent, { backgroundColor: COLORS.textHeader, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={{ ...TYPOGRAPHY.h1, color: "#fff", marginBottom: 2 }}>Stoic Premium</Text>
                <Text style={{ color: COLORS.warning, fontSize: 16, fontWeight: "700" }}>$4.99 <Text style={{ fontSize: 14, color: COLORS.gray400, fontWeight: "400" }}>/ month</Text></Text>
              </View>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setShowPremiumModal(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 30, marginTop: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
                <Text style={{ color: COLORS.gray400, flex: 1, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>Features</Text>
                <Text style={{ color: COLORS.gray400, width: 70, textAlign: "center", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>Free</Text>
                <Text style={{ color: COLORS.warning, width: 70, textAlign: "center", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>Pro</Text>
              </View>

              {[
                { name: "Custom Categories", free: "2 max", pro: "Unlimited" },
                { name: "Analytics & Insights", free: "Basic", pro: "Advanced" },
                { name: "Data Export", free: "No", pro: "Yes" },
                { name: "Custom Themes", free: "No", pro: "Yes" },
                { name: "Priority Support", free: "No", pro: "Yes" }
              ].map((feat, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 18, alignItems: "center" }}>
                  <Text style={{ color: "#fff", flex: 1, fontSize: 15, fontWeight: "500" }}>{feat.name}</Text>
                  <Text style={{ color: COLORS.gray300, width: 70, textAlign: "center", fontSize: 14 }}>{feat.free}</Text>
                  <View style={{ width: 70, alignItems: "center" }}>
                    <Text style={{ color: COLORS.warning, fontSize: 14, fontWeight: "800" }}>{feat.pro}</Text>
                  </View>
                </View>
              ))}
            </View>

            <ScalePressable
              style={{ backgroundColor: COLORS.warning, padding: 18, borderRadius: 20, alignItems: "center", ...SHADOWS.md }}
              onPress={() => {
                setShowPremiumModal(false);
                if (Platform.OS === "web") {
                  window.alert("Proceeding to payment processor...");
                } else {
                  Alert.alert("Redirecting", "Proceeding to payment processor...");
                }
              }}
            >
              <Text style={{ color: COLORS.textHeader, fontWeight: "800", fontSize: 16, letterSpacing: 0.5 }}>Upgrade Now</Text>
            </ScalePressable>
            <Text style={{ color: COLORS.gray400, fontSize: 12, textAlign: "center", marginTop: 16 }}>Cancel anytime. Read our Terms of Service.</Text>
          </SlideUpView>
        </View>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 60 },
  header: { height: 160, backgroundColor: COLORS.primary },
  content: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    alignItems: "center",
    paddingBottom: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -70,
    borderWidth: 4,
    borderColor: "#fff",
    ...SHADOWS.md,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 50 },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  nameContainer: { marginTop: 12 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { ...TYPOGRAPHY.h1, color: COLORS.textHeader },
  emailContainer: { marginBottom: 20 },
  emailRow: { flexDirection: "row", alignItems: "center" },
  email: { ...TYPOGRAPHY.body, color: COLORS.gray500 },
  premiumCard: { width: "90%", backgroundColor: COLORS.textHeader, borderRadius: 24, padding: 22, marginBottom: 20, ...SHADOWS.primary, alignSelf: "center" },
  plan: { color: COLORS.warning, fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  premiumTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 4 },
  premiumSub: { color: "rgba(255,255,255,0.6)", fontSize: 14, width: 200 },
  upgradeBtn: { backgroundColor: COLORS.warning, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  upgradeText: { fontWeight: "700", color: COLORS.textHeader },
  usageCard: { width: "90%", backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 20, ...SHADOWS.sm, alignSelf: "center" },
  usageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  usageTitle: { ...TYPOGRAPHY.h3 },
  usageSub: { ...TYPOGRAPHY.bodySmall, color: COLORS.gray400 },
  usageBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  usageBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  barChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120, paddingHorizontal: 4 },
  barContainer: { alignItems: "center", flex: 1 },
  bar: { width: 14, borderRadius: 10, marginBottom: 8 },
  barLabel: { fontSize: 10, color: COLORS.gray400, fontWeight: "600" },
  section: { width: "95%", alignSelf: "center", marginBottom: 20 },
  sectionTitle: { ...TYPOGRAPHY.subheader, marginLeft: 16, marginBottom: 12, marginTop: 16 },
  settingItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", padding: 16, borderRadius: 20, marginBottom: 10, ...SHADOWS.sm },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  settingLabel: { ...TYPOGRAPHY.bodyBold },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingValue: { ...TYPOGRAPHY.bodyBold, color: COLORS.primary },
  logoutCard: { width: "90%", alignSelf: "center", marginBottom: 60 },
  logoutHint: { textAlign: "center", color: COLORS.gray400, fontSize: 12, marginBottom: 16 },
  logoutBtn: { backgroundColor: COLORS.dangerLight, padding: 18, borderRadius: 20, alignItems: "center", borderWidth: 1, borderColor: COLORS.danger + "20" },
  logoutBtnText: { color: COLORS.danger, fontWeight: "700", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, ...SHADOWS.lg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { ...TYPOGRAPHY.h2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray50, justifyContent: "center", alignItems: "center" },
  input: { backgroundColor: COLORS.gray50, borderRadius: 16, padding: 16, fontSize: 16, color: COLORS.textHeader, borderWidth: 1, borderColor: COLORS.gray100, marginBottom: 24 },
  modalButtons: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: COLORS.gray100, alignItems: "center" },
  cancelBtnText: { fontWeight: "700", color: COLORS.gray600 },
  saveBtn: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center" },
  saveBtnText: { fontWeight: "700", color: "#fff" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "90%", alignSelf: "center", marginBottom: 12, marginTop: 16 },
  plusBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  card: { width: "95%", backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 12, ...SHADOWS.sm, alignSelf: "center" },
  categoryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  categoryIcon: { width: 44, height: 44, borderRadius: 14, marginRight: 14, alignItems: "center", justifyContent: "center" },
  catTitle: { ...TYPOGRAPHY.bodyBold },
  catSub: { color: COLORS.gray400, fontSize: 12 },
  deleteBtn: { padding: 8 },
  exportRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  exportBtn: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: 18, padding: 18, alignItems: "center", gap: 8 },
  exportText: { ...TYPOGRAPHY.bodyBold, fontSize: 14 },
  exportSub: { ...TYPOGRAPHY.bodySmall, color: COLORS.gray400, textAlign: "center", marginTop: 16 },
  syncBox: { gap: 16 },
  syncTitle: { ...TYPOGRAPHY.bodyBold, fontSize: 16 },
  syncSub: { ...TYPOGRAPHY.bodySmall, color: COLORS.gray400 },
  connectedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  connectedText: { fontSize: 12, fontWeight: "700" },
  darkBtn: { flex: 1, backgroundColor: COLORS.textHeader, padding: 14, borderRadius: 14, alignItems: "center" },
  darkText: { color: "#fff", fontWeight: "700" },
  lightBtn: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.gray200, padding: 14, borderRadius: 14, alignItems: "center" },
  securityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 },
  securityText: { flex: 1, ...TYPOGRAPHY.bodyBold },
  separator: { height: 1, backgroundColor: COLORS.gray50, marginVertical: 4 },
  emptyText: { textAlign: "center", color: COLORS.gray400, paddingVertical: 20 },
  statBox: { alignItems: "center", backgroundColor: COLORS.gray50, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  statValue: { fontSize: 24, fontWeight: "800", color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.gray400, marginTop: 2 },
  usageStats: { flexDirection: "row", justifyContent: "space-around", marginTop: 12, marginBottom: 16 },
  modalScrollView: { maxHeight: "80%", width: "100%" },
  inputLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textMain, marginBottom: 10, marginTop: 4 },
  iconPicker: { flexDirection: "row", marginBottom: 16, paddingVertical: 8 },
  iconOption: { padding: 12, marginRight: 8, borderRadius: 12, backgroundColor: COLORS.gray100, width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  iconOptionSelected: { backgroundColor: COLORS.primary },
  colorPicker: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, gap: 10 },
  colorOption: { width: 40, height: 40, borderRadius: 20 },
  colorOptionSelected: { borderWidth: 3, borderColor: COLORS.textHeader },
  customColorBtn: { padding: 14, borderRadius: 12, backgroundColor: COLORS.gray50, alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: COLORS.gray200, borderStyle: "dashed" },
  customColorText: { color: COLORS.primary, fontWeight: "600" },
  simpleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 16 },
  simpleRowText: { flex: 1, fontSize: 16, color: COLORS.textHeader, fontWeight: "600" },
});
