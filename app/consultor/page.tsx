import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function ConsultorRoot() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("consultor_auth");
  if (auth?.value) redirect("/consultor/dashboard");
  redirect("/consultor/login");
}
