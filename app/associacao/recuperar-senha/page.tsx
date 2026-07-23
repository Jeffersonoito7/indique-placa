"use client";

import { useState } from "react";

const STYLES = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .grec-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 20px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca, #7c3aed, #6d28d9, #1e1b4b);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .grec-card {
    position: relative; width: 100%; max-width: 380px; text-align: center;
    background: rgba(255,255,255,.07); backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.13); border-radius: 28px;
    padding: 40px 32px 36px; box-shadow: 0 24px 80px rgba(0,0,0,.6);
    animation: fadeUp .6s ease both;
  }
  .grec-campo {
    width: 100%; padding: 12px 14px; margin-bottom: 10px; box-sizing: border-box;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
    border-radius: 10px; font-size: 14px; color: #fff; outline: none;
    font-family: inherit; transition: border-color .2s, background .2s;
  }
  .grec-campo:focus { border-color: rgba(167,139,250,.6); background: rgba(255,255,255,.13); }
  .grec-campo::placeholder { color: rgba(255,255,255,.38); }
  .grec-senha-wrap { position: relative; margin-bottom: 10px; }
  .grec-senha-wrap .grec-campo { margin-bottom: 0; padding-right: 44px; }
  .grec-olho-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.45);
    display: flex; align-items: center; padding: 4px; transition: color .15s;
  }
  .grec-olho-btn:hover { color: rgba(255,255,255,.8); }
  .grec-btn {
    width: 100%; padding: 14px; border: none; border-radius: 10px; margin-top: 6px;
    background: linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #9333ea 100%);
    box-shadow: 0 4px 20px rgba(124,58,237,.4);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1px;
    cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s;
  }
  .grec-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .grec-btn:disabled { opacity: .6; cursor: not-allowed; }
  .grec-otp {
    display: flex; gap: 8px; justify-content: center; margin-bottom: 12px;
  }
  .grec-otp input {
    width: 44px; height: 52px; text-align: center; font-size: 22px; font-weight: 800;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2);
    border-radius: 10px; color: #fff; outline: none; font-family: inherit;
    transition: border-color .2s;
  }
  .grec-otp input:focus { border-color: rgba(167,139,250,.6); }
`;

type Etapa = "email" | "codigo" | "nova-senha" | "ok";

export default function AssociacaoRecuperarSenhaPage() {
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [novaSenha, setNovaSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const codigoCompleto = codigo.join("");

  const enviarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/associacao/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao enviar codigo"); return; }
      setEtapa("codigo");
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoCompleto.length !== 6) { setErro("Digite os 6 digitos do codigo"); return; }
    setEtapa("nova-senha");
    setErro("");
  };

  const redefinir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) { setErro("A senha deve ter no minimo 6 caracteres"); return; }
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/associacao/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), codigo: codigoCompleto, novaSenha }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao redefinir senha"); setEtapa("codigo"); return; }
      setEtapa("ok");
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleOtp = (i: number, val: string) => {
    const num = val.replace(/\D/g, "").slice(-1);
    const novo = [...codigo];
    novo[i] = num;
    setCodigo(novo);
    if (num && i < 5) {
      const next = document.getElementById(`grec-otp-${i + 1}`);
      (next as HTMLInputElement)?.focus();
    }
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codigo[i] && i > 0) {
      const prev = document.getElementById(`grec-otp-${i - 1}`);
      (prev as HTMLInputElement)?.focus();
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="grec-page">
        <div className="grec-card">
          <div style={{ fontSize: 28, marginBottom: 6 }}>
            {etapa === "ok" ? "✓" : "🔐"}
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(67,56,202,.25)", border: "1px solid rgba(167,139,250,.35)",
            borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700,
            letterSpacing: 1, color: "#c4b5fd", textTransform: "uppercase", marginBottom: 8,
          }}>ASSOCIACAO</div>

          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
            {etapa === "email" && "Recuperar Senha"}
            {etapa === "codigo" && "Digite o Codigo"}
            {etapa === "nova-senha" && "Nova Senha"}
            {etapa === "ok" && "Senha Redefinida!"}
          </div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginBottom: 22, lineHeight: 1.5 }}>
            {etapa === "email" && "Informe o e-mail da sua associacao para receber o codigo"}
            {etapa === "codigo" && `Enviamos um codigo para ${email}`}
            {etapa === "nova-senha" && "Escolha uma nova senha para sua conta"}
            {etapa === "ok" && "Sua senha foi atualizada com sucesso"}
          </div>

          {erro && (
            <div style={{
              background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12,
            }}>{erro}</div>
          )}

          {etapa === "email" && (
            <form onSubmit={enviarEmail}>
              <input
                className="grec-campo"
                type="email"
                placeholder="email@suaassociacao.com"
                value={email}
                required
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="grec-btn" type="submit" disabled={carregando || !email}>
                {carregando ? "ENVIANDO..." : "ENVIAR CODIGO"}
              </button>
            </form>
          )}

          {etapa === "codigo" && (
            <form onSubmit={verificarCodigo}>
              <div className="grec-otp">
                {codigo.map((d, i) => (
                  <input
                    key={i}
                    id={`grec-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtp(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button className="grec-btn" type="submit" disabled={codigoCompleto.length !== 6}>
                CONFIRMAR CODIGO
              </button>
              <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                <span
                  style={{ color: "rgba(196,181,253,.8)", cursor: "pointer" }}
                  onClick={() => setEtapa("email")}
                >
                  Reenviar codigo
                </span>
              </div>
            </form>
          )}

          {etapa === "nova-senha" && (
            <form onSubmit={redefinir}>
              <div className="grec-senha-wrap">
                <input
                  className="grec-campo"
                  type={verSenha ? "text" : "password"}
                  placeholder="Nova senha (min. 6 caracteres)"
                  value={novaSenha}
                  required
                  minLength={6}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
                <button type="button" className="grec-olho-btn" onClick={() => setVerSenha((v) => !v)} tabIndex={-1}>
                  {verSenha ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <button className="grec-btn" type="submit" disabled={carregando || novaSenha.length < 6}>
                {carregando ? "SALVANDO..." : "REDEFINIR SENHA"}
              </button>
            </form>
          )}

          {etapa === "ok" && (
            <a
              href="/associacao/login"
              style={{
                display: "block", padding: "14px", borderRadius: 10, marginTop: 4,
                background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #9333ea 100%)",
                color: "#fff", fontWeight: 800, fontSize: 14, letterSpacing: 1,
                textDecoration: "none", boxShadow: "0 4px 20px rgba(124,58,237,.4)",
              }}
            >
              IR PARA O LOGIN
            </a>
          )}

          {etapa !== "ok" && (
            <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,.35)" }}>
              <a href="/associacao/login" style={{ color: "rgba(196,181,253,.8)", textDecoration: "none" }}>
                Voltar ao login
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
