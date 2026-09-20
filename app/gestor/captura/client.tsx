"use client";

import { useState } from "react";
import { Copy, Check, Share2, Users, Target, QrCode, UserPlus } from "lucide-react";
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
}: {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  link: string;
  shareTitle: string;
  shareText: string;
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
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {icone}
          {titulo}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
      </CardHeader>
      <CardContent>
        <div className="bg-muted border border-border rounded-lg px-3 py-3 text-xs text-[#00c389] break-all mb-3 font-mono">
          {link}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={copiar} className="flex-1 min-w-[120px] gap-1.5">
            {copiado ? <Check size={14} /> : <Copy size={14} />}
            {copiado ? "Copiado!" : "Copiar link"}
          </Button>
          <Button variant="outline" onClick={compartilhar} className="flex-1 min-w-[120px] gap-1.5">
            <Share2 size={14} />
            Compartilhar
          </Button>
        </div>
        <div className="mt-3">
          <Link
            href="/gestor/qrcode"
            className="inline-flex items-center gap-1.5 text-xs text-[#00c389] hover:opacity-80 transition-opacity"
          >
            <QrCode size={13} />
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
  const linkIndicador = `${baseUrl}/captura/indicador-gestor/${gestorId}`;
  const linkLeads = `${baseUrl}/captura/gestor/${gestorId}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground mb-1">Link de Captura</h1>
        <p className="text-sm text-muted-foreground">
          Você tem dois links exclusivos: um para recrutar consultores e outro para receber leads diretamente.
        </p>
      </div>

      <LinkCard
        titulo="Recrutar Consultores"
        descricao="Compartilhe para recrutar novos consultores. Ao se cadastrar, eles ficam vinculados a você automaticamente."
        icone={<Users size={15} className="text-muted-foreground" />}
        link={linkConsultor}
        shareTitle="Seja Consultor - Indique Placa"
        shareText={`${nomeGestor} te convidou para ser consultor no Indique Placa. Cadastre-se:`}
      />

      <LinkCard
        titulo="Recrutar Indicadores"
        descricao="Compartilhe para que pessoas se cadastrem como indicadores diretamente no seu time, sem precisar de consultor."
        icone={<UserPlus size={15} className="text-muted-foreground" />}
        link={linkIndicador}
        shareTitle="Seja Indicador - Indique Placa"
        shareText={`${nomeGestor} te convidou para ser indicador no Indique Placa. Cadastre-se:`}
      />

      <LinkCard
        titulo="Captura de Leads"
        descricao="Link direto para receber indicações e leads sem passar por consultor. Use em anúncios ou materiais próprios."
        icone={<Target size={15} className="text-muted-foreground" />}
        link={linkLeads}
        shareTitle="Indique sua Placa - Indique Placa"
        shareText="Indique sua placa e receba uma oferta. Acesse:"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Como funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="pl-4 text-sm text-muted-foreground space-y-1.5 list-decimal">
            <li>Compartilhe o link desejado no WhatsApp, Instagram ou onde preferir</li>
            <li>A pessoa clica e preenche o formulário rapidamente</li>
            <li>Consultores entram direto na sua equipe, sem aprovação manual</li>
            <li>Leads chegam direto para você em tempo real</li>
            <li>Acompanhe tudo em <strong className="text-foreground font-semibold">Meu Time</strong> e no painel de leads</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
