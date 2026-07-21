"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PARTICLES = [
  { w: 4, left: "10%", delay: "0s",  dur: "8s"  },
  { w: 6, left: "25%", delay: "2s",  dur: "11s" },
  { w: 3, left: "50%", delay: "4s",  dur: "7s"  },
  { w: 5, left: "70%", delay: "1s",  dur: "10s" },
  { w: 4, left: "85%", delay: "3s",  dur: "9s"  },
  { w: 7, left: "40%", delay: "5s",  dur: "13s" },
];

const STYLES = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes floatLogo {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(1.08); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes particle {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
    100% { transform: translateY(-100vh) translateX(20px) scale(0); opacity: 0; }
  }
  .gcad-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 20px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #022c22, #064e3b, #065f46, #0369a1, #075985, #022c22);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .gcad-glow {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(6,95,70,.35) 0%, transparent 70%);
    top: -100px; left: -100px;
    animation: glowPulse 6s ease-in-out infinite;
    pointer-events: none;
  }
  .gcad-glow2 {
    position: absolute; width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(3,105,161,.28) 0%, transparent 70%);
    bottom: -80px; right: -80px;
    animation: glowPulse 8s ease-in-out infinite reverse;
    pointer-events: none;
  }
  .gcad-particle {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.12);
    animation: particle linear infinite;
    pointer-events: none;
  }
  .gcad-card {
    position: relative; width: 100%; max-width: 400px; text-align: center;
    background: rgba(255,255,255,.07); backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.13); border-radius: 28px;
    padding: 36px 32px 32px; box-shadow: 0 24px 80px rgba(0,0,0,.6);
    animation: fadeUp .6s ease both;
  }
  .gcad-logo-wrap { display: flex; justify-content: center; margin-bottom: 10px; animation: floatLogo 4s ease-in-out infinite; }
  .gcad-campo {
    width: 100%; padding: 12px 14px; margin-bottom: 10px; box-sizing: border-box;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
    border-radius: 10px; font-size: 14px; color: #fff; outline: none;
    font-family: inherit; transition: border-color .2s, background .2s;
  }
  .gcad-campo:focus { border-color: rgba(6,182,212,.6); background: rgba(255,255,255,.13); }
  .gcad-campo::placeholder { color: rgba(255,255,255,.38); }
  .gcad-senha-wrap { position: relative; margin-bottom: 10px; }
  .gcad-senha-wrap .gcad-campo { margin-bottom: 0; padding-right: 44px; }
  .gcad-olho-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.45);
    display: flex; align-items: center; padding: 4px; transition: color .15s;
  }
  .gcad-olho-btn:hover { color: rgba(255,255,255,.8); }
  .gcad-btn {
    width: 100%; padding: 14px; border: none; border-radius: 10px; margin-top: 6px;
    background: linear-gradient(135deg, #065f46 0%, #0369a1 50%, #0891b2 100%);
    box-shadow: 0 4px 20px rgba(6,182,212,.35);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1px;
    text-shadow: 0 1px 2px rgba(0,0,0,.3);
    cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s;
  }
  .gcad-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .gcad-btn:disabled { opacity: .6; cursor: not-allowed; }
`;

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export default function GestorCadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [fone, setFone] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/gestor/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), fone: fone.replace(/\D/g, ""), senha }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao cadastrar"); return; }
      setSucesso(true);
      setTimeout(() => router.push("/gestor/login"), 2500);
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="gcad-page">
        <div className="gcad-glow" />
        <div className="gcad-glow2" />
        {PARTICLES.map((p, i) => (
          <div key={i} className="gcad-particle" style={{
            width: p.w, height: p.w, left: p.left, bottom: "-20px",
            animationDelay: p.delay, animationDuration: p.dur,
          }} />
        ))}

        <div className="gcad-card">
          <div className="gcad-logo-wrap">
            <img src="/logo-indique.png" style={{ width: 100, height: 100, objectFit: "contain" }} alt="Indique Placa" />
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(6,95,70,.2)", border: "1px solid rgba(6,182,212,.35)",
            borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700,
            letterSpacing: 1, color: "#67e8f9", textTransform: "uppercase", marginBottom: 6,
          }}>CADASTRO DE GESTOR</div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 20 }}>
            Crie sua conta de lider de equipe
          </div>

          {sucesso ? (
            <div style={{
              background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.3)",
              borderRadius: 10, padding: "16px", fontSize: 13, color: "#34d399",
            }}>
              Cadastro realizado! Redirecionando para o login...
            </div>
          ) : (
            <>
              {erro && (
                <div style={{
                  background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12,
                }}>{erro}</div>
              )}

              <form onSubmit={enviar}>
                <input
                  className="gcad-campo"
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  required
                  autoComplete="name"
                  onChange={(e) => setNome(e.target.value)}
                />
                <input
                  className="gcad-campo"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  required
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="gcad-campo"
                  type="tel"
                  placeholder="WhatsApp com DDD"
                  value={fone}
                  required
                  onChange={(e) => setFone(fmtTelBR(e.target.value))}
                />
                <div className="gcad-senha-wrap">
                  <input
                    className="gcad-campo"
                    type={verSenha ? "text" : "password"}
                    placeholder="Senha (min. 6 caracteres)"
                    value={senha}
                    required
                    minLength={6}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button type="button" className="gcad-olho-btn" onClick={() => setVerSenha((v) => !v)} tabIndex={-1}>
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
                <button className="gcad-btn" type="submit" disabled={carregando || !nome || !email || !senha || senha.length < 6}>
                  {carregando ? "CADASTRANDO..." : "CRIAR CONTA"}
                </button>
              </form>

              <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.9 }}>
                Ja tem conta?{" "}
                <a href="/gestor/login" style={{ color: "rgba(103,232,249,.8)", textDecoration: "none" }}>
                  Entrar
                </a>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,.2)", textAlign: "center", lineHeight: 1.6 }}>
                Ao se cadastrar, voce concorda com os{" "}
                <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(103,232,249,.45)", textDecoration: "underline" }}>Termos de Uso</a>
                {" "}e a{" "}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(103,232,249,.45)", textDecoration: "underline" }}>Politica de Privacidade</a>.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
