"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Status = "novo" | "contato" | "fechado" | "perdido";

const OPCOES: { valor: Status; label: string; cor: string }[] = [
  { valor: "novo",    label: "Novo",    cor: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { valor: "contato", label: "Contato", cor: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { valor: "fechado", label: "Fechado", cor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { valor: "perdido", label: "Perdido", cor: "bg-red-500/15 text-red-400 border-red-500/30" },
];

export function StatusLead({
  leadId,
  statusInicial,
  endpoint,
}: {
  leadId: string;
  statusInicial: Status;
  endpoint: string; // ex: /api/consultor/lead ou /api/master/lead
}) {
  const [status, setStatus] = useState<Status>(statusInicial);
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState(false);

  const atual = OPCOES.find((o) => o.valor === status)!;

  const alterar = async (novo: Status) => {
    if (novo === status) { setAberto(false); return; }
    setSalvando(true);
    setAberto(false);
    try {
      await fetch(`${endpoint}/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novo }),
      });
      setStatus(novo);
    } catch {
      // silencioso — status visual reverte
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setAberto((v) => !v)}
        disabled={salvando}
        className={cn(
          "text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer",
          atual.cor,
          salvando && "opacity-50 cursor-not-allowed"
        )}
      >
        {salvando ? "..." : atual.label}
        {!salvando && (
          <svg className="inline ml-1 opacity-60" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        )}
      </button>

      {aberto && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setAberto(false)}
          />
          <div
            className="bg-card border border-border rounded-xl shadow-lg overflow-hidden"
            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50, minWidth: 140 }}
          >
            {OPCOES.map((o) => (
              <button
                key={o.valor}
                onClick={() => alterar(o.valor)}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors hover:bg-accent",
                  o.valor === status && "bg-accent"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full border", o.cor)} />
                {o.label}
                {o.valor === status && (
                  <svg className="ml-auto opacity-60" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
