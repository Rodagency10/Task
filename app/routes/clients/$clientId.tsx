import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "react-router";
import { useLoaderData, Form, useNavigation, Link } from "react-router";
import { Sms, Call, Building, Edit2, Trash, ArrowLeft, ReceiptText, Briefcase } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getClient, updateClient, deleteClient } from "~/lib/queries/clients";
import { getProjects } from "~/lib/queries/projects";
import { getInvoices } from "~/lib/queries/invoices";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { Input, Textarea } from "~/components/ui/Input";
import { formatCurrency } from "~/lib/utils/currency";
import { formatDate } from "~/lib/utils/dates";
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL, INVOICE_STATUS_BADGE, INVOICE_STATUS_LABEL } from "~/lib/constants";

export const meta: MetaFunction = () => [{ title: "Client — Task" }];

export async function loader({ params }: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [client, projects, invoices] = await Promise.all([
    getClient(params.clientId!, user.id),
    getProjects(user.id),
    getInvoices(user.id),
  ]);

  const clientProjects = projects.filter((p) => p.client_id === params.clientId);
  const clientInvoices = invoices.filter((i) => i.client_id === params.clientId);

  return { client, clientProjects, clientInvoices };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    await deleteClient(params.clientId!, user.id);
    throw redirect("/clients");
  }

  if (intent === "update") {
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { error: "Le nom est requis." };

    await updateClient(params.clientId!, user.id, {
      name,
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      company: (formData.get("company") as string)?.trim() || null,
      address: (formData.get("address") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    });
    return { success: true };
  }

  return {};
}

export default function ClientDetail() {
  const { client, clientProjects, clientInvoices } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = clientInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/clients" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={14} color="currentColor" />
          Clients
        </Link>
      </div>

      <PageHeader
        title={client.name}
        description={client.company ?? "Client"}
        action={
          <Form method="post" onSubmit={(e) => {
            if (!confirm("Supprimer ce client ?")) e.preventDefault();
          }}>
            <input type="hidden" name="intent" value="delete" />
            <Button type="submit" variant="danger" size="sm" leftIcon={<Trash size={14} color="currentColor" />}>
              Supprimer
            </Button>
          </Form>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: edit form */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-zinc-900 mb-3">Informations</h2>
          <Form method="post">
            <input type="hidden" name="intent" value="update" />
            <Card padding="lg">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nom *" name="name" defaultValue={client.name} required />
                  <Input label="Entreprise" name="company" defaultValue={client.company ?? ""} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Email" name="email" type="email" defaultValue={client.email ?? ""} />
                  <Input label="Téléphone" name="phone" type="tel" defaultValue={client.phone ?? ""} />
                </div>
                <Input label="Adresse" name="address" defaultValue={client.address ?? ""} />
                <Textarea label="Notes" name="notes" defaultValue={client.notes ?? ""} rows={3} />
              </div>
            </Card>
            <div className="mt-4">
              <Button type="submit" variant="primary" loading={isSubmitting} leftIcon={<Edit2 size={14} color="currentColor" />}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </Form>
        </div>

        {/* Right: stats + projects + invoices */}
        <div className="flex flex-col gap-4">
          {/* Stats */}
          <Card padding="md">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Résumé</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Total facturé</span>
                <span className="text-sm font-semibold text-zinc-900">{formatCurrency(totalBilled)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Total payé</span>
                <span className="text-sm font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Projets</span>
                <span className="text-sm font-semibold text-zinc-900">{clientProjects.length}</span>
              </div>
            </div>
          </Card>

          {/* Contact */}
          <Card padding="md">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">Contact</h3>
            <div className="flex flex-col gap-2">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
                  <Sms size={14} color="currentColor" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
                  <Call size={14} color="currentColor" />
                  {client.phone}
                </a>
              )}
              {client.address && (
                <div className="flex items-start gap-2 text-sm text-zinc-600">
                  <Building size={14} color="currentColor" className="mt-0.5 shrink-0" />
                  {client.address}
                </div>
              )}
            </div>
          </Card>

          {/* Recent projects */}
          {clientProjects.length > 0 && (
            <Card padding="none">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Projets</h3>
                <Briefcase size={14} color="currentColor" className="text-zinc-400" />
              </div>
              <div className="divide-y divide-zinc-100">
                {clientProjects.slice(0, 4).map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors">
                    <span className="text-sm text-zinc-700 truncate">{project.name}</span>
                    <Badge variant={PROJECT_STATUS_BADGE[project.status]} size="sm">
                      {PROJECT_STATUS_LABEL[project.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Recent invoices */}
          {clientInvoices.length > 0 && (
            <Card padding="none">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Factures</h3>
                <ReceiptText size={14} color="currentColor" className="text-zinc-400" />
              </div>
              <div className="divide-y divide-zinc-100">
                {clientInvoices.slice(0, 4).map((invoice) => (
                  <Link key={invoice.id} to={`/invoices/${invoice.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-sm text-zinc-700">{invoice.invoice_number}</p>
                      <p className="text-xs text-zinc-400">{formatDate(invoice.issue_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={INVOICE_STATUS_BADGE[invoice.status]} size="sm">
                        {INVOICE_STATUS_LABEL[invoice.status]}
                      </Badge>
                      <span className="text-sm font-medium text-zinc-900">{formatCurrency(invoice.total)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
