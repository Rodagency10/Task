import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { Form, useActionData, useNavigation, Link } from "react-router";
import { Building, ArrowRight } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { upsertProfile } from "~/lib/queries/profile";
import { Input, Textarea } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";

export const meta: MetaFunction = () => [{ title: "Bienvenue — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "skip") {
    throw redirect("/dashboard");
  }

  try {
    await upsertProfile(user.id, {
      company_name: (formData.get("company_name") as string) ?? "",
      company_email: (formData.get("company_email") as string) ?? "",
      company_phone: (formData.get("company_phone") as string) ?? "",
      company_address: (formData.get("company_address") as string) ?? "",
    });
    throw redirect("/dashboard");
  } catch (err) {
    if (err instanceof Response) throw err;
    return { error: (err as Error).message };
  }
}

export default function Onboarding() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-950 rounded-2xl mb-4">
            <Building size={28} color="white" variant="Bulk" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-950">Configurez votre entreprise</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Ces informations apparaîtront sur vos factures. Vous pouvez les modifier plus tard.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <Form method="post" className="flex flex-col gap-4">
            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {actionData.error}
              </div>
            )}

            <Input
              label="Nom de l'entreprise"
              name="company_name"
              placeholder="Mon Entreprise"
              autoFocus
            />
            <Input
              label="Email professionnel"
              name="company_email"
              type="email"
              placeholder="contact@monentreprise.com"
            />
            <Input
              label="Téléphone"
              name="company_phone"
              type="tel"
              placeholder="+33 6 00 00 00 00"
            />
            <Textarea
              label="Adresse"
              name="company_address"
              placeholder={"12 rue de la Paix\n75001 Paris, France"}
              rows={2}
            />

            <div className="flex flex-col gap-2 mt-2">
              <Button
                type="submit"
                name="intent"
                value="save"
                variant="primary"
                loading={isSubmitting}
                rightIcon={<ArrowRight size={16} color="currentColor" />}
              >
                {isSubmitting ? "Enregistrement..." : "Commencer"}
              </Button>
              <Button
                type="submit"
                name="intent"
                value="skip"
                variant="ghost"
              >
                Passer cette étape
              </Button>
            </div>
          </Form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Vous pourrez modifier ces informations depuis{" "}
          <Link to="/settings" className="underline hover:text-zinc-600">
            les paramètres
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
