export const dynamic = "force-dynamic";
import { getAssociacaoLogada } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, UserCheck } from "lucide-react";

export default async function AssociacaoDashboardPage() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) redirect("/associacao/login");

  const [{ count: totalGestores }, { count: totalConsultores }] = await Promise.all([
    supabaseAdmin.from("gestores").select("id", { count: "exact", head: true }).eq("associacao_id", assoc.id),
    supabaseAdmin.from("consultores").select("id", { count: "exact", head: true }).eq("associacao_id", assoc.id),
  ]);

  // Indicadores via consultores da associacao
  const { data: consultoresIds } = await supabaseAdmin
    .from("consultores")
    .select("id")
    .eq("associacao_id", assoc.id);

  const ids = (consultoresIds ?? []).map((c) => c.id);
  let totalIndicadores = 0;
  if (ids.length > 0) {
    const { count } = await supabaseAdmin
      .from("indicadores")
      .select("id", { count: "exact", head: true })
      .in("consultor_id", ids);
    totalIndicadores = count ?? 0;
  }

  const cards = [
    { label: "Gestores", value: totalGestores ?? 0, icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-t-indigo-500" },
    { label: "Consultores", value: totalConsultores ?? 0, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-t-violet-500" },
    { label: "Indicadores", value: totalIndicadores, icon: UserCheck, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-t-purple-500" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Dashboard</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Visao geral da associacao {assoc.nome}</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
          {cards.map((c) => (
            <Card key={c.label} className={`border-t-4 ${c.border} shadow-sm`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
