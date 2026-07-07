"use client";

import { useState, useEffect } from "react";
import { PlacaMercosul } from "@/components/placa-mercosul";
import { CheckCircle2, AlertCircle, Car } from "lucide-react";

function formatarPlaca(valor: string): string {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (limpo.length > 3) return limpo.slice(0, 3) + "-" + limpo.slice(3);
  return limpo;
}

function placaValida(placa: string): boolean {
  const limpo = placa.replace("-", "");
  if (limpo.length !== 7) return false;
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(limpo);
  const antiga = /^[A-Z]{3}[0-9]{4}$/.test(limpo);
  return mercosul || antiga;
}

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0,2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
}

type TipoVeiculo = "moto" | "carro" | "caminhao";

const TIPOS: { tipo: TipoVeiculo; label: string }[] = [
  { tipo: "moto", label: "Moto" },
  { tipo: "carro", label: "Carro" },
  { tipo: "caminhao", label: "Caminhao" },
];

interface Comissao {
  tipo: TipoVeiculo;
  comissao_indicador: number;
  ativo: boolean;
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function IndicarPage() {
  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo>("carro");
  const [placa, setPlaca] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [duplicado, setDuplicado] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);

  useEffect(() => {
    fetch("/api/consultor/comissoes")
      .then((r) => r.json())
      .then((d: Comissao[]) => setComissoes(d))
      .catch(() => {});
  }, []);

  const comissaoAtual = comissoes.find((c) => c.tipo === tipoVeiculo && c.ativo);

  const handlePlaca = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaca(formatarPlaca(e.target.value));
    setDuplicado(false);
    setErro("");
  };

  const placaLimpa = placa.replace("-", "");
  const valida = placaValida(placa);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valida) { setErro("Digite uma placa válida (ex: ABC-1D23 ou ABC-1234)"); return; }
    if (!nome.trim()) { setErro("Informe o nome do dono do veículo"); return; }
    if (telefone.replace(/\D/g, "").length < 10) { setErro("Informe o WhatsApp do dono do veículo com DDD"); return; }
    setErro("");
    setDuplicado(false);
    setCarregando(true);
    try {
      const res = await fetch("/api/indicador/nova-indicacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa: placaLimpa, nome_lead: nome.trim(), telefone_lead: telefone, tipo_veiculo: tipoVeiculo }),
      });
      const json = await res.json();
      if (res.status === 409) { setDuplicado(true); return; }
      if (!res.ok) { setErro(json.error ?? "Erro ao enviar"); return; }
      setSucesso(true);
      setPlaca("");
      setNome("");
      setTelefone("");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const novaSugestao = () => {
    setSucesso(false);
    setPlaca("");
    setNome("");
    setTelefone("");
  };

  if (sucesso) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Placa indicada com sucesso!</h2>
            <p className="text-sm text-muted-foreground mt-1">O consultor vai entrar em contato com o dono do veículo.</p>
          </div>
          <button
            onClick={novaSugestao}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors"
          >
            Indicar outra placa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Indicar Placa</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Digite a placa do veículo que você quer indicar para proteção</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <div className="max-w-md mx-auto space-y-6">

          {/* Tipo de veiculo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Tipo de veiculo
            </label>
            <div className="grid grid-cols-3 gap-3">
              {TIPOS.map(({ tipo, label }) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoVeiculo(tipo)}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    tipoVeiculo === tipo
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border bg-background text-muted-foreground hover:border-amber-500/40"
                  }`}
                >
                  <Car className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
            {comissaoAtual && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                Voce ganha {moeda(comissaoAtual.comissao_indicador)} se esta indicacao fechar
              </p>
            )}
          </div>

          {/* Preview da placa */}
          <div className="flex flex-col items-center gap-3">
            <div className="overflow-x-auto w-full flex justify-center">
              <PlacaMercosul placa={placaLimpa} tamanho="md" />
            </div>
            {placaLimpa.length === 7 && !valida && (
              <p className="text-xs text-red-500 font-medium">Formato inválido. Use ABC-1234 ou ABC-1D23</p>
            )}
            {valida && (
              <p className="text-xs text-emerald-500 font-semibold">Placa válida</p>
            )}
          </div>

          {/* Alerta duplicado */}
          {duplicado && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">Placa já indicada</div>
                <div className="text-xs text-muted-foreground mt-0.5">Esta placa já foi cadastrada anteriormente.</div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={enviar} className="space-y-4">
            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-500">{erro}</div>
            )}

            {/* Campo placa */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Placa do veículo
              </label>
              <input
                type="text"
                value={placa}
                onChange={handlePlaca}
                placeholder="ABC-1234"
                maxLength={8}
                autoComplete="off"
                autoCapitalize="characters"
                className="w-full text-center text-3xl font-black tracking-[0.3em] uppercase px-4 py-4 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
              />
            </div>

            {/* Dados opcionais */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Car className="h-3 w-3" />
                Dados do dono do veículo
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">WhatsApp</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(fmtTelBR(e.target.value))}
                  placeholder="(87) 99999-9999"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando || !valida}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? "Enviando..." : "Indicar esta placa"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
