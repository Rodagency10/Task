import { Link, redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import {
  TaskSquare,
  People,
  ReceiptText,
  Timer1,
  Wallet,
  TrendUp,
  ArrowRight2,
  TickCircle,
  Briefcase,
} from "iconsax-react";
import { supabase } from "~/lib/supabase";

export const meta: MetaFunction = () => [
  { title: "Task — Gérez votre activité freelance" },
  {
    name: "description",
    content:
      "Projets, clients, factures, suivi du temps et finances personnelles — tout dans un seul tableau de bord.",
  },
];

export async function loader(_: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) throw redirect("/dashboard");
  return null;
}

const FEATURES = [
  {
    icon: Briefcase,
    title: "Projets",
    desc: "Suivez vos projets actifs, budgets et deadlines en temps réel.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: People,
    title: "Clients",
    desc: "Centralisez vos contacts et l'historique de chaque collaboration.",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: ReceiptText,
    title: "Facturation",
    desc: "Créez des factures numérotées automatiquement avec export PDF.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: TaskSquare,
    title: "Tâches",
    desc: "Organisez votre travail par priorité, statut et projet associé.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Timer1,
    title: "Suivi du temps",
    desc: "Chronométrez vos sessions et suivez les heures facturables.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Wallet,
    title: "Finances",
    desc: "Visualisez revenus, dépenses et dettes depuis un seul endroit.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Créez votre compte",
    desc: "Inscription gratuite en moins de 30 secondes.",
  },
  {
    n: "02",
    title: "Ajoutez vos clients",
    desc: "Importez ou créez vos contacts pour démarrer vos projets.",
  },
  {
    n: "03",
    title: "Commencez à facturer",
    desc: "Émettez votre première facture professionnelle en quelques clics.",
  },
] as const;

const BENEFITS = [
  "Numérotation automatique des factures",
  "Détection des factures en retard",
  "Suivi du temps par projet",
  "Tableau de bord finances complet",
  "Export PDF des factures",
  "Gestion des dettes et créances",
] as const;

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-zinc-950">Task</span>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:block px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors rounded-lg hover:bg-zinc-100"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Commencer
              <ArrowRight2 size={14} color="currentColor" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="bg-zinc-50 px-6 py-24 sm:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-500 mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tout-en-un pour freelances
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-950 leading-tight mb-6">
            Gérez votre activité freelance{" "}
            <span className="text-zinc-400">en toute simplicité.</span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Projets, clients, factures, suivi du temps et finances personnelles
            — tout dans un seul tableau de bord, sans friction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Commencer gratuitement
              <ArrowRight2 size={16} color="currentColor" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              J'ai déjà un compte →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 border-t border-zinc-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 mb-3">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-zinc-400 max-w-md mx-auto text-sm">
              Un seul outil pour piloter votre activité du premier client à la
              dernière dépense.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}
                >
                  <f.icon
                    size={20}
                    color="currentColor"
                    variant="Bulk"
                    className={f.color}
                  />
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="bg-zinc-50 px-6 py-20 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 mb-3">
              Lancez-vous en 3 étapes
            </h2>
            <p className="text-zinc-400 text-sm">
              Opérationnel en moins de 5 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="relative flex flex-col items-center text-center"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(50%+2rem)] right-[-50%] h-px bg-zinc-200 z-0" />
                )}
                <div className="w-10 h-10 rounded-full bg-zinc-950 text-white text-sm font-bold flex items-center justify-center mb-4 relative z-10 shrink-0">
                  {s.n}
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ───────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 border-t border-zinc-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-zinc-950 text-center mb-8">
            Inclus dans chaque compte
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 text-sm text-zinc-700"
              >
                <TickCircle
                  size={18}
                  color="currentColor"
                  variant="Bulk"
                  className="text-emerald-500 shrink-0"
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────── */}
      <section className="bg-zinc-950 px-6 py-24">
        <div className="max-w-xl mx-auto text-center">
          <TrendUp
            size={36}
            color="currentColor"
            variant="Bulk"
            className="text-zinc-600 mx-auto mb-6"
          />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Prêt à reprendre le contrôle de votre activité ?
          </h2>
          <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
            Rejoignez Task et pilotez votre activité freelance depuis un seul
            endroit.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Créer mon compte gratuitement
            <ArrowRight2 size={16} color="currentColor" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-white border-t border-zinc-200 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <span className="font-bold text-zinc-950 text-base">Task</span>
          <span>© 2026 Task. Tous droits réservés.</span>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="hover:text-zinc-700 transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="hover:text-zinc-700 transition-colors"
            >
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
