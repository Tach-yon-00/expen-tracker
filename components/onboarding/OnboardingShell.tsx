import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/theme";

interface StepWrapperProps {
  children: React.ReactNode;
  direction?: number;
}

export function StepWrapper({ children, direction = 1 }: StepWrapperProps) {
  const translateX = useRef(new Animated.Value(direction > 0 ? 40 : -40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity, width: "100%" }}>
      {children}
    </Animated.View>
  );
}

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={styles.progressSegment}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor:
                    i <= current ? COLORS.primary : COLORS.gray200,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <Text style={styles.progressText}>
        {current + 1} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    width: "100%",
    maxWidth: 280,
    alignSelf: "center",
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: COLORS.gray100,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 10,
    fontVariant: ["tabular-nums"],
  },
});
