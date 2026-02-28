import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/theme";
import { StepWrapper } from "./OnboardingShell";

interface WelcomeStepProps {
  name: string;
  setName: (v: string) => void;
  onNext: () => void;
}

export function WelcomeStep({ name, setName, onNext }: WelcomeStepProps) {
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
        delay: 100,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 350,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <StepWrapper>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.iconBox,
            { transform: [{ scale: iconScale }], opacity: iconOpacity },
          ]}
        >
          <Text style={styles.iconEmoji}>💰</Text>
        </Animated.View>

        <View style={styles.textGroup}>
          <Text style={styles.heading}>
            Welcome to <Text style={styles.headingAccent}>SpendWise</Text>
          </Text>
          <Text style={styles.subtitle}>
            Set up in under a minute. Let's start with your name.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={COLORS.gray300}
            style={styles.input}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => name.trim() && onNext()}
          />

          <TouchableOpacity
            onPress={onNext}
            disabled={!name.trim()}
            activeOpacity={0.8}
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </StepWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 24,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 28,
  },
  textGroup: {
    alignItems: "center",
    gap: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textHeader,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  headingAccent: {
    color: COLORS.primary,
  },
  subtitle: {
    color: COLORS.gray400,
    fontSize: 14,
    maxWidth: 280,
    textAlign: "center",
    lineHeight: 20,
  },
  inputGroup: {
    width: "100%",
    maxWidth: 280,
    gap: 16,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    color: COLORS.textMain,
    fontSize: 14,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
