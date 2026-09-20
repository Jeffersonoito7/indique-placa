export const dynamic = "force-dynamic";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle2, ClipboardList } from "lucide-react";

export default async function GestorNotificacoesPage() {
  const gestor = await getGestorLogado();
  if (!gestor) redirect("/gestor/login");

  const gestorId = (gestor as { id: string }).id;

  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome")
    .eq("gestor_id", gestorId);

  const ids = (consultores ?? []).map((c) => c.id);

  type Lead = { id: string; placa: string | null; nome_lead: string | null; status: string; criado_em: string; consultor_id: string };
  let recentes: Lead[] = [];
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from("indicacoes")
      .select("id, placa, nome_lead, status, criado_em, consultor_id")
      .in("consultor_id", ids)
      .order("criado_em", { ascending: false })
      .limit(50);
    recentes = (data ?? []) as Lead[];
  }

  const nomeConsultor = (id: string) => consultores?.find((c) => c.id === id)?.nome ?? "—";

  const statusLabel: Record<string, { label: string; badgeCls: string; iconCls: string; iconBg: string }> = {
    novo:    { label: "Novo lead",    badgeCls: "bg-[#00c389]/15 text-[#007a54]",               iconCls: "text-[#00c389]", iconBg: "bg-[#00c389]/15" },
    contato: { label: "Em contato",  badgeCls: "bg-amber-500/15 text-amber-700 dark:text-amber-400",   iconCls: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-500/15" },
    fechado: { label: "Venda fechada", badgeCls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", iconCls: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-500/15" },
    perdido: { label: "Perdido",      badgeCls: "bg-red-500/15 text-red-700 dark:text-red-400",    iconCls: "text-red-600 dark:text-red-400", iconBg: "bg-red-500/15" },
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }} className="text-foreground">
          <Bell size={22} className="text-[#00c389]" />
          Notificacoes
        </h1>
        <p style={{ fontSize: 14 }} className="text-muted-foreground">Ultimas movimentacoes de leads do seu time.</p>
      </div>

      {recentes.length === 0 ? (
        <Card>
          <CardContent style={{ padding: "32px", textAlign: "center", fontSize: 14 }} className="text-muted-foreground">
            Nenhuma atividade registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recentes.map((l) => {
            const s = statusLabel[l.status] ?? { label: l.status, badgeCls: "bg-muted text-muted-foreground", iconCls: "text-muted-foreground", iconBg: "bg-muted" };
            return (
              <div key={l.id} className="bg-muted border border-border rounded-[10px] px-4 py-3 flex items-center gap-3.5">
                <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} className={s.iconBg}>
                  {l.status === "fechado" ? (
                    <CheckCircle2 size={16} className={s.iconCls} />
                  ) : (
                    <ClipboardList size={16} className={s.iconCls} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">
                    <strong className="text-foreground">{nomeConsultor(l.consultor_id)}</strong>
                    {" — "}{l.nome_lead ?? "Lead"}
                    {l.placa ? (
                      <span className="ml-1.5 font-mono text-xs font-bold bg-muted px-1 py-px rounded">
                        {l.placa}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }} className="text-muted-foreground">
                    {new Date(l.criado_em).toLocaleString("pt-BR")}
                  </div>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }} className={s.badgeCls}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
