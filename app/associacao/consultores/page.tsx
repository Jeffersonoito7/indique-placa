"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Consultor = {
  id: string;
  nome: string;
  email: string;
  fone: string;
  status: string;
  plano: string | null;
  gestor_id: string | null;
  criado_em: string;
};

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export default function AssociacaoConsultoresPage() {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState("");
  const [form, setForm] = useState({ nome: "", email: "", fone: "", senha: "" });

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/associacao/consultores");
      if (res.ok) setConsultores(await res.json());
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  const filtrados = consultores.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  );

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErroModal("");
    setEnviando(true);
    try {
      const res = await fetch("/api/associacao/consultores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fone: form.fone.replace(/\D/g, "") }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErroModal(json.error ?? "Erro ao adicionar consultor");
      } else {
        setModalAberto(false);
        setForm({ nome: "", email: "", fone: "", senha: "" });
        await carregar();
      }
    } catch {
      setErroModal("Erro de conexao.");
    } finally {
      setEnviando(false);
    }
  }

  async function toggleStatus(c: Consultor) {
    await fetch(`/api/associacao/consultores/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: c.status === "ativo" ? "inativo" : "ativo" }),
    });
    await carregar();
  }

  async function inativar(c: Consultor) {
    if (!confirm(`Inativar e desvincular ${c.nome}?`)) return;
    await fetch(`/api/associacao/consultores/${c.id}`, { method: "DELETE" });
    await carregar();
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Consultores</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Gerencie os consultores da associacao</p>
        </div>
        <button
          onClick={() => { setModalAberto(true); setErroModal(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar Consultor
        </button>
      </div>

      <div className="flex-1 p-8 bg-muted/30 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Consultores ({filtrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {carregando ? (
              <div className="text-center text-muted-foreground text-sm py-10">Carregando...</div>
            ) : filtrados.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-10">
                {busca ? "Nenhum resultado." : "Nenhum consultor cadastrado."}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Consultor", "Contato", "Plano", "Status", "Acoes"].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c, i) => (
                    <tr key={c.id} className={cn(
                      "border-b border-border transition-colors hover:bg-accent/40",
                      i % 2 !== 0 && "bg-muted/20"
                    )}>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-foreground">{c.nome}</div>
                        <div className="text-[11px] text-muted-foreground">{c.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {c.fone ? fmtTelBR(c.fone) : <span className="italic text-muted-foreground/50">sem fone</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          c.plano === "pro"
                            ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                            : "bg-muted text-muted-foreground border border-border"
                        )}>
                          {c.plano ?? "free"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                          c.status === "ativo"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        )}>
                          {c.status === "ativo" ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(c)}
                            className={cn(
                              "text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                              c.status === "ativo"
                                ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
                                : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                            )}
                          >
                            {c.status === "ativo" ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => inativar(c)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                          >
                            Inativar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Adicionar Consultor</h2>
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
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <input type="email" required placeholder="email@exemplo.com" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</label>
                <input type="tel" required placeholder="(87) 99999-9999" value={form.fone}
                  onChange={(e) => setForm((f) => ({ ...f, fone: fmtTelBR(e.target.value) }))}
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
