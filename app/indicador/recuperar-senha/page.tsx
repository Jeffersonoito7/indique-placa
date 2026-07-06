"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STYLES = `
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(1.08); }
  }
  .rec-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 20px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #1a0c02, #3d1f0a, #5e2a0d, #3d1f0a, #281406, #1a0c02);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .rec-glow {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(245,158,11,.2) 0%, transparent 70%);
    top: -100px; left: -100px;
    animation: glowPulse 6s ease-in-out infinite;
    pointer-events: none;
  }
  .rec-card {
    position: relative; width: 100%; max-width: 380px; text-align: center;
    background: rgba(255,255,255,.07); backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.13); border-radius: 28px;
    padding: 40px 32px 36px; box-shadow: 0 24px 80px rgba(0,0,0,.6);
    animation: fadeUp .6s ease both;
  }
  .campo-rec {
    width: 100%; padding: 12px 14px; margin-bottom: 12px; box-sizing: border-box;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
    border-radius: 10px; font-size: 14px; color: #fff; outline: none;
    font-family: inherit; transition: border-color .2s;
  }
  .campo-rec:focus { border-color: rgba(255,255,255,.45); }
  .campo-rec::placeholder { color: rgba(255,255,255,.38); }
  .senha-wrap { position: relative; margin-bottom: 12px; }
  .senha-wrap .campo-rec { margin-bottom: 0; padding-right: 44px; }
  .olho-btn {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: rgba(255,255,255,.45);
    display: flex; align-items: center; padding: 4px;
  }
  .btn-rec {
    width: 100%; padding: 14px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #b45309, #f59e0b);
    color: #fff; font-size: 14px; font-weight: 800; letter-spacing: 1px;
    cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s;
  }
  .btn-rec:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .btn-rec:disabled { opacity: .6; cursor: not-allowed; }
`;

export default function IndicadorRecuperarSenhaPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (novaSenha.length < 6) { setErro("A senha precisa ter no mínimo 6 caracteres"); return; }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem"); return; }
    setCarregando(true);
    try {
      const res = await fetch("/api/indicador/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, novaSenha }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro. Tente novamente."); return; }
      if (json.encontrado) setSucesso(true);
      else setNaoEncontrado(true);
    } catch { setErro("Erro de conexão. Tente novamente."); }
    finally { setCarregando(false); }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="rec-page">
        <div className="rec-glow" />
        <div className="rec-card">
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
            <img src="/logo-indique.png" alt="Indique Placa" style={{ height: 60, objectFit: "contain" }} />
          </div>

          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 6 }}>Redefinir senha</div>

          {sucesso ? (
            <>
              <div style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 12, padding: "20px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: 36 }}>✓</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fbbf24", marginTop: 8 }}>Senha alterada!</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 6 }}>Entre com o WhatsApp e a nova senha.</div>
              </div>
              <button className="btn-rec" onClick={() => router.push("/indicador/login")}>
                Ir para o login
              </button>
            </>
          ) : naoEncontrado ? (
            <>
              <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "rgba(239,68,68,.9)", marginBottom: 20 }}>
                Número não encontrado. Verifique se digitou corretamente.
              </div>
              <button className="btn-rec" onClick={() => { setNaoEncontrado(false); setTelefone(""); }}>
                Tentar novamente
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 24, lineHeight: 1.6 }}>
                Digite seu WhatsApp e escolha uma nova senha.
              </div>
              <form onSubmit={enviar}>
                {erro && (
                  <div style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12 }}>
                    {erro}
                  </div>
                )}
                <input className="campo-rec" type="tel" placeholder="WhatsApp com DDD (ex: 11999999999)" value={telefone} required onChange={e => setTelefone(e.target.value)} />
                <div className="senha-wrap">
                  <input className="campo-rec" type={verSenha ? "text" : "password"} placeholder="Nova senha (mínimo 6 caracteres)" value={novaSenha} required onChange={e => setNovaSenha(e.target.value)} />
                  <button type="button" className="olho-btn" onClick={() => setVerSenha(v => !v)} tabIndex={-1}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {verSenha ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
                <input className="campo-rec" type="password" placeholder="Confirme a nova senha" value={confirmar} required onChange={e => setConfirmar(e.target.value)} />
                <button className="btn-rec" type="submit" disabled={carregando}>
                  {carregando ? "Salvando..." : "Redefinir senha"}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: 20, fontSize: 12, color: "rgba(255,255,255,.3)" }}>
            <a href="/indicador/login" style={{ color: "rgba(255,255,255,.45)", textDecoration: "none" }}>
              Voltar ao login
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
