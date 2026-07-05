"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, CheckCircle2 } from "lucide-react";

export default function NovaIndicacaoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/indicador/nova-indicacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome_lead: nome, telefone_lead: telefone }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao enviar"); }
      else { setSucesso(true); setNome(""); setTelefone(""); }
    } catch { setErro("Erro de conexao."); }
    finally { setCarregando(false); }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Nova Indicacao</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Indique um conhecido para protecao veicular</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-md">
          {sucesso && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Indicacao enviada com sucesso!</div>
                <div className="text-xs text-muted-foreground mt-0.5">O consultor vai entrar em contato em breve.</div>
              </div>
            </div>
          )}

          <Card className="border-t-4 border-t-amber-500 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-amber-500" />
                Dados do Indicado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={enviar} className="space-y-4">
                {erro && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-500">{erro}</div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome completo</Label>
                  <Input id="nome" placeholder="Ex: Joao da Silva" value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telefone (WhatsApp)</Label>
                  <Input id="telefone" type="tel" placeholder="Ex: 11999999999" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
                </div>
                <Button type="submit" disabled={carregando} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">
                  {carregando ? "Enviando..." : "Enviar Indicacao"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
