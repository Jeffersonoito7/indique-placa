"use client";

import { useState, useEffect, use } from "react";
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
    background: linear-gradient(135deg, #022c22, #064e3b, #065f46, #0369a1, #075985, #022c22);
    background-size: 400% 400%;
    animation: gradientShift 12s ease infinite;
    font-family: Inter, system-ui, sans-serif;
  }
  .cap-card {
    width: 100%; max-width: 420px;
    background: rgba(255,255,255,.06); backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,.12); border-radius: 20px;
    padding: 36px 28px 32px; box-shadow: 0 24px 80px rgba(0,0,0,.4);
    animation: fadeUp .4s ease both;
  }
  .cap-logo { text-align: center; margin-bottom: 24px; }
  .cap-logo span { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .cap-logo span em { color: #00C389; font-style: normal; }
  .cap-titulo { color: #fff; font-size: 18px; font-weight: 700; margin: 0 0 4px; }
  .cap-sub { color: rgba(255,255,255,.55); font-size: 13px; margin: 0 0 24px; }
  .cap-label { display: block; color: rgba(255,255,255,.7); font-size: 12px; font-weight: 600; letter-spacing: .5px; margin-bottom: 6px; }
  .cap-campo {
    width: 100%; padding: 12px 14px; margin-bottom: 16px; box-sizing: border-box;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
    border-radius: 10px; font-size: 14px; color: #fff; outline: none;
    font-family: inherit; transition: border-color .2s;
  }
  .cap-campo:focus { border-color: #00C389; }
  .cap-campo::placeholder { color: rgba(255,255,255,.3); }
  .cap-campo option { background: #1a3d6e; color: #fff; }
  .cap-btn {
    width: 100%; padding: 14px; border: none; border-radius: 10px;
    background: #00C389; color: #fff; font-size: 15px; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: opacity .15s;
    margin-top: 4px;
  }
  .cap-btn:hover:not(:disabled) { opacity: .88; }
  .cap-btn:disabled { opacity: .5; cursor: not-allowed; }
  .cap-erro { color: #f87171; font-size: 13px; margin-top: -8px; margin-bottom: 12px; }
  .cap-sucesso { text-align: center; }
  .cap-sucesso h2 { color: #00C389; font-size: 22px; margin-bottom: 8px; }
  .cap-sucesso p { color: rgba(255,255,255,.7); font-size: 14px; }
`;

export default function CapturaConsultorAssocPage({ params }: { params: Promise<{ assocId: string }> }) {
  const { assocId } = use(params);

  const [nomeAssoc, setNomeAssoc] = useState<string | null>(null);
  const [linkInvalido, setLinkInvalido] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const estados = Object.entries(ESTADOS_NOMES).sort((a, b) => a[1].localeCompare(b[1]));
  const cidades = estado ? (ESTADOS_CIDADES[estado as keyof typeof ESTADOS_CIDADES] ?? []) : [];

  useEffect(() => {
    fetch(`/api/publico/captura-consultor-assoc/${assocId}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => { if (d.nome) setNomeAssoc(d.nome); else setLinkInvalido(true); })
      .catch(() => setLinkInvalido(true));
  }, [assocId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!estado || !cidade) { setErro("Selecione estado e cidade."); return; }
    setCarregando(true);
    try {
      const res = await fetch(`/api/publico/captura-consultor-assoc/${assocId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, email, cidade: `${cidade} - ${estado}`, senha }),
      });
      const d = await res.json();
      if (!res.ok) { setErro(d.error ?? "Erro ao cadastrar."); return; }
      setSucesso(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="cap-page">
        <div className="cap-card">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <img src="/logo-indique.png" style={{ width: 100, height: 100, objectFit: "contain" }} alt="Indique Placa" />
          </div>

          {linkInvalido && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,.6)" }}>
              <p>Link inválido ou expirado.</p>
            </div>
          )}

          {!linkInvalido && sucesso && (
            <div className="cap-sucesso">
              <h2>Cadastro realizado!</h2>
              <p>Sua conta de consultor foi criada. Acesse com seu e-mail e senha.</p>
              <a href="/consultor/login" style={{ display: "inline-block", marginTop: 20, color: "#00C389", fontWeight: 700, textDecoration: "none" }}>
                Entrar agora
              </a>
            </div>
          )}

          {!linkInvalido && !sucesso && (
            <>
              <p className="cap-titulo">Cadastro de Consultor</p>
              <p className="cap-sub">{nomeAssoc ? `Associação: ${nomeAssoc}` : "Carregando..."}</p>

              <form onSubmit={handleSubmit}>
                <label className="cap-label">Nome completo</label>
                <input className="cap-campo" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required />

                <label className="cap-label">WhatsApp</label>
                <input className="cap-campo" placeholder="(00) 00000-0000" value={telefone} onChange={e => setTelefone(e.target.value)} required />

                <label className="cap-label">E-mail</label>
                <input className="cap-campo" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />

                <label className="cap-label">Estado</label>
                <select className="cap-campo" value={estado} onChange={e => { setEstado(e.target.value); setCidade(""); }} required>
                  <option value="">Selecione...</option>
                  {estados.map(([uf, nm]) => <option key={uf} value={uf}>{nm}</option>)}
                </select>

                <label className="cap-label">Cidade</label>
                <select className="cap-campo" value={cidade} onChange={e => setCidade(e.target.value)} required disabled={!estado}>
                  <option value="">Selecione...</option>
                  {cidades.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <label className="cap-label">Senha de acesso</label>
                <input className="cap-campo" type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6} />

                {erro && <p className="cap-erro">{erro}</p>}

                <button className="cap-btn" type="submit" disabled={carregando || !nomeAssoc}>
                  {carregando ? "Cadastrando..." : "Criar minha conta"}
                </button>
              </form>
            </>
          )}
          <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 11, color: "rgba(255,255,255,.25)" }}>
            IndiquePlaca &copy; {new Date().getFullYear()} &middot; Plataforma de indicações
          </div>
        </div>
      </div>
    </>
  );
}
