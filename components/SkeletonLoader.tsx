import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
// Accessibility: aria-label implemented via parent wrappers

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, []);

    return (
        <Animated.View
            style={[
                { width: width as any, height, borderRadius, backgroundColor: "#E5E7EB", opacity },
                style,
            ]}
        />
    );
}

// Pre-built skeleton for a transaction row
export function TransactionRowSkeleton() {
    return (
        <View style={sk.row}>
            <SkeletonBox width={44} height={44} borderRadius={12} />
            <View style={sk.body}>
                <SkeletonBox width="60%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                <SkeletonBox width="35%" height={11} borderRadius={6} />
            </View>
            <SkeletonBox width={60} height={14} borderRadius={6} />
        </View>
    );
}

// Pre-built skeleton for a stat card
export function StatCardSkeleton() {
    return (
        <View style={sk.card}>
            <SkeletonBox width="40%" height={12} borderRadius={6} style={{ marginBottom: 10 }} />
            <SkeletonBox width="65%" height={24} borderRadius={8} />
        </View>
    );
}

const sk = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
    body: { flex: 1, gap: 4 },
    card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
});
