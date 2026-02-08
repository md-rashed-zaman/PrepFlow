import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { REFRESH_COOKIE } from "@/lib/session";

export default async function Home() {
  const jar = await cookies();
  const hasSession = Boolean(jar.get(REFRESH_COOKIE)?.value);
  redirect(hasSession ? "/today" : "/login");
}
