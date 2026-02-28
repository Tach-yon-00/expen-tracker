import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/theme";
import type { Persona } from "../../types/onboarding";
import { StepWrapper } from "./OnboardingShell";

interface ReadyStepProps {
  name: string;
  persona: Persona | "";
  onFinish: () => void;
}

const PERSONA_CTA: Record<string, string> = {
  student: "Start tracking your spending",
  professional: "Your dashboard is ready",
  freelancer: "Your finances, organized",
  family: "Your household tracker awaits",
  "": "Your dashboard is ready",
};

export function ReadyStep({ name, persona, onFinish }: ReadyStepProps) {
  const cta = PERSONA_CTA[persona] || PERSONA_CTA[""];

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(10)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, tension: 200, friction: 15, delay: 100, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 300, delay: 100, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(btnY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <StepWrapper>
      <View style={styles.container}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}>
          <Ionicons name="checkmark" size={32} color="#fff" />
        </Animated.View>

        <Animated.View style={[styles.textGroup, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
          <Text style={styles.heading}>
            You're all set{name ? `, ${name}` : ""}!
          </Text>
          <Text style={styles.subtitle}>
            {cta}. We've pre-filled some demo data so it feels like home from the start.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: btnOpacity, transform: [{ translateY: btnY }], width: "100%", maxWidth: 280 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onFinish}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Go to Dashboard →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </StepWrapper>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 24 },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  textGroup: { alignItems: "center", gap: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: COLORS.textHeader, letterSpacing: -0.3, textAlign: "center" },
  subtitle: {
    color: COLORS.gray400,
    fontSize: 14,
    maxWidth: 280,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
