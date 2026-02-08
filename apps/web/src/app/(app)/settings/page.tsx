"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MeResponse } from "@/lib/types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function timeStr(hour: number, minute: number) {
  return `${pad2(hour)}:${pad2(minute)}`;
}

function parseTime(s: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

export default function SettingsPage() {
  const [me, setMe] = React.useState<MeResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [subscriptionURL, setSubscriptionURL] = React.useState<string | null>(null);

  const [timezone, setTimezone] = React.useState("");
  const [minInterval, setMinInterval] = React.useState("7");
  const [dueTime, setDueTime] = React.useState("09:00");

  const tzList = React.useMemo(() => {
    // Not available in all runtimes, but supported in modern browsers.
    // If missing, user can still type a TZ manually.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sup = (Intl as any).supportedValuesOf?.("timeZone") as string[] | undefined;
    return Array.isArray(sup) ? sup : [];
  }, []);

  async function load() {
    setError(null);
    const resp = await fetch("/api/auth/me", { cache: "no-store" });
    if (!resp.ok) {
      setError("Failed to load settings");
      return;
    }
    const data = (await resp.json()) as MeResponse;
    setMe(data);
    setTimezone(data.timezone);
    setMinInterval(String(data.min_interval_days));
    setDueTime(timeStr(data.due_hour_local, data.due_minute_local));
  }

  React.useEffect(() => {
    void load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = parseTime(dueTime);
    if (!t) {
      setError("Invalid due time");
      return;
    }
    const min = Number(minInterval);
    if (!Number.isFinite(min) || min < 1) {
      setError("min_interval_days must be >= 1");
      return;
    }

    setBusy(true);
    try {
      const resp = await fetch("/api/users/me/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          timezone: timezone.trim(),
          min_interval_days: min,
          due_hour_local: t.hh,
          due_minute_local: t.mm,
        }),
      });
      if (!resp.ok) {
        const msg = (await resp.json().catch(() => null))?.error || "Failed to save settings";
        setError(String(msg));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function rotateICS() {
    setError(null);
    setBusy(true);
    try {
      const resp = await fetch("/api/calendar/ics/rotate", { method: "POST" });
      if (!resp.ok) {
        setError("Failed to generate subscription URL");
        return;
      }
      const data = (await resp.json()) as { subscription_url: string };
      setSubscriptionURL(data.subscription_url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <div className="pf-kicker">Settings</div>
            <CardTitle>Schedule controls</CardTitle>
            <CardDescription>Set your timezone, minimum spacing, and daily reminder time.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-2xl border border-[rgba(180,35,24,.28)] bg-[rgba(180,35,24,.08)] px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}

          {me ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
              <span>User</span>
              <Badge>{me.user_id}</Badge>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={save}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tz">Timezone</Label>
                {tzList.length ? (
                  <select
                    id="tz"
                    className="h-11 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--pf-input-bg)] px-4 text-sm shadow-[var(--pf-input-shadow)] outline-none transition focus:border-[rgba(15,118,110,.5)] focus:ring-4 focus:ring-[rgba(15,118,110,.14)]"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    {tzList.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Dhaka" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="min">Minimum interval days</Label>
                <Input
                  id="min"
                  inputMode="numeric"
                  value={minInterval}
                  onChange={(e) => setMinInterval(e.target.value)}
                  placeholder="7"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="due">Daily notify time</Label>
                <Input id="due" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
                <div className="text-xs text-[color:var(--muted)]">
                  This anchors due dates and calendar events to your preferred time.
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" type="button" onClick={load}>
                Reset
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="pf-kicker">Google Calendar</div>
            <CardTitle>ICS subscription (free MVP)</CardTitle>
            <CardDescription>Subscribe once, then let Google Calendar handle reminders.</CardDescription>
          </div>
          <Button variant="outline" onClick={rotateICS} disabled={busy}>
            Generate link
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[color:var(--muted)]">
            Add by URL in Google Calendar: Settings → Add calendar → From URL.
          </div>
          {subscriptionURL ? (
            <div className="mt-3 space-y-2">
              <Label>Subscription URL</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={subscriptionURL} />
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(subscriptionURL)}
                >
                  Copy
                </Button>
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                Treat this link like a password. You can rotate it anytime to invalidate old links.
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] px-4 py-4 text-sm text-[color:var(--muted)]">
              Generate a subscription link to connect your schedule.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
