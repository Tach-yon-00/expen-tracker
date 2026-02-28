import { isOnboardingDone } from "../../storage/onboarding";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { G, Text as SvgText } from "react-native-svg";
import { PieChart } from "react-native-svg-charts";
import { TransactionRowSkeleton } from "../../components/SkeletonLoader";
import { showToast } from "../../components/Toast";
import { useExpenses } from "../../context/ExpenseContext";
import { formatDateDisplay, getContextualTagline } from "../../utils/config";
import { navVisibility } from "./_layout";
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING } from "../../constants/theme";
import { FadeInView, SlideInRow, ScalePressable, PopIn, BounceInView, BlurredOverlay, SlideUpView } from "../../components/Animations";

const fallbackConfig = { color: "#9CA3AF", icon: "ellipsis-horizontal-outline" as keyof typeof Ionicons.glyphMap, bg: "#F3F4F6" };

export default function HomeScreen() {
  const router = useRouter();
  const progress = useRef(new Animated.Value(0)).current;
  const { state, budget, updateBudget, deleteExpense, updateExpense } = useExpenses();
  const CURRENCY = typeof state.currency === 'string' ? state.currency : "₹";
  const userName = state.user?.name || "User1234";

  // Check onboarding logic on focus to redirect unauthenticated users back to onboarding
  const { fetchExpenses } = useExpenses();
  const [isChecking, setIsChecking] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const checkOnboarding = async () => {
        const done = await isOnboardingDone();

        if (!done && isMounted) {
          router.replace("/onboarding" as any);
          return;
        }

        if (done && isMounted) {
          await fetchExpenses();
        }
        if (isMounted) setIsChecking(false);
      };

      checkOnboarding();
      return () => { isMounted = false; };
    }, [])
  );

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [upiApps, setUpiApps] = useState<any[]>([]);
  // Budget edit modal state
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPayment, setEditPayment] = useState("");

  // Build dynamic category config from state.categories (synced with server db)
  const categoryConfig = useMemo(() => {
    const config: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {};
    (state.categories || []).forEach((cat: any) => {
      config[cat.title] = {
        color: cat.color,
        icon: (cat.icon as keyof typeof Ionicons.glyphMap) || "ellipsis-horizontal-outline",
        bg: cat.color + "20"
      };
      const simplifiedTitle = cat.title.split(' ')[0];
      if (!config[simplifiedTitle]) {
        config[simplifiedTitle] = {
          color: cat.color,
          icon: (cat.icon as keyof typeof Ionicons.glyphMap) || "ellipsis-horizontal-outline",
          bg: cat.color + "20"
        };
      }
    });
    return config;
  }, [state.categories]);

  const getCategoryConfigByName = (categoryName: string) => {
    if (categoryConfig[categoryName]) {
      return categoryConfig[categoryName];
    }
    const simplified = categoryName.split(' ')[0];
    if (categoryConfig[simplified]) {
      return categoryConfig[simplified];
    }
    for (const catTitle of Object.keys(categoryConfig)) {
      if (catTitle.toLowerCase().includes(categoryName.toLowerCase()) ||
        categoryName.toLowerCase().includes(catTitle.toLowerCase())) {
        return categoryConfig[catTitle];
      }
    }
    return fallbackConfig;
  };

  // Removed loadProfileName useEffect, using state.user instead

  useEffect(() => {
    if (state.categories && state.categories.length > 0) {
      setCategories(state.categories.map((c: any) => c.title));
    }
  }, [state.categories]);

  useEffect(() => {
    if (state.paymentMethods && state.paymentMethods.length > 0) {
      setPaymentMethods(state.paymentMethods.map((m: any) => m.name));
    } else {
      setPaymentMethods(["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"]);
    }
  }, [state.paymentMethods]);

  const MONTHLY_BUDGET = budget || 3500;

  // Fix: Separate income and expenses
  const expenseItems = state.expenses.filter((e: any) => e.type !== "income");
  const incomeItems = state.expenses.filter((e: any) => e.type === "income");

  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const todayStr = now.toISOString().split('T')[0];

  const currentMonthExpenses = expenseItems.filter((e: any) => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const lastMonthExpenses = expenseItems.filter((e: any) => {
    const d = new Date(e.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  // Calculate current month's spending to tally properly
  const totalSpent = currentMonthExpenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalIncome = incomeItems.reduce((sum: number, item: any) => sum + item.amount, 0);

  const lastTotal = lastMonthExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  // Fix: Only show comparison when there's prior month data
  const hasLastMonthData = lastMonthExpenses.length > 0;
  const savingsPercent = lastTotal > 0 ? (((lastTotal - totalSpent) / lastTotal) * 100).toFixed(1) : "0.0";
  const isSaved = Number(savingsPercent) > 0;
  const remaining = MONTHLY_BUDGET - totalSpent;
  const usedPercent = Math.min((totalSpent / MONTHLY_BUDGET) * 100, 100);

  // Fix: Daily allowance calculation
  const dailyAllowance = daysLeft > 0 ? (remaining / daysLeft) : 0;

  // Fix: Count today's transactions for contextual tagline
  const todayCount = expenseItems.filter((e: any) => e.date === todayStr).length;

  useEffect(() => {
    Animated.timing(progress, { toValue: usedPercent, duration: 1200, useNativeDriver: false }).start();
  }, [usedPercent]);

  const widthInterpolated = progress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  // Fix: Progress bar color based on thresholds
  const getProgressColor = () => {
    if (usedPercent > 90) return "#ef4444";
    if (usedPercent > 75) return "#f59e0b";
    return "#38bdf8";
  };

  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach((e: any) => {
    if (!categoryTotals[e.category]) categoryTotals[e.category] = 0;
    categoryTotals[e.category] += e.amount;
  });

  const categorySlices = Object.keys(categoryTotals).map((key, index) => {
    const cfg = getCategoryConfigByName(key);
    return {
      key: `${key}-${index}`,
      value: categoryTotals[key],
      svg: { fill: cfg.color, strokeLinecap: "round" },
      label: key,
      isRemaining: false,
    };
  });

  const remainingSlice = remaining > 0 ? [{ key: "remaining", value: remaining, svg: { fill: "#E5E7EB", strokeLinecap: "round" }, label: "Remaining", isRemaining: true }] : [];
  const pieData = [...categorySlices, ...remainingSlice];

  // @ts-ignore
  const Labels = ({ slices }: { slices: any[] }) => slices.map((slice: any, i: number) => {
    if (slice.data.value === 0) return null;
    const pct = MONTHLY_BUDGET > 0 ? ((slice.data.value / MONTHLY_BUDGET) * 100).toFixed(1) : "0.0";
    if (parseFloat(pct) < 1) return null; // Hide extremely small slices

    const [cx, cy] = slice.pieCentroid;
    const dist = Math.sqrt(cx * cx + cy * cy);
    const radiusOut = dist + 24; // Push labels outside the ring
    const nx = (cx / dist) * radiusOut;
    const ny = (cy / dist) * radiusOut;

    return (
      <G key={i}>
        <SvgText x={nx} y={ny} fill={slice.data.svg.fill} fontSize={10} fontWeight="700" textAnchor="middle" alignmentBaseline="middle">{Math.round(parseFloat(pct))}%</SvgText>
      </G>
    );
  });

  const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.date || Date.now()).getTime() - new Date(a.date || Date.now()).getTime());
  const recentExpenses = sortedExpenses.slice(0, 5);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Transaction", "Delete this transaction? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          // Store the deleted expense for undo
          const deletedExpense = state.expenses.find((e: any) => e.id === id);
          await deleteExpense(id);
          setSelectedTransaction(null);
          if (deletedExpense) {
            showToast({
              message: "Transaction deleted",
              type: "undo",
              undoAction: async () => {
                const { addExpense } = useExpenses();
                // Re-add is handled by the undo callback
              },
              duration: 4000,
            });
          }
        }
      },
    ]);
  };

  const handleEdit = () => {
    if (selectedTransaction) {
      setEditTitle(selectedTransaction.title || "");
      setEditAmount(selectedTransaction.amount.toString());
      setEditCategory(selectedTransaction.category || "Food");
      setEditDate(selectedTransaction.date || "");
      setEditPayment(selectedTransaction.payment || "UPI");
      setIsEditing(true);
    }
  };

  const saveEdit = async () => {
    if (selectedTransaction) {
      const updatedExpense = { ...selectedTransaction, title: editTitle || selectedTransaction.title, amount: parseFloat(editAmount) || selectedTransaction.amount, category: editCategory || selectedTransaction.category, date: editDate || selectedTransaction.date, payment: editPayment || selectedTransaction.payment };
      await updateExpense(updatedExpense);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      setSelectedTransaction(updatedExpense);
      showToast({ message: "Transaction updated", type: "success" });
    }
  };

  const handleBudgetSave = async () => {
    const newValue = parseFloat(newBudgetValue);
    if (!isNaN(newValue) && newValue > 0) {
      await updateBudget(newValue);
      setBudgetModalVisible(false);
      showToast({ message: "Budget updated", type: "success" });
    } else {
      Alert.alert("Error", "Please enter a valid budget amount");
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.categorySelector}>
      {/* Show selected category chip at top */}
      {editCategory ? (
        <View style={[styles.selectedCategoryChip, { backgroundColor: (getCategoryConfigByName(editCategory)).bg, borderColor: (getCategoryConfigByName(editCategory)).color }]}>
          <Ionicons name="checkmark-circle" size={16} color={(getCategoryConfigByName(editCategory)).color} />
          <Text style={[styles.selectedCategoryChipText, { color: (getCategoryConfigByName(editCategory)).color }]}>
            {editCategory}
          </Text>
        </View>
      ) : null}
      {categories.map((cat) => (
        <TouchableOpacity key={cat} style={[styles.categoryOption, editCategory === cat && styles.categoryOptionSelected]} onPress={() => setEditCategory(cat)}>
          <Text style={[styles.categoryOptionText, editCategory === cat && styles.categoryOptionTextSelected]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPaymentSelector = () => (
    <View style={styles.categorySelector}>
      {paymentMethods.map((method) => (
        <TouchableOpacity key={method} style={[styles.categoryOption, editPayment === method && styles.categoryOptionSelected]} onPress={() => setEditPayment(method)}>
          <Text style={[styles.categoryOptionText, editPayment === method && styles.categoryOptionTextSelected]}>{method}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const trendingIcon = isSaved ? "trending-down-outline" : "trending-up-outline";
  const trendingColor = isSaved ? "#16a34a" : "#dc2626";
  const percentPrefix = isSaved ? "-" : "+";

  // Fix: Greeting — fallback to "Hello! 👋" if no name
  const greetingText = userName ? `Hello, ${userName}! 👋` : "Hello! 👋";
  // Fix: Contextual tagline
  const taglineText = getContextualTagline(todayCount, usedPercent, daysLeft);

  return (
    <>
      <Animated.ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: navVisibility } } }], { useNativeDriver: false })} scrollEventThrottle={16}>

        {/* Fix: Add page title for consistency with other screens */}
        <FadeInView duration={600}>
          <Text style={styles.pageTitle}>Dashboard</Text>

          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greetingText}</Text>
              <Text style={styles.subGreeting}>{taglineText}</Text>
            </View>
            {/* Fix: + button with label */}
            <ScalePressable style={styles.addButton} onPress={() => router.push("/add")}>
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonLabel}>Add</Text>
            </ScalePressable>
          </View>
        </FadeInView>

        <FadeInView delay={200} duration={800}>
          <View style={[styles.card, { backgroundColor: '#2C1259', overflow: 'hidden' }]}>
            {/* Top Right Decorative Blob */}
            <View style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: '#4A238A',
              opacity: 0.8,
            }} />

            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 6 }}>Total spent this month</Text>
                <Text style={{ color: "#fff", fontSize: 34, fontWeight: "700", marginBottom: 6 }}>{CURRENCY}{totalSpent.toLocaleString("en-IN")}</Text>
                {totalIncome > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="arrow-up-circle" size={14} color="#86efac" />
                    <Text style={{ color: "#86efac", fontSize: 13, fontWeight: "600" }}>Income: {CURRENCY}{totalIncome.toLocaleString("en-IN")}</Text>
                  </View>
                )}
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: 12,
                borderRadius: 16,
                alignSelf: 'flex-start'
              }}>
                <Ionicons name="cash-outline" size={28} color="#0EA5E9" />
              </View>
            </View>

            <View style={{ marginTop: 20, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 6, opacity: 0.9 }}
                onPress={() => {
                  setNewBudgetValue(MONTHLY_BUDGET.toString());
                  setBudgetModalVisible(true);
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" }}>Budget : {CURRENCY}{MONTHLY_BUDGET.toLocaleString("en-IN")}</Text>
                <Ionicons name="pencil" size={12} color="#fff" />
              </TouchableOpacity>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" }}>Remaining : {CURRENCY}{remaining.toLocaleString("en-IN")}</Text>
            </View>

            <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
              <Animated.View style={[{ height: "100%", borderRadius: 3 }, { width: widthInterpolated, backgroundColor: getProgressColor() }]} />
            </View>

            <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: getProgressColor(), fontSize: 12, fontWeight: "700" }}>{usedPercent.toFixed(1)}% used</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{daysLeft} days left</Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={400}>
          <View style={styles.summaryRow}>
            <PopIn delay={450} style={styles.summaryCard}>
              <BounceInView delay={550} style={[styles.summaryIconBox, { backgroundColor: remaining >= 0 ? COLORS.successLight : "#FEE2E2" }]}>
                <Ionicons name={remaining >= 0 ? "shield-checkmark-outline" : "warning-outline"} size={28} color={remaining >= 0 ? COLORS.success : COLORS.danger} />
              </BounceInView>
              <Text style={styles.summaryLabel}>Budget Left</Text>
              <Text style={[styles.summaryValue, { color: remaining >= 0 ? COLORS.success : COLORS.danger }]}>{CURRENCY}{Math.abs(remaining).toLocaleString("en-IN")}</Text>
              <Text style={{ fontSize: 10, color: COLORS.gray400, textAlign: "center" }}>{remaining >= 0 ? "remaining" : "over budget"}</Text>
            </PopIn>
            <PopIn delay={550} style={styles.summaryCard}>
              <BounceInView delay={650} style={[styles.summaryIconBox, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="wallet-outline" size={28} color={COLORS.primary} />
              </BounceInView>
              <Text style={styles.summaryLabel}>Daily Limit</Text>
              <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{CURRENCY}{dailyAllowance.toFixed(0)}</Text>
              <Text style={{ fontSize: 10, color: COLORS.gray400, textAlign: "center" }}>per day</Text>
            </PopIn>
          </View>
        </FadeInView>

        <FadeInView delay={600}>
          <View style={[styles.donutCard, { paddingHorizontal: 16 }]}>
            <Text style={[styles.donutTitle, { color: "#0F4666", marginBottom: 24 }]}>Spending by category</Text>
            <View style={styles.donutChartWrapper}>
              <PieChart style={{ height: 260, width: 260 }} data={pieData} innerRadius="75%" outerRadius="82%" padAngle={0.04}>
                <Labels slices={[]} />
              </PieChart>
              <View style={styles.donutCenter}>
                <View style={{ backgroundColor: "#E0F2FE", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 }}>
                  <Text style={{ color: "#0F4666", fontSize: 10, fontWeight: "700" }}>{usedPercent.toFixed(1)}%</Text>
                </View>
                <Text style={{ fontSize: 11, color: COLORS.gray400, marginBottom: 2 }}>You've spent</Text>
                <Text style={{ fontSize: 30, fontWeight: "800", color: "#0F4666", letterSpacing: -1 }}>
                  {CURRENCY}{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.gray400, marginTop: 4 }}>of {CURRENCY}{MONTHLY_BUDGET.toLocaleString("en-IN")}</Text>
              </View>
            </View>
            <View style={styles.donutLegend}>
              {categorySlices.map((slice: any, i: number) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: slice.svg.fill }]} />
                  <Text style={styles.legendText}>{slice.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent transactions</Text><TouchableOpacity onPress={() => router.push("/transactions")}><Text style={styles.viewAll}>view all</Text></TouchableOpacity></View>
          {state.loading ? (
            // Fix: Skeleton loader while data loads
            [1, 2, 3].map(i => <TransactionRowSkeleton key={i} />)
          ) : recentExpenses.length === 0 ? (
            <View style={styles.emptyState}><Ionicons name="receipt-outline" size={40} color={COLORS.gray300} /><Text style={styles.emptyText}>No transactions yet</Text><Text style={styles.emptySubtext}>Add your first expense to see it here</Text></View>
          ) : (
            recentExpenses.map((item: any, index: number) => {
              const cfg = getCategoryConfigByName(item.category);
              const isIncome = item.type === "income";
              return (
                <SlideInRow key={index} delay={700 + index * 100}>
                  <ScalePressable style={styles.txRow} onPress={() => setSelectedTransaction(item)}>
                    <View style={[styles.txIconBox, { backgroundColor: cfg.bg }]}><Ionicons name={cfg.icon} size={22} color={cfg.color} /></View>
                    <View style={styles.txInfo}><Text style={styles.txName} numberOfLines={1}>{item.title || item.description || `${item.category} Expense`}</Text>
                      <View style={styles.txMeta}><View style={[styles.txBadge, { backgroundColor: cfg.bg }]}><Text style={[styles.txBadgeText, { color: cfg.color }]}>{item.category}</Text></View><Text style={styles.txDate}>{formatDateDisplay(item.date)}</Text></View>
                    </View>
                    <Text style={[styles.txAmount, { color: isIncome ? COLORS.success : COLORS.danger }]}>{isIncome ? "+" : "-"}{CURRENCY}{item.amount.toFixed(2)}</Text>
                  </ScalePressable>
                </SlideInRow>
              );
            })
          )}
        </View>
      </Animated.ScrollView>

      {/* BUDGET EDIT MODAL */}
      <Modal visible={budgetModalVisible} animationType="fade" transparent onRequestClose={() => setBudgetModalVisible(false)}>
        <BlurredOverlay visible={budgetModalVisible} onPress={() => setBudgetModalVisible(false)} />
        <View style={styles.modalOverlay}>
          <SlideUpView style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.editModalTitle}>Edit Monthly Budget</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setBudgetModalVisible(false)}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Budget</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputPrefix}>{CURRENCY}</Text>
                <TextInput
                  style={styles.input}
                  value={newBudgetValue}
                  onChangeText={setNewBudgetValue}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  placeholder="Enter budget amount"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: "#22c55e" }]} onPress={handleBudgetSave}>
              <Text style={styles.doneBtnText}>Save Budget</Text>
            </TouchableOpacity>
          </SlideUpView>
        </View>
      </Modal>

      {/* TRANSACTION DETAIL MODAL */}
      <Modal visible={selectedTransaction !== null && !isEditing} animationType="fade" transparent onRequestClose={() => setSelectedTransaction(null)}>
        <BlurredOverlay visible={selectedTransaction !== null && !isEditing} onPress={() => setSelectedTransaction(null)} />
        <View style={styles.modalOverlay}>
          <SlideUpView style={styles.modalSheet}>
            {selectedTransaction && (() => {
              const cfg = getCategoryConfigByName(selectedTransaction.category); return (
                <><View style={styles.modalHandle} /><View style={styles.modalHeaderRow}><View style={[styles.modalIconCircle, { backgroundColor: cfg.bg }]}><Ionicons name={cfg.icon} size={36} color={cfg.color} /></View><TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTransaction(null)}><Ionicons name="close" size={20} color="#555" /></TouchableOpacity></View>
                  <Text style={styles.modalTitle}>{selectedTransaction.title || selectedTransaction.description || `${selectedTransaction.category} Expense`}</Text><Text style={styles.modalAmount}>-{CURRENCY}{selectedTransaction.amount.toFixed(2)}</Text>
                  <View style={styles.detailBox}><Text style={styles.detailBoxTitle}>Transaction Details</Text><View style={styles.detailGrid}><View style={styles.detailItem}><Text style={styles.detailLabel}>Category</Text><Text style={styles.detailValue}>{selectedTransaction.category}</Text></View><View style={styles.detailItem}><Text style={styles.detailLabel}>Date</Text><Text style={styles.detailValue}>{formatDateDisplay(selectedTransaction.date)}</Text></View><View style={styles.detailItem}><Text style={styles.detailLabel}>Payment</Text><Text style={styles.detailValue}>{selectedTransaction.payment || "UPI"}</Text></View><View style={styles.detailItem}><Text style={styles.detailLabel}>Status</Text><Text style={[styles.detailValue, { color: "#22c55e" }]}>Completed</Text></View></View></View>
                  <View style={styles.modalActions}><TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#3b82f6" }]} onPress={handleEdit}><Ionicons name="pencil" size={18} color="#fff" /><Text style={styles.modalBtnText}>Edit</Text></TouchableOpacity><TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#ef4444" }]} onPress={() => handleDelete(selectedTransaction.id)}><Ionicons name="trash" size={18} color="#fff" /><Text style={styles.modalBtnText}>Delete</Text></TouchableOpacity></View>
                  <TouchableOpacity style={styles.doneBtn} onPress={() => setSelectedTransaction(null)}><Text style={styles.doneBtnText}>Done</Text></TouchableOpacity></>
              );
            })()}
          </SlideUpView>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={isEditing} animationType="slide" transparent onRequestClose={() => setIsEditing(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}><Text style={styles.editModalTitle}>Edit Transaction</Text><TouchableOpacity style={styles.closeBtn} onPress={() => setIsEditing(false)}><Ionicons name="close" size={20} color="#555" /></TouchableOpacity></View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Title</Text><View style={styles.inputBox}><TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Enter title" placeholderTextColor="#aaa" /></View></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Amount</Text><View style={styles.inputBox}><Text style={styles.inputPrefix}>{CURRENCY}</Text><TextInput style={styles.input} value={editAmount} onChangeText={setEditAmount} keyboardType="decimal-pad" selectTextOnFocus placeholder="0.00" placeholderTextColor="#aaa" /></View></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Category</Text>
              {editCategory ? (<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, backgroundColor: "#f0fdf4", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: "flex-start" }}><Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 6 }} /><Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>Selected: {editCategory}</Text></View>) : null}
              {renderCategorySelector()}</View>
            {/* Fix: Date label — no format hint */}
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Date</Text><View style={styles.inputBox}><TextInput style={styles.input} value={editDate} onChangeText={setEditDate} placeholder="DD/MM/YYYY" placeholderTextColor="#aaa" /></View></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Payment Method</Text>{renderPaymentSelector()}</View>
          </ScrollView>
          {/* Fix: Sticky save button */}
          <View style={styles.modalActions}><TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#9ca3af" }]} onPress={() => setIsEditing(false)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#22c55e" }]} onPress={saveEdit}><Text style={styles.modalBtnText}>Save</Text></TouchableOpacity></View>
        </View></View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: 60 },
  pageTitle: { ...TYPOGRAPHY.h1, marginBottom: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
  greeting: { ...TYPOGRAPHY.h2, color: COLORS.textHeader },
  subGreeting: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginTop: 2 },
  addButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.primary },
  addButtonLabel: { fontSize: 14, fontWeight: "600", color: "#fff" },
  card: { borderRadius: 24, padding: 22, overflow: "hidden", ...SHADOWS.md },
  cardBlob: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.05)", top: -60, right: -40 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  moneyIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  cardAmount: { color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 4, marginBottom: 8, letterSpacing: -1 },
  incomeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  incomeText: { color: "#86efac", fontSize: 14, fontWeight: "600" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  cardMeta: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "500" },
  progressTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, overflow: "hidden", marginVertical: 12 },
  progressFill: { height: "100%", borderRadius: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.lg, gap: 16 },
  summaryCard: { flex: 1, backgroundColor: "#fff", borderRadius: 24, padding: 18, alignItems: "center", ...SHADOWS.sm },
  summaryIconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  summaryLabel: { ...TYPOGRAPHY.bodySmall, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryHintText: { fontSize: 11, color: COLORS.gray400, textAlign: "center", fontStyle: "italic", lineHeight: 15 },
  sectionCard: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginTop: SPACING.lg, ...SHADOWS.sm },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { ...TYPOGRAPHY.h3 },
  viewAll: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  donutCard: { backgroundColor: "#fff", borderRadius: 24, padding: 20, marginTop: SPACING.lg, alignItems: "center", ...SHADOWS.sm },
  donutTitle: { width: "100%", ...TYPOGRAPHY.h3, marginBottom: 16 },
  donutChartWrapper: { justifyContent: "center", alignItems: "center", marginVertical: 10 },
  donutPercent: { backgroundColor: COLORS.primaryLight, color: COLORS.primary, fontSize: 12, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  donutCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  donutCenterLabel: { ...TYPOGRAPHY.bodySmall },
  donutCenterAmount: { fontSize: 32, fontWeight: "800", color: COLORS.textHeader, letterSpacing: -1 },
  donutCenterSub: { fontSize: 13, color: COLORS.gray400 },
  donutLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 10, gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textMain },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray50 },
  txIconBox: { width: 52, height: 52, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 14 },
  txInfo: { flex: 1 },
  txName: { fontSize: 16, fontWeight: "600", color: COLORS.textHeader, marginBottom: 4 },
  txMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  txBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  txBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  txDate: { fontSize: 12, color: COLORS.gray400 },
  txAmount: { fontSize: 16, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { ...TYPOGRAPHY.h3, color: COLORS.gray400 },
  emptySubtext: { ...TYPOGRAPHY.bodySmall, color: COLORS.gray300 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 42, ...SHADOWS.lg },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray100, alignSelf: "center", marginBottom: 20 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalIconCircle: { width: 72, height: 72, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray50, justifyContent: "center", alignItems: "center" },
  modalTitle: { ...TYPOGRAPHY.h2, textAlign: "center", marginBottom: 4 },
  modalAmount: { fontSize: 40, fontWeight: "800", color: COLORS.danger, textAlign: "center", marginBottom: 24, letterSpacing: -1.5 },
  detailBox: { backgroundColor: COLORS.gray50, borderRadius: 20, padding: 20, marginBottom: 20 },
  detailBoxTitle: { fontSize: 12, fontWeight: "700", color: COLORS.gray400, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "space-between" },
  detailItem: { width: "45%" as any },
  detailLabel: { fontSize: 12, color: COLORS.gray400, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: "600", color: COLORS.textHeader },
  modalActions: { flexDirection: "row", gap: 12, marginBottom: 12, marginTop: 16 },
  modalBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 16, gap: 8 },
  modalBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  doneBtn: { backgroundColor: COLORS.textHeader, borderRadius: 18, paddingVertical: 18, alignItems: "center" },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  editModalTitle: { ...TYPOGRAPHY.h2 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textMain, marginBottom: 8 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.gray50, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.gray100 },
  inputPrefix: { fontSize: 18, fontWeight: "700", color: COLORS.textHeader, marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: COLORS.textHeader, padding: 0 },
  categorySelector: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryOption: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.gray100 },
  categoryOptionSelected: { backgroundColor: COLORS.textHeader },
  categoryOptionText: { fontSize: 13, color: COLORS.textMain, fontWeight: "600" },
  categoryOptionTextSelected: { color: "#fff" },
  selectedCategoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, marginBottom: 12 },
  selectedCategoryChipText: { fontSize: 14, fontWeight: "700" },
});
