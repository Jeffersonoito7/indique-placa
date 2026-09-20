"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle2, AlertCircle, Car, Loader2 } from "lucide-react";

function formatarPlaca(valor: string): string {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (limpo.length > 3) return limpo.slice(0, 3) + "-" + limpo.slice(3);
  return limpo;
}

function placaValida(placa: string): boolean {
  const limpo = placa.replace(/-/g, "");
  if (limpo.length !== 7) return false;
  return /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(limpo) || /^[A-Z]{3}[0-9]{4}$/.test(limpo);
}

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

interface TipoVeiculo { tipo: string; label: string; comissao_indicador?: number; }

const TIPOS_PADRAO: TipoVeiculo[] = [
  { tipo: "carro",    label: "Carro",    comissao_indicador: 100 },
  { tipo: "moto",     label: "Moto",     comissao_indicador: 50  },
  { tipo: "caminhao", label: "Caminhão", comissao_indicador: 500 },
];

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PaginaPublicaIndicador({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [nomeIndicador, setNomeIndicador] = useState<string | null>(null);
  const [linkInvalido, setLinkInvalido] = useState(false);
  const [carregandoInfo, setCarregandoInfo] = useState(true);

  const [tipoVeiculo, setTipoVeiculo] = useState("carro");
  const [tipos, setTipos] = useState<TipoVeiculo[]>(TIPOS_PADRAO);
  const [placa, setPlaca] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [duplicado, setDuplicado] = useState(false);

  useEffect(() => {
    fetch(`/api/publico/indicador-info/${id}`)
      .then((r) => {
        if (!r.ok) { setLinkInvalido(true); return null; }
        return r.json();
      })
      .then((d) => { if (d?.nome) setNomeIndicador(d.nome); })
      .catch(() => setLinkInvalido(true))
      .finally(() => setCarregandoInfo(false));

    fetch(`/api/publico/tipos-veiculo?indicador_id=${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: TipoVeiculo[]) => { if (Array.isArray(d) && d.length > 0) setTipos(d); })
      .catch(() => {});
  }, [id]);

  const placaLimpa = placa.replace(/-/g, "");
  const valida = placaValida(placa);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valida) { setErro("Digite uma placa válida (ex: ABC-1D23 ou ABC-1234)"); return; }
    if (!nome.trim()) { setErro("Informe seu nome"); return; }
    if (telefone.replace(/\D/g, "").length < 10) { setErro("Informe seu WhatsApp com DDD"); return; }
    setErro("");
    setDuplicado(false);
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/indicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: placaLimpa,
          nome_lead: nome.trim(),
          telefone_lead: telefone,
          tipo_veiculo: tipoVeiculo,
          indicador_id: id,
        }),
      });
      const json = await res.json();
      if (res.status === 409) { setDuplicado(true); return; }
      if (!res.ok) { setErro(json.error ?? "Erro ao enviar. Tente novamente."); return; }
      setSucesso(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  if (carregandoInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (linkInvalido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">Link inválido</h1>
          <p className="text-zinc-400 text-sm">Este link não existe ou está inativo.</p>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Dados enviados com sucesso!</h2>
            <p className="text-sm text-zinc-400 mt-1">Em breve um consultor vai entrar em contato com você.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <Car className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Proteja seu veículo</h1>
          {nomeIndicador && (
            <p className="text-sm text-zinc-400">
              Indicação de <span className="text-amber-400 font-medium">{nomeIndicador}</span>
            </p>
          )}
          <p className="text-xs text-zinc-500">Preencha seus dados abaixo e um consultor entrará em contato.</p>
        </div>

        {/* Banner de ganhos */}
        {(() => {
          const vals = tipos.map((t) => t.comissao_indicador ?? 0).filter((v) => v > 0);
          const min = vals.length > 0 ? Math.min(...vals) : 0;
          const max = vals.length > 0 ? Math.max(...vals) : 0;
          if (!max) return null;
          return (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-4 text-center">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Renda extra por indicação</p>
              <p className="text-2xl font-black text-amber-400">
                {min === max ? moeda(max) : `${moeda(min)} a ${moeda(max)}`}
              </p>
              <p className="text-xs text-zinc-500 mt-1">por cada indicação convertida em venda</p>
            </div>
          );
        })()}

        {/* Formulário */}
        <form onSubmit={enviar} className="space-y-4">
          {/* Tipo de veículo */}
          <div className="grid grid-cols-3 gap-2">
            {tipos.map((t) => (
              <button
                key={t.tipo}
                type="button"
                onClick={() => setTipoVeiculo(t.tipo)}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors flex flex-col items-center gap-0.5 ${
                  tipoVeiculo === t.tipo
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <span>{t.label}</span>
                {t.comissao_indicador != null && t.comissao_indicador > 0 && (
                  <span className={`text-xs font-semibold ${tipoVeiculo === t.tipo ? "text-amber-100" : "text-zinc-600"}`}>
                    {moeda(t.comissao_indicador)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Placa */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Placa do veículo</label>
            <input
              type="text"
              value={placa}
              onChange={(e) => { setPlaca(formatarPlaca(e.target.value)); setDuplicado(false); setErro(""); }}
              placeholder="ABC-1234 ou ABC-1D23"
              maxLength={8}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-center text-lg font-mono tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Nome */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Seu nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setErro(""); }}
              placeholder="Seu nome completo"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Seu WhatsApp</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => { setTelefone(fmtTelBR(e.target.value)); setErro(""); }}
              placeholder="(11) 99999-9999"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Erros */}
          {erro && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {erro}
            </div>
          )}
          {duplicado && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Esta placa já foi cadastrada anteriormente.
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {carregando ? "Enviando..." : "Quero proteger meu veículo"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600">
          Seus dados são usados apenas para contato sobre proteção veicular.
        </p>
      </div>
    </div>
  );
}
