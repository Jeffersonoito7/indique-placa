"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CSS = `
  @keyframes bgShift {
    0%,100% { background-position:0% 50%; }
    50%      { background-position:100% 50%; }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes borderGlow {
    0%,100% { border-color:rgba(34,211,238,.2); box-shadow:0 0 30px rgba(34,211,238,.05),0 24px 80px rgba(0,0,0,.7); }
    50%      { border-color:rgba(52,211,153,.45); box-shadow:0 0 50px rgba(52,211,153,.12),0 24px 80px rgba(0,0,0,.7); }
  }
  @keyframes scanLine {
    0%   { top:-2px; opacity:.4; }
    100% { top:100%; opacity:0; }
  }
  .rp-root {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    padding:20px; position:relative; overflow:hidden;
    background:linear-gradient(135deg,#020c10,#041a14,#020e18,#020c10,#030f07);
    background-size:400% 400%;
    animation:bgShift 16s ease infinite;
    font-family:Inter,system-ui,sans-serif;
  }
  .rp-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(34,211,238,.04) 1px,transparent 1px),
      linear-gradient(90deg,rgba(52,211,153,.04) 1px,transparent 1px);
    background-size:48px 48px;
  }
  .rp-card {
    position:relative; width:100%; max-width:380px; text-align:center;
    background:rgba(34,211,238,.03); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px);
    border:1px solid rgba(34,211,238,.2); border-radius:24px;
    padding:40px 32px 36px;
    animation:fadeUp .55s ease both, borderGlow 4s ease-in-out infinite;
    overflow:hidden;
  }
  .rp-scan {
    position:absolute; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,rgba(34,211,238,.4),transparent);
    animation:scanLine 3.5s linear infinite;
    pointer-events:none;
  }
  .rp-badge {
    display:inline-flex; align-items:center;
    background:rgba(34,211,238,.12); border:1px solid rgba(34,211,238,.35);
    border-radius:6px; padding:3px 12px; font-size:10px; font-weight:700;
    letter-spacing:1.5px; color:#67e8f9; text-transform:uppercase; margin-bottom:8px;
  }
  .rp-title { font-size:18px; font-weight:800; color:#e2e8f0; margin-bottom:6px; }
  .rp-sub { font-size:12px; color:rgba(255,255,255,.4); margin-bottom:24px; }
  .rp-erro {
    background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3);
    border-radius:10px; padding:9px 14px; font-size:12px; color:#f87171; margin-bottom:14px;
  }
  .rp-sucesso {
    background:rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.3);
    border-radius:10px; padding:9px 14px; font-size:12px; color:#86efac; margin-bottom:14px;
  }
  .rp-campo {
    width:100%; padding:13px 15px; margin-bottom:12px; box-sizing:border-box;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
    border-radius:12px; font-size:14px; color:#e2e8f0; outline:none;
    font-family:inherit; transition:border-color .2s,background .2s,box-shadow .2s;
  }
  .rp-campo:focus {
    border-color:rgba(34,211,238,.55);
    background:rgba(34,211,238,.05);
    box-shadow:0 0 0 3px rgba(34,211,238,.07);
  }
  .rp-campo::placeholder { color:rgba(255,255,255,.28); }
  .rp-btn {
    width:100%; padding:14px; border:none; border-radius:12px;
    background:linear-gradient(135deg,#065f46,#059669,#34d399,#22d3ee,#0891b2);
    box-shadow:0 4px 24px rgba(34,211,238,.3);
    color:#fff; font-size:13px; font-weight:800; letter-spacing:1.5px;
    cursor:pointer; font-family:inherit; transition:opacity .15s,transform .1s;
  }
  .rp-btn:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
  .rp-btn:disabled { opacity:.5; cursor:not-allowed; }
  .rp-voltar { margin-top:18px; font-size:12px; color:rgba(255,255,255,.3); }
  .rp-voltar a { color:#67e8f9; text-decoration:none; }
  .rp-voltar a:hover { color:#a5f3fc; }
  .rp-otp {
    display:flex; gap:8px; justify-content:center; margin-bottom:16px;
  }
  .rp-otp input {
    width:42px; height:50px; text-align:center; font-size:20px; font-weight:700;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.15);
    border-radius:10px; color:#e2e8f0; outline:none; font-family:inherit;
    transition:border-color .2s,box-shadow .2s;
  }
  .rp-otp input:focus {
    border-color:rgba(34,211,238,.6);
    box-shadow:0 0 0 3px rgba(34,211,238,.08);
  }
`;

export default function MasterRecuperarSenhaPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [usuario, setUsuario] = useState("");
  const [digitos, setDigitos] = useState(["", "", "", "", "", ""]);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(false);

  const enviarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/master/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario }),
      });
      if (!res.ok) {
        const json = await res.json();
        setErro(json.error ?? "Erro ao processar solicitação.");
        return;
      }
      setMsg("Se o usuário for válido, um código foi enviado para o e-mail do administrador.");
      setEtapa(2);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleDigito = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const novos = [...digitos];
    novos[i] = d;
    setDigitos(novos);
    if (d && i < 5) {
      const next = document.getElementById(`otp-${i + 1}`);
      (next as HTMLInputElement)?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digitos[i] && i > 0) {
      const prev = document.getElementById(`otp-${i - 1}`);
      (prev as HTMLInputElement)?.focus();
    }
  };

  const validarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigo = digitos.join("");
    if (codigo.length < 6) { setErro("Digite o código completo."); return; }
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/master/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, codigo }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Código inválido."); return; }
      router.push("/master/dashboard");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="rp-root">
        <div className="rp-grid" />
        <div className="rp-card">
          <div className="rp-scan" />
          <div className="rp-badge">Master</div>
          <div className="rp-title">Recuperar Acesso</div>

          {etapa === 1 && (
            <>
              <div className="rp-sub">Informe seu usuário para receber o código de acesso.</div>
              {erro && <div className="rp-erro">{erro}</div>}
              <form onSubmit={enviarUsuario} noValidate>
                <input
                  className="rp-campo"
                  type="text"
                  placeholder="Usuário master"
                  value={usuario}
                  required
                  autoComplete="username"
                  onChange={(e) => setUsuario(e.target.value)}
                />
                <button className="rp-btn" type="submit" disabled={carregando || !usuario}>
                  {carregando ? "ENVIANDO..." : "ENVIAR CÓDIGO"}
                </button>
              </form>
            </>
          )}

          {etapa === 2 && (
            <>
              <div className="rp-sub">Digite o código de 6 dígitos enviado para o e-mail do administrador.</div>
              {msg && <div className="rp-sucesso">{msg}</div>}
              {erro && <div className="rp-erro">{erro}</div>}
              <form onSubmit={validarCodigo} noValidate>
                <div className="rp-otp">
                  {digitos.map((d, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigito(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <button className="rp-btn" type="submit" disabled={carregando || digitos.join("").length < 6}>
                  {carregando ? "VERIFICANDO..." : "ACESSAR PAINEL"}
                </button>
              </form>
              <div className="rp-voltar" style={{ marginTop: 14 }}>
                <button
                  style={{ background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer",fontSize:12 }}
                  onClick={() => { setEtapa(1); setErro(""); setMsg(""); setDigitos(["","","","","",""]); }}
                >
                  Reenviar codigo
                </button>
              </div>
            </>
          )}

          <div className="rp-voltar">
            <a href="/master/login">Voltar ao login</a>
          </div>
        </div>
      </div>
    </>
  );
}
