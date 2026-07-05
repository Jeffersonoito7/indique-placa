import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function IndicadorRoot() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("indicador_auth");
  if (auth?.value) redirect("/indicador/dashboard");
  redirect("/indicador/login");
}
