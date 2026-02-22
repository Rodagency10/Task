import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { supabase } from "~/lib/supabase";

export const meta: MetaFunction = () => [{ title: "Connexion — Task" }];

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) throw redirect("/dashboard");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "L'email et le mot de passe sont requis." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email ou mot de passe incorrect." };

  throw redirect("/dashboard");
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-950">Task</h1>
          <p className="text-base text-zinc-400 mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <Form method="post" className="flex flex-col gap-5">
            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {actionData.error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-base text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-base text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-950 text-white font-semibold text-base rounded-lg px-4 py-2.5 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </Form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-5">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-zinc-800 font-medium hover:text-zinc-950 transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
