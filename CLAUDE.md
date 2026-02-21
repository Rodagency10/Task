# CLAUDE.md — Task

> All-in-one freelancer app: projects, clients, invoices, tasks, time tracking & personal finance management.
> Stack: React Router v7, Supabase, Tailwind CSS v4, TypeScript

---

## Project Structure

```
src/
├── routes/
│   ├── _layout.tsx               # Root layout with sidebar
│   ├── dashboard.tsx             # Overview: projects + finance summary
│   ├── clients/
│   │   ├── index.tsx
│   │   ├── $clientId.tsx
│   │   └── new.tsx
│   ├── projects/
│   │   ├── index.tsx
│   │   ├── $projectId.tsx
│   │   └── new.tsx
│   ├── tasks/
│   │   ├── index.tsx
│   │   ├── $taskId.tsx
│   │   └── new.tsx
│   ├── invoices/
│   │   ├── index.tsx
│   │   ├── $invoiceId.tsx
│   │   └── new.tsx
│   ├── time-entries/
│   │   └── index.tsx
│   └── finance/                  # Personal finance module
│       ├── index.tsx             # Finance dashboard (balance, charts, summary)
│       ├── expenses/
│       │   ├── index.tsx         # All purchases/expenses
│       │   ├── $expenseId.tsx
│       │   └── new.tsx
│       ├── debts/                # People who owe me money
│       │   ├── index.tsx
│       │   ├── $debtId.tsx       # Debt detail + payment history
│       │   └── new.tsx
│       └── income/
│           └── index.tsx         # Auto-synced from invoices + manual entries
├── components/
│   ├── ui/                       # Button, Badge, Modal, Card, etc.
│   ├── layout/                   # Sidebar, Header, PageHeader
│   ├── clients/                  # ClientCard, ClientForm, ClientList
│   ├── projects/                 # ProjectCard, ProjectForm, StatusBadge
│   ├── invoices/                 # InvoiceTable, InvoicePDF, InvoiceForm
│   ├── tasks/                    # TaskItem, TaskBoard, TaskForm
│   ├── time/                     # TimerWidget, TimeEntryRow
│   └── finance/
│       ├── BalanceWidget.tsx     # Net balance summary
│       ├── IncomeChart.tsx       # Revenue chart (paid / pending / projected)
│       ├── ExpenseCard.tsx
│       ├── DebtCard.tsx          # Debt + remaining amount
│       └── RevenueTimeline.tsx   # Projects revenue timeline
├── lib/
│   ├── supabase.ts
│   ├── queries/
│   │   ├── clients.ts
│   │   ├── projects.ts
│   │   ├── invoices.ts
│   │   ├── tasks.ts
│   │   ├── time-entries.ts
│   │   ├── expenses.ts
│   │   ├── debts.ts
│   │   └── income.ts
│   ├── hooks/
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── dates.ts
│   │   ├── invoice.ts
│   │   └── finance.ts            # Balance, projections, revenue aggregation
│   └── constants.ts
├── types/
│   └── database.ts
└── styles/
    └── global.css
```

---

## Development Commands

```bash
npm run dev           # Start local server (localhost:5173)
npm run build         # Production build
npm run typecheck     # TypeScript verification
npm run lint          # ESLint
supabase start        # Start local Supabase (Docker required)
supabase gen types    # Regenerate src/types/database.ts
supabase db push      # Apply local migrations
supabase migration new <name>
```

---

## Supabase Database Schema

### Core Tables (Freelance)

- **clients**: id, user_id, name, email, phone, company, address, notes, created_at
- **projects**: id, user_id, client_id, name, description, status (draft/active/paused/completed), hourly_rate, fixed_price, budget, start_date, end_date, created_at
- **tasks**: id, user_id, project_id, title, description, status (todo/in_progress/review/done), priority (low/medium/high/urgent), due_date, estimated_hours, created_at
- **time_entries**: id, user_id, task_id, project_id, description, started_at, ended_at, duration_minutes, is_billable
- **invoices**: id, user_id, client_id, project_id, invoice_number, status (draft/sent/paid/overdue/cancelled), issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes
- **invoice_items**: id, invoice_id, description, quantity, unit_price, total

### Finance Tables (Personal)

- **expenses**: id, user_id, category_id, description, amount, date, payment_method, receipt_url, notes, is_business, created_at
- **expense_categories**: id, user_id, name, color, icon, is_default, created_at
- **debts**: id, user_id, person_name, person_contact, amount, amount_paid, description, due_date, status (pending/partial/paid/cancelled), created_at
- **debt_payments**: id, debt_id, amount, paid_at, notes, created_at
- **income**: id, user_id, source, description, amount, date, invoice_id (nullable — auto-linked), is_recurring, created_at

### Critical RLS Rules (Row Level Security)

- **All tables have RLS enabled** — never forget this rule
- All policies filter by `auth.uid() = user_id`
- For `debt_payments`, join-based filter:
  ```sql
  CREATE POLICY "Users can view own debt_payments" ON debt_payments
    FOR SELECT USING (
      debt_id IN (SELECT id FROM debts WHERE user_id = auth.uid())
    );
  ```
- Standard template for all other tables:
  ```sql
  CREATE POLICY "Users can view own [table]" ON [table]
    FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own [table]" ON [table]
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  -- UPDATE / DELETE same pattern
  ```

### Status Types

```typescript
type ProjectStatus = "draft" | "active" | "paused" | "completed";
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";
type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
type DebtStatus = "pending" | "partial" | "paid" | "cancelled";
type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "mobile_money"
  | "other";
```

---

## Finance Module — Business Logic

### Revenue Aggregation (auto-sync from projects)

```typescript
// src/lib/utils/finance.ts

// REALIZED revenue — paid invoices
async function getPaidRevenue(
  userId: string,
  period?: { start: string; end: string },
) {
  const query = supabase
    .from("invoices")
    .select("total")
    .eq("user_id", userId)
    .eq("status", "paid");
  if (period)
    query.gte("issue_date", period.start).lte("issue_date", period.end);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.reduce((sum, inv) => sum + inv.total, 0);
}

// IN PROGRESS revenue — sent invoices awaiting payment
async function getPendingRevenue(userId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("total")
    .eq("user_id", userId)
    .eq("status", "sent");
  if (error) throw new Error(error.message);
  return data.reduce((sum, inv) => sum + inv.total, 0);
}

// PROJECTED revenue — active/draft projects not yet invoiced
async function getProjectedRevenue(userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("fixed_price, budget")
    .eq("user_id", userId)
    .in("status", ["active", "draft"]);
  if (error) throw new Error(error.message);
  return data.reduce((sum, p) => sum + (p.fixed_price ?? p.budget ?? 0), 0);
}
```

### Finance Dashboard Summary

```typescript
// Used by finance/index.tsx loader
interface FinanceSummary {
  paidRevenue: number; // Realized — paid invoices
  pendingRevenue: number; // In progress — sent invoices
  projectedRevenue: number; // Upcoming — active/draft projects
  totalExpenses: number; // Sum of all expenses
  netBalance: number; // paidRevenue + manual income - expenses
  totalDebts: number; // Total owed to me (all active debts)
  pendingDebts: number; // Remaining unpaid debt amounts
}
```

### Debt Tracking

```typescript
// Remaining amount on a debt
const remaining = debt.amount - debt.amount_paid;

// Auto-update status after recording a payment
if (remaining <= 0) status = "paid";
else if (debt.amount_paid > 0) status = "partial";
else status = "pending";
```

### Auto-sync: Invoice → Income

When an invoice transitions to `paid`, automatically create an income entry to avoid manual duplication:

```typescript
// In the invoice update action
if (newStatus === "paid" && previousStatus !== "paid") {
  await supabase.from("income").insert({
    user_id: user.id,
    source: `Invoice ${invoice.invoice_number}`,
    description: `Payment from ${invoice.client.name}`,
    amount: invoice.total,
    date: new Date().toISOString().split("T")[0],
    invoice_id: invoice.id, // prevents duplicates
  });
}
```

### Default Expense Categories (seeded on user creation)

```typescript
const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", color: "orange", icon: "utensils" },
  { name: "Transport", color: "blue", icon: "car" },
  { name: "Shopping", color: "pink", icon: "shopping-bag" },
  { name: "Bills & Utilities", color: "yellow", icon: "file-text" },
  { name: "Entertainment", color: "purple", icon: "film" },
  { name: "Health", color: "green", icon: "heart" },
  { name: "Business", color: "slate", icon: "briefcase" },
  { name: "Other", color: "gray", icon: "more-horizontal" },
];
```

---

## Supabase Patterns

### Client (singleton)

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

### Standard Query Pattern

```typescript
const { data, error } = await supabase
  .from("expenses")
  .select("*, category:expense_categories(name, color, icon)")
  .eq("user_id", userId)
  .order("date", { ascending: false });

if (error) throw new Error(error.message);
return data;
```

### Queries in React Router Loaders

```typescript
export async function loader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const { data, error } = await supabase
    .from("debts")
    .select("*, payments:debt_payments(*)")
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .order("due_date", { ascending: true });

  if (error) throw new Response(error.message, { status: 500 });
  return { debts: data };
}
```

### Mutations in React Router Actions

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const { error } = await supabase.from("expenses").insert({
    ...Object.fromEntries(formData),
    user_id: user.id,
  });

  if (error) return { error: error.message };
  return redirect("/finance/expenses");
}
```

---

## React Router v7 Patterns

- **File-based routing** — no declarative router
- **Loaders** for all data: never `useEffect` + fetch
- **Actions** for all forms: use `<Form>`
- `useLoaderData()` — loader data
- `useActionData()` — action returns (errors)
- `useFetcher()` — mutations without navigation (e.g., mark debt as paid)
- `useNavigation()` — pending states

```typescript
export default function NewExpense() {
  const { categories } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <Form method="post">
      {actionData?.error && <ErrorAlert message={actionData.error} />}
      {/* fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Add Expense'}
      </Button>
    </Form>
  )
}
```

---

## Tailwind CSS v4 Conventions

- `@import "tailwindcss"` in global CSS — no `tailwind.config.js`
- Utility classes directly in JSX
- Color palette:
  - Primary: `blue-600` / `blue-700`
  - Income/Paid: `green-500`
  - Pending/Warning: `amber-500`
  - Expense/Danger: `red-500`
  - Neutral/Draft: `slate-400`
- Mobile-first: `md:` tablet, `lg:` desktop
- Sidebar: `w-64` desktop, drawer on mobile

### Status Badges

```typescript
const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-blue-100 text-blue-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

const DEBT_STATUS_STYLES: Record<DebtStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-slate-100 text-slate-700",
};
```

---

## TypeScript Conventions

- **Strict mode** — no `any` without comment justification
- Types from Supabase CLI in `src/types/database.ts` — never edit manually
- Derived types in `src/lib/types.ts`:
  ```typescript
  type Project = Database["public"]["Tables"]["projects"]["Row"];
  type Expense = Database["public"]["Tables"]["expenses"]["Row"];
  type Debt = Database["public"]["Tables"]["debts"]["Row"];
  type DebtWithPayments = Debt & { payments: DebtPayment[] };
  type ExpenseWithCategory = Expense & {
    category: Pick<ExpenseCategory, "name" | "color" | "icon">;
  };
  ```
- Component props: named interfaces `<ComponentName>Props`
- No `export default` for types/interfaces

---

## Important Business Logic

### Invoice Numbering

- Format: `INV-YYYY-NNNN` (e.g., INV-2025-0042)
- Use `generateInvoiceNumber()` from `src/lib/utils/invoice.ts` — never generate manually

### Amount Calculations

```typescript
// Currency formatting (always use this)
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );

// Invoice totals — always derived from items
const subtotal = items.reduce(
  (sum, item) => sum + item.quantity * item.unit_price,
  0,
);
const taxAmount = subtotal * (taxRate / 100);
const total = subtotal + taxAmount;
```

### Duration Calculation (time tracking)

- Store `started_at` and `ended_at` in ISO 8601 UTC
- `duration_minutes` calculated on save, never manually
- Active timer key in localStorage: `active_timer`

### Invoice "overdue" Status

- Becomes `overdue` when `due_date < today` and `status = 'sent'`
- Check client-side on display or via Supabase Edge Function

---

## Authentication

- Supabase Auth — email + password (no OAuth for now)
- Public routes: `/login`, `/register`
- Protection in every loader:
  ```typescript
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  ```
- Always use `getUser()`, never `getSession()` server-side

---

## What You Should NEVER Do

- No Supabase queries in `useEffect` — use loaders
- No sensitive data in localStorage (except `active_timer`)
- No `service_role` key client-side
- No manual edits to `src/types/database.ts`
- No components over 200 lines — split them
- No `console.log` in production — use `import.meta.env.DEV`
- No missing loading/error states in data views

---

## Pre-commit Checklist

- [ ] TypeScript without errors (`npm run typecheck`)
- [ ] No unjustified `any`
- [ ] RLS enabled on new tables
- [ ] Loading/error states handled
- [ ] No secrets or API keys in code
- [ ] Amounts formatted with `Intl.NumberFormat`
- [ ] Dates in local format (`MM/DD/YYYY` or locale-appropriate)

---

## Important Reference Files

- @src/types/database.ts — Generated Supabase types
- @src/lib/supabase.ts — Supabase client
- @src/lib/utils/invoice.ts — Invoice number logic
- @src/lib/utils/finance.ts — Revenue aggregation & balance calculations
- @src/components/ui/ — Base UI components to reuse
- @supabase/migrations/ — DB migration history
