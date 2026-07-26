"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Search, X, ArrowRightLeft, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Consultor = {
  id: string;
  nome: string;
  email: string;
  fone: string;
  status: string;
  plano: string | null;
  plano_ativo_ate: string | null;
  criado_em: string;
  leads: number;
  fechados: number;
};

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

function taxaConversao(c: Consultor) {
  return c.leads > 0 ? Math.round((c.fechados / c.leads) * 100) : 0;
}

function BadgeTaxa({ c }: { c: Consultor }) {
  const taxa = taxaConversao(c);
  if (c.leads === 0) {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">Sem leads</span>;
  }
  if (taxa >= 25) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <TrendingUp className="w-3 h-3" />{taxa}%
      </span>
    );
  }
  if (taxa >= 10) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
        {taxa}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
      <TrendingDown className="w-3 h-3" />{taxa}%
    </span>
  );
}

function ModalTransferir({
  origem,
  consultores,
  onClose,
  onFeito,
}: {
  origem: Consultor;
  consultores: Consultor[];
  onClose: () => void;
  onFeito: (n: number) => void;
}) {
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const destinosDisponiveis = consultores.filter((c) => c.id !== origem.id && c.status === "ativo");
  const leadsAbertos = origem.leads - origem.fechados;

  async function confirmar() {
    if (!destino) { setErro("Selecione o consultor de destino."); return; }
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/gestor/leads/transferir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultor_origem_id: origem.id, consultor_destino_id: destino, motivo }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao transferir"); return; }
      onFeito(json.transferidos ?? 0);
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
            Transferir leads em aberto
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
          <div className="font-semibold text-amber-500 mb-0.5">Consultor de origem</div>
          <div className="text-foreground">{origem.nome}</div>
          <div className="text-muted-foreground text-xs mt-1">
            {leadsAbertos} lead{leadsAbertos !== 1 ? "s" : ""} em aberto serao transferidos (fechados sao mantidos)
          </div>
        </div>

        {erro && (
          <div className="mb-4 rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{erro}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Transferir para</label>
            {destinosDisponiveis.length === 0 ? (
              <div className="mt-1 p-3 rounded-xl border border-border text-sm text-muted-foreground text-center">
                Nenhum outro consultor ativo no time.
              </div>
            ) : (
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Selecione o consultor destino</option>
                {destinosDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.leads} leads, {c.fechados} fechados)</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Motivo (opcional)</label>
            <input
              type="text"
              placeholder="Ex: consultor saiu da empresa"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={enviando || destinosDisponiveis.length === 0 || leadsAbertos === 0}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold transition-colors"
          >
            {enviando ? "Transferindo..." : `Transferir ${leadsAbertos} lead${leadsAbertos !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestorConsultoresPage() {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");
  const [transferindo, setTransferindo] = useState<Consultor | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", fone: "", senha: "" });

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/gestor/consultores");
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

  // Consultores com desempenho baixo: ativo, com leads, conversao < 10%
  const alertaBaixoDesempenho = consultores.filter(
    (c) => c.status === "ativo" && c.leads >= 3 && taxaConversao(c) < 10
  );

  async function adicionarConsultor(e: React.FormEvent) {
    e.preventDefault();
    setErroModal("");
    setEnviando(true);
    try {
      const res = await fetch("/api/gestor/consultores", {
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
    setErroAcao("");
    setSucessoMsg("");
    const novoStatus = c.status === "ativo" ? "inativo" : "ativo";
    try {
      const res = await fetch(`/api/gestor/consultores/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (res.ok) await carregar();
      else setErroAcao("Erro ao atualizar status. Tente novamente.");
    } catch {
      setErroAcao("Erro de conexao. Tente novamente.");
    }
  }

  async function removerDoTime(c: Consultor) {
    if (!confirm(`Remover ${c.nome} do seu time? O consultor nao sera excluido.`)) return;
    setErroAcao("");
    setSucessoMsg("");
    try {
      const res = await fetch(`/api/gestor/consultores/${c.id}`, { method: "DELETE" });
      if (res.ok) await carregar();
      else setErroAcao("Erro ao remover consultor. Tente novamente.");
    } catch {
      setErroAcao("Erro de conexao. Tente novamente.");
    }
  }

  function onTransferido(n: number) {
    setTransferindo(null);
    setSucessoMsg(
      n > 0
        ? `${n} lead${n !== 1 ? "s" : ""} transferido${n !== 1 ? "s" : ""} com sucesso.`
        : "Nenhum lead em aberto para transferir."
    );
    carregar();
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Meu Time</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Gerencie os consultores da sua equipe</p>
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

        {/* Alerta de baixo desempenho */}
        {alertaBaixoDesempenho.length > 0 && (
          <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-500 mb-1">
                {alertaBaixoDesempenho.length} consultor{alertaBaixoDesempenho.length > 1 ? "es" : ""} com baixo desempenho
              </div>
              <div className="text-xs text-muted-foreground">
                {alertaBaixoDesempenho.map((c) => c.nome).join(", ")} — conversao abaixo de 10%.
                Considere transferir os leads para outro consultor.
              </div>
            </div>
          </div>
        )}

        {erroAcao && (
          <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{erroAcao}</div>
        )}
        {sucessoMsg && (
          <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm">{sucessoMsg}</div>
        )}

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
                {busca ? "Nenhum resultado para a busca." : "Nenhum consultor no time ainda."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Consultor", "Contato", "Status", "Leads", "Fechamentos", "Conversao", "Acoes"].map((h) => (
                        <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((c, i) => {
                      const baixoDesempenho = c.status === "ativo" && c.leads >= 3 && taxaConversao(c) < 10;
                      return (
                        <tr key={c.id} className={cn(
                          "border-b border-border transition-colors hover:bg-accent/40",
                          i % 2 !== 0 && "bg-muted/20",
                          baixoDesempenho && "bg-amber-500/5"
                        )}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {baixoDesempenho && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                              <div>
                                <div className="text-sm font-semibold text-foreground">{c.nome}</div>
                                <div className="text-[11px] text-muted-foreground">{c.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-muted-foreground">
                            {c.fone ? fmtTelBR(c.fone) : <span className="italic text-muted-foreground/50">sem fone</span>}
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
                          <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.leads}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-bold text-emerald-500">{c.fechados}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <BadgeTaxa c={c} />
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => toggleStatus(c)}
                                className={cn(
                                  "text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors",
                                  c.status === "ativo"
                                    ? "border-red-500/30 text-red-500 hover:bg-red-500/10"
                                    : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                )}
                              >
                                {c.status === "ativo" ? "Desativar" : "Ativar"}
                              </button>
                              <button
                                onClick={() => { setTransferindo(c); setErroAcao(""); setSucessoMsg(""); }}
                                title="Transferir leads em aberto para outro consultor"
                                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-colors flex items-center gap-1"
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                                Transferir
                              </button>
                              <button
                                onClick={() => removerDoTime(c)}
                                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                              >
                                Remover
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal adicionar consultor */}
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

            <form onSubmit={adicionarConsultor} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</label>
                <input
                  type="tel"
                  required
                  placeholder="(87) 99999-9999"
                  value={form.fone}
                  onChange={(e) => setForm((f) => ({ ...f, fone: fmtTelBR(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Senha inicial</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  {enviando ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal transferir leads */}
      {transferindo && (
        <ModalTransferir
          origem={transferindo}
          consultores={consultores}
          onClose={() => setTransferindo(null)}
          onFeito={onTransferido}
        />
      )}
    </div>
  );
}
