import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useExpenses } from "../context/ExpenseContext";

export default function SyncIndicator() {
    const { state } = useExpenses();
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (state.loading) {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 500,
                delay: 500, // Small delay so user sees it finish
                useNativeDriver: true,
            }).start();
        }
    }, [state.loading]);

    return (
        <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
            <View style={styles.pill}>
                <Ionicons name="cloud-upload-outline" size={14} color="#0ea5e9" style={styles.icon} />
                <Text style={styles.text}>{state.loading ? "Syncing..." : "Synced"}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 1000,
        elevation: 1000,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        elevation: 0,
        borderWidth: 1,
        borderColor: "#e0f2fe",
    },
    icon: {
        marginRight: 6,
    },
    text: {
        fontSize: 12,
        fontWeight: "600",
        color: "#0369a1",
    },
});
