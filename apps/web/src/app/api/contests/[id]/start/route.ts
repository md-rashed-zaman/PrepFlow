import type { NextRequest } from "next/server";

import { proxyJSON } from "@/lib/backend";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyJSON({ method: "POST", path: `/api/v1/contests/${encodeURIComponent(id)}/start` });
}

