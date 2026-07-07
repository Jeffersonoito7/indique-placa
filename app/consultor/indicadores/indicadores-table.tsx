"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Indicador = {
  id: string;
  nome: string;
  telefone: string | null;
  chave_pix: string | null;
  criado_em: string;
};

export function IndicadoresTable({ indicadores }: { indicadores: Indicador[] }) {
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  function copiarPix(id: string, valor: string) {
    navigator.clipboard.writeText(valor).then(() => {
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    });
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          {["Nome", "Telefone", "Chave PIX", "Cadastrado em"].map((h) => (
            <th
              key={h}
              className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {indicadores.map((ind, i) => (
          <tr
            key={ind.id}
            className={cn(
              "border-b border-border hover:bg-accent/40 transition-colors",
              i % 2 !== 0 && "bg-muted/20"
            )}
          >
            <td className="px-6 py-3.5 text-sm font-medium text-foreground">{ind.nome}</td>
            <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">{ind.telefone ?? "-"}</td>
            <td className="px-6 py-3.5 text-sm">
              {ind.chave_pix ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground">{ind.chave_pix}</span>
                  <button
                    onClick={() => copiarPix(ind.id, ind.chave_pix!)}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copiar chave PIX"
                  >
                    {copiadoId === ind.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="italic text-muted-foreground text-xs">nao cadastrada</span>
              )}
            </td>
            <td className="px-6 py-3.5 text-xs text-muted-foreground">
              {new Date(ind.criado_em).toLocaleDateString("pt-BR")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
