import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Accessibility: aria-label managed internally
import { COLORS } from "../../constants/theme";
import type { Persona } from "../../types/onboarding";
import { StepWrapper } from "./OnboardingShell";

const PERSONAS: { id: Persona; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
  { id: "student", icon: "school-outline", label: "Student", desc: "Track allowances & essentials" },
  { id: "professional", icon: "briefcase-outline", label: "Professional", desc: "Salary-based budgeting" },
  { id: "freelancer", icon: "laptop-outline", label: "Freelancer", desc: "Variable income tracking" },
  { id: "family", icon: "home-outline", label: "Family", desc: "Household expense management" },
];

interface PersonaStepProps {
  persona: Persona | "";
  setPersona: (v: Persona) => void;
  name: string;
  onNext: () => void;
  onSkip: () => void;
}

export function PersonaStep({ persona, setPersona, name, onNext, onSkip }: PersonaStepProps) {
  const handleSelect = (id: Persona) => {
    setPersona(id);
    setTimeout(() => onNext(), 400);
  };

  return (
    <StepWrapper>
      <View style={styles.container}>
        <View style={styles.textGroup}>
          <Text style={styles.heading}>
            {name ? `${name}, how` : "How"} do you manage money?
          </Text>
          <Text style={styles.subtitle}>
            We'll tailor your experience. Pick what fits best.
          </Text>
        </View>

        <View style={styles.grid}>
          {PERSONAS.map((p, i) => {
            const selected = persona === p.id;
            return (
              <PersonaCard
                key={p.id}
                selected={selected}
                icon={p.icon}
                label={p.label}
                desc={p.desc}
                delay={i * 60}
                onPress={() => handleSelect(p.id)}
              />
            );
          })}
        </View>

        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </StepWrapper>
  );
}

function PersonaCard({
  selected, icon, label, desc, delay, onPress,
}: {
  selected: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
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
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[
          styles.card,
          selected && styles.cardSelected,
        ]}
      >
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
        <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
          <Ionicons name={icon} size={20} color={selected ? COLORS.primary : COLORS.gray400} />
        </View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 24 },
  textGroup: { alignItems: "center", gap: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: COLORS.textHeader, letterSpacing: -0.3, textAlign: "center" },
  subtitle: { color: COLORS.gray400, fontSize: 14, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: 320 },
  card: {
    width: 148,
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
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
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconSelected: {
    backgroundColor: "#E0F2FE",
  },
  cardLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textMain },
  cardDesc: { fontSize: 11, color: COLORS.gray400, textAlign: "center", lineHeight: 15 },
  skipText: { fontSize: 12, color: COLORS.gray400 },
});
