"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle2, Clock, QrCode } from "lucide-react";

type Info = {
  plano: string;
  status: string;
  cobranca_ativa: boolean;
  valor: number;
  master_efi_configurado: boolean;
};

type Pix = {
  qrcode: string;
  qrcode_image: string;
  txid: string;
  valor: number;
};

const planoLabel: Record<string, string> = {
  trial: "Trial",
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
};

export default function UpgradePage() {
  const [info, setInfo] = useState<Info | null>(null);
  const [pix, setPix] = useState<Pix | null>(null);
  const [pago, setPago] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch("/api/associacao/upgrade")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setErro("Erro ao carregar informacoes do plano"));
  }, []);

  useEffect(() => {
    if (!pix?.txid || pago) return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/associacao/upgrade?txid=${pix.txid}`);
        const json = await r.json();
        if (json.pago) {
          setPago(true);
          clearInterval(iv);
        }
      } catch {
        // falha transitoria; tenta novamente no proximo tick
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [pix?.txid, pago]);

  const gerarPix = async () => {
    setGerando(true); setErro("");
    try {
      const r = await fetch("/api/associacao/upgrade", { method: "POST" });
      const json = await r.json();
      if (!r.ok) { setErro(json.error ?? "Erro ao gerar PIX"); return; }
      setPix(json);
    } finally { setGerando(false); }
  };

  const copiar = () => {
    if (!pix?.qrcode) return;
    navigator.clipboard.writeText(pix.qrcode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (!info) return <div className="p-8 text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Minha Assinatura</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Visualize e renove seu plano no Indique Placa</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30 overflow-y-auto">
        <div className="max-w-lg space-y-5">
          {erro && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500">{erro}</div>}

          {/* Status atual */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Situacao Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Plano</p>
                  <p className="text-lg font-bold text-foreground">{planoLabel[info.plano] ?? info.plano}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`text-sm font-semibold ${info.status === "ativo" ? "text-emerald-500" : "text-amber-500"}`}>
                    {info.status === "ativo" ? "Ativo" : info.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pagamento */}
          {pago ? (
            <Card className="shadow-sm border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-6 flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Pagamento confirmado!</p>
                  <p className="text-xs text-muted-foreground mt-1">Seu plano foi renovado com sucesso. Atualize a pagina para ver o novo status.</p>
                </div>
              </CardContent>
            </Card>
          ) : !info.cobranca_ativa ? (
            <Card className="shadow-sm border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Nao ha cobranca ativa para sua associacao no momento. Entre em contato com o suporte se precisar renovar seu plano.</p>
              </CardContent>
            </Card>
          ) : !info.master_efi_configurado ? (
            <Card className="shadow-sm border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Sistema de pagamento em configuracao. Tente novamente em breve ou entre em contato com o suporte.</p>
              </CardContent>
            </Card>
          ) : pix ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  Pague via PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-center">
                  {pix.qrcode_image ? (
                    <img src={pix.qrcode_image} alt="QR Code PIX" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">Ou copie o codigo PIX:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground break-all line-clamp-2">
                      {pix.qrcode}
                    </div>
                    <button
                      onClick={copiar}
                      className="px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold flex-shrink-0 transition-colors"
                    >
                      {copiado ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">Aguardando pagamento de <strong>R$ {pix.valor.toFixed(2)}</strong>. O status sera atualizado automaticamente apos a confirmacao.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                  <div>
                    <p className="text-sm font-bold">Renovar plano {planoLabel[info.plano] ?? info.plano}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pagamento unico mensal via PIX</p>
                  </div>
                  <p className="text-xl font-black text-foreground">R$ {info.valor.toFixed(2)}</p>
                </div>
                <button
                  onClick={gerarPix}
                  disabled={gerando || info.valor === 0}
                  className="w-full h-10 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {gerando ? "Gerando PIX..." : "Gerar PIX para pagamento"}
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
