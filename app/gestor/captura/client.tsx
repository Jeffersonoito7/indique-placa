"use client";

import { useState } from "react";
import { Copy, Check, Share2, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GestorCapturaClient({ gestorId, nomeGestor }: { gestorId: string; nomeGestor: string }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://indiqueplaca.com.br";
  const link = `${baseUrl}/captura/consultor/${gestorId}`;
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      const el = document.createElement("input");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const compartilhar = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Seja Consultor - Indique Placa",
        text: `${nomeGestor} te convidou para ser consultor no Indique Placa. Cadastre-se:`,
        url: link,
      });
    } else {
      copiar();
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Link de Captura</h1>
        <p style={{ fontSize: 14, color: "#94a3b8" }}>
          Compartilhe este link para recrutar novos consultores direto para sua equipe.
          Ao se cadastrar, eles ja ficam vinculados a voce automaticamente.
        </p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <CardHeader>
          <CardTitle style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <Share2 size={16} style={{ color: "#06b6d4" }} />
            Seu link exclusivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{
            background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#67e8f9",
            wordBreak: "break-all", marginBottom: 14, fontFamily: "monospace",
          }}>
            {link}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={copiar} style={{ flex: 1, gap: 6 }}>
              {copiado ? <Check size={15} /> : <Copy size={15} />}
              {copiado ? "Copiado!" : "Copiar link"}
            </Button>
            <Button variant="outline" onClick={compartilhar} style={{ flex: 1, gap: 6 }}>
              <Share2 size={15} />
              Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <CardHeader>
          <CardTitle style={{ fontSize: 15 }}>Como funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <ol style={{ paddingLeft: 18, color: "#94a3b8", fontSize: 14, lineHeight: 2 }}>
            <li>Voce compartilha o link acima no WhatsApp, Instagram ou onde preferir</li>
            <li>A pessoa clica e preenche o cadastro rapidamente</li>
            <li>O consultor entra direto na sua equipe, sem aprovacao manual</li>
            <li>Voce ve ele aparecer em <strong style={{ color: "#e2e8f0" }}>Meu Time</strong> em tempo real</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <QrCode size={16} style={{ color: "#06b6d4" }} />
            QR Code (proxima versao)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Em breve sera possivel gerar e baixar o QR Code do seu link para usar em materiais impressos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
