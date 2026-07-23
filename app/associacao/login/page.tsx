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
  .assoc-login-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 20px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca, #3730a3, #1e1b4b);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .assoc-login-glow {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,.35) 0%, transparent 70%);
    top: -100px; left: -100px;
    animation: glowPulse 6s ease-in-out infinite;
    pointer-events: none;
  }
  .assoc-login-glow2 {
    position: absolute; width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,.28) 0%, transparent 70%);
    bottom: -80px; right: -80px;
    animation: glowPulse 8s ease-in-out infinite reverse;
    pointer-events: none;
  }
  .assoc-particle {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.12);
    animation: particle linear infinite;
    pointer-events: none;
  }
  .assoc-login-card {
    position: relative; width: 100%; max-width: 380px; text-align: center;
    background: rgba(255,255,255,.07); backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.13); border-radius: 28px;
    padding: 40px 32px 36px; box-shadow: 0 24px 80px rgba(0,0,0,.6);
    animation: fadeUp .6s ease both;
  }
  .assoc-logo-wrap { display: flex; justify-content: center; margin-bottom: 10px; animation: floatLogo 4s ease-in-out infinite; }
  .assoc-campo {
    width: 100%; padding: 12px 14px; margin-bottom: 12px; box-sizing: border-box;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
    border-radius: 10px; font-size: 14px; color: #fff; outline: none;
    font-family: inherit; transition: border-color .2s, background .2s;
  }
  .assoc-campo:focus { border-color: rgba(139,92,246,.6); background: rgba(255,255,255,.13); }
  .assoc-campo::placeholder { color: rgba(255,255,255,.38); }
  .assoc-senha-wrap { position: relative; margin-bottom: 16px; }
  .assoc-senha-wrap .assoc-campo { margin-bottom: 0; padding-right: 44px; }
  .assoc-olho-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.45);
    display: flex; align-items: center; padding: 4px; transition: color .15s;
  }
  .assoc-olho-btn:hover { color: rgba(255,255,255,.8); }
  .assoc-btn-entrar {
    width: 100%; padding: 14px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #6d28d9 100%);
    box-shadow: 0 4px 20px rgba(139,92,246,.35);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1px;
    text-shadow: 0 1px 2px rgba(0,0,0,.3);
    cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s;
  }
  .assoc-btn-entrar:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .assoc-btn-entrar:disabled { opacity: .6; cursor: not-allowed; }
`;

export default function AssociacaoLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/associacao/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Credenciais invalidas");
      else router.push("/associacao/dashboard");
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="assoc-login-page">
        <div className="assoc-login-glow" />
        <div className="assoc-login-glow2" />
        {PARTICLES.map((p, i) => (
          <div key={i} className="assoc-particle" style={{
            width: p.w, height: p.w, left: p.left, bottom: "-20px",
            animationDelay: p.delay, animationDuration: p.dur,
          }} />
        ))}

        <div className="assoc-login-card">
          <div className="assoc-logo-wrap">
            <img src="/logo-indique.png" style={{ width: 120, height: 120, objectFit: "contain" }} alt="Indique Placa" />
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(67,56,202,.2)", border: "1px solid rgba(139,92,246,.35)",
            borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700,
            letterSpacing: 1, color: "#c4b5fd", textTransform: "uppercase", marginBottom: 8,
          }}>ASSOCIACAO</div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 22 }}>
            Acesso do Painel da Associacao
          </div>

          {erro && (
            <div style={{
              background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12,
            }}>{erro}</div>
          )}

          <form onSubmit={entrar}>
            <input
              className="assoc-campo"
              type="email"
              placeholder="seu@email.com"
              value={email}
              required
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="assoc-senha-wrap">
              <input
                className="assoc-campo"
                type={verSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                required
                onChange={(e) => setSenha(e.target.value)}
              />
              <button type="button" className="assoc-olho-btn" onClick={() => setVerSenha((v) => !v)} tabIndex={-1}>
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
            <button className="assoc-btn-entrar" type="submit" disabled={carregando}>
              {carregando ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>
          <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,.35)", textAlign: "center" }}>
            <a href="/associacao/recuperar-senha" style={{ color: "rgba(196,181,253,.8)", textDecoration: "none" }}>
              Esqueceu a senha?
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
