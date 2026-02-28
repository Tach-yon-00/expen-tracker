import { Expense } from "../types/expense";
import { SERVER_URL, AUTH_HEADERS } from "./config";

const SERVER = SERVER_URL;

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

// Generate realistic demo expenses
const demoExpenses: Omit<Expense, "id">[] = [
  {
    title: "Grocery Shopping",
    amount: 2500,
    category: "Food",
    date: getDateDaysAgo(0),
    payment: "UPI",
    type: "outcome",
    notes: "Weekly groceries from supermarket",
  },
  {
    title: "Monthly Rent",
    amount: 25000,
    category: "Rent",
    date: getDateDaysAgo(1),
    payment: "Netbanking",
    type: "outcome",
    notes: "February rent",
  },
  {
    title: "Electricity Bill",
    amount: 1850,
    category: "Utilities",
    date: getDateDaysAgo(2),
    payment: "UPI",
    type: "outcome",
    notes: "Monthly electricity bill",
  },
  {
    title: "Salary",
    amount: 85000,
    category: "Salary",
    date: getDateDaysAgo(3),
    payment: "Netbanking",
    type: "income",
    notes: "February salary",
  },
  {
    title: "Movie Tickets",
    amount: 600,
    category: "Entertainment",
    date: getDateDaysAgo(4),
    payment: "UPI",
    type: "outcome",
    notes: "Weekend movie",
  },
  {
    title: "Fuel",
    amount: 1500,
    category: "Transport",
    date: getDateDaysAgo(5),
    payment: "Cash",
    type: "outcome",
    notes: "Car fuel",
  },
  {
    title: "Restaurant",
    amount: 1200,
    category: "Food",
    date: getDateDaysAgo(6),
    payment: "UPI",
    type: "outcome",
    notes: "Dinner with friends",
  },
  {
    title: "Internet",
    amount: 999,
    category: "Utilities",
    date: getDateDaysAgo(7),
    payment: "UPI",
    type: "outcome",
    notes: "Monthly broadband",
  },
  {
    title: "Freelance Project",
    amount: 15000,
    category: "Freelance",
    date: getDateDaysAgo(8),
    payment: "Netbanking",
    type: "income",
    notes: "Website design project",
  },
  {
    title: "Medicine",
    amount: 450,
    category: "Health",
    date: getDateDaysAgo(9),
    payment: "Cash",
    type: "outcome",
    notes: "Pharmacy",
  },
];

export async function addDemoData(): Promise<void> {
  try {
    // Add demo expenses one by one
    for (const expense of demoExpenses) {
      const expenseWithId = {
        ...expense,
        id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      await fetch(`${SERVER}/expenses`, {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify(expenseWithId),
      });
    }

    // Set a demo budget
    await fetch(`${SERVER}/budget`, {
      method: "PUT",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ budget: 50000 }),
    });

    console.log("Demo data added successfully");
  } catch (err) {
    console.log("Failed to add demo data:", err);
  }
}
