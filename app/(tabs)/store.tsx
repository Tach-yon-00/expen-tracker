import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { FadeInView, PopIn, ScalePressable, SlideInRow } from "../../components/Animations";
import { showToast } from "../../components/Toast";
import { COLORS } from "../../constants/theme";
import { useExpenses } from "../../context/ExpenseContext";

export const STORE_CATEGORIES = [
    {
        id: "freelance",
        title: "Freelance Assets",
        items: [
            { id: "f1", name: "Invoicing Template Pro", price: 499, originalPrice: 999, icon: "document-text", color: "#8b5cf6", category: "Work" },
            { id: "f2", name: "Contract Agreement Draft", price: 299, originalPrice: 599, icon: "briefcase", color: "#3b82f6", category: "Work" },
            { id: "f3", name: "Brand Guidelines Pack", price: 799, originalPrice: 1299, icon: "color-palette", color: "#ec4899", category: "Work" },
        ]
    },
    {
        id: "gaming",
        title: "Gaming & Keys",
        items: [
            { id: "g1", name: "Steam Key: Cyberpunk", price: 1499, originalPrice: 2999, icon: "game-controller", color: "#ef4444", category: "Entertainment", plans: ["1 Month"] },
            { id: "g2", name: "Xbox Game Pass (1M)", price: 349, originalPrice: 499, icon: "logo-xbox", color: "#10b981", category: "Entertainment", plans: ["1 Month"] },
            { id: "g3", name: "PSN Wallet Top-Up", price: 1000, originalPrice: 1000, icon: "logo-playstation", color: "#0ea5e9", category: "Entertainment", plans: ["1 Month"] },
        ]
    },
    {
        id: "entertainment",
        title: "OTT Subscriptions",
        items: [
            { id: "e1", name: "Netflix Premium (1M)", price: 499, originalPrice: 649, icon: "film", color: "#dc2626", category: "Entertainment", plans: ["1 Month", "3 Month", "6 Month"] },
            { id: "e2", name: "Spotify Premium (1M)", price: 99, originalPrice: 119, icon: "musical-notes", color: "#22c55e", category: "Entertainment", plans: ["1 Month", "6 Month", "1 Year"] },
            { id: "e3", name: "Prime Video (1 Yr)", price: 1499, originalPrice: 1999, icon: "play-circle", color: "#f59e0b", category: "Entertainment", plans: ["1 Month", "1 Year"] },
        ]
    }
];

import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useStoreProducts } from "../../services/storeService";

export default function StoreScreen() {
    const { categories, loading, error } = useStoreProducts();
    const router = useRouter();
    const { state, addExpense } = useExpenses();
    const CURRENCY = state.currency || "₹";

    const handlePurchase = (item: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert("Confirm Purchase", `Buy ${item.name} for ${CURRENCY}${item.price}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Buy",
                style: "default",
                onPress: async () => {
                    try {
                        await addExpense({
                            id: Date.now().toString(),
                            title: item.name,
                            amount: item.price,
                            date: new Date().toISOString(),
                            category: item.category || "Entertainment",
                            payment: "UPI", // Simulated default payment method
                            type: "outcome",
                        });
                        showToast({ message: "Purchase successful!", type: "success" });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } catch (e) {
                        showToast({ message: "Purchase failed", type: "error" });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <FadeInView duration={500}>
                <View style={styles.header}>
                    <Text style={styles.title}>Store</Text>
                    <View style={styles.balanceBadge}>
                        <Ionicons name="wallet-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.balanceText}>{CURRENCY}{state.upiBalance.toFixed(2)}</Text>
                    </View>
                </View>
            </FadeInView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : error ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 }}>
                        <Text style={{ color: COLORS.danger }}>Failed to load products: {error.message}</Text>
                    </View>
                ) : categories.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 80 }}>
                        <Ionicons name="cart-outline" size={48} color={COLORS.gray400} />
                        <Text style={{ marginTop: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
                            Store is currently empty.{"\n"} Hold On Tight
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Hero Banner */}
                        <PopIn delay={100} duration={600}>
                            <View style={styles.heroBanner}>
                                <View style={styles.heroContent}>
                                    <View style={styles.heroBadge}>
                                        <Text style={styles.heroBadgeText}>Deal of the Day</Text>
                                    </View>
                                    <Text style={styles.heroTitle}>Mastering React Native 2026</Text>
                                    <Text style={styles.heroSubtitle}>Complete course + UI Kit</Text>

                                    <View style={styles.heroPricingRow}>
                                        <Text style={styles.heroPrice}>{CURRENCY}1999</Text>
                                        <Text style={styles.heroOriginalPrice}>{CURRENCY}4999</Text>
                                    </View>

                                    <ScalePressable style={styles.heroBuyBtn} onPress={() => handlePurchase({ name: "React Native Masterclass", price: 1999, category: "Education" })}>
                                        <Text style={styles.heroBuyText}>Buy Now</Text>
                                        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                                    </ScalePressable>
                                </View>
                                <View style={styles.heroIconWrap}>
                                    <Ionicons name="code-slash" size={64} color="#3b82f6" style={{ opacity: 0.2, position: "absolute", right: -10, bottom: -10 }} />
                                    <Ionicons name="rocket" size={48} color={COLORS.white} />
                                </View>
                            </View>
                        </PopIn>

                        {/* Categories */}
                        {categories.map((category, catIndex) => (
                            <SlideInRow key={category.id} delay={200 + catIndex * 100} direction="bottom">
                                <View style={styles.categorySection}>
                                    <View style={styles.categoryHeader}>
                                        <Text style={styles.categoryTitle}>{category.title}</Text>
                                        <ScalePressable onPress={() => { }}>
                                            <Text style={styles.seeAllText}>See All</Text>
                                        </ScalePressable>
                                    </View>

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.horizontalScroll}
                                    >
                                        {category.items.map((item, itemIndex) => (
                                            <ScalePressable
                                                key={item.id}
                                                style={styles.productCard}
                                                onPress={() => router.push(`/product/${item.id}` as any)}
                                            >
                                                <View style={[styles.productIconFrame, { backgroundColor: item.color + "1A" }]}>
                                                    <Ionicons name={item.icon as any} size={32} color={item.color} />
                                                </View>
                                                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

                                                <View style={styles.pricingRow}>
                                                    <Text style={styles.productPrice}>{CURRENCY}{item.price}</Text>
                                                    {item.originalPrice && (
                                                        <Text style={styles.productOldPrice}>{CURRENCY}{item.originalPrice}</Text>
                                                    )}
                                                </View>

                                                <View style={styles.buyBadge}>
                                                    <Text style={styles.buyBadgeText}>Buy</Text>
                                                </View>
                                            </ScalePressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            </SlideInRow>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: 50,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: COLORS.textHeader,
    },
    balanceBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    balanceText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.primaryDark,
    },
    scrollContent: {
        paddingBottom: 120, // Tab bar padding
    },

    // Hero Banner
    heroBanner: {
        marginHorizontal: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        padding: 24,
        flexDirection: "row",
        overflow: "hidden",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 32,
    },
    heroContent: {
        flex: 1,
        zIndex: 2,
    },
    heroBadge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 12,
    },
    heroBadgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    heroTitle: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 4,
    },
    heroSubtitle: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        marginBottom: 16,
    },
    heroPricingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    heroPrice: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: "800",
    },
    heroOriginalPrice: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
        textDecorationLine: "line-through",
        fontWeight: "600",
    },
    heroBuyBtn: {
        backgroundColor: COLORS.white,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    heroBuyText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: "700",
    },
    heroIconWrap: {
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 16,
        zIndex: 1,
    },

    // Category Section
    categorySection: {
        marginBottom: 28,
    },
    categoryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textHeader,
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.primary,
    },
    horizontalScroll: {
        paddingHorizontal: 14, // Leave 6px for card margins
    },

    // Product Card
    productCard: {
        width: 150,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 6,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    productIconFrame: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textHeader,
        marginBottom: 8,
        height: 40, // Fixed height for 2 lines
    },
    pricingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.textHeader,
    },
    productOldPrice: {
        fontSize: 12,
        color: COLORS.gray400,
        textDecorationLine: "line-through",
    },
    buyBadge: {
        backgroundColor: COLORS.gray100,
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: "center",
    },
    buyBadgeText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textHeader,
    },
});
