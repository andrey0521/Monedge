export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface Account {
  id: string;
  name: string;
  bank: string | null;
  balance: number;
  type: string;
  credit_limit: number | null;
}

export interface Category {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  is_default: boolean;
  type: string; // "income" | "expense"
  description?: string | null;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  frequency: "weekly" | "biweekly" | "monthly";
  next_date: string | null;
  end_date: string | null;
  is_active: boolean;
  category_id: string | null;
  account_id: string | null;
  budget_id: string | null;
  goal_id: string | null;
  category_name: string | null;
  category_emoji: string | null;
  account_name: string | null;
}

export interface Transaction {
  id: string;
  account_id: string | null;
  category_id: string | null;
  budget_id: string | null;
  goal_id: string | null;
  amount: number;
  type: "income" | "expense" | "transfer";
  description: string;
  date: string;
  created_at: string;
  category_name: string | null;
  category_emoji: string | null;
  account_name: string | null;
}

export interface BudgetPeriod {
  label: string;
  start_date: string;
  end_date: string;
  spent: number;
  amount: number;
  is_current: boolean;
}

export interface Budget {
  id: string;
  category_id: string | null;
  name: string;
  amount: number;        // monto por período
  spent: number;         // gasto total
  total_budget: number;  // amount × períodos
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  frequency: string | null;
  category_name: string | null;
  category_emoji: string | null;
  periods: BudgetPeriod[];
}

export interface Goal {
  id: string;
  name: string;
  emoji: string | null;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
}

export interface DashboardData {
  total_balance: number;
  credit_debt: number;
  monthly_income: number;
  monthly_expenses: number;
  safe_daily_budget: number;
  avg_daily_expense: number;
  recent_transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
}
