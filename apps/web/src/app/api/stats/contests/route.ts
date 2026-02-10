import { proxyJSON } from "@/lib/backend";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const windowDays = url.searchParams.get("window_days");
  const q = windowDays ? `?window_days=${encodeURIComponent(windowDays)}` : "";
  return proxyJSON({ method: "GET", path: `/api/v1/stats/contests${q}` });
}

