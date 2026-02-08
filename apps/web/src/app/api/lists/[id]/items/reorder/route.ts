import type { NextRequest } from "next/server";

import { proxyJSON } from "@/lib/backend";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as unknown;
  return proxyJSON({ method: "PATCH", path: `/api/v1/lists/${encodeURIComponent(id)}/items/reorder`, body });
}

