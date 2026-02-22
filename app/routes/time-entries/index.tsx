import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { useLoaderData, Form, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { Timer1, Trash, Play, Stop } from "iconsax-react";
import { supabase } from "~/lib/supabase";
import { getTimeEntries, createTimeEntry, stopTimer, deleteTimeEntry } from "~/lib/queries/time-entries";
import { getProjects } from "~/lib/queries/projects";
import { getTasks } from "~/lib/queries/tasks";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { Select } from "~/components/ui/Select";
import { formatDate, formatDuration } from "~/lib/utils/dates";

export const meta: MetaFunction = () => [{ title: "Suivi du temps — Task" }];

const TIMER_KEY = "active_timer";

export async function loader(_args: LoaderFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const [timeEntries, projects, tasks] = await Promise.all([
    getTimeEntries(user.id),
    getProjects(user.id),
    getTasks(user.id),
  ]);

  const totalMinutes = timeEntries
    .filter((e) => e.duration_minutes)
    .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);

  return { timeEntries, projects, tasks, totalMinutes };
}

export async function action({ request }: ActionFunctionArgs) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "start") {
    const projectId = (formData.get("project_id") as string) || null;
    const taskId = (formData.get("task_id") as string) || null;
    const entry = await createTimeEntry(user.id, {
      project_id: projectId,
      task_id: taskId,
      description: (formData.get("description") as string)?.trim() || null,
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_minutes: null,
      is_billable: true,
    });
    return { started: true, entryId: entry.id };
  }

  if (intent === "stop") {
    const entryId = formData.get("entry_id") as string;
    await stopTimer(entryId, user.id, new Date().toISOString());
    return { stopped: true };
  }

  if (intent === "delete") {
    const entryId = formData.get("entry_id") as string;
    await deleteTimeEntry(entryId, user.id);
    return { deleted: true };
  }

  return {};
}

export default function TimeEntriesIndex() {
  const { timeEntries, projects, tasks, totalMinutes } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const activeEntry = timeEntries.find((e) => !e.ended_at);
  const completedEntries = timeEntries.filter((e) => e.ended_at);

  // Live timer display
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!activeEntry) { setElapsed(0); return; }
    const start = new Date(activeEntry.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeEntry?.id]);

  function formatElapsed(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // Group entries by date
  const byDate = completedEntries.reduce<Record<string, typeof completedEntries>>((acc, entry) => {
    const day = entry.started_at.split("T")[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Suivi du temps"
        description={`Total : ${formatDuration(totalMinutes)}`}
      />

      {/* Timer widget */}
      <Card padding="lg" className="mb-8">
        {activeEntry ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-3xl font-bold font-mono text-zinc-950 tabular-nums">
                  {formatElapsed(elapsed)}
                </p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {activeEntry.project?.name ?? "Sans projet"}{" "}
                  {activeEntry.task ? `· ${activeEntry.task.title}` : ""}
                </p>
              </div>
            </div>
            <Form method="post" className="ml-auto">
              <input type="hidden" name="intent" value="stop" />
              <input type="hidden" name="entry_id" value={activeEntry.id} />
              <Button
                type="submit"
                variant="danger"
                leftIcon={<Stop size={16} color="currentColor" />}
                loading={isSubmitting}
              >
                Arrêter
              </Button>
            </Form>
          </div>
        ) : (
          <Form method="post" className="flex flex-col sm:flex-row items-end gap-4">
            <input type="hidden" name="intent" value="start" />
            <div className="flex gap-3 flex-1">
              <div className="flex-1">
                <Select label="Projet" name="project_id">
                  <option value="">— Projet —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex-1">
                <Select label="Tâche" name="task_id">
                  <option value="">— Tâche —</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Play size={16} color="currentColor" />}
              loading={isSubmitting}
            >
              Démarrer
            </Button>
          </Form>
        )}
      </Card>

      {/* Entries list */}
      {completedEntries.length === 0 ? (
        <EmptyState
          icon={<Timer1 size={40} color="currentColor" variant="Bulk" />}
          title="Aucune entrée de temps"
          description="Démarrez un chronomètre pour commencer à suivre votre temps."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(byDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, entries]) => {
              const dayTotal = entries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-zinc-700">{formatDate(date)}</p>
                    <p className="text-xs text-zinc-400">{formatDuration(dayTotal)}</p>
                  </div>
                  <Card padding="none">
                    <div className="divide-y divide-zinc-100">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between px-4 py-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                              <Timer1 size={14} color="currentColor" className="text-zinc-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">
                                {entry.project?.name ?? "Sans projet"}
                              </p>
                              {entry.task && (
                                <p className="text-xs text-zinc-400">{entry.task.title}</p>
                              )}
                              {entry.description && (
                                <p className="text-xs text-zinc-400 italic">{entry.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-semibold text-zinc-900">
                              {formatDuration(entry.duration_minutes ?? 0)}
                            </span>
                            <Form method="post">
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="entry_id" value={entry.id} />
                              <button
                                type="submit"
                                className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash size={14} color="currentColor" />
                              </button>
                            </Form>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
