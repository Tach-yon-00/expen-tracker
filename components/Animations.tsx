import React, { useEffect, useRef } from "react";
import { Animated, Pressable, ViewStyle, StyleProp, Easing } from "react-native";

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

/**
 * StaggeredFadeIn
 * Wraps children with staggered fade-in animations
 * Useful for lists and grid items
 */
export const StaggeredFadeIn: React.FC<{
    children: React.ReactNode[];
    baseDelay?: number;
    staggerDelay?: number;
    duration?: number;
    style?: StyleProp<ViewStyle>;
}> = ({ children, baseDelay = 0, staggerDelay = 80, duration = 400, style }) => {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <FadeInView
                    key={index}
                    delay={baseDelay + index * staggerDelay}
                    duration={duration}
                    style={style}
                >
                    {child}
                </FadeInView>
            ))}
        </>
    );
};

/**
 * StaggeredSlideIn
 * Wraps children with staggered slide-in animations from bottom
 * Useful for list items
 */
export const StaggeredSlideIn: React.FC<{
    children: React.ReactNode[];
    baseDelay?: number;
    staggerDelay?: number;
    direction?: "bottom" | "right";
    style?: StyleProp<ViewStyle>;
}> = ({ children, baseDelay = 0, staggerDelay = 100, direction = "bottom", style }) => {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <SlideInRow
                    key={index}
                    delay={baseDelay + index * staggerDelay}
                    direction={direction}
                    style={style}
                >
                    {child}
                </SlideInRow>
            ))}
        </>
    );
};

/**
 * SlideUpView
 * Slides up from bottom with fade - perfect for modals and sheets
 */
export const SlideUpView: React.FC<AnimationProps & {
    slideDistance?: number;
    easing?: typeof Easing.ease;
}> = ({
    children,
    delay = 0,
    duration = 400,
    slideDistance = 60,
    easing = Easing.out(Easing.cubic),
    style
}) => {
    const translateY = useRef(new Animated.Value(slideDistance)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration,
                delay,
                easing,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: duration * 0.8,
                delay,
                useNativeDriver: true,
            })
        ]).start();
    }, [translateY, opacity, delay, duration, easing]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity,
                    transform: [{ translateY }]
                }
            ]}
        >
            {children}
        </Animated.View>
    );
};

/**
 * PulseView
 * Subtle pulsing animation for attention accents (CTA buttons, budget rings)
 */
export const PulseView: React.FC<{
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    minScale?: number;
    maxScale?: number;
    duration?: number;
}> = ({ children, style, minScale = 1, maxScale = 1.05, duration = 2000 }) => {
    const scale = useRef(new Animated.Value(minScale)).current;

    useEffect(() => {
        const pulseAnimation = Animated.sequence([
            Animated.timing(scale, {
                toValue: maxScale,
                duration: duration / 2,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: minScale,
                duration: duration / 2,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            })
        ]);

        Animated.loop(pulseAnimation).start();
    }, [scale, minScale, maxScale, duration]);

    return (
        <Animated.View style={[style, { transform: [{ scale }] }]}>
            {children}
        </Animated.View>
    );
};

/**
 * FadeScaleIn
 * Combines fade and scale animation - great for cards and widgets
 */
export const FadeScaleIn: React.FC<AnimationProps & {
    startScale?: number;
}> = ({
    children,
    delay = 0,
    duration = 500,
    startScale = 0.95,
    style
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(startScale)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                delay,
                useNativeDriver: true,
            })
        ]).start();
    }, [opacity, scale, delay, duration, startScale]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity,
                    transform: [{ scale }]
                }
            ]}
        >
            {children}
        </Animated.View>
    );
};

/**
 * FloatView
 * Gentle floating animation for decorative elements
 */
export const FloatView: React.FC<{
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    distance?: number;
    duration?: number;
}> = ({ children, style, distance = 8, duration = 3000 }) => {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const floatAnimation = Animated.sequence([
            Animated.timing(translateY, {
                toValue: -distance,
                duration: duration / 2,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: duration / 2,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
            })
        ]);

        Animated.loop(floatAnimation).start();
    }, [translateY, distance, duration]);

    return (
        <Animated.View style={[style, { transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
};

/**
 * AnimatedPressable
 * Enhanced pressable with multiple animation options
 */
export const AnimatedPressable: React.FC<{
    children: React.ReactNode;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    animation?: "scale" | "fade" | "none";
    scaleValue?: number;
}> = ({ children, onPress, style, animation = "scale", scaleValue = 0.96 }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (animation === "scale") {
            Animated.spring(scale, {
                toValue: scaleValue,
                useNativeDriver: true,
                tension: 120,
                friction: 4,
            }).start();
        } else if (animation === "fade") {
            Animated.timing(opacity, {
                toValue: 0.7,
                duration: 100,
                useNativeDriver: true,
            }).start();
        }
    };

    const handlePressOut = () => {
        if (animation === "scale") {
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 120,
                friction: 4,
            }).start();
        } else if (animation === "fade") {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }).start();
        }
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={style}
        >
            <Animated.View style={{
                transform: [{ scale }],
                opacity
            }}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
