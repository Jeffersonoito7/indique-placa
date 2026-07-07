"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CSS = `
@keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes pulse  { 0%,100% { opacity:.35; transform:scale(1) } 50% { opacity:.7; transform:scale(1.1) } }
@keyframes shimmer{ 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes popIn  { 0% { transform:scale(0) } 60% { transform:scale(1.18) } 100% { transform:scale(1) } }

.rp-page {
  min-height:100vh; min-height:100dvh;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:20px; background:#04091a;
  font-family:Inter,system-ui,sans-serif; color:#fff;
  position:relative; overflow:hidden;
}
.rp-glow { position:absolute; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle, rgba(245,158,11,.08) 0%, transparent 65%); top:-150px; left:50%; transform:translateX(-50%); animation:pulse 8s ease-in-out infinite; pointer-events:none; }

.rp-card {
  position:relative; width:100%; max-width:380px;
  background:rgba(255,255,255,.05); backdrop-filter:blur(20px);
  border:1px solid rgba(245,158,11,.15); border-radius:24px;
  padding:36px 28px; box-shadow:0 24px 80px rgba(0,0,0,.6);
  animation:fadeUp .5s ease both;
}
.rp-logo { display:flex; justify-content:center; margin-bottom:24px; }
.rp-titulo { font-size:20px; font-weight:900; letter-spacing:-.5px; margin-bottom:6px; text-align:center; }
.rp-sub { font-size:13px; color:rgba(255,255,255,.4); line-height:1.6; text-align:center; margin-bottom:24px; }

.rp-campo { width:100%; padding:13px 15px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:12px; font-size:15px; color:#fff; outline:none; font-family:inherit; transition:all .2s; box-sizing:border-box; margin-bottom:12px; }
.rp-campo:focus { border-color:rgba(245,158,11,.5); background:rgba(245,158,11,.04); box-shadow:0 0 0 3px rgba(245,158,11,.1); }
.rp-campo::placeholder { color:rgba(255,255,255,.25); }
.rp-campo-otp { text-align:center; font-size:26px; font-weight:900; letter-spacing:8px; font-variant-numeric:tabular-nums; }

.pw-wrap { position:relative; margin-bottom:12px; }
.pw-wrap .rp-campo { margin-bottom:0; padding-right:46px; }
.pw-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:rgba(255,255,255,.35); padding:4px; }

.rp-btn {
  width:100%; padding:15px; border:none; border-radius:12px;
  background:linear-gradient(135deg, #92400e, #d97706, #f59e0b, #d97706, #92400e);
  background-size:300% 300%; animation:shimmer 4s linear infinite;
  color:#000; font-size:15px; font-weight:900; letter-spacing:.4px;
  cursor:pointer; font-family:inherit; transition:transform .15s, box-shadow .15s;
  box-shadow:0 4px 20px rgba(245,158,11,.3); margin-top:4px;
}
.rp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(245,158,11,.5); }
.rp-btn:disabled { opacity:.5; cursor:not-allowed; }

.rp-erro { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.25); border-radius:10px; padding:10px 14px; font-size:13px; color:#f87171; margin-bottom:12px; text-align:center; }
.rp-info { background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.2); border-radius:10px; padding:12px 14px; font-size:12px; color:rgba(255,255,255,.6); line-height:1.6; margin-bottom:16px; }
.rp-info strong { color:#fbbf24; }

.rp-sucesso-icon { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.05)); border:2px solid rgba(16,185,129,.4); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; animation:popIn .6s cubic-bezier(.34,1.56,.64,1) both; }

.rp-link { background:none; border:none; cursor:pointer; font-size:13px; color:rgba(255,255,255,.35); font-family:inherit; text-decoration:underline; text-underline-offset:3px; }
.rp-link:hover { color:rgba(255,255,255,.6); }
`;

function vibrar() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(40);
}

type Etapa = "telefone" | "otp" | "sucesso";

export default function IndicadorRecuperarSenhaPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("telefone");
  const [email, setEmail] = useState("");
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
      const res = await fetch("/api/indicador/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      const res = await fetch("/api/indicador/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, novaSenha }),
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
      <div className="rp-page">
        <div className="rp-glow" />
        <div className="rp-card">

          <div className="rp-logo">
            <img src="/logo-indique.png" alt="Indique Placa" style={{ height: 56, objectFit: "contain" }} />
          </div>

          {etapa === "sucesso" && (
            <>
              <div className="rp-sucesso-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="rp-titulo">Senha alterada!</div>
              <p className="rp-sub">Entre com seu WhatsApp e a nova senha.</p>
              <button className="rp-btn" onClick={() => { vibrar(); router.push("/indicador/login"); }}>
                Ir para o login
              </button>
            </>
          )}

          {etapa === "otp" && (
            <>
              <div className="rp-titulo">Digite o código</div>
              <div className="rp-info">
                Um código de 6 dígitos foi enviado para o seu<br />
                <strong>email {email}</strong>.<br />
                Pode demorar até 2 minutos. Verifique também a caixa de spam.
              </div>
              <form onSubmit={confirmarOTP}>
                {erro && <div className="rp-erro">{erro}</div>}
                <input
                  className="rp-campo rp-campo-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={codigo}
                  required
                  maxLength={6}
                  autoFocus
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, ""))}
                />
                <div className="pw-wrap">
                  <input
                    className="rp-campo"
                    type={verSenha ? "text" : "password"}
                    placeholder="Nova senha (mínimo 6 caracteres)"
                    value={novaSenha}
                    required
                    onChange={e => setNovaSenha(e.target.value)}
                  />
                  <button type="button" className="pw-btn" onClick={() => setVerSenha(v => !v)} tabIndex={-1}>{olhoIcon(verSenha)}</button>
                </div>
                <input
                  className="rp-campo"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmar}
                  required
                  onChange={e => setConfirmar(e.target.value)}
                />
                <button className="rp-btn" type="submit" disabled={carregando || codigo.length < 6}>
                  {carregando ? "Confirmando..." : "Confirmar nova senha"}
                </button>
              </form>
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button className="rp-link" onClick={() => { setEtapa("telefone"); setErro(""); setCodigo(""); setEmail(""); }}>
                  Usar outro número
                </button>
              </div>
            </>
          )}

          {etapa === "telefone" && (
            <>
              <div className="rp-titulo">Esqueceu a senha?</div>
              <p className="rp-sub">Digite seu email. Vamos enviar um código de verificação.</p>
              <form onSubmit={solicitarOTP}>
                {erro && <div className="rp-erro">{erro}</div>}
                <input
                  className="rp-campo"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  required
                  autoFocus
                  onChange={e => setEmail(e.target.value)}
                />
                <button className="rp-btn" type="submit" disabled={carregando}>
                  {carregando ? "Enviando..." : "Enviar código pelo WhatsApp"}
                </button>
              </form>
            </>
          )}

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <a href="/indicador/login" style={{ fontSize: 13, color: "rgba(255,255,255,.35)", textDecoration: "none" }}>
              Voltar ao login
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
