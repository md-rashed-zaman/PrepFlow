import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { apiBaseURL, proxyJSON } from "@/lib/backend";

export async function POST(req: NextRequest) {
  // Use proxy helper for refresh-on-401, then rewrite the subscription URL so it points at
  // the frontend proxy route (/ics) instead of the raw API host.
  const proxied = await proxyJSON({ method: "POST", path: "/api/v1/integrations/calendar/ics/rotate" });
  if (!proxied.ok) return proxied;

  const data = (await proxied.json().catch(() => null)) as { subscription_url?: string } | null;
  const backendURL = data?.subscription_url || "";

  try {
    const u = new URL(backendURL);
    const token = u.searchParams.get("token") || "";
    if (!token) throw new Error("missing token");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const origin = host ? `${proto}://${host}` : req.nextUrl.origin;
    const local = `${origin}/ics?token=${encodeURIComponent(token)}`;
    const out = NextResponse.json({ subscription_url: local }, { status: 200 });
    // Preserve any Set-Cookie headers applied by proxyJSON (on refresh).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyHeaders = proxied.headers as any;
    const cookies = typeof anyHeaders.getSetCookie === "function" ? anyHeaders.getSetCookie() : [];
    const single = proxied.headers.get("set-cookie");
    if (single) cookies.push(single);
    for (const c of cookies) out.headers.append("set-cookie", c);
    return out;
  } catch {
    // Fall back to whatever the API returned.
    return NextResponse.json({ subscription_url: backendURL || apiBaseURL() + "/api/v1/integrations/calendar/ics" }, { status: 200 });
  }
}
