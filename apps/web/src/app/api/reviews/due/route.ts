import type { NextRequest } from "next/server";

import { proxyJSON } from "@/lib/backend";

export async function GET(req: NextRequest) {
  const windowDays = req.nextUrl.searchParams.get("window_days");
  const q = windowDays ? `?window_days=${encodeURIComponent(windowDays)}` : "";
  return proxyJSON({ method: "GET", path: `/api/v1/reviews/due${q}` });
}

