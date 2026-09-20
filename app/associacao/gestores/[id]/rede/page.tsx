"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, UserCheck, MoveRight, ChevronDown, ChevronUp } from "lucide-react";

type Consultor = {
  id: string;
  nome: string;
  email: string;
  fone: string;
  status?: string;
  plano?: string;
  created_at: string;
};

type Indicador = {
  id: string;
  nome: string;
  telefone: string;
  status?: string;
  criado_em: string;
  consultor_id?: string;
};

type Gestor = { id: string; nome: string; email: string; fone: string; ativo: boolean };
type GestorSimples = { id: string; nome: string };
type ConsultorSimples = { id: string; nome: string };

type Rede = {
  gestor: Gestor;
  consultores: Consultor[];
  indicadores: Indicador[];
  todos_gestores: GestorSimples[];
};

function badge(status: string | undefined) {
  if (!status) return null;
  const map: Record<string, string> = {
    ativo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    inativo: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    suspenso: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? map.inativo}`}>
      {status}
    </span>
  );
}

export default function RedeGestorPage() {
  const { id: gestorId } = useParams<{ id: string }>();
  const router = useRouter();
  const [rede, setRede] = useState<Rede | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [movendo, setMovendo] = useState<{ tipo: "consultor" | "indicador"; id: string } | null>(null);
  const [destinoGestor, setDestinoGestor] = useState("");
  const [destinoConsultor, setDestinoConsultor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const r = await fetch(`/api/associacao/gestores/${gestorId}/rede`);
      if (r.ok) setRede(await r.json());
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [gestorId]);

  function toggleExpand(id: string) {
    setExpandidos((p) => ({ ...p, [id]: !p[id] }));
  }

  async function mover() {
    if (!movendo) return;
    setErro("");
    setSalvando(true);
    try {
      const body =
        movendo.tipo === "consultor"
          ? { tipo: "consultor", membro_id: movendo.id, novo_gestor_id: destinoGestor }
          : { tipo: "indicador", membro_id: movendo.id, novo_consultor_id: destinoConsultor };

      const r = await fetch(`/api/associacao/gestores/${gestorId}/mover-membro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErro(j.error ?? "Erro ao mover");
        return;
      }
      setMovendo(null);
      setDestinoGestor("");
      setDestinoConsultor("");
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!rede) return <div className="p-8 text-center text-destructive">Gestor não encontrado.</div>;

  const { gestor, consultores, indicadores, todos_gestores } = rede;

  // indicadores por consultor
  const indPorConsultor: Record<string, Indicador[]> = {};
  for (const ind of indicadores) {
    const key = ind.consultor_id ?? "__sem__";
    if (!indPorConsultor[key]) indPorConsultor[key] = [];
    indPorConsultor[key].push(ind);
  }

  const outrosGestores = todos_gestores.filter((g) => g.id !== gestorId);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{gestor.nome}</h1>
          <p className="text-sm text-muted-foreground">{gestor.email} · {gestor.fone}</p>
        </div>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${gestor.ativo ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600"}`}>
          {gestor.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary opacity-70" />
          <div>
            <p className="text-2xl font-bold">{consultores.length}</p>
            <p className="text-xs text-muted-foreground">Consultores</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary opacity-70" />
          <div>
            <p className="text-2xl font-bold">{indicadores.length}</p>
            <p className="text-xs text-muted-foreground">Indicadores</p>
          </div>
        </div>
      </div>

      {/* Modal de mover */}
      {movendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-lg">
              Mover {movendo.tipo === "consultor" ? "Consultor" : "Indicador"}
            </h2>

            {movendo.tipo === "consultor" ? (
              <div className="space-y-1">
                <label className="text-sm font-medium">Novo gestor</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                  value={destinoGestor}
                  onChange={(e) => setDestinoGestor(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {outrosGestores.map((g) => (
                    <option key={g.id} value={g.id}>{g.nome}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-sm font-medium">Novo consultor</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                  value={destinoConsultor}
                  onChange={(e) => setDestinoConsultor(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {consultores.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Os leads do indicador também serão movidos.</p>
              </div>
            )}

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setMovendo(null); setErro(""); }}
                className="flex-1 border rounded-lg py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={mover}
                disabled={salvando || (movendo.tipo === "consultor" ? !destinoGestor : !destinoConsultor)}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {salvando ? "Movendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de consultores com indicadores */}
      <div className="space-y-3">
        <h2 className="font-semibold text-base">Consultores da rede</h2>

        {consultores.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum consultor neste gestor.</p>
        )}

        {consultores.map((c) => {
          const inds = indPorConsultor[c.id] ?? [];
          const aberto = expandidos[c.id];
          return (
            <div key={c.id} className="border rounded-xl bg-card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{c.nome}</span>
                    {badge(c.status)}
                    {c.plano && c.plano !== "gratuito" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
                        {c.plano}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.email} · {inds.length} indicadores</p>
                </div>
                <button
                  onClick={() => setMovendo({ tipo: "consultor", id: c.id })}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Mover para outro gestor"
                >
                  <MoveRight className="w-4 h-4" />
                </button>
                {inds.length > 0 && (
                  <button
                    onClick={() => toggleExpand(c.id)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  >
                    {aberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {aberto && inds.length > 0 && (
                <div className="border-t divide-y">
                  {inds.map((ind) => (
                    <div key={ind.id} className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{ind.nome}</span>
                          {badge(ind.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{ind.telefone}</p>
                      </div>
                      <button
                        onClick={() => setMovendo({ tipo: "indicador", id: ind.id })}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Mover para outro consultor"
                      >
                        <MoveRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Indicadores sem consultor */}
        {(indPorConsultor["__sem__"] ?? []).length > 0 && (
          <div className="border rounded-xl bg-card overflow-hidden">
            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground">Indicadores sem consultor vinculado</p>
            </div>
            <div className="border-t divide-y">
              {(indPorConsultor["__sem__"] ?? []).map((ind) => (
                <div key={ind.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ind.nome}</span>
                      {badge(ind.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{ind.telefone}</p>
                  </div>
                  <button
                    onClick={() => setMovendo({ tipo: "indicador", id: ind.id })}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Mover para consultor"
                  >
                    <MoveRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
