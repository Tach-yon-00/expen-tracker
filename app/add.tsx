
import { COLORS } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showToast } from "../components/Toast";
import { useExpenses } from "../context/ExpenseContext";
import { isoToDisplay, displayToIso } from "../utils/config";

const fallbackConfig = { color: "#9CA3AF", icon: "ellipsis-horizontal-outline" as keyof typeof Ionicons.glyphMap, bg: "#F3F4F6" };

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state, addExpense, updateExpense } = useExpenses();
  const CURRENCY = state.currency || "₹";
  const scrollRef = useRef<ScrollView>(null);

  // Transaction type: 'income' or 'outcome'
  const [transactionType, setTransactionType] = useState<"income" | "outcome">("outcome");

  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Food");
  // Fix: Display date in DD/MM/YYYY format
  const [selectedDate, setSelectedDate] = useState(isoToDisplay(new Date().toISOString().split('T')[0]));
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [expenseId, setExpenseId] = useState<string | null>(null);

  // Income specific state
  const [incomePaymentMethod, setIncomePaymentMethod] = useState<"cash" | "netbanking">("cash");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState("");
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);

  const incomeCategories = ["Salary", "Freelance", "Business", "Investment", "Other Income"];
  const incomeCategoryConfig: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
    "Salary": { color: "#22c55e", icon: "cash-outline", bg: "#22c55e20" },
    "Freelance": { color: "#3b82f6", icon: "laptop-outline", bg: "#3b82f620" },
    "Business": { color: "#8b5cf6", icon: "briefcase-outline", bg: "#8b5cf620" },
    "Investment": { color: "#eab308", icon: "trending-up", bg: "#eab30820" },
    "Other Income": { color: "#6b7280", icon: "add-circle-outline", bg: "#6b728020" },
  };

  // Build dynamic category config from state.categories (synced with server db)
  const categoryConfig = useMemo(() => {
    const config: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {};
    (state.categories || []).forEach((cat: any) => {
      config[cat.title] = {
        color: cat.color,
        icon: (cat.icon as keyof typeof Ionicons.glyphMap) || "ellipsis-horizontal-outline",
        bg: cat.color + "20"
      };
    });
    return config;
  }, [state.categories]);

  // Get categories list from state.categories (synced with server db)
  const categories = useMemo(() => {
    return (state.categories || []).map((cat: any) => cat.title);
  }, [state.categories]);

  // Get banks from state.banks (synced with server db)
  const bankOptions = useMemo(() => {
    return (state.banks || []).map((bank: any) => bank.name);
  }, [state.banks]);

  // Get UPI apps from state.upiApps (synced with server db)
  const upiAppOptions = useMemo(() => {
    return (state.upiApps || []).map((app: any) => app.name);
  }, [state.upiApps]);

  const paymentMethods = ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"];

  // Get category config for selected category
  const getCategoryConfig = (category: string) => {
    if (transactionType === "income") return incomeCategoryConfig[category] || fallbackConfig;
    return categoryConfig[category] || fallbackConfig;
  };

  const selectedCategoryConfig = getCategoryConfig(selectedCategory);

  // Helper to get string value from params
  const getParamValue = (param: string | string[] | undefined, defaultValue: string): string => {
    if (!param) return defaultValue;
    return Array.isArray(param) ? param[0] : param;
  };

  // Check if we're editing an existing transaction
  useEffect(() => {
    if (params.id) {
      setIsEditing(true);
      setExpenseId(getParamValue(params.id, ""));
      setAmount(getParamValue(params.amount, ""));
      setTitle(getParamValue(params.title, ""));
      setSelectedCategory(getParamValue(params.category, "Food"));
      setSelectedDate(getParamValue(params.date, new Date().toISOString().split('T')[0]));
      setPaymentMethod(getParamValue(params.payment, "UPI"));
      setNotes(getParamValue(params.notes, ""));

      // Check if it's income
      const type = getParamValue(params.type, "outcome");
      setTransactionType(type as "income" | "outcome");
      if (type === "income") {
        const incomePayment = getParamValue(params.incomePayment, "cash");
        setIncomePaymentMethod(incomePayment as "cash" | "netbanking");
        if (incomePayment === "netbanking") {
          setSelectedBank(getParamValue(params.bank, ""));
          setSelectedUpiApp(getParamValue(params.upiApp, ""));
        }
      }
    }
  }, [params]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // Validate income fields - must select BOTH bank and UPI app
    if (transactionType === "income") {
      if (incomePaymentMethod === "netbanking") {
        if (!selectedBank || !selectedUpiApp) {
          Alert.alert("Error", "Please select both your bank and UPI app");
          return;
        }
      }
    }

    const expenseData: any = {
      id: expenseId || Date.now().toString(),
      amount: parseFloat(amount),
      title: title || (transactionType === "income" ? `${selectedCategory} Income` : `${selectedCategory} Expense`),
      category: selectedCategory,
      date: displayToIso(selectedDate), // Fix: Convert DD/MM/YYYY back to ISO for storage
      payment: transactionType === "income" ? incomePaymentMethod : paymentMethod,
      notes: notes,
      type: transactionType, // 'income' or 'outcome'
    };

    // Add bank and UPI info for net banking income
    if (transactionType === "income" && incomePaymentMethod === "netbanking") {
      expenseData.bank = selectedBank;
      expenseData.upiApp = selectedUpiApp;
    }

    try {
      if (isEditing && expenseId) {
        await updateExpense(expenseData);
      } else {
        await addExpense(expenseData);
      }
      // Fix: Show toast confirmation before navigating back
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ message: isEditing ? "✓ Transaction updated" : "✓ Transaction saved", type: "success" });
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save transaction");
    }
  };

  const handleTypeChange = (type: "income" | "outcome") => {
    setTransactionType(type);
    // Reset form when switching types
    if (type === "income") {
      setIncomePaymentMethod("cash");
      setSelectedBank("");
      setSelectedUpiApp("");
      setSelectedCategory("Salary");
    } else {
      setPaymentMethod("UPI");
      setSelectedCategory("Food");
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? "Edit Transaction" : "Add Transaction"}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* TYPE TOGGLE — Fix: Improved contrast for inactive side */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, transactionType === "outcome" ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={() => handleTypeChange("outcome")}
        >
          <Ionicons
            name="arrow-down-circle-outline"
            size={20}
            color={transactionType === "outcome" ? "#fff" : "#ef4444"}
          />
          <Text style={[styles.toggleText, transactionType === "outcome" ? styles.toggleTextActive : { color: "#ef4444" }]}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, transactionType === "income" ? styles.toggleBtnActiveIncome : styles.toggleBtnInactive]}
          onPress={() => handleTypeChange("income")}
        >
          <Ionicons
            name="trending-up"
            size={20}
            color={transactionType === "income" ? "#fff" : "#22c55e"}
          />
          <Text style={[styles.toggleText, transactionType === "income" ? styles.toggleTextActive : { color: "#22c55e" }]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* AMOUNT CARD */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={[styles.currencySymbol, transactionType === "income" && styles.currencySymbolIncome]}>
              {CURRENCY}
            </Text>
            <TextInput
              style={[styles.amountInput, transactionType === "income" && styles.amountInputIncome]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              selectTextOnFocus
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* TITLE CARD */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Title (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder={transactionType === "income" ? "e.g., Salary, Freelance" : "Enter title"}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* INCOME SPECIFIC: Payment Received Method */}
        {transactionType === "income" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Payment Received Via</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    incomePaymentMethod === "cash" && styles.optionBtnActive
                  ]}
                  onPress={() => setIncomePaymentMethod("cash")}
                >
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={incomePaymentMethod === "cash" ? "#fff" : "#22c55e"}
                  />
                  <Text style={[
                    styles.optionText,
                    incomePaymentMethod === "cash" && styles.optionTextActive
                  ]}>
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    incomePaymentMethod === "netbanking" && styles.optionBtnActive
                  ]}
                  onPress={() => {
                    setIncomePaymentMethod("netbanking");
                    // Fix: Auto-scroll to show bank picker
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
                  }}
                >
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={incomePaymentMethod === "netbanking" ? "#fff" : "#22c55e"}
                  />
                  <Text style={[
                    styles.optionText,
                    incomePaymentMethod === "netbanking" && styles.optionTextActive
                  ]}>
                    Net Banking
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Two Separate Cards for Bank and UPI - User must select BOTH */}
            {incomePaymentMethod === "netbanking" && (
              <>
                {/* Bank Card - Using state.banks from database */}
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Select Bank *</Text>
                  <View style={styles.bankOptionsGrid}>
                    {bankOptions.length > 0 ? (
                      bankOptions.map((bank: string) => (
                        <TouchableOpacity
                          key={bank}
                          style={[
                            styles.bankOptionBtn,
                            selectedBank === bank && styles.bankOptionBtnActive
                          ]}
                          onPress={() => setSelectedBank(bank)}
                        >
                          <Text style={[
                            styles.bankOptionText,
                            selectedBank === bank && styles.bankOptionTextActive
                          ]}>
                            {bank}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No banks available. Add in Profile.</Text>
                    )}
                  </View>
                </View>

                {/* UPI App Card - Using state.upiApps from database */}
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Select UPI App *</Text>
                  <View style={styles.bankOptionsGrid}>
                    {upiAppOptions.length > 0 ? (
                      upiAppOptions.map((app: string) => (
                        <TouchableOpacity
                          key={app}
                          style={[
                            styles.bankOptionBtn,
                            selectedUpiApp === app && styles.bankOptionBtnActive
                          ]}
                          onPress={() => setSelectedUpiApp(app)}
                        >
                          <Text style={[
                            styles.bankOptionText,
                            selectedUpiApp === app && styles.bankOptionTextActive
                          ]}>
                            {app}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No UPI apps available. Add in Profile.</Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* CATEGORY CARD */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Category</Text>

          {/* Category Preview */}
          <View style={styles.categoryPreview}>
            <View style={[styles.categoryPreviewIcon, { backgroundColor: selectedCategoryConfig.bg }]}>
              <Ionicons name={selectedCategoryConfig.icon} size={28} color={selectedCategoryConfig.color} />
            </View>
            <Text style={styles.categoryPreviewText}>{selectedCategory}</Text>
          </View>

          {/* Category Options with Icons */}
          <View style={styles.optionsGrid}>
            {(transactionType === "income" ? incomeCategories : categories).map((cat: string) => {
              const cfg = getCategoryConfig(cat);
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.optionBtn,
                    isSelected && { borderColor: cfg.color, borderWidth: 2, backgroundColor: cfg.bg }
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  {isSelected && <Ionicons name="checkmark-circle" size={14} color={cfg.color} style={{ marginRight: 2 }} />}
                  <Ionicons
                    name={cfg.icon}
                    size={16}
                    color={isSelected ? cfg.color : COLORS.gray400}
                    style={styles.categoryIcon}
                  />
                  <Text style={[
                    styles.optionText,
                    isSelected && { color: cfg.color, fontWeight: "700" }
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* OUTCOME SPECIFIC: PAYMENT METHOD CARD */}
        {transactionType === "outcome" && (
          <View style={styles.card}>
            <TouchableOpacity
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              onPress={() => setShowPaymentMethod(!showPaymentMethod)}
            >
              <Text style={[styles.cardLabel, { marginBottom: 0 }]}>Payment Details (Optional)</Text>
              <Ionicons name={showPaymentMethod ? "chevron-up" : "chevron-down"} size={20} color={COLORS.gray400} />
            </TouchableOpacity>

            {showPaymentMethod && (
              <View style={[styles.optionsGrid, { marginTop: 16 }]}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.optionBtn,
                      paymentMethod === method && styles.optionBtnActive
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text style={[
                      styles.optionText,
                      paymentMethod === method && styles.optionTextActive
                    ]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* DATE CARD — Fix: Display DD/MM/YYYY format */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Date</Text>
          <TextInput
            style={styles.textInput}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* NOTES CARD */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            transactionType === "income" && styles.saveButtonIncome
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? "Update Transaction" : (transactionType === "income" ? "Save Income" : "Add Expense")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#dbeafe",
    paddingTop: 50,
    paddingHorizontal: 14,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },

  // Toggle Styles
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
    gap: 8,
  },

  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },

  toggleBtnInactive: {
    backgroundColor: "#e2e8f0",
  },

  toggleBtnActive: {
    backgroundColor: "#ef4444",
  },

  toggleBtnActiveIncome: {
    backgroundColor: "#22c55e",
  },

  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },

  toggleTextActive: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 12,
  },

  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  currencySymbol: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
    marginRight: 8,
  },

  currencySymbolIncome: {
    color: "#22c55e",
  },

  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
    padding: 0,
  },

  amountInputIncome: {
    color: "#22c55e",
  },

  textInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#0f172a",
  },

  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },

  // Category Preview Styles
  categoryPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  categoryPreviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  categoryPreviewText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },

  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    gap: 6,
  },

  optionBtnActive: {
    backgroundColor: "#1e293b",
  },

  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },

  optionTextActive: {
    color: "#fff",
  },

  categoryIcon: {
    marginRight: 2,
  },

  // Bank/UPI Options Grid
  bankOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  bankOptionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },

  bankOptionBtnActive: {
    backgroundColor: "#22c55e",
  },

  bankOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },

  bankOptionTextActive: {
    color: "#fff",
  },

  noDataText: {
    fontSize: 14,
    color: "#94a3b8",
    fontStyle: "italic",
    paddingVertical: 8,
  },

  saveButton: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#1e293b",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },

  saveButtonIncome: {
    backgroundColor: "#22c55e",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
