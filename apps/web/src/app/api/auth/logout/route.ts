import { NextResponse } from "next/server";

import { apiBaseURL, clearAuthCookies, readTokensFromCookies } from "@/lib/backend";

export async function POST() {
  const { refreshToken } = await readTokensFromCookies();

  if (refreshToken) {
    // Best-effort; even if this fails we clear cookies locally.
    await fetch(apiBaseURL() + "/api/v1/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    }).catch(() => null);
  }

  const out = new NextResponse(null, { status: 204 });
  clearAuthCookies(out);
  return out;
}
