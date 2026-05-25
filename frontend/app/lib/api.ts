import type {
  User, Account, Category, Transaction, Budget, Goal, DashboardData, RecurringTransaction,
} from "./types";

const API = "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    const detail = err.detail;
    const msg = Array.isArray(detail)
      ? detail.map((d: { msg: string }) => d.msg).join(", ")
      : detail || "Error en la petición";
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const register = (email: string, full_name: string, password: string, use_default_categories = true) =>
  req<User>("/auth/register", { method: "POST", body: JSON.stringify({ email, full_name, password, use_default_categories }) });

export const login = (email: string, password: string) =>
  req<{ message: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const logout = () =>
  req<void>("/auth/logout", { method: "POST" });

export const getMe = () =>
  req<User>("/auth/me");

// Dashboard
export const getDashboard = () =>
  req<DashboardData>("/dashboard");

// Accounts
export const getAccounts = () =>
  req<Account[]>("/accounts");

export const createAccount = (data: Omit<Account, "id">) =>
  req<Account>("/accounts", { method: "POST", body: JSON.stringify(data) });

export const updateAccount = (id: string, data: Partial<Omit<Account, "id">>) =>
  req<Account>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteAccount = (id: string) =>
  req<void>(`/accounts/${id}`, { method: "DELETE" });

export const payCredit = (creditId: string, fromAccountId: string, amount: number) =>
  req<Account[]>(`/accounts/${creditId}/pay`, {
    method: "POST",
    body: JSON.stringify({ from_account_id: fromAccountId, amount }),
  });

// Categories
export const getCategories = (type?: "income" | "expense") =>
  req<Category[]>(`/categories${type ? "?type=" + type : ""}`);

export const createCategory = (data: Omit<Category, "id" | "is_default">) =>
  req<Category>("/categories", { method: "POST", body: JSON.stringify(data) });

export const seedCategories = () =>
  req<void>("/categories/seed", { method: "POST" });

export const updateCategory = (id: string, data: { name?: string; emoji?: string; color?: string; description?: string }) =>
  req<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteCategory = (id: string) =>
  req<void>(`/categories/${id}`, { method: "DELETE" });

// Transactions
export const getTransactions = (params?: { start_date?: string; end_date?: string; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  if (params?.limit) qs.set("limit", String(params.limit));
  return req<Transaction[]>(`/transactions${qs.toString() ? "?" + qs : ""}`);
};

export const createTransaction = (data: Omit<Transaction, "id" | "created_at" | "category_name" | "category_emoji" | "account_name">) =>
  req<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) });

export const updateTransaction = (id: string, data: Partial<Omit<Transaction, "id" | "created_at" | "category_name" | "category_emoji" | "account_name">>) =>
  req<Transaction>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteTransaction = (id: string) =>
  req<void>(`/transactions/${id}`, { method: "DELETE" });

// Budgets
export const getBudgets = () =>
  req<Budget[]>("/budgets");

export const createBudget = (data: Omit<Budget, "id" | "spent" | "category_name" | "category_emoji">) =>
  req<Budget>("/budgets", { method: "POST", body: JSON.stringify(data) });

export const updateBudget = (id: string, data: Partial<Omit<Budget, "id" | "spent">>) =>
  req<Budget>(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteBudget = (id: string) =>
  req<void>(`/budgets/${id}`, { method: "DELETE" });

export const renewBudget = (id: string) =>
  req<Budget>(`/budgets/${id}/renew`, { method: "POST" });

// Goals
export const getGoals = () =>
  req<Goal[]>("/goals");

export const createGoal = (data: Omit<Goal, "id">) =>
  req<Goal>("/goals", { method: "POST", body: JSON.stringify(data) });

export const updateGoal = (id: string, data: Partial<Omit<Goal, "id">>) =>
  req<Goal>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteGoal = (id: string) =>
  req<void>(`/goals/${id}`, { method: "DELETE" });

export const contributeGoal = (id: string, account_id: string, amount: number) =>
  req<Goal>(`/goals/${id}/contribute`, { method: "POST", body: JSON.stringify({ account_id, amount }) });

export const withdrawGoal = (id: string, account_id: string, amount: number) =>
  req<Goal>(`/goals/${id}/withdraw`, { method: "POST", body: JSON.stringify({ account_id, amount }) });

// Recurring transactions
export const getRecurring = () =>
  req<RecurringTransaction[]>("/recurring");

export const createRecurring = (data: Omit<RecurringTransaction, "id" | "category_name" | "category_emoji" | "account_name">) =>
  req<RecurringTransaction>("/recurring", { method: "POST", body: JSON.stringify(data) });

export const updateRecurring = (id: string, data: Partial<Omit<RecurringTransaction, "id" | "category_name" | "category_emoji" | "account_name">>) =>
  req<RecurringTransaction>(`/recurring/${id}`, { method: "PUT", body: JSON.stringify(data) });


export const deleteRecurring = (id: string) =>
  req<void>(`/recurring/${id}`, { method: "DELETE" });

export const applyRecurring = (id: string, paymentAccountId?: string) =>
  req<Transaction>(`/recurring/${id}/apply`, {
    method: "POST",
    body: JSON.stringify({ payment_account_id: paymentAccountId ?? null }),
  });

// AI
export const aiCategorize = (description: string, amount: number) =>
  req<{ category_name: string; emoji: string; category_id: string | null }>(
    "/ai/categorize", { method: "POST", body: JSON.stringify({ description, amount }) }
  );

export const aiSummary = () =>
  req<{ text: string }>("/ai/summary");

export type RecommendationAction = {
  type: "budget" | "goal";
  label: string;
  data: {
    name: string;
    amount?: number;
    category_name?: string;
    category_id?: string | null;
    frequency?: string;
    emoji?: string;
    target_amount?: number;
    deadline?: string;
  };
};
export const aiRecommendations = () =>
  req<{ text: string; actions: RecommendationAction[] | null }>("/ai/recommendations");

export const aiQueryFinances = (query: string) =>
  req<{ text: string }>("/ai/query", { method: "POST", body: JSON.stringify({ query }) });

export const aiSuggestCategoryDescription = (name: string, emoji: string | null, type: string) =>
  req<{ description: string }>("/ai/suggest-category-description", {
    method: "POST",
    body: JSON.stringify({ name, emoji, type }),
  });

export const aiAnalyze = (query: string, history?: { role: string; text: string }[]) =>
  req<{ text: string; chart: { type: string; title: string; data: { label: string; value: number }[] } | null; metrics: { label: string; value: string }[] | null }>(
    "/ai/analyze", { method: "POST", body: JSON.stringify({ query, history: history ?? [] }) }
  );
