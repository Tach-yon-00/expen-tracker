import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import { showToast } from "../../components/Toast";
import { useExpenses } from "../../context/ExpenseContext";
import { COLORS } from "../../constants/theme";
import { FadeInView, SlideInRow, ScalePressable, PopIn, BlurredOverlay, SlideUpView } from "../../components/Animations";
import { formatDateDisplay } from "../../utils/config";
import { getCategoryBranding } from "../../utils/categoryUtils";


const fallbackConfig = { color: "#9CA3AF", icon: "ellipsis-horizontal-outline" as keyof typeof Ionicons.glyphMap, bg: "#F3F4F6" };

export default function TransactionsScreen() {
  const router = useRouter();
  const { state, addExpense, deleteExpense } = useExpenses();
  const CURRENCY = state.currency || "₹";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPayment, setEditPayment] = useState("");


  const getCategoryConfigByName = (categoryName: string) => {
    return getCategoryBranding(categoryName, state.categories || []);
  };

  // Get categories list from state.categories (synced with server db)
  const categories = useMemo(() => {
    return (state.categories || []).map((cat: any) => cat.title);
  }, [state.categories]);

  // Keywords for filtering (from available categories in db)
  const keywords = useMemo(() => {
    return (state.categories || []).map((cat: any) => cat.title);
  }, [state.categories]);

  // Build payment methods from database (paymentMethods + banks + upiApps)
  const paymentMethods = useMemo(() => {
    const methods: string[] = [];
    // Add default payment methods
    (state.paymentMethods || []).forEach((pm: any) => methods.push(pm.name));
    // Add banks
    (state.banks || []).forEach((bank: any) => methods.push(bank.name));
    // Add UPI apps
    (state.upiApps || []).forEach((upi: any) => methods.push(upi.name));

    // If no payment methods in db, fallback to defaults
    if (methods.length === 0) {
      return ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"];
    }
    return methods;
  }, [state.paymentMethods, state.banks, state.upiApps]);


  const getPaymentMethodDisplay = (payment: string) => {
    // Check if it's a bank
    const bank = state.banks?.find((b: any) => b.name === payment);
    if (bank) return { icon: bank.icon, name: payment };

    // Check if it's a UPI app
    const upi = state.upiApps?.find((u: any) => u.name === payment);
    if (upi) return { icon: upi.icon, name: payment };

    // Check if it's a payment method
    const pm = state.paymentMethods?.find((p: any) => p.name === payment);
    if (pm) return { icon: pm.icon, name: payment };

    // Default fallback
    return { icon: "💳", name: payment };
  };

  // Filter expenses based on search and keyword
  const filteredExpenses = state.expenses.filter((expense: any) => {
    const searchLower = searchQuery.toLowerCase();
    const amountStr = expense.amount?.toString() || "";
    const matchesSearch = searchQuery === "" ||
      expense.title?.toLowerCase().includes(searchLower) ||
      expense.category?.toLowerCase().includes(searchLower) ||
      amountStr.includes(searchLower) ||
      (searchLower.startsWith("₹") && amountStr.includes(searchLower.replace("₹", ""))) ||
      (searchLower.startsWith("$") && amountStr.includes(searchLower.replace("$", "")));

    const matchesKeyword = !selectedKeyword ||
      expense.category?.toLowerCase() === selectedKeyword.toLowerCase();

    return matchesSearch && matchesKeyword;
  });

  // Sort by date (newest first)
  const sortedExpenses = [...filteredExpenses].sort((a: any, b: any) => {
    const dateA = new Date(a.date || Date.now());
    const dateB = new Date(b.date || Date.now());
    return dateB.getTime() - dateA.getTime();
  });

  const handleKeywordPress = (keyword: string) => {
    setSelectedKeyword(selectedKeyword === keyword ? null : keyword);
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

  const handleDelete = (id: string) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const deletedExpense = state.expenses.find((e: any) => e.id === id);
          await deleteExpense(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSelectedTransaction(null);
          if (deletedExpense) {
            showToast({
              message: "Transaction deleted",
              type: "undo",
              undoAction: async () => {
                await addExpense(deletedExpense);
              },
              duration: 4000,
            });
          }
        },
      },
    ]);
  };

  const renderCategorySelector = () => (
    <View style={styles.categorySelector}>
      {categories.map((cat: string) => (
        <TouchableOpacity
          key={cat}
          style={[styles.categoryOption, editCategory === cat && styles.categoryOptionSelected]}
          onPress={() => setEditCategory(cat)}
        >
          <Text style={[styles.categoryOptionText, editCategory === cat && styles.categoryOptionTextSelected]}>
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPaymentSelector = () => (
    <View style={styles.categorySelector}>
      {paymentMethods.map((method: string) => (
        <TouchableOpacity
          key={method}
          style={[styles.categoryOption, editPayment === method && styles.categoryOptionSelected]}
          onPress={() => setEditPayment(method)}
        >
          <Text style={[styles.categoryOptionText, editPayment === method && styles.categoryOptionTextSelected]}>
            {method}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <FadeInView duration={500}>
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>

          <ScalePressable
            style={styles.addNewBadge}
            onPress={() => router.push("/add" as any)}
          >
            <Text style={styles.addNewText}>Add new</Text>
            <Ionicons name="add" size={16} color={COLORS.textHeader} />
          </ScalePressable>
        </View>
      </FadeInView>

      {/* ── SEARCH & FILTER ── */}
      <FadeInView delay={100} duration={500}>
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color={COLORS.textHeader} />
          </TouchableOpacity>

          <View style={styles.searchInputWrapper}>
            <TextInput
              placeholder="Search Transactions"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray300}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>

          <TouchableOpacity
            style={styles.searchActionBtn}
            onPress={() => Keyboard.dismiss()}
          >
            <Text style={styles.searchActionText}>Search</Text>
          </TouchableOpacity>
        </View>
      </FadeInView>

      {/* ── KEYWORDS ── */}
      <SlideInRow delay={200} direction="bottom">
        <View style={styles.keywordCard}>
          <Text style={styles.keywordTitle}>Filter by category</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.keywordRoll}>
            {keywords.map((item: string) => (
              <TouchableOpacity
                key={item}
                onPress={() => handleKeywordPress(item)}
                style={[
                  styles.keywordChip,
                  selectedKeyword === item && styles.keywordChipActive
                ]}
              >
                <Text style={[
                  styles.keywordText,
                  selectedKeyword === item && styles.keywordTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SlideInRow>

      {/* ── RECENT TRANSACTIONS ── */}
      <FadeInView delay={300}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
      </FadeInView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.txList}
      >
        {sortedExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name={searchQuery || selectedKeyword ? "search-outline" : "receipt-outline"} size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedKeyword ? "No results found for your search" : "No transactions yet"}
            </Text>
          </View>
        ) : (
          (() => {
            let lastDateLabel = "";
            return sortedExpenses.map((item: any, index: number) => {
              const cfg = getCategoryConfigByName(item.category);
              const isIncome = item.type === "income";
              const dateLabel = formatDateDisplay(item.date);
              const showHeader = dateLabel !== lastDateLabel;
              lastDateLabel = dateLabel;

              return (
                <SlideInRow key={item.id || index} delay={350 + index * 60} direction="bottom">
                  {showHeader && (
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#64748b", marginTop: 16, marginBottom: 8, paddingLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {dateLabel}
                    </Text>
                  )}
                  <ScalePressable
                    style={styles.txRow}
                    onPress={() => setSelectedTransaction(item)}
                  >
                    <View style={[styles.txIconContainer, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.txTitle}>
                        {item.title || item.description || `${item.category} Expense`}
                      </Text>
                      <Text style={styles.txMetaRow}>
                        {item.category || "Others"} · {formatDateDisplay(item.date)}
                      </Text>
                    </View>

                    <Text style={[styles.txAmount, { color: isIncome ? "#22c55e" : "#ef4444" }]}>
                      {isIncome ? "+" : "-"}{CURRENCY}{Number(item.amount || 0).toFixed(2)}
                    </Text>
                  </ScalePressable>
                </SlideInRow>
              );
            });
          })()
        )}
      </ScrollView>

      {/* ── TRANSACTION DETAIL MODAL ──────────────────────────────────────────── */}
      <Modal
        visible={selectedTransaction !== null && !isEditing}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <BlurredOverlay
          visible={selectedTransaction !== null && !isEditing}
          onPress={() => setSelectedTransaction(null)}
        />
        <View style={styles.modalOverlay}>
          <SlideUpView style={styles.modalSheet}>
            {selectedTransaction && (() => {
              const cfg = getCategoryConfigByName(selectedTransaction.category);
              const paymentInfo = getPaymentMethodDisplay(selectedTransaction.payment);
              return (
                <>
                  <View style={styles.modalHandle} />

                  <View style={styles.modalHeaderRow}>
                    <View style={[styles.modalIconCircle, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={36} color={cfg.color} />
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTransaction(null)}>
                      <Ionicons name="close" size={20} color="#555" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalTitle}>
                    {selectedTransaction.title || selectedTransaction.description || `${selectedTransaction.category} Expense`}
                  </Text>
                  <Text style={styles.modalAmount}>
                    -{CURRENCY}{Number(selectedTransaction.amount || 0).toFixed(2)}
                  </Text>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailBoxTitle}>Transaction Details</Text>
                    <View style={styles.detailGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.category}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{formatDateDisplay(selectedTransaction.date)}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Payment</Text>
                        <Text style={styles.detailValue}>
                          {paymentInfo.name}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={[styles.detailValue, { color: "#22c55e" }]}>Completed</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#3b82f6" }]} onPress={handleEdit}>
                      <Ionicons name="pencil" size={18} color="#fff" />
                      <Text style={styles.modalBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: "#ef4444" }]}
                      onPress={() => handleDelete(selectedTransaction.id)}
                    >
                      <Ionicons name="trash" size={18} color="#fff" />
                      <Text style={styles.modalBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.doneBtn} onPress={() => setSelectedTransaction(null)}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </SlideUpView>
        </View>
      </Modal>

      {/* ── EDIT MODAL ────────────────────────────────────────────────────────── */}
      <Modal
        visible={isEditing}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditing(false)}
      >
        <BlurredOverlay visible={isEditing} onPress={() => setIsEditing(false)} />
        <View style={styles.modalOverlay}>
          <SlideUpView style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.editModalTitle}>Edit Transaction</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={20} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Enter title"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.inputPrefix}>{CURRENCY}</Text>
                  <TextInput
                    style={styles.input}
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    placeholder="0.00"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                {editCategory ? (
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, backgroundColor: "#f0fdf4", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: "flex-start" }}>
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>Selected: {editCategory}</Text>
                  </View>
                ) : null}
                {renderCategorySelector()}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    value={editDate}
                    onChangeText={setEditDate}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#aaa"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                {renderPaymentSelector()}
              </View>
            </ScrollView>

            {/* Fix: Sticky save/cancel buttons outside ScrollView */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#9ca3af" }]} onPress={() => setIsEditing(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#22c55e" }]} onPress={() => {
                setIsEditing(false);
                setSelectedTransaction(null);
              }}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </SlideUpView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 50,
    paddingHorizontal: 20,
  },

  // ── HEADER ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textHeader,
  },
  addNewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  addNewText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textHeader,
  },

  // ── SEARCH ──
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  searchInputWrapper: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    justifyContent: "center",
  },
  searchInput: {
    fontSize: 14,
    color: COLORS.textHeader,
  },
  searchActionBtn: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  searchActionText: {
    color: COLORS.textHeader,
    fontWeight: "700",
    fontSize: 14,
  },

  // ── KEYWORDS ──
  keywordCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  keywordTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textHeader,
    marginBottom: 12,
  },
  keywordRoll: {
    flexDirection: "row",
  },
  keywordChip: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  keywordChipActive: {
    backgroundColor: COLORS.primary,
  },
  keywordText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  keywordTextActive: {
    color: COLORS.white,
  },

  // ── TRANSACTIONS LIST ──
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textHeader,
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
  },
  txList: {
    paddingBottom: 120, // Space for FAB and TabBar
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  txIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  txContent: {
    flex: 1,
    gap: 4,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textHeader,
  },
  txMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txCategoryChip: {
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  txCategoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textHeader,
  },
  txDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  txAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.danger, // Bright red
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray400,
    fontWeight: "500",
    marginTop: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 16, // Square with rounded corners like the image
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // ── Modals (matching index.tsx)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 42,
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 20,
  },

  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 6,
  },

  modalAmount: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: -1,
  },

  detailBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  detailBoxTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  detailItem: {
    width: "45%",
  },

  detailLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    marginTop: 16,
  },

  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },

  modalBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  doneBtn: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  doneBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  // ── Edit Modal
  editModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  inputPrefix: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    padding: 0,
  },

  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },

  categoryOptionSelected: {
    backgroundColor: "#0f172a",
  },

  categoryOptionText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },

  categoryOptionTextSelected: {
    color: "#fff",
  },
});
