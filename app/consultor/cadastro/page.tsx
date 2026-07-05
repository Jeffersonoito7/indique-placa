"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PARTICLES = [
  { w: 5, left: "8%",  delay: "0s",   dur: "9s"  },
  { w: 3, left: "20%", delay: "2.5s", dur: "12s" },
  { w: 7, left: "35%", delay: "1s",   dur: "8s"  },
  { w: 4, left: "55%", delay: "4s",   dur: "11s" },
  { w: 6, left: "70%", delay: "0.5s", dur: "10s" },
  { w: 3, left: "82%", delay: "3s",   dur: "7s"  },
  { w: 5, left: "92%", delay: "2s",   dur: "13s" },
];

const STYLES = `
  * { box-sizing: border-box; }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes floatLogo {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-8px) rotate(1deg); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.35; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(1.1); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes particle {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.5; }
    100% { transform: translateY(-110vh) translateX(30px) scale(0); opacity: 0; }
  }
  @keyframes checkPop {
    0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(5deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes progressFill {
    from { width: 0%; }
  }
  @keyframes scanLine {
    0%   { transform: translateY(-100%); opacity: 0.4; }
    100% { transform: translateY(400%); opacity: 0; }
  }

  .cad-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 20px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #020d1a, #041828, #021a0e, #010d09, #041828, #020d1a);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .glow1 {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,.12) 0%, transparent 65%);
    top: -150px; left: -150px;
    animation: glowPulse 7s ease-in-out infinite;
    pointer-events: none;
  }
  .glow2 {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,.1) 0%, transparent 65%);
    bottom: -100px; right: -100px;
    animation: glowPulse 9s ease-in-out infinite reverse;
    pointer-events: none;
  }
  .glow3 {
    position: absolute; width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,.07) 0%, transparent 65%);
    top: 40%; left: 60%;
    animation: glowPulse 11s ease-in-out infinite;
    pointer-events: none;
  }
  .particle {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.12);
    animation: particle linear infinite;
    pointer-events: none;
  }

  .cad-card {
    position: relative; width: 100%; max-width: 460px;
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 32px;
    padding: 40px 36px 40px;
    box-shadow: 0 32px 100px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.08);
    animation: fadeUp .7s ease both;
    overflow: hidden;
  }
  .scan-line {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(16,185,129,.6), transparent);
    animation: scanLine 4s ease-in-out infinite;
    pointer-events: none;
  }
  .corner {
    position: absolute; width: 20px; height: 20px;
    border-color: rgba(16,185,129,.4); border-style: solid;
    pointer-events: none;
  }
  .corner-tl { top: 16px; left: 16px; border-width: 2px 0 0 2px; border-radius: 4px 0 0 0; }
  .corner-tr { top: 16px; right: 16px; border-width: 2px 2px 0 0; border-radius: 0 4px 0 0; }
  .corner-bl { bottom: 16px; left: 16px; border-width: 0 0 2px 2px; border-radius: 0 0 0 4px; }
  .corner-br { bottom: 16px; right: 16px; border-width: 0 2px 2px 0; border-radius: 0 0 4px 0; }

  .logo-wrap {
    display: flex; justify-content: center; margin-bottom: 6px;
    animation: floatLogo 4s ease-in-out infinite;
  }
  .step-dots {
    display: flex; justify-content: center; align-items: center; gap: 8px;
    margin-bottom: 28px;
  }
  .dot {
    height: 4px; border-radius: 99px;
    transition: all .4s ease;
  }
  .dot-active { width: 28px; background: #10b981; }
  .dot-done   { width: 14px; background: rgba(16,185,129,.5); }
  .dot-next   { width: 14px; background: rgba(255,255,255,.15); }

  .step-wrap {
    animation: fadeIn .35s ease both;
  }
  .step-label {
    font-size: 11px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: #10b981; margin-bottom: 6px;
  }
  .step-title {
    font-size: 22px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 4px;
  }
  .step-sub {
    font-size: 13px; color: rgba(255,255,255,.4); margin-bottom: 28px; line-height: 1.5;
  }

  .campo-group { margin-bottom: 14px; }
  .campo-label {
    display: block; font-size: 11px; font-weight: 700; letter-spacing: .5px;
    color: rgba(255,255,255,.5); text-transform: uppercase; margin-bottom: 6px;
  }
  .campo {
    width: 100%; padding: 13px 16px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 12px; font-size: 15px; color: #fff;
    outline: none; font-family: inherit;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .campo:focus {
    border-color: rgba(16,185,129,.5);
    background: rgba(16,185,129,.05);
    box-shadow: 0 0 0 3px rgba(16,185,129,.12);
  }
  .campo::placeholder { color: rgba(255,255,255,.25); }
  .campo-select {
    appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 40px;
  }
  .campo-select option { background: #0c1929; color: #fff; }

  .btn-next {
    width: 100%; padding: 15px; border: none; border-radius: 12px;
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff; font-size: 15px; font-weight: 800; letter-spacing: .5px;
    cursor: pointer; font-family: inherit;
    transition: opacity .15s, transform .1s, box-shadow .2s;
    box-shadow: 0 4px 20px rgba(16,185,129,.3);
    margin-top: 6px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .btn-next:hover:not(:disabled) { opacity: .9; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(16,185,129,.4); }
  .btn-next:disabled { opacity: .5; cursor: not-allowed; }

  .btn-back {
    width: 100%; padding: 12px; border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
    background: transparent; color: rgba(255,255,255,.5); font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all .15s; margin-top: 10px;
  }
  .btn-back:hover { color: rgba(255,255,255,.8); border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.04); }

  .erro-box {
    background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.25);
    border-radius: 10px; padding: 10px 14px; font-size: 13px;
    color: #f87171; margin-bottom: 14px; text-align: center;
  }

  .sucesso-icon {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(16,185,129,.2), rgba(16,185,129,.05));
    border: 2px solid rgba(16,185,129,.4);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    animation: checkPop .6s cubic-bezier(.34,1.56,.64,1) both;
  }
  .credencial-box {
    background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.1);
    border-radius: 14px; padding: 16px 20px; margin: 20px 0;
    text-align: left;
  }
  .credencial-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,.35); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .credencial-valor { font-size: 15px; font-weight: 700; color: #fff; font-family: 'Courier New', monospace; }
  .credencial-hint {
    background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.2);
    border-radius: 10px; padding: 10px 14px; font-size: 12px;
    color: rgba(245,158,11,.9); margin-top: 16px; line-height: 1.5;
    text-align: center;
  }
`;

type Associacao = { id: string; nome: string };

export default function ConsultorCadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [associacao, setAssociacao] = useState("");
  const [associacaoTexto, setAssociacaoTexto] = useState("");
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState("");

  useEffect(() => {
    fetch("/api/publico/associacoes")
      .then((r) => r.json())
      .then((d) => setAssociacoes(d.associacoes ?? []));
  }, []);

  const fmtTel = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  };

  const avancar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (step === 1) {
      const tel = telefone.replace(/\D/g, "");
      if (tel.length < 10) { setErro("Digite um WhatsApp valido com DDD"); return; }
      setStep(2);
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
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
      else {
        setSenhaGerada(json.senhaTemp);
        setStep(3);
      }
    } catch {
      setErro("Erro de conexao. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const dotClass = (n: number) => {
    if (n < step) return "dot dot-done";
    if (n === step) return "dot dot-active";
    return "dot dot-next";
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="cad-page">
        <div className="glow1" />
        <div className="glow2" />
        <div className="glow3" />
        {PARTICLES.map((p, i) => (
          <div key={i} className="particle" style={{
            width: p.w, height: p.w, left: p.left, bottom: "-20px",
            animationDelay: p.delay, animationDuration: p.dur,
          }} />
        ))}

        <div className="cad-card">
          <div className="scan-line" />
          <div className="corner corner-tl" />
          <div className="corner corner-tr" />
          <div className="corner corner-bl" />
          <div className="corner corner-br" />

          {/* Logo */}
          <div className="logo-wrap">
            <img src="/logo-indique.png" style={{ width: 70, height: 70, objectFit: "contain" }} alt="Indique Placa" />
          </div>

          {/* Steps indicator */}
          {step < 3 && (
            <div className="step-dots">
              <div className={dotClass(1)} />
              <div className={dotClass(2)} />
            </div>
          )}

          {/* Step 1: Dados pessoais */}
          {step === 1 && (
            <div className="step-wrap" key="step1">
              <div className="step-label">Passo 1 de 2</div>
              <div className="step-title">Seus dados</div>
              <div className="step-sub">Vamos comecar com seu nome e WhatsApp</div>

              {erro && <div className="erro-box">{erro}</div>}

              <form onSubmit={avancar}>
                <div className="campo-group">
                  <label className="campo-label">Nome completo</label>
                  <input
                    className="campo" type="text" placeholder="Ex: Joao Silva" value={nome} required
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="campo-group">
                  <label className="campo-label">WhatsApp (com DDD)</label>
                  <input
                    className="campo" type="tel" placeholder="(11) 99999-9999" value={telefone} required
                    onChange={(e) => setTelefone(fmtTel(e.target.value))}
                  />
                </div>
                <button className="btn-next" type="submit">
                  Continuar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.3)" }}>
                Ja tem cadastro?{" "}
                <a href="/consultor/login" style={{ color: "rgba(16,185,129,.7)", textDecoration: "none" }}>
                  Entrar
                </a>
              </div>
            </div>
          )}

          {/* Step 2: Cidade e Associacao */}
          {step === 2 && (
            <div className="step-wrap" key="step2">
              <div className="step-label">Passo 2 de 2</div>
              <div className="step-title">Sua localizacao</div>
              <div className="step-sub">Cidade e associacao que voce representa</div>

              {erro && <div className="erro-box">{erro}</div>}

              <form onSubmit={enviar}>
                <div className="campo-group">
                  <label className="campo-label">Cidade</label>
                  <input
                    className="campo" type="text" placeholder="Ex: Sao Paulo" value={cidade} required
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
                <div className="campo-group">
                  <label className="campo-label">Associacao</label>
                  {associacoes.length > 0 ? (
                    <select
                      className="campo campo-select" required
                      value={associacao}
                      onChange={(e) => setAssociacao(e.target.value)}
                    >
                      <option value="">Selecione a associacao</option>
                      {associacoes.map((a) => (
                        <option key={a.id} value={a.nome}>{a.nome}</option>
                      ))}
                      <option value="outra">Outra associacao</option>
                    </select>
                  ) : (
                    <input
                      className="campo" type="text" placeholder="Nome da sua associacao" value={associacao} required
                      onChange={(e) => setAssociacao(e.target.value)}
                    />
                  )}
                </div>
                {associacao === "outra" && (
                  <div className="campo-group">
                    <label className="campo-label">Qual associacao?</label>
                    <input
                      className="campo" type="text" placeholder="Digite o nome da associacao" value={associacaoTexto} required
                      onChange={(e) => setAssociacaoTexto(e.target.value)}
                    />
                  </div>
                )}
                <button className="btn-next" type="submit" disabled={carregando}>
                  {carregando ? "Cadastrando..." : (
                    <>
                      Finalizar cadastro
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </>
                  )}
                </button>
                <button className="btn-back" type="button" onClick={() => { setStep(1); setErro(""); }}>
                  Voltar
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Sucesso */}
          {step === 3 && (
            <div className="step-wrap" key="step3" style={{ textAlign: "center" }}>
              <div className="sucesso-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
                Cadastro realizado!
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.45)", marginBottom: 4 }}>
                Bem-vindo, {nome.split(" ")[0]}!
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginBottom: 8 }}>
                Use os dados abaixo para entrar no painel
              </div>

              <div className="credencial-box">
                <div className="credencial-label">WhatsApp</div>
                <div className="credencial-valor">{telefone}</div>
              </div>
              <div className="credencial-box" style={{ marginTop: 10 }}>
                <div className="credencial-label">Senha temporaria</div>
                <div className="credencial-valor" style={{ fontSize: 24, letterSpacing: 6, color: "#10b981" }}>
                  {senhaGerada}
                </div>
              </div>

              <div className="credencial-hint">
                Anote essa senha agora. Por seguranca, altere no seu primeiro acesso.
              </div>

              <button
                className="btn-next"
                style={{ marginTop: 20 }}
                onClick={() => router.push("/consultor/login")}
              >
                Acessar meu painel
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
