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
import { DEFAULT_EXPENSE_CATEGORIES } from "~/lib/constants";
import { PasswordInput } from "~/components/ui/PasswordInput";

export const meta: MetaFunction = () => [{ title: "Inscription — Task" }];

export async function loader({ request: _request }: LoaderFunctionArgs) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) throw redirect("/dashboard");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Échec de l'inscription. Veuillez réessayer." };

  // Seed des catégories de dépenses par défaut
  const categories = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    user_id: data.user!.id,
  }));

  await supabase.from("expense_categories").insert(categories);

  throw redirect("/onboarding");
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-950">Task</h1>
          <p className="text-base text-zinc-400 mt-2">Créez votre compte gratuitement</p>
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

            <PasswordInput
              id="password"
              name="password"
              label="Mot de passe"
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />

            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmer le mot de passe"
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-950 text-white font-semibold text-base rounded-lg px-4 py-2.5 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {isSubmitting ? "Création du compte..." : "Créer mon compte"}
            </button>
          </Form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-5">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-zinc-800 font-medium hover:text-zinc-950 transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
