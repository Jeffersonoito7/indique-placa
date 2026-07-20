export const dynamic = "force-dynamic";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

export default async function GestorComissoesPage() {
  const gestor = await getGestorLogado();
  if (!gestor) redirect("/gestor/login");

  const gestorId = (gestor as { id: string }).id;

  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome")
    .eq("gestor_id", gestorId);

  const ids = (consultores ?? []).map((c) => c.id);

  type Lead = {
    id: string;
    placa: string | null;
    nome_lead: string | null;
    status: string;
    comissao_valor: number | null;
    comissao_paga: boolean | null;
    criado_em: string;
    consultor_id: string;
  };
  let leads: Lead[] = [];
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from("indicacoes")
      .select("id, placa, nome_lead, status, comissao_valor, comissao_paga, criado_em, consultor_id")
      .in("consultor_id", ids)
      .eq("status", "fechado")
      .order("criado_em", { ascending: false })
      .limit(200);
    leads = (data ?? []) as Lead[];
  }

  const nomeConsultor = (id: string) => consultores?.find((c) => c.id === id)?.nome ?? "—";

  const totalGerado = leads.reduce((a, l) => a + (l.comissao_valor ?? 0), 0);
  const totalPago = leads.filter((l) => l.comissao_paga).reduce((a, l) => a + (l.comissao_valor ?? 0), 0);
  const totalPendente = totalGerado - totalPago;

  const statCards = [
    { label: "Total Gerado", valor: totalGerado, icon: TrendingUp, cor: "#06b6d4" },
    { label: "Ja Pago", valor: totalPago, icon: CheckCircle2, cor: "#10b981" },
    { label: "Pendente", valor: totalPendente, icon: Clock, cor: "#f59e0b" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <DollarSign size={22} style={{ color: "#10b981" }} />
          Comissoes do Time
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8" }}>Visao consolidada de todas as vendas fechadas pelos seus consultores.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <s.icon size={16} style={{ color: s.cor }} />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.label}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, color: s.cor }}>
                {s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 15 }}>Historico de vendas fechadas</CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          {leads.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: 14 }}>
              Nenhuma venda fechada ainda.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    {["Consultor", "Lead", "Placa", "Comissao", "Status", "Data"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                      <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>{nomeConsultor(l.consultor_id)}</td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{l.nome_lead ?? "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {l.placa ? (
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#f1f5f9", background: "rgba(255,255,255,.08)", padding: "2px 6px", borderRadius: 4 }}>
                            {l.placa}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 600 }}>
                        {l.comissao_valor ? l.comissao_valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: l.comissao_paga ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)",
                          color: l.comissao_paga ? "#10b981" : "#f59e0b",
                        }}>
                          {l.comissao_paga ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>
                        {new Date(l.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
