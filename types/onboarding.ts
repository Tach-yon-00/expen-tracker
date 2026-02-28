export type Persona = "student" | "professional" | "freelancer" | "family";

export interface OnboardingData {
  name: string;
  persona: Persona | "";
  currency: string;
  budget: string;
  categories: string[];
}
