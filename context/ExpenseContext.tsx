import React, { createContext, useContext, useEffect, useReducer, useState } from "react";
import { loadExpenses, saveExpenses } from "../storage/storage";
import { Expense } from "../types/expense";
import { SERVER_URL } from "../utils/config";

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
  | { type: "SET_PREFERENCES"; payload: { pushNotifications: boolean; budgetAlerts: boolean } };

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
};

type ExpenseContextType = {
  state: State;
  dispatch: React.Dispatch<Action>;
  budget: number;
  currency: string;
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
};

export const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [budget, setBudget] = useState(0);

  useEffect(() => {
    dispatch({ type: "SET_LOADING", payload: true });

    fetch(`${SERVER}/expenses`)
      .then(res => res.json())
      .then(data => {
        dispatch({ type: "LOAD", payload: data });
      })
      .catch(err => {
        console.log("Failed to fetch from server, loading local data:", err);
        loadExpenses().then(data => {
          dispatch({ type: "LOAD", payload: data });
        });
      });

    fetch(`${SERVER}/budget`)
      .then(res => res.json())
      .then(data => setBudget(data.budget))
      .catch(err => {
        console.log("Failed to fetch budget from server:", err);
      });

    fetch(`${SERVER}/currency`)
      .then(res => res.json())
      .then(data => dispatch({ type: "SET_CURRENCY", payload: data.currency }))
      .catch(err => {
        console.log("Failed to fetch currency from server:", err);
      });

    fetch(`${SERVER}/user`)
      .then(res => res.json())
      .then(data => dispatch({ type: "SET_USER", payload: data }))
      .catch(err => console.log("Failed to fetch user:", err));

    fetch(`${SERVER}/preferences`)
      .then(res => res.json())
      .then(data => dispatch({ type: "SET_PREFERENCES", payload: data }))
      .catch(err => console.log("Failed to fetch preferences:", err));

    // Load categories from server
    fetch(`${SERVER}/categories`)
      .then(res => res.json())
      .then(data => {
        dispatch({ type: "LOAD_CATEGORIES", payload: data });
      })
      .catch(err => {
        console.log("Failed to fetch categories from server:", err);
      });

    // Load payment methods from server
    fetch(`${SERVER}/payment-methods`)
      .then(res => res.json())
      .then(data => {
        dispatch({ type: "LOAD_PAYMENT_METHODS", payload: data });
      })
      .catch(err => {
        console.log("Failed to fetch payment methods from server:", err);
      });

    // Load banks from server
    fetch(`${SERVER}/banks`)
      .then(res => res.json())
      .then(data => {
        dispatch({ type: "LOAD_BANKS", payload: data });
      })
      .catch(err => {
        console.log("Failed to fetch banks from server:", err);
      });

    // Load UPI apps from server
    fetch(`${SERVER}/upi-apps`)
      .then(res => res.json())
      .then(data => {
        dispatch({ type: "LOAD_UPI_APPS", payload: data });
      })
      .catch(err => {
        console.log("Failed to fetch UPI apps from server:", err);
      });
  }, []);

  useEffect(() => {
    saveExpenses(state.expenses);
  }, [state.expenses]);

  const addExpense = async (expense: Expense) => {
    try {
      const res = await fetch(`${SERVER}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense)
      });
      const newExpense = await res.json();
      dispatch({ type: "ADD", payload: newExpense });
      return newExpense;
    } catch (err) {
      console.log("Failed to add expense to server:", err);
      const localExpense = { ...expense, id: Date.now().toString() };
      dispatch({ type: "ADD", payload: localExpense });
      return localExpense;
    }
  };

  const updateExpense = async (expense: Expense) => {
    try {
      const res = await fetch(`${SERVER}/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense)
      });
      const updatedExpense = await res.json();
      dispatch({ type: "UPDATE", payload: updatedExpense });
      return updatedExpense;
    } catch (err) {
      console.log("Failed to update expense on server:", err);
      dispatch({ type: "UPDATE", payload: expense });
      return expense;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await fetch(`${SERVER}/expenses/${id}`, {
        method: "DELETE"
      });
      dispatch({ type: "DELETE", payload: id });
    } catch (err) {
      console.log("Failed to delete expense from server:", err);
      dispatch({ type: "DELETE", payload: id });
    }
  };

  const updateBudget = async (amount: number) => {
    try {
      const res = await fetch(`${SERVER}/budget`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      await fetch(`${SERVER}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category)
      });
      dispatch({ type: "ADD_CATEGORY", payload: category });
    } catch (err) {
      console.log("Failed to add category to server:", err);
      dispatch({ type: "ADD_CATEGORY", payload: category });
    }
  };

  const deleteCategory = async (id: string) => {
    // Protect default categories from deletion
    if (DEFAULT_CATEGORY_IDS.includes(id)) {
      throw new Error("Default categories cannot be deleted");
    }
    try {
      await fetch(`${SERVER}/categories/${id}`, {
        method: "DELETE"
      });
      dispatch({ type: "DELETE_CATEGORY", payload: id });
    } catch (err) {
      console.log("Failed to delete category from server:", err);
      dispatch({ type: "DELETE_CATEGORY", payload: id });
    }
  };

  const addPaymentMethod = async (paymentMethod: PaymentMethod) => {
    try {
      await fetch(`${SERVER}/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentMethod)
      });
      dispatch({ type: "ADD_PAYMENT_METHOD", payload: paymentMethod });
    } catch (err) {
      console.log("Failed to add payment method to server:", err);
      dispatch({ type: "ADD_PAYMENT_METHOD", payload: paymentMethod });
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      await fetch(`${SERVER}/payment-methods/${id}`, {
        method: "DELETE"
      });
      dispatch({ type: "DELETE_PAYMENT_METHOD", payload: id });
    } catch (err) {
      console.log("Failed to delete payment method from server:", err);
      dispatch({ type: "DELETE_PAYMENT_METHOD", payload: id });
    }
  };

  const addBank = async (bank: Bank) => {
    try {
      await fetch(`${SERVER}/banks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bank)
      });
      dispatch({ type: "ADD_BANK", payload: bank });
    } catch (err) {
      console.log("Failed to add bank to server:", err);
      dispatch({ type: "ADD_BANK", payload: bank });
    }
  };

  const deleteBank = async (id: string) => {
    try {
      await fetch(`${SERVER}/banks/${id}`, {
        method: "DELETE"
      });
      dispatch({ type: "DELETE_BANK", payload: id });
    } catch (err) {
      console.log("Failed to delete bank from server:", err);
      dispatch({ type: "DELETE_BANK", payload: id });
    }
  };

  const addUpiApp = async (upiApp: UpiApp) => {
    try {
      await fetch(`${SERVER}/upi-apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(upiApp)
      });
      dispatch({ type: "ADD_UPI_APP", payload: upiApp });
    } catch (err) {
      console.log("Failed to add UPI app to server:", err);
      dispatch({ type: "ADD_UPI_APP", payload: upiApp });
    }
  };

  const deleteUpiApp = async (id: string) => {
    try {
      await fetch(`${SERVER}/upi-apps/${id}`, {
        method: "DELETE"
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      });
      dispatch({ type: "SET_PREFERENCES", payload: preferences });
    } catch (err) {
      console.log("Failed to update preferences:", err);
      dispatch({ type: "SET_PREFERENCES", payload: preferences });
    }
  };

  return (
    <ExpenseContext.Provider value={{
      state,
      dispatch,
      budget,
      currency: state.currency,
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
      deleteUpiApp
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
