import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
// aria-label used internally for accessibility
import { useCallback, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SyncIndicator from "../../components/SyncIndicator";
import { COLORS } from "../../constants/theme";

export const navVisibility = new Animated.Value(0);

function AnimatedTabIcon({ icon, isActive, color }: { icon: string; isActive: boolean; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Bounce the icon
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.25,
          tension: 150,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
      // Show the dot
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(1);
      Animated.timing(dotOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, scale, dotOpacity]);

  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={icon as any} size={24} color={color} />
      </Animated.View>
      <Animated.View style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: color,
        marginTop: 3,
        opacity: dotOpacity,
      }} />
    </View>
  );
}

function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const translateY = useRef(new Animated.Value(0)).current;

  const isHidden = useRef(false);

  const hideNav = useCallback(() => {
    if (isHidden.current) return;
    isHidden.current = true;
    Animated.spring(translateY, {
      toValue: 120, // push down out of frame
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const showNav = useCallback(() => {
    if (!isHidden.current) return;
    isHidden.current = false;
    Animated.spring(translateY, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

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
  }, [hideNav, showNav]);

  const tabs = [
    { name: "/", label: "Home", icon: "home-outline" },
    { name: "/transactions", label: "Transactions", icon: "wallet-outline" },
    { name: "/ledger", label: "Ledger", icon: "book-outline" },
    { name: "/analytics", label: "Analytics", icon: "bar-chart-outline" },
    { name: "/profile", label: "Profile", icon: "person-outline" },
  ];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      {tabs.map((tab, index) => {
        const isActive = pathname === tab.name;
        const color = isActive ? COLORS.primary : COLORS.gray400;

        return (
          <TouchableOpacity
            key={index}
            style={styles.tabItem}
            onPress={() => router.push(tab.name as any)}
          >
            <AnimatedTabIcon icon={tab.icon} isActive={isActive} color={color} />
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
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
        tabBar={() => <CustomTabBar />}
      />
    </>
  );
}


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
