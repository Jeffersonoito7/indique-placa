"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Plus, ArrowRight, Trash2, Copy, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type MeuIndicador = {
  id: string;
  nome: string;
  telefone: string;
  chave_pix: string | null;
  criado_em: string;
};

type Consultor = {
  id: string;
  nome: string;
  email: string;
  status: string;
};

type IndicadorConsultor = {
  id: string;
  nome: string;
  telefone: string;
  criado_em: string;
};

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export default function MeusIndicadoresPage() {
  const [indicadores, setIndicadores] = useState<MeuIndicador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [pixCopiado, setPixCopiado] = useState<string | null>(null);

  // Modal adicionar
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [formAdicionar, setFormAdicionar] = useState({ nome: "", telefone: "", email: "", senha: "" });
  const [enviandoAdicionar, setEnviandoAdicionar] = useState(false);
  const [erroAdicionar, setErroAdicionar] = useState("");

  // Modal mover de consultor
  const [modalMover, setModalMover] = useState(false);
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [buscaConsultor, setBuscaConsultor] = useState("");
  const [consultorSelecionado, setConsultorSelecionado] = useState<Consultor | null>(null);
  const [indicadoresConsultor, setIndicadoresConsultor] = useState<IndicadorConsultor[]>([]);
  const [carregandoIndicadoresConsultor, setCarregandoIndicadoresConsultor] = useState(false);
  const [adotando, setAdotando] = useState<string | null>(null);
  const [erroMover, setErroMover] = useState("");

  // Deletar
  const [deletarId, setDeletarId] = useState<string | null>(null);
  const [deletando, setDeletando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/gestor/meus-indicadores");
      if (res.ok) setIndicadores(await res.json());
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function copiarPix(pix: string, id: string) {
    navigator.clipboard.writeText(pix).then(() => {
      setPixCopiado(id);
      setTimeout(() => setPixCopiado(null), 2000);
    });
  }

  // --- Modal Adicionar ---

  async function adicionarIndicador(e: React.FormEvent) {
    e.preventDefault();
    setErroAdicionar("");
    setEnviandoAdicionar(true);
    try {
      const res = await fetch("/api/gestor/meus-indicadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formAdicionar,
          telefone: formAdicionar.telefone.replace(/\D/g, ""),
          email: formAdicionar.email || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErroAdicionar(json.error ?? "Erro ao adicionar indicador");
      } else {
        setModalAdicionar(false);
        setFormAdicionar({ nome: "", telefone: "", email: "", senha: "" });
        await carregar();
      }
    } catch {
      setErroAdicionar("Erro de conexao.");
    } finally {
      setEnviandoAdicionar(false);
    }
  }

  // --- Modal Mover ---

  async function abrirModalMover() {
    setModalMover(true);
    setErroMover("");
    setBuscaConsultor("");
    setConsultorSelecionado(null);
    setIndicadoresConsultor([]);
    try {
      const res = await fetch("/api/gestor/consultores");
      if (res.ok) {
        const todos: Consultor[] = await res.json();
        setConsultores(todos.filter((c) => c.status === "inativo"));
      }
    } catch {
      setErroMover("Erro ao carregar consultores.");
    }
  }

  async function selecionarConsultor(consultor: Consultor) {
    setConsultorSelecionado(consultor);
    setIndicadoresConsultor([]);
    setCarregandoIndicadoresConsultor(true);
    setErroMover("");
    try {
      const res = await fetch(`/api/gestor/indicadores?consultor_id=${consultor.id}`);
      if (res.ok) setIndicadoresConsultor(await res.json());
    } catch {
      setErroMover("Erro ao carregar indicadores do consultor.");
    } finally {
      setCarregandoIndicadoresConsultor(false);
    }
  }

  async function adotar(indicadorId: string) {
    setAdotando(indicadorId);
    setErroMover("");
    try {
      const res = await fetch("/api/gestor/meus-indicadores/mover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicador_id: indicadorId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErroMover(json.error ?? "Erro ao adotar indicador");
      } else {
        setIndicadoresConsultor((prev) => prev.filter((i) => i.id !== indicadorId));
        await carregar();
      }
    } catch {
      setErroMover("Erro de conexao.");
    } finally {
      setAdotando(null);
    }
  }

  // --- Deletar ---

  async function deletar() {
    if (!deletarId) return;
    setDeletando(true);
    try {
      const res = await fetch(`/api/gestor/meus-indicadores/${deletarId}`, { method: "DELETE" });
      if (res.ok) {
        setDeletarId(null);
        await carregar();
      }
    } finally {
      setDeletando(false);
    }
  }

  const consultoresFiltrados = consultores.filter((c) =>
    c.nome.toLowerCase().includes(buscaConsultor.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Cabecalho */}
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">Meus Indicadores</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Indicadores vinculados diretamente a voce
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={abrirModalMover}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            Mover de Consultor
          </button>
          <button
            onClick={() => { setModalAdicionar(true); setErroAdicionar(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar Indicador
          </button>
        </div>
      </div>

      {/* Conteudo */}
      <div className="flex-1 p-8 bg-muted/30">
        {carregando ? (
          <div className="text-center text-muted-foreground text-sm py-20">Carregando...</div>
        ) : indicadores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <UserCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum indicador vinculado a voce ainda.</p>
            <button
              onClick={() => { setModalAdicionar(true); setErroAdicionar(""); }}
              className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              Adicionar primeiro indicador
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {indicadores.map((ind) => (
              <Card key={ind.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <UserCheck className="h-4 w-4 text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold text-foreground truncate">{ind.nome}</p>
                    </div>
                    <button
                      onClick={() => setDeletarId(ind.id)}
                      className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors p-1"
                      title="Remover indicador"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      {ind.telefone ? fmtTelBR(ind.telefone) : (
                        <span className="italic text-muted-foreground/50">sem telefone</span>
                      )}
                    </p>

                    {ind.chave_pix ? (
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-muted-foreground truncate flex-1" title={ind.chave_pix}>
                          PIX: {ind.chave_pix}
                        </p>
                        <button
                          onClick={() => copiarPix(ind.chave_pix!, ind.id)}
                          className="shrink-0 text-muted-foreground hover:text-indigo-500 transition-colors"
                          title="Copiar chave PIX"
                        >
                          {pixCopiado === ind.id
                            ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                            : <Copy className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-muted-foreground/50">sem chave PIX</p>
                    )}
                  </div>

                  <p className="mt-3 text-[10px] text-muted-foreground/60 border-t border-border pt-2">
                    Cadastrado em {new Date(ind.criado_em).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Adicionar Indicador */}
      {modalAdicionar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Adicionar Indicador</h2>
              <button
                onClick={() => setModalAdicionar(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {erroAdicionar && (
              <div className="mb-4 rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {erroAdicionar}
              </div>
            )}

            <form onSubmit={adicionarIndicador} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={formAdicionar.nome}
                  onChange={(e) => setFormAdicionar((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Telefone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(87) 99999-9999"
                  value={formAdicionar.telefone}
                  onChange={(e) => setFormAdicionar((f) => ({ ...f, telefone: fmtTelBR(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Email (opcional)
                </label>
                <input
                  type="text" inputMode="email"
                  placeholder="email@exemplo.com"
                  value={formAdicionar.email}
                  onChange={(e) => setFormAdicionar((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Senha inicial
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimo 6 caracteres"
                  value={formAdicionar.senha}
                  onChange={(e) => setFormAdicionar((f) => ({ ...f, senha: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAdicionar(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoAdicionar}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {enviandoAdicionar ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mover de Consultor */}
      {modalMover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground">Mover de Consultor</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Selecione um consultor inativo e adote seus indicadores
                </p>
              </div>
              <button
                onClick={() => setModalMover(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {erroMover && (
              <div className="mb-4 rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {erroMover}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 max-h-[60vh]">
              {/* Coluna esquerda: lista de consultores inativos */}
              <div className="flex flex-col gap-2 overflow-hidden">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Consultores inativos
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={buscaConsultor}
                    onChange={(e) => setBuscaConsultor(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-muted border border-border rounded-xl outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[calc(60vh-100px)]">
                  {consultoresFiltrados.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {buscaConsultor ? "Nenhum resultado." : "Nenhum consultor inativo."}
                    </p>
                  ) : (
                    consultoresFiltrados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selecionarConsultor(c)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-xl border transition-colors",
                          consultorSelecionado?.id === c.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">{c.nome}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Coluna direita: indicadores do consultor selecionado */}
              <div className="flex flex-col gap-2 overflow-hidden">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Indicadores do consultor
                </p>
                <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[calc(60vh-60px)]">
                  {!consultorSelecionado ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Selecione um consultor ao lado.
                    </p>
                  ) : carregandoIndicadoresConsultor ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
                  ) : indicadoresConsultor.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhum indicador neste consultor.
                    </p>
                  ) : (
                    indicadoresConsultor.map((ind) => (
                      <div
                        key={ind.id}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{ind.nome}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {ind.telefone ? fmtTelBR(ind.telefone) : (
                              <span className="italic text-muted-foreground/50">sem telefone</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => adotar(ind.id)}
                          disabled={adotando === ind.id}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-[11px] font-semibold transition-colors"
                        >
                          {adotando === ind.id ? (
                            "Adotando..."
                          ) : (
                            <>
                              <ArrowRight className="h-3 w-3" />
                              Adotar
                            </>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setModalMover(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar exclusao */}
      {deletarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-foreground mb-2">Remover indicador?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Esta acao nao pode ser desfeita. O indicador sera removido do seu cadastro.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletarId(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={deletar}
                disabled={deletando}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {deletando ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
