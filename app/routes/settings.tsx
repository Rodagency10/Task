import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { supabase } from "~/lib/supabase";
import { getProfile, upsertProfile } from "~/lib/queries/profile";
import { PageHeader } from "~/components/layout/PageHeader";
import { Input, Textarea } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export const meta: MetaFunction = () => [{ title: "Paramètres — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const profile = await getProfile(user.id);
  return { profile };
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();

  try {
    await upsertProfile(user.id, {
      company_name: (formData.get("company_name") as string) ?? "",
      company_tagline: (formData.get("company_tagline") as string) ?? "",
      company_email: (formData.get("company_email") as string) ?? "",
      company_phone: (formData.get("company_phone") as string) ?? "",
      company_address: (formData.get("company_address") as string) ?? "",
      company_website: (formData.get("company_website") as string) ?? "",
      company_siret: (formData.get("company_siret") as string) ?? "",
    });
    return { success: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export default function Settings() {
  const { profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Informations de votre entreprise utilisées dans les factures"
      />

      <Form method="post" className="max-w-2xl flex flex-col gap-4">
        {actionData && "error" in actionData && actionData.error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {actionData.error}
          </div>
        )}
        {actionData && "success" in actionData && actionData.success && (
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            Paramètres enregistrés avec succès.
          </div>
        )}

        {/* Company info */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Informations entreprise</h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Nom de l'entreprise"
              name="company_name"
              placeholder="Mon Entreprise"
              defaultValue={profile?.company_name ?? ""}
            />
            <Input
              label="Tagline / Description courte"
              name="company_tagline"
              placeholder="Freelance & Services numériques"
              defaultValue={profile?.company_tagline ?? ""}
            />
          </div>
        </Card>

        {/* Contact */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email professionnel"
              name="company_email"
              type="email"
              placeholder="contact@monentreprise.com"
              defaultValue={profile?.company_email ?? ""}
            />
            <Input
              label="Téléphone"
              name="company_phone"
              type="tel"
              placeholder="+33 6 00 00 00 00"
              defaultValue={profile?.company_phone ?? ""}
            />
            <Input
              label="Site web"
              name="company_website"
              type="url"
              placeholder="https://monentreprise.com"
              defaultValue={profile?.company_website ?? ""}
              className="md:col-span-2"
            />
          </div>
        </Card>

        {/* Address */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Adresse</h2>
          <Textarea
            label="Adresse complète"
            name="company_address"
            placeholder={"12 rue de la Paix\n75001 Paris, France"}
            rows={3}
            defaultValue={profile?.company_address ?? ""}
          />
        </Card>

        {/* Legal */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Identification fiscale</h2>
          <Input
            label="SIRET / Numéro fiscal"
            name="company_siret"
            placeholder="123 456 789 00010"
            defaultValue={profile?.company_siret ?? ""}
          />
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
