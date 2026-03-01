import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { AnimatedCounter, BlurredOverlay, BounceInView, FadeInView, PopIn, ScalePressable, SlideInRow, SlideUpView } from "../../components/Animations";
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useExpenses } from "../../context/ExpenseContext";
import { getCategoryBranding } from "../../utils/categoryUtils";
import { navVisibility } from "./_layout";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - 64;

// Responsive values based on screen width
const scaleFactor = SCREEN_W / 375;
const responsiveGap = Math.max(8, Math.min(12, 12 * scaleFactor));
const responsivePadding = Math.max(10, Math.min(14, 14 * scaleFactor));
const responsiveIconSize = Math.max(40, Math.min(48, 48 * scaleFactor));
const responsiveFontSize = Math.max(14, Math.min(18, 18 * scaleFactor));
const responsiveLabelSize = Math.max(11, Math.min(12, 12 * scaleFactor));

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function BudgetRing({ spent, budget }: { spent: number; budget: number }) {
  const R = 54;
  const STROKE = 9;
  const CIRC = 2 * Math.PI * R;
  const pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const over = budget > 0 ? spent > budget : false;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pct, anim]);

  const dashOffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  return (
    <View style={ring.wrap}>
      <Svg width={130} height={130}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={over ? COLORS.danger : COLORS.primary} />
            <Stop offset="1" stopColor={over ? "#FF4444" : "#2DD4BF"} />
          </LinearGradient>
        </Defs>
        <Circle cx={65} cy={65} r={R} fill="none" stroke={COLORS.gray100} strokeWidth={STROKE} />
        <AnimatedCircle cx={65} cy={65} r={R} fill="none" stroke="url(#ringGrad)" strokeWidth={STROKE} strokeDasharray={CIRC} strokeDashoffset={dashOffset} strokeLinecap="round" rotation="-90" origin="65,65" />
      </Svg>
      <View style={ring.center}>
        <Text style={ring.pct}>{Math.round(pct * 100)}%</Text>
        <Text style={ring.label}>used</Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap: { width: 130, height: 130, alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center" },
  pct: { fontSize: 24, fontWeight: "800", color: "#1a1a2e", letterSpacing: -0.5 },
  label: { fontSize: 12, color: "#9ca3af", fontWeight: "500" },
});

function MonthlyBarChart({ data, labels, activeIndex, onBarPress }: { data: number[]; labels: string[]; activeIndex: number; onBarPress: (i: number) => void; }) {
  const W = CHART_W;
  const H = 110;
  const maxV = Math.max(...data, 1);
  const barW = Math.min((W / data.length) * 0.45, 22);
  const gap = W / data.length;

  return (
    <Svg width={W} height={H}>
      {data.map((v, i) => {
        const barH = Math.max((v / maxV) * 72, 4);
        const x = gap * i + gap / 2;
        const isActive = i === activeIndex;
        return <AnimatedBar key={i} x={x} y={H - barH - 24} width={barW} height={barH} isActive={isActive} onPress={() => onBarPress(i)} label={labels[i]} value={v} />;
      })}
    </Svg>
  );
}

function AnimatedBar({ x, y, width, height, isActive, onPress, label, value }: any) {
  const hAnim = useRef(new Animated.Value(0)).current;
  const H = 110;

  useEffect(() => {
    Animated.spring(hAnim, { toValue: height, tension: 40, friction: 7, useNativeDriver: false }).start();
  }, [height, hAnim]);

  return (
    <Svg>
      <AnimatedRect x={x - width / 2} y={hAnim.interpolate({ inputRange: [0, 110], outputRange: [H - 24, -24] })} width={width} height={hAnim} rx={6} fill={isActive ? COLORS.primary : "#EEF0FF"} onPress={onPress} />
      <SvgText x={x} y={H - 6} fontSize="10" fill={isActive ? COLORS.primary : COLORS.gray400} textAnchor="middle" fontWeight={isActive ? "700" : "400"}>{label}</SvgText>
      {isActive && value > 0 && <SvgText x={x} y={H - height - 28} fontSize="9" fill={COLORS.primary} textAnchor="middle" fontWeight="700">{value >= 1000 ? `${Number((value / 1000) || 0).toFixed(1)}k` : Number(value || 0).toFixed(0)}</SvgText>}
    </Svg>
  );
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function DailyLineChart({ data, avgValue, daysInMonth }: { data: number[]; avgValue: number; daysInMonth: number; }) {
  const W = CHART_W;
  const H = 130;
  const PAD_L = 32, PAD_R = 8, PAD_T = 16, PAD_B = 26;
  const cW = W - PAD_L - PAD_R;
  const cH = H - PAD_T - PAD_B;
  const maxV = Math.max(...data, 1);
  const [tooltip, setTooltip] = useState<{ i: number } | null>(null);
  const toX = (i: number) => PAD_L + (i / Math.max(data.length - 1, 1)) * cW;
  const toY = (v: number) => PAD_T + cH - (v / maxV) * cH;
  const avgY = toY(avgValue);
  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const areaPath = `M${toX(0)},${PAD_T + cH} ` + data.map((v, i) => `L${toX(i)},${toY(v)}`).join(" ") + ` L${toX(data.length - 1)},${PAD_T + cH} Z`;
  const yTicks = [0, 0.5, 1].map((f) => ({ y: PAD_T + cH * (1 - f), label: Math.round(f * maxV) >= 1000 ? `${Number((Math.round(f * maxV) / 1000) || 0).toFixed(1)}k` : Math.round(f * maxV).toString() }));
  const xLabels = data.map((_, i) => { const day = i + 1; if (day === 1 || day % 7 === 0) return String(day); return ""; });
  const handlePress = (e: any) => { const touchX = e.nativeEvent.locationX; let closest = 0, minDist = Infinity; data.forEach((_, i) => { const dist = Math.abs(toX(i) - touchX); if (dist < minDist) { minDist = dist; closest = i; } }); setTooltip(tooltip?.i === closest ? null : { i: closest }); };
  const ti = tooltip?.i ?? -1;
  const ttX = ti >= 0 ? Math.min(Math.max(toX(ti) - 55, PAD_L), W - 115) : 0;
  const ttY = ti >= 0 ? Math.max(toY(data[ti]) - 50, PAD_T) : 0;

  return (
    <Svg width={W} height={H} onPress={handlePress}>
      <Defs><LinearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#6a5cff" stopOpacity="0.18" /><Stop offset="1" stopColor="#6a5cff" stopOpacity="0" /></LinearGradient></Defs>
      {yTicks.map((t, i) => (<Svg key={i}><Line x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y} stroke="#F0F0F5" strokeWidth="1" /><SvgText x={PAD_L - 4} y={t.y + 3.5} fontSize="9" fill="#c4c4d0" textAnchor="end">{t.label}</SvgText></Svg>))}
      <Path d={areaPath} fill="url(#lineArea)" />
      <Line x1={PAD_L} y1={avgY} x2={W - PAD_R} y2={avgY} stroke="#4ECDC4" strokeWidth="1.5" strokeDasharray="4,4" />
      {ti >= 0 && <Rect x={toX(ti) - 12} y={PAD_T} width={24} height={cH} fill="#6a5cff" opacity="0.07" rx={4} />}
      <Polyline points={points} fill="none" stroke="#6a5cff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => { const show = i === 0 || i === data.length - 1 || i % 6 === 0 || i === ti; if (!show) return null; return <Circle key={i} cx={toX(i)} cy={toY(v)} r={i === ti ? 5 : 3.5} fill={v === 0 ? "#E5E7EB" : "#6a5cff"} stroke="#fff" strokeWidth="1.5" />; })}
      {xLabels.map((label, i) => label ? <SvgText key={i} x={toX(i)} y={H - 6} fontSize="9" fill="#c4c4d0" textAnchor="middle">{label}</SvgText> : null)}
      {ti >= 0 && (<><Rect x={ttX} y={ttY} width={112} height={44} rx={8} fill="white" stroke="#E5E7EB" strokeWidth="1" /><SvgText x={ttX + 10} y={ttY + 15} fontSize="10" fill="#9ca3af">{`Day ${ti + 1}`}</SvgText><Circle cx={ttX + 12} cy={ttY + 29} r={3.5} fill="#6a5cff" /><SvgText x={ttX + 22} y={ttY + 33} fontSize="11" fill="#1a1a2e" fontWeight="700">{`₹${Number(data[ti] || 0).toFixed(0)}`}</SvgText><Circle cx={ttX + 68} cy={ttY + 29} r={3.5} fill="#4ECDC4" /><SvgText x={ttX + 77} y={ttY + 33} fontSize="10" fill="#555">{`avg`}</SvgText></>)}
    </Svg>
  );
}

function CategoryBar({ name, color, amount, percent, lastPercent }: { name: string; color: string; amount: string; percent: number; lastPercent: number; }) {
  const delta = percent - lastPercent;
  return (
    <View style={cat.row}>
      <View style={[cat.dot, { backgroundColor: color }]} />
      <View style={cat.body}>
        <View style={cat.topRow}>
          <Text style={cat.name}>{name}</Text>
          <View style={cat.right}>
            {delta !== 0 && (<View style={[cat.badge, delta > 0 ? cat.badgeUp : cat.badgeDown]}><Ionicons name={delta > 0 ? "arrow-up" : "arrow-down"} size={9} color={delta > 0 ? "#EF4444" : "#16a34a"} /><Text style={[cat.badgeText, { color: delta > 0 ? "#EF4444" : "#16a34a" }]}>{Math.abs(delta)}%</Text></View>)}
            <Text style={cat.amount}>{amount}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><View style={[cat.track, { flex: 1 }]}><View style={[cat.fill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} /></View><Text style={{ fontSize: 10, fontWeight: "700", color: "#1a1a2e", minWidth: 28 }}>{percent}%</Text></View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}><View style={[cat.track, { flex: 1, opacity: 0.3 }]}><View style={[cat.fill, { width: `${Math.min(lastPercent, 100)}%`, backgroundColor: color }]} /></View><Text style={{ fontSize: 10, fontWeight: "500", color: "#9ca3af", minWidth: 28 }}>{lastPercent}%</Text></View>
        <View style={cat.legends}><Text style={cat.legendTxt}>This month</Text><Text style={cat.legendTxt}>Last month</Text></View>
      </View>
    </View>
  );
}

const cat = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 20, alignItems: "flex-start" },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  body: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  name: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
  amount: { fontSize: 14, color: "#555", fontWeight: "500" },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, gap: 2 },
  badgeUp: { backgroundColor: "#FEF2F2" },
  badgeDown: { backgroundColor: "#ECFDF5" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  track: { height: 7, backgroundColor: "#F0F0F5", borderRadius: 10, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 10 },
  legends: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  legendTxt: { fontSize: 10, color: "#c4c4d0" },
});

const TABS = ["Overview", "Trends", "Categories", "Balances"] as const;
type TabType = typeof TABS[number];

export default function AnalyticsScreen() {
  const { state } = useExpenses();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const scrollRef = useRef<ScrollView>(null);
  const tabIndicatorX = useRef(new Animated.Value(0)).current;
  const TABS_COUNT = TABS.length;
  const TAB_WIDTH = (SCREEN_W - 32) / TABS_COUNT;

  useEffect(() => { const tabIndex = TABS.indexOf(activeTab); Animated.spring(tabIndicatorX, { toValue: tabIndex * TAB_WIDTH, tension: 68, friction: 10, useNativeDriver: true }).start(); }, [activeTab, TAB_WIDTH, tabIndicatorX]);

  const prevMonth = () => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); } else setSelectedMonth(m => m - 1); };
  const nextMonth = () => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); } else setSelectedMonth(m => m + 1); };

  const dailyData = useMemo(() => {
    const expenses = (state.expenses || []).filter((e: any) => e.type !== "income");
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const spending: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) { const sum = expenses.filter((e: any) => { const dt = new Date(e.date); return dt.getMonth() === selectedMonth && dt.getFullYear() === selectedYear && dt.getDate() === d; }).reduce((s: number, e: any) => s + (e.amount || 0), 0); spending.push(sum); }
    const total = spending.reduce((s, v) => s + v, 0);
    const daysWithData = spending.filter(v => v > 0).length;
    const avg = total / daysInMonth;
    return { spending, total, avg, daysInMonth, daysWithData };
  }, [state.expenses, selectedMonth, selectedYear]);

  const { thisMonthSpent, thisMonthIncome } = useMemo(() => {
    let spent = 0, income = 0;
    (state.expenses || []).forEach((e: any) => { const d = new Date(e.date); if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) { if (e.type === "income") income += (e.amount || 0); else spent += (e.amount || 0); } });
    return { thisMonthSpent: spent, thisMonthIncome: income };
  }, [state.expenses, selectedMonth, selectedYear]);

  const { budget } = useExpenses();
  const currentBudget = budget > 0 ? budget : 3500;

  const [activeMonthBar, setActiveMonthBar] = useState(5);
  const monthlyData = useMemo(() => {
    const expenses = (state.expenses || []).filter((e: any) => e.type !== "income");
    const result = [];
    for (let offset = 5; offset >= 0; offset--) { let m = selectedMonth - offset, y = selectedYear; while (m < 0) { m += 12; y--; } const sum = expenses.filter((e: any) => { const dt = new Date(e.date); return dt.getMonth() === m && dt.getFullYear() === y; }).reduce((s: number, e: any) => s + (e.amount || 0), 0); result.push({ month: m, year: y, spending: sum }); }
    return result;
  }, [state.expenses, selectedMonth, selectedYear]);

  const monthBarSpending = monthlyData.map(d => d.spending);
  const monthBarLabels = monthlyData.map(d => MONTHS_SHORT[d.month]);
  const monthsWithData = monthlyData.filter(d => d.spending > 0).length;

  const categoryData = useMemo(() => {
    const expenses = (state.expenses || []).filter((e: any) => e.type !== "income");
    const thisExp = expenses.filter((e: any) => { const dt = new Date(e.date); return dt.getMonth() === selectedMonth && dt.getFullYear() === selectedYear; });
    let lastMonth = selectedMonth - 1, lastYear = selectedYear; if (lastMonth < 0) { lastMonth = 11; lastYear--; }
    const lastExp = expenses.filter((e: any) => { const dt = new Date(e.date); return dt.getMonth() === lastMonth && dt.getFullYear() === lastYear; });
    const buildMap = (arr: any[]) => { const m: Record<string, number> = {}; arr.forEach((e: any) => { const c = e.category || "Other"; m[c] = (m[c] || 0) + (e.amount || 0); }); return m; };
    const thisMap = buildMap(thisExp);
    const lastMap = buildMap(lastExp);
    const thisTotal = Object.values(thisMap).reduce((s, v) => s + v, 0) || 1;
    const lastTotal = Object.values(lastMap).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(thisMap).map(([name, amt]) => ({ name: name.replace(" & Dining", "").replace(" & Utilities", ""), fullName: name, color: getCategoryBranding(name, state.categories || []).color, amount: `₹${Number(amt || 0).toFixed(0)}`, percent: Math.round((amt / thisTotal) * 100), lastPercent: Math.round(((lastMap[name] || 0) / lastTotal) * 100) })).sort((a, b) => b.percent - a.percent).slice(0, 5);
  }, [state.expenses, state.categories, selectedMonth, selectedYear]);


  const remaining = currentBudget - dailyData.total;
  const daysLeft = new Date(selectedYear, selectedMonth + 1, 0).getDate() - new Date().getDate();
  const dailyAllowance = daysLeft > 0 && remaining > 0 ? (remaining / daysLeft) : 0;
  const now = new Date();
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  const hasNoData = dailyData.total === 0;

  const debts = state.debts || [];
  const youOwe = debts.filter((d: any) => d.type === "owe").reduce((sum: number, d: any) => sum + d.remainingAmount, 0);
  const receivable = debts.filter((d: any) => d.type === "receive").reduce((sum: number, d: any) => sum + d.remainingAmount, 0);

  return (
    <View style={s.screen}>
      <Animated.ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: navVisibility } } }], { useNativeDriver: false })} scrollEventThrottle={16} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.pageTitle}>Analytics</Text>
          <View style={s.monthNav}>
            <ScalePressable style={s.navBtn} onPress={prevMonth}><Ionicons name="chevron-back" size={18} color={COLORS.primary} /></ScalePressable>
            <TouchableOpacity onPress={() => setShowPicker(true)}><Text style={s.monthLabel}>{MONTHS_SHORT[selectedMonth]} {selectedYear}</Text></TouchableOpacity>
            <ScalePressable style={s.navBtn} onPress={nextMonth}><Ionicons name="chevron-forward" size={18} color={COLORS.primary} /></ScalePressable>
          </View>
        </View>
        <FadeInView delay={100}>
          <View style={s.tabRow}>
            <Animated.View style={[s.tabIndicator, { width: TAB_WIDTH - 8, transform: [{ translateX: Animated.add(tabIndicatorX, new Animated.Value(4)) }] }]} />
            {TABS.map(tab => (<TouchableOpacity key={tab} style={[s.tab, { width: TAB_WIDTH }]} onPress={() => setActiveTab(tab)} activeOpacity={0.8}><Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text></TouchableOpacity>))}
          </View>
        </FadeInView>
        {hasNoData && (<View style={s.noDataCard}><Ionicons name="analytics-outline" size={40} color="#E5E7EB" /><Text style={s.noDataTitle}>No data for {MONTHS[selectedMonth]}</Text><Text style={s.noDataSub}>Start tracking expenses to see analytics here</Text></View>)}
        {activeTab === "Overview" && !hasNoData && (
          <FadeInView>
            <View style={s.card}>
              <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Monthly Budget</Text>
                  <Text style={s.statCardValue}>{state.currency || "₹"}{thisMonthSpent >= 1000 ? `${Number((thisMonthSpent / 1000) || 0).toFixed(1)}k` : thisMonthSpent}</Text>
                  <Text style={s.cardSub}>of {state.currency || "₹"}{currentBudget >= 1000 ? `${Number((currentBudget / 1000) || 0).toFixed(1)}k` : currentBudget} budget</Text>
                  {thisMonthIncome > 0 && (<View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}><Ionicons name="arrow-up-circle" size={14} color="#22c55e" /><Text style={{ color: "#166534", fontSize: 13, fontWeight: "600" }}>Income: {state.currency || "₹"}{thisMonthIncome.toLocaleString("en-IN")}</Text></View>)}
                </View>
                <BudgetRing spent={thisMonthSpent} budget={currentBudget} />
              </View>
            </View>
            {isCurrentMonth && dailyAllowance > 0 && (<View style={s.allowanceCard}><View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><View style={s.allowanceIcon}><Ionicons name="wallet-outline" size={22} color={COLORS.primary} /></View><View><Text style={s.allowanceLabel}>Daily Allowance</Text><Text style={s.allowanceAmount}>₹{Number(dailyAllowance || 0).toFixed(0)}/day</Text></View></View><Text style={s.allowanceSub}>{daysLeft} days remaining</Text></View>)}
            <View style={s.statsRow}>
              <PopIn delay={200} style={s.statCard}><BounceInView delay={300}><Ionicons name="trending-up-outline" size={20} color={COLORS.primary} /></BounceInView><AnimatedCounter value={dailyData.avg} prefix="₹" style={s.statCardValue} /><Text style={s.statCardLabel}>Daily Avg</Text></PopIn>
              <PopIn delay={300} style={s.statCard}><BounceInView delay={400}><Ionicons name="calendar-outline" size={20} color="#4ECDC4" /></BounceInView><AnimatedCounter value={dailyData.daysWithData} style={s.statCardValue} /><Text style={s.statCardLabel}>Active Days</Text></PopIn>
              <PopIn delay={400} style={s.statCard}><BounceInView delay={500}><Ionicons name="layers-outline" size={20} color="#F0A500" /></BounceInView><AnimatedCounter value={categoryData.length} style={s.statCardValue} /><Text style={s.statCardLabel}>Categories</Text></PopIn>
            </View>
          </FadeInView>
        )}
        {activeTab === "Trends" && !hasNoData && (
          <>
            <FadeInView delay={100}>
              <View style={s.card}>
                <View style={s.cardHeader}><Text style={s.cardTitle}>Monthly Overview</Text><Text style={s.cardSub}>Last 6 months</Text></View>
                {monthsWithData < 2 ? (<View style={s.placeholderCard}><Ionicons name="bar-chart-outline" size={32} color={COLORS.gray200} /><Text style={s.placeholderTitle}>{monthsWithData} of 2 months tracked</Text><Text style={s.placeholderSub}>Need at least 2 months of data for comparison</Text><View style={s.progressTrack}><View style={[s.progressFill, { width: `${(monthsWithData / 2) * 100}%` }]} /></View></View>) : (<><MonthlyBarChart data={monthBarSpending} labels={monthBarLabels} activeIndex={activeMonthBar} onBarPress={setActiveMonthBar} /><View style={s.summaryRow}><View style={s.summaryItem}><Text style={s.summaryLabel}>This month</Text><Text style={s.summaryValue}>₹{(monthBarSpending[5] || 0).toLocaleString("en-IN")}</Text></View><View style={s.divider} /><View style={s.summaryItem}><Text style={s.summaryLabel}>Last month</Text><Text style={s.summaryValue}>₹{(monthBarSpending[4] || 0).toLocaleString("en-IN")}</Text></View><View style={s.divider} /><View style={s.summaryItem}><Text style={s.summaryLabel}>6-mo avg</Text><Text style={s.summaryValue}>₹{Number((monthBarSpending.reduce((a, b) => a + b, 0) / 6) || 0).toFixed(0)}</Text></View></View></>)}
              </View>
            </FadeInView>
            <FadeInView delay={200}>
              <View style={s.card}>
                <View style={s.cardHeader}><Text style={s.cardTitle}>Daily Spending</Text><View style={s.legendRow}><View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: COLORS.primary }]} /><Text style={s.legendTxt}>Actual</Text></View><View style={s.legendItem}><View style={[s.legendDash, { borderColor: "#4ECDC4" }]} /><Text style={s.legendTxt}>Avg</Text></View></View></View>
                {dailyData.daysWithData < 7 ? (<View style={s.placeholderCard}><Ionicons name="trending-up-outline" size={32} color={COLORS.gray200} /><Text style={s.placeholderTitle}>{dailyData.daysWithData} of 7 days tracked</Text><Text style={s.placeholderSub}>Need at least 7 days of data for trends</Text><View style={s.progressTrack}><View style={[s.progressFill, { width: `${(dailyData.daysWithData / 7) * 100}%` }]} /></View></View>) : (<><Text style={s.chartHint}>Tap a point to see details</Text><DailyLineChart data={dailyData.spending} avgValue={dailyData.avg} daysInMonth={dailyData.daysInMonth} /></>)}
              </View>
            </FadeInView>
          </>
        )}
        {activeTab === "Categories" && !hasNoData && (
          <FadeInView>
            <View style={s.card}>
              <View style={s.cardHeader}><Text style={s.cardTitle}>By Category</Text><Text style={s.cardSub}>vs last month</Text></View>
              {categoryData.length === 0 ? (<View style={s.emptyState}><Ionicons name="pie-chart-outline" size={36} color={COLORS.gray200} /><Text style={s.emptyText}>No expenses this month</Text></View>) : categoryData.map((item, i) => (<SlideInRow key={i} delay={i * 50}><CategoryBar {...item} /></SlideInRow>))}
            </View>
          </FadeInView>
        )}
        {activeTab === "Balances" && (
          <FadeInView>
            <View style={s.card}>
              <View style={s.cardHeader}><Text style={s.cardTitle}>Current Balances</Text></View>
              <View style={s.balanceRow}>
                <View style={s.balanceItem}>
                  <View style={[s.balanceIcon, { backgroundColor: "#E8F5E9", width: responsiveIconSize, height: responsiveIconSize }]}><Ionicons name="cash-outline" size={Math.round(responsiveIconSize * 0.5)} color="#22c55e" /></View>
                  <View style={{ gap: responsiveGap * 0.3 }}><Text style={[s.balanceLabel, { fontSize: responsiveLabelSize }]}>Cash</Text><Text style={[s.balanceAmount, { fontSize: responsiveFontSize }]}>{state.currency || "₹"}{(state.cashBalance || 0).toLocaleString("en-IN")}</Text></View>
                </View>
                <View style={s.balanceItem}>
                  <View style={[s.balanceIcon, { backgroundColor: "#E3F2FD", width: responsiveIconSize, height: responsiveIconSize }]}><Ionicons name="phone-portrait-outline" size={Math.round(responsiveIconSize * 0.5)} color="#2196f3" /></View>
                  <View style={{ gap: responsiveGap * 0.3 }}><Text style={[s.balanceLabel, { fontSize: responsiveLabelSize }]}>UPI</Text><Text style={[s.balanceAmount, { fontSize: responsiveFontSize }]}>{state.currency || "₹"}{(state.upiBalance || 0).toLocaleString("en-IN")}</Text></View>
                </View>
              </View>
              <View style={s.totalBalance}><Text style={s.totalLabel}>Total Balance</Text><Text style={s.totalAmount}>{state.currency || "₹"}{((state.cashBalance || 0) + (state.upiBalance || 0)).toLocaleString("en-IN")}</Text></View>
            </View>
            <View style={s.card}>
              <View style={s.cardHeader}><Text style={s.cardTitle}>Debt & Receivables</Text></View>
              <View style={s.balanceRow}>
                <View style={s.balanceItem}>
                  <View style={[s.balanceIcon, { backgroundColor: "#FEF2F2", width: responsiveIconSize, height: responsiveIconSize }]}><Ionicons name="arrow-down-outline" size={Math.round(responsiveIconSize * 0.5)} color="#EF4444" /></View>
                  <View style={{ gap: responsiveGap * 0.3 }}><Text style={[s.balanceLabel, { fontSize: responsiveLabelSize }]}>You Owe</Text><Text style={[s.balanceAmount, { fontSize: responsiveFontSize }]}>{state.currency || "₹"}{youOwe.toLocaleString("en-IN")}</Text></View>
                </View>
                <View style={s.balanceItem}>
                  <View style={[s.balanceIcon, { backgroundColor: "#ECFDF5", width: responsiveIconSize, height: responsiveIconSize }]}><Ionicons name="arrow-up-outline" size={Math.round(responsiveIconSize * 0.5)} color="#10B981" /></View>
                  <View style={{ gap: responsiveGap * 0.3 }}><Text style={[s.balanceLabel, { fontSize: responsiveLabelSize }]}>Receivable</Text><Text style={[s.balanceAmount, { fontSize: responsiveFontSize }]}>{state.currency || "₹"}{receivable.toLocaleString("en-IN")}</Text></View>
                </View>
              </View>
            </View>
          </FadeInView>
        )}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <BlurredOverlay visible={showPicker} onPress={() => setShowPicker(false)} />
        <View style={s.overlay}>
          <SlideUpView style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}><Text style={s.sheetTitle}>Select Month</Text><TouchableOpacity onPress={() => setShowPicker(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Ionicons name="close-circle" size={26} color="#E5E7EB" /></TouchableOpacity></View>
            <View style={s.yearRow}><TouchableOpacity onPress={() => setSelectedYear(y => y - 1)} style={s.yearBtn}><Ionicons name="chevron-back" size={20} color="#6a5cff" /></TouchableOpacity><Text style={s.yearTxt}>{selectedYear}</Text><TouchableOpacity onPress={() => setSelectedYear(y => y + 1)} style={s.yearBtn}><Ionicons name="chevron-forward" size={20} color="#6a5cff" /></TouchableOpacity></View>
            <View style={s.monthGrid}>{MONTHS.map((m, i) => { const isActive = i === selectedMonth; return (<TouchableOpacity key={i} style={[s.monthChip, isActive && s.monthChipActive]} onPress={() => { setSelectedMonth(i); setShowPicker(false); }}><Text style={[s.monthChipTxt, isActive && s.monthChipTxtActive]}>{MONTHS_SHORT[i]}</Text></TouchableOpacity>); })}</View>
          </SlideUpView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: 56 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.lg },
  pageTitle: TYPOGRAPHY.h1,
  monthNav: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, ...SHADOWS.soft },
  navBtn: { padding: 2 },
  monthLabel: { ...TYPOGRAPHY.bodyBold, color: COLORS.textHeader, minWidth: 60, textAlign: "center" },
  tabRow: { flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 14, padding: 4, marginBottom: SPACING.lg, ...SHADOWS.soft },
  tab: { paddingVertical: 10, alignItems: "center", borderRadius: 11 },
  tabIndicator: { position: "absolute", top: 4, bottom: 4, borderRadius: 11, backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.gray400 },
  tabTextActive: { color: COLORS.white },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginBottom: SPACING.md, ...SHADOWS.soft },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle: TYPOGRAPHY.h3,
  cardSub: TYPOGRAPHY.tiny,
  statCardValue: { fontSize: 16, fontWeight: "800", color: COLORS.textHeader },
  allowanceCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: SPACING.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center", ...SHADOWS.soft },
  allowanceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: "center", alignItems: "center" },
  allowanceLabel: TYPOGRAPHY.caption,
  allowanceAmount: { fontSize: 20, fontWeight: "800", color: COLORS.primary, letterSpacing: -0.5 },
  allowanceSub: TYPOGRAPHY.caption,
  statsRow: { flexDirection: "row", gap: 10, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, alignItems: "center", gap: 6, ...SHADOWS.soft },
  statCardLabel: TYPOGRAPHY.tiny,
  chartHint: TYPOGRAPHY.tiny,
  placeholderCard: { alignItems: "center", paddingVertical: 24, gap: 8 },
  placeholderTitle: { fontSize: 14, fontWeight: "600", color: COLORS.gray600 },
  placeholderSub: TYPOGRAPHY.caption,
  progressTrack: { width: "60%", height: 6, backgroundColor: COLORS.gray100, borderRadius: 10, overflow: "hidden", marginTop: 4 },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 10 },
  noDataCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 32, marginBottom: SPACING.md, alignItems: "center", gap: 10, ...SHADOWS.soft },
  noDataTitle: TYPOGRAPHY.h2,
  noDataSub: TYPOGRAPHY.body,
  summaryRow: { flexDirection: "row", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: TYPOGRAPHY.tiny,
  summaryValue: { fontSize: 13, fontWeight: "700", color: COLORS.textHeader },
  divider: { width: 1, backgroundColor: COLORS.gray100 },
  legendRow: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDash: { width: 14, height: 0, borderTopWidth: 2, borderStyle: "dashed" },
  legendTxt: TYPOGRAPHY.tiny,
  emptyState: { alignItems: "center", paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12 },
  sheetHandle: { width: 36, height: 4, backgroundColor: COLORS.gray200, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sheetTitle: TYPOGRAPHY.h2,
  yearRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 18, gap: 20 },
  yearBtn: { padding: 8 },
  yearTxt: TYPOGRAPHY.h2,
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  monthChip: { width: "22%", paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.gray50, alignItems: "center" },
  monthChipActive: { backgroundColor: COLORS.primary },
  monthChipTxt: { fontSize: 13, fontWeight: "600", color: COLORS.gray600 },
  monthChipTxtActive: { color: COLORS.white },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  balanceItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: responsiveGap, backgroundColor: COLORS.gray50, padding: responsivePadding, borderRadius: 14, marginHorizontal: 2 },
  balanceIcon: { borderRadius: 12, justifyContent: "center", alignItems: "center" },
  balanceLabel: { fontSize: 12, color: COLORS.gray500, fontWeight: "500" },
  balanceAmount: { fontSize: 18, fontWeight: "800", color: COLORS.textHeader },
  totalBalance: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  totalLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textHeader },
  totalAmount: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
});
