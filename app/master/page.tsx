import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function MasterRoot() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("master_auth");
  if (auth?.value === "1") {
    redirect("/master/dashboard");
  }
  redirect("/master/login");
}
