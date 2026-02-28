import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type ToastType = "success" | "error" | "info" | "undo";

type ToastData = {
    message: string;
    type: ToastType;
    undoAction?: () => void;
    duration?: number;
};

let showToastFn: ((data: ToastData) => void) | null = null;

// Call this from anywhere to show a toast
export const showToast = (data: ToastData) => {
    if (showToastFn) showToastFn(data);
};

const COLORS: Record<ToastType, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    success: { bg: "#22c55e", icon: "checkmark-circle" },
    error: { bg: "#ef4444", icon: "alert-circle" },
    info: { bg: "#3b82f6", icon: "information-circle" },
    undo: { bg: "#1e293b", icon: "arrow-undo" },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastData | null>(null);
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        showToastFn = (data: ToastData) => {
            // Clear any existing timer
            if (timerRef.current) clearTimeout(timerRef.current);
            setToast(data);

            // Animate in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 12,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss
            const duration = data.duration || (data.type === "undo" ? 4000 : 2500);
            timerRef.current = setTimeout(() => {
                dismissToast();
            }, duration);
        };

        return () => {
            showToastFn = null;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const dismissToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setToast(null));
    };

    const handleUndo = () => {
        if (toast?.undoAction) {
            toast.undoAction();
        }
        if (timerRef.current) clearTimeout(timerRef.current);
        dismissToast();
    };

    const config = toast ? COLORS[toast.type] : COLORS.success;

    return (
        <View style={{ flex: 1 }}>
            {children}
            {toast && (
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: config.bg,
                            transform: [{ translateY }],
                            opacity,
                        },
                    ]}
                >
                    <View style={styles.content}>
                        <Ionicons name={config.icon} size={20} color="#fff" />
                        <Text style={styles.message} numberOfLines={2}>
                            {toast.message}
                        </Text>
                    </View>
                    {toast.type === "undo" && toast.undoAction && (
                        <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
                            <Text style={styles.undoText}>Undo</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 100,
        left: 20,
        right: 20,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 0,
        zIndex: 9999,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 10,
    },
    message: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
    },
    undoBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 8,
        marginLeft: 10,
    },
    undoText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
});
