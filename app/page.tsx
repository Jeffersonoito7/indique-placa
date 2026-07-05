"use client";

import { useState, useEffect, useRef } from "react";

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes floatLogo {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(1.08); }
  }
  @keyframes particle {
    0%   { transform: translateY(0) scale(1); opacity: 0.4; }
    100% { transform: translateY(-110vh) scale(0); opacity: 0; }
  }
  @keyframes scanLine {
    0%   { transform: translateY(-100%); opacity: 0.5; }
    100% { transform: translateY(500%); opacity: 0; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes checkPop {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
    50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
  }

  .lp-page {
    min-height: 100vh;
    background: #040c14;
    font-family: Inter, system-ui, sans-serif;
    color: #fff;
    overflow-x: hidden;
  }

  /* NAV */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px;
    background: rgba(4,12,20,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .nav-logo { display: flex; align-items: center; gap: 10px; }
  .nav-logo img { width: 36px; height: 36px; object-fit: contain; }
  .nav-logo-text { font-size: 15px; font-weight: 900; color: #fff; letter-spacing: 1px; }
  .nav-cta {
    padding: 10px 22px; background: linear-gradient(135deg, #059669, #10b981);
    border: none; border-radius: 10px; color: #fff; font-size: 13px; font-weight: 800;
    cursor: pointer; font-family: inherit; transition: all .2s;
    box-shadow: 0 4px 16px rgba(16,185,129,0.3);
    letter-spacing: .5px;
  }
  .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(16,185,129,0.45); }

  /* HERO */
  .lp-hero {
    position: relative; overflow: hidden;
    min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 120px 24px 80px;
    background: linear-gradient(135deg, #020d1a, #041828, #021a0e, #041828, #020d1a);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    text-align: center;
  }
  .hero-glow1 {
    position: absolute; width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,.1) 0%, transparent 65%);
    top: -200px; left: -200px; animation: glowPulse 8s ease-in-out infinite;
    pointer-events: none;
  }
  .hero-glow2 {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,.08) 0%, transparent 65%);
    bottom: -100px; right: -100px; animation: glowPulse 10s ease-in-out infinite reverse;
    pointer-events: none;
  }
  .hero-particle {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.1);
    animation: particle linear infinite;
    pointer-events: none;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.3);
    border-radius: 99px; padding: 6px 16px;
    font-size: 12px; font-weight: 700; color: #10b981; letter-spacing: 1px;
    text-transform: uppercase; margin-bottom: 24px;
    animation: fadeUp .6s ease both;
  }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: pulse 2s ease infinite; }
  .hero-logo {
    animation: floatLogo 4s ease-in-out infinite;
    margin-bottom: 20px;
  }
  .hero-headline {
    font-size: clamp(36px, 6vw, 72px);
    font-weight: 900; line-height: 1.05;
    letter-spacing: -1.5px;
    animation: fadeUp .7s .1s ease both;
    margin-bottom: 12px;
  }
  .headline-green { color: #10b981; }
  .hero-sub {
    font-size: clamp(16px, 2.5vw, 22px);
    color: rgba(255,255,255,.55); max-width: 620px;
    line-height: 1.6; margin-bottom: 36px;
    animation: fadeUp .7s .2s ease both;
  }
  .hero-cta-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    animation: fadeUp .7s .3s ease both;
  }
  .hero-cta {
    padding: 18px 40px;
    background: linear-gradient(135deg, #059669, #10b981);
    border: none; border-radius: 14px; color: #fff;
    font-size: 17px; font-weight: 900; letter-spacing: .5px;
    cursor: pointer; font-family: inherit; transition: all .2s;
    box-shadow: 0 6px 28px rgba(16,185,129,.4);
    display: flex; align-items: center; gap: 10px;
  }
  .hero-cta:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(16,185,129,.5); }
  .hero-cta-note { font-size: 12px; color: rgba(255,255,255,.35); }

  /* NUMEROS */
  .lp-numbers {
    display: flex; justify-content: center; gap: 0;
    flex-wrap: wrap;
    border-top: 1px solid rgba(255,255,255,.06);
    border-bottom: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.02);
  }
  .number-item {
    flex: 1; min-width: 160px; padding: 36px 24px; text-align: center;
    border-right: 1px solid rgba(255,255,255,.06);
  }
  .number-item:last-child { border-right: none; }
  .number-val { font-size: 42px; font-weight: 900; color: #10b981; line-height: 1; margin-bottom: 6px; }
  .number-label { font-size: 13px; color: rgba(255,255,255,.4); font-weight: 600; }

  /* SECOES */
  .lp-section { padding: 100px 24px; max-width: 1100px; margin: 0 auto; }
  .section-badge {
    display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 2px;
    text-transform: uppercase; color: #10b981; margin-bottom: 12px;
  }
  .section-title {
    font-size: clamp(28px, 4vw, 46px); font-weight: 900; line-height: 1.1;
    letter-spacing: -1px; margin-bottom: 14px;
  }
  .section-sub { font-size: 17px; color: rgba(255,255,255,.45); max-width: 560px; line-height: 1.6; }

  /* COMO FUNCIONA */
  .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 56px; }
  .step-card {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 24px; padding: 36px 28px;
    position: relative; overflow: hidden;
    transition: transform .2s, border-color .2s;
  }
  .step-card:hover { transform: translateY(-4px); border-color: rgba(16,185,129,.25); }
  .step-number {
    font-size: 64px; font-weight: 900; line-height: 1;
    color: rgba(16,185,129,.12); position: absolute; top: 20px; right: 24px;
    font-variant-numeric: tabular-nums;
  }
  .step-icon {
    width: 52px; height: 52px; border-radius: 16px;
    background: linear-gradient(135deg, rgba(16,185,129,.2), rgba(16,185,129,.05));
    border: 1px solid rgba(16,185,129,.2);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px; font-size: 24px;
  }
  .step-title { font-size: 19px; font-weight: 800; margin-bottom: 10px; }
  .step-desc { font-size: 14px; color: rgba(255,255,255,.45); line-height: 1.65; }

  /* BENEFICIOS */
  .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 56px; }
  .benefit-card {
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
    border-radius: 20px; padding: 28px 24px;
    transition: transform .2s, border-color .2s;
  }
  .benefit-card:hover { transform: translateY(-3px); border-color: rgba(16,185,129,.2); }
  .benefit-icon { font-size: 28px; margin-bottom: 14px; }
  .benefit-title { font-size: 16px; font-weight: 800; margin-bottom: 8px; }
  .benefit-desc { font-size: 13px; color: rgba(255,255,255,.4); line-height: 1.6; }

  /* DEPOIMENTO */
  .lp-proof {
    padding: 80px 24px;
    background: linear-gradient(135deg, rgba(16,185,129,.05) 0%, transparent 50%);
    border-top: 1px solid rgba(255,255,255,.05);
    border-bottom: 1px solid rgba(255,255,255,.05);
    text-align: center;
  }
  .proof-quote {
    font-size: clamp(20px, 3vw, 32px); font-weight: 800; font-style: italic;
    color: rgba(255,255,255,.85); max-width: 780px; margin: 0 auto 24px;
    line-height: 1.4;
  }
  .proof-author { font-size: 14px; color: rgba(255,255,255,.4); font-weight: 600; }
  .proof-stars { color: #f59e0b; font-size: 20px; margin-bottom: 20px; letter-spacing: 2px; }

  /* FORM SECTION */
  .lp-form-section {
    padding: 100px 24px;
    background: linear-gradient(180deg, #040c14 0%, #030912 100%);
    position: relative; overflow: hidden;
  }
  .form-glow {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,.08) 0%, transparent 65%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    animation: glowPulse 8s ease-in-out infinite;
    pointer-events: none;
  }
  .form-inner { position: relative; max-width: 500px; margin: 0 auto; text-align: center; }
  .form-card {
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 32px; padding: 44px 40px;
    box-shadow: 0 32px 100px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.07);
    position: relative; overflow: hidden;
  }
  .form-scan {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(16,185,129,.5), transparent);
    animation: scanLine 4s ease-in-out infinite;
    pointer-events: none;
  }
  .form-corner {
    position: absolute; width: 18px; height: 18px;
    border-color: rgba(16,185,129,.35); border-style: solid;
    pointer-events: none;
  }
  .fc-tl { top: 14px; left: 14px; border-width: 2px 0 0 2px; border-radius: 4px 0 0 0; }
  .fc-tr { top: 14px; right: 14px; border-width: 2px 2px 0 0; border-radius: 0 4px 0 0; }
  .fc-bl { bottom: 14px; left: 14px; border-width: 0 0 2px 2px; border-radius: 0 0 0 4px; }
  .fc-br { bottom: 14px; right: 14px; border-width: 0 2px 2px 0; border-radius: 0 0 4px 0; }

  .form-title { font-size: 24px; font-weight: 900; margin-bottom: 6px; }
  .form-sub { font-size: 13px; color: rgba(255,255,255,.4); margin-bottom: 28px; line-height: 1.5; }

  .campo-group { margin-bottom: 14px; text-align: left; }
  .campo-label {
    display: block; font-size: 11px; font-weight: 700; letter-spacing: .5px;
    color: rgba(255,255,255,.45); text-transform: uppercase; margin-bottom: 6px;
  }
  .campo {
    width: 100%; padding: 13px 16px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px; font-size: 15px; color: #fff;
    outline: none; font-family: inherit;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .campo:focus {
    border-color: rgba(16,185,129,.5);
    background: rgba(16,185,129,.05);
    box-shadow: 0 0 0 3px rgba(16,185,129,.1);
  }
  .campo::placeholder { color: rgba(255,255,255,.22); }
  .campo-select {
    appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px;
  }
  .campo-select option { background: #0c1929; color: #fff; }

  .btn-cadastrar {
    width: 100%; padding: 16px;
    background: linear-gradient(135deg, #059669, #10b981);
    border: none; border-radius: 12px; color: #fff;
    font-size: 16px; font-weight: 900; letter-spacing: .5px;
    cursor: pointer; font-family: inherit;
    transition: all .2s; margin-top: 8px;
    box-shadow: 0 6px 24px rgba(16,185,129,.35);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-cadastrar:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(16,185,129,.5); }
  .btn-cadastrar:disabled { opacity: .55; cursor: not-allowed; }

  .erro-box {
    background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2);
    border-radius: 10px; padding: 10px 14px; font-size: 13px;
    color: #f87171; margin-bottom: 14px; text-align: center;
  }
  .sucesso-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(16,185,129,.2), rgba(16,185,129,.05));
    border: 2px solid rgba(16,185,129,.4);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    animation: checkPop .6s cubic-bezier(.34,1.56,.64,1) both;
  }
  .credencial-box {
    background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px; padding: 14px 18px; margin: 12px 0; text-align: left;
  }
  .cred-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,.3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .cred-val { font-size: 15px; font-weight: 700; color: #fff; font-family: 'Courier New', monospace; }
  .senha-hint {
    background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.18);
    border-radius: 10px; padding: 10px 14px; font-size: 12px;
    color: rgba(245,158,11,.85); margin-top: 14px; line-height: 1.5;
  }

  /* FOOTER */
  .lp-footer {
    padding: 32px 24px; text-align: center;
    border-top: 1px solid rgba(255,255,255,.05);
    font-size: 12px; color: rgba(255,255,255,.2);
  }

  @media (max-width: 640px) {
    .lp-nav { padding: 14px 20px; }
    .hero-headline { letter-spacing: -0.5px; }
    .lp-section { padding: 72px 20px; }
    .form-card { padding: 32px 24px; }
    .number-item { min-width: 130px; padding: 28px 16px; }
    .number-val { font-size: 32px; }
  }
`;

const PARTICLES = [
  { w: 4, left: "8%",  delay: "0s",   dur: "10s" },
  { w: 6, left: "20%", delay: "3s",   dur: "14s" },
  { w: 3, left: "38%", delay: "1.5s", dur: "9s"  },
  { w: 5, left: "55%", delay: "4.5s", dur: "12s" },
  { w: 4, left: "72%", delay: "2s",   dur: "11s" },
  { w: 7, left: "88%", delay: "0.5s", dur: "13s" },
];

type Assoc = { id: string; nome: string };

export default function LandingConsultorPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [associacoes, setAssociacoes] = useState<Assoc[]>([]);
  const [step, setStep] = useState<"form" | "sucesso">("form");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [associacao, setAssociacao] = useState("");
  const [associacaoTexto, setAssociacaoTexto] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState("");

  useEffect(() => {
    fetch("/api/publico/associacoes")
      .then((r) => r.json())
      .then((d) => setAssociacoes(d.associacoes ?? []));
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const fmtTel = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const tel = telefone.replace(/\D/g, "");
    if (tel.length < 10) { setErro("Digite um WhatsApp válido com DDD"); return; }
    const nomeAssoc = associacao === "outra" ? associacaoTexto : associacao;
    if (!nomeAssoc.trim()) { setErro("Informe sua associação"); return; }

    setCarregando(true);
    try {
      const res = await fetch("/api/publico/consultor-cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, cidade, associacao: nomeAssoc }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao cadastrar"); }
      else { setSenhaGerada(json.senhaTemp); setStep("sucesso"); }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-page">

        {/* NAV */}
        <nav className="lp-nav">
          <div className="nav-logo">
            <img src="/logo-indique.png" alt="Logo" />
            <span className="nav-logo-text">INDIQUE PLACA</span>
          </div>
          <button className="nav-cta" onClick={scrollToForm}>
            Quero me cadastrar
          </button>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="hero-glow1" />
          <div className="hero-glow2" />
          {PARTICLES.map((p, i) => (
            <div key={i} className="hero-particle" style={{
              width: p.w, height: p.w, left: p.left, bottom: "-10px",
              animationDelay: p.delay, animationDuration: p.dur,
            }} />
          ))}

          <div className="hero-badge">
            <div className="badge-dot" />
            Sistema de vendas em escala
          </div>

          <div className="hero-logo">
            <img src="/logo-indique.png" alt="Logo" style={{ width: 90, height: 90, objectFit: "contain" }} />
          </div>

          <h1 className="hero-headline">
            Venda <span className="headline-green">100, 200 placas</span><br />
            por mês. No piloto<br />automático.
          </h1>

          <p className="hero-sub">
            Pare de depender só de você mesmo. Com o Indique Placa você monta um time de indicadores que traz leads enquanto você fecha negócios — e dorme.
          </p>

          <div className="hero-cta-wrap">
            <button className="hero-cta" onClick={scrollToForm}>
              Quero dobrar minhas vendas
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <span className="hero-cta-note">Cadastro gratuito. Sem taxa. Sem contrato.</span>
          </div>
        </section>

        {/* NUMEROS */}
        <div className="lp-numbers">
          {[
            { val: "200+", label: "Placas vendidas/mês por top consultores" },
            { val: "3x",   label: "Aumento médio de conversão com indicadores" },
            { val: "100%", label: "Gratuito para consultores" },
            { val: "24h",  label: "Para receber seu primeiro lead" },
          ].map((n) => (
            <div key={n.label} className="number-item">
              <div className="number-val">{n.val}</div>
              <div className="number-label">{n.label}</div>
            </div>
          ))}
        </div>

        {/* COMO FUNCIONA */}
        <section style={{ padding: "100px 24px", background: "#040c14" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="section-badge">Como funciona</div>
            <h2 className="section-title">
              Simples, rápido<br />e em escala
            </h2>
            <p className="section-sub">
              Três etapas para transformar sua operação individual em uma máquina de vendas.
            </p>

            <div className="steps-grid">
              {[
                {
                  n: "01", icon: "🎯",
                  title: "Você se cadastra como consultor",
                  desc: "Em menos de 2 minutos você já está dentro do painel com seu link exclusivo de captação de indicadores.",
                },
                {
                  n: "02", icon: "📲",
                  title: "Recruta indicadores pelo seu link",
                  desc: "Compartilha o link no WhatsApp, grupos e redes sociais. Cada indicador vira um vendedor no campo trabalhando pra você.",
                },
                {
                  n: "03", icon: "💰",
                  title: "Recebe leads e fecha mais vendas",
                  desc: "Cada indicador traz clientes. Você fecha. Quanto mais indicadores, mais leads — e mais placas vendidas todo mês.",
                },
              ].map((s) => (
                <div key={s.n} className="step-card">
                  <div className="step-number">{s.n}</div>
                  <div className="step-icon">{s.icon}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section style={{ padding: "80px 24px 100px", background: "rgba(255,255,255,.01)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="section-badge">Por que usar</div>
            <h2 className="section-title">
              Tudo que você precisava<br />para escalar
            </h2>

            <div className="benefits-grid">
              {[
                { icon: "📊", title: "Painel completo em tempo real", desc: "Veja cada lead recebido, cada indicador ativo e suas conversões num dashboard limpo e moderno." },
                { icon: "🤝", title: "Time de vendas sem custo fixo", desc: "Seus indicadores só ganham quando você ganha. Zero custo fixo, zero risco. Só resultado." },
                { icon: "🔗", title: "Link exclusivo de captação", desc: "Seu link único leva candidatos direto para a página de cadastro de indicadores já vinculada a você." },
                { icon: "📱", title: "Funciona pelo celular", desc: "Painel 100% mobile. Você acompanha leads e indicadores de qualquer lugar, a qualquer hora." },
                { icon: "⚡", title: "Lead chega em segundos", desc: "Assim que o indicador cadastra um cliente, você recebe o lead imediatamente no seu painel." },
                { icon: "📈", title: "Escala sem limite", desc: "10 indicadores vendem 10x mais. 100 indicadores vendem 100x mais. Você escolhe até onde ir." },
              ].map((b) => (
                <div key={b.title} className="benefit-card">
                  <div className="benefit-icon">{b.icon}</div>
                  <div className="benefit-title">{b.title}</div>
                  <div className="benefit-desc">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROVA SOCIAL */}
        <div className="lp-proof">
          <div className="proof-stars">★★★★★</div>
          <p className="proof-quote">
            "Eu vendia 20 placas por mês sozinho. Com meus indicadores, no segundo mês já tinha batido 80. Hoje trabalho menos e ganho mais."
          </p>
          <div className="proof-author">Consultor de proteção veicular — São Paulo, SP</div>
        </div>

        {/* FORM */}
        <section className="lp-form-section" ref={formRef}>
          <div className="form-glow" />
          <div className="form-inner">
            <div style={{ marginBottom: 36, animation: "fadeUp .6s ease both" }}>
              <div className="section-badge" style={{ display: "block", marginBottom: 10 }}>Cadastro gratuito</div>
              <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, marginBottom: 12 }}>
                Comece agora.<br />É de graça.
              </h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,.4)", lineHeight: 1.6 }}>
                Preencha em 30 segundos e acesse seu painel imediatamente.
              </p>
            </div>

            <div className="form-card">
              <div className="form-scan" />
              <div className="form-corner fc-tl" />
              <div className="form-corner fc-tr" />
              <div className="form-corner fc-bl" />
              <div className="form-corner fc-br" />

              {step === "sucesso" ? (
                <div style={{ textAlign: "center" }}>
                  <div className="sucesso-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Cadastro realizado!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginBottom: 20 }}>
                    Use os dados abaixo para entrar no seu painel
                  </div>
                  <div className="credencial-box">
                    <div className="cred-label">WhatsApp</div>
                    <div className="cred-val">{telefone}</div>
                  </div>
                  <div className="credencial-box">
                    <div className="cred-label">Senha temporária</div>
                    <div className="cred-val" style={{ fontSize: 26, letterSpacing: 6, color: "#10b981" }}>{senhaGerada}</div>
                  </div>
                  <div className="senha-hint">Anote essa senha agora. Altere no primeiro acesso.</div>
                  <button
                    className="btn-cadastrar"
                    style={{ marginTop: 20 }}
                    onClick={() => window.location.href = "/consultor/login"}
                  >
                    Acessar meu painel
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  {erro && <div className="erro-box">{erro}</div>}
                  <form onSubmit={enviar}>
                    <div className="campo-group">
                      <label className="campo-label">Nome completo</label>
                      <input className="campo" type="text" placeholder="Seu nome" value={nome} required onChange={(e) => setNome(e.target.value)} />
                    </div>
                    <div className="campo-group">
                      <label className="campo-label">WhatsApp (com DDD)</label>
                      <input className="campo" type="tel" placeholder="(11) 99999-9999" value={telefone} required onChange={(e) => setTelefone(fmtTel(e.target.value))} />
                    </div>
                    <div className="campo-group">
                      <label className="campo-label">Cidade</label>
                      <input className="campo" type="text" placeholder="Sua cidade" value={cidade} required onChange={(e) => setCidade(e.target.value)} />
                    </div>
                    <div className="campo-group">
                      <label className="campo-label">Associação</label>
                      {associacoes.length > 0 ? (
                        <select className="campo campo-select" required value={associacao} onChange={(e) => setAssociacao(e.target.value)}>
                          <option value="">Selecione sua associação</option>
                          {associacoes.map((a) => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                          <option value="outra">Outra associação</option>
                        </select>
                      ) : (
                        <input className="campo" type="text" placeholder="Nome da sua associação" value={associacao} required onChange={(e) => setAssociacao(e.target.value)} />
                      )}
                    </div>
                    {associacao === "outra" && (
                      <div className="campo-group">
                        <label className="campo-label">Qual associação?</label>
                        <input className="campo" type="text" placeholder="Digite o nome" value={associacaoTexto} required onChange={(e) => setAssociacaoTexto(e.target.value)} />
                      </div>
                    )}
                    <button className="btn-cadastrar" type="submit" disabled={carregando}>
                      {carregando ? "Cadastrando..." : (
                        <>
                          Quero meu painel gratuito
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </>
                      )}
                    </button>
                    <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,.25)", textAlign: "center", lineHeight: 1.6 }}>
                      Já tem cadastro?{" "}
                      <a href="/consultor/login" style={{ color: "rgba(16,185,129,.6)", textDecoration: "none" }}>Entrar no painel</a>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          © {new Date().getFullYear()} Indique Placa — Todos os direitos reservados
        </footer>

      </div>
    </>
  );
}
