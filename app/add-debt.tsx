import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { ScalePressable } from "../components/Animations";
import { COLORS, SHADOWS, TYPOGRAPHY } from "../constants/theme";
import { useExpenses } from "../context/ExpenseContext";

export default function AddDebtScreen() {
    const router = useRouter();
    const { addDebt, state } = useExpenses();
    const CURRENCY = state.currency || "₹";

    const [type, setType] = useState<"owe" | "receive">("owe");
    const [person, setPerson] = useState("");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    // Default to today's date formatted as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const handleSave = async () => {
        if (!person.trim()) {
            Alert.alert("Missing Info", "Please enter the person's name.");
            return;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0.");
            return;
        }

        setLoading(true);
        try {
            await addDebt({
                type,
                person: person.trim(),
                originalAmount: Number(amount),
                reason: reason.trim(),
                date: today
            });
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to save debt. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <View style={styles.header}>
                    <ScalePressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textHeader} />
                    </ScalePressable>
                    <Text style={styles.headerTitle}>New Ledger Entry</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Type Selector */}
                    <View style={styles.typeSelector}>
                        <ScalePressable
                            onPress={() => setType("owe")}
                            style={[
                                styles.typeOption,
                                type === "owe" ? styles.typeOptionActiveOwe : null
                            ]}
                        >
                            <Ionicons
                                name="arrow-down-outline"
                                size={20}
                                color={type === "owe" ? COLORS.white : COLORS.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.typeText,
                                    type === "owe" ? styles.typeTextActive : null
                                ]}
                            >
                                I Borrowed
                            </Text>
                        </ScalePressable>

                        <ScalePressable
                            onPress={() => setType("receive")}
                            style={[
                                styles.typeOption,
                                type === "receive" ? styles.typeOptionActiveReceive : null
                            ]}
                        >
                            <Ionicons
                                name="arrow-up-outline"
                                size={20}
                                color={type === "receive" ? COLORS.white : COLORS.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.typeText,
                                    type === "receive" ? styles.typeTextActive : null
                                ]}
                            >
                                I Lent
                            </Text>
                        </ScalePressable>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount</Text>
                        <View style={styles.amountContainer}>
                            <Text style={styles.currencySymbol}>{CURRENCY}</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                autoFocus
                            />
                        </View>
                    </View>

                    {/* Person Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Who is this with?</Text>
                        <View style={styles.textInputContainer}>
                            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Name or phone"
                                placeholderTextColor={COLORS.textMuted}
                                value={person}
                                onChangeText={setPerson}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    {/* Reason Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Reason (Optional)</Text>
                        <View style={styles.textInputContainer}>
                            <Ionicons name="chatbubble-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. Dinner, Cab fare"
                                placeholderTextColor={COLORS.textMuted}
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <ScalePressable
                        onPress={handleSave}
                        disabled={loading}
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Entry</Text>
                        )}
                    </ScalePressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 40 : 10,
        paddingBottom: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray50,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "flex-start",
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 18,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    typeSelector: {
        flexDirection: "row",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 4,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        ...SHADOWS.sm,
    },
    typeOption: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    typeOptionActiveOwe: {
        backgroundColor: COLORS.danger,
        ...SHADOWS.sm,
    },
    typeOptionActiveReceive: {
        backgroundColor: COLORS.success,
        ...SHADOWS.sm,
    },
    typeText: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.textSecondary,
    },
    typeTextActive: {
        color: COLORS.white,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.textHeader,
        marginBottom: 8,
    },
    amountContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        ...SHADOWS.sm,
        height: 80,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: "700",
        color: COLORS.primary,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 36,
        fontWeight: "800",
        color: COLORS.textHeader,
        height: "100%",
    },
    textInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        ...SHADOWS.sm,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        ...TYPOGRAPHY.body,
        color: COLORS.textHeader,
        height: "100%",
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray50,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        ...SHADOWS.md,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        ...TYPOGRAPHY.bodyBold,
        color: COLORS.white,
        fontSize: 18,
    },
});
