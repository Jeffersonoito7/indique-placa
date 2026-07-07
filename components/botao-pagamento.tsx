"use client";

import { useState, useRef } from "react";
import { Banknote, Upload, X, CheckCircle2, ExternalLink } from "lucide-react";

interface BotaoPagamentoProps {
  leadId: string;
  status: string;
  chavePix: string | null;
  pagoEm: string | null;
  comprovante: string | null;
  valorPago: number | null;
  nomeIndicador: string | null;
}

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BotaoPagamento({ leadId, status, chavePix, pagoEm, comprovante, valorPago, nomeIndicador }: BotaoPagamentoProps) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(valorPago?.toString() ?? "");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [pago, setPago] = useState(!!pagoEm);
  const [comprovanteUrl, setComprovanteUrl] = useState(comprovante);
  const [valorRegistrado, setValorRegistrado] = useState(valorPago);
  const [dataRegistrada, setDataRegistrada] = useState(pagoEm);
  const inputRef = useRef<HTMLInputElement>(null);

  if (status !== "fechado" || !nomeIndicador) return null;

  const enviar = async () => {
    if (!arquivo) { setErro("Selecione o comprovante de pagamento."); return; }
    setEnviando(true);
    setErro("");
    const form = new FormData();
    form.append("comprovante", arquivo);
    if (valor) form.append("valor", valor);

    try {
      const res = await fetch(`/api/consultor/lead/${leadId}/pagamento`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao registrar pagamento");
        return;
      }
      setPago(true);
      setComprovanteUrl(json.comprovante_url);
      setValorRegistrado(valor ? Number(valor) : null);
      setDataRegistrada(new Date().toISOString());
      setAberto(false);
    } catch {
      setErro("Erro de conexão");
    } finally {
      setEnviando(false);
    }
  };

  if (pago) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Pago</span>
          {valorRegistrado && (
            <span className="text-xs text-muted-foreground">{moeda(valorRegistrado)}</span>
          )}
        </div>
        {dataRegistrada && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(dataRegistrada).toLocaleDateString("pt-BR")}
          </span>
        )}
        {comprovanteUrl && (
          <a
            href={comprovanteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Ver comprovante
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Chave PIX do indicador */}
      {chavePix && (
        <div className="mb-1.5">
          <span className="text-[10px] text-muted-foreground block">PIX do indicador:</span>
          <span className="text-xs font-mono text-foreground font-semibold">{chavePix}</span>
        </div>
      )}
      {!chavePix && (
        <span className="text-[10px] text-muted-foreground italic block mb-1.5">Indicador sem chave PIX</span>
      )}

      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
      >
        <Banknote className="h-3.5 w-3.5" />
        Registrar Pagamento
      </button>

      {/* Modal */}
      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAberto(false); }}
        >
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Registrar Pagamento</h3>
              <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-muted/40 rounded-lg p-3 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Indicador</div>
              <div className="text-sm font-semibold text-foreground">{nomeIndicador}</div>
              {chavePix ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Chave PIX:</span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{chavePix}</span>
                </div>
              ) : (
                <div className="text-xs text-amber-600 dark:text-amber-400">Este indicador não cadastrou uma chave PIX ainda.</div>
              )}
            </div>

            {erro && (
              <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg px-3 py-2">{erro}</div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Valor Pago (R$) — opcional
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 150.00"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Comprovante de Pagamento (obrigatório)
              </label>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
              {arquivo ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">{arquivo.name}</span>
                  <button type="button" onClick={() => setArquivo(null)} className="text-muted-foreground hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-emerald-500/40 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all"
                >
                  <Upload className="h-4 w-4" />
                  Selecionar comprovante (JPG, PNG ou PDF)
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={enviar}
                disabled={enviando || !arquivo}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {enviando ? "Registrando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
