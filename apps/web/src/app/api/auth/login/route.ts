import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { apiBaseURL, setAuthCookies, type TokenPair } from "@/lib/backend";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const resp = await fetch(apiBaseURL() + "/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    const contentType = resp.headers.get("content-type") || "";
    return contentType.includes("application/json")
      ? NextResponse.json(text ? JSON.parse(text) : { error: "login failed" }, { status: resp.status })
      : new NextResponse(text || "login failed", { status: resp.status });
  }

  const tokens = (await resp.json()) as TokenPair;
  const out = new NextResponse(null, { status: 204 });
  setAuthCookies(out, tokens);
  return out;
}

