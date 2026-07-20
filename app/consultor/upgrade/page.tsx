"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Check, Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "ja_pro"; plano_ativo_ate: string | null }
  | { tipo: "gratuito" }
  | { tipo: "pago"; valor: number }
  | { tipo: "qrcode"; qrcode: string; qrcode_image: string; txid: string; valor: number }
  | { tipo: "erro"; mensagem: string };

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso: string | null) {
  if (!iso) return "sem data definida";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function UpgradeProPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    fetch("/api/consultor/upgrade-pro")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/consultor/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.plano === "pro") {
          setEstado({ tipo: "ja_pro", plano_ativo_ate: data.plano_ativo_ate ?? null });
        } else if (!data.cobranca_ativa || data.valor === 0) {
          setEstado({ tipo: "gratuito" });
        } else {
          setEstado({ tipo: "pago", valor: data.valor });
        }
      })
      .catch(() => setEstado({ tipo: "erro", mensagem: "Erro ao carregar configuracao." }));
  }, [router]);

  async function assinar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/consultor/upgrade-pro", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setEstado({ tipo: "erro", mensagem: data.error ?? "Erro ao gerar cobranca." });
        return;
      }
      if (data.gratuito) {
        router.replace("/consultor/dashboard?pro=1");
        return;
      }
      if (data.ja_pro) {
        setEstado({ tipo: "ja_pro", plano_ativo_ate: data.plano_ativo_ate ?? null });
        return;
      }
      setEstado({
        tipo: "qrcode",
        qrcode: data.qrcode,
        qrcode_image: data.qrcode_image,
        txid: data.txid,
        valor: data.valor,
      });
    } finally {
      setCarregando(false);
    }
  }

  async function copiarCodigo(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback silencioso
    }
  }

  async function verificarPagamento(txid: string) {
    setVerificando(true);
    try {
      const res = await fetch(`/api/consultor/upgrade-pro?txid=${encodeURIComponent(txid)}`);
      const data = await res.json();
      if (data.pago) {
        router.replace("/consultor/dashboard?pro=1");
      }
    } finally {
      setVerificando(false);
    }
  }

  const btnBase =
    "px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const btnViolet = `${btnBase} bg-violet-600 hover:bg-violet-700 text-white`;

  if (estado.tipo === "carregando") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-[var(--border)]">
        <h1 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <Zap className="h-5 w-5 text-violet-500" />
          Consultor Pro
        </h1>
        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
          Recursos avancados para multiplicar seus resultados
        </p>
      </div>

      <div className="flex-1 p-8 bg-[var(--muted)]/30 space-y-5 max-w-2xl">

        {estado.tipo === "ja_pro" && (
          <Card className="shadow-sm border-violet-500/30">
            <CardContent className="pt-5 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-500 text-xs font-bold px-3 py-1.5 rounded-full">
                <Zap className="h-3.5 w-3.5" />
                Voce ja e Pro
              </span>
              {estado.plano_ativo_ate && (
                <span className="text-sm text-[var(--muted-foreground)]">
                  Ativo ate {formatarData(estado.plano_ativo_ate)}
                </span>
              )}
            </CardContent>
          </Card>
        )}

        {estado.tipo === "erro" && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-sm text-red-500">{estado.mensagem}</p>
          </div>
        )}

        {/* O que e o Pro */}
        <Card className="shadow-sm border-violet-500/20">
          <CardHeader className="pb-3 border-b border-[var(--border)]">
            <CardTitle className="text-sm font-semibold">O que muda no plano Pro</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {[
              {
                titulo: "Buscador de Parceiros",
                desc: "Pesquise oficinas, concessionarias, despachantes e outros negocios na sua cidade. Veja o telefone de cada um e recrute como indicador com um clique no WhatsApp.",
                icone: "🔍",
              },
              {
                titulo: "Disparo automatico no WhatsApp",
                desc: "Quando um novo lead chega, o sistema manda mensagem automaticamente para ele pelo seu WhatsApp conectado. Voce nao precisa fazer nada manualmente.",
                icone: "⚡",
              },
              {
                titulo: "Campanha de indicacao",
                desc: "Cole uma lista de numeros de telefone e o sistema gera links prontos para voce abordar cada contato no WhatsApp com uma mensagem personalizada.",
                icone: "📣",
              },
              {
                titulo: "Exportacao de dados",
                desc: "Baixe todos os seus leads e indicadores em planilha CSV para analisar no Excel ou importar em outro sistema.",
                icone: "📥",
              },
            ].map((r) => (
              <div key={r.titulo} className="flex gap-3 items-start">
                <span className="text-2xl flex-shrink-0">{r.icone}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{r.titulo}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Comparativo Free vs Pro */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-sm font-semibold text-[var(--muted-foreground)]">Free</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {["Receber leads", "Fechar vendas", "Pagar comissoes aos indicadores"].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-[var(--foreground)]">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-violet-500/30">
            <CardHeader className="pb-3 border-b border-violet-500/20">
              <CardTitle className="text-sm font-semibold text-violet-500 flex items-center gap-1.5">
                <Zap className="h-4 w-4" /> Pro
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {["Tudo do Free", "Buscador de parceiros", "WhatsApp automatico", "Campanha de indicacao", "Exportacao CSV"].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-[var(--foreground)]">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Botao de acao conforme estado */}
        {estado.tipo === "gratuito" && (
          <button onClick={assinar} disabled={carregando} className={btnViolet}>
            {carregando ? "Ativando..." : "Ativar Pro Gratuitamente"}
          </button>
        )}

        {estado.tipo === "pago" && (
          <div className="flex items-center gap-4">
            {estado.valor > 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {formatarMoeda(estado.valor)}/mes
              </p>
            )}
            <button onClick={assinar} disabled={carregando} className={btnViolet}>
              {carregando
                ? "Gerando cobranca..."
                : estado.valor > 0
                  ? `Assinar por ${formatarMoeda(estado.valor)}/mes`
                  : "Assinar Pro"}
            </button>
          </div>
        )}

        {/* QR Code PIX apos gerar cobranca */}
        {estado.tipo === "qrcode" && (
          <Card className="shadow-sm border-violet-500/30">
            <CardHeader className="pb-3 border-b border-violet-500/20">
              <CardTitle className="text-sm font-semibold text-violet-500">
                Pagamento PIX - {formatarMoeda(estado.valor)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                Escaneie o QR Code ou copie o codigo Pix Copia e Cola abaixo. Seu plano sera ativado
                automaticamente apos a confirmacao do pagamento.
              </p>

              {estado.qrcode_image && (
                <img
                  src={estado.qrcode_image}
                  alt="QR Code PIX"
                  className="w-48 h-48 border border-[var(--border)] rounded-xl"
                />
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--foreground)]">Codigo Pix Copia e Cola:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={estado.qrcode}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] text-xs px-3 py-2 font-mono truncate"
                  />
                  <button
                    onClick={() => {
                      if (estado.tipo === "qrcode") copiarCodigo(estado.qrcode);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--muted)] hover:bg-[var(--border)] text-sm font-semibold transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    {copiado ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[var(--muted-foreground)]">
                Valido por 1 hora. Apos o pagamento, clique em "Verificar Pagamento".
              </p>

              <button
                onClick={() => {
                  if (estado.tipo === "qrcode") verificarPagamento(estado.txid);
                }}
                disabled={verificando}
                className={`${btnBase} bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] flex items-center gap-2`}
              >
                <RefreshCw className={`h-4 w-4 ${verificando ? "animate-spin" : ""}`} />
                {verificando ? "Verificando..." : "Verificar Pagamento"}
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
