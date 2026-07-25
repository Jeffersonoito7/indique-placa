"use client";

import { useState } from "react";
import { ESTADOS_NOMES, ESTADOS_CIDADES } from "@/lib/cidades-brasil";

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
    background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca, #7c3aed, #6d28d9, #1e1b4b);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .cap-card {
    width: 100%; max-width: 440px;
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
  .cap-campo:focus { border-color: rgba(167,139,250,.7); }
  .cap-campo::placeholder { color: rgba(255,255,255,.38); }
  .cap-campo option { background: #312e81; color: #fff; }
  .cap-btn {
    width: 100%; padding: 14px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #a78bfa 100%);
    box-shadow: 0 4px 20px rgba(124,58,237,.4);
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
  .cap-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
`;

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
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!estado) { setErro("Selecione o estado."); return; }
    if (!cidade) { setErro("Selecione a cidade."); return; }
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
        <div className="cap-card">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <img src="/logo-indique.png" style={{ width: 100, height: 100, objectFit: "contain" }} alt="Indique Placa" />
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(67,56,202,.25)", border: "1px solid rgba(167,139,250,.35)",
              borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700,
              letterSpacing: 1, color: "#c4b5fd", textTransform: "uppercase", marginBottom: 8,
            }}>ASSOCIAÇÃO</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              Quero usar o Indique Placa
            </div>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>
              Preencha os dados da sua associação. Nossa equipe entrará em contato para ativação da conta.
            </div>
          </div>

          {!sucesso ? (
            <>
              {erro && (
                <div style={{
                  background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171", marginBottom: 12,
                }}>{erro}</div>
              )}
              <form onSubmit={enviar}>
                <input
                  className="cap-campo"
                  type="text"
                  placeholder="Nome da associação (ex: AVP Proteção Veicular)"
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
                <button className="cap-btn" type="submit" disabled={carregando}>
                  {carregando ? "ENVIANDO..." : "ENVIAR CADASTRO"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                Ja tem conta?{" "}
                <a href="/associacao/login" style={{ color: "rgba(196,181,253,.8)", textDecoration: "none" }}>Entrar</a>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 16 }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block" }}>
                  <circle cx="12" cy="12" r="11" fill="rgba(67,56,202,.4)" stroke="rgba(167,139,250,.5)" strokeWidth="1.5"/>
                  <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                Cadastro recebido!
              </div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, lineHeight: 1.6 }}>
                Nossa equipe analisará seu cadastro e entrará em contato pelo WhatsApp informado para ativação da conta.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
