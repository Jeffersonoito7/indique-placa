"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, CheckCircle2, Clock, Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlacaMercosul } from "@/components/placa-mercosul";
import PushSubscribeIndicador from "@/components/push-subscribe-indicador";
import { OnboardingIndicador } from "@/components/onboarding-indicador";

type Lead = {
  id: string;
  placa: string | null;
  nome_lead: string | null;
  status: string;
  criado_em: string;
};

type Meta = {
  id: string;
  nome: string;
  tipo_veiculo: string;
  quantidade_indicacoes: number;
  bonus_valor: number;
  progresso: number;
};

type DashboardData = {
  indicador: { id: string; nome: string };
  total: number;
  fechados: number;
  leads: Lead[];
  metas: Meta[];
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  novo: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", label: "Novo" },
  contato: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", label: "Em contato" },
  fechado: { bg: "rgba(16,185,129,0.12)", text: "#10b981", label: "Fechado" },
  perdido: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", label: "Perdido" },
};

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function IndicadorDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/indicador/dashboard")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/indicador/login");
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
          color: "rgba(var(--muted-foreground))",
          fontSize: 14,
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!data) return null;

  const { indicador, total, fechados, leads, metas } = data;
  const emAndamento = total - fechados;
  const primeiroNome = indicador.nome.split(" ")[0];

  return (
    <div style={{ minHeight: "100%", background: "var(--background)" }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 12px" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2 }}>
          Ola, {primeiroNome}!
        </div>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
          Suas indicacoes
        </div>
        <div style={{ marginTop: 10 }}>
          <PushSubscribeIndicador />
        </div>
      </div>

      {/* Onboarding para indicadores sem indicacoes */}
      <OnboardingIndicador totalIndicacoes={total} />

      {/* Cards de stats: 2 por linha */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "0 16px 16px",
        }}
      >
        {/* Total */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 16,
            padding: 16,
            borderTop: "3px solid #f59e0b",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
            Total indicados
          </div>
        </div>

        {/* Fechados */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 16,
            padding: 16,
            borderTop: "3px solid #10b981",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: "#10b981", lineHeight: 1 }}>
            {fechados}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
            Fechados
          </div>
        </div>

        {/* Em andamento - linha inteira */}
        <div
          style={{
            gridColumn: "1 / -1",
            background: "var(--card)",
            borderRadius: 16,
            padding: 16,
            borderTop: "3px solid #3b82f6",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6", lineHeight: 1 }}>
            {emAndamento}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
            Em andamento
          </div>
        </div>
      </div>

      {/* CTA nova indicacao */}
      <div style={{ padding: "0 16px 16px" }}>
        <Link
          href="/indicador/indicar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "#10b981",
            color: "#fff",
            borderRadius: 16,
            padding: "16px 0",
            fontSize: 16,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
          }}
        >
          <Plus size={20} />
          Nova Indicacao
        </Link>
      </div>

      {/* Metas */}
      <div style={{ padding: "0 16px 16px" }}>
        {metas.length === 0 ? (
          <div
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 14,
              padding: 16,
              fontSize: 13,
              color: "#f59e0b",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={16} />
              Nenhuma meta ativa
            </div>
            <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
              Converse com seu consultor para definir metas e ganhar bonus!
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "var(--card)",
              borderRadius: 14,
              padding: "14px 16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Target size={15} style={{ color: "#f59e0b" }} />
              Suas Metas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {metas.map((m) => {
                const pct = Math.min(100, Math.round((m.progresso / m.quantidade_indicacoes) * 100));
                const batida = m.progresso >= m.quantidade_indicacoes;
                const quase = !batida && pct >= 80;
                const barColor = batida ? "#10b981" : quase ? "#f59e0b" : "#3b82f6";
                return (
                  <div key={m.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{m.nome}</span>
                      {batida ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(16,185,129,0.12)", color: "#10b981", textTransform: "uppercase" }}>Meta batida</span>
                      ) : quase ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(245,158,11,0.12)", color: "#f59e0b", textTransform: "uppercase" }}>Quase la!</span>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--muted)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 99, transition: "width 0.4s ease" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {m.progresso}/{m.quantidade_indicacoes}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3 }}>
                      Bonus: <span style={{ fontWeight: 700, color: "#10b981" }}>{moeda(m.bonus_valor)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Ultimas indicacoes */}
      <div style={{ padding: "0 16px 32px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 10 }}>
          Ultimas Indicacoes
        </div>
        {leads.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted-foreground)", textAlign: "center", padding: "24px 0" }}>
            Voce ainda nao fez nenhuma indicacao.{" "}
            <Link href="/indicador/indicar" style={{ color: "#f59e0b", fontWeight: 600 }}>
              Indicar agora
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leads.map((lead) => {
              const st = STATUS_STYLE[lead.status] ?? { bg: "rgba(100,100,100,0.1)", text: "var(--muted-foreground)", label: lead.status };
              const data = new Date(lead.criado_em).toLocaleDateString("pt-BR");
              return (
                <div
                  key={lead.id}
                  style={{
                    background: "var(--card)",
                    borderRadius: 12,
                    padding: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      {lead.placa ? (
                        <PlacaMercosul placa={lead.placa} tamanho="sm" />
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>sem placa</span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: st.bg,
                        color: st.text,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: lead.nome_lead ? "var(--foreground)" : "var(--muted-foreground)", fontStyle: lead.nome_lead ? "normal" : "italic" }}>
                      {lead.nome_lead ?? "Proprietario a confirmar"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{data}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
