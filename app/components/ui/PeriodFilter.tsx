import { useSearchParams } from "react-router";

export type PeriodKey = "all" | "week" | "month" | "last_month" | "year";

const PERIOD_OPTIONS: { label: string; value: PeriodKey }[] = [
  { label: "Tout", value: "all" },
  { label: "Cette semaine", value: "week" },
  { label: "Ce mois", value: "month" },
  { label: "Mois dernier", value: "last_month" },
  { label: "Cette année", value: "year" },
];

interface PeriodFilterProps {
  className?: string;
}

export function PeriodFilter({ className = "" }: PeriodFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = (searchParams.get("period") ?? "all") as PeriodKey;

  const setPeriod = (p: PeriodKey) => {
    setSearchParams((prev) => {
      if (p === "all") {
        prev.delete("period");
      } else {
        prev.set("period", p);
      }
      return prev;
    });
  };

  return (
    <div className={["flex items-center gap-1 flex-wrap", className].join(" ")}>
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setPeriod(opt.value)}
          className={[
            "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap",
            active === opt.value
              ? "bg-zinc-950 text-white border-zinc-950"
              : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Returns start/end ISO date strings for the given period, or null for "all" */
export function getPeriodRange(period: PeriodKey): { start: string; end: string } | null {
  if (period === "all") return null;

  const now = new Date();
  const toISO = (d: Date) => d.toISOString().split("T")[0];

  if (period === "week") {
    const start = new Date(now);
    const day = now.getDay();
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return { start: toISO(start), end: toISO(now) };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toISO(start), end: toISO(now) };
  }

  if (period === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: toISO(start), end: toISO(end) };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { start: toISO(start), end: toISO(now) };
  }

  return null;
}

/** Filter an array of items by a date field and period */
export function filterByPeriod<T>(
  items: T[],
  period: PeriodKey,
  getDate: (item: T) => string | null | undefined,
): T[] {
  const range = getPeriodRange(period);
  if (!range) return items;

  const start = new Date(range.start);
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);

  return items.filter((item) => {
    const val = getDate(item);
    if (!val) return true;
    const d = new Date(val);
    return d >= start && d <= end;
  });
}
