export const dynamic = "force-dynamic";
import { getGestorLogado } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";

export default async function GestorRankingPage() {
  const gestor = await getGestorLogado();
  if (!gestor) redirect("/gestor/login");

  const gestorId = (gestor as { id: string }).id;

  const { data: consultores } = await supabaseAdmin
    .from("consultores")
    .select("id, nome")
    .eq("gestor_id", gestorId);

  const lista = consultores ?? [];
  const ids = lista.map((c) => c.id);

  type IndicacaoRow = { consultor_id: string; status: string; comissao_valor: number | null };
  let indicacoes: IndicacaoRow[] = [];
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from("indicacoes")
      .select("consultor_id, status, comissao_valor")
      .in("consultor_id", ids);
    indicacoes = (data ?? []) as IndicacaoRow[];
  }

  type RankItem = { id: string; nome: string; fechados: number; total: number; ganhos: number };
  const ranking: RankItem[] = lista
    .map((c) => {
      const meus = indicacoes.filter((i) => i.consultor_id === c.id);
      const fechados = meus.filter((i) => i.status === "fechado").length;
      const ganhos = meus
        .filter((i) => i.status === "fechado")
        .reduce((acc, i) => acc + (i.comissao_valor ?? 0), 0);
      return { id: c.id, nome: c.nome, fechados, total: meus.length, ganhos };
    })
    .sort((a, b) => b.fechados - a.fechados || b.total - a.total);

  const medalhas = ["1o", "2o", "3o"];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }} className="text-foreground">
          <Trophy size={22} className="text-amber-500" />
          Ranking do Time
        </h1>
        <p style={{ fontSize: 14 }} className="text-muted-foreground">Desempenho dos seus consultores por vendas fechadas.</p>
      </div>

      {ranking.length === 0 ? (
        <Card>
          <CardContent style={{ padding: "32px", textAlign: "center", fontSize: 14 }} className="text-muted-foreground">
            Nenhum consultor na equipe ainda.
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ranking.map((c, i) => (
            <Card key={c.id} style={{ border: i === 0 ? "1px solid rgba(245,158,11,.3)" : undefined }}>
              <CardContent style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}
                  className={
                    i === 0 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : i === 1 ? "bg-slate-400/10 text-muted-foreground"
                    : i === 2 ? "bg-amber-700/10 text-amber-700 dark:text-amber-600"
                    : "bg-muted text-muted-foreground"
                  }
                >
                  {i < 3 ? medalhas[i] : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }} className="text-foreground">{c.nome}</div>
                  <div style={{ fontSize: 12, marginTop: 2 }} className="text-muted-foreground">
                    {c.total} indicação{c.total !== 1 ? "es" : ""} recebida{c.total !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }} className="text-emerald-600 dark:text-emerald-400">{c.fechados}</div>
                  <div style={{ fontSize: 11 }} className="text-muted-foreground">fechados</div>
                </div>
                {c.ganhos > 0 && (
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }} className="text-emerald-600 dark:text-emerald-400">
                      {c.ganhos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <div style={{ fontSize: 11 }} className="text-muted-foreground">comissões</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
