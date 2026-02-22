import { redirect, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { People, Add, Building, Sms, Call } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getClients } from "~/lib/queries/clients";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";

export const meta: MetaFunction = () => [{ title: "Clients — Task" }];

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");
  const clients = await getClients(user.id);
  return { clients };
}

export default function ClientsIndex() {
  const { clients } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length !== 1 ? "s" : ""}`}
        action={
          <Link to="/clients/new">
            <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
              Nouveau client
            </Button>
          </Link>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<People size={40} color="currentColor" variant="Bulk" />}
          title="Aucun client"
          description="Ajoutez votre premier client pour commencer à gérer vos projets et factures."
          action={
            <Link to="/clients/new">
              <Button variant="primary" leftIcon={<Add size={16} color="currentColor" />}>
                Nouveau client
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} to={`/clients/${client.id}`}>
              <Card padding="lg" hoverable>
                {/* Avatar */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-zinc-600">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{client.name}</p>
                    {client.company && (
                      <p className="text-xs text-zinc-400 truncate">{client.company}</p>
                    )}
                  </div>
                </div>

                {/* Contact info */}
                <div className="flex flex-col gap-1.5">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Sms size={13} color="currentColor" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Call size={13} color="currentColor" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Building size={13} color="currentColor" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
