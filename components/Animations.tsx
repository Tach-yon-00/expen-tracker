import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleProp, StyleSheet, UIManager, ViewStyle } from "react-native";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
 * List item slide animation from bottom or right
 */
export const SlideInRow: React.FC<AnimationProps & { direction?: "bottom" | "right" | "left" }> = ({
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
        outputRange: direction === "left" ? [-30, 0] : [30, 0],
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
    disabled?: boolean;
}> = ({ children, onPress, style, activeOpacity = 0.9, disabled = false }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isPressed, setIsPressed] = useState(false);

    const handlePressIn = () => {
        if (disabled) return;
        setIsPressed(true);
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
        }).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        setIsPressed(false);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
        }).start();
    };

    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
        >
            <Animated.View style={[
                style,
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: isPressed ? activeOpacity : 1
                }
            ]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

/**
 * PopIn
 * Bouncy scale-up animation for elements appearing on screen
 * Great for cards, icons, badges, and modal content
 */
export const PopIn: React.FC<AnimationProps & { from?: number }> = ({
    children,
    delay = 0,
    duration = 400,
    from = 0.3,
    style
}) => {
    const scale = useRef(new Animated.Value(from)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                tension: 80,
                friction: 6,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: duration * 0.6,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            style,
            {
                opacity,
                transform: [{ scale }],
            }
        ]}>
            {children}
        </Animated.View>
    );
};

/**
 * StaggeredList
 * Wraps children and animates them appearing one by one with a stagger
 */
export const StaggeredList: React.FC<{
    children: React.ReactNode[];
    staggerDelay?: number;
    initialDelay?: number;
    style?: StyleProp<ViewStyle>;
    direction?: "bottom" | "right" | "left";
}> = ({
    children,
    staggerDelay = 80,
    initialDelay = 0,
    style,
    direction = "bottom"
}) => {
        return (
            <>
                {React.Children.map(children, (child, index) => {
                    if (!child) return null;
                    return (
                        <SlideInRow
                            key={index}
                            delay={initialDelay + index * staggerDelay}
                            direction={direction}
                            style={style}
                        >
                            {child}
                        </SlideInRow>
                    );
                })}
            </>
        );
    };

/**
 * AnimatedCounter
 * Animates a number counting up from 0 to the target value
 */
export const AnimatedCounter: React.FC<{
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    style?: any;
    formatFn?: (val: number) => string;
}> = ({ value, duration = 1000, prefix = "", suffix = "", decimals = 0, style, formatFn }) => {
    const animValue = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = useState("0");

    useEffect(() => {
        animValue.setValue(0);
        Animated.timing(animValue, {
            toValue: value,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false, // Cannot use native driver for text
        }).start();

        const listener = animValue.addListener(({ value: v }) => {
            if (formatFn) {
                setDisplayValue(formatFn(v));
            } else if (decimals > 0) {
                setDisplayValue(v.toFixed(decimals));
            } else {
                setDisplayValue(Math.round(v).toString());
            }
        });

        return () => animValue.removeListener(listener);
    }, [value]);

    return (
        <Animated.Text style={style}>
            {prefix}{displayValue}{suffix}
        </Animated.Text>
    );
};

/**
 * PulseView
 * Subtle continuous pulse animation for emphasis (e.g. active indicators, badges)
 */
export const PulseView: React.FC<AnimationProps & { intensity?: number }> = ({
    children,
    duration = 2000,
    intensity = 0.08,
    style,
    delay = 0
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1 + intensity,
                    duration: duration / 2,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                    delay,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: duration / 2,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <Animated.View style={[style, { transform: [{ scale: pulseAnim }] }]}>
            {children}
        </Animated.View>
    );
};

/**
 * ShimmerPlaceholder
 * A shimmer/loading effect for skeleton placeholders
 */
export const ShimmerPlaceholder: React.FC<{
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}> = ({ width, height, borderRadius = 8, style }) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmer, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: "#E5E7EB",
                    overflow: "hidden",
                },
                style,
            ]}
        >
            <Animated.View
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#F3F4F6",
                    opacity: 0.6,
                    transform: [{ translateX }],
                }}
            />
        </Animated.View>
    );
};

/**
 * AnimatedModal
 * Wrapper for modal content with scale + fade entrance/exit
 */
export const AnimatedModal: React.FC<{
    visible: boolean;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}> = ({ visible, children, style }) => {
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const [shouldRender, setShouldRender] = useState(visible);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    tension: 65,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scale, {
                    toValue: 0.85,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => setShouldRender(false));
        }
    }, [visible]);

    if (!shouldRender) return null;

    return (
        <Animated.View style={[
            style,
            {
                opacity,
                transform: [{ scale }],
            }
        ]}>
            {children}
        </Animated.View>
    );
};

/**
 * SlideUpView
 * Slides content up from below the screen — ideal for modals & bottom sheets
 */
export const SlideUpView: React.FC<AnimationProps> = ({
    children,
    delay = 0,
    duration = 400,
    style
}) => {
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                tension: 65,
                friction: 9,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: duration * 0.5,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            style,
            {
                opacity,
                transform: [{ translateY }],
            }
        ]}>
            {children}
        </Animated.View>
    );
};

/**
 * BounceInView
 * A pronounced bouncy scale entrance — best for icons, stat numbers
 */
export const BounceInView: React.FC<AnimationProps> = ({
    children,
    delay = 0,
    style
}) => {
    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: 1,
            tension: 100,
            friction: 3.5,
            delay,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[style, { transform: [{ scale }] }]}>
            {children}
        </Animated.View>
    );
};

/**
 * AnimatedProgressBar
 * Smoothly animates a progress bar width with spring physics
 */
export const AnimatedProgressBar: React.FC<{
    progress: number; // 0 to 1
    height?: number;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
    duration?: number;
}> = ({
    progress,
    height = 6,
    color = "#38bdf8",
    backgroundColor = "rgba(255,255,255,0.1)",
    borderRadius = 3,
    style,
    duration = 1000
}) => {
        const widthAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(widthAnim, {
                toValue: progress,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        }, [progress]);

        const animatedWidth = widthAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
        });

        return (
            <Animated.View style={[{
                height,
                backgroundColor,
                borderRadius,
                overflow: "hidden",
            }, style]}>
                <Animated.View style={{
                    height: "100%",
                    width: animatedWidth,
                    backgroundColor: color,
                    borderRadius,
                }} />
            </Animated.View>
        );
    };

/**
 * RotateIn
 * Rotates and fades in — good for refresh indicators, icons
 */
export const RotateIn: React.FC<AnimationProps & { degrees?: number }> = ({
    children,
    delay = 0,
    duration = 600,
    degrees = 360,
    style
}) => {
    const spin = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(spin, {
                toValue: 1,
                duration,
                delay,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: duration * 0.5,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: [`-${degrees}deg`, "0deg"],
    });

    return (
        <Animated.View style={[style, {
            opacity,
            transform: [{ rotate }],
        }]}>
            {children}
        </Animated.View>
    );
};

/**
 * BlurredOverlay
 * A blurred background with a black fade effect — ideal for modal backgrounds
 */
export const BlurredOverlay: React.FC<{
    visible: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
}> = ({ visible, onPress, style }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    return (
        <Animated.View
            pointerEvents={visible ? "auto" : "none"}
            style={[
                StyleSheet.absoluteFill,
                { opacity, backgroundColor: "rgba(0,0,0,0.4)" },
                style
            ]}
        >
            <Pressable onPress={onPress} style={StyleSheet.absoluteFill}>
                <BlurView
                    intensity={20}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
            </Pressable>
        </Animated.View>
    );
};
