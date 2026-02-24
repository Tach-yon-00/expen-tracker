import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import SyncIndicator from "../../components/SyncIndicator";

export const navVisibility = new Animated.Value(0);

function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const translateY = useRef(new Animated.Value(0)).current;

  const isHidden = useRef(false);

  const hideNav = () => {
    if (isHidden.current) return;
    isHidden.current = true;
    Animated.spring(translateY, {
      toValue: 120, // push down out of frame
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const showNav = () => {
    if (!isHidden.current) return;
    isHidden.current = false;
    Animated.spring(translateY, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const lastScrollY = useRef(0);

  // Listen to scroll direction
  useEffect(() => {
    const listener = navVisibility.addListener(({ value }) => {
      const currentY = value;
      const diff = currentY - lastScrollY.current;

      // Always show at top of page
      if (currentY <= 10) {
        showNav();
      }
      // Scrolling down more than 5px -> hide
      else if (diff > 5) {
        hideNav();
      }
      // Scrolling up more than 5px -> show
      else if (diff < -5) {
        showNav();
      }

      lastScrollY.current = currentY;
    });

    return () => navVisibility.removeListener(listener);
  }, []);

  const tabs = [
    { name: "/", label: "Home", icon: "home-outline" },
    { name: "/transactions", label: "Transactions", icon: "wallet-outline" },
    { name: "/analytics", label: "Analytics", icon: "bar-chart-outline" },
    { name: "/profile", label: "Profile", icon: "person-outline" },
  ];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.name;

        return (
          <TouchableOpacity
            key={index}
            style={styles.tabItem}
            onPress={() => router.push(tab.name as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={isActive ? COLORS.primary : COLORS.gray400}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <>
      <SyncIndicator />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={() => <CustomTabBar />}
      />
    </>
  );
}

import { COLORS, TYPOGRAPHY, SHADOWS } from "../../constants/theme";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: COLORS.gray400,
    marginTop: 4,
    fontWeight: "500",
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
