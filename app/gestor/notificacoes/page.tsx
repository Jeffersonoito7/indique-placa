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

  const statusLabel: Record<string, { label: string; cor: string; bg: string }> = {
    novo:    { label: "Novo lead",    cor: "#06b6d4", bg: "rgba(6,182,212,.15)" },
    contato: { label: "Em contato",  cor: "#f59e0b", bg: "rgba(245,158,11,.15)" },
    fechado: { label: "Venda fechada", cor: "#10b981", bg: "rgba(16,185,129,.15)" },
    perdido: { label: "Perdido",      cor: "#ef4444", bg: "rgba(239,68,68,.15)" },
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={22} style={{ color: "#06b6d4" }} />
          Notificacoes
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8" }}>Ultimas movimentacoes de leads do seu time.</p>
      </div>

      {recentes.length === 0 ? (
        <Card>
          <CardContent style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
            Nenhuma atividade registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recentes.map((l) => {
            const s = statusLabel[l.status] ?? { label: l.status, cor: "#94a3b8", bg: "rgba(255,255,255,.06)" };
            return (
              <div key={l.id} style={{
                background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", background: s.bg, flexShrink: 0,
                }}>
                  {l.status === "fechado" ? (
                    <CheckCircle2 size={16} style={{ color: s.cor }} />
                  ) : (
                    <ClipboardList size={16} style={{ color: s.cor }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>
                    <strong style={{ color: "#f1f5f9" }}>{nomeConsultor(l.consultor_id)}</strong>
                    {" — "}{l.nome_lead ?? "Lead"}
                    {l.placa ? (
                      <span style={{ marginLeft: 6, fontFamily: "monospace", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,.08)", padding: "1px 5px", borderRadius: 4 }}>
                        {l.placa}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {new Date(l.criado_em).toLocaleString("pt-BR")}
                  </div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: s.bg, color: s.cor, whiteSpace: "nowrap",
                }}>
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
