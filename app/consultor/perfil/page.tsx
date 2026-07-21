"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Camera, Save, Link2, KeyRound, Eye, EyeOff } from "lucide-react";
import CopiarLink from "./copiar-link";

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

interface ConsultorPerfil {
  id: string;
  nome: string;
  sobrenome?: string | null;
  fone: string;
  email?: string | null;
  foto_url?: string | null;
}

export default function ConsultorPerfilPage() {
  const [consultor, setConsultor] = useState<ConsultorPerfil | null>(null);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [fone, setFone] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [verSenhaAtual, setVerSenhaAtual] = useState(false);
  const [verNovaSenha, setVerNovaSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/consultor/perfil/dados")
      .then((r) => r.json())
      .then((d: ConsultorPerfil) => {
        setConsultor(d);
        setNome(d.nome ?? "");
        setSobrenome(d.sobrenome ?? "");
        setFone(fmtTelBR(d.fone ?? ""));
        setFotoUrl(d.foto_url ?? null);
      })
      .catch(() => {
        window.location.href = "/consultor/login";
      });
  }, []);

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadando(true);
    setMensagem(null);
    try {
      const fd = new FormData();
      fd.append("foto", file);
      const res = await fetch("/api/consultor/perfil/foto", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setMensagem({ tipo: "erro", texto: json.error ?? "Erro ao enviar foto" }); return; }
      setFotoUrl(json.url);
    } catch {
      setMensagem({ tipo: "erro", texto: "Erro de conexao. Tente novamente." });
    } finally {
      setUploadando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha && !senhaAtual) {
      setMensagem({ tipo: "erro", texto: "Informe a senha atual para alterar a senha" });
      return;
    }
    setSalvando(true);
    setMensagem(null);
    try {
      const body: Record<string, unknown> = { nome: nome.trim(), sobrenome: sobrenome.trim(), fone };
      if (novaSenha) { body.nova_senha = novaSenha; body.senha_atual = senhaAtual; }

      const res = await fetch("/api/consultor/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setMensagem({ tipo: "erro", texto: json.error ?? "Erro ao salvar" }); return; }
      setMensagem({ tipo: "ok", texto: "Perfil atualizado com sucesso!" });
      setSenhaAtual("");
      setNovaSenha("");
    } catch {
      setMensagem({ tipo: "erro", texto: "Erro de conexao. Tente novamente." });
    } finally {
      setSalvando(false);
    }
  };

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://indiqueplaca.com.br";
  const linkIndicacao = consultor ? `${base}/indique?c=${consultor.id}` : "";
  const linkIndicador = consultor ? `${base}/indicador/cadastro?c=${consultor.id}` : "";

  const iniciais = `${nome.charAt(0)}${sobrenome.charAt(0) || nome.charAt(1) || ""}`.toUpperCase();

  if (!consultor) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Meu Perfil</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Seus dados e links de captacao</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-2xl space-y-5">

          {/* Foto de perfil */}
          <Card className="border-t-4 border-t-emerald-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" /> Foto de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 flex items-center gap-6">
              <div className="relative flex-shrink-0">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt="Foto de perfil"
                    className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center border-2 border-emerald-500/30">
                    <span className="text-2xl font-black text-white">{iniciais || "?"}</span>
                  </div>
                )}
                {uploadando && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-3">JPG, PNG ou WebP. Maximo 2MB.</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadando}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                  Alterar foto
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFoto}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados */}
          <Card className="border-t-4 border-t-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" /> Dados Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={salvar} className="space-y-4">
                {mensagem && (
                  <div className={`text-xs px-3 py-2 rounded-lg border ${mensagem.tipo === "ok" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-500"}`}>
                    {mensagem.texto}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nome</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Sobrenome</label>
                    <input
                      type="text"
                      value={sobrenome}
                      onChange={(e) => setSobrenome(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">WhatsApp</label>
                  <input
                    type="tel"
                    value={fone}
                    onChange={(e) => setFone(fmtTelBR(e.target.value))}
                    required
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
                {consultor.email && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
                    <input
                      type="email"
                      value={consultor.email}
                      disabled
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                )}
                {/* Alterar senha */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" /> Alterar Senha (opcional)
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Senha atual</label>
                    <div className="relative">
                      <input
                        type={verSenhaAtual ? "text" : "password"}
                        value={senhaAtual}
                        placeholder="Digite sua senha atual"
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      />
                      <button type="button" onClick={() => setVerSenhaAtual((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {verSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nova senha</label>
                    <div className="relative">
                      <input
                        type={verNovaSenha ? "text" : "password"}
                        value={novaSenha}
                        placeholder="Minimo 6 caracteres"
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      />
                      <button type="button" onClick={() => setVerNovaSenha((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {verNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {salvando ? "Salvando..." : "Salvar alteracoes"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Links */}
          <Card className="border-t-4 border-t-violet-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4 text-violet-500" /> Meus Links de Captacao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <CopiarLink titulo="Link de Indicacao" descricao="Envie para clientes indicarem conhecidos" url={linkIndicacao} cor="blue" />
              <CopiarLink titulo="Link para Indicadores" descricao="Envie para pessoas que querem te ajudar a captar" url={linkIndicador} cor="violet" />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
