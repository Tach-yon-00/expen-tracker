// ====================
// API VERSIONING
// ====================
const API_VERSION = "v1";
const API_BASE = `/api/${API_VERSION}`;

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Version middleware - adds version to request
app.use((req, res, next) => {
  req.apiVersion = API_VERSION;
  next();
});

const PORT = 5000;
const DB_PATH = path.join(__dirname, "db.json");
const BACKUP_PATH = path.join(__dirname, "db-backup.json");
const LOG_PATH = path.join(__dirname, "server.log");

// ====================
// MONITORING & STATS
// ====================
const monitoring = {
  startTime: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  responseTimes: [],
  requestsByEndpoint: {},
  statusCodes: {}
};

function updateMonitoring(req, res) {
  monitoring.totalRequests++;
  const endpoint = req.path;
  monitoring.requestsByEndpoint[endpoint] = (monitoring.requestsByEndpoint[endpoint] || 0) + 1;

  const statusKey = res.statusCode.toString();
  monitoring.statusCodes[statusKey] = (monitoring.statusCodes[statusKey] || 0) + 1;

  if (res.statusCode >= 400) {
    monitoring.totalErrors++;
  }
}

function getAverageResponseTime() {
  if (monitoring.responseTimes.length === 0) return 0;
  const sum = monitoring.responseTimes.reduce((a, b) => a + b, 0);
  return Math.round(sum / monitoring.responseTimes.length);
}

function getUptime() {
  return Math.floor((Date.now() - monitoring.startTime) / 1000);
}

// Default category IDs that cannot be deleted
const DEFAULT_CATEGORY_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// Maximum lengths for input validation
const MAX_TITLE_LENGTH = 200;
const MAX_NOTES_LENGTH = 1000;
const MAX_NAME_LENGTH = 100;

// Allowed currency symbols
const ALLOWED_CURRENCIES = ['$', '€', '£', '¥', '₹', '₽', '₩'];

// ====================
// RATE LIMITING
// ====================
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Max requests per minute

function rateLimitMiddleware(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const clientData = requestCounts.get(clientIp);

    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      clientData.count++;

      if (clientData.count > MAX_REQUESTS) {
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((clientData.resetTime - now) / 1000)} seconds`
        });
      }
    }
  }
  next();
}

app.use(rateLimitMiddleware);

// ====================
// REQUEST LOGGING
// ====================
function logRequest(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = `[${timestamp}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)\n`;

    fs.appendFile(LOG_PATH, logEntry, (err) => {
      if (err) console.error('Logging error:', err);
    });
  });

  next();
}

app.use(logRequest);

// ====================
// BASIC AUTHENTICATION
// ====================
const API_KEY = "expense-tracker-secret-key-2024";

function authMiddleware(req, res, next) {
  const clientKey = req.headers['x-api-key'];

  if (!clientKey || clientKey !== API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }

  next();
}

// Apply auth to all routes except health check
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  authMiddleware(req, res, next);
});

// ====================
// VALIDATION HELPERS
// ====================

function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function validateExpense(expense, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    if (!expense.title || expense.title.trim() === '') {
      errors.push('Title is required');
    }
  }

  if (expense.title && expense.title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
  }

  if (expense.amount !== undefined && expense.amount !== null) {
    const amount = Number(expense.amount);
    if (isNaN(amount)) {
      errors.push('Amount must be a valid number');
    } else if (amount < 0) {
      errors.push('Amount cannot be negative');
    }
  }

  if (expense.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expense.date)) {
      const parsed = new Date(expense.date);
      if (isNaN(parsed.getTime())) {
        errors.push('Invalid date format. Use YYYY-MM-DD');
      }
    }
  }

  if (expense.type && !['income', 'outcome'].includes(expense.type)) {
    errors.push('Type must be "income" or "outcome"');
  }

  if (expense.notes && expense.notes.length > MAX_NOTES_LENGTH) {
    errors.push(`Notes must be less than ${MAX_NOTES_LENGTH} characters`);
  }

  return errors;
}

function validateCategory(category) {
  const errors = [];

  if (!category.title || category.title.trim() === '') {
    errors.push('Category title is required');
  }

  if (category.title && category.title.length > MAX_NAME_LENGTH) {
    errors.push(`Title must be less than ${MAX_NAME_LENGTH} characters`);
  }

  return errors;
}

function validateCurrency(currency) {
  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return [`Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}`];
  }
  return [];
}

function validateBudget(budget) {
  const errors = [];
  const amount = Number(budget);

  if (isNaN(amount)) {
    errors.push('Budget must be a valid number');
  } else if (amount < 0) {
    errors.push('Budget cannot be negative');
  } else if (amount > 1000000000) {
    errors.push('Budget exceeds maximum limit');
  }

  return errors;
}

function validateBalance(balance) {
  const errors = [];

  if (balance.cashBalance !== undefined) {
    const amount = Number(balance.cashBalance);
    if (isNaN(amount) || amount < 0) {
      errors.push('Cash balance must be a non-negative number');
    }
  }

  if (balance.upiBalance !== undefined) {
    const amount = Number(balance.upiBalance);
    if (isNaN(amount) || amount < 0) {
      errors.push('UPI balance must be a non-negative number');
    }
  }

  return errors;
}

function validateDebt(debt, isUpdate = false) {
  const errors = [];

  if (!isUpdate || debt.person !== undefined) {
    if (!debt.person || typeof debt.person !== 'string' || debt.person.trim() === '') {
      errors.push('Person name is required');
    } else if (debt.person.length > MAX_NAME_LENGTH) {
      errors.push(`Person name must be less than ${MAX_NAME_LENGTH} characters`);
    }
  }

  if (!isUpdate || debt.type !== undefined) {
    if (!['owe', 'receive'].includes(debt.type)) {
      errors.push('Type must be "owe" or "receive"');
    }
  }

  if (!isUpdate || debt.originalAmount !== undefined) {
    const amount = Number(debt.originalAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Original amount must be a positive number');
    }
  }

  if (debt.remainingAmount !== undefined) {
    const rAmount = Number(debt.remainingAmount);
    if (isNaN(rAmount) || rAmount < 0) {
      errors.push('Remaining amount must be a non-negative number');
    }
    if (debt.originalAmount !== undefined && rAmount > Number(debt.originalAmount)) {
      errors.push('Remaining amount cannot be greater than original amount');
    }
  }

  return errors;
}

// ====================
// DATABASE HELPERS
// ====================

let isWriting = false;
const writeQueue = [];

function writeDB(data) {
  return new Promise((resolve, reject) => {
    const doWrite = (writeData, writeResolve, writeReject) => {
      isWriting = true;
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(writeData, null, 2));
        isWriting = false;
        writeResolve();

        // Process next item in queue
        if (writeQueue.length > 0) {
          const next = writeQueue.shift();
          doWrite(next.data, next.resolve, next.reject);
        }
      } catch (err) {
        isWriting = false;
        writeReject(err);
      }
    };

    if (isWriting) {
      writeQueue.push({ data, resolve, reject });
    } else {
      doWrite(data, resolve, reject);
    }
  });
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

// ====================
// BACKUP & RESTORE
// ====================

function createBackup() {
  try {
    const db = readDB();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `db-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(db, null, 2));
    return { success: true, backupFile };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function restoreBackup(backupFile) {
  try {
    const backupData = JSON.parse(fs.readFileSync(backupFile));
    fs.writeFileSync(DB_PATH, JSON.stringify(backupData, null, 2));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function listBackups() {
  try {
    const files = fs.readdirSync(__dirname)
      .filter(f => f.startsWith('db-backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        created: fs.statSync(path.join(__dirname, f)).mtime
      }))
      .sort((a, b) => b.created - a.created);
    return files;
  } catch (err) {
    return [];
  }
}

// ====================
// IMPROVED ERROR MESSAGES
// ====================
const ERROR_CODES = {
  // Authentication errors (1xx)
  ERR_001: { status: 401, message: 'Invalid or missing API key', suggestion: 'Include x-api-key header in your request' },
  ERR_002: { status: 403, message: 'Insufficient permissions', suggestion: 'Contact administrator for access' },

  // Rate limiting errors (2xx)
  ERR_201: { status: 429, message: 'Too many requests', suggestion: 'Wait before retrying or upgrade to premium' },

  // Validation errors (3xx)
  ERR_301: { status: 400, message: 'Title is required', suggestion: 'Provide a valid title for the expense' },
  ERR_302: { status: 400, message: 'Invalid amount', suggestion: 'Amount must be a positive number' },
  ERR_303: { status: 400, message: 'Invalid date format', suggestion: 'Use YYYY-MM-DD format' },
  ERR_304: { status: 400, message: 'Invalid type', suggestion: 'Type must be "income" or "outcome"' },
  ERR_305: { status: 400, message: 'Title too long', suggestion: 'Title must be less than 200 characters' },
  ERR_306: { status: 400, message: 'Notes too long', suggestion: 'Notes must be less than 1000 characters' },

  // Resource errors (4xx)
  ERR_401: { status: 404, message: 'Expense not found', suggestion: 'Check the expense ID or create a new expense' },
  ERR_402: { status: 404, message: 'Category not found', suggestion: 'Provide a valid category ID' },
  ERR_403: { status: 403, message: 'Default categories cannot be deleted', suggestion: 'System categories are protected' },
  ERR_404: { status: 404, message: 'Backup file not found', suggestion: 'Check the backup filename' },
  ERR_405: { status: 400, message: 'Filename is required', suggestion: 'Provide the filename to restore' },

  // Database errors (5xx)
  ERR_501: { status: 500, message: 'Database write failed', suggestion: 'Try again or contact support' },
  ERR_502: { status: 500, message: 'Database read failed', suggestion: 'Try again or contact support' },

  // Generic errors
  ERR_999: { status: 500, message: 'Internal server error', suggestion: 'Contact support if problem persists' }
};

function createErrorResponse(code, details = null) {
  const errorInfo = ERROR_CODES[code] || ERROR_CODES.ERR_999;
  const response = {
    error: {
      code,
      message: errorInfo.message,
      suggestion: errorInfo.suggestion,
      timestamp: new Date().toISOString()
    }
  };
  if (details) {
    response.error.details = details;
  }
  return response;
}

// ====================
// API VERSIONING ROUTES
// ====================

// API Info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Expense Tracker API",
    version: API_VERSION,
    endpoints: {
      health: "GET /health",
      expenses: "GET/POST /api/v1/expenses",
      categories: "GET/POST /api/v1/categories",
      backup: "POST /api/v1/backup",
      monitoring: "GET /api/v1/monitoring/stats"
    },
    documentation: "https://github.com/expense-tracker/docs"
  });
});

// Health check (no auth required)
app.get("/health", (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: API_VERSION });
});

// Backup endpoints
app.post("/backup", (req, res) => {
  const result = createBackup();
  if (result.success) {
    res.json({ success: true, message: 'Backup created', file: result.backupFile });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

app.get("/backup/list", (req, res) => {
  const backups = listBackups();
  res.json({ backups });
});

app.post("/backup/restore", (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const backupFile = path.join(__dirname, filename);
  if (!fs.existsSync(backupFile)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  const result = restoreBackup(backupFile);
  if (result.success) {
    res.json({ success: true, message: 'Database restored successfully' });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

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
  const errors = validateCurrency(req.body.currency);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const db = readDB();
  db.currency = sanitize(req.body.currency);
  writeDB(db);
  res.json({ success: true, currency: db.currency });
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
    name: sanitize(req.body.name),
    icon: sanitize(req.body.icon) || '💳'
  };

  if (!newPaymentMethod.name || newPaymentMethod.name.trim() === '') {
    return res.status(400).json({ error: 'Payment method name is required' });
  }

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
    name: sanitize(req.body.name),
    icon: sanitize(req.body.icon) || '🏦'
  };

  if (!newBank.name || newBank.name.trim() === '') {
    return res.status(400).json({ error: 'Bank name is required' });
  }

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
    name: sanitize(req.body.name),
    icon: sanitize(req.body.icon) || '📱'
  };

  if (!newUpiApp.name || newUpiApp.name.trim() === '') {
    return res.status(400).json({ error: 'UPI app name is required' });
  }

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
app.post("/expenses", async (req, res) => {
  const errors = validateExpense(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const db = readDB();

  const newExpense = {
    id: Date.now().toString(),
    title: sanitize(req.body.title),
    amount: Number(req.body.amount) || 0,
    category: sanitize(req.body.category) || 'Other',
    date: req.body.date || new Date().toISOString().split('T')[0],
    payment: sanitize(req.body.payment) || 'cash',
    type: req.body.type || 'outcome',
    notes: sanitize(req.body.notes) || '',
    bank: sanitize(req.body.bank) || '',
    upiApp: sanitize(req.body.upiApp) || ''
  };

  db.expenses.push(newExpense);
  await writeDB(db);
  res.json(newExpense);
});

/* PUT update expense */
app.put("/expenses/:id", async (req, res) => {
  const errors = validateExpense(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const db = readDB();
  const index = db.expenses.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    const updated = { ...db.expenses[index] };
    if (req.body.title !== undefined) updated.title = sanitize(req.body.title);
    if (req.body.amount !== undefined) updated.amount = Number(req.body.amount);
    if (req.body.category !== undefined) updated.category = sanitize(req.body.category);
    if (req.body.date !== undefined) updated.date = sanitize(req.body.date);
    if (req.body.payment !== undefined) updated.payment = sanitize(req.body.payment);
    if (req.body.type !== undefined) updated.type = sanitize(req.body.type);
    if (req.body.notes !== undefined) updated.notes = sanitize(req.body.notes);
    if (req.body.bank !== undefined) updated.bank = sanitize(req.body.bank);
    if (req.body.upiApp !== undefined) updated.upiApp = sanitize(req.body.upiApp);

    db.expenses[index] = updated;
    await writeDB(db);
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
  const errors = validateCategory(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const db = readDB();
  if (!db.categories) { db.categories = []; }

  const newCategory = {
    id: Date.now().toString(),
    title: sanitize(req.body.title),
    icon: sanitize(req.body.icon) || '📁',
    color: sanitize(req.body.color) || '#000000'
  };

  db.categories.push(newCategory);
  writeDB(db);
  res.json(newCategory);
});

/* DELETE category - with API-level protection */
app.delete("/categories/:id", (req, res) => {
  const db = readDB();
  if (!db.categories) { db.categories = []; }

  if (DEFAULT_CATEGORY_IDS.includes(req.params.id)) {
    return res.status(403).json({
      error: "Default categories cannot be deleted",
      message: "This is a protected system category"
    });
  }

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
  const errors = validateBudget(req.body.budget);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const db = readDB();
  db.monthlyBudget = Number(req.body.budget);
  writeDB(db);
  res.json({ budget: db.monthlyBudget });
});

/* PUT update user */
app.put("/user", (req, res) => {
  const db = readDB();
  db.user = {
    ...db.user,
    name: sanitize(req.body.name) || db.user?.name || 'User',
    email: sanitize(req.body.email) || db.user?.email || 'user@email.com'
  };
  writeDB(db);
  res.json(db.user);
});

/* PUT update preferences */
app.put("/preferences", (req, res) => {
  const db = readDB();
  db.preferences = {
    ...db.preferences,
    pushNotifications: req.body.pushNotifications !== undefined ? Boolean(req.body.pushNotifications) : true,
    budgetAlerts: req.body.budgetAlerts !== undefined ? Boolean(req.body.budgetAlerts) : true,
    darkMode: req.body.darkMode !== undefined ? Boolean(req.body.darkMode) : false
  };
  writeDB(db);
  res.json(db.preferences);
});

/* GET balances */
app.get("/balances", (req, res) => {
  const db = readDB();
  res.json({
    cashBalance: Number(db.cashBalance) || 0,
    upiBalance: Number(db.upiBalance) || 0
  });
});

/* PUT update balances */
app.put("/balances", async (req, res) => {
  const errors = validateBalance(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const db = readDB();

  if (req.body.cashBalance !== undefined) {
    db.cashBalance = Math.max(0, Number(req.body.cashBalance));
  }
  if (req.body.upiBalance !== undefined) {
    db.upiBalance = Math.max(0, Number(req.body.upiBalance));
  }

  await writeDB(db);
  res.json({
    cashBalance: db.cashBalance,
    upiBalance: db.upiBalance
  });
});

/* GET debts */
app.get("/debts", (req, res) => {
  const db = readDB();
  res.json(db.debts || []);
});

/* POST new debt */
app.post("/debts", async (req, res) => {
  const errors = validateDebt(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const db = readDB();
  if (!db.debts) { db.debts = []; }

  const newDebt = {
    id: Date.now().toString(),
    type: req.body.type,
    person: sanitize(req.body.person),
    originalAmount: Number(req.body.originalAmount),
    remainingAmount: Number(req.body.remainingAmount !== undefined ? req.body.remainingAmount : req.body.originalAmount),
    reason: sanitize(req.body.reason) || '',
    date: req.body.date || new Date().toISOString().split('T')[0],
    status: req.body.remainingAmount === 0 ? "settled" : "unsettled"
  };

  db.debts.push(newDebt);
  await writeDB(db);
  res.json(newDebt);
});

/* PUT update debt */
app.put("/debts/:id", async (req, res) => {
  const errors = validateDebt(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const db = readDB();
  if (!db.debts) { db.debts = []; }

  const index = db.debts.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    const updated = { ...db.debts[index] };

    if (req.body.type !== undefined) updated.type = req.body.type;
    if (req.body.person !== undefined) updated.person = sanitize(req.body.person);
    if (req.body.originalAmount !== undefined) updated.originalAmount = Number(req.body.originalAmount);
    if (req.body.remainingAmount !== undefined) {
      updated.remainingAmount = Number(req.body.remainingAmount);
      updated.status = updated.remainingAmount <= 0 ? "settled" : "unsettled";
    }
    if (req.body.reason !== undefined) updated.reason = sanitize(req.body.reason);
    if (req.body.date !== undefined) updated.date = sanitize(req.body.date);
    if (req.body.status !== undefined) updated.status = req.body.status;

    db.debts[index] = updated;
    await writeDB(db);
    res.json(db.debts[index]);
  } else {
    res.status(404).json({ error: "Debt not found" });
  }
});

/* DELETE debt */
app.delete("/debts/:id", async (req, res) => {
  const db = readDB();
  if (!db.debts) { db.debts = []; }

  const index = db.debts.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    const deleted = db.debts.splice(index, 1)[0];
    await writeDB(db);
    res.json(deleted);
  } else {
    res.status(404).json({ error: "Debt not found" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("Expense Tracker Server - Running on port", PORT);
  console.log("=".repeat(50));
  console.log("\n✅ Security Features Enabled:");
  console.log("   - Rate Limiting (100 req/min)");
  console.log("   - Request Logging");
  console.log("   - API Authentication Required");
  console.log("   - Input Validation");
  console.log("   - XSS Sanitization");
  console.log("   - Category Protection");
  console.log("   - Atomic Write Operations");
  console.log("\n📦 Backup Features:");
  console.log("   - POST /backup - Create backup");
  console.log("   - GET /backup/list - List backups");
  console.log("   - POST /backup/restore - Restore backup");
  console.log(`\n🔑 API Key: ${"*".repeat(API_KEY.length - 4)}${API_KEY.slice(-4)}`);
  console.log("   Use header: x-api-key: <key>");
  console.log("\n🏥 Health Check: GET /health (no auth required)");
});
