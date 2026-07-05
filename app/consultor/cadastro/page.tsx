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
  .login-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 20px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #031a2e, #0a2a4a, #063d20, #021a0e, #0a2a4a, #031a2e);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .login-glow {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 70%);
    top: -100px; left: -100px;
    animation: glowPulse 6s ease-in-out infinite;
    pointer-events: none;
  }
  .login-glow2 {
    position: absolute; width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(108,143,212,.15) 0%, transparent 70%);
    bottom: -80px; right: -80px;
    animation: glowPulse 8s ease-in-out infinite reverse;
    pointer-events: none;
  }
  .particle {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.15);
    animation: particle linear infinite;
    pointer-events: none;
  }
  .login-card {
    position: relative; width: 100%; max-width: 400px; text-align: center;
    background: rgba(255,255,255,.07); backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.13); border-radius: 28px;
    padding: 40px 32px 36px; box-shadow: 0 24px 80px rgba(0,0,0,.6);
    animation: fadeUp .6s ease both;
  }
  .logo-wrap { display: flex; justify-content: center; margin-bottom: 10px; animation: floatLogo 4s ease-in-out infinite; }
  .campo-login {
    width: 100%; padding: 12px 14px; margin-bottom: 12px; box-sizing: border-box;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
    border-radius: 10px; font-size: 14px; color: #fff; outline: none;
    font-family: inherit; transition: border-color .2s, background .2s;
  }
  .campo-login:focus { border-color: rgba(255,255,255,.45); background: rgba(255,255,255,.13); }
  .campo-login::placeholder { color: rgba(255,255,255,.38); }
  .senha-wrap { position: relative; margin-bottom: 12px; }
  .senha-wrap .campo-login { margin-bottom: 0; padding-right: 44px; }
  .olho-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.45);
    display: flex; align-items: center; padding: 4px; transition: color .15s;
  }
  .olho-btn:hover { color: rgba(255,255,255,.8); }
  .btn-entrar {
    width: 100%; padding: 14px; border: none; border-radius: 10px;
    background: linear-gradient(135deg,#0a5c2e,#10b981);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1px;
    cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s;
    margin-top: 4px;
  }
  .btn-entrar:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .btn-entrar:disabled { opacity: .6; cursor: not-allowed; }
`;

export default function ConsultorCadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/consultor-cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, email: email || null, senha }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao cadastrar");
      } else {
        setSucesso(true);
        setTimeout(() => router.push("/consultor/login"), 2500);
      }
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="login-page">
        <div className="login-glow" />
        <div className="login-glow2" />
        {PARTICLES.map((p, i) => (
          <div key={i} className="particle" style={{
            width: p.w, height: p.w, left: p.left, bottom: "-20px",
            animationDelay: p.delay, animationDuration: p.dur,
          }} />
        ))}

        <div className="login-card">
          <div className="logo-wrap">
            <img src="/logo-indique.png" style={{ width: 120, height: 120, objectFit: "contain" }} alt="Indique Placa" />
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.35)",
            borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700,
            letterSpacing: 1, color: "#10B981", textTransform: "uppercase", marginBottom: 8,
          }}>CONSULTOR</div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 22 }}>
            Crie sua conta de consultor
          </div>

          {sucesso ? (
            <div style={{
              background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.3)",
              borderRadius: 10, padding: "16px 12px", fontSize: 13, color: "#34d399",
              fontWeight: 600,
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

              <form onSubmit={cadastrar}>
                <input className="campo-login" type="text" placeholder="Seu nome completo" value={nome} required
                  onChange={(e) => setNome(e.target.value)} />
                <input className="campo-login" type="tel" placeholder="WhatsApp (somente numeros)" value={telefone} required
                  onChange={(e) => setTelefone(e.target.value)} />
                <input className="campo-login" type="email" placeholder="E-mail (opcional)" value={email}
                  onChange={(e) => setEmail(e.target.value)} />
                <div className="senha-wrap">
                  <input className="campo-login" type={verSenha ? "text" : "password"} placeholder="Crie uma senha (min. 6 caracteres)" value={senha} required minLength={6}
                    onChange={(e) => setSenha(e.target.value)} />
                  <button type="button" className="olho-btn" onClick={() => setVerSenha(v => !v)} tabIndex={-1}>
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
                <button className="btn-entrar" type="submit" disabled={carregando}>
                  {carregando ? "CADASTRANDO..." : "CRIAR CONTA"}
                </button>
              </form>

              <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.6 }}>
                Ja tem conta?{" "}
                <a href="/consultor/login" style={{ color: "rgba(255,255,255,.6)", textDecoration: "none" }}>
                  Entrar aqui
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
