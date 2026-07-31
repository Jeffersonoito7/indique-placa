"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NODES = [
  { x:"7%",  y:"14%", s:3, delay:"0s",   dur:"4.2s"},
  { x:"19%", y:"76%", s:2, delay:"1.1s", dur:"5s"  },
  { x:"44%", y:"7%",  s:4, delay:"0.8s", dur:"3.7s"},
  { x:"67%", y:"56%", s:2, delay:"2s",   dur:"5.8s"},
  { x:"81%", y:"21%", s:3, delay:"0.5s", dur:"4.6s"},
  { x:"92%", y:"83%", s:2, delay:"1.6s", dur:"5.4s"},
  { x:"32%", y:"91%", s:3, delay:"0.9s", dur:"4s"  },
  { x:"57%", y:"37%", s:2, delay:"2.6s", dur:"3.8s"},
];

const STREAMS = [
  { left:"10%", delay:"0s",   dur:"7.2s"},
  { left:"27%", delay:"1.7s", dur:"9.1s"},
  { left:"53%", delay:"2.8s", dur:"6.4s"},
  { left:"75%", delay:"0.8s", dur:"8.2s"},
  { left:"91%", delay:"2.3s", dur:"7.4s"},
];


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
    0%,100% { border-color:rgba(59,130,246,.2); box-shadow:0 0 30px rgba(59,130,246,.05),0 24px 80px rgba(0,0,0,.7); }
    50%      { border-color:rgba(59,130,246,.45); box-shadow:0 0 50px rgba(59,130,246,.12),0 24px 80px rgba(0,0,0,.7); }
  }
  .lp-root {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    padding:20px; position:relative; overflow:hidden;
    background:linear-gradient(135deg,#020812,#041020,#060d1f,#020812,#030a18);
    background-size:400% 400%;
    animation:bgShift 16s ease infinite;
    font-family:Inter,system-ui,sans-serif;
  }
  .lp-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(59,130,246,.04) 1px,transparent 1px),
      linear-gradient(90deg,rgba(59,130,246,.04) 1px,transparent 1px);
    background-size:48px 48px;
  }
  .lp-node {
    position:absolute; border-radius:50%;
    background:rgba(59,130,246,.9);
    animation:nodePulse ease-in-out infinite;
    pointer-events:none;
  }
  .lp-stream {
    position:absolute; top:0; width:1px; height:30%;
    background:linear-gradient(to bottom,transparent,rgba(59,130,246,.45),transparent);
    animation:streamFall linear infinite;
    pointer-events:none;
  }
  .lp-card {
    position:relative; width:100%; max-width:390px; text-align:center;
    background:rgba(59,130,246,.03); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px);
    border:1px solid rgba(59,130,246,.2); border-radius:24px;
    padding:40px 32px 36px;
    animation:fadeUp .55s ease both, borderGlow 4s ease-in-out infinite;
    overflow:hidden;
  }
  .lp-scan {
    position:absolute; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,rgba(59,130,246,.4),transparent);
    animation:scanLine 3.5s linear infinite;
    pointer-events:none;
  }
  .lp-logo { display:flex; justify-content:center; margin-bottom:10px; animation:floatLogo 4s ease-in-out infinite; }
  .lp-badge {
    display:inline-flex; align-items:center;
    background:rgba(59,130,246,.12); border:1px solid rgba(59,130,246,.35);
    border-radius:6px; padding:3px 12px; font-size:10px; font-weight:700;
    letter-spacing:1.5px; color:#93c5fd; text-transform:uppercase; margin-bottom:8px;
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
    border-color:rgba(59,130,246,.55);
    background:rgba(59,130,246,.05);
    box-shadow:0 0 0 3px rgba(59,130,246,.07);
  }
  .lp-campo::placeholder { color:rgba(255,255,255,.28); }
  .lp-pw-wrap { position:relative; margin-bottom:18px; }
  .lp-pw-wrap .lp-campo { margin-bottom:0; padding-right:46px; }
  .lp-eye {
    position:absolute; right:13px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; color:rgba(255,255,255,.35);
    display:flex; align-items:center; padding:4px; transition:color .15s;
  }
  .lp-eye:hover { color:rgba(59,130,246,.8); }
  .lp-btn {
    width:100%; padding:14px; border:none; border-radius:12px;
    background:linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6);
    box-shadow:0 4px 24px rgba(59,130,246,.4);
    color:#fff; font-size:13px; font-weight:800; letter-spacing:1.5px;
    cursor:pointer; font-family:inherit; transition:opacity .15s,transform .1s,box-shadow .15s;
  }
  .lp-btn:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); box-shadow:0 6px 32px rgba(59,130,246,.55); }
  .lp-btn:disabled { opacity:.5; cursor:not-allowed; }
  .lp-links { margin-top:18px; font-size:12px; color:rgba(255,255,255,.3); line-height:2; }
  .lp-links a { color:#93c5fd; text-decoration:none; transition:color .15s; }
  .lp-links a:hover { color:#bfdbfe; }
  .lp-links a.lp-esqueci { font-size:13px; font-weight:700; text-decoration:underline; text-underline-offset:3px; }
`;

export default function ConsultorLoginPage() {
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
      const res = await fetch("/api/consultor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Credenciais inválidas");
      else router.push("/consultor/dashboard");
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
          <div className="lp-badge">Consultor</div>
          <div className="lp-sub">Acesso do Consultor</div>

          {erro && <div className="lp-erro">{erro}</div>}

          <form onSubmit={entrar} noValidate>
            <input className="lp-campo" type="email" inputMode="email" placeholder="seu@email.com"
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
            <a href="/consultor/recuperar-senha" className="lp-esqueci">Esqueci minha senha</a>
            <br />
            É indicador? <a href="/indicador/login">Acesse aqui</a>
          </div>
        </div>
      </div>
    </>
  );
}
