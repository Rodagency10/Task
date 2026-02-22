import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status = 500;
  let title = "Erreur inattendue";
  let message = "Une erreur inattendue s'est produite. Veuillez réessayer.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      title = "Page introuvable";
      message = "La page que vous cherchez n'existe pas ou a été déplacée.";
    } else if (error.status === 403) {
      title = "Accès refusé";
      message = "Vous n'avez pas les droits pour accéder à cette ressource.";
    } else {
      message = error.statusText || message;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    message = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-zinc-200 mb-4">{status}</p>
        <h1 className="text-2xl font-bold text-zinc-950 mb-2">{title}</h1>
        <p className="text-sm text-zinc-500 mb-6">{message}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Retour au tableau de bord
        </Link>
        {stack && import.meta.env.DEV && (
          <pre className="mt-8 text-left text-xs bg-zinc-100 rounded-xl p-4 overflow-x-auto text-zinc-600 max-h-64">
            {stack}
          </pre>
        )}
      </div>
    </main>
  );
}
