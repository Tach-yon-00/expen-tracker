import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useExpenses } from "../context/ExpenseContext";
import { FadeInView, SlideInRow, ScalePressable, FadeScaleIn, SlideUpView, StaggeredSlideIn } from "../components/Animations";

// Popular icons for payment methods
const PAYMENT_ICONS = [
  { icon: "💳", label: "Card" },
  { icon: "📱", label: "UPI" },
  { icon: "💵", label: "Cash" },
  { icon: "🏦", label: "Bank" },
  { icon: "💰", label: "Money" },
];

export default function ManagePaymentMethods() {
  const router = useRouter();
  const { 
    state, 
    addPaymentMethod, 
    deletePaymentMethod, 
    addBank, 
    deleteBank, 
    addUpiApp, 
    deleteUpiApp 
  } = useExpenses();

  // Tabs: payment, bank, upi
  const [activeTab, setActiveTab] = useState<"payment" | "bank" | "upi">("payment");

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("💳");

  // Open add modal
  const openAddModal = () => {
    setNewName("");
    setNewIcon("💳");
    setShowAddModal(true);
  };

  // Close add modal
  const closeAddModal = () => {
    setShowAddModal(false);
    setNewName("");
    setNewIcon("💳");
  };

  // Add item based on active tab
  const handleAdd = async () => {
    if (!newName.trim()) {
      Alert.alert("Required", "Please enter a name");
      return;
    }

    const item = {
      id: Date.now().toString(),
      name: newName.trim(),
      icon: newIcon
    };

    if (activeTab === "payment") {
      await addPaymentMethod(item);
    } else if (activeTab === "bank") {
      await addBank(item);
    } else if (activeTab === "upi") {
      await addUpiApp(item);
    }

    closeAddModal();
  };

  // Delete handler
  const handleDelete = (type: "payment" | "bank" | "upi", id: string, name: string) => {
    Alert.alert(
      "Delete Item",
      `Remove "${name}" from your list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (type === "payment") deletePaymentMethod(id);
            if (type === "bank") deleteBank(id);
            if (type === "upi") deleteUpiApp(id);
          }
        }
      ]
    );
  };

  // Get current list based on tab
  const getCurrentList = () => {
    if (activeTab === "payment") return state.paymentMethods || [];
    if (activeTab === "bank") return state.banks || [];
    return state.upiApps || [];
  };

  // Get tab title
  const getTabTitle = () => {
    if (activeTab === "payment") return "Payment Methods";
    if (activeTab === "bank") return "Banks";
    return "UPI Apps";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <FadeInView duration={500}>
        <View style={styles.header}>
          <ScalePressable onPress={() => router.back()}>
            <View style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#0f172a" />
            </View>
          </ScalePressable>
          <Text style={styles.title}>Payment Methods</Text>
          <View style={{ width: 40 }} />
        </View>
      </FadeInView>

      {/* Tab Bar */}
      <FadeInView delay={100} duration={500}>
        <View style={styles.tabBar}>
          <ScalePressable onPress={() => setActiveTab("payment")}>
            <View style={[styles.tab, activeTab === "payment" && styles.tabActive]}>
              <Ionicons 
                name="wallet-outline" 
                size={18} 
                color={activeTab === "payment" ? "#fff" : "#64748b"} 
              />
              <Text style={[styles.tabLabel, activeTab === "payment" && styles.tabLabelActive]}>
                Payment
              </Text>
            </View>
          </ScalePressable>
          <ScalePressable onPress={() => setActiveTab("bank")}>
            <View style={[styles.tab, activeTab === "bank" && styles.tabActive]}>
              <Ionicons 
                name="business-outline" 
                size={18} 
                color={activeTab === "bank" ? "#fff" : "#64748b"} 
              />
              <Text style={[styles.tabLabel, activeTab === "bank" && styles.tabLabelActive]}>
                Banks
              </Text>
            </View>
          </ScalePressable>
          <ScalePressable onPress={() => setActiveTab("upi")}>
            <View style={[styles.tab, activeTab === "upi" && styles.tabActive]}>
              <Ionicons 
                name="phone-portrait-outline" 
                size={18} 
                color={activeTab === "upi" ? "#fff" : "#64748b"} 
              />
              <Text style={[styles.tabLabel, activeTab === "upi" && styles.tabLabelActive]}>
                UPI
              </Text>
            </View>
          </ScalePressable>
        </View>
      </FadeInView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <FadeScaleIn delay={200} duration={500}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#0e5f85" />
            <Text style={styles.infoText}>
              Manage your {getTabTitle().toLowerCase()} for faster checkout
            </Text>
          </View>
        </FadeScaleIn>

        {/* Current List */}
        <FadeInView delay={300} duration={500}>
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Your {getTabTitle()}</Text>
              <Text style={styles.listCount}>{getCurrentList().length} items</Text>
            </View>

            {getCurrentList().length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No {getTabTitle()} yet</Text>
                <Text style={styles.emptySub}>Tap the button below to add one</Text>
              </View>
            ) : (
              getCurrentList().map((item: any, index: number) => (
                <SlideInRow key={item.id} delay={350 + index * 60}>
                  <View style={styles.itemCard}>
                    <View style={styles.itemLeft}>
                      <View style={styles.iconCircle}>
                        <Text style={styles.itemIcon}>{item.icon}</Text>
                      </View>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <ScalePressable onPress={() => handleDelete(activeTab, item.id, item.name)}>
                      <View style={styles.itemAction}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </View>
                    </ScalePressable>
                  </View>
                </SlideInRow>
              ))
            )}
          </View>
        </FadeInView>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <View style={styles.fabContainer}>
        <FadeInView delay={500}>
          <ScalePressable onPress={openAddModal}>
            <View style={styles.fab}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          </ScalePressable>
        </FadeInView>
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <SlideUpView slideDistance={80} duration={400}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Add {activeTab === "payment" ? "Payment Method" : activeTab === "bank" ? "Bank" : "UPI App"}
                </Text>
                <ScalePressable onPress={closeAddModal}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </ScalePressable>
              </View>

              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newName}
                onChangeText={setNewName}
                placeholder={activeTab === "payment" ? "e.g., Credit Card" : activeTab === "bank" ? "e.g., HDFC Bank" : "e.g., Google Pay"}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.modalLabel}>Choose Icon</Text>
              <View style={styles.iconGrid}>
                {PAYMENT_ICONS.map((item, index) => (
                  <FadeScaleIn key={item.icon} delay={100 + index * 40} duration={250} startScale={0.8}>
                    <ScalePressable onPress={() => setNewIcon(item.icon)}>
                      <View style={[styles.iconOption, newIcon === item.icon && styles.iconOptionActive]}>
                        <Text style={styles.iconEmoji}>{item.icon}</Text>
                      </View>
                    </ScalePressable>
                  </FadeScaleIn>
                ))}
              </View>

              <ScalePressable onPress={handleAdd}>
                <View style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>Add {activeTab === "payment" ? "Payment Method" : activeTab === "bank" ? "Bank" : "UPI App"}</Text>
                </View>
              </ScalePressable>
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
    backgroundColor: "#f8fafc",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#0e5f85",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  tabLabelActive: {
    color: "#fff",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#0369a1",
    fontWeight: "500",
  },
  listSection: {
    marginBottom: 24,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  listCount: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 22,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  itemAction: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  fabContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0e5f85",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0e5f85",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  iconOptionActive: {
    backgroundColor: "#0e5f85",
  },
  iconEmoji: {
    fontSize: 24,
  },
  modalBtn: {
    backgroundColor: "#0e5f85",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
