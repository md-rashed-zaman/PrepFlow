import { proxyJSON } from "@/lib/backend";

export async function GET() {
  return proxyJSON({ method: "GET", path: "/api/v1/stats/topics" });
}

