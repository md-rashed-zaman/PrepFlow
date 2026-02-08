import type { NextRequest } from "next/server";

import { proxyJSON } from "@/lib/backend";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as unknown;
  return proxyJSON({ method: "POST", path: "/api/v1/contests/generate", body });
}

