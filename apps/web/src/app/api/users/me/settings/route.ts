import type { NextRequest } from "next/server";

import { proxyJSON } from "@/lib/backend";

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as unknown;
  return proxyJSON({ method: "PATCH", path: "/api/v1/users/me/settings", body });
}

