import { type RouteConfig, layout, route, index } from "@react-router/dev/routes";

export default [
  // Landing page (no layout)
  index("routes/_marketing._index.tsx"),

  // Auth routes (no layout)
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),
  route("onboarding", "routes/onboarding.tsx"),

  // App routes (with sidebar layout)
  layout("routes/_layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),

    // Clients
    route("clients", "routes/clients/index.tsx"),
    route("clients/new", "routes/clients/new.tsx"),
    route("clients/:clientId", "routes/clients/$clientId.tsx"),

    // Projects
    route("projects", "routes/projects/index.tsx"),
    route("projects/new", "routes/projects/new.tsx"),
    route("projects/:projectId", "routes/projects/$projectId.tsx"),

    // Tasks
    route("tasks", "routes/tasks/index.tsx"),
    route("tasks/new", "routes/tasks/new.tsx"),
    route("tasks/:taskId", "routes/tasks/$taskId.tsx"),

    // Invoices
    route("invoices", "routes/invoices/index.tsx"),
    route("invoices/new", "routes/invoices/new.tsx"),
    route("invoices/:invoiceId", "routes/invoices/$invoiceId.tsx"),

    // Time entries
    route("time-entries", "routes/time-entries/index.tsx"),

    // Finance
    route("finance", "routes/finance/index.tsx"),
    route("finance/expenses", "routes/finance/expenses/index.tsx"),
    route("finance/expenses/new", "routes/finance/expenses/new.tsx"),
    route("finance/expenses/:expenseId", "routes/finance/expenses/$expenseId.tsx"),
    route("finance/debts", "routes/finance/debts/index.tsx"),
    route("finance/debts/new", "routes/finance/debts/new.tsx"),
    route("finance/debts/:debtId", "routes/finance/debts/$debtId.tsx"),
    route("finance/income", "routes/finance/income/index.tsx"),

    // Settings
    route("settings", "routes/settings.tsx"),

    // 404
    route("*", "routes/$.tsx"),
  ]),
] satisfies RouteConfig;
