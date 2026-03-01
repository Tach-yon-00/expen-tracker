import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { FadeInView, ScalePressable, SlideInRow } from "../../components/Animations";
import { COLORS, SHADOWS, TYPOGRAPHY } from "../../constants/theme";
import { Debt, useExpenses } from "../../context/ExpenseContext";

export default function LedgerScreen() {
    const router = useRouter();
    const { state } = useExpenses();
    const CURRENCY = state.currency || "₹";

    // Compute derived state from actual backend data
    const debts = state.debts || [];

    const youOwe = debts
        .filter(d => d.type === "owe")
        .reduce((sum, d) => sum + d.remainingAmount, 0);

    const receivable = debts
        .filter(d => d.type === "receive")
        .reduce((sum, d) => sum + d.remainingAmount, 0);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <FadeInView duration={500}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Ledger</Text>
                        <Text style={styles.subtitle}>Track your debts and receivables</Text>
                    </View>
                </FadeInView>

                {/* SUMMARY CARDS */}
                <View style={styles.cardsRow}>
                    {/* YOU OWE CARD */}
                    <SlideInRow delay={200} direction="bottom" style={styles.cardWrapper}>
                        <View style={[styles.card, styles.oweCard]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconBoxOwe}>
                                    <Ionicons name="arrow-down-outline" size={18} color={COLORS.danger} />
                                </View>
                                <Text style={styles.cardTitle}>You Owe</Text>
                            </View>

                            <View style={styles.amountContainer}>
                                <Text style={[styles.amount, { color: COLORS.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {CURRENCY}{youOwe.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                </Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.footerText}>To pay</Text>
                                <Ionicons name="chevron-forward" size={12} color={COLORS.danger} />
                            </View>
                        </View>
                    </SlideInRow>

                    {/* RECEIVABLE CARD */}
                    <SlideInRow delay={400} direction="bottom" style={styles.cardWrapper}>
                        <View style={[styles.card, styles.receiveCard]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconBoxReceive}>
                                    <Ionicons name="arrow-up-outline" size={18} color={COLORS.success} />
                                </View>
                                <Text style={styles.cardTitle}>Receivable</Text>
                            </View>

                            <View style={styles.amountContainer}>
                                <Text style={[styles.amount, { color: COLORS.success }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {CURRENCY}{receivable.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                </Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <Text style={styles.footerText}>To collect</Text>
                                <Ionicons name="chevron-forward" size={12} color={COLORS.success} />
                            </View>
                        </View>
                    </SlideInRow>
                </View>

                {/* ACTIVE DEBTS LIST */}
                <View style={styles.listContainer}>
                    <FadeInView delay={600}>
                        <Text style={styles.sectionTitle}>Recent Action</Text>

                        {debts.length === 0 ? (
                            <Text style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginTop: 24, textAlign: 'center' }}>
                                No debts logged yet. Press the + button to add one.
                            </Text>
                        ) : debts.map((item: Debt, index: number) => (
                            <SlideInRow key={item.id} delay={700 + (index * 100)} direction="bottom">
                                <ScalePressable onPress={() => { }} style={styles.listItem}>
                                    <View style={styles.listIconContainer}>
                                        <View style={[
                                            styles.listIcon,
                                            { backgroundColor: item.type === "owe" ? COLORS.dangerLight : COLORS.successLight }
                                        ]}>
                                            <Ionicons
                                                name="person"
                                                size={20}
                                                color={item.type === "owe" ? COLORS.danger : COLORS.success}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.listContent}>
                                        <Text style={styles.personName}>{item.person}</Text>
                                        <Text style={styles.reasonText} numberOfLines={1}>{item.reason} • {item.date}</Text>
                                    </View>
                                    <View style={styles.listRight}>
                                        <Text style={[
                                            styles.listAmount,
                                            { color: item.type === "owe" ? COLORS.danger : COLORS.success }
                                        ]}>
                                            {item.type === "owe" ? "-" : "+"}{CURRENCY}{item.remainingAmount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                        </Text>
                                        <View style={[styles.statusBadge, item.remainingAmount === 0 && { backgroundColor: COLORS.successLight }]}>
                                            <Text style={[styles.statusText, item.remainingAmount === 0 && { color: COLORS.success }]}>{item.status}</Text>
                                        </View>
                                    </View>
                                </ScalePressable>
                            </SlideInRow>
                        ))}
                    </FadeInView>
                </View>
            </ScrollView>

            <View style={styles.fabContainer}>
                <ScalePressable
                    style={styles.fab}
                    onPress={() => router.push("/add-debt")}
                >
                    <Ionicons name="add" size={32} color={COLORS.white} />
                </ScalePressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        ...TYPOGRAPHY.h1,
        marginBottom: 4,
    },
    subtitle: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
    },
    cardsRow: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 24,
    },
    cardWrapper: {
        flex: 1,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        minHeight: 140,
        justifyContent: 'space-between',
    },
    oweCard: {
        backgroundColor: COLORS.white,
    },
    receiveCard: {
        backgroundColor: COLORS.white,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    iconBoxOwe: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.dangerLight,
        justifyContent: "center",
        alignItems: "center",
    },
    iconBoxReceive: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.successLight,
        justifyContent: "center",
        alignItems: "center",
    },
    cardTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 13,
        color: COLORS.textHeader,
    },
    amountContainer: {
        paddingVertical: 4,
    },
    amount: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray50,
        marginTop: 4,
    },
    footerText: {
        ...TYPOGRAPHY.bodySmall,
        fontSize: 11,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    listContainer: {
        flex: 1,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h2,
        marginBottom: 16,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    listIconContainer: {
        marginRight: 16,
    },
    listIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        flex: 1,
    },
    personName: {
        ...TYPOGRAPHY.bodyBold,
        fontSize: 16,
        color: COLORS.textHeader,
        marginBottom: 4,
    },
    reasonText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
    },
    listRight: {
        alignItems: "flex-end",
    },
    listAmount: {
        ...TYPOGRAPHY.h3,
        marginBottom: 6,
    },
    statusBadge: {
        backgroundColor: COLORS.gray50,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        ...TYPOGRAPHY.tiny,
        fontWeight: "600",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
    },
    fabContainer: {
        position: 'absolute',
        bottom: 100, // Increased to clear the bottom tab navigation bar
        right: 24,
        zIndex: 999,
        elevation: 10,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.md,
        elevation: 8,
    },
});
