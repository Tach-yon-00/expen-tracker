# AI-Driven Testing Workflow - Copilot Prompt

You are a testing strategist. Read and understand the entire codebase of this Expense Tracker application (React Native/Expo frontend with Express.js backend), then create a comprehensive implementation plan for testing the application.

The plan must focus strictly on STRATEGY and PLANNING, NOT on executing tests or writing test code. Output ONLY the final testing plan.

## Application Overview
- **Frontend**: React Native with Expo, uses ExpenseContext for state management with useReducer pattern
- **Backend**: Express.js REST API with JSON file-based persistence (db.json)
- **Storage**: AsyncStorage for offline support with server fallback
- **Core Features**: Expense/income tracking, budget management, categories, payment methods (cash/UPI/netbanking), banks, UPI apps, user preferences, currency settings, balance tracking

## Testing Phases (Explain WHAT to test and WHY, not HOW)

### Phase 1: Functional Testing Scope
- Core CRUD operations for expenses (create, read, update, delete)
- Category management (add, delete with default protected categories)
- Payment methods, banks, and UPI apps CRUD
- Budget updates and currency changes
- User profile and preferences management
- Balance updates (cash and UPI) based on income/expense transactions

### Phase 2: Edge Cases and Boundary Conditions
- Empty states for all list views
- Maximum character limits for text inputs
- Special characters in expense titles and notes
- Zero and negative amount handling
- Date boundary conditions (month/year transitions)
- Currency symbol display and formatting
- Category deletion protection for default categories

### Phase 3: Async vs Sync and Concurrency Issues
- Race conditions when multiple expenses are added simultaneously
- State consistency between local AsyncStorage and server database
- Optimistic UI updates vs actual server responses
- Network timeout handling and retry mechanisms
- Concurrent balance updates from multiple transactions

### Phase 4: Load and Scalability Concerns
- Performance with large number of expenses (100+, 1000+)
- Large category and payment method lists
- Database file size impact on read/write operations
- Memory usage during expense list scrolling

### Phase 5: Failure Scenarios and Recovery Paths
- Server unavailable: verify local fallback works correctly
- Network errors during CRUD operations
- Invalid API responses handling
- Corrupted JSON data in db.json
- Failed balance updates rollback
- Category deletion failure recovery

### Phase 6: Data Consistency and Integrity
- Balance calculation accuracy (income adds, expenses deduct)
- Payment method association with expenses after deletion
- Category association with expenses after deletion
- Currency consistency across all views
- Budget vs actual spending comparisons
- Data persistence after app restart

### Phase 7: Integration Testing
- Frontend-backend communication for all endpoints
- Error handling consistency between server and client
- State synchronization in ExpenseContext
- Offline mode functionality and data sync

Output ONLY the structured testing plan with these phases, what to test in each, and why each aspect matters for this specific application.
