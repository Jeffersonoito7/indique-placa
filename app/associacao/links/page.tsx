"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type LinkInfo = {
  label: string;
  link: string;
  qrUrl: string | null;
  copiado: boolean;
};

export default function AssociacaoLinksPage() {
  const [infos, setInfos] = useState<LinkInfo[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/associacao/links")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.linkGestor) { setErro("Não foi possível carregar os links."); return; }

        const items: LinkInfo[] = [
          { label: "Link para Gestores", link: d.linkGestor, qrUrl: null, copiado: false },
          { label: "Link para Consultores", link: d.linkConsultor, qrUrl: null, copiado: false },
        ];

        for (const item of items) {
          item.qrUrl = await QRCode.toDataURL(item.link, { width: 220, margin: 2 });
        }

        setInfos([...items]);
      })
      .catch(() => setErro("Erro ao carregar links."));
  }, []);

  function copiar(idx: number) {
    navigator.clipboard.writeText(infos[idx].link);
    setInfos((prev) => prev.map((x, i) => i === idx ? { ...x, copiado: true } : x));
    setTimeout(() => setInfos((prev) => prev.map((x, i) => i === idx ? { ...x, copiado: false } : x)), 2000);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Links de Captação</h1>
      <p style={{ color: "var(--muted-foreground, #888)", fontSize: 14, marginBottom: 28 }}>
        Compartilhe estes links para que gestores e consultores se cadastrem diretamente na sua associação.
      </p>

      {erro && <p style={{ color: "#f87171" }}>{erro}</p>}

      {infos.length === 0 && !erro && (
        <p style={{ color: "#888", fontSize: 13 }}>Carregando...</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {infos.map((info, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--card, #fff)", border: "1px solid var(--border, #e2e8f0)",
              borderRadius: 14, padding: 24,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--foreground, #111)" }}>
              {info.label}
            </p>

            <div style={{
              display: "flex", gap: 8, alignItems: "center",
              background: "var(--muted, #f8f9fa)", borderRadius: 8,
              padding: "10px 14px", marginBottom: 16,
            }}>
              <span style={{ flex: 1, fontSize: 13, wordBreak: "break-all", color: "var(--foreground, #333)" }}>
                {info.link}
              </span>
              <button
                onClick={() => copiar(idx)}
                style={{
                  flexShrink: 0, padding: "6px 14px",
                  background: info.copiado ? "#10b981" : "#7c3aed",
                  color: "#fff", border: "none", borderRadius: 8, fontSize: 13,
                  fontWeight: 600, cursor: "pointer", transition: "background .2s",
                }}
              >
                {info.copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>

            {info.qrUrl && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>QR Code para compartilhar</p>
                <img src={info.qrUrl} alt={`QR Code ${info.label}`} style={{ borderRadius: 8, border: "1px solid var(--border, #e2e8f0)" }} />
                <br />
                <a
                  href={info.qrUrl}
                  download={`link-${idx === 0 ? "gestor" : "consultor"}.png`}
                  style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "#7c3aed", textDecoration: "underline" }}
                >
                  Baixar QR Code
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
