"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Crown, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

interface Gestor {
  id: string;
  nome: string;
  email: string;
  fone: string | null;
  plano: string;
  plano_ativo_ate: string | null;
  criado_em: string;
}

export default function GestorPerfilPage() {
  const [gestor, setGestor] = useState<Gestor | null>(null);
  const [nome, setNome] = useState("");
  const [fone, setFone] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha, setVerNovaSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    fetch("/api/gestor/perfil")
      .then((r) => r.json())
      .then((d: Gestor) => {
        setGestor(d);
        setNome(d.nome ?? "");
        setFone(fmtTelBR(d.fone ?? ""));
      })
      .catch(() => { window.location.href = "/gestor/login"; });
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha && !senhaAtual) {
      setMensagem({ tipo: "erro", texto: "Informe a senha atual para alterar a senha" });
      return;
    }
    setSalvando(true);
    setMensagem(null);
    try {
      const body: Record<string, unknown> = { nome: nome.trim(), fone };
      if (novaSenha) { body.nova_senha = novaSenha; body.senha_atual = senhaAtual; }

      const res = await fetch("/api/gestor/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.error ?? "Erro ao salvar" });
      } else {
        setMensagem({ tipo: "ok", texto: "Perfil atualizado com sucesso!" });
        setSenhaAtual("");
        setNovaSenha("");
        setGestor((g) => g ? { ...g, nome: nome.trim() } : g);
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "Erro de conexao. Tente novamente." });
    } finally {
      setSalvando(false);
    }
  };

  if (!gestor) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const isPro = gestor.plano === "pro";
  const campo = "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-cyan-500 transition-colors";

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Meu Perfil</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Edite suas informacoes e senha</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-lg space-y-4">

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-900 to-emerald-900 flex items-center justify-center text-white text-2xl font-bold border border-cyan-500/30 shrink-0">
                  {gestor.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-foreground truncate">{gestor.nome}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{gestor.email}</div>
                  <div className="mt-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                      isPro
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {isPro && <Crown className="h-3 w-3" />}
                      Plano {isPro ? "Pro" : "Free"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {mensagem && (
            <div className={cn(
              "px-4 py-3 rounded-lg text-sm font-medium",
              mensagem.tipo === "ok"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                : "bg-red-500/10 border border-red-500/20 text-red-500"
            )}>
              {mensagem.texto}
            </div>
          )}

          <form onSubmit={salvar} className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Nome completo
                  </label>
                  <input className={campo} type="text" value={nome} required minLength={2} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    E-mail
                  </label>
                  <input className={cn(campo, "opacity-60 cursor-not-allowed")} type="email" value={gestor.email} disabled />
                  <p className="text-[10px] text-muted-foreground mt-1">O e-mail nao pode ser alterado</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <Phone className="inline h-3 w-3 mr-1" />WhatsApp
                  </label>
                  <input className={campo} type="tel" value={fone} placeholder="(87) 99999-9999" onChange={(e) => setFone(fmtTelBR(e.target.value))} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Alterar Senha
                  <span className="text-[10px] font-normal text-muted-foreground">(opcional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Senha atual</label>
                  <div className="relative">
                    <input
                      className={cn(campo, "pr-10")}
                      type={verSenhaAtual ? "text" : "password"}
                      value={senhaAtual}
                      placeholder="Digite sua senha atual"
                      onChange={(e) => setSenhaAtual(e.target.value)}
                    />
                    <button type="button" onClick={() => setVerSenhaAtual((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {verSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nova senha</label>
                  <div className="relative">
                    <input
                      className={cn(campo, "pr-10")}
                      type={verNovaSenha ? "text" : "password"}
                      value={novaSenha}
                      placeholder="Minimo 6 caracteres"
                      onChange={(e) => setNovaSenha(e.target.value)}
                    />
                    <button type="button" onClick={() => setVerNovaSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {verNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <button
              type="submit"
              disabled={salvando || !nome.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {salvando ? "Salvando..." : "Salvar Alteracoes"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
