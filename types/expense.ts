export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  payment: string;
  type?: "income" | "outcome";
  notes?: string;
  bank?: string;
  upiApp?: string;
};
