"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  @keyframes gradientShift {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glowPulse {
    0%,100% { opacity: .3; transform: scale(1); }
    50%     { opacity: .6; transform: scale(1.08); }
  }
  @keyframes particle {
    0%   { transform: translateY(0) scale(1); opacity: .5; }
    100% { transform: translateY(-110vh) scale(0); opacity: 0; }
  }
  @keyframes scanLine {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(500%); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: scale(.8); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50%     { opacity: .4; }
  }
  @keyframes checkPop {
    0%   { transform: scale(0); opacity: 0; }
    70%  { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  .lp-cad {
    font-family: Inter, system-ui, sans-serif;
    background: #020d1a;
    color: #fff;
    min-height: 100vh;
  }

  /* NAV */
  .lp-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px;
    background: rgba(2,13,26,.9);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .nav-logo { display: flex; align-items: center; gap: 10px; }
  .nav-logo img { width: 36px; height: 36px; object-fit: contain; }
  .nav-nome { font-size: 15px; font-weight: 800; letter-spacing: -.3px; color: #fff; }
  .nav-cta {
    padding: 10px 22px; border-radius: 10px;
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer;
    transition: opacity .15s, transform .1s;
  }
  .nav-cta:hover { opacity: .9; transform: translateY(-1px); }

  /* HERO */
  .lp-hero {
    position: relative; overflow: hidden;
    padding: 100px 24px 120px;
    background: linear-gradient(160deg, #020d1a 0%, #041828 40%, #031a0e 70%, #020d1a 100%);
    background-size: 300% 300%;
    animation: gradientShift 18s ease infinite;
    text-align: center;
  }
  .hero-glow1 {
    position: absolute; width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,.13) 0%, transparent 65%);
    top: -200px; left: 50%; transform: translateX(-50%);
    animation: glowPulse 8s ease-in-out infinite;
    pointer-events: none;
  }
  .hero-glow2 {
    position: absolute; width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,.08) 0%, transparent 65%);
    bottom: -100px; right: -50px;
    animation: glowPulse 10s ease-in-out infinite reverse;
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
    padding: 6px 16px; border-radius: 99px;
    background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.25);
    font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #10b981;
    text-transform: uppercase; margin-bottom: 32px;
    animation: fadeUp .6s ease both;
  }
  .badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #10b981;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .hero-logo {
    display: flex; justify-content: center; margin-bottom: 28px;
    animation: fadeUp .7s ease both .1s;
  }
  .hero-headline {
    font-size: clamp(36px, 6vw, 72px);
    font-weight: 900; line-height: 1.05;
    letter-spacing: -2px; margin-bottom: 20px;
    animation: fadeUp .7s ease both .15s;
  }
  .headline-green { color: #10b981; }
  .hero-sub {
    font-size: clamp(15px, 2vw, 18px);
    color: rgba(255,255,255,.5); line-height: 1.7;
    max-width: 580px; margin: 0 auto 40px;
    animation: fadeUp .7s ease both .2s;
  }
  .hero-cta-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    animation: fadeUp .7s ease both .25s;
  }
  .hero-cta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 18px 40px; border-radius: 14px; border: none;
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff; font-size: 17px; font-weight: 800;
    cursor: pointer; letter-spacing: -.3px;
    box-shadow: 0 8px 32px rgba(16,185,129,.35);
    transition: opacity .15s, transform .15s, box-shadow .15s;
  }
  .hero-cta:hover { opacity: .92; transform: translateY(-3px); box-shadow: 0 14px 40px rgba(16,185,129,.45); }
  .hero-cta-note { font-size: 12px; color: rgba(255,255,255,.3); }

  /* NUMEROS */
  .lp-nums {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border-top: 1px solid rgba(255,255,255,.06);
    border-bottom: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.02);
  }
  .num-item {
    padding: 40px 24px; text-align: center;
    border-right: 1px solid rgba(255,255,255,.06);
  }
  .num-item:last-child { border-right: none; }
  .num-val { font-size: 42px; font-weight: 900; color: #10b981; letter-spacing: -2px; }
  .num-label { font-size: 12px; color: rgba(255,255,255,.4); margin-top: 4px; line-height: 1.4; }

  /* SECTIONS */
  .section-badge {
    display: inline-block; font-size: 11px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase;
    color: #10b981; margin-bottom: 12px;
  }
  .section-title {
    font-size: clamp(28px, 4vw, 48px);
    font-weight: 900; letter-spacing: -1.5px; line-height: 1.1;
    margin-bottom: 16px;
  }
  .section-sub {
    font-size: 16px; color: rgba(255,255,255,.4); line-height: 1.7;
    max-width: 520px;
  }

  /* COMO FUNCIONA */
  .steps-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 24px; margin-top: 48px;
  }
  .step-card {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px; padding: 32px 24px;
    position: relative; overflow: hidden;
    transition: border-color .2s, background .2s;
  }
  .step-card:hover { border-color: rgba(16,185,129,.2); background: rgba(16,185,129,.03); }
  .step-num {
    font-size: 56px; font-weight: 900; letter-spacing: -3px;
    color: rgba(16,185,129,.12); position: absolute; top: 16px; right: 20px;
    line-height: 1;
  }
  .step-icon { font-size: 32px; margin-bottom: 16px; }
  .step-title { font-size: 17px; font-weight: 800; margin-bottom: 10px; }
  .step-desc { font-size: 14px; color: rgba(255,255,255,.45); line-height: 1.6; }

  /* BENEFICIOS */
  .benefits-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; margin-top: 48px;
  }
  .benefit-card {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 16px; padding: 28px 24px;
    transition: border-color .2s;
  }
  .benefit-card:hover { border-color: rgba(16,185,129,.2); }
  .benefit-icon { font-size: 28px; margin-bottom: 12px; }
  .benefit-title { font-size: 15px; font-weight: 800; margin-bottom: 8px; }
  .benefit-desc { font-size: 13px; color: rgba(255,255,255,.4); line-height: 1.6; }

  /* PROVA SOCIAL */
  .lp-proof {
    text-align: center; padding: 80px 24px;
    background: rgba(16,185,129,.03);
    border-top: 1px solid rgba(16,185,129,.1);
    border-bottom: 1px solid rgba(16,185,129,.1);
  }
  .proof-stars { font-size: 24px; color: #f59e0b; letter-spacing: 4px; margin-bottom: 20px; }
  .proof-quote {
    font-size: clamp(18px, 3vw, 26px);
    font-weight: 700; font-style: italic;
    color: rgba(255,255,255,.85); max-width: 700px;
    margin: 0 auto 20px; line-height: 1.5;
  }
  .proof-author { font-size: 13px; color: rgba(255,255,255,.35); }

  /* URGENCIA */
  .lp-urgencia {
    background: linear-gradient(135deg, rgba(245,158,11,.08), rgba(239,68,68,.05));
    border-top: 1px solid rgba(245,158,11,.15);
    border-bottom: 1px solid rgba(245,158,11,.15);
    padding: 40px 24px; text-align: center;
  }
  .urgencia-inner { max-width: 640px; margin: 0 auto; }
  .urgencia-title { font-size: 22px; font-weight: 900; margin-bottom: 10px; color: #f59e0b; }
  .urgencia-desc { font-size: 15px; color: rgba(255,255,255,.5); line-height: 1.6; }

  /* FORMULARIO */
  .lp-form-section {
    padding: 100px 24px 120px;
    background: linear-gradient(160deg, #020d1a 0%, #041828 50%, #020d1a 100%);
    position: relative; overflow: hidden;
  }
  .form-glow {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,.1) 0%, transparent 65%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    animation: glowPulse 8s ease-in-out infinite;
    pointer-events: none;
  }
  .form-inner { position: relative; max-width: 520px; margin: 0 auto; text-align: center; }
  .form-card {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 28px; padding: 44px 40px;
    text-align: left; margin-top: 40px;
    box-shadow: 0 40px 120px rgba(0,0,0,.6);
    position: relative; overflow: hidden;
  }
  .form-scan {
    position: absolute; left: 0; right: 0; height: 2px; top: 0;
    background: linear-gradient(90deg, transparent, rgba(16,185,129,.5), transparent);
    animation: scanLine 5s ease-in-out infinite;
    pointer-events: none;
  }
  .form-corner { position: absolute; width: 18px; height: 18px; border-color: rgba(16,185,129,.35); border-style: solid; pointer-events: none; }
  .fc-tl { top: 14px; left: 14px; border-width: 2px 0 0 2px; border-radius: 3px 0 0 0; }
  .fc-tr { top: 14px; right: 14px; border-width: 2px 2px 0 0; border-radius: 0 3px 0 0; }
  .fc-bl { bottom: 14px; left: 14px; border-width: 0 0 2px 2px; border-radius: 0 0 0 3px; }
  .fc-br { bottom: 14px; right: 14px; border-width: 0 2px 2px 0; border-radius: 0 0 3px 0; }

  .campo-group { margin-bottom: 16px; }
  .campo-label {
    display: block; font-size: 11px; font-weight: 700;
    letter-spacing: .5px; color: rgba(255,255,255,.45);
    text-transform: uppercase; margin-bottom: 7px;
  }
  .campo {
    width: 100%; padding: 14px 16px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px; font-size: 15px; color: #fff;
    outline: none; font-family: inherit;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .campo:focus {
    border-color: rgba(16,185,129,.45);
    background: rgba(16,185,129,.04);
    box-shadow: 0 0 0 3px rgba(16,185,129,.12);
  }
  .campo::placeholder { color: rgba(255,255,255,.2); }
  .campo-select {
    appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px;
  }
  .campo-select option { background: #0c1929; color: #fff; }

  .btn-cad {
    width: 100%; padding: 17px; border: none; border-radius: 14px;
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff; font-size: 16px; font-weight: 800;
    cursor: pointer; font-family: inherit; letter-spacing: -.2px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    box-shadow: 0 6px 28px rgba(16,185,129,.35);
    transition: opacity .15s, transform .1s, box-shadow .15s;
    margin-top: 8px;
  }
  .btn-cad:hover:not(:disabled) { opacity: .9; transform: translateY(-2px); box-shadow: 0 12px 36px rgba(16,185,129,.45); }
  .btn-cad:disabled { opacity: .5; cursor: not-allowed; }

  .erro-box {
    background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2);
    border-radius: 10px; padding: 11px 14px; font-size: 13px;
    color: #f87171; margin-bottom: 16px; text-align: center;
  }

  /* SUCESSO */
  .sucesso-wrap { text-align: center; }
  .sucesso-icon {
    width: 88px; height: 88px; border-radius: 50%;
    background: rgba(16,185,129,.12); border: 2px solid rgba(16,185,129,.35);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
    animation: checkPop .6s cubic-bezier(.34,1.56,.64,1) both;
  }
  .cred-box {
    background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.1);
    border-radius: 14px; padding: 16px 20px; margin-bottom: 10px; text-align: left;
  }
  .cred-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,.3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .cred-valor { font-size: 16px; font-weight: 700; color: #fff; font-family: 'Courier New', monospace; }
  .cred-hint {
    background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.18);
    border-radius: 10px; padding: 12px 16px; font-size: 12px;
    color: rgba(245,158,11,.85); margin-top: 16px; line-height: 1.6; text-align: center;
  }

  /* FOOTER */
  .lp-footer {
    text-align: center; padding: 32px;
    font-size: 12px; color: rgba(255,255,255,.2);
    border-top: 1px solid rgba(255,255,255,.05);
  }

  @media (max-width: 768px) {
    .lp-nums { grid-template-columns: repeat(2, 1fr); }
    .steps-grid, .benefits-grid { grid-template-columns: 1fr; }
    .lp-nav { padding: 14px 20px; }
    .form-card { padding: 32px 24px; }
  }
`;

const PARTICLES = [
  { w: 4, left: "8%",  delay: "0s",   dur: "10s" },
  { w: 6, left: "22%", delay: "3s",   dur: "14s" },
  { w: 3, left: "40%", delay: "1.5s", dur: "9s"  },
  { w: 5, left: "58%", delay: "4.5s", dur: "12s" },
  { w: 4, left: "75%", delay: "2s",   dur: "11s" },
  { w: 7, left: "88%", delay: "0.5s", dur: "13s" },
];

type Associacao = { id: string; nome: string };

export default function ConsultorCadastroPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [associacao, setAssociacao] = useState("");
  const [associacaoTexto, setAssociacaoTexto] = useState("");
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState("");

  useEffect(() => {
    fetch("/api/publico/associacoes")
      .then((r) => r.json())
      .then((d) => setAssociacoes(d.associacoes ?? []));
  }, []);

  const fmtTel = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`;
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  };

  const irParaForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const tel = telefone.replace(/\D/g, "");
    if (tel.length < 10) { setErro("Digite um WhatsApp valido com DDD"); return; }
    const nomeAssoc = associacao === "outra" ? associacaoTexto : associacao;
    if (!nomeAssoc.trim()) { setErro("Informe a associacao"); return; }

    setCarregando(true);
    try {
      const res = await fetch("/api/publico/consultor-cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, cidade, associacao: nomeAssoc }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao cadastrar"); }
      else { setSenhaGerada(json.senhaTemp); setSucesso(true); }
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-cad">

        {/* NAV */}
        <nav className="lp-nav">
          <div className="nav-logo">
            <img src="/logo-indique-placa.png" alt="Indique Placa" style={{ width: 120, height: "auto" }} />
          </div>
          <button className="nav-cta" onClick={irParaForm}>Quero me cadastrar</button>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="hero-glow1" />
          <div className="hero-glow2" />
          {PARTICLES.map((p, i) => (
            <div key={i} className="hero-particle" style={{ width: p.w, height: p.w, left: p.left, bottom: -10, animationDelay: p.delay, animationDuration: p.dur }} />
          ))}

          <div className="hero-badge">
            <div className="badge-dot" />
            Plataforma de vendas em escala
          </div>

          <div className="hero-logo">
            <img src="/favicon-indique.png" alt="Logo" style={{ width: 90, height: 90, objectFit: "contain", borderRadius: 20 }} />
          </div>

          <h1 className="hero-headline">
            Pare de vender sozinho.<br />
            Monte seu <span className="headline-green">time de indicadores</span><br />
            e dobre suas placas.
          </h1>

          <p className="hero-sub">
            Consultores que usam o Indique Placa vendem 3x mais sem trabalhar 3x mais.
            Seus indicadores trazem os clientes. Voce so fecha os negocios.
          </p>

          <div className="hero-cta-wrap">
            <button className="hero-cta" onClick={irParaForm}>
              Quero meu painel gratuito
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <span className="hero-cta-note">Gratis. Sem contrato. Sem taxa. Em 2 minutos voce esta dentro.</span>
          </div>
        </section>

        {/* NUMEROS */}
        <div className="lp-nums">
          {[
            { val: "3x", label: "Aumento medio de vendas com indicadores ativos" },
            { val: "200+", label: "Placas vendidas por mes pelos top consultores" },
            { val: "2min", label: "Para ativar seu painel e comecar a captar" },
            { val: "100%", label: "Gratuito para consultores. Sempre." },
          ].map(({ val, label }) => (
            <div key={val} className="num-item">
              <div className="num-val">{val}</div>
              <div className="num-label">{label}</div>
            </div>
          ))}
        </div>

        {/* COMO FUNCIONA */}
        <section style={{ padding: "100px 24px", background: "#040c14" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="section-badge">Como funciona</div>
            <h2 className="section-title">Simples. Rapido.<br />Resultados reais.</h2>
            <p className="section-sub">Tres passos para transformar sua operacao individual em uma maquina de vendas.</p>
            <div className="steps-grid">
              {[
                { n: "01", icon: "🎯", title: "Voce se cadastra gratis", desc: "Em 2 minutos voce tem seu painel com link exclusivo de captacao de indicadores. Sem burocracia." },
                { n: "02", icon: "📲", title: "Compartilha seu link", desc: "Manda o link no WhatsApp, grupos, stories. Cada pessoa que clicar pode virar um indicador trabalhando pra voce." },
                { n: "03", icon: "💰", title: "Recebe leads e fecha mais", desc: "Cada indicador traz clientes. Voce so fecha. Quanto mais indicadores, mais leads. Escala sem limite." },
              ].map((s) => (
                <div key={s.n} className="step-card">
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon">{s.icon}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section style={{ padding: "80px 24px", background: "rgba(255,255,255,.01)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="section-badge">Por que usar</div>
            <h2 className="section-title">Tudo que voce precisava<br />para vender em escala</h2>
            <div className="benefits-grid">
              {[
                { icon: "📊", title: "Painel em tempo real", desc: "Veja cada lead chegando, cada indicador ativo, suas conversoes. Tudo num dashboard limpo e moderno." },
                { icon: "🤝", title: "Time sem custo fixo", desc: "Seus indicadores so ganham quando voce ganha. Zero risco. Zero custo fixo. So resultado." },
                { icon: "🔗", title: "Link exclusivo seu", desc: "Seu link unico leva candidatos direto para a pagina de cadastro de indicadores vinculada a voce." },
                { icon: "📱", title: "100% pelo celular", desc: "Acompanhe leads e indicadores de qualquer lugar. Painel responsivo, rapido e sempre disponivel." },
                { icon: "⚡", title: "Lead chega em segundos", desc: "Assim que o indicador cadastra um cliente, voce recebe o lead imediatamente no painel." },
                { icon: "📈", title: "Escala sem limite", desc: "10 indicadores = 10x mais leads. 100 indicadores = 100x mais. Voce escolhe ate onde ir." },
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
            "Eu vendia 20 placas por mes sozinho. Com meus indicadores, no segundo mes ja tinha batido 80. Hoje trabalho menos e ganho muito mais."
          </p>
          <div className="proof-author">Consultor de protecao veicular — Sao Paulo, SP</div>
        </div>

        {/* URGENCIA */}
        <div className="lp-urgencia">
          <div className="urgencia-inner">
            <div className="urgencia-title">Cada dia sem indicadores e um dia perdendo vendas</div>
            <div className="urgencia-desc">
              Enquanto voce vende sozinho, outros consultores ja estao com times de 10, 20, 50 indicadores
              trazendo clientes todo dia. O cadastro e gratis e leva 2 minutos.
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <section className="lp-form-section" ref={formRef}>
          <div className="form-glow" />
          <div className="form-inner">
            <div className="section-badge">Cadastro gratuito</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 12 }}>
              Comece agora.<br /><span className="headline-green">E de graca.</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.35)", lineHeight: 1.7 }}>
              Preencha em 2 minutos e acesse seu painel com link de captacao imediatamente.
            </p>

            <div className="form-card">
              <div className="form-scan" />
              <div className="form-corner fc-tl" /><div className="form-corner fc-tr" />
              <div className="form-corner fc-bl" /><div className="form-corner fc-br" />

              {sucesso ? (
                <div className="sucesso-wrap">
                  <div className="sucesso-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Cadastro realizado!</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.4)", marginBottom: 24 }}>
                    Bem-vindo, {nome.split(" ")[0]}! Use os dados abaixo para entrar no painel.
                  </div>
                  <div className="cred-box">
                    <div className="cred-label">WhatsApp</div>
                    <div className="cred-valor">{telefone}</div>
                  </div>
                  <div className="cred-box">
                    <div className="cred-label">Senha temporaria</div>
                    <div className="cred-valor" style={{ fontSize: 26, letterSpacing: 8, color: "#10b981" }}>{senhaGerada}</div>
                  </div>
                  <div className="cred-hint">Anote essa senha agora. Altere no seu primeiro acesso.</div>
                  <button className="btn-cad" style={{ marginTop: 24 }} onClick={() => router.push("/consultor/login")}>
                    Acessar meu painel
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <form onSubmit={enviar}>
                  {erro && <div className="erro-box">{erro}</div>}

                  <div className="campo-group">
                    <label className="campo-label">Nome completo</label>
                    <input className="campo" type="text" placeholder="Seu nome completo" value={nome} required onChange={(e) => setNome(e.target.value)} />
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
                    <label className="campo-label">Associacao</label>
                    {associacoes.length > 0 ? (
                      <select className="campo campo-select" required value={associacao} onChange={(e) => setAssociacao(e.target.value)}>
                        <option value="">Selecione a associacao</option>
                        {associacoes.map((a) => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                        <option value="outra">Outra associacao</option>
                      </select>
                    ) : (
                      <input className="campo" type="text" placeholder="Nome da sua associacao" value={associacao} required onChange={(e) => setAssociacao(e.target.value)} />
                    )}
                  </div>
                  {associacao === "outra" && (
                    <div className="campo-group">
                      <label className="campo-label">Qual associacao?</label>
                      <input className="campo" type="text" placeholder="Digite o nome" value={associacaoTexto} required onChange={(e) => setAssociacaoTexto(e.target.value)} />
                    </div>
                  )}

                  <button className="btn-cad" type="submit" disabled={carregando}>
                    {carregando ? "Cadastrando..." : (
                      <>
                        Quero meu painel gratuito
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </>
                    )}
                  </button>

                  <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.25)", lineHeight: 1.6 }}>
                    Ja tem cadastro?{" "}
                    <a href="/consultor/login" style={{ color: "rgba(16,185,129,.6)", textDecoration: "none" }}>Entrar no painel</a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          © 2026 Indique Placa — Todos os direitos reservados
        </footer>

      </div>
    </>
  );
}
