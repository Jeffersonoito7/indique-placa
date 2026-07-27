"use client";

import { useState, useEffect, use } from "react";

const TIPOS_VEICULO = ["Carro", "Moto", "Caminhonete", "Caminhão", "Van", "Ônibus", "Outro"];

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
`;

export default function CapturaGestorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [nomeGestor, setNomeGestor] = useState<string | null>(null);
  const [linkInvalido, setLinkInvalido] = useState(false);

  const [nomeLead, setNomeLead] = useState("");
  const [telefoneLead, setTelefoneLead] = useState("");
  const [placa, setPlaca] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    fetch(`/api/publico/gestor-info/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.nome) setNomeGestor(d.nome);
        else setLinkInvalido(true);
      })
      .catch(() => setLinkInvalido(true));
  }, [id]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/captura-gestor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestor_id: id,
          placa: placa.trim().toUpperCase(),
          nome_lead: nomeLead,
          telefone_lead: telefoneLead,
          tipo_veiculo: tipoVeiculo,
        }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Erro ao enviar indicação.");
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
            {linkInvalido ? (
              <div style={{ color: "#f87171", fontSize: 14 }}>Link inválido ou expirado.</div>
            ) : (
              <>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "rgba(6,95,70,.2)", border: "1px solid rgba(6,182,212,.35)",
                  borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700,
                  letterSpacing: 1, color: "#67e8f9", textTransform: "uppercase", marginBottom: 8,
                }}>GESTOR</div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                  Indicar Veículo
                </div>
                {nomeGestor && (
                  <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>
                    Indicação para <strong style={{ color: "rgba(103,232,249,.9)" }}>{nomeGestor}</strong>
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
                <input
                  className="cap-campo"
                  type="text"
                  placeholder="Nome do proprietário"
                  value={nomeLead}
                  required
                  onChange={(e) => setNomeLead(e.target.value)}
                />
                <input
                  className="cap-campo"
                  type="tel"
                  placeholder="WhatsApp (11) 99999-9999"
                  value={telefoneLead}
                  required
                  onChange={(e) => setTelefoneLead(e.target.value)}
                />
                <input
                  className="cap-campo"
                  type="text"
                  placeholder="Placa do veículo (ex: ABC1D23)"
                  value={placa}
                  required
                  maxLength={8}
                  onChange={(e) => setPlaca(e.target.value)}
                  style={{ textTransform: "uppercase" }}
                />
                <select
                  className="cap-campo"
                  required
                  value={tipoVeiculo}
                  onChange={(e) => setTipoVeiculo(e.target.value)}
                  style={{ appearance: "none" }}
                >
                  <option value="">Tipo de veículo</option>
                  {TIPOS_VEICULO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button className="cap-btn" type="submit" disabled={carregando}>
                  {carregando ? "ENVIANDO..." : "ENVIAR INDICAÇÃO"}
                </button>
              </form>
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
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Indicação enviada!</div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13 }}>
                Obrigado. A indicação foi registrada com sucesso.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
