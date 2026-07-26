export const dynamic = "force-dynamic";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import GestorCapturaClient from "./client";

export default async function GestorCapturaPage() {
  const gestor = await getGestorLogado();
  if (!gestor) redirect("/gestor/login");

  const { data: planoConfig } = await supabaseAdmin
    .from("planos_config_gestor")
    .select("link_captura_proprio")
    .eq("plano", (gestor as { plano?: string }).plano ?? "free")
    .maybeSingle();

  if (!planoConfig?.link_captura_proprio) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-base font-bold text-foreground mb-2">Link de Captura nao disponivel</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          O Link de Captura proprio nao esta incluido no seu plano atual.
          Entre em contato com o administrador para solicitar upgrade.
        </p>
      </div>
    );
  }

  return (
    <GestorCapturaClient
      gestorId={(gestor as { id: string }).id}
      nomeGestor={(gestor as { nome: string }).nome}
    />
  );
}
