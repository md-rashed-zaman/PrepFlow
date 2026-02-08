import type { NextRequest } from "next/server";

import { proxyJSON } from "@/lib/backend";

export async function GET() {
  return proxyJSON({ method: "GET", path: "/api/v1/problems/" });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as unknown;
  return proxyJSON({ method: "POST", path: "/api/v1/problems/", body });
}

