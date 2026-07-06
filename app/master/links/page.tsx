"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Copy, MessageCircle, CheckCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://indiqueplaca.com.br";

const links = [
  {
    titulo: "Link do Consultor",
    descricao: "Pagina de cadastro para novos consultores se registrarem na plataforma",
    url: `${BASE}/consultor/cadastro`,
    cor: "border-t-blue-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    badge: "CONSULTOR",
    badgeColor: "bg-blue-500/10 text-blue-500",
  },
  {
    titulo: "Link do Indicador",
    descricao: "Pagina para captadores de leads se cadastrarem e indicarem clientes",
    url: `${BASE}/indicador/cadastro`,
    cor: "border-t-violet-500",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    badge: "INDICADOR",
    badgeColor: "bg-violet-500/10 text-violet-500",
  },
  {
    titulo: "Link Indique",
    descricao: "Formulário público para envio de indicações de clientes",
    url: `${BASE}/indique`,
    cor: "border-t-amber-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    badge: "INDIQUE",
    badgeColor: "bg-amber-500/10 text-amber-500",
  },
  {
    titulo: "Recuperar Senha",
    descricao: "Página para consultores redefinam a própria senha de acesso",
    url: `${BASE}/consultor/recuperar-senha`,
    cor: "border-t-emerald-500",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    badge: "SUPORTE",
    badgeColor: "bg-emerald-500/10 text-emerald-500",
  },
];

function LinkCard({ link }: { link: (typeof links)[0] }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(link.url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const whatsapp = () => {
    const texto = encodeURIComponent(`Acesse pelo link: ${link.url}`);
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  return (
    <Card className={cn("border-t-4 shadow-sm", link.cor)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", link.iconBg)}>
            <Link2 className={cn("h-5 w-5", link.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-foreground">{link.titulo}</h3>
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", link.badgeColor)}>{link.badge}</span>
            </div>
            <p className="text-xs text-muted-foreground">{link.descricao}</p>
          </div>
        </div>

        {/* URL */}
        <div className="bg-muted/60 rounded-lg px-3 py-2.5 mb-4 font-mono text-xs text-muted-foreground truncate border border-border">
          {link.url}
        </div>

        {/* Acoes */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2 text-xs"
            onClick={copiar}
          >
            {copiado ? (
              <><CheckCheck className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-500">Copiado!</span></>
            ) : (
              <><Copy className="h-3.5 w-3.5" />Copiar link</>
            )}
          </Button>
          <Button
            size="sm"
            className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={whatsapp}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LinksPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Links de Captura</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Links para compartilhar e captar consultores, indicadores e leads</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="grid grid-cols-2 gap-5">
          {links.map((link) => (
            <LinkCard key={link.titulo} link={link} />
          ))}
        </div>
      </div>
    </div>
  );
}
