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

interface TipoVeiculo {
  tipo: string;
  label: string;
  comissao_indicador?: number;
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TIPOS_PADRAO: TipoVeiculo[] = [
  { tipo: "moto",    label: "Moto",    comissao_indicador: 50  },
  { tipo: "carro",   label: "Carro",   comissao_indicador: 100 },
  { tipo: "caminhao",label: "Caminhão",comissao_indicador: 500 },
];

function vibrar() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(40);
  }
}

export default function IndicarPage() {
  const [tipoVeiculo, setTipoVeiculo] = useState("carro");
  const [tipos, setTipos] = useState<TipoVeiculo[]>(TIPOS_PADRAO);
  const [placa, setPlaca] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [duplicado, setDuplicado] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    fetch("/api/indicador/tipos-veiculo")
      .then((r) => r.json())
      .then((d: TipoVeiculo[]) => { if (Array.isArray(d) && d.length > 0) setTipos(d); })
      .catch(() => {});
  }, []);

  const tipoAtual = tipos.find((t) => t.tipo === tipoVeiculo);

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
      vibrar();

      // Abrir WhatsApp do consultor com mensagem pre-preenchida
      if (json.consultor?.fone) {
        const fone = json.consultor.fone.replace(/\D/g, "");
        const numero = fone.startsWith("55") ? fone : `55${fone}`;
        const msg = encodeURIComponent(
          `Ola ${json.consultor.nome}, sou ${nome.trim() || "seu indicador"} e acabei de indicar a placa *${placa}* pelo Indique Placa. O dono e ${nome.trim() || "—"}, WhatsApp: ${telefone || "—"}`
        );
        window.open(`https://wa.me/${numero}?text=${msg}`, "_blank");
      }

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
            onClick={() => { vibrar(); novaSugestao(); }}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors"
          >
            Indicar outra placa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ position: "relative" }}>
      {/* Conteudo rolavel */}
      <div
        className="flex-1 overflow-y-auto bg-muted/30"
        style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-md mx-auto px-6 pt-5 pb-4 space-y-6">

          {/* Tipo de veículo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Tipo de veículo
            </label>
            <div className="grid grid-cols-3 gap-3">
              {tipos.map(({ tipo, label }) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => { vibrar(); setTipoVeiculo(tipo); }}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-95 ${
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
            {tipoAtual?.comissao_indicador && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                Você ganha {moeda(tipoAtual.comissao_indicador)} se esta indicação fechar
              </p>
            )}
          </div>

          {/* Placa editavel diretamente */}
          <div className="flex flex-col items-center gap-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground self-start">
              Toque na placa e digite
            </label>
            <PlacaMercosul
              placa={placaLimpa}
              tamanho="md"
              editavel
              onChange={(v) => { setPlaca(v); setDuplicado(false); setErro(""); }}
            />
            {placaLimpa.length === 7 && !valida && (
              <p className="text-xs text-red-500 font-medium">Formato inválido. Use ABC-1234 ou ABC-1D23</p>
            )}
            {valida && (
              <p className="text-xs text-emerald-500 font-semibold">Placa válida</p>
            )}
          </div>

          {/* Alerta duplicado */}
          {duplicado && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">Placa já indicada</div>
                <div className="text-xs text-muted-foreground mt-0.5">Esta placa já foi cadastrada anteriormente.</div>
              </div>
            </div>
          )}

          {/* Formulario - sem o botao submit aqui */}
          <form id="indicar-form" onSubmit={enviar} className="space-y-4">
            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-500">{erro}</div>
            )}

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
                  className="w-full px-4 py-3.5 text-sm rounded-xl border-2 border-border bg-muted/50 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">WhatsApp</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(fmtTelBR(e.target.value))}
                  placeholder="(87) 99999-9999"
                  className="w-full px-4 py-3.5 text-sm rounded-xl border-2 border-border bg-muted/50 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Botao fixo no rodape - acima do bottom nav */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(64px + env(safe-area-inset-bottom))",
          left: 0,
          right: 0,
          zIndex: 30,
          padding: "12px 16px",
          background: "linear-gradient(to top, var(--background) 80%, transparent)",
        }}
      >
        <button
          type="submit"
          form="indicar-form"
          disabled={carregando || !valida}
          className="w-full py-4 rounded-2xl bg-amber-500 text-white font-bold text-base active:scale-95 transition-transform duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: valida ? "0 4px 16px rgba(245,158,11,0.4)" : "none",
          }}
        >
          {carregando ? "Enviando..." : "Indicar esta placa"}
        </button>
      </div>
    </div>
  );
}
