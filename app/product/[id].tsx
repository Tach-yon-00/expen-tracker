import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { FadeInView, PopIn, ScalePressable, SlideInRow } from "../../components/Animations";
import { showToast } from "../../components/Toast";
import { COLORS } from "../../constants/theme";
import { useExpenses } from "../../context/ExpenseContext";
import { useStoreProducts } from "../../services/storeService";

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { state, addExpense } = useExpenses();
    const CURRENCY = state.currency || "₹";

    const [selectedPlan, setSelectedPlan] = useState("1 Month");
    const { getProductById, loading } = useStoreProducts();
    const product = useMemo(() => getProductById(id), [id, getProductById]);

    const relatedProducts = useMemo(() => {
        if (!product || !product.categoryObj) return [];
        return product.categoryObj.items.filter((i: any) => i.id !== id);
    }, [product]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray400} />
                <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.textSecondary }}>Product not found.</Text>
                <ScalePressable onPress={() => router.back()} style={{ marginTop: 24, padding: 12, backgroundColor: COLORS.primary, borderRadius: 12 }}>
                    <Text style={{ color: COLORS.white, fontWeight: "600" }}>Go Back</Text>
                </ScalePressable>
            </View>
        );
    }

    const discountValue = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const handleBuyNow = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert("Confirm Purchase", `Buy ${product.name} (${selectedPlan}) for ${CURRENCY}${product.price}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Buy",
                style: "default",
                onPress: async () => {
                    try {
                        await addExpense({
                            id: Date.now().toString(),
                            title: product.name,
                            amount: product.price,
                            date: new Date().toISOString(),
                            category: product.categoryObj?.title || "Entertainment",
                            payment: "UPI", // Simulated default payment method
                            type: "outcome",
                        });
                        showToast({ message: "Purchase successful!", type: "success" });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        router.back();
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
            <View style={styles.header}>
                <ScalePressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textHeader} />
                </ScalePressable>
                <ScalePressable onPress={() => { }} style={styles.shareBtn}>
                    <Ionicons name="share-social-outline" size={20} color={COLORS.textHeader} />
                </ScalePressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Media Block */}
                <FadeInView delay={100} duration={500}>
                    <View style={[styles.heroBlock, { backgroundColor: product.color }]}>
                        <Ionicons name={product.icon as any} size={120} color={COLORS.white} style={{ opacity: 0.95 }} />
                    </View>
                </FadeInView>

                {/* Details Section */}
                <View style={styles.detailsContainer}>
                    <SlideInRow delay={200} direction="bottom">
                        <Text style={styles.productTitle}>{product.name}</Text>

                        <View style={styles.pricingRow}>
                            <Text style={styles.currentPrice}>{CURRENCY}{product.price}</Text>
                            {product.originalPrice && (
                                <Text style={styles.originalPrice}>{CURRENCY}{product.originalPrice}</Text>
                            )}
                            {discountValue > 0 && (
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>{discountValue}% OFF</Text>
                                </View>
                            )}
                        </View>

                        {/* Variants Selector */}
                        <View style={styles.planSection}>
                            <Text style={styles.planLabel}>Plan: <Text style={styles.planSelectedText}>{selectedPlan}</Text></Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planScroll}>
                                {((product as any).plans && (product as any).plans.length > 0 ? (product as any).plans : ["1 Month", "3 Month", "6 Month", "1 Year"]).map((plan: string) => (
                                    <ScalePressable
                                        key={plan}
                                        onPress={() => setSelectedPlan(plan)}
                                        style={[styles.planPill, selectedPlan === plan && styles.planPillActive]}
                                    >
                                        <Text style={[styles.planPillText, selectedPlan === plan && styles.planPillTextActive]}>{plan}</Text>
                                    </ScalePressable>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionRow}>
                            <ScalePressable style={styles.buyBtn} onPress={handleBuyNow}>
                                <Text style={styles.buyBtnText}>Buy Now</Text>
                            </ScalePressable>
                            <ScalePressable onPress={() => { }} style={styles.addToCartBtn}>
                                <Text style={styles.addToCartBtnText}>Add to Cart</Text>
                            </ScalePressable>
                        </View>
                    </SlideInRow>

                    <View style={styles.divider} />

                    {/* Features & Details */}
                    <SlideInRow delay={300} direction="bottom">
                        <Text style={styles.sectionTitle}>More Details</Text>

                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#ec4899" />
                            <Text style={styles.featureText}>
                                <Text style={{ fontWeight: "700" }}>Premium Access</Text> - Unlock all premium features and tools directly to your account.
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="shield-checkmark" size={20} color="#ec4899" />
                            <Text style={styles.featureText}>
                                <Text style={{ fontWeight: "700" }}>High Quality</Text> - Guaranteed uptime and no watermarks on digital items.
                            </Text>
                        </View>

                        <Text style={styles.faqTitle}>Q: Will the subscription be activated on my email?</Text>
                        <Text style={styles.faqBody}>A: Yes, the plan will be activated on your provided email via invite.</Text>
                    </SlideInRow>

                    {/* How it Works Banner */}
                    <PopIn delay={400} duration={600}>
                        <View style={styles.stepsBanner}>
                            <View style={styles.stepItem}>
                                <View style={[styles.stepCircle, { backgroundColor: "#8b5cf6" }]}>
                                    <Text style={styles.stepNum}>1</Text>
                                </View>
                                <Ionicons name="cart-outline" size={28} color={COLORS.textHeader} style={styles.stepIcon} />
                                <Text style={styles.stepText}>You Place an order</Text>
                            </View>
                            <Ionicons name="arrow-forward-outline" size={20} color={COLORS.gray400} />

                            <View style={styles.stepItem}>
                                <View style={[styles.stepCircle, { backgroundColor: "#10b981" }]}>
                                    <Text style={styles.stepNum}>2</Text>
                                </View>
                                <Ionicons name="logo-whatsapp" size={28} color="#25D366" style={styles.stepIcon} />
                                <Text style={styles.stepText}>Click on whatsapp and send order id</Text>
                            </View>
                            <Ionicons name="arrow-forward-outline" size={20} color={COLORS.gray400} />

                            <View style={styles.stepItem}>
                                <View style={[styles.stepCircle, { backgroundColor: "#3b82f6" }]}>
                                    <Text style={styles.stepNum}>3</Text>
                                </View>
                                <Ionicons name="cube-outline" size={28} color={COLORS.textHeader} style={styles.stepIcon} />
                                <Text style={styles.stepText}>We complete your order (15-60 min)</Text>
                            </View>
                        </View>
                    </PopIn>

                    <View style={styles.divider} />

                    {/* Related */}
                    <SlideInRow delay={500} direction="bottom">
                        <Text style={styles.sectionTitle}>More in category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                            {relatedProducts.map(rel => (
                                <ScalePressable
                                    key={rel.id}
                                    style={styles.relatedCard}
                                    onPress={() => router.push(`/product/${rel.id}` as any)}
                                >
                                    <View style={[styles.relatedImage, { backgroundColor: rel.color }]}>
                                        <Ionicons name={rel.icon as any} size={48} color={COLORS.white} />
                                    </View>
                                    <View style={styles.relatedInfo}>
                                        <Text style={styles.relatedTitle} numberOfLines={1}>{rel.name}</Text>
                                        <View style={styles.pricingRow}>
                                            <Text style={styles.relatedPrice}>{CURRENCY}{rel.price}</Text>
                                            {rel.originalPrice && <Text style={styles.relatedOldPrice}>{CURRENCY}{rel.originalPrice}</Text>}
                                        </View>
                                        <View style={styles.relatedBuyBadge}>
                                            <Ionicons name="cart-outline" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
                                            <Text style={styles.relatedBuyText}>Add to cart</Text>
                                        </View>
                                    </View>
                                </ScalePressable>
                            ))}
                        </ScrollView>
                    </SlideInRow>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: COLORS.white,
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        borderRadius: 22,
    },
    shareBtn: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.gray100,
        borderRadius: 22,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroBlock: {
        height: 380, // Taller like the Spotify image
        marginHorizontal: 16,
        borderRadius: 32, // More rounded corners
        marginTop: 0,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    detailsContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    productTitle: {
        fontSize: 24, // Slightly larger
        fontWeight: "700", // Spotify screenshot has bold but not ultra black text
        color: "#1e293b", // Slate 800 - softer than pure black
        marginBottom: 8,
    },
    pricingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 24,
    },
    currentPrice: {
        fontSize: 28, // Matches larger price
        fontWeight: "800",
        color: "#0f172a",
    },
    originalPrice: {
        fontSize: 15,
        color: COLORS.gray400,
        textDecorationLine: "line-through",
        fontWeight: "600",
    },
    discountBadge: {
        backgroundColor: "#22c55e",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 4,
    },
    discountText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "800",
    },
    planSection: {
        marginBottom: 24,
    },
    planLabel: {
        fontSize: 13,
        color: COLORS.gray400,
        marginBottom: 10,
    },
    planSelectedText: {
        fontWeight: "700",
        color: "#1e293b",
    },
    planScroll: {
        flexDirection: "row",
        overflow: "visible",
    },
    planPill: {
        borderWidth: 1,
        borderColor: COLORS.gray200,
        paddingHorizontal: 16,
        paddingVertical: 12, // Taller buttons
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: COLORS.white,
    },
    planPillActive: {
        borderColor: "#1e293b", // Dark outline
        backgroundColor: "#f8fafc", // Very slight tint
    },
    planPillText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: "600",
    },
    planPillTextActive: {
        color: "#0f172a",
        fontWeight: "700",
    },
    actionRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 10, // Add space above buttons
        marginBottom: 10,
    },
    buyBtn: {
        backgroundColor: "#1e3a5f", // Blue-ish dark like the screenshot
        paddingVertical: 14,
        paddingHorizontal: 24, // Fixed width-ish
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    buyBtnText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: "700",
    },
    addToCartBtn: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    addToCartBtnText: {
        color: "#1e3a5f", // Match primary button color
        fontSize: 15,
        fontWeight: "600",
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray100,
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textHeader,
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
        paddingRight: 20,
    },
    featureText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 20,
        flex: 1,
    },
    faqTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textHeader,
        marginTop: 12,
        marginBottom: 4,
    },
    faqBody: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    stepsBanner: {
        backgroundColor: "#f8fafc",
        borderRadius: 16,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 24,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    stepItem: {
        flex: 1,
        alignItems: "center",
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: -12,
        left: 0,
        zIndex: 2,
        borderWidth: 3,
        borderColor: "#f8fafc",
    },
    stepNum: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: "800",
    },
    stepIcon: {
        marginBottom: 8,
        marginTop: 10,
    },
    stepText: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.textSecondary,
        textAlign: "center",
        paddingHorizontal: 4,
    },
    relatedScroll: {
        flexDirection: "row",
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    relatedCard: {
        width: 140,
        marginRight: 16,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: "hidden",
    },
    relatedImage: {
        height: 120,
        justifyContent: "center",
        alignItems: "center",
    },
    relatedInfo: {
        padding: 12,
    },
    relatedTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textHeader,
        marginBottom: 6,
    },
    relatedPrice: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.textHeader,
    },
    relatedOldPrice: {
        fontSize: 10,
        color: COLORS.gray400,
        textDecorationLine: "line-through",
        marginLeft: -4,
    },
    relatedBuyBadge: {
        flexDirection: "row",
        backgroundColor: COLORS.textHeader,
        paddingVertical: 6,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    relatedBuyText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "700",
    },
});
