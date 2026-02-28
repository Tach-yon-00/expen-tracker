import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
// Accessibility: aria-label managed internally
import { COLORS } from "../../constants/theme";
import { StepWrapper } from "./OnboardingShell";

const CURRENCIES = [
  { symbol: "₹", label: "INR", name: "Indian Rupee" },
  { symbol: "$", label: "USD", name: "US Dollar" },
  { symbol: "€", label: "EUR", name: "Euro" },
  { symbol: "£", label: "GBP", name: "British Pound" },
  { symbol: "¥", label: "JPY", name: "Japanese Yen" },
  { symbol: "A$", label: "AUD", name: "Australian Dollar" },
];

interface CurrencyStepProps {
  currency: string;
  setCurrency: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  context: { personaLabel: string };
}

export function CurrencyStep({ currency, setCurrency, onNext, onSkip, context }: CurrencyStepProps) {
  return (
    <StepWrapper>
      <View style={styles.container}>
        <View style={styles.textGroup}>
          <Text style={styles.heading}>Choose your currency</Text>
          <Text style={styles.subtitle}>
            We'll format {context.personaLabel} amounts for you.
          </Text>
        </View>

        <View style={styles.grid}>
          {CURRENCIES.map((c, i) => {
            const selected = currency === c.symbol;
            return (
              <CurrencyCard
                key={c.label}
                selected={selected}
                symbol={c.symbol}
                label={c.label}
                name={c.name}
                delay={i * 40}
                onPress={() => setCurrency(c.symbol)}
              />
            );
          })}
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.8}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </StepWrapper>
  );
}

function CurrencyCard({
  selected, symbol, label, name, delay, onPress,
}: {
  selected: boolean;
  symbol: string;
  label: string;
  name: string;
  delay: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.card, selected && styles.cardSelected]}
      >
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
        <Text style={styles.cardSymbol}>{symbol}</Text>
        <View style={{ minWidth: 0, flex: 1 }}>
          <Text style={styles.cardLabel}>{label}</Text>
          <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 24 },
  textGroup: { alignItems: "center", gap: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: COLORS.textHeader, letterSpacing: -0.3, textAlign: "center" },
  subtitle: { color: COLORS.gray400, fontSize: 14, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, maxWidth: 300 },
  card: {
    width: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.white,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardSymbol: { fontSize: 20, fontWeight: "700", color: COLORS.textMain },
  cardLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textMain },
  cardName: { fontSize: 11, color: COLORS.gray400 },
  buttonGroup: { width: "100%", maxWidth: 300, gap: 8, alignItems: "center" },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  skipText: { fontSize: 12, color: COLORS.gray400 },
});
