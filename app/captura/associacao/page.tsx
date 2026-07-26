"use client";

import { useState } from "react";
import { ESTADOS_NOMES, ESTADOS_CIDADES } from "@/lib/cidades-brasil";

const STYLES = `
  @keyframes bgPulse {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rocketLaunch {
    0%   { transform: translateY(0) scale(1); opacity: 1; }
    80%  { transform: translateY(-320px) scale(1.1); opacity: 1; }
    100% { transform: translateY(-340px) scale(1); opacity: 0; }
  }
  @keyframes plateFloat1 {
    0%   { transform: translateY(0) rotate(-8deg) scale(.9); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-280px) rotate(4deg) scale(1.05); opacity: 0; }
  }
  @keyframes plateFloat2 {
    0%   { transform: translateY(0) rotate(6deg) scale(.85); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-260px) rotate(-6deg) scale(1.1); opacity: 0; }
  }
  @keyframes plateFloat3 {
    0%   { transform: translateY(0) rotate(-3deg) scale(.8); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-300px) rotate(8deg) scale(1); opacity: 0; }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 30px rgba(16,185,129,.25), 0 0 60px rgba(59,130,246,.12); }
    50%       { box-shadow: 0 0 50px rgba(16,185,129,.4),  0 0 100px rgba(59,130,246,.2); }
  }
  @keyframes scanLine {
    0%   { top: -4px; opacity: 0; }
    10%  { opacity: .5; }
    90%  { opacity: .5; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes gridMove {
    0%   { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }
  @keyframes badgePing {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.05); }
  }
  @keyframes counterUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes starTwinkle {
    0%, 100% { opacity: .15; transform: scale(.8); }
    50%       { opacity: .7;  transform: scale(1.2); }
  }
  .cap-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 24px 16px; position: relative; overflow: hidden;
    background: #030a12;
    font-family: Inter, system-ui, sans-serif;
  }
  .cap-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(16,185,129,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(16,185,129,.06) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridMove 8s linear infinite;
  }
  .cap-glow-top {
    position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
    width: 600px; height: 300px; pointer-events: none;
    background: radial-gradient(ellipse, rgba(16,185,129,.18) 0%, rgba(59,130,246,.10) 40%, transparent 70%);
    filter: blur(20px);
  }
  .cap-glow-bottom {
    position: absolute; bottom: -100px; right: -80px; pointer-events: none;
    width: 400px; height: 300px;
    background: radial-gradient(ellipse, rgba(59,130,246,.15) 0%, transparent 65%);
    filter: blur(24px);
  }
  .cap-star {
    position: absolute; border-radius: 50%; pointer-events: none;
    background: #fff;
  }
  .cap-rocket-scene {
    position: absolute; right: 60px; bottom: 80px;
    pointer-events: none; user-select: none;
  }
  .cap-rocket {
    animation: rocketLaunch 4s ease-in infinite;
    animation-delay: 1s;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .cap-plate {
    position: absolute; left: -60px; bottom: 0;
    font-size: 11px; font-weight: 800; letter-spacing: 1px;
    border-radius: 5px; padding: 4px 10px;
    color: #030a12; white-space: nowrap;
  }
  .cap-plate-1 {
    background: linear-gradient(135deg, #10b981, #059669);
    animation: plateFloat1 4s ease-in infinite;
    animation-delay: 1.3s;
    left: -90px; bottom: 10px;
  }
  .cap-plate-2 {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    animation: plateFloat2 4s ease-in infinite;
    animation-delay: 1.6s;
    left: 30px; bottom: 20px;
    color: #fff;
  }
  .cap-plate-3 {
    background: linear-gradient(135deg, #34d399, #10b981);
    animation: plateFloat3 4s ease-in infinite;
    animation-delay: 1.0s;
    left: -40px; bottom: 5px;
  }
  .cap-card {
    width: 100%; max-width: 440px; position: relative; z-index: 10;
    background: rgba(3,15,25,.85); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(16,185,129,.2); border-radius: 20px;
    padding: 36px 28px 32px;
    animation: fadeUp .6s ease both, glowPulse 4s ease-in-out infinite;
    overflow: hidden;
  }
  .cap-scan {
    position: absolute; left: 0; right: 0; height: 2px; pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(16,185,129,.5), transparent);
    animation: scanLine 6s ease-in-out infinite;
  }
  .cap-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.3);
    border-radius: 6px; padding: 3px 10px; font-size: 10px; font-weight: 800;
    letter-spacing: 1.5px; color: #34d399; text-transform: uppercase; margin-bottom: 8px;
    animation: badgePing 3s ease-in-out infinite;
  }
  .cap-campo {
    width: 100%; padding: 12px 14px; margin-bottom: 11px; box-sizing: border-box;
    background: rgba(255,255,255,.04); border: 1px solid rgba(16,185,129,.15);
    border-radius: 10px; font-size: 14px; color: #e2e8f0; outline: none;
    font-family: inherit; transition: border-color .2s, background .2s;
  }
  .cap-campo:focus {
    border-color: rgba(16,185,129,.5);
    background: rgba(16,185,129,.06);
  }
  .cap-campo::placeholder { color: rgba(255,255,255,.22); }
  .cap-campo option { background: #0d1f2f; color: #e2e8f0; }
  .cap-btn {
    width: 100%; padding: 14px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #059669 0%, #10b981 40%, #3b82f6 100%);
    background-size: 200% 200%;
    animation: bgPulse 4s ease infinite;
    box-shadow: 0 4px 24px rgba(16,185,129,.35), 0 2px 8px rgba(59,130,246,.2);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1.2px;
    cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s, box-shadow .2s;
    margin-top: 4px;
  }
  .cap-btn:hover:not(:disabled) {
    opacity: .92; transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(16,185,129,.45), 0 4px 12px rgba(59,130,246,.3);
  }
  .cap-btn:disabled { opacity: .5; cursor: not-allowed; }
  .cap-senha-wrap { position: relative; margin-bottom: 11px; }
  .cap-senha-wrap .cap-campo { margin-bottom: 0; padding-right: 44px; }
  .cap-olho {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.3);
    display: flex; align-items: center; padding: 4px;
  }
  .cap-olho:hover { color: #34d399; }
  .cap-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 11px; }
  .cap-divider {
    height: 1px; background: linear-gradient(90deg, transparent, rgba(16,185,129,.2), transparent);
    margin: 16px 0;
  }
  .cap-stats {
    display: flex; gap: 16px; justify-content: center; margin-bottom: 20px;
  }
  .cap-stat {
    text-align: center; flex: 1;
    background: rgba(255,255,255,.03); border: 1px solid rgba(16,185,129,.12);
    border-radius: 10px; padding: 8px 4px;
    animation: counterUp .8s ease both;
  }
  .cap-stat-num {
    font-size: 18px; font-weight: 800; letter-spacing: -0.5px;
    background: linear-gradient(135deg, #10b981, #3b82f6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .cap-stat-lbl { font-size: 9px; color: rgba(255,255,255,.3); font-weight: 600; letter-spacing: .8px; text-transform: uppercase; margin-top: 2px; }
`;

function StarField() {
  const stars = [
    { top: "8%",  left: "12%", w: 1.5, delay: 0 },
    { top: "22%", left: "88%", w: 2,   delay: 1.1 },
    { top: "45%", left: "5%",  w: 1,   delay: 2.3 },
    { top: "67%", left: "92%", w: 1.5, delay: .7 },
    { top: "80%", left: "18%", w: 1,   delay: 1.8 },
    { top: "14%", left: "55%", w: 2,   delay: 3.2 },
    { top: "91%", left: "62%", w: 1,   delay: .4 },
    { top: "35%", left: "76%", w: 1.5, delay: 2.7 },
  ];
  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          className="cap-star"
          style={{
            top: s.top, left: s.left, width: s.w, height: s.w,
            animationName: "starTwinkle", animationDuration: `${2.5 + i * 0.3}s`,
            animationDelay: `${s.delay}s`, animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </>
  );
}

function RocketScene() {
  return (
    <div className="cap-rocket-scene" style={{ display: "none" }} aria-hidden="true">
      <div className="cap-plate cap-plate-1">ABC·1234</div>
      <div className="cap-plate cap-plate-2">XYZ·5678</div>
      <div className="cap-plate cap-plate-3">MNO·9012</div>
      <div className="cap-rocket">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 7 8 7 14h10c0-6-5-12-5-12z" fill="url(#rg1)" />
          <path d="M9 14v4l3 2 3-2v-4H9z" fill="#1d4ed8" />
          <ellipse cx="12" cy="14" rx="3" ry="1.5" fill="rgba(255,255,255,.15)" />
          <path d="M7 14c-1 0-2.5 1.5-2.5 3L7 16v-2z" fill="#10b981" />
          <path d="M17 14c1 0 2.5 1.5 2.5 3L17 16v-2z" fill="#10b981" />
          <circle cx="12" cy="9" r="2" fill="rgba(255,255,255,.5)" />
          <defs>
            <linearGradient id="rg1" x1="12" y1="2" x2="12" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ fontSize: 18, lineHeight: 1 }}>🔥</div>
      </div>
    </div>
  );
}

function fmtTel(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0,2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
}

export default function CapturaAssociacaoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [fone, setFone] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!estado) { setErro("Selecione o estado."); return; }
    if (!cidade) { setErro("Selecione a cidade."); return; }
    if (!aceitouTermos) { setErro("Voce precisa aceitar os Termos de Uso e a Politica de Privacidade (LGPD) para continuar."); return; }
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/captura-associacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, fone, estado, cidade, senha }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Erro ao cadastrar");
      else setSucesso(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="cap-page">
        <div className="cap-grid" />
        <div className="cap-glow-top" />
        <div className="cap-glow-bottom" />
        <StarField />
        <RocketScene />

        <div className="cap-card">
          <div className="cap-scan" />

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: "linear-gradient(135deg, rgba(16,185,129,.15), rgba(59,130,246,.15))",
                border: "1px solid rgba(16,185,129,.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 24px rgba(16,185,129,.2)",
              }}>
                <img src="/logo-indique.png" style={{ width: 52, height: 52, objectFit: "contain" }} alt="Indique Placa" />
              </div>
            </div>

            <div className="cap-badge">
              <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#10b981" /></svg>
              Associacao
            </div>

            <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 5, letterSpacing: "-.3px" }}>
              Quero usar o Indique Placa
            </div>
            <div style={{ color: "rgba(255,255,255,.38)", fontSize: 12.5, lineHeight: 1.6 }}>
              Preencha os dados da sua associacao. Nossa equipe entrara em contato para ativacao da conta.
            </div>
          </div>

          <div className="cap-stats">
            <div className="cap-stat" style={{ animationDelay: ".1s" }}>
              <div className="cap-stat-num">+3.200</div>
              <div className="cap-stat-lbl">Placas indicadas</div>
            </div>
            <div className="cap-stat" style={{ animationDelay: ".25s" }}>
              <div className="cap-stat-num">+410</div>
              <div className="cap-stat-lbl">Vendas fechadas</div>
            </div>
            <div className="cap-stat" style={{ animationDelay: ".4s" }}>
              <div className="cap-stat-num">32%</div>
              <div className="cap-stat-lbl">Conversao media</div>
            </div>
          </div>

          <div className="cap-divider" />

          {!sucesso ? (
            <>
              {erro && (
                <div style={{
                  background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)",
                  borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12,
                }}>{erro}</div>
              )}
              <form onSubmit={enviar}>
                <input
                  className="cap-campo"
                  type="text"
                  placeholder="Nome da associacao (ex: AVP Protecao Veicular)"
                  value={nome}
                  required
                  onChange={(e) => setNome(e.target.value)}
                />
                <input
                  className="cap-campo"
                  type="email"
                  placeholder="E-mail de acesso"
                  value={email}
                  required
                  autoComplete="off"
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="cap-campo"
                  type="tel"
                  placeholder="WhatsApp (11) 99999-9999"
                  value={fone}
                  required
                  onChange={(e) => setFone(fmtTel(e.target.value))}
                />
                <div className="cap-row">
                  <select
                    className="cap-campo"
                    required
                    value={estado}
                    onChange={(e) => { setEstado(e.target.value); setCidade(""); }}
                    style={{ appearance: "none" }}
                  >
                    <option value="">Estado</option>
                    {Object.entries(ESTADOS_NOMES)
                      .sort(([, a], [, b]) => a.localeCompare(b))
                      .map(([uf, nomUf]) => (
                        <option key={uf} value={uf}>{nomUf} ({uf})</option>
                      ))}
                  </select>
                  <select
                    className="cap-campo"
                    required
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    disabled={!estado}
                    style={{ appearance: "none", opacity: estado ? 1 : 0.5 }}
                  >
                    <option value="">Cidade</option>
                    {(ESTADOS_CIDADES[estado] ?? []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="cap-senha-wrap">
                  <input
                    className="cap-campo"
                    type={verSenha ? "text" : "password"}
                    placeholder="Crie uma senha (min. 6 caracteres)"
                    value={senha}
                    required
                    minLength={6}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button type="button" className="cap-olho" onClick={() => setVerSenha((v) => !v)} tabIndex={-1}>
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
                <label style={{
                  display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                  margin: "12px 0", fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.6,
                }}>
                  <input
                    type="checkbox"
                    checked={aceitouTermos}
                    onChange={(e) => setAceitouTermos(e.target.checked)}
                    style={{ marginTop: 2, accentColor: "#10b981", width: 15, height: 15, flexShrink: 0, cursor: "pointer" }}
                  />
                  <span>
                    Li e aceito os{" "}
                    <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: "#34d399", textDecoration: "underline" }}>Termos de Uso</a>
                    {" "}e a{" "}
                    <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: "#34d399", textDecoration: "underline" }}>Politica de Privacidade</a>
                    {" "}(LGPD).
                  </span>
                </label>
                <button className="cap-btn" type="submit" disabled={carregando || !aceitouTermos}>
                  {carregando ? "ENVIANDO..." : "ENVIAR CADASTRO"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "rgba(255,255,255,.25)" }}>
                Ja tem conta?{" "}
                <a href="/associacao/login" style={{ color: "#34d399", textDecoration: "none", fontWeight: 600 }}>Entrar</a>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  width: 64, height: 64, margin: "0 auto",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(16,185,129,.2), rgba(59,130,246,.15))",
                  border: "1px solid rgba(16,185,129,.4)",
                  boxShadow: "0 0 30px rgba(16,185,129,.3)",
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                Cadastro recebido!
              </div>
              <div style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.7 }}>
                Nossa equipe analisara seu cadastro e entrara em contato pelo WhatsApp informado para ativacao da conta.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
