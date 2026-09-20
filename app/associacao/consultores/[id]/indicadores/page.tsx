"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserCheck, MoveRight } from "lucide-react";

type Indicador = {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  criado_em: string;
};

type Consultor = {
  id: string;
  nome: string;
  email: string;
  fone: string;
  status: string;
  plano: string;
};

type ConsultorSimples = { id: string; nome: string };

type Dados = {
  consultor: Consultor;
  indicadores: Indicador[];
  todos_consultores: ConsultorSimples[];
};

function badge(status: string | undefined) {
  const map: Record<string, string> = {
    ativo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    inativo: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    suspenso: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status ?? "inativo"] ?? map.inativo}`}>
      {status ?? "inativo"}
    </span>
  );
}

export default function ConsultorIndicadoresPage() {
  const { id: consultorId } = useParams<{ id: string }>();
  const router = useRouter();
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [movendo, setMovendo] = useState<string | null>(null);
  const [destino, setDestino] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const r = await fetch(`/api/associacao/consultores/${consultorId}/indicadores`);
      if (r.ok) setDados(await r.json());
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [consultorId]);

  async function mover() {
    if (!movendo || !destino) return;
    setErro("");
    setSalvando(true);

    // Busca o gestor_id do consultor atual para usar como gestor de origem no endpoint
    const gestorId = dados?.consultor ? "" : "";

    try {
      // Usa o endpoint de mover-membro do gestor do consultor atual
      // Como nao temos o gestor_id aqui, usamos endpoint direto de indicador
      const r = await fetch(`/api/associacao/indicadores/${movendo}/mover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novo_consultor_id: destino }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErro(j.error ?? "Erro ao mover");
        return;
      }
      setMovendo(null);
      setDestino("");
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!dados) return <div className="p-8 text-center text-destructive">Consultor não encontrado.</div>;

  const { consultor, indicadores, todos_consultores } = dados;
  const outrosConsultores = todos_consultores.filter((c) => c.id !== consultorId);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{consultor.nome}</h1>
          <p className="text-sm text-muted-foreground">{consultor.email}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
        <UserCheck className="w-8 h-8 text-primary opacity-70" />
        <div>
          <p className="text-2xl font-bold">{indicadores.length}</p>
          <p className="text-xs text-muted-foreground">Indicadores vinculados</p>
        </div>
      </div>

      {/* Modal de mover */}
      {movendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-lg">Mover Indicador</h2>
            <div className="space-y-1">
              <label className="text-sm font-medium">Novo consultor</label>
              <select
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              >
                <option value="">Selecione...</option>
                {outrosConsultores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Os leads do indicador também serão movidos.</p>
            </div>
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
                disabled={salvando || !destino}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {salvando ? "Movendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold">Indicadores</h2>
        {indicadores.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum indicador vinculado a este consultor.</p>
        )}
        {indicadores.map((ind) => (
          <div key={ind.id} className="flex items-center gap-3 p-4 border rounded-xl bg-card">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{ind.nome}</span>
                {badge(ind.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{ind.telefone}</p>
            </div>
            <button
              onClick={() => setMovendo(ind.id)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Mover para outro consultor"
            >
              <MoveRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
