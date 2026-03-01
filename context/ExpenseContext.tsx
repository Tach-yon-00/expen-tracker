import React, { createContext, useContext, useEffect, useReducer, useState } from "react";
import { loadExpenses, saveExpenses } from "../storage/storage";
// Accessibility: aria-label managed internally
import { Expense } from "../types/expense";
import { PROTECTED_CATEGORY_TITLES } from "../utils/categoryUtils";
import { AUTH_HEADERS, SERVER_URL } from "../utils/config";

const SERVER = SERVER_URL;

// Default category IDs that cannot be deleted
const DEFAULT_CATEGORY_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

type Category = {
  id: string;
  icon: string;
  title: string;
  color: string;
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
};

type Bank = {
  id: string;
  name: string;
  icon: string;
};

type UpiApp = {
  id: string;
  name: string;
  icon: string;
};

export type Debt = {
  id: string;
  type: "owe" | "receive";
  person: string;
  originalAmount: number;
  remainingAmount: number;
  reason: string;
  date: string;
  status: "unsettled" | "settled";
};

type State = {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  banks: Bank[];
  upiApps: UpiApp[];
  loading: boolean;
  currency: string;
  user: { name: string; email: string };
  preferences: { pushNotifications: boolean; budgetAlerts: boolean };
  cashBalance: number;
  upiBalance: number;
  isPremium: boolean;
  debts: Debt[];
};

type Action =
  | { type: "LOAD"; payload: Expense[] }
  | { type: "ADD"; payload: Expense }
  | { type: "DELETE"; payload: string }
  | { type: "UPDATE"; payload: Expense }
  | { type: "LOAD_CATEGORIES"; payload: Category[] }
  | { type: "ADD_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "LOAD_PAYMENT_METHODS"; payload: PaymentMethod[] }
  | { type: "ADD_PAYMENT_METHOD"; payload: PaymentMethod }
  | { type: "DELETE_PAYMENT_METHOD"; payload: string }
  | { type: "LOAD_BANKS"; payload: Bank[] }
  | { type: "ADD_BANK"; payload: Bank }
  | { type: "DELETE_BANK"; payload: string }
  | { type: "LOAD_UPI_APPS"; payload: UpiApp[] }
  | { type: "ADD_UPI_APP"; payload: UpiApp }
  | { type: "DELETE_UPI_APP"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CURRENCY"; payload: string }
  | { type: "SET_USER"; payload: { name: string; email: string } }
  | { type: "SET_PREFERENCES"; payload: { pushNotifications: boolean; budgetAlerts: boolean } }
  | { type: "SET_BALANCES"; payload: { cashBalance: number; upiBalance: number } }
  | { type: "SET_PREMIUM"; payload: boolean }
  | { type: "REVERT_CATEGORIES"; payload: Category[] }
  | { type: "REVERT_BANKS"; payload: Bank[] }
  | { type: "REVERT_UPI_APPS"; payload: UpiApp[] }
  | { type: "REVERT_PAYMENT_METHODS"; payload: PaymentMethod[] }
  | { type: "LOAD_DEBTS"; payload: Debt[] }
  | { type: "ADD_DEBT"; payload: Debt }
  | { type: "UPDATE_DEBT"; payload: Debt }
  | { type: "DELETE_DEBT"; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "LOAD":
      return { ...state, expenses: action.payload, loading: false };
    case "ADD":
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case "DELETE":
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };
    case "UPDATE":
      return {
        ...state,
        expenses: state.expenses.map(e =>
          e.id === action.payload.id ? action.payload : e
        )
      };
    case "LOAD_CATEGORIES":
      return { ...state, categories: action.payload };
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] };
    case "DELETE_CATEGORY":
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case "LOAD_PAYMENT_METHODS":
      return { ...state, paymentMethods: action.payload };
    case "ADD_PAYMENT_METHOD":
      return { ...state, paymentMethods: [...state.paymentMethods, action.payload] };
    case "DELETE_PAYMENT_METHOD":
      return { ...state, paymentMethods: state.paymentMethods.filter(p => p.id !== action.payload) };
    case "LOAD_BANKS":
      return { ...state, banks: action.payload };
    case "ADD_BANK":
      return { ...state, banks: [...state.banks, action.payload] };
    case "DELETE_BANK":
      return { ...state, banks: state.banks.filter(b => b.id !== action.payload) };
    case "LOAD_UPI_APPS":
      return { ...state, upiApps: action.payload };
    case "ADD_UPI_APP":
      return { ...state, upiApps: [...state.upiApps, action.payload] };
    case "DELETE_UPI_APP":
      return { ...state, upiApps: state.upiApps.filter(u => u.id !== action.payload) };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CURRENCY":
      return { ...state, currency: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_PREFERENCES":
      return { ...state, preferences: action.payload };
    case "SET_BALANCES":
      return { ...state, cashBalance: action.payload.cashBalance, upiBalance: action.payload.upiBalance };
    case "SET_PREMIUM":
      return { ...state, isPremium: action.payload };
    case "REVERT_CATEGORIES":
      return { ...state, categories: action.payload };
    case "REVERT_BANKS":
      return { ...state, banks: action.payload };
    case "REVERT_UPI_APPS":
      return { ...state, upiApps: action.payload };
    case "REVERT_PAYMENT_METHODS":
      return { ...state, paymentMethods: action.payload };
    case "LOAD_DEBTS":
      return { ...state, debts: action.payload };
    case "ADD_DEBT":
      return { ...state, debts: [action.payload, ...state.debts] };
    case "UPDATE_DEBT":
      return {
        ...state,
        debts: state.debts.map(d =>
          d.id === action.payload.id ? action.payload : d
        )
      };
    case "DELETE_DEBT":
      return { ...state, debts: state.debts.filter(d => d.id !== action.payload) };
    default:
      return state;
  }
};

const initialState: State = {
  expenses: [],
  categories: [],
  paymentMethods: [],
  banks: [],
  upiApps: [],
  loading: true,
  currency: "₹",
  user: { name: "User1234", email: "user1234@email.com" },
  preferences: { pushNotifications: false, budgetAlerts: false },
  cashBalance: 0,
  upiBalance: 0,
  isPremium: false,
  debts: [],
};

type ExpenseContextType = {
  state: State;
  dispatch: React.Dispatch<Action>;
  budget: number;
  currency: string;
  isPremium: boolean;
  addExpense: (expense: Expense) => Promise<Expense>;
  updateExpense: (expense: Expense) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  updateBudget: (amount: number) => Promise<void>;
  updateCurrency: (symbol: string) => Promise<void>;
  updateUser: (user: { name: string; email: string }) => Promise<void>;
  updatePreferences: (preferences: { pushNotifications: boolean; budgetAlerts: boolean }) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addPaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  addBank: (bank: Bank) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  addUpiApp: (upiApp: UpiApp) => Promise<void>;
  deleteUpiApp: (id: string) => Promise<void>;
  fetchExpenses: () => Promise<void>;
  addDebt: (debt: Omit<Debt, "id" | "status" | "remainingAmount">) => Promise<Debt>;
  updateDebt: (debt: Debt) => Promise<Debt>;
  deleteDebt: (id: string) => Promise<void>;
};

export const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [budget, setBudget] = useState(0);

  const fetchExpenses = async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const expenseRes = await fetch(`${SERVER}/expenses`, { headers: AUTH_HEADERS });
      const expenses = await expenseRes.json();
      dispatch({ type: "LOAD", payload: expenses });
    } catch (err) {
      console.log("Failed to fetch expenses, loading local data:", err);
      const localExpenses = await loadExpenses();
      dispatch({ type: "LOAD", payload: localExpenses });
    }

    try {
      const budgetRes = await fetch(`${SERVER}/budget`, { headers: AUTH_HEADERS });
      const budgetData = await budgetRes.json();
      setBudget(budgetData.budget);
    } catch (err) {
      console.log("Failed to fetch budget:", err);
    }

    try {
      const currencyRes = await fetch(`${SERVER}/currency`, { headers: AUTH_HEADERS });
      const currencyData = await currencyRes.json();
      dispatch({ type: "SET_CURRENCY", payload: currencyData.currency });
    } catch (err) {
      console.log("Failed to fetch currency:", err);
    }

    try {
      const userRes = await fetch(`${SERVER}/user`, { headers: AUTH_HEADERS });
      const userData = await userRes.json();
      dispatch({ type: "SET_USER", payload: userData });
    } catch (err) {
      console.log("Failed to fetch user:", err);
    }

    try {
      const prefRes = await fetch(`${SERVER}/preferences`, { headers: AUTH_HEADERS });
      const prefData = await prefRes.json();
      dispatch({ type: "SET_PREFERENCES", payload: prefData });
    } catch (err) {
      console.log("Failed to fetch preferences:", err);
    }

    try {
      const catRes = await fetch(`${SERVER}/categories`, { headers: AUTH_HEADERS });
      const catData = await catRes.json();
      dispatch({ type: "LOAD_CATEGORIES", payload: catData });
    } catch (err) {
      console.log("Failed to fetch categories:", err);
    }

    try {
      const pmRes = await fetch(`${SERVER}/payment-methods`, { headers: AUTH_HEADERS });
      const pmData = await pmRes.json();
      dispatch({ type: "LOAD_PAYMENT_METHODS", payload: pmData });
    } catch (err) {
      console.log("Failed to fetch payment methods:", err);
    }

    try {
      const bankRes = await fetch(`${SERVER}/banks`, { headers: AUTH_HEADERS });
      const bankData = await bankRes.json();
      dispatch({ type: "LOAD_BANKS", payload: bankData });
    } catch (err) {
      console.log("Failed to fetch banks:", err);
    }

    try {
      const upiRes = await fetch(`${SERVER}/upi-apps`, { headers: AUTH_HEADERS });
      const upiData = await upiRes.json();
      dispatch({ type: "LOAD_UPI_APPS", payload: upiData });
    } catch (err) {
      console.log("Failed to fetch UPI apps:", err);
    }

    try {
      const balRes = await fetch(`${SERVER}/balances`, { headers: AUTH_HEADERS });
      const balData = await balRes.json();
      dispatch({ type: "SET_BALANCES", payload: { cashBalance: balData.cashBalance || 0, upiBalance: balData.upiBalance || 0 } });
    } catch (err) {
      console.log("Failed to fetch balances:", err);
    }

    try {
      const debtRes = await fetch(`${SERVER}/debts`, { headers: AUTH_HEADERS });
      const debtData = await debtRes.json();
      dispatch({ type: "LOAD_DEBTS", payload: debtData });
    } catch (err) {
      console.log("Failed to fetch debts:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    saveExpenses(state.expenses);
  }, [state.expenses]);

  const addExpense = async (expense: Expense) => {
    try {
      const res = await fetch(`${SERVER}/expenses`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify(expense)
      });
      const newExpense = await res.json();
      dispatch({ type: "ADD", payload: newExpense });

      // Update balance if this is an income or expense transaction
      if (expense.type === "income" || expense.type === "outcome") {
        const currentCashBalance = state.cashBalance || 0;
        const currentUpiBalance = state.upiBalance || 0;

        let newCashBalance = currentCashBalance;
        let newUpiBalance = currentUpiBalance;

        if (expense.type === "income") {
          // Income → add to balance
          const payment = (expense.payment || "").toLowerCase();
          if (payment === "cash") {
            newCashBalance = currentCashBalance + expense.amount;
          } else if (payment === "netbanking") {
            // Netbanking income → add to UPI balance (received via UPI app)
            newUpiBalance = currentUpiBalance + expense.amount;
          }
        } else if (expense.type === "outcome") {
          // Expense → deduct from balance
          const payment = (expense.payment || "").toLowerCase();
          if (payment === "cash") {
            newCashBalance = Math.max(0, currentCashBalance - expense.amount);
          } else if (payment === "upi" || payment === "net banking") {
            newUpiBalance = Math.max(0, currentUpiBalance - expense.amount);
          }
        }

        // Update balances on server and in state
        try {
          await fetch(`${SERVER}/balances`, {
            method: "PUT",
            headers: AUTH_HEADERS,
            body: JSON.stringify({ cashBalance: newCashBalance, upiBalance: newUpiBalance })
          });
        } catch (balanceErr) {
          console.log("Failed to update balance on server:", balanceErr);
        }

        dispatch({ type: "SET_BALANCES", payload: { cashBalance: newCashBalance, upiBalance: newUpiBalance } });
      }

      return newExpense;
    } catch (err) {
      console.log("Failed to add expense to server:", err);
      const localExpense = { ...expense, id: Date.now().toString() };
      dispatch({ type: "ADD", payload: localExpense });

      // Also update balance locally for offline mode
      if (expense.type === "income" || expense.type === "outcome") {
        const currentCashBalance = state.cashBalance || 0;
        const currentUpiBalance = state.upiBalance || 0;

        let newCashBalance = currentCashBalance;
        let newUpiBalance = currentUpiBalance;

        if (expense.type === "income") {
          // Income → add to balance
          const payment = (expense.payment || "").toLowerCase();
          if (payment === "cash") {
            newCashBalance = currentCashBalance + expense.amount;
          } else if (payment === "netbanking") {
            newUpiBalance = currentUpiBalance + expense.amount;
          }
        } else if (expense.type === "outcome") {
          // Expense → deduct from balance
          const payment = (expense.payment || "").toLowerCase();
          if (payment === "cash") {
            newCashBalance = Math.max(0, currentCashBalance - expense.amount);
          } else if (payment === "upi" || payment === "net banking") {
            newUpiBalance = Math.max(0, currentUpiBalance - expense.amount);
          }
        }

        dispatch({ type: "SET_BALANCES", payload: { cashBalance: newCashBalance, upiBalance: newUpiBalance } });
      }

      return localExpense;
    }
  };

  const updateExpense = async (expense: Expense) => {
    const oldExpense = state.expenses.find(e => e.id === expense.id);

    try {
      const res = await fetch(`${SERVER}/expenses/${expense.id}`, {
        method: "PUT",
        headers: AUTH_HEADERS,
        body: JSON.stringify(expense)
      });
      const updatedExpense = await res.json();
      dispatch({ type: "UPDATE", payload: updatedExpense });

      // Adjust balances
      if (oldExpense && updatedExpense && (oldExpense.type === "income" || oldExpense.type === "outcome" || updatedExpense.type === "income" || updatedExpense.type === "outcome")) {
        const currentCashBalance = state.cashBalance || 0;
        const currentUpiBalance = state.upiBalance || 0;

        let newCashBalance = currentCashBalance;
        let newUpiBalance = currentUpiBalance;

        // Revert old effect
        if (oldExpense.type === "income") {
          const payment = (oldExpense.payment || "").toLowerCase();
          if (payment === "cash") newCashBalance -= oldExpense.amount;
          else if (payment === "netbanking") newUpiBalance -= oldExpense.amount;
        } else if (oldExpense.type === "outcome") {
          const payment = (oldExpense.payment || "").toLowerCase();
          if (payment === "cash") newCashBalance += oldExpense.amount;
          else if (payment === "upi" || payment === "net banking") newUpiBalance += oldExpense.amount;
        }

        // Apply new effect
        if (updatedExpense.type === "income") {
          const payment = (updatedExpense.payment || "").toLowerCase();
          if (payment === "cash") newCashBalance += updatedExpense.amount;
          else if (payment === "netbanking") newUpiBalance += updatedExpense.amount;
        } else if (updatedExpense.type === "outcome") {
          const payment = (updatedExpense.payment || "").toLowerCase();
          if (payment === "cash") newCashBalance -= updatedExpense.amount;
          else if (payment === "upi" || payment === "net banking") newUpiBalance -= updatedExpense.amount;
        }

        // Ensure non-negative balances
        newCashBalance = Math.max(0, newCashBalance);
        newUpiBalance = Math.max(0, newUpiBalance);

        try {
          await fetch(`${SERVER}/balances`, {
            method: "PUT",
            headers: AUTH_HEADERS,
            body: JSON.stringify({ cashBalance: newCashBalance, upiBalance: newUpiBalance })
          });
        } catch (balanceErr) {
          console.log("Failed to update balance on server:", balanceErr);
        }

        dispatch({ type: "SET_BALANCES", payload: { cashBalance: newCashBalance, upiBalance: newUpiBalance } });
      }

      return updatedExpense;
    } catch (err) {
      console.log("Failed to update expense on server:", err);
      dispatch({ type: "UPDATE", payload: expense });

      // Optimistic Offline adjustment
      if (oldExpense && expense && (oldExpense.type === "income" || oldExpense.type === "outcome" || expense.type === "income" || expense.type === "outcome")) {
        const currentCashBalance = state.cashBalance || 0;
        const currentUpiBalance = state.upiBalance || 0;

        let newCashBalance = currentCashBalance;
        let newUpiBalance = currentUpiBalance;

        // Revert old effect
        if (oldExpense.type === "income") {
          const payment = (oldExpense.payment || "").toLowerCase();
          if (payment === "cash") newCashBalance -= oldExpense.amount;
          else if (payment === "netbanking") newUpiBalance -= oldExpense.amount;
        } else if (oldExpense.type === "outcome") {
          const payment = (oldExpense.payment || "").toLowerCase();
          if (payment === "cash") newCashBalance += oldExpense.amount;
          else if (payment === "upi" || payment === "net banking") newUpiBalance += oldExpense.amount;
        }

        // Apply new effect
        if (expense.type === "income") {
          const payment = (expense.payment || "").toLowerCase();
          if (payment === "cash") newCashBalance += expense.amount;
          else if (payment === "netbanking") newUpiBalance += expense.amount;
        } else if (expense.type === "outcome") {
          const payment = (expense.payment || "").toLowerCase();
          if (payment === "cash") newCashBalance -= expense.amount;
          else if (payment === "upi" || payment === "net banking") newUpiBalance -= expense.amount;
        }

        // Ensure non-negative balances
        newCashBalance = Math.max(0, newCashBalance);
        newUpiBalance = Math.max(0, newUpiBalance);

        dispatch({ type: "SET_BALANCES", payload: { cashBalance: newCashBalance, upiBalance: newUpiBalance } });
      }

      return expense;
    }
  };

  const deleteExpense = async (id: string) => {
    // Find the expense to delete so we can revert balances
    const expenseToDelete = state.expenses.find(e => e.id === id);

    try {
      await fetch(`${SERVER}/expenses/${id}`, {
        method: "DELETE",
        headers: AUTH_HEADERS,
      });
      dispatch({ type: "DELETE", payload: id });

      if (expenseToDelete && (expenseToDelete.type === "income" || expenseToDelete.type === "outcome")) {
        const currentCashBalance = state.cashBalance || 0;
        const currentUpiBalance = state.upiBalance || 0;

        let newCashBalance = currentCashBalance;
        let newUpiBalance = currentUpiBalance;

        if (expenseToDelete.type === "income") {
          // Revert income → subtract from balance
          const payment = (expenseToDelete.payment || "").toLowerCase();
          if (payment === "cash") {
            newCashBalance = Math.max(0, currentCashBalance - expenseToDelete.amount);
          } else if (payment === "netbanking") {
            newUpiBalance = Math.max(0, currentUpiBalance - expenseToDelete.amount);
          }
        } else if (expenseToDelete.type === "outcome") {
          // Revert expense → add to balance
          const payment = (expenseToDelete.payment || "").toLowerCase();
          if (payment === "cash") {
            newCashBalance = currentCashBalance + expenseToDelete.amount;
          } else if (payment === "upi" || payment === "net banking") {
            newUpiBalance = currentUpiBalance + expenseToDelete.amount;
          }
        }

        try {
          await fetch(`${SERVER}/balances`, {
            method: "PUT",
            headers: AUTH_HEADERS,
            body: JSON.stringify({ cashBalance: newCashBalance, upiBalance: newUpiBalance })
          });
        } catch (balanceErr) {
          console.log("Failed to update balance on server:", balanceErr);
        }

        dispatch({ type: "SET_BALANCES", payload: { cashBalance: newCashBalance, upiBalance: newUpiBalance } });
      }
    } catch (err) {
      console.log("Failed to delete expense from server:", err);
      dispatch({ type: "DELETE", payload: id });

      // Handle offline revert
      if (expenseToDelete && (expenseToDelete.type === "income" || expenseToDelete.type === "outcome")) {
        const currentCashBalance = state.cashBalance || 0;
        const currentUpiBalance = state.upiBalance || 0;

        let newCashBalance = currentCashBalance;
        let newUpiBalance = currentUpiBalance;

        if (expenseToDelete.type === "income") {
          const payment = (expenseToDelete.payment || "").toLowerCase();
          if (payment === "cash") {
            newCashBalance = Math.max(0, currentCashBalance - expenseToDelete.amount);
          } else if (payment === "netbanking") {
            newUpiBalance = Math.max(0, currentUpiBalance - expenseToDelete.amount);
          }
        } else if (expenseToDelete.type === "outcome") {
          const payment = (expenseToDelete.payment || "").toLowerCase();
          if (payment === "cash") {
            newCashBalance = currentCashBalance + expenseToDelete.amount;
          } else if (payment === "upi" || payment === "net banking") {
            newUpiBalance = currentUpiBalance + expenseToDelete.amount;
          }
        }

        dispatch({ type: "SET_BALANCES", payload: { cashBalance: newCashBalance, upiBalance: newUpiBalance } });
      }
    }
  };

  const updateBudget = async (amount: number) => {
    try {
      const res = await fetch(`${SERVER}/budget`, {
        method: "PUT",
        headers: AUTH_HEADERS,
        body: JSON.stringify({ budget: amount })
      });
      const data = await res.json();
      setBudget(data.budget);
    } catch (err) {
      console.log("Failed to update budget on server:", err);
      setBudget(amount);
    }
  };

  const addCategory = async (category: Category) => {
    try {
      const res = await fetch(`${SERVER}/categories`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify(category)
      });
      if (!res.ok) throw new Error("Failed to add category");
      const savedCategory = await res.json();
      dispatch({ type: "ADD_CATEGORY", payload: savedCategory });
    } catch (err) {
      console.log("Failed to add category to server:", err);
      dispatch({ type: "ADD_CATEGORY", payload: category });
    }
  };

  const deleteCategory = async (id: string) => {
    // Protect default categories from deletion (by common Titles)
    const categoryToDelete = state.categories.find(c => c.id === id);

    if (categoryToDelete && PROTECTED_CATEGORY_TITLES.includes(categoryToDelete.title)) {
      throw new Error("Default categories cannot be deleted");
    }

    try {
      await fetch(`${SERVER}/categories/${id}`, {
        method: "DELETE",
        headers: AUTH_HEADERS,
      });
      dispatch({ type: "DELETE_CATEGORY", payload: id });
    } catch (err) {
      console.log("Failed to delete category from server:", err);
      dispatch({ type: "DELETE_CATEGORY", payload: id });
    }
  };

  const addPaymentMethod = async (paymentMethod: PaymentMethod) => {
    try {
      const res = await fetch(`${SERVER}/payment-methods`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify(paymentMethod)
      });
      if (!res.ok) throw new Error("Failed to add payment method");
      const savedPaymentMethod = await res.json();
      dispatch({ type: "ADD_PAYMENT_METHOD", payload: savedPaymentMethod });
    } catch (err) {
      console.log("Failed to add payment method to server:", err);
      dispatch({ type: "ADD_PAYMENT_METHOD", payload: paymentMethod });
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      await fetch(`${SERVER}/payment-methods/${id}`, {
        method: "DELETE",
        headers: AUTH_HEADERS,
      });
      dispatch({ type: "DELETE_PAYMENT_METHOD", payload: id });
    } catch (err) {
      console.log("Failed to delete payment method from server:", err);
      dispatch({ type: "DELETE_PAYMENT_METHOD", payload: id });
    }
  };

  const addBank = async (bank: Bank) => {
    try {
      const res = await fetch(`${SERVER}/banks`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify(bank)
      });
      if (!res.ok) throw new Error("Failed to add bank");
      const savedBank = await res.json();
      dispatch({ type: "ADD_BANK", payload: savedBank });
    } catch (err) {
      console.log("Failed to add bank to server:", err);
      dispatch({ type: "ADD_BANK", payload: bank });
    }
  };

  const deleteBank = async (id: string) => {
    try {
      await fetch(`${SERVER}/banks/${id}`, {
        method: "DELETE",
        headers: AUTH_HEADERS,
      });
      dispatch({ type: "DELETE_BANK", payload: id });
    } catch (err) {
      console.log("Failed to delete bank from server:", err);
      dispatch({ type: "DELETE_BANK", payload: id });
    }
  };

  const addUpiApp = async (upiApp: UpiApp) => {
    try {
      const res = await fetch(`${SERVER}/upi-apps`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify(upiApp)
      });
      if (!res.ok) throw new Error("Failed to add UPI app");
      const savedUpiApp = await res.json();
      dispatch({ type: "ADD_UPI_APP", payload: savedUpiApp });
    } catch (err) {
      console.log("Failed to add UPI app to server:", err);
      dispatch({ type: "ADD_UPI_APP", payload: upiApp });
    }
  };

  const deleteUpiApp = async (id: string) => {
    try {
      await fetch(`${SERVER}/upi-apps/${id}`, {
        method: "DELETE",
        headers: AUTH_HEADERS,
      });
      dispatch({ type: "DELETE_UPI_APP", payload: id });
    } catch (err) {
      console.log("Failed to delete UPI app from server:", err);
      dispatch({ type: "DELETE_UPI_APP", payload: id });
    }
  };

  const updateCurrency = async (symbol: string) => {
    try {
      await fetch(`${SERVER}/currency`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify({ currency: symbol })
      });
      dispatch({ type: "SET_CURRENCY", payload: symbol });
    } catch (err) {
      console.log("Failed to update currency on server:", err);
      dispatch({ type: "SET_CURRENCY", payload: symbol }); // Optimistic update
    }
  };

  const updateUser = async (user: { name: string; email: string }) => {
    try {
      await fetch(`${SERVER}/user`, {
        method: "PUT",
        headers: AUTH_HEADERS,
        body: JSON.stringify(user)
      });
      dispatch({ type: "SET_USER", payload: user });
    } catch (err) {
      console.log("Failed to update user:", err);
      dispatch({ type: "SET_USER", payload: user });
    }
  };

  const updatePreferences = async (preferences: { pushNotifications: boolean; budgetAlerts: boolean }) => {
    try {
      await fetch(`${SERVER}/preferences`, {
        method: "PUT",
        headers: AUTH_HEADERS,
        body: JSON.stringify(preferences)
      });
      dispatch({ type: "SET_PREFERENCES", payload: preferences });
    } catch (err) {
      console.log("Failed to update preferences:", err);
      dispatch({ type: "SET_PREFERENCES", payload: preferences });
    }
  };

  const addDebt = async (debtData: Omit<Debt, "id" | "status" | "remainingAmount">) => {
    try {
      const payload = {
        ...debtData,
        remainingAmount: debtData.originalAmount
      };

      const res = await fetch(`${SERVER}/debts`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify(payload)
      });
      const newDebt = await res.json();
      dispatch({ type: "ADD_DEBT", payload: newDebt });

      return newDebt;
    } catch (err) {
      console.log("Failed to add debt to server:", err);
      const localDebt: Debt = {
        ...debtData,
        id: Date.now().toString(),
        remainingAmount: debtData.originalAmount,
        status: "unsettled"
      };
      dispatch({ type: "ADD_DEBT", payload: localDebt });
      return localDebt;
    }
  };

  const updateDebt = async (debt: Debt) => {
    try {
      const res = await fetch(`${SERVER}/debts/${debt.id}`, {
        method: "PUT",
        headers: AUTH_HEADERS,
        body: JSON.stringify(debt)
      });
      const updatedDebt = await res.json();
      dispatch({ type: "UPDATE_DEBT", payload: updatedDebt });
      return updatedDebt;
    } catch (err) {
      console.log("Failed to update debt on server:", err);
      dispatch({ type: "UPDATE_DEBT", payload: debt });
      return debt;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await fetch(`${SERVER}/debts/${id}`, {
        method: "DELETE",
        headers: AUTH_HEADERS,
      });
      dispatch({ type: "DELETE_DEBT", payload: id });
    } catch (err) {
      console.log("Failed to delete debt from server:", err);
      dispatch({ type: "DELETE_DEBT", payload: id });
    }
  };

  return (
    <ExpenseContext.Provider value={{
      state,
      dispatch,
      budget,
      currency: state.currency,
      isPremium: state.isPremium,
      addExpense,
      updateExpense,
      deleteExpense,
      updateBudget,
      updateCurrency,
      updateUser,
      updatePreferences,
      addCategory,
      deleteCategory,
      addPaymentMethod,
      deletePaymentMethod,
      addBank,
      deleteBank,
      addUpiApp,
      deleteUpiApp,
      fetchExpenses,
      addDebt,
      updateDebt,
      deleteDebt
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
