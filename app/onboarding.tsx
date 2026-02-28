import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BudgetStep } from "../components/onboarding/BudgetStep";
import { ALL_CATEGORIES, CategoriesStep } from "../components/onboarding/CategoriesStep";
import { CurrencyStep } from "../components/onboarding/CurrencyStep";
import { ProgressBar } from "../components/onboarding/OnboardingShell";
import { PersonaStep } from "../components/onboarding/PersonaStep";
import { ReadyStep } from "../components/onboarding/ReadyStep";
import { WelcomeStep } from "../components/onboarding/welcomestep";
import { COLORS } from "../constants/theme";
import { useExpenses } from "../context/ExpenseContext";
import { setOnboardingDone } from "../storage/onboarding";
import type { OnboardingData, Persona } from "../types/onboarding";

const TOTAL_STEPS = 6;
const PROFILE_KEY = "SPENDWISE_PROFILE";

export default function Onboarding() {
  const router = useRouter();
  const { updateUser, updateBudget, updateCurrency, addCategory } = useExpenses();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    persona: "",
    currency: "₹",
    budget: "",
    categories: [],
  });

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const skip = () => next();

  const finish = async () => {
    try {
      await AsyncStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({ ...data, onboardingDone: true })
      );
      await setOnboardingDone();

      if (data.name) {
        await updateUser({ name: data.name, email: `${data.name.toLowerCase().replace(/\s+/g, '')}@example.com` });
      }
      if (data.budget) {
        await updateBudget(parseFloat(data.budget));
      }
      if (data.currency) {
        await updateCurrency(data.currency);
      }
      if (data.categories && data.categories.length > 0) {
        for (const catTitle of data.categories) {
          const catDef = ALL_CATEGORIES.find(c => c.title === catTitle);
          if (catDef) {
            await addCategory({
              id: Date.now().toString() + Math.random().toString(),
              title: catDef.title,
              icon: catDef.icon,
              color: catDef.color
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
    router.replace("/(tabs)");
  };

  const context = useMemo(() => ({
    personaLabel: {
      student: "student life",
      professional: "work expenses",
      freelancer: "freelance income",
      family: "household spending",
    }[data.persona as Persona] || "your finances",
  }), [data.persona]);

  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeStep name={data.name} setName={(v) => update("name", v)} onNext={next} />;
      case 1:
        return <PersonaStep persona={data.persona} setPersona={(v) => update("persona", v)} name={data.name} onNext={next} onSkip={skip} />;
      case 2:
        return <CurrencyStep currency={data.currency} setCurrency={(v) => update("currency", v)} onNext={next} onSkip={skip} context={context} />;
      case 3:
        return <BudgetStep budget={data.budget} setBudget={(v) => update("budget", v)} currency={data.currency} persona={data.persona} onNext={next} onSkip={skip} context={context} />;
      case 4:
        return <CategoriesStep persona={data.persona} onNext={(selectedCategories) => { update("categories", selectedCategories); next(); }} onSkip={skip} />;
      case 5:
        return <ReadyStep name={data.name} persona={data.persona} onFinish={finish} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          {step < TOTAL_STEPS - 1 && (
            <ProgressBar current={step} total={TOTAL_STEPS - 1} />
          )}
          <View style={styles.stepContainer}>
            {renderStep()}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: 32,
  },
  stepContainer: {
    width: "100%",
    alignItems: "center",
  },
});
