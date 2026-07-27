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
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 30px rgba(16,185,129,.2), 0 0 60px rgba(59,130,246,.1); }
    50%       { box-shadow: 0 0 50px rgba(16,185,129,.35), 0 0 100px rgba(59,130,246,.18); }
  }
  @keyframes scanLine {
    0%   { top: -4px; opacity: 0; }
    10%  { opacity: .4; }
    90%  { opacity: .4; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes gridMove {
    0%   { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }
  @keyframes starTwinkle {
    0%, 100% { opacity: .12; transform: scale(.8); }
    50%       { opacity: .6;  transform: scale(1.2); }
  }
  @keyframes counterUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes checkIn {
    from { opacity: 0; transform: scale(.6); }
    to   { opacity: 1; transform: scale(1); }
  }
  .cap-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 32px 16px; position: relative; overflow: hidden;
    background: #030a12;
    font-family: Inter, system-ui, sans-serif;
  }
  .cap-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(16,185,129,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(16,185,129,.05) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridMove 10s linear infinite;
  }
  .cap-glow-top {
    position: absolute; top: -150px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 350px; pointer-events: none;
    background: radial-gradient(ellipse, rgba(16,185,129,.15) 0%, rgba(59,130,246,.08) 40%, transparent 70%);
    filter: blur(24px);
  }
  .cap-glow-bottom {
    position: absolute; bottom: -100px; right: -80px; pointer-events: none;
    width: 500px; height: 350px;
    background: radial-gradient(ellipse, rgba(59,130,246,.12) 0%, transparent 65%);
    filter: blur(24px);
  }
  .cap-star {
    position: absolute; border-radius: 50%; pointer-events: none;
    background: #fff;
  }
  .cap-wrap {
    position: relative; z-index: 10;
    width: 100%; max-width: 1020px;
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 48px;
    align-items: center;
  }
  @media (max-width: 820px) {
    .cap-wrap { grid-template-columns: 1fr; gap: 32px; }
    .cap-pitch { text-align: center; }
    .cap-benefits { align-items: center; }
    .cap-benefit-item { text-align: left; }
    .cap-stats-row { justify-content: center; }
  }
  .cap-pitch { animation: fadeUp .5s ease both; }
  .cap-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.28);
    border-radius: 6px; padding: 4px 12px; font-size: 10px; font-weight: 800;
    letter-spacing: 1.5px; color: #34d399; text-transform: uppercase; margin-bottom: 16px;
  }
  .cap-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #10b981;
    box-shadow: 0 0 6px #10b981;
  }
  .cap-headline {
    font-size: 36px; font-weight: 900; color: #f1f5f9;
    line-height: 1.15; letter-spacing: -.8px; margin-bottom: 16px;
  }
  @media (max-width: 820px) { .cap-headline { font-size: 28px; } }
  .cap-headline-grad {
    background: linear-gradient(135deg, #10b981 0%, #34d399 40%, #3b82f6 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .cap-sub {
    font-size: 15px; color: rgba(255,255,255,.5); line-height: 1.7; margin-bottom: 28px;
    max-width: 480px;
  }
  .cap-benefits { display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px; }
  .cap-benefit-item {
    display: flex; align-items: flex-start; gap: 12px;
  }
  .cap-benefit-icon {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2);
  }
  .cap-benefit-text { flex: 1; }
  .cap-benefit-title { font-size: 13.5px; font-weight: 700; color: #e2e8f0; margin-bottom: 2px; }
  .cap-benefit-desc { font-size: 12px; color: rgba(255,255,255,.38); line-height: 1.55; }
  .cap-stats-row {
    display: flex; gap: 20px; flex-wrap: wrap;
    padding-top: 24px; border-top: 1px solid rgba(16,185,129,.1);
  }
  .cap-stat { text-align: left; }
  .cap-stat-num {
    font-size: 22px; font-weight: 900; letter-spacing: -1px;
    background: linear-gradient(135deg, #10b981, #3b82f6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: counterUp .8s ease both;
  }
  .cap-stat-lbl { font-size: 10px; color: rgba(255,255,255,.3); font-weight: 600; letter-spacing: .6px; text-transform: uppercase; margin-top: 2px; }
  .cap-card {
    width: 100%; position: relative;
    background: rgba(3,15,25,.9); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(16,185,129,.18); border-radius: 20px;
    padding: 32px 28px 28px;
    animation: fadeUp .6s .1s ease both, glowPulse 5s ease-in-out infinite;
    overflow: hidden;
  }
  .cap-scan {
    position: absolute; left: 0; right: 0; height: 2px; pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(16,185,129,.45), transparent);
    animation: scanLine 7s ease-in-out infinite;
  }
  .cap-campo {
    width: 100%; padding: 11px 14px; margin-bottom: 10px; box-sizing: border-box;
    background: rgba(255,255,255,.04); border: 1px solid rgba(16,185,129,.14);
    border-radius: 10px; font-size: 13.5px; color: #e2e8f0; outline: none;
    font-family: inherit; transition: border-color .2s, background .2s;
  }
  .cap-campo:focus {
    border-color: rgba(16,185,129,.45);
    background: rgba(16,185,129,.05);
  }
  .cap-campo::placeholder { color: rgba(255,255,255,.2); }
  .cap-campo option { background: #0d1f2f; color: #e2e8f0; }
  .cap-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 10px; }
  .cap-btn {
    width: 100%; padding: 13px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #059669 0%, #10b981 45%, #3b82f6 100%);
    background-size: 200% 200%;
    animation: bgPulse 4s ease infinite;
    box-shadow: 0 4px 24px rgba(16,185,129,.3), 0 2px 8px rgba(59,130,246,.18);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1px;
    cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s;
    margin-top: 4px;
  }
  .cap-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-2px); }
  .cap-btn:disabled { opacity: .45; cursor: not-allowed; }
  .cap-senha-wrap { position: relative; margin-bottom: 10px; }
  .cap-senha-wrap .cap-campo { margin-bottom: 0; padding-right: 44px; }
  .cap-olho {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.28);
    display: flex; align-items: center; padding: 4px;
  }
  .cap-olho:hover { color: #34d399; }
`;

const BENEFITS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Rede de consultores indicando 24h por dia",
    desc: "Crie um time de consultores e indicadores que trabalham pelos próprios contatos, trazendo leads de veículo sem você precisar ligar para ninguém.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Acompanhe cada lead em tempo real",
    desc: "Veja o status de cada indicação no funil, quem indicou, quando entrou em contato e se a venda foi fechada. Zero planilha, zero WhatsApp perdido.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    title: "Comissões automáticas via PIX",
    desc: "Configure o valor da comissão por venda fechada e o sistema paga o consultor ou indicador direto na chave PIX, sem retrabalho manual.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Multi-tenant com gestores e indicadores",
    desc: "Cada associação tem seu próprio painel isolado. Crie gestores que supervisionam times de consultores e indicadores vinculados a cada consultor.",
  },
];

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
    if (!nome.trim() || nome.trim().length < 2) { setErro("Informe o nome da associação."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErro("Informe um e-mail válido."); return; }
    if (!fone.replace(/\D/g, "") || fone.replace(/\D/g, "").length < 10) { setErro("Informe o WhatsApp com DDD."); return; }
    if (!estado) { setErro("Selecione o estado."); return; }
    if (!cidade) { setErro("Selecione a cidade."); return; }
    if (!senha || senha.length < 6) { setErro("A senha deve ter no mínimo 6 caracteres."); return; }
    if (!aceitouTermos) { setErro("Você precisa aceitar os Termos de Uso e a Política de Privacidade (LGPD) para continuar."); return; }
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/captura-associacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, fone, estado, cidade, senha }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Erro ao cadastrar.");
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

        <div className="cap-wrap">

          {/* PITCH — lado esquerdo */}
          <div className="cap-pitch">
            <div className="cap-badge">
              <span className="cap-badge-dot" />
              Para associações de proteção veicular
            </div>

            <h1 className="cap-headline">
              Venda mais placas<br />
              <span className="cap-headline-grad">sem depender de uma equipe interna</span>
            </h1>

            <p className="cap-sub">
              O Indique Placa transforma seus consultores e indicadores em uma máquina de leads.
              Cada um compartilha um link próprio, o sistema captura, organiza e acompanha cada
              indicação até o fechamento.
            </p>

            <div className="cap-benefits">
              {BENEFITS.map((b, i) => (
                <div key={i} className="cap-benefit-item" style={{ animationDelay: `${i * .1}s` }}>
                  <div className="cap-benefit-icon">{b.icon}</div>
                  <div className="cap-benefit-text">
                    <div className="cap-benefit-title">{b.title}</div>
                    <div className="cap-benefit-desc">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cap-stats-row">
              <div className="cap-stat">
                <div className="cap-stat-num" style={{ animationDelay: ".1s" }}>+3.200</div>
                <div className="cap-stat-lbl">Placas indicadas</div>
              </div>
              <div className="cap-stat">
                <div className="cap-stat-num" style={{ animationDelay: ".25s" }}>+410</div>
                <div className="cap-stat-lbl">Vendas fechadas</div>
              </div>
              <div className="cap-stat">
                <div className="cap-stat-num" style={{ animationDelay: ".4s" }}>32%</div>
                <div className="cap-stat-lbl">Conversão média</div>
              </div>
            </div>
          </div>

          {/* FORMULARIO — lado direito */}
          <div className="cap-card">
            <div className="cap-scan" />

            {!sucesso ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <img src="/logo-indique.png" style={{ width: 34, height: 34, objectFit: "contain" }} alt="Indique Placa" />
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: "#34d399", textTransform: "uppercase" }}>Indique Placa</span>
                  </div>
                  <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 18, marginBottom: 4, letterSpacing: "-.2px" }}>
                    Comece agora, é gratuito
                  </div>
                  <div style={{ color: "rgba(255,255,255,.35)", fontSize: 12, lineHeight: 1.6 }}>
                    Preencha os dados da sua associação. Nossa equipe ativa sua conta em até 24h.
                  </div>
                </div>

                {erro && (
                  <div style={{
                    background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.22)",
                    borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12,
                  }}>{erro}</div>
                )}

                <form onSubmit={enviar} noValidate>
                  <input
                    className="cap-campo"
                    type="text"
                    placeholder="Nome da associação (ex: AVP Proteção Veicular)"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  <input
                    className="cap-campo"
                    type="text"
                    placeholder="E-mail de acesso"
                    value={email}
                    autoComplete="off"
                    inputMode="email"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className="cap-campo"
                    type="tel"
                    placeholder="WhatsApp com DDD"
                    value={fone}
                    onChange={(e) => setFone(fmtTel(e.target.value))}
                  />
                  <div className="cap-row">
                    <select
                      className="cap-campo"
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
                      onChange={(e) => setSenha(e.target.value)}
                    />
                    <button type="button" className="cap-olho" onClick={() => setVerSenha((v) => !v)} tabIndex={-1}>
                      {verSenha ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  <label style={{
                    display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                    margin: "10px 0", fontSize: 11.5, color: "rgba(255,255,255,.4)", lineHeight: 1.6, textAlign: "left",
                  }}>
                    <input
                      type="checkbox"
                      checked={aceitouTermos}
                      onChange={(e) => setAceitouTermos(e.target.checked)}
                      style={{ marginTop: 2, accentColor: "#10b981", width: 14, height: 14, flexShrink: 0, cursor: "pointer" }}
                    />
                    <span>
                      Li e aceito os{" "}
                      <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: "#34d399", textDecoration: "underline" }}>Termos de Uso</a>
                      {" "}e a{" "}
                      <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: "#34d399", textDecoration: "underline" }}>Política de Privacidade</a>
                      {" "}(LGPD).
                    </span>
                  </label>

                  <button className="cap-btn" type="submit" disabled={carregando || !aceitouTermos}>
                    {carregando ? "ENVIANDO..." : "QUERO COMEÇAR AGORA"}
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 14, fontSize: 11.5, color: "rgba(255,255,255,.22)" }}>
                  Ja tem conta?{" "}
                  <a href="/associacao/login" style={{ color: "#34d399", textDecoration: "none", fontWeight: 600 }}>Entrar</a>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{
                  width: 64, height: 64, margin: "0 auto 16px",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(16,185,129,.2), rgba(59,130,246,.12))",
                  border: "1px solid rgba(16,185,129,.4)",
                  boxShadow: "0 0 30px rgba(16,185,129,.25)",
                  animation: "checkIn .4s ease both",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 18, marginBottom: 10 }}>
                  Cadastro recebido!
                </div>
                <div style={{ color: "rgba(255,255,255,.42)", fontSize: 13, lineHeight: 1.75 }}>
                  Nossa equipe analisará seu cadastro e entrará em contato pelo WhatsApp informado para ativar sua conta em até 24h.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
