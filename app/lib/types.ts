import type { Database } from "~/types/database";

// ─── Row types ────────────────────────────────────────────────────────────────

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseCategory = Database["public"]["Tables"]["expense_categories"]["Row"];
export type Debt = Database["public"]["Tables"]["debts"]["Row"];
export type DebtPayment = Database["public"]["Tables"]["debt_payments"]["Row"];
export type Income = Database["public"]["Tables"]["income"]["Row"];

// ─── Enum types ───────────────────────────────────────────────────────────────

export type ProjectStatus = Database["public"]["Enums"]["project_status"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
export type DebtStatus = Database["public"]["Enums"]["debt_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];

// ─── Composite types ──────────────────────────────────────────────────────────

export type ProjectWithClient = Project & {
  client: Pick<Client, "id" | "name" | "company"> | null;
};

export type InvoiceWithClient = Invoice & {
  client: Pick<Client, "id" | "name" | "company"> | null;
};

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[];
  client: Pick<Client, "id" | "name" | "company"> | null;
};

export type TaskWithProject = Task & {
  project: Pick<Project, "id" | "name"> | null;
};

export type TimeEntryWithProject = TimeEntry & {
  project: Pick<Project, "id" | "name"> | null;
  task: Pick<Task, "id" | "title"> | null;
};

export type ExpenseWithCategory = Expense & {
  category: Pick<ExpenseCategory, "name" | "color" | "icon"> | null;
};

export type DebtWithPayments = Debt & {
  payments: DebtPayment[];
};

export type IncomeWithInvoice = Income & {
  invoice: Pick<Invoice, "id" | "invoice_number"> | null;
};

// ─── Finance summary ──────────────────────────────────────────────────────────

export interface FinanceSummary {
  paidRevenue: number;
  pendingRevenue: number;
  projectedRevenue: number;
  totalExpenses: number;
  netBalance: number;
  totalDebts: number;
  pendingDebts: number;
}
