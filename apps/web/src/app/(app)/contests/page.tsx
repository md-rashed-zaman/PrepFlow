"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ContestWithItems } from "@/lib/types";

type Strategy = "balanced" | "weakness" | "due-heavy";

function fmtMMSS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function ContestsPage() {
  const [durationMinutes, setDurationMinutes] = React.useState("60");
  const [strategy, setStrategy] = React.useState<Strategy>("balanced");
  const [easy, setEasy] = React.useState("2");
  const [medium, setMedium] = React.useState("2");
  const [hard, setHard] = React.useState("1");

  const [contest, setContest] = React.useState<ContestWithItems | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [nowTick, setNowTick] = React.useState(0);

  const [gradeByID, setGradeByID] = React.useState<Record<string, number>>({});
  const [minutesByID, setMinutesByID] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNowTick(Date.now()), 750);
    return () => clearInterval(t);
  }, [startedAt]);

  async function generate() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const dm = Math.max(10, Number(durationMinutes) || 60);
      const mix = {
        easy: Math.max(0, Number(easy) || 0),
        medium: Math.max(0, Number(medium) || 0),
        hard: Math.max(0, Number(hard) || 0),
      };
      const resp = await fetch("/api/contests/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ duration_minutes: dm, strategy, difficulty_mix: mix }),
      });
      if (!resp.ok) {
        const msg = (await resp.text().catch(() => "")) || "";
        setError(msg.includes("no eligible") ? "No eligible problems found. Add problems first." : "Failed to generate contest");
        return;
      }
      const data = (await resp.json().catch(() => null)) as unknown;
      const c = data && typeof data === "object" ? (data as ContestWithItems) : null;
      setContest(c);
      setGradeByID({});
      setMinutesByID({});
      setStartedAt(null);
      setNotice("Contest generated. Start when ready.");
    } finally {
      setBusy(false);
    }
  }

  async function startContest() {
    if (!contest) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch(`/api/contests/${encodeURIComponent(contest.id)}/start`, { method: "POST" });
      if (!resp.ok) {
        setError("Failed to start contest");
        return;
      }
      const started = (await resp.json().catch(() => null)) as any;
      const ts = started?.started_at ? Date.parse(started.started_at) : Date.now();
      setStartedAt(Number.isFinite(ts) ? ts : Date.now());
      setNotice("Timer started.");
    } finally {
      setBusy(false);
    }
  }

  async function completeContest() {
    if (!contest) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch(`/api/contests/${encodeURIComponent(contest.id)}/complete`, { method: "POST" });
      if (!resp.ok) {
        setError("Failed to mark contest complete");
        return;
      }
      setNotice("Marked complete. Submit results to update scheduling.");
    } finally {
      setBusy(false);
    }
  }

  async function submitResults() {
    if (!contest) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const results = contest.items.map((it) => {
        const grade = gradeByID[it.problem.id];
        const rawMin = (minutesByID[it.problem.id] || "").trim();
        const min = rawMin ? Number(rawMin) : 0;
        const timeSpentSec = Number.isFinite(min) && min > 0 ? Math.round(min * 60) : undefined;
        return {
          problem_id: it.problem.id,
          grade: typeof grade === "number" ? grade : 2,
          ...(timeSpentSec ? { time_spent_sec: timeSpentSec } : {}),
        };
      });
      const resp = await fetch(`/api/contests/${encodeURIComponent(contest.id)}/results`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ results }),
      });
      if (!resp.ok) {
        setError("Failed to submit results");
        return;
      }
      setNotice("Results saved. Your schedule has been updated.");
    } finally {
      setBusy(false);
    }
  }

  const elapsed = startedAt ? Date.now() - startedAt : 0;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <div className="pf-kicker">Contests</div>
            <CardTitle>Timed sessions</CardTitle>
            <CardDescription>Generate a focused set, practice externally, then log results.</CardDescription>
          </div>
          <Button variant="outline" onClick={generate} disabled={busy}>
            Generate
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-2xl border border-[rgba(180,35,24,.28)] bg-[rgba(180,35,24,.08)] px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-2xl border border-[rgba(15,118,110,.28)] bg-[rgba(15,118,110,.08)] px-4 py-3 text-sm">
              {notice}
            </div>
          ) : null}

          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] p-4">
              <div className="text-xs text-[color:var(--muted)]">Duration (minutes)</div>
              <Input
                className="mt-2 rounded-full"
                inputMode="numeric"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] p-4">
              <div className="text-xs text-[color:var(--muted)]">Strategy</div>
              <select
                className="mt-2 h-10 w-full rounded-full border border-[color:var(--line)] bg-[color:var(--pf-input-bg)] px-4 text-sm outline-none focus:ring-4 focus:ring-[rgba(15,118,110,.2)]"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as Strategy)}
              >
                <option value="balanced">Balanced</option>
                <option value="weakness">Weakness-focused</option>
                <option value="due-heavy">Due-heavy</option>
              </select>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] p-4">
              <div className="text-xs text-[color:var(--muted)]">Easy</div>
              <Input className="mt-2 rounded-full" inputMode="numeric" value={easy} onChange={(e) => setEasy(e.target.value)} />
            </div>
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] p-4">
              <div className="text-xs text-[color:var(--muted)]">Medium</div>
              <Input
                className="mt-2 rounded-full"
                inputMode="numeric"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
              />
            </div>
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] p-4">
              <div className="text-xs text-[color:var(--muted)]">Hard</div>
              <Input className="mt-2 rounded-full" inputMode="numeric" value={hard} onChange={(e) => setHard(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="pf-kicker">Session</div>
            <CardTitle>{contest ? "Your contest" : "No contest yet"}</CardTitle>
            <CardDescription>
              {contest ? (
                <span>
                  {contest.items.length} problems • {contest.duration_minutes} minutes
                </span>
              ) : (
                "Generate a contest to get a curated set."
              )}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-[rgba(16,24,40,.18)] bg-[rgba(16,24,40,.04)]">
              Timer: {startedAt ? fmtMMSS(elapsed) : "00:00"}
            </Badge>
            <Button variant="outline" onClick={startContest} disabled={busy || !contest || Boolean(startedAt)}>
              Start
            </Button>
            <Button variant="outline" onClick={completeContest} disabled={busy || !contest}>
              Complete
            </Button>
            <Button onClick={submitResults} disabled={busy || !contest}>
              Submit results
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!contest ? (
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] px-4 py-8 text-sm text-[color:var(--muted)]">
              Generate a contest to see problems here.
            </div>
          ) : (
            <div className="space-y-2">
              {contest.items.map((it, idx) => {
                const g = gradeByID[it.problem.id];
                return (
                  <div
                    key={it.problem.id}
                    className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--pf-surface)] p-4 shadow-[0_12px_28px_rgba(16,24,40,.06)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-[240px]">
                        <div className="pf-display text-base font-semibold leading-tight">
                          <span className="mr-2 text-[color:var(--muted)]">#{idx + 1}</span>
                          <a
                            href={it.problem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline decoration-[rgba(15,118,110,.28)] underline-offset-4 hover:decoration-[rgba(15,118,110,.55)]"
                          >
                            {it.problem.title || it.problem.url}
                          </a>
                        </div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {it.problem.platform ? <span>{it.problem.platform}</span> : null}
                          {it.problem.difficulty ? <span> • {it.problem.difficulty}</span> : null}
                          {it.target_minutes ? <span> • target {it.target_minutes}m</span> : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          className="h-9 w-[92px] rounded-full"
                          inputMode="decimal"
                          placeholder="min"
                          value={minutesByID[it.problem.id] || ""}
                          onChange={(e) =>
                            setMinutesByID((m) => ({
                              ...m,
                              [it.problem.id]: e.target.value,
                            }))
                          }
                          title="Optional time spent (minutes)"
                        />
                        {[0, 1, 2, 3, 4].map((x) => (
                          <Button
                            key={x}
                            size="sm"
                            variant={x >= 3 ? "primary" : x === 2 ? "outline" : "secondary"}
                            onClick={() => setGradeByID((m) => ({ ...m, [it.problem.id]: x }))}
                            disabled={busy}
                            title={`Grade ${x}`}
                            className={g === x ? "ring-4 ring-[rgba(15,118,110,.18)]" : ""}
                          >
                            {x}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
