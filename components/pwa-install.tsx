"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CSS = `
@keyframes pwaSlide { from { transform:translateY(100px); opacity:0 } to { transform:translateY(0); opacity:1 } }
.pwa-banner {
  position:fixed; bottom:0; left:0; right:0; z-index:9999;
  background:#0c1425; border-top:2px solid rgba(22,163,74,.4);
  padding:16px 20px max(16px, env(safe-area-inset-bottom));
  box-shadow:0 -8px 40px rgba(0,0,0,.6);
  font-family:Inter,system-ui,sans-serif;
  animation:pwaSlide .35s cubic-bezier(.34,1.56,.64,1) both;
}
.pwa-row { display:flex; align-items:center; gap:14px; }
.pwa-icon { width:48px; height:48px; border-radius:12px; flex-shrink:0; }
.pwa-txt { flex:1; min-width:0; }
.pwa-titulo { font-size:15px; font-weight:700; color:#fff; }
.pwa-sub { font-size:13px; color:rgba(255,255,255,.5); margin-top:3px; }
.pwa-btns { display:flex; gap:8px; flex-shrink:0; }
.pwa-btn-fechar { padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,.15); background:transparent; color:rgba(255,255,255,.5); font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; }
.pwa-btn-instalar { padding:10px 18px; border-radius:10px; border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; }
.pwa-ios-cabecalho { display:flex; align-items:center; gap:14px; }
.pwa-ios-fechar { background:none; border:none; color:rgba(255,255,255,.4); font-size:26px; cursor:pointer; line-height:1; padding:0; flex-shrink:0; }
.pwa-ios-btn { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; margin-top:14px; padding:14px; border-radius:12px; border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; font-size:15px; font-weight:700; cursor:default; font-family:inherit; box-shadow:0 4px 20px rgba(22,163,74,.3); }
.pwa-ios-hint { font-size:12px; color:rgba(255,255,255,.35); margin-top:10px; text-align:center; line-height:1.6; }
`;

export function PwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      ("standalone" in navigator && (navigator as any).standalone === true) ||
      window.matchMedia("(display-mode: standalone)").matches;

    setIsIos(ios);
    setIsStandalone(standalone);

    const saved = localStorage.getItem("pwa-dismissed");
    if (saved) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const instalar = async () => {
    if (!prompt) return;
    if ("vibrate" in navigator) navigator.vibrate(30);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
    else fechar();
  };

  const fechar = () => {
    setDismissed(true);
    localStorage.setItem("pwa-dismissed", "permanent");
  };

  if (isStandalone || dismissed || isIos) return null;

  if (prompt) {
    return (
      <>
        <style>{CSS}</style>
        <div className="pwa-banner">
          <div className="pwa-row">
            <img src="/icon-192.png" className="pwa-icon" alt="" />
            <div className="pwa-txt">
              <div className="pwa-titulo">Instalar Indique Placa</div>
              <div className="pwa-sub">Acesso rápido pela tela inicial</div>
            </div>
            <div className="pwa-btns">
              <button className="pwa-btn-fechar" onClick={fechar}>Agora não</button>
              <button className="pwa-btn-instalar" onClick={instalar}>Instalar</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isIos) {
    return (
      <>
        <style>{CSS}</style>
        <div className="pwa-banner">
          <div className="pwa-ios-cabecalho">
            <img src="/icon-192.png" className="pwa-icon" alt="" />
            <div className="pwa-txt">
              <div className="pwa-titulo">Instalar o app</div>
              <div className="pwa-sub">Acesso rápido pela tela inicial</div>
            </div>
            <button onClick={fechar} className="pwa-ios-fechar">×</button>
          </div>
          <div className="pwa-ios-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Adicionar à Tela de Início
          </div>
          <div className="pwa-ios-hint">
            Toque em{" "}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign:"middle" }}>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            {" "}na barra do Safari e depois em "Adicionar à Tela de Início"
          </div>
        </div>
      </>
    );
  }

  return null;
}
