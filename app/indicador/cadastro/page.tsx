"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes floatLogo {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(1.08); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes particle {
    0%   { transform: translateY(0) scale(1); opacity: 0.4; }
    100% { transform: translateY(-110vh) scale(0); opacity: 0; }
  }
  @keyframes scanLine {
    0%   { transform: translateY(-100%); opacity: 0.5; }
    100% { transform: translateY(500%); opacity: 0; }
  }
  @keyframes checkPop {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
    50% { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
  }

  .ind-page {
    min-height: 100vh;
    background: #040c14;
    font-family: Inter, system-ui, sans-serif;
    color: #fff;
    overflow-x: hidden;
  }

  /* HERO */
  .ind-hero {
    position: relative; overflow: hidden;
    padding: 80px 24px 80px;
    background: linear-gradient(135deg, #020d1a, #1a0a00, #0d0500, #041828, #020d1a);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    text-align: center;
  }
  .ind-glow1 {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,.1) 0%, transparent 65%);
    top: -150px; left: -150px; animation: glowPulse 8s ease-in-out infinite;
    pointer-events: none;
  }
  .ind-glow2 {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(239,68,68,.06) 0%, transparent 65%);
    bottom: -100px; right: -100px; animation: glowPulse 10s ease-in-out infinite reverse;
    pointer-events: none;
  }
  .ind-particle {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.1);
    animation: particle linear infinite;
    pointer-events: none;
  }

  .ind-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.3);
    border-radius: 99px; padding: 6px 16px;
    font-size: 12px; font-weight: 700; color: #f59e0b; letter-spacing: 1px;
    text-transform: uppercase; margin-bottom: 24px;
    animation: fadeUp .5s ease both;
  }
  .ind-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: pulse 2s ease infinite; }
  .ind-logo { animation: floatLogo 4s ease-in-out infinite; margin-bottom: 20px; }
  .ind-headline {
    font-size: clamp(32px, 5.5vw, 64px); font-weight: 900; line-height: 1.05;
    letter-spacing: -1.5px; animation: fadeUp .6s .1s ease both; margin-bottom: 14px;
  }
  .ind-headline-amber { color: #f59e0b; }
  .ind-sub {
    font-size: clamp(15px, 2.2vw, 20px); color: rgba(255,255,255,.5);
    max-width: 580px; margin: 0 auto 36px; line-height: 1.65;
    animation: fadeUp .6s .2s ease both;
  }
  .ind-cta {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 16px 36px;
    background: linear-gradient(135deg, #b45309, #f59e0b);
    border: none; border-radius: 14px; color: #fff;
    font-size: 16px; font-weight: 900; letter-spacing: .5px;
    cursor: pointer; font-family: inherit; transition: all .2s;
    box-shadow: 0 6px 28px rgba(245,158,11,.35);
    animation: fadeUp .6s .3s ease both;
  }
  .ind-cta:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(245,158,11,.5); }

  /* COMO FUNCIONA */
  .ind-section { padding: 80px 24px; max-width: 1000px; margin: 0 auto; }
  .ind-section-badge {
    display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 2px;
    text-transform: uppercase; color: #f59e0b; margin-bottom: 10px;
  }
  .ind-section-title {
    font-size: clamp(26px, 3.5vw, 42px); font-weight: 900; line-height: 1.1;
    letter-spacing: -1px; margin-bottom: 12px;
  }
  .ind-section-sub { font-size: 16px; color: rgba(255,255,255,.4); max-width: 520px; line-height: 1.6; }

  .ind-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; margin-top: 48px; }
  .ind-step {
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
    border-radius: 22px; padding: 32px 26px; position: relative; overflow: hidden;
    transition: transform .2s, border-color .2s;
  }
  .ind-step:hover { transform: translateY(-4px); border-color: rgba(245,158,11,.25); }
  .ind-step-n {
    font-size: 56px; font-weight: 900; color: rgba(245,158,11,.1);
    position: absolute; top: 16px; right: 20px; line-height: 1;
  }
  .ind-step-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, rgba(245,158,11,.2), rgba(245,158,11,.05));
    border: 1px solid rgba(245,158,11,.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 18px;
  }
  .ind-step-title { font-size: 17px; font-weight: 800; margin-bottom: 8px; }
  .ind-step-desc { font-size: 13px; color: rgba(255,255,255,.42); line-height: 1.65; }

  /* GANHOS */
  .ind-ganhos {
    padding: 80px 24px;
    background: linear-gradient(135deg, rgba(245,158,11,.05) 0%, transparent 50%);
    border-top: 1px solid rgba(255,255,255,.05);
    border-bottom: 1px solid rgba(255,255,255,.05);
    text-align: center;
  }
  .ind-ganhos-inner { max-width: 900px; margin: 0 auto; }
  .ganhos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 48px; }
  .ganha-card {
    background: rgba(245,158,11,.06); border: 1px solid rgba(245,158,11,.15);
    border-radius: 20px; padding: 32px 20px; text-align: center;
  }
  .ganha-icon { font-size: 32px; margin-bottom: 12px; }
  .ganha-title { font-size: 15px; font-weight: 800; margin-bottom: 8px; }
  .ganha-desc { font-size: 13px; color: rgba(255,255,255,.4); line-height: 1.6; }

  /* FORM */
  .ind-form-section {
    padding: 80px 24px 100px;
    background: #040c14;
    position: relative; overflow: hidden;
  }
  .ind-form-glow {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,.07) 0%, transparent 65%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    animation: glowPulse 8s ease-in-out infinite;
    pointer-events: none;
  }
  .ind-form-inner { position: relative; max-width: 480px; margin: 0 auto; text-align: center; }
  .ind-form-card {
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 30px; padding: 40px 36px;
    box-shadow: 0 32px 100px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06);
    position: relative; overflow: hidden;
  }
  .ind-scan {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(245,158,11,.5), transparent);
    animation: scanLine 4s ease-in-out infinite; pointer-events: none;
  }
  .ind-corner { position: absolute; width: 18px; height: 18px; border-color: rgba(245,158,11,.35); border-style: solid; pointer-events: none; }
  .ic-tl { top: 14px; left: 14px; border-width: 2px 0 0 2px; border-radius: 4px 0 0 0; }
  .ic-tr { top: 14px; right: 14px; border-width: 2px 2px 0 0; border-radius: 0 4px 0 0; }
  .ic-bl { bottom: 14px; left: 14px; border-width: 0 0 2px 2px; border-radius: 0 0 0 4px; }
  .ic-br { bottom: 14px; right: 14px; border-width: 0 2px 2px 0; border-radius: 0 0 4px 0; }

  .campo-group { margin-bottom: 14px; text-align: left; }
  .campo-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .5px; color: rgba(255,255,255,.4); text-transform: uppercase; margin-bottom: 6px; }
  .campo {
    width: 100%; padding: 13px 16px;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px; font-size: 15px; color: #fff;
    outline: none; font-family: inherit;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .campo:focus { border-color: rgba(245,158,11,.5); background: rgba(245,158,11,.04); box-shadow: 0 0 0 3px rgba(245,158,11,.1); }
  .campo::placeholder { color: rgba(255,255,255,.2); }
  .senha-wrap { position: relative; }
  .senha-wrap .campo { padding-right: 44px; }
  .olho-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.4);
    display: flex; align-items: center; padding: 4px; transition: color .15s;
  }
  .olho-btn:hover { color: rgba(255,255,255,.8); }

  .btn-ind {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, #b45309, #f59e0b);
    border: none; border-radius: 12px; color: #fff;
    font-size: 15px; font-weight: 900; letter-spacing: .5px;
    cursor: pointer; font-family: inherit; transition: all .2s;
    box-shadow: 0 6px 24px rgba(245,158,11,.3);
    display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px;
  }
  .btn-ind:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(245,158,11,.45); }
  .btn-ind:disabled { opacity: .55; cursor: not-allowed; }

  .erro-box {
    background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2);
    border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #f87171;
    margin-bottom: 14px; text-align: center;
  }
  .sucesso-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(16,185,129,.2), rgba(16,185,129,.05));
    border: 2px solid rgba(16,185,129,.4);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; animation: checkPop .6s cubic-bezier(.34,1.56,.64,1) both;
  }

  .lp-footer { padding: 28px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,.05); font-size: 12px; color: rgba(255,255,255,.18); }

  @media (max-width: 640px) {
    .ind-hero { padding: 60px 20px 60px; }
    .ind-form-card { padding: 28px 20px; }
  }
`;

const PARTICLES = [
  { w: 4, left: "7%",  delay: "0s",   dur: "10s" },
  { w: 6, left: "22%", delay: "3s",   dur: "13s" },
  { w: 3, left: "40%", delay: "1.5s", dur: "9s"  },
  { w: 5, left: "60%", delay: "4s",   dur: "11s" },
  { w: 4, left: "78%", delay: "2s",   dur: "12s" },
  { w: 7, left: "90%", delay: "0.5s", dur: "14s" },
];

function FormIndicador() {
  const router = useRouter();
  const params = useSearchParams();
  const consultorId = params.get("c") ?? null;
  const formRef = useRef<HTMLDivElement>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const fmtTelBR = (v: string): string => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n.length ? `(${n}` : "";
    if (n.length <= 6) return `(${n.slice(0,2)}) ${n.slice(2)}`;
    if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  };

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const tel = telefone.replace(/\D/g, "");
    if (tel.length < 10) { setErro("Digite um WhatsApp válido com DDD"); return; }
    if (senha.length < 6) { setErro("A senha precisa ter pelo menos 6 caracteres"); return; }
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/indicador-cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, senha, consultor_id: consultorId }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao cadastrar"); }
      else { setSucesso(true); }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ind-page">

        {/* HERO */}
        <section className="ind-hero">
          <div className="ind-glow1" />
          <div className="ind-glow2" />
          {PARTICLES.map((p, i) => (
            <div key={i} className="ind-particle" style={{ width: p.w, height: p.w, left: p.left, bottom: "-10px", animationDelay: p.delay, animationDuration: p.dur }} />
          ))}

          <div className="ind-badge">
            <div className="ind-badge-dot" />
            Oportunidade de renda extra
          </div>

          <div className="ind-logo">
            <img src="/logo-indique.png" alt="Logo" style={{ width: 80, height: 80, objectFit: "contain" }} />
          </div>

          <h1 className="ind-headline">
            Indique um amigo.<br />
            <span className="ind-headline-amber">Ganhe dinheiro.</span><br />
            Sem sair de casa.
          </h1>

          <p className="ind-sub">
            Se você conhece alguém com carro, já tem tudo que precisa. Indique para proteção veicular, acompanhe pelo painel e ganhe a cada conversão.
          </p>

          <button className="ind-cta" onClick={scrollToForm}>
            Quero começar agora
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </section>

        {/* COMO FUNCIONA */}
        <section className="ind-section">
          <div className="ind-section-badge">Como funciona</div>
          <h2 className="ind-section-title">Três passos. Uma renda.</h2>
          <p className="ind-section-sub">Você não precisa vender nada. Só indicar e acompanhar.</p>

          <div className="ind-steps">
            {[
              { n: "01", icon: "📝", title: "Cadastre-se grátis", desc: "Cria sua conta em menos de 1 minuto. Sem taxa, sem mensalidade, sem complicação." },
              { n: "02", icon: "📲", title: "Indique quem tem carro", desc: "Amigo, vizinho, familiar — qualquer pessoa com carro é uma indicação em potencial. Basta registrar no painel." },
              { n: "03", icon: "💰", title: "Acompanhe e ganhe", desc: "Você vê em tempo real quando sua indicação vira cliente. E quando vira, você ganha. Simples assim." },
            ].map((s) => (
              <div key={s.n} className="ind-step">
                <div className="ind-step-n">{s.n}</div>
                <div className="ind-step-icon">{s.icon}</div>
                <div className="ind-step-title">{s.title}</div>
                <div className="ind-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* POR QUE VALE A PENA */}
        <div className="ind-ganhos">
          <div className="ind-ganhos-inner">
            <div className="ind-section-badge">Por que vale a pena</div>
            <h2 className="ind-section-title" style={{ marginBottom: 12 }}>Você já tem o que precisa</h2>
            <p className="ind-section-sub" style={{ margin: "0 auto" }}>
              Renda extra com o que você já tem: sua rede de contatos.
            </p>

            <div className="ganhos-grid">
              {[
                { icon: "🆓", title: "100% gratuito", desc: "Nenhum centavo de entrada. Você só ganha, nunca paga." },
                { icon: "📱", title: "Tudo pelo celular", desc: "Cadastra, indica e acompanha tudo direto pelo painel no celular." },
                { icon: "👥", title: "Quanto mais indica, mais ganha", desc: "Não tem limite de indicações. Cada uma é uma chance de ganhar." },
                { icon: "🔍", title: "Transparência total", desc: "Você vê o status de cada indicação em tempo real, sem precisar perguntar." },
              ].map((g) => (
                <div key={g.title} className="ganha-card">
                  <div className="ganha-icon">{g.icon}</div>
                  <div className="ganha-title">{g.title}</div>
                  <div className="ganha-desc">{g.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FORM */}
        <section className="ind-form-section" ref={formRef}>
          <div className="ind-form-glow" />
          <div className="ind-form-inner">
            <div style={{ marginBottom: 32, animation: "fadeUp .6s ease both" }}>
              <div className="ind-section-badge" style={{ display: "block", marginBottom: 8 }}>Cadastro gratuito</div>
              <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, marginBottom: 10 }}>
                Comece a indicar<br />agora mesmo
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.38)", lineHeight: 1.6 }}>
                Leva menos de 1 minuto. É grátis.
              </p>
            </div>

            <div className="ind-form-card">
              <div className="ind-scan" />
              <div className="ind-corner ic-tl" /><div className="ind-corner ic-tr" />
              <div className="ind-corner ic-bl" /><div className="ind-corner ic-br" />

              {sucesso ? (
                <div style={{ textAlign: "center" }}>
                  <div className="sucesso-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Cadastro realizado!</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.45)", lineHeight: 1.6, marginBottom: 24 }}>
                    Bem-vindo, {nome.split(" ")[0]}! Seu painel está pronto.<br />
                    Faça login com seu WhatsApp e a senha que criou.
                  </div>
                  <button
                    className="btn-ind"
                    onClick={() => router.push("/indicador/login")}
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
                  <form onSubmit={cadastrar}>
                    <div className="campo-group">
                      <label className="campo-label">Nome completo</label>
                      <input className="campo" type="text" placeholder="Seu nome" value={nome} required onChange={(e) => setNome(e.target.value)} />
                    </div>
                    <div className="campo-group">
                      <label className="campo-label">WhatsApp (com DDD)</label>
                      <input className="campo" type="tel" placeholder="(11) 99999-9999" value={telefone} required onChange={(e) => setTelefone(fmtTelBR(e.target.value))} />
                    </div>
                    <div className="campo-group">
                      <label className="campo-label">Crie uma senha</label>
                      <div className="senha-wrap">
                        <input className="campo" type={verSenha ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={senha} required minLength={6} onChange={(e) => setSenha(e.target.value)} />
                        <button type="button" className="olho-btn" onClick={() => setVerSenha(v => !v)} tabIndex={-1}>
                          {verSenha ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <button className="btn-ind" type="submit" disabled={carregando}>
                      {carregando ? "Cadastrando..." : (
                        <>
                          Quero meu painel gratuito
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </>
                      )}
                    </button>
                    <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,.25)", textAlign: "center" }}>
                      Já tem conta?{" "}
                      <a href="/indicador/login" style={{ color: "rgba(245,158,11,.6)", textDecoration: "none" }}>Entrar</a>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          © {new Date().getFullYear()} Indique Placa — Todos os direitos reservados
        </footer>
      </div>
    </>
  );
}

export default function IndicadorCadastroPage() {
  return (
    <Suspense fallback={null}>
      <FormIndicador />
    </Suspense>
  );
}
