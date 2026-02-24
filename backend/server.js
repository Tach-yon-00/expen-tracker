const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

const DB_PATH = path.join(__dirname, "db.json");

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

/* GET expenses */
app.get("/expenses", (req, res) => {
  const db = readDB();
  res.json(db.expenses);
});

/* GET currency */
app.get("/currency", (req, res) => {
  const db = readDB();
  res.json({ currency: db.currency || "₹" });
});

/* POST currency */
app.post("/currency", (req, res) => {
  const db = readDB();
  db.currency = req.body.currency;
  writeDB(db);
  res.json({ success: true, currency: req.body.currency });
});

/* GET budget */
app.get("/budget", (req, res) => {
  const db = readDB();
  res.json({ budget: db.monthlyBudget });
});

/* GET categories */
app.get("/categories", (req, res) => {
  const db = readDB();
  res.json(db.categories || []);
});

/* GET payment methods */
app.get("/payment-methods", (req, res) => {
  const db = readDB();
  res.json(db.paymentMethods || []);
});

/* GET banks */
app.get("/banks", (req, res) => {
  const db = readDB();
  res.json(db.banks || []);
});

/* GET UPI apps */
app.get("/upi-apps", (req, res) => {
  const db = readDB();
  res.json(db.upiApps || []);
});

/* POST new payment method */
app.post("/payment-methods", (req, res) => {
  const db = readDB();
  if (!db.paymentMethods) { db.paymentMethods = []; }
  const newPaymentMethod = {
    id: Date.now().toString(),
    ...req.body
  };
  db.paymentMethods.push(newPaymentMethod);
  writeDB(db);
  res.json(newPaymentMethod);
});

/* DELETE payment method */
app.delete("/payment-methods/:id", (req, res) => {
  const db = readDB();
  if (!db.paymentMethods) { db.paymentMethods = []; }
  const index = db.paymentMethods.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const deleted = db.paymentMethods.splice(index, 1)[0];
    writeDB(db);
    res.json(deleted);
  } else {
    res.status(404).json({ error: "Payment method not found" });
  }
});

/* POST new bank */
app.post("/banks", (req, res) => {
  const db = readDB();
  if (!db.banks) { db.banks = []; }
  const newBank = {
    id: Date.now().toString(),
    ...req.body
  };
  db.banks.push(newBank);
  writeDB(db);
  res.json(newBank);
});

/* DELETE bank */
app.delete("/banks/:id", (req, res) => {
  const db = readDB();
  if (!db.banks) { db.banks = []; }
  const index = db.banks.findIndex(b => b.id === req.params.id);
  if (index !== -1) {
    const deleted = db.banks.splice(index, 1)[0];
    writeDB(db);
    res.json(deleted);
  } else {
    res.status(404).json({ error: "Bank not found" });
  }
});

/* POST new UPI app */
app.post("/upi-apps", (req, res) => {
  const db = readDB();
  if (!db.upiApps) { db.upiApps = []; }
  const newUpiApp = {
    id: Date.now().toString(),
    ...req.body
  };
  db.upiApps.push(newUpiApp);
  writeDB(db);
  res.json(newUpiApp);
});

/* DELETE UPI app */
app.delete("/upi-apps/:id", (req, res) => {
  const db = readDB();
  if (!db.upiApps) { db.upiApps = []; }
  const index = db.upiApps.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    const deleted = db.upiApps.splice(index, 1)[0];
    writeDB(db);
    res.json(deleted);
  } else {
    res.status(404).json({ error: "UPI app not found" });
  }
});

/* GET preferences */
app.get("/preferences", (req, res) => {
  const db = readDB();
  res.json(db.preferences || { pushNotifications: true, budgetAlerts: true });
});

/* GET user */
app.get("/user", (req, res) => {
  const db = readDB();
  res.json(db.user || { name: "User1234", email: "user1234@email.com" });
});

/* GET single expense by ID */
app.get("/expenses/:id", (req, res) => {
  const db = readDB();
  const expense = db.expenses.find(e => e.id === req.params.id);
  if (expense) {
    res.json(expense);
  } else {
    res.status(404).json({ error: "Expense not found" });
  }
});

/* POST new expense */
app.post("/expenses", (req, res) => {
  const db = readDB();
  const newExpense = {
    id: Date.now().toString(),
    ...req.body
  };
  db.expenses.push(newExpense);
  writeDB(db);
  res.json(newExpense);
});

/* PUT update expense */
app.put("/expenses/:id", (req, res) => {
  const db = readDB();
  const index = db.expenses.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    db.expenses[index] = { ...db.expenses[index], ...req.body };
    writeDB(db);
    res.json(db.expenses[index]);
  } else {
    res.status(404).json({ error: "Expense not found" });
  }
});

/* DELETE expense */
app.delete("/expenses/:id", (req, res) => {
  const db = readDB();
  const index = db.expenses.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    const deleted = db.expenses.splice(index, 1)[0];
    writeDB(db);
    res.json(deleted);
  } else {
    res.status(404).json({ error: "Expense not found" });
  }
});

/* POST new category */
app.post("/categories", (req, res) => {
  const db = readDB();
  if (!db.categories) { db.categories = []; }
  const newCategory = {
    id: Date.now().toString(),
    ...req.body
  };
  db.categories.push(newCategory);
  writeDB(db);
  res.json(newCategory);
});

/* DELETE category */
app.delete("/categories/:id", (req, res) => {
  const db = readDB();
  if (!db.categories) { db.categories = []; }
  const index = db.categories.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    const deleted = db.categories.splice(index, 1)[0];
    writeDB(db);
    res.json(deleted);
  } else {
    res.status(404).json({ error: "Category not found" });
  }
});

/* PUT update budget */
app.put("/budget", (req, res) => {
  const db = readDB();
  if (req.body.budget !== undefined) {
    db.monthlyBudget = req.body.budget;
    writeDB(db);
    res.json({ budget: db.monthlyBudget });
  } else {
    res.status(400).json({ error: "Budget value is required" });
  }
});

/* PUT update user */
app.put("/user", (req, res) => {
  const db = readDB();
  db.user = { ...db.user, ...req.body };
  writeDB(db);
  res.json(db.user);
});

/* PUT update preferences */
app.put("/preferences", (req, res) => {
  const db = readDB();
  db.preferences = { ...db.preferences, ...req.body };
  writeDB(db);
  res.json(db.preferences);
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
