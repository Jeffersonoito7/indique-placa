"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function ConsultorLinksPage() {
  const [link, setLink] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/consultor/links")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.linkIndicador) { setErro("Não foi possível carregar o link."); return; }
        setLink(d.linkIndicador);
        const url = await QRCode.toDataURL(d.linkIndicador, { width: 220, margin: 2 });
        setQrUrl(url);
      })
      .catch(() => setErro("Erro ao carregar link."));
  }, []);

  function copiar() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Link de Captação</h1>
      <p style={{ color: "var(--muted-foreground, #888)", fontSize: 14, marginBottom: 28 }}>
        Compartilhe este link para que indicadores se cadastrem diretamente na sua base.
      </p>

      {erro && <p style={{ color: "#f87171" }}>{erro}</p>}

      {!erro && (
        <div style={{
          background: "var(--card, #fff)", border: "1px solid var(--border, #e2e8f0)",
          borderRadius: 14, padding: 24,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--foreground, #111)" }}>
            Link para Indicadores
          </p>

          {link ? (
            <>
              <div style={{
                display: "flex", gap: 8, alignItems: "center",
                background: "var(--muted, #f8f9fa)", borderRadius: 8,
                padding: "10px 14px", marginBottom: 16,
              }}>
                <span style={{ flex: 1, fontSize: 13, wordBreak: "break-all", color: "var(--foreground, #333)" }}>
                  {link}
                </span>
                <button
                  onClick={copiar}
                  style={{
                    flexShrink: 0, padding: "6px 14px", background: copiado ? "#10b981" : "#3b82f6",
                    color: "#fff", border: "none", borderRadius: 8, fontSize: 13,
                    fontWeight: 600, cursor: "pointer", transition: "background .2s",
                  }}
                >
                  {copiado ? "Copiado!" : "Copiar"}
                </button>
              </div>

              {qrUrl && (
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>QR Code para compartilhar</p>
                  <img src={qrUrl} alt="QR Code indicador" style={{ borderRadius: 8, border: "1px solid var(--border, #e2e8f0)" }} />
                  <br />
                  <a
                    href={qrUrl}
                    download="link-indicador.png"
                    style={{
                      display: "inline-block", marginTop: 12, fontSize: 13,
                      color: "#3b82f6", textDecoration: "underline",
                    }}
                  >
                    Baixar QR Code
                  </a>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: "#888", fontSize: 13 }}>Carregando...</p>
          )}
        </div>
      )}
    </div>
  );
}
