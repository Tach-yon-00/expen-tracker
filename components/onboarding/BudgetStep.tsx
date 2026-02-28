import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/theme";
import type { Persona } from "../../types/onboarding";
import { StepWrapper } from "./OnboardingShell";

interface BudgetStepProps {
  budget: string;
  setBudget: (v: string) => void;
  currency: string;
  persona: Persona | "";
  onNext: () => void;
  onSkip: () => void;
  context: { personaLabel: string };
}

const PRESETS_BY_PERSONA: Record<string, string[]> = {
  student: ["3000", "5000", "8000", "12000"],
  professional: ["15000", "25000", "40000", "60000"],
  freelancer: ["10000", "20000", "35000", "50000"],
  family: ["20000", "35000", "50000", "75000"],
  "": ["5000", "10000", "25000", "50000"],
};

export function BudgetStep({ budget, setBudget, currency, persona, onNext, onSkip, context }: BudgetStepProps) {
  const presets = PRESETS_BY_PERSONA[persona] || PRESETS_BY_PERSONA[""];

  return (
    <StepWrapper>
      <View style={styles.container}>
        <View style={styles.textGroup}>
          <Text style={styles.heading}>Set a monthly budget</Text>
          <Text style={styles.subtitle}>
            A target for {context.personaLabel}. You can edit this later.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>{currency}</Text>
            <TextInput
              value={budget}
              onChangeText={(v) => setBudget(v.replace(/[^0-9]/g, ""))}
              placeholder="0"
              placeholderTextColor={COLORS.gray300}
              keyboardType="numeric"
              style={styles.input}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => budget && onNext()}
            />
          </View>

          <View style={styles.presetRow}>
            {presets.map((p) => (
              <TouchableOpacity
                key={p}
                activeOpacity={0.7}
                onPress={() => setBudget(p)}
                style={[styles.presetChip, budget === p && styles.presetChipSelected]}
              >
                <Text style={[styles.presetText, budget === p && styles.presetTextSelected]}>
                  {currency}{Number(p).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={onNext}
            disabled={!budget}
            activeOpacity={0.8}
            style={[styles.button, !budget && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>I'll set this later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </StepWrapper>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 24 },
  textGroup: { alignItems: "center", gap: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: COLORS.textHeader, letterSpacing: -0.3, textAlign: "center" },
  subtitle: { color: COLORS.gray400, fontSize: 14, textAlign: "center" },
  inputGroup: { width: "100%", maxWidth: 280, gap: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  currencyPrefix: { fontSize: 18, fontWeight: "700", color: COLORS.gray400, marginRight: 8 },
  input: { flex: 1, fontSize: 20, fontWeight: "700", color: COLORS.textMain, textAlign: "center", padding: 0 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.gray50,
  },
  presetChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  presetText: { fontSize: 12, fontWeight: "500", color: COLORS.gray400 },
  presetTextSelected: { color: COLORS.primary, fontWeight: "600" },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  skipBtn: { alignItems: "center" },
  skipText: { fontSize: 12, color: COLORS.gray400 },
});
