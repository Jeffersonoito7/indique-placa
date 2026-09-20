"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginUnificado() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Erro ao entrar.");
        return;
      }
      router.push(json.redirect);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }

        .lp-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .lp-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(234,179,8,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 400px 300px at 80% 70%, rgba(234,179,8,0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .lp-card {
          background: rgba(15,17,26,0.95);
          border: 1px solid rgba(234,179,8,0.15);
          border-radius: 16px;
          padding: 40px 36px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(234,179,8,0.05);
          animation: float 6s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }

        .lp-logo {
          text-align: center;
          margin-bottom: 28px;
        }

        .lp-logo svg {
          display: block;
          margin: 0 auto 12px;
        }

        .lp-title {
          font-size: 22px;
          font-weight: 700;
          color: #f0f0f0;
          letter-spacing: -0.3px;
          text-align: center;
        }

        .lp-sub {
          font-size: 13px;
          color: #6b7280;
          text-align: center;
          margin-top: 4px;
        }

        .lp-campo {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 13px 16px;
          color: #f0f0f0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          display: block;
          margin-top: 14px;
        }
        .lp-campo::placeholder { color: #4b5563; }
        .lp-campo:focus { border-color: rgba(234,179,8,0.5); }

        .lp-pw-wrap {
          position: relative;
        }
        .lp-pw-wrap .lp-campo { padding-right: 44px; }
        .lp-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          margin-top: 7px;
        }
        .lp-eye:hover { color: #eab308; }

        .lp-btn {
          width: 100%;
          margin-top: 20px;
          padding: 14px;
          background: linear-gradient(135deg, #eab308, #ca8a04);
          color: #0a0a0f;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .lp-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .lp-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .lp-erro {
          margin-top: 14px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          padding: 10px 14px;
          color: #f87171;
          font-size: 13px;
          text-align: center;
        }

        .lp-links {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #4b5563;
        }
        .lp-links a {
          color: #eab308;
          text-decoration: none;
          font-weight: 500;
        }
        .lp-links a:hover { text-decoration: underline; }

        .lp-divider {
          margin: 20px 0 16px;
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
      `}</style>

      <div className="lp-bg">
        <div className="lp-card">
          <div className="lp-logo">
            {/* Placa estilizada */}
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="52" height="52" rx="12" fill="rgba(234,179,8,0.12)" />
              <rect x="8" y="16" width="36" height="20" rx="4" stroke="#eab308" strokeWidth="2" fill="none"/>
              <text x="26" y="30" textAnchor="middle" fill="#eab308" fontSize="10" fontWeight="700" fontFamily="monospace">IP</text>
            </svg>
            <div className="lp-title">IndiquePlaca</div>
            <div className="lp-sub">Acesse sua conta</div>
          </div>

          <form onSubmit={entrar} noValidate>
            <input
              className="lp-campo"
              type="text"
              inputMode="email"
              placeholder="seu@email.com"
              value={email}
              required
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="lp-pw-wrap">
              <input
                className="lp-campo"
                type={verSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                required
                onChange={(e) => setSenha(e.target.value)}
              />
              <button type="button" className="lp-eye" onClick={() => setVerSenha((v) => !v)} tabIndex={-1}>
                {verSenha ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <button className="lp-btn" type="submit" disabled={carregando || !email || !senha}>
              {carregando ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>

          {erro && <div className="lp-erro">{erro}</div>}

          <hr className="lp-divider" />

          <div className="lp-links">
            Indicador? <a href="/indicador/login">Acesse por telefone</a>
            {" · "}
            <a href="/gestor/recuperar-senha">Esqueci minha senha</a>
          </div>
        </div>
      </div>
    </>
  );
}
