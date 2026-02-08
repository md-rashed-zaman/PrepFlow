import { LoginForm } from "./login-form";

export default async function LoginPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) || {};
  const nextRaw = sp.next;
  const next = typeof nextRaw === "string" && nextRaw.trim() ? nextRaw : "/today";
  return <LoginForm nextPath={next} />;
}

