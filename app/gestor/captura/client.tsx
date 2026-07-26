"use client";

import { useState } from "react";
import { Copy, Check, Share2, Users, Target, QrCode } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function LinkCard({
  titulo,
  descricao,
  icone,
  link,
  shareTitle,
  shareText,
  copiadoKey,
}: {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  link: string;
  shareTitle: string;
  shareText: string;
  copiadoKey: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("input");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const compartilhar = async () => {
    if (navigator.share) {
      await navigator.share({ title: shareTitle, text: shareText, url: link });
    } else {
      copiar();
    }
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          {icone}
          {titulo}
        </CardTitle>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{descricao}</p>
      </CardHeader>
      <CardContent>
        <div
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13,
            color: "#67e8f9",
            wordBreak: "break-all",
            marginBottom: 14,
            fontFamily: "monospace",
          }}
        >
          {link}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={copiar} style={{ flex: 1, minWidth: 120, gap: 6 }}>
            {copiado ? <Check size={15} /> : <Copy size={15} />}
            {copiado ? "Copiado!" : "Copiar link"}
          </Button>
          <Button variant="outline" onClick={compartilhar} style={{ flex: 1, minWidth: 120, gap: 6 }}>
            <Share2 size={15} />
            Compartilhar
          </Button>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link
            href="/gestor/qrcode"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#06b6d4",
              textDecoration: "none",
            }}
          >
            <QrCode size={14} />
            Gerar QR Code
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GestorCapturaClient({
  gestorId,
  nomeGestor,
}: {
  gestorId: string;
  nomeGestor: string;
}) {
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://indiqueplaca.com.br";

  const linkConsultor = `${baseUrl}/captura/consultor/${gestorId}`;
  const linkLeads = `${baseUrl}/captura/gestor/${gestorId}`;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
          Link de Captura
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8" }}>
          Voce tem dois links exclusivos: um para recrutar consultores e outro para receber leads diretamente.
        </p>
      </div>

      <LinkCard
        titulo="Recrutar Consultores"
        descricao="Compartilhe para recrutar novos consultores. Ao se cadastrar, eles ficam vinculados a voce automaticamente."
        icone={<Users size={16} style={{ color: "#06b6d4" }} />}
        link={linkConsultor}
        shareTitle="Seja Consultor - Indique Placa"
        shareText={`${nomeGestor} te convidou para ser consultor no Indique Placa. Cadastre-se:`}
        copiadoKey="consultor"
      />

      <LinkCard
        titulo="Captura de Leads"
        descricao="Link direto para receber indicacoes e leads sem passar por consultor. Use em anuncios ou materiais proprios."
        icone={<Target size={16} style={{ color: "#a78bfa" }} />}
        link={linkLeads}
        shareTitle="Indique sua Placa - Indique Placa"
        shareText={`Indique sua placa e receba uma oferta. Acesse:`}
        copiadoKey="leads"
      />

      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 15 }}>Como funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <ol style={{ paddingLeft: 18, color: "#94a3b8", fontSize: 14, lineHeight: 2 }}>
            <li>Compartilhe o link desejado no WhatsApp, Instagram ou onde preferir</li>
            <li>A pessoa clica e preenche o formulario rapidamente</li>
            <li>Consultores entram direto na sua equipe, sem aprovacao manual</li>
            <li>Leads chegam direto para voce em tempo real</li>
            <li>Acompanhe tudo em <strong style={{ color: "#e2e8f0" }}>Meu Time</strong> e no painel de leads</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
