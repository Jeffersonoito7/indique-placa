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
  background:#0c1425; border-top:1px solid rgba(22,163,74,.3);
  padding:14px 16px max(14px, env(safe-area-inset-bottom));
  box-shadow:0 -8px 40px rgba(0,0,0,.5);
  font-family:Inter,system-ui,sans-serif;
  animation:pwaSlide .35s cubic-bezier(.34,1.56,.64,1) both;
}
.pwa-row { display:flex; align-items:center; gap:12px; }
.pwa-icon { width:44px; height:44px; border-radius:10px; flex-shrink:0; }
.pwa-txt { flex:1; min-width:0; }
.pwa-titulo { font-size:13px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pwa-sub { font-size:11px; color:rgba(255,255,255,.45); margin-top:2px; }
.pwa-btns { display:flex; gap:8px; flex-shrink:0; }
.pwa-btn-fechar { padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,.15); background:transparent; color:rgba(255,255,255,.5); font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; }
.pwa-btn-instalar { padding:8px 16px; border-radius:8px; border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; white-space:nowrap; }
.pwa-ios-inst { font-size:12px; color:rgba(255,255,255,.6); line-height:1.7; margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,.08); }
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
    if (saved && Date.now() - Number(saved) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

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
    localStorage.setItem("pwa-dismissed", String(Date.now()));
  };

  if (isStandalone || dismissed) return null;

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
          <div className="pwa-row">
            <img src="/icon-192.png" className="pwa-icon" alt="" />
            <div className="pwa-txt">
              <div className="pwa-titulo">Instalar no iPhone</div>
              <div className="pwa-sub">Salve na tela inicial para acesso rápido</div>
            </div>
            <button onClick={fechar} style={{ background:"none", border:"none", color:"rgba(255,255,255,.4)", fontSize:22, cursor:"pointer", flexShrink:0, lineHeight:1, padding:"4px 8px" }}>×</button>
          </div>
          <div className="pwa-ios-inst">
            Toque em{" "}
            <span style={{ color:"#38bdf8", fontWeight:600 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign:"middle", marginRight:2 }}>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Compartilhar
            </span>
            {" "}e depois em{" "}
            <span style={{ color:"#4ade80", fontWeight:600 }}>"Adicionar à Tela de Início"</span>
          </div>
        </div>
      </>
    );
  }

  return null;
}
