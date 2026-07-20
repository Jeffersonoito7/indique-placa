"use client";

import { useState, useEffect, use } from "react";

const STYLES = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cap-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
    background: linear-gradient(135deg, #022c22, #064e3b, #065f46, #0369a1, #075985, #022c22);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .cap-card {
    width: 100%; max-width: 420px;
    background: rgba(255,255,255,.08); backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.14); border-radius: 24px;
    padding: 36px 28px 32px; box-shadow: 0 24px 80px rgba(0,0,0,.55);
    animation: fadeUp .5s ease both;
  }
  .cap-campo {
    width: 100%; padding: 12px 14px; margin-bottom: 12px; box-sizing: border-box;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
    border-radius: 10px; font-size: 14px; color: #fff; outline: none;
    font-family: inherit; transition: border-color .2s;
  }
  .cap-campo:focus { border-color: rgba(6,182,212,.6); }
  .cap-campo::placeholder { color: rgba(255,255,255,.38); }
  .cap-btn {
    width: 100%; padding: 14px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #065f46 0%, #0369a1 50%, #0891b2 100%);
    box-shadow: 0 4px 20px rgba(6,182,212,.35);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1px;
    cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s;
    margin-top: 4px;
  }
  .cap-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .cap-btn:disabled { opacity: .6; cursor: not-allowed; }
  .cap-senha-wrap { position: relative; margin-bottom: 12px; }
  .cap-senha-wrap .cap-campo { margin-bottom: 0; padding-right: 44px; }
  .cap-olho {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.45);
    display: flex; align-items: center; padding: 4px;
  }
  .cap-olho:hover { color: rgba(255,255,255,.8); }
`;

export default function CapturaConsultorPage({ params }: { params: Promise<{ gestorId: string }> }) {
  const { gestorId } = use(params);

  const [nomeGestor, setNomeGestor] = useState<string | null>(null);
  const [linkInvalido, setLinkInvalido] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    fetch(`/api/publico/captura-consultor/${gestorId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.nome) setNomeGestor(d.nome);
        else setLinkInvalido(true);
      })
      .catch(() => setLinkInvalido(true));
  }, [gestorId]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch(`/api/publico/captura-consultor/${gestorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, email, cidade, senha }),
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
        <div className="cap-card">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src="/logo-indique.png" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 12 }} alt="Indique Placa" />
            {linkInvalido ? (
              <div style={{ color: "#f87171", fontSize: 14 }}>Link inválido ou expirado.</div>
            ) : (
              <>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(6,95,70,.2)", border: "1px solid rgba(6,182,212,.35)",
                  borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700,
                  letterSpacing: 1, color: "#67e8f9", textTransform: "uppercase", marginBottom: 8,
                }}>CONSULTOR</div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                  Cadastro de Consultor
                </div>
                {nomeGestor && (
                  <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>
                    Equipe de <strong style={{ color: "rgba(103,232,249,.9)" }}>{nomeGestor}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          {!linkInvalido && !sucesso && (
            <>
              {erro && (
                <div style={{
                  background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12,
                }}>{erro}</div>
              )}
              <form onSubmit={enviar}>
                <input className="cap-campo" type="text" placeholder="Seu nome completo" value={nome} required onChange={(e) => setNome(e.target.value)} />
                <input className="cap-campo" type="tel" placeholder="WhatsApp (11) 99999-9999" value={telefone} required onChange={(e) => setTelefone(e.target.value)} />
                <input className="cap-campo" type="email" placeholder="seu@email.com" value={email} required autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
                <input className="cap-campo" type="text" placeholder="Cidade" value={cidade} required onChange={(e) => setCidade(e.target.value)} />
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
                <button className="cap-btn" type="submit" disabled={carregando}>
                  {carregando ? "CADASTRANDO..." : "QUERO SER CONSULTOR"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                Ja tem conta?{" "}
                <a href="/consultor/login" style={{ color: "rgba(103,232,249,.8)", textDecoration: "none" }}>Entrar</a>
              </div>
            </>
          )}

          {sucesso && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block" }}>
                  <circle cx="12" cy="12" r="11" fill="rgba(6,95,70,.4)" stroke="rgba(6,182,212,.5)" strokeWidth="1.5"/>
                  <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Cadastro realizado!</div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, marginBottom: 20 }}>
                Sua conta foi criada com sucesso. Agora acesse o painel e comece a trabalhar.
              </div>
              <a href="/consultor/login" style={{
                display: "inline-block", padding: "12px 28px", borderRadius: 10,
                background: "linear-gradient(135deg, #065f46 0%, #0369a1 100%)",
                color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}>Acessar o Painel</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
