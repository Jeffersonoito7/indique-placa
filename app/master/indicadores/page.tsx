"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Indicador {
  id: string;
  nome: string;
  telefone: string | null;
  criado_em: string;
  consultores: { nome: string } | null;
}

export default function IndicadoresPage() {
  const [lista, setLista] = useState<Indicador[]>([]);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const carregar = async () => {
    const res = await fetch("/api/master/indicadores");
    if (res.ok) setLista(await res.json());
  };

  useEffect(() => { carregar(); }, []);

  const excluir = async (id: string, nome: string) => {
    if (!confirm(`Excluir o indicador "${nome}"? Esta ação não pode ser desfeita.`)) return;
    setExcluindo(id);
    const res = await fetch(`/api/master/indicador/${id}`, { method: "DELETE" });
    setExcluindo(null);
    if (!res.ok) {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir indicador.");
      return;
    }
    carregar();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Indicadores</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Captadores de leads vinculados aos consultores</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
          <Card className="border-t-4 border-t-violet-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-violet-500">{lista.length}</div>
                <div className="text-xs text-muted-foreground">Total cadastrados</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Lista de Indicadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum indicador cadastrado ainda</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Nome", "Telefone", "Consultor vinculado", "Cadastro", ""].map((h, i) => (
                      <th key={i} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((ind, i) => (
                    <tr key={ind.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{ind.nome}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{ind.telefone ?? "-"}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {ind.consultores?.nome ?? <span className="text-muted-foreground/50 italic">sem vínculo</span>}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">
                        {new Date(ind.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => excluir(ind.id, ind.nome)}
                          disabled={excluindo === ind.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          title="Excluir indicador"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
