import { Link } from "react-router";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [{ title: "Page introuvable — Task" }];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-8xl font-bold text-zinc-100 mb-4 select-none">404</p>
        <h1 className="text-2xl font-bold text-zinc-950 mb-2">Page introuvable</h1>
        <p className="text-sm text-zinc-500 mb-6">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
