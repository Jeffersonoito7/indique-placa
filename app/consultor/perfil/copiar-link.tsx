"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCheck, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CopiarLink({ titulo, descricao, url, cor }: {
  titulo: string; descricao: string; url: string; cor: "blue" | "violet";
}) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const whatsapp = () => {
    const texto = encodeURIComponent(`Acesse pelo link: ${url}`);
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  const corClasse = cor === "blue"
    ? { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" }
    : { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20" };

  return (
    <div className={cn("rounded-xl border p-4", corClasse.border, corClasse.bg)}>
      <div className="mb-2">
        <div className={cn("text-xs font-bold mb-0.5", corClasse.text)}>{titulo}</div>
        <div className="text-[11px] text-muted-foreground">{descricao}</div>
      </div>
      <div className="bg-background/60 rounded-lg px-3 py-2 mb-3 font-mono text-xs text-muted-foreground truncate border border-border">{url}</div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 gap-2 text-xs" onClick={copiar}>
          {copiado ? <><CheckCheck className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-500">Copiado!</span></> : <><Copy className="h-3.5 w-3.5" />Copiar</>}
        </Button>
        <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={whatsapp}>
          <MessageCircle className="h-3.5 w-3.5" />WhatsApp
        </Button>
      </div>
    </div>
  );
}
