"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ProblemWithState, StatsOverview, TopicStat } from "@/lib/types";

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] p-4 shadow-[0_10px_22px_rgba(16,24,40,.05)]">
      <div className="text-xs text-[color:var(--muted)]">{label}</div>
      <div className="pf-display mt-2 text-2xl font-semibold leading-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-[color:var(--muted)]">{hint}</div> : null}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function masteryScore(reps: number, ease: number, overdueDays: number) {
  const overduePenalty = Math.min(30, overdueDays * 2);
  const m = 20 * Math.log2(reps + 1) + 25 * (ease - 1.3) - overduePenalty;
  return clamp(m, 0, 100);
}

function daysFromNowISO(iso: string) {
  const due = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((due - now) / (1000 * 60 * 60 * 24));
}

function dueChip(iso?: string) {
  if (!iso) return null;
  const d = daysFromNowISO(iso);
  if (d < 0) return { label: "Overdue", tone: "border-[rgba(251,113,133,.28)] bg-[rgba(251,113,133,.10)]" };
  if (d === 0) return { label: "Due today", tone: "border-[rgba(251,191,36,.28)] bg-[rgba(251,191,36,.10)]" };
  return { label: `Due in ${d}d`, tone: "border-[rgba(45,212,191,.28)] bg-[rgba(45,212,191,.10)]" };
}

export default function StatsPage() {
  const [overview, setOverview] = React.useState<StatsOverview | null>(null);
  const [topics, setTopics] = React.useState<TopicStat[]>([]);
  const [library, setLibrary] = React.useState<ProblemWithState[]>([]);
  const [topicOpen, setTopicOpen] = React.useState(false);
  const [activeTopic, setActiveTopic] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const [o, t] = await Promise.all([
        fetch("/api/stats/overview", { cache: "no-store" }),
        fetch("/api/stats/topics", { cache: "no-store" }),
      ]);
      if (!o.ok) {
        setError("Failed to load stats overview");
        return;
      }
      const ov = (await o.json().catch(() => null)) as unknown;
      setOverview(ov && typeof ov === "object" ? (ov as StatsOverview) : null);
      if (t.ok) {
        const td = (await t.json().catch(() => null)) as unknown;
        setTopics(Array.isArray(td) ? (td as TopicStat[]) : []);
      } else {
        setTopics([]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function ensureLibraryLoaded() {
    if (library.length > 0) return;
    const resp = await fetch("/api/problems", { cache: "no-store" });
    if (!resp.ok) return;
    const data = (await resp.json().catch(() => null)) as unknown;
    setLibrary(Array.isArray(data) ? (data as ProblemWithState[]) : []);
  }

  React.useEffect(() => {
    void load();
  }, []);

  const topicProblems = React.useMemo(() => {
    const needle = activeTopic.trim().toLowerCase();
    if (!needle) return [];
    const now = Date.now();
    return library
      .filter((p) => (p.state?.is_active ?? true) === true)
      .filter((p) => (p.topics || []).some((t) => (t || "").toLowerCase() === needle))
      .map((p) => {
        const dueAt = p.state?.due_at || "";
        const od = dueAt ? Math.max(0, Math.floor((now - new Date(dueAt).getTime()) / (1000 * 60 * 60 * 24))) : 0;
        const mastery = masteryScore(p.state?.reps || 0, p.state?.ease || 2.5, od);
        return { p, mastery };
      })
      .sort((a, b) => {
        const ad = new Date(a.p.state?.due_at || 0).getTime();
        const bd = new Date(b.p.state?.due_at || 0).getTime();
        if (ad !== bd) return ad - bd;
        return b.mastery - a.mastery;
      });
  }, [library, activeTopic]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <div className="pf-kicker">Stats</div>
            <CardTitle>Progress signals</CardTitle>
            <CardDescription>Keep it lightweight: overdue pressure, cadence, and weak areas.</CardDescription>
          </div>
          <Button variant="outline" onClick={load} disabled={busy}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-2xl border border-[rgba(180,35,24,.28)] bg-[rgba(180,35,24,.08)] px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}
          {!overview ? (
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] px-4 py-8 text-sm text-[color:var(--muted)]">
              Loading stats…
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Active problems" value={overview.active_problems} />
              <Metric label="Overdue" value={overview.overdue_count} hint="Should be near zero most days." />
              <Metric label="Due today" value={overview.due_today_count} />
              <Metric label="Due soon" value={overview.due_soon_count} hint="Next 3 days (excluding today)." />
              <Metric label="Reviews (7d)" value={overview.reviews_last_7_days} />
              <Metric label="Current streak" value={`${overview.current_streak_days}d`} hint="Days with at least one review." />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="pf-kicker">Topics</div>
            <CardTitle>Mastery by topic</CardTitle>
            <CardDescription>Based on reps, ease, and overdue penalty (v1).</CardDescription>
          </div>
          <Badge className="border-[rgba(16,24,40,.18)] bg-[rgba(16,24,40,.04)]">{topics.length} topics</Badge>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] px-4 py-8 text-sm text-[color:var(--muted)]">
              Add topics to problems to see breakdowns.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[color:var(--muted)]">
                    <th className="py-2 pr-4">Topic</th>
                    <th className="py-2 pr-4">Problems</th>
                    <th className="py-2 pr-4">Mastery avg</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t) => (
                    <tr
                      key={t.topic}
                      className="border-t border-[color:var(--line)] hover:bg-[color:var(--pf-surface-weak)] cursor-pointer"
                      onClick={async () => {
                        setActiveTopic(t.topic);
                        await ensureLibraryLoaded();
                        setTopicOpen(true);
                      }}
                      title="View problems in this topic"
                    >
                      <td className="py-3 pr-4">
                        <span className="pf-display font-semibold capitalize underline decoration-[rgba(45,212,191,.22)] underline-offset-4">
                          {t.topic}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[color:var(--muted)]">{t.count}</td>
                      <td className="py-3 pr-4">
                        <Badge className="border-[rgba(45,212,191,.28)] bg-[rgba(45,212,191,.10)]">
                          {t.mastery_avg}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={topicOpen} onOpenChange={setTopicOpen}>
        <DialogContent className="w-[min(860px,calc(100vw-28px))]">
          <DialogHeader>
            <DialogTitle>
              Topic: <span className="capitalize">{activeTopic || "…"}</span>
            </DialogTitle>
          </DialogHeader>
          {topicProblems.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] px-4 py-8 text-sm text-[color:var(--muted)]">
              No problems found for this topic.
            </div>
          ) : (
            <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
              {topicProblems.map(({ p, mastery }) => {
                const chip = dueChip(p.state?.due_at);
                return (
                  <div
                    key={p.id}
                    className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--pf-surface)] p-4 shadow-[0_12px_28px_rgba(16,24,40,.06)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-[240px]">
                        <div className="pf-display text-base font-semibold leading-tight">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline decoration-[rgba(45,212,191,.22)] underline-offset-4 hover:decoration-[rgba(45,212,191,.5)]"
                          >
                            {p.title || p.url}
                          </a>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
                          {p.platform ? <span>{p.platform}</span> : null}
                          {p.difficulty ? <span>• {p.difficulty}</span> : null}
                          {chip ? <Badge className={chip.tone}>{chip.label}</Badge> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge className="border-[rgba(16,24,40,.18)] bg-[rgba(16,24,40,.04)]">
                          mastery {Math.round(mastery)}
                        </Badge>
                        <Badge className="border-[rgba(16,24,40,.18)] bg-[rgba(16,24,40,.04)]">
                          reps {p.state?.reps ?? 0}
                        </Badge>
                        <Badge className="border-[rgba(16,24,40,.18)] bg-[rgba(16,24,40,.04)]">
                          ease {(p.state?.ease ?? 2.5).toFixed(2)}
                        </Badge>
                        <Badge className="border-[rgba(16,24,40,.18)] bg-[rgba(16,24,40,.04)]">
                          interval {p.state?.interval_days ?? 1}d
                        </Badge>
                        <Badge className="border-[rgba(16,24,40,.18)] bg-[rgba(16,24,40,.04)]">
                          last {(p.state as any)?.last_grade ?? "—"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
