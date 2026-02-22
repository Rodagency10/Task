import type {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  InvoiceStatus,
  DebtStatus,
  PaymentMethod,
} from "~/lib/types";

// ─── Badge variants ───────────────────────────────────────────────────────────

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted";

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, BadgeVariant> = {
  draft: "muted",
  active: "info",
  paused: "warning",
  completed: "success",
};

export const TASK_STATUS_BADGE: Record<TaskStatus, BadgeVariant> = {
  todo: "muted",
  in_progress: "info",
  review: "warning",
  done: "success",
};

export const TASK_PRIORITY_BADGE: Record<TaskPriority, BadgeVariant> = {
  low: "muted",
  medium: "default",
  high: "warning",
  urgent: "danger",
};

export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, BadgeVariant> = {
  draft: "muted",
  sent: "info",
  paid: "success",
  overdue: "danger",
  cancelled: "muted",
};

export const DEBT_STATUS_BADGE: Record<DebtStatus, BadgeVariant> = {
  pending: "warning",
  partial: "info",
  paid: "success",
  cancelled: "muted",
};

// ─── Display labels ───────────────────────────────────────────────────────────

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const DEBT_STATUS_LABEL: Record<DebtStatus, string> = {
  pending: "Pending",
  partial: "Partial",
  paid: "Paid",
  cancelled: "Cancelled",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  other: "Other",
};

// ─── Default expense categories ────────────────────────────────────────────────

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food & Dining", color: "orange", icon: "utensils", is_default: true },
  { name: "Transport", color: "blue", icon: "car", is_default: true },
  { name: "Shopping", color: "pink", icon: "shopping-bag", is_default: true },
  { name: "Bills & Utilities", color: "yellow", icon: "file-text", is_default: true },
  { name: "Entertainment", color: "purple", icon: "film", is_default: true },
  { name: "Health", color: "green", icon: "heart", is_default: true },
  { name: "Business", color: "slate", icon: "briefcase", is_default: true },
  { name: "Other", color: "gray", icon: "more-horizontal", is_default: true },
] as const;

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_SECTIONS = [
  {
    label: "Général",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: "Home2" },
    ],
  },
  {
    label: "Freelance",
    items: [
      { label: "Clients", href: "/clients", icon: "People" },
      { label: "Projets", href: "/projects", icon: "Briefcase" },
      { label: "Tâches", href: "/tasks", icon: "TaskSquare" },
      { label: "Factures", href: "/invoices", icon: "ReceiptText" },
      { label: "Temps", href: "/time-entries", icon: "Timer1" },
    ],
  },
  {
    label: "Finances",
    items: [
      { label: "Finances", href: "/finance", icon: "Wallet" },
      { label: "Dépenses", href: "/finance/expenses", icon: "MoneyRecive" },
      { label: "Dettes", href: "/finance/debts", icon: "MoneyForbidden" },
      { label: "Revenus", href: "/finance/income", icon: "MoneySend" },
    ],
  },
] as const;
