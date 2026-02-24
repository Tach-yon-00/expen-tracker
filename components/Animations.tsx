import React, { useEffect, useRef } from "react";
import { Animated, Pressable, ViewStyle, StyleProp } from "react-native";

interface AnimationProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    style?: StyleProp<ViewStyle>;
}

/**
 * FadeInView
 * Smoothly fades in children on mount
 */
export const FadeInView: React.FC<AnimationProps> = ({
    children,
    delay = 0,
    duration = 500,
    style
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, delay, duration]);

    return (
        <Animated.View style={[style, { opacity: fadeAnim }]}>
            {children}
        </Animated.View>
    );
};

/**
 * SlideInRow
 * List item slide animation from bottom
 */
export const SlideInRow: React.FC<AnimationProps & { direction?: "bottom" | "right" }> = ({
    children,
    delay = 0,
    duration = 400,
    direction = "bottom",
    style
}) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: 1,
            tension: 60,
            friction: 6,
            delay,
            useNativeDriver: true,
        }).start();
    }, [anim, delay]);

    const translate = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0],
    });

    const transform = direction === "bottom"
        ? { translateY: translate }
        : { translateX: translate };

    return (
        <Animated.View style={[
            style,
            {
                opacity: anim,
                transform: [transform]
            }
        ]}>
            {children}
        </Animated.View>
    );
};

/**
 * ScalePressable
 * Shrinks slightly when pressed for tactile feedback
 */
export const ScalePressable: React.FC<{
    children: React.ReactNode;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    activeOpacity?: number;
}> = ({ children, onPress, style, activeOpacity = 0.9 }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.94,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
        }).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={({ pressed }) => [
                style,
                { opacity: pressed ? activeOpacity : 1 }
            ]}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
