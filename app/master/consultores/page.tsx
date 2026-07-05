export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

async function getConsultores() {
  const { data, count } = await supabaseAdmin
    .from("consultores")
    .select("id, nome, telefone, email, status, criado_em", { count: "exact" })
    .order("criado_em", { ascending: false });

  const ativos = data?.filter((c) => c.status === "ativo").length ?? 0;
  const inativos = data?.filter((c) => c.status !== "ativo").length ?? 0;

  return { lista: data ?? [], total: count ?? 0, ativos, inativos };
}

const statusStyle: Record<string, string> = {
  ativo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inativo: "bg-red-500/10 text-red-600 dark:text-red-400",
  pendente: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default async function ConsultoresPage() {
  const { lista, total, ativos, inativos } = await getConsultores();

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Consultores</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Gestao de consultores cadastrados na plataforma</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{total}</div>
                <div className="text-xs text-muted-foreground">Total cadastrados</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-emerald-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-500">{ativos}</div>
                <div className="text-xs text-muted-foreground">Ativos</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-red-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{inativos}</div>
                <div className="text-xs text-muted-foreground">Inativos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Lista de Consultores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum consultor cadastrado ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Telefone", "Email", "Status", "Cadastro"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c, i) => (
                    <tr key={c.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{c.nome}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{c.telefone ?? "-"}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">{c.email ?? "-"}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusStyle[c.status] ?? "bg-muted text-muted-foreground")}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
