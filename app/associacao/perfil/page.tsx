"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, KeyRound, Eye, EyeOff } from "lucide-react";

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

interface AssocPerfil {
  id: string;
  nome: string;
  email: string;
  fone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  plano?: string | null;
  status?: string | null;
}

export default function AssociacaoPerfilPage() {
  const [assoc, setAssoc] = useState<AssocPerfil | null>(null);
  const [nome, setNome] = useState("");
  const [fone, setFone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha, setVerNovaSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    fetch("/api/associacao/perfil")
      .then((r) => r.json())
      .then((d: { associacao: AssocPerfil }) => {
        const a = d.associacao;
        setAssoc(a);
        setNome(a.nome ?? "");
        setFone(fmtTelBR(a.fone ?? ""));
        setCidade(a.cidade ?? "");
        setEstado(a.estado ?? "");
      })
      .catch(() => { window.location.href = "/associacao/login"; });
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    try {
      const body: Record<string, unknown> = {
        nome: nome.trim(),
        fone,
        cidade: cidade.trim() || null,
        estado: estado.trim().toUpperCase().slice(0, 2) || null,
      };
      if (novaSenha) {
        body.nova_senha = novaSenha;
        body.senha_atual = senhaAtual;
      }
      const res = await fetch("/api/associacao/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setMensagem({ tipo: "erro", texto: json.error ?? "Erro ao salvar" });
      } else {
        setMensagem({ tipo: "ok", texto: "Dados atualizados com sucesso" });
        setSenhaAtual("");
        setNovaSenha("");
        if (assoc) setAssoc({ ...assoc, nome: nome.trim() });
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "Erro de conexao" });
    } finally {
      setSalvando(false);
    }
  };

  if (!assoc) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors";

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Perfil da Associacao</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Edite seus dados cadastrais e senha de acesso</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <form onSubmit={salvar} className="max-w-lg space-y-4">
          {mensagem && (
            <div className={`rounded-md px-4 py-2.5 text-sm ${mensagem.tipo === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {mensagem.texto}
            </div>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-violet-500" />
                Dados da Associacao
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
                <input value={assoc.email} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                <p className="text-[10px] text-muted-foreground/60 mt-1">O email nao pode ser alterado</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nome da Associacao</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Telefone</label>
                  <input
                    value={fone}
                    onChange={(e) => setFone(fmtTelBR(e.target.value))}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Estado (UF)</label>
                  <input
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                    maxLength={2}
                    placeholder="SP"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Cidade</label>
                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  maxLength={100}
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 px-3 py-2 rounded-md border border-border bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plano</p>
                  <p className="text-sm font-semibold capitalize">{assoc.plano ?? "trial"}</p>
                </div>
                <div className="flex-1 px-3 py-2 rounded-md border border-border bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                  <p className="text-sm font-semibold capitalize">{assoc.status ?? "ativo"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-violet-500" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <p className="text-[11px] text-muted-foreground">Preencha apenas se quiser alterar a senha atual</p>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Senha Atual</label>
                <div className="relative">
                  <input
                    type={verSenhaAtual ? "text" : "password"}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className={`${inputCls} pr-10`}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setVerSenhaAtual((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {verSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nova Senha</label>
                <div className="relative">
                  <input
                    type={verNovaSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    minLength={novaSenha ? 6 : undefined}
                    className={`${inputCls} pr-10`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setVerNovaSenha((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {verNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            <Save className="h-4 w-4" />
            {salvando ? "Salvando..." : "Salvar Alteracoes"}
          </button>
        </form>
      </div>
    </div>
  );
}
