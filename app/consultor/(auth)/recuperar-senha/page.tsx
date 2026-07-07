"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CSS = `
@keyframes fadeUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes pulse   { 0%,100% { opacity:.3; transform:scale(1) } 50% { opacity:.65; transform:scale(1.08) } }
@keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes popIn   { 0% { transform:scale(0) } 60% { transform:scale(1.18) } 100% { transform:scale(1) } }

.crp-page {
  min-height:100vh; min-height:100dvh;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:20px; background:linear-gradient(160deg,#020c1b 0%,#061428 50%,#0a1f3d 100%);
  font-family:Inter,system-ui,sans-serif; color:#fff;
  position:relative; overflow:hidden;
}
.crp-glow { position:absolute; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle, rgba(59,130,246,.1) 0%, transparent 65%); top:-200px; left:50%; transform:translateX(-50%); animation:pulse 8s ease-in-out infinite; pointer-events:none; }

.crp-card {
  position:relative; width:100%; max-width:380px;
  background:rgba(255,255,255,.06); backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.1); border-radius:24px;
  padding:36px 28px; box-shadow:0 24px 80px rgba(0,0,0,.6);
  animation:fadeUp .5s ease both;
}
.crp-logo { display:flex; justify-content:center; margin-bottom:24px; }
.crp-titulo { font-size:20px; font-weight:900; letter-spacing:-.5px; margin-bottom:6px; text-align:center; }
.crp-sub { font-size:13px; color:rgba(255,255,255,.4); line-height:1.6; text-align:center; margin-bottom:24px; }

.crp-campo { width:100%; padding:13px 15px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:12px; font-size:15px; color:#fff; outline:none; font-family:inherit; transition:all .2s; box-sizing:border-box; margin-bottom:12px; }
.crp-campo:focus { border-color:rgba(59,130,246,.5); background:rgba(59,130,246,.04); box-shadow:0 0 0 3px rgba(59,130,246,.1); }
.crp-campo::placeholder { color:rgba(255,255,255,.25); }
.crp-campo-otp { text-align:center; font-size:26px; font-weight:900; letter-spacing:8px; font-variant-numeric:tabular-nums; }

.crp-pw-wrap { position:relative; margin-bottom:12px; }
.crp-pw-wrap .crp-campo { margin-bottom:0; padding-right:46px; }
.crp-pw-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:rgba(255,255,255,.35); padding:4px; }

.crp-btn {
  width:100%; padding:15px; border:none; border-radius:12px;
  background:linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6, #1d4ed8, #1e3a8a);
  background-size:300% 300%; animation:shimmer 4s linear infinite;
  color:#fff; font-size:15px; font-weight:900; letter-spacing:.4px;
  cursor:pointer; font-family:inherit; transition:transform .15s, box-shadow .15s;
  box-shadow:0 4px 20px rgba(59,130,246,.3); margin-top:4px;
}
.crp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(59,130,246,.5); }
.crp-btn:disabled { opacity:.5; cursor:not-allowed; }

.crp-erro { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.25); border-radius:10px; padding:10px 14px; font-size:13px; color:#f87171; margin-bottom:12px; text-align:center; }
.crp-info { background:rgba(59,130,246,.08); border:1px solid rgba(59,130,246,.2); border-radius:10px; padding:12px 14px; font-size:12px; color:rgba(255,255,255,.6); line-height:1.6; margin-bottom:16px; }
.crp-info strong { color:#93c5fd; }

.crp-sucesso-icon { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.05)); border:2px solid rgba(16,185,129,.4); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; animation:popIn .6s cubic-bezier(.34,1.56,.64,1) both; }

.crp-link { background:none; border:none; cursor:pointer; font-size:13px; color:rgba(255,255,255,.35); font-family:inherit; text-decoration:underline; text-underline-offset:3px; }
.crp-link:hover { color:rgba(255,255,255,.6); }
`;

function vibrar() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(40);
}

function fmtTel(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0,2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
}

type Etapa = "telefone" | "otp" | "sucesso";

export default function RecuperarSenhaConsultorPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("telefone");
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const solicitarOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setErro(""); vibrar();
    setCarregando(true);
    try {
      const res = await fetch("/api/consultor/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: telefone.replace(/\D/g, "") }),
      });
      if (!res.ok) { setErro("Erro ao enviar código. Tente novamente."); return; }
      setEtapa("otp");
    } catch { setErro("Erro de conexão. Tente novamente."); }
    finally { setCarregando(false); }
  };

  const confirmarOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setErro("");
    if (novaSenha.length < 6) { setErro("A senha precisa ter pelo menos 6 caracteres"); return; }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem"); return; }
    vibrar();
    setCarregando(true);
    try {
      const res = await fetch("/api/consultor/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: telefone.replace(/\D/g, ""), codigo, novaSenha }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Código inválido ou expirado."); return; }
      vibrar();
      setEtapa("sucesso");
    } catch { setErro("Erro de conexão. Tente novamente."); }
    finally { setCarregando(false); }
  };

  const olhoIcon = (ver: boolean) => ver
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <>
      <style>{CSS}</style>
      <div className="crp-page">
        <div className="crp-glow" />
        <div className="crp-card">

          <div className="crp-logo">
            <img src="/logo-indique.png" alt="Indique Placa" style={{ height: 56, objectFit: "contain" }} />
          </div>

          {etapa === "sucesso" && (
            <>
              <div className="crp-sucesso-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="crp-titulo">Senha alterada!</div>
              <p className="crp-sub">Entre com seu WhatsApp e a nova senha.</p>
              <button className="crp-btn" onClick={() => { vibrar(); router.push("/consultor/login"); }}>
                Ir para o login
              </button>
            </>
          )}

          {etapa === "otp" && (
            <>
              <div className="crp-titulo">Digite o código</div>
              <div className="crp-info">
                Um código de 6 dígitos foi enviado para o seu<br />
                <strong>WhatsApp {telefone}</strong>.<br />
                Pode demorar até 1 minuto. Verifique também a aba de mensagens do WhatsApp.
              </div>
              <form onSubmit={confirmarOTP}>
                {erro && <div className="crp-erro">{erro}</div>}
                <input
                  className="crp-campo crp-campo-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={codigo}
                  required
                  maxLength={6}
                  autoFocus
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, ""))}
                />
                <div className="crp-pw-wrap">
                  <input
                    className="crp-campo"
                    type={verSenha ? "text" : "password"}
                    placeholder="Nova senha (mínimo 6 caracteres)"
                    value={novaSenha}
                    required
                    onChange={e => setNovaSenha(e.target.value)}
                  />
                  <button type="button" className="crp-pw-btn" onClick={() => setVerSenha(v => !v)} tabIndex={-1}>{olhoIcon(verSenha)}</button>
                </div>
                <input
                  className="crp-campo"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmar}
                  required
                  onChange={e => setConfirmar(e.target.value)}
                />
                <button className="crp-btn" type="submit" disabled={carregando || codigo.length < 6}>
                  {carregando ? "Confirmando..." : "Confirmar nova senha"}
                </button>
              </form>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button className="crp-link" onClick={() => { setEtapa("telefone"); setErro(""); setCodigo(""); }}>
                  Usar outro número
                </button>
              </div>
            </>
          )}

          {etapa === "telefone" && (
            <>
              <div className="crp-titulo">Esqueceu a senha?</div>
              <p className="crp-sub">Digite seu WhatsApp. Vamos enviar um código de verificação.</p>
              <form onSubmit={solicitarOTP}>
                {erro && <div className="crp-erro">{erro}</div>}
                <input
                  className="crp-campo"
                  type="tel"
                  placeholder="(87) 99999-9999"
                  value={telefone}
                  required
                  autoFocus
                  onChange={e => setTelefone(fmtTel(e.target.value))}
                />
                <button className="crp-btn" type="submit" disabled={carregando}>
                  {carregando ? "Enviando..." : "Enviar código pelo WhatsApp"}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <a href="/consultor/login" style={{ fontSize: 13, color: "rgba(255,255,255,.35)", textDecoration: "none" }}>
              Voltar ao login
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
