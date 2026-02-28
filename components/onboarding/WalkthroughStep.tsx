import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from "react-native";
import { FadeInView, PopIn, SlideInRow, ScalePressable } from "../../components/Animations";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WalkthroughStepProps {
    currency: string;
    persona: string;
    onNext: () => void;
}

export function WalkthroughStep({ currency, onNext }: WalkthroughStepProps) {
    const [tutorialStep, setTutorialStep] = useState(1);
    const [amount, setAmount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const handleAmountSubmit = () => {
        if (!amount) {
            setAmount("150"); // Auto-fill if empty
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTutorialStep(2);
    };

    const handleCategorySelect = (cat: string) => {
        Haptics.selectionAsync();
        setSelectedCategory(cat);
        setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTutorialStep(3);
        }, 400); // Snappier transition
    };

    const handleFinish = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onNext();
    };

    const handleBack = () => {
        if (tutorialStep > 1) {
            Haptics.selectionAsync();
            setTutorialStep(tutorialStep - 1);
        }
    };

    const handleNumpadPress = (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (key === 'backspace') {
            setAmount(prev => prev.slice(0, -1));
        } else if (key === 'submit') {
            handleAmountSubmit();
        } else {
            if (amount.length < 6) {
                setAmount(prev => prev + key);
            }
        }
    };

    const renderTutorialHeader = () => {
        let title = "";
        let desc = "";
        switch (tutorialStep) {
            case 1:
                title = "Expense Entry";
                desc = "Enter the transaction amount";
                break;
            case 2:
                title = "Select Category";
                desc = "What did you spend on?";
                break;
            case 3:
                title = "Review & Log";
                desc = "Save your transaction";
                break;
        }

        return (
            <FadeInView duration={400} key={tutorialStep} style={styles.header}>
                {/* Premium Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${(tutorialStep / 3) * 100}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>Step {tutorialStep} of 3</Text>
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{desc}</Text>
            </FadeInView>
        );
    };

    const renderNumpad = () => {
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

        return (
            <View style={styles.numpadContainer}>
                {keys.map((key, index) => {
                    if (key === '') return <View key={`empty-${index}`} style={styles.numpadKeyPlaceholder} />;

                    return (
                        <ScalePressable
                            key={key}
                            style={styles.numpadKeyWrapper}
                            onPress={() => handleNumpadPress(key === 'backspace' ? 'backspace' : key)}
                        >
                            <View style={styles.numpadKey}>
                                {key === 'backspace' ? (
                                    <Ionicons name="backspace-outline" size={24} color="#005478" />
                                ) : (
                                    <Text style={styles.numpadKeyText}>{key}</Text>
                                )}
                            </View>
                        </ScalePressable>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.navHeader}>
                {tutorialStep > 1 && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#005478" />
                    </TouchableOpacity>
                )}
            </View>

            {renderTutorialHeader()}

            <View style={styles.content}>
                {tutorialStep === 1 && (
                    <SlideInRow delay={100} direction="bottom" style={styles.stepContainerAmount}>
                        <View style={styles.amountDisplayArea}>
                            <Text style={styles.currencySymbol}>{currency}</Text>
                            <View style={styles.amountValueContainer}>
                                <Text
                                    style={[
                                        styles.amountValueText,
                                        !amount && styles.amountPlaceholder
                                    ]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {amount || "0"}
                                </Text>
                            </View>
                        </View>

                        {renderNumpad()}

                        <PopIn delay={200} style={styles.primaryActionContainer}>
                            <ScalePressable
                                style={[styles.primaryBtn, !amount && styles.primaryBtnDisabled]}
                                onPress={handleAmountSubmit}
                                disabled={!amount}
                            >
                                <Text style={styles.primaryBtnText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </ScalePressable>
                        </PopIn>
                    </SlideInRow>
                )}

                {tutorialStep === 2 && (
                    <SlideInRow delay={100} direction="right" style={styles.stepContainer}>
                        <View style={styles.categoryGrid}>
                            {[
                                { name: "Food", icon: "fast-food" as any, color: "#FF9F43" },
                                { name: "Transport", icon: "car" as any, color: "#2E86DE" },
                                { name: "Shopping", icon: "cart" as any, color: "#EE5253" },
                                { name: "Drinks", icon: "beer" as any, color: "#1DD1A1" },
                                { name: "Leisure", icon: "film" as any, color: "#54A0FF" },
                                { name: "Other", icon: "ellipsis-horizontal" as any, color: "#8395A7" },
                            ].map(cat => (
                                <ScalePressable
                                    key={cat.name}
                                    style={styles.categoryCardWrapper}
                                    onPress={() => handleCategorySelect(cat.name)}
                                >
                                    <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + '15' }]}>
                                        <Ionicons name={cat.icon} size={26} color={cat.color} />
                                    </View>
                                    <Text style={styles.categoryLabel}>{cat.name}</Text>
                                </ScalePressable>
                            ))}
                        </View>
                    </SlideInRow>
                )}

                {tutorialStep === 3 && (
                    <SlideInRow delay={100} direction="bottom" style={styles.stepContainer}>
                        <View style={styles.receiptCard}>
                            <View style={styles.receiptHeader}>
                                <View style={styles.receiptIcon}>
                                    <Ionicons name="checkmark-circle" size={48} color="#005478" />
                                </View>
                                <Text style={styles.receiptTitle}>Summary</Text>
                            </View>

                            <View style={styles.receiptDivider} />

                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Amount</Text>
                                <Text style={styles.receiptValue}>{currency}{amount}</Text>
                            </View>

                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Category</Text>
                                <Text style={styles.receiptValue}>{selectedCategory}</Text>
                            </View>

                            <View style={[styles.receiptDivider, { marginTop: 20 }]} />

                            <View style={styles.receiptTotalRow}>
                                <Text style={styles.receiptTotalLabel}>Ready to save</Text>
                            </View>
                        </View>

                        <PopIn delay={300} style={styles.finishActionContainer}>
                            <ScalePressable style={styles.finishBtn} onPress={handleFinish}>
                                <Text style={styles.finishBtnText}>Confirm & Log Expense</Text>
                            </ScalePressable>
                        </PopIn>
                    </SlideInRow>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafd",
        alignItems: "center",
    },
    navHeader: {
        width: "100%",
        paddingHorizontal: 24,
        height: 60,
        justifyContent: "flex-end",
        marginTop: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "flex-start",
    },
    header: {
        width: "100%",
        paddingHorizontal: 32,
        marginTop: 20,
        marginBottom: 30,
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressBarBackground: {
        height: 6,
        backgroundColor: "#e2e8f0",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#005478",
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: "#94a3b8",
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: "#1e293b",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: "#64748b",
        fontWeight: "500",
        lineHeight: 22,
    },
    content: {
        flex: 1,
        width: "100%",
        alignItems: "center",
    },
    stepContainer: {
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    stepContainerAmount: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },

    /* Amount Input Area */
    amountDisplayArea: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40,
    },
    currencySymbol: {
        fontSize: 28,
        fontWeight: "700",
        color: "#005478",
        marginRight: 8,
        marginTop: 4,
    },
    amountValueContainer: {
        minWidth: 100,
        borderBottomWidth: 3,
        borderBottomColor: "#005478",
        paddingBottom: 4,
    },
    amountValueText: {
        fontSize: 48,
        fontWeight: "900",
        color: "#1e293b",
        textAlign: "center",
    },
    amountPlaceholder: {
        color: "#cbd5e1",
    },

    /* Premium Numpad */
    numpadContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        width: SCREEN_WIDTH * 0.8,
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 40,
    },
    numpadKeyWrapper: {
        width: (SCREEN_WIDTH * 0.8 - 32) / 3,
        aspectRatio: 1.2,
    },
    numpadKey: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    numpadKeyText: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1e293b",
    },
    numpadKeyPlaceholder: {
        width: (SCREEN_WIDTH * 0.8 - 32) / 3,
        aspectRatio: 1.2,
    },

    /* Actions */
    primaryActionContainer: {
        width: "100%",
        alignItems: "center",
    },
    primaryBtn: {
        backgroundColor: "#005478",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 20,
        shadowColor: "#005478",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryBtnDisabled: {
        backgroundColor: "#94a3b8",
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryBtnText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },

    /* Category Grid */
    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 16,
        width: "100%",
    },
    categoryCardWrapper: {
        width: (SCREEN_WIDTH - 64) / 3,
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        marginBottom: 8,
    },
    categoryIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    categoryLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#475569",
    },

    /* Receipt Card */
    receiptCard: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
        marginBottom: 40,
    },
    receiptHeader: {
        alignItems: "center",
        marginBottom: 20,
    },
    receiptIcon: {
        marginBottom: 12,
    },
    receiptTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1e293b",
    },
    receiptDivider: {
        height: 1,
        backgroundColor: "#f1f5f9",
        width: "100%",
        marginBottom: 20,
    },
    receiptRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    receiptLabel: {
        fontSize: 15,
        color: "#64748b",
        fontWeight: "500",
    },
    receiptValue: {
        fontSize: 16,
        color: "#1e293b",
        fontWeight: "700",
    },
    receiptTotalRow: {
        alignItems: "center",
    },
    receiptTotalLabel: {
        fontSize: 14,
        color: "#005478",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    finishActionContainer: {
        width: "100%",
        alignItems: "center",
    },
    finishBtn: {
        backgroundColor: "#005478",
        width: "100%",
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: "center",
        shadowColor: "#005478",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    finishBtnText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
    },
});
