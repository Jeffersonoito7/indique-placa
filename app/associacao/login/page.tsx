"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NODES = [
  { x:"5%",  y:"10%", s:3, delay:"0s",   dur:"4.5s"},
  { x:"20%", y:"75%", s:2, delay:"1.4s", dur:"5s"  },
  { x:"48%", y:"6%",  s:4, delay:"0.7s", dur:"3.8s"},
  { x:"70%", y:"60%", s:2, delay:"2.1s", dur:"6s"  },
  { x:"85%", y:"18%", s:3, delay:"0.4s", dur:"4s"  },
  { x:"92%", y:"82%", s:2, delay:"1.9s", dur:"5.5s"},
  { x:"33%", y:"90%", s:3, delay:"1s",   dur:"4.2s"},
  { x:"60%", y:"38%", s:2, delay:"2.5s", dur:"3.6s"},
];

const STREAMS = [
  { left:"9%",  delay:"0s",   dur:"7.5s"},
  { left:"31%", delay:"1.8s", dur:"9.2s"},
  { left:"55%", delay:"3.2s", dur:"6.5s"},
  { left:"77%", delay:"0.9s", dur:"8.3s"},
  { left:"90%", delay:"2.5s", dur:"7s"  },
];

const ACCENT = "#a855f7";
const ACCENT_DIM = "rgba(168,85,247,";

const CSS = `
  @keyframes bgShift {
    0%,100% { background-position:0% 50%; }
    50%      { background-position:100% 50%; }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes floatLogo {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-8px); }
  }
  @keyframes nodePulse {
    0%,100% { opacity:.2; transform:scale(1); }
    50%      { opacity:.65; transform:scale(1.6); }
  }
  @keyframes streamFall {
    0%   { transform:translateY(-100%); opacity:0; }
    10%  { opacity:.55; }
    90%  { opacity:.35; }
    100% { transform:translateY(100vh); opacity:0; }
  }
  @keyframes scanLine {
    0%   { top:-2px; opacity:.4; }
    100% { top:100%; opacity:0; }
  }
  @keyframes borderGlow {
    0%,100% { border-color:${ACCENT_DIM}.2); box-shadow:0 0 30px ${ACCENT_DIM}.05),0 24px 80px rgba(0,0,0,.7); }
    50%      { border-color:${ACCENT_DIM}.45); box-shadow:0 0 50px ${ACCENT_DIM}.12),0 24px 80px rgba(0,0,0,.7); }
  }
  .lp-root {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    padding:20px; position:relative; overflow:hidden;
    background:linear-gradient(135deg,#080212,#120824,#0f0520,#080212,#0a0318);
    background-size:400% 400%;
    animation:bgShift 16s ease infinite;
    font-family:Inter,system-ui,sans-serif;
  }
  .lp-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image:
      linear-gradient(${ACCENT_DIM}.04) 1px,transparent 1px),
      linear-gradient(90deg,${ACCENT_DIM}.04) 1px,transparent 1px);
    background-size:48px 48px;
  }
  .lp-node {
    position:absolute; border-radius:50%;
    background:${ACCENT};
    animation:nodePulse ease-in-out infinite;
    pointer-events:none;
  }
  .lp-stream {
    position:absolute; top:0; width:1px; height:30%;
    background:linear-gradient(to bottom,transparent,${ACCENT_DIM}.45),transparent);
    animation:streamFall linear infinite;
    pointer-events:none;
  }
  .lp-card {
    position:relative; width:100%; max-width:390px; text-align:center;
    background:${ACCENT_DIM}.03); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px);
    border:1px solid ${ACCENT_DIM}.2); border-radius:24px;
    padding:40px 32px 36px;
    animation:fadeUp .55s ease both, borderGlow 4s ease-in-out infinite;
    overflow:hidden;
  }
  .lp-scan {
    position:absolute; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,${ACCENT_DIM}.4),transparent);
    animation:scanLine 3.5s linear infinite;
    pointer-events:none;
  }
  .lp-logo { display:flex; justify-content:center; margin-bottom:10px; animation:floatLogo 4s ease-in-out infinite; }
  .lp-badge {
    display:inline-flex; align-items:center;
    background:${ACCENT_DIM}.12); border:1px solid ${ACCENT_DIM}.35);
    border-radius:6px; padding:3px 12px; font-size:10px; font-weight:700;
    letter-spacing:1.5px; color:#d8b4fe; text-transform:uppercase; margin-bottom:8px;
  }
  .lp-sub { font-size:12px; color:rgba(255,255,255,.4); margin-bottom:24px; }
  .lp-erro {
    background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3);
    border-radius:10px; padding:9px 14px; font-size:12px; color:#f87171; margin-bottom:14px;
  }
  .lp-campo {
    width:100%; padding:13px 15px; margin-bottom:12px; box-sizing:border-box;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
    border-radius:12px; font-size:14px; color:#e2e8f0; outline:none;
    font-family:inherit; transition:border-color .2s,background .2s,box-shadow .2s;
  }
  .lp-campo:focus {
    border-color:${ACCENT_DIM}.55);
    background:${ACCENT_DIM}.05);
    box-shadow:0 0 0 3px ${ACCENT_DIM}.07);
  }
  .lp-campo::placeholder { color:rgba(255,255,255,.28); }
  .lp-pw-wrap { position:relative; margin-bottom:18px; }
  .lp-pw-wrap .lp-campo { margin-bottom:0; padding-right:46px; }
  .lp-eye {
    position:absolute; right:13px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:rgba(255,255,255,.35);
    display:flex; align-items:center; padding:4px; transition:color .15s;
  }
  .lp-eye:hover { color:${ACCENT}; }
  .lp-btn {
    width:100%; padding:14px; border:none; border-radius:12px;
    background:linear-gradient(135deg,#7e22ce,#a855f7,#c084fc);
    box-shadow:0 4px 24px ${ACCENT_DIM}.4);
    color:#fff; font-size:13px; font-weight:800; letter-spacing:1.5px;
    cursor:pointer; font-family:inherit; transition:opacity .15s,transform .1s,box-shadow .15s;
  }
  .lp-btn:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); box-shadow:0 6px 32px ${ACCENT_DIM}.55); }
  .lp-btn:disabled { opacity:.5; cursor:not-allowed; }
  .lp-links { margin-top:18px; font-size:12px; color:rgba(255,255,255,.3); line-height:2; }
  .lp-links a { color:#d8b4fe; text-decoration:none; transition:color .15s; }
  .lp-links a:hover { color:#e9d5ff; }
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
        body: JSON.stringify({ email: email.trim(), senha }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Credenciais inválidas");
      else router.push("/associacao/dashboard");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">
        <div className="lp-grid" />
        {NODES.map((n, i) => (
          <div key={i} className="lp-node" style={{
            left: n.x, top: n.y, width: n.s, height: n.s,
            animationDelay: n.delay, animationDuration: n.dur,
          }} />
        ))}
        {STREAMS.map((s, i) => (
          <div key={i} className="lp-stream" style={{
            left: s.left, animationDelay: s.delay, animationDuration: s.dur,
          }} />
        ))}

        <div className="lp-card">
          <div className="lp-scan" />
          <div className="lp-logo">
            <img src="/logo-indique.png" style={{ width: 120, height: 120, objectFit: "contain" }} alt="Indique Placa" />
          </div>
          <div className="lp-badge">Associacao</div>
          <div className="lp-sub">Painel da Associacao</div>

          {erro && <div className="lp-erro">{erro}</div>}

          <form onSubmit={entrar} noValidate>
            <input className="lp-campo" type="text" inputMode="email" placeholder="seu@email.com"
              value={email} required autoComplete="email"
              onChange={(e) => setEmail(e.target.value)} />
            <div className="lp-pw-wrap">
              <input className="lp-campo" type={verSenha ? "text" : "password"} placeholder="Senha"
                value={senha} required onChange={(e) => setSenha(e.target.value)} />
              <button type="button" className="lp-eye" onClick={() => setVerSenha(v => !v)} tabIndex={-1}>
                {verSenha
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <button className="lp-btn" type="submit" disabled={carregando || !email || !senha}>
              {carregando ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>

          <div className="lp-links">
            <a href="/associacao/recuperar-senha">Esqueci minha senha</a>
          </div>
        </div>
      </div>
    </>
  );
}
