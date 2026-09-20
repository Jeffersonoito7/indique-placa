"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, QrCode, Share2, Loader2 } from "lucide-react";
import QRCode from "qrcode";

export default function MeuLinkPage() {
  const [link, setLink] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/indicador/perfil")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        const id = d?.id;
        if (!id) { setErro("Não foi possível carregar seu link."); return; }
        const url = `${window.location.origin}/i/${id}`;
        setLink(url);
        return QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: "#ffffff", light: "#18181b" } });
      })
      .then((dataUrl) => { if (dataUrl) setQrDataUrl(dataUrl); })
      .catch(() => setErro("Erro ao carregar seu link."));
  }, []);

  const copiar = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não foi possível copiar. Copie manualmente o link abaixo.");
    }
  };

  const compartilhar = async () => {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({ title: "Meu link de indicação", url: link }).catch(() => {});
    } else {
      copiar();
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 max-w-lg mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Meu Link de Indicação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compartilhe este link ou QR code. O prospecto preenche os próprios dados e a indicação cai direto no sistema.
        </p>
      </div>

      {erro && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{erro}</div>
      )}

      {!link && !erro && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      )}

      {link && (
        <>
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code do seu link de indicação" width={280} height={280} />
              </div>
            ) : (
              <div className="w-[280px] h-[280px] rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <QrCode className="h-10 w-10 text-zinc-600" />
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Mostre este QR code para o prospecto escanear com a câmera do celular
            </p>
          </div>

          {/* Link copiável */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seu link personalizado</p>
            <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="flex-1 text-sm text-foreground truncate font-mono">{link}</span>
              <button
                onClick={copiar}
                className="shrink-0 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground"
                title="Copiar link"
              >
                {copiado ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {copiado && <p className="text-xs text-emerald-500 text-center">Link copiado!</p>}
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copiar}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-700 text-sm font-medium text-foreground hover:bg-zinc-900 transition-colors"
            >
              {copiado ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copiado ? "Copiado!" : "Copiar link"}
            </button>
            <button
              onClick={compartilhar}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </button>
          </div>

          {/* Dica */}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-4 space-y-1">
            <p className="text-xs font-semibold text-amber-400">Como usar</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Envie o link pelo WhatsApp para quem tem interesse</li>
              <li>O prospecto clica, preenche nome, placa e telefone</li>
              <li>A indicação aparece automaticamente no sistema</li>
              <li>Você não precisa preencher nada manualmente</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
