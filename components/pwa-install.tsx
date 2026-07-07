"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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

  // Android/Chrome: prompt nativo disponivel
  if (prompt) {
    return (
      <div style={{
        position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 9999,
        background: "#0f172a", border: "1px solid rgba(22,163,74,.4)",
        borderRadius: 16, padding: "16px 20px",
        boxShadow: "0 8px 40px rgba(0,0,0,.5)",
        display: "flex", alignItems: "center", gap: 14,
        fontFamily: "Inter, system-ui, sans-serif",
        animation: "slideUp .3s ease",
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <img src="/icon-192.png" style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} alt="" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Instalar Indique Placa</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 }}>Acesse mais rapido pela tela inicial</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={fechar} style={{
            padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.15)",
            background: "transparent", color: "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer",
          }}>Agora nao</button>
          <button onClick={instalar} style={{
            padding: "7px 16px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg,#16a34a,#22c55e)",
            color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>Instalar</button>
        </div>
      </div>
    );
  }

  // iOS Safari: instrucao manual
  if (isIos) {
    return (
      <div style={{
        position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 9999,
        background: "#0f172a", border: "1px solid rgba(22,163,74,.4)",
        borderRadius: 16, padding: "16px 20px",
        boxShadow: "0 8px 40px rgba(0,0,0,.5)",
        fontFamily: "Inter, system-ui, sans-serif",
        animation: "slideUp .3s ease",
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Instalar no iPhone</div>
          <button onClick={fechar} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
          Toque em{" "}
          <span style={{ color: "#38bdf8", fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "middle", marginRight: 2 }}>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Compartilhar
          </span>{" "}
          e depois{" "}
          <span style={{ color: "#4ade80", fontWeight: 600 }}>"Adicionar a Tela de Inicio"</span>
          {" "}para instalar o app.
        </div>
      </div>
    );
  }

  return null;
}
