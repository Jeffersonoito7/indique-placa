"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Plus, X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Indicador = {
  id: string;
  nome: string;
  telefone: string | null;
  chave_pix: string | null;
  criado_em: string;
};

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function IndicadoresTable({ indicadores }: { indicadores: Indicador[] }) {
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
            <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {indicadores.map((ind, i) => (
          <tr key={ind.id} className={cn("border-b border-border hover:bg-accent/40 transition-colors", i % 2 !== 0 && "bg-muted/20")}>
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
                    {copiadoId === ind.id
                      ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                      : <Copy className="h-3.5 w-3.5" />
                    }
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

export default function ConsultorIndicadoresPage() {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState("");
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "" });

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/consultor/indicadores");
      if (res.ok) setIndicadores(await res.json());
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErroModal("");
    setEnviando(true);
    try {
      const res = await fetch("/api/consultor/indicadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, telefone: form.telefone.replace(/\D/g, "") }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErroModal(json.error ?? "Erro ao adicionar indicador");
      } else {
        setModalAberto(false);
        setForm({ nome: "", email: "", telefone: "", senha: "" });
        await carregar();
      }
    } catch {
      setErroModal("Erro de conexao.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Meus Indicadores</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Captadores vinculados a sua conta</p>
        </div>
        <button
          onClick={() => { setModalAberto(true); setErroModal(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Indicador
        </button>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <Card className="border-t-4 border-t-violet-500 shadow-sm mb-6 max-w-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-violet-500">{indicadores.length}</div>
              <div className="text-xs text-muted-foreground">Indicadores ativos</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Lista de Indicadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {carregando ? (
              <div className="text-center text-muted-foreground text-sm py-16">Carregando...</div>
            ) : indicadores.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-16">Nenhum indicador vinculado ainda</div>
            ) : (
              <IndicadoresTable indicadores={indicadores} />
            )}
          </CardContent>
        </Card>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Novo Indicador</h2>
              <button onClick={() => setModalAberto(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {erroModal && (
              <div className="mb-4 rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {erroModal}
              </div>
            )}

            <form onSubmit={adicionar} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                <input type="text" required placeholder="Nome completo" value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email (opcional)</label>
                <input type="text" inputMode="email" placeholder="email@exemplo.com" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</label>
                <input type="tel" required placeholder="(87) 99999-9999" value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: fmtTelBR(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Senha inicial</label>
                <input type="password" required minLength={6} placeholder="Minimo 6 caracteres" value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >Cancelar</button>
                <button type="submit" disabled={enviando}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >{enviando ? "Salvando..." : "Adicionar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
