import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Accessibility: aria-label managed internally
import { COLORS } from "../../constants/theme";
import type { Persona } from "../../types/onboarding";
import { StepWrapper } from "./OnboardingShell";

export const ALL_CATEGORIES = [
  { icon: "fast-food", title: "Food", color: "#F59E0B" },
  { icon: "car", title: "Transport", color: "#3B82F6" },
  { icon: "cart", title: "Shopping", color: "#EC4899" },
  { icon: "home", title: "Rent", color: "#2DD4BF" },
  { icon: "medkit", title: "Health", color: "#22C55E" },
  { icon: "film", title: "Entertainment", color: "#EF4444" },
  { icon: "school", title: "Education", color: "#06B6D4" },
  { icon: "receipt", title: "Bills", color: "#F97316" },
  { icon: "cafe", title: "Coffee", color: "#92400E" },
  { icon: "airplane", title: "Travel", color: "#6366F1" },
];

const DEFAULTS_BY_PERSONA: Record<string, string[]> = {
  student: ["Food", "Transport", "Education", "Entertainment", "Coffee"],
  professional: ["Food", "Transport", "Bills", "Shopping", "Coffee"],
  freelancer: ["Food", "Transport", "Bills", "Coffee", "Travel"],
  family: ["Food", "Shopping", "Rent", "Bills", "Health", "Education"],
  "": ["Food", "Transport", "Shopping", "Rent", "Bills"],
};

interface CategoriesStepProps {
  persona: Persona | "";
  onNext: (selectedCategories: string[]) => void;
  onSkip: () => void;
}

export function CategoriesStep({ persona, onNext, onSkip }: CategoriesStepProps) {
  const defaults = DEFAULTS_BY_PERSONA[persona] || DEFAULTS_BY_PERSONA[""];
  const [selected, setSelected] = useState<Set<string>>(new Set(defaults));

  const toggle = (title: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <StepWrapper>
      <View style={styles.container}>
        <View style={styles.textGroup}>
          <Text style={styles.heading}>Pick your categories</Text>
          <Text style={styles.subtitle}>
            We pre-selected a few. Tap to toggle.
          </Text>
        </View>

        <View style={styles.grid}>
          {ALL_CATEGORIES.map((cat, i) => {
            const active = selected.has(cat.title);
            return (
              <CategoryCard
                key={cat.title}
                active={active}
                icon={cat.icon}
                title={cat.title}
                color={cat.color}
                delay={i * 30}
                onPress={() => toggle(cat.title)}
              />
            );
          })}
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={() => onNext(Array.from(selected))}
            activeOpacity={0.8}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              Continue with {selected.size} categories
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </StepWrapper>
  );
}

function CategoryCard({
  active, icon, title, color, delay, onPress,
}: {
  active: boolean;
  icon: string;
  title: string;
  color: string;
  delay: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 250,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.catCard, active && styles.catCardActive]}
      >
        {active && (
          <View style={styles.catCheckBadge}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
        <View style={[styles.catIcon, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={styles.catTitle}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 24 },
  textGroup: { alignItems: "center", gap: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: COLORS.textHeader, letterSpacing: -0.3, textAlign: "center" },
  subtitle: { color: COLORS.gray400, fontSize: 14, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, maxWidth: 320 },
  catCard: {
    width: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.white,
  },
  catCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  catCheckBadge: {
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
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  catTitle: { fontSize: 14, fontWeight: "500", color: COLORS.textMain },
  buttonGroup: { width: "100%", maxWidth: 320, gap: 8, alignItems: "center" },
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
