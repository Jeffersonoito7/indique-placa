"use client";

import { useEffect, useState } from "react";

interface Links {
  linkConsultor: string;
  linkIndicador: string;
  linkLead: string;
}

function LinkCard({ titulo, descricao, link }: { titulo: string; descricao: string; link: string }) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div style={{
      background: "var(--card, #fff)", border: "1px solid var(--border, #e2e8f0)",
      borderRadius: 14, padding: 24, marginBottom: 20,
    }}>
      <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "var(--foreground, #111)" }}>{titulo}</p>
      <p style={{ fontSize: 13, color: "var(--muted-foreground, #888)", marginBottom: 14 }}>{descricao}</p>
      <div style={{
        display: "flex", gap: 8, alignItems: "center",
        background: "var(--muted, #f8f9fa)", borderRadius: 8,
        padding: "10px 14px", marginBottom: 12,
      }}>
        <span style={{ flex: 1, fontSize: 12, wordBreak: "break-all", color: "var(--foreground, #333)", fontFamily: "monospace" }}>
          {link}
        </span>
        <button
          onClick={copiar}
          style={{
            padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
            background: copiado ? "#00C389" : "var(--primary, #0D2B5E)",
            color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", transition: "background .2s",
          }}
        >
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12, color: "#00C389", fontWeight: 600, textDecoration: "none" }}
      >
        Abrir link
      </a>
    </div>
  );
}

export default function GestorLinksPage() {
  const [links, setLinks] = useState<Links | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/gestor/links")
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => setLinks(d))
      .catch(() => setErro("Erro ao carregar links."));
  }, []);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Links de Captação</h1>
      <p style={{ color: "var(--muted-foreground, #888)", fontSize: 14, marginBottom: 28 }}>
        Compartilhe os links abaixo para recrutar consultores, indicadores e capturar leads.
      </p>

      {erro && <p style={{ color: "#f87171" }}>{erro}</p>}

      {links && (
        <>
          <LinkCard
            titulo="Recrutar Consultores"
            descricao="Pessoa que acessa este link se cadastra como consultor no seu time."
            link={links.linkConsultor}
          />
          <LinkCard
            titulo="Recrutar Indicadores"
            descricao="Pessoa que acessa este link se cadastra como indicador diretamente no seu time."
            link={links.linkIndicador}
          />
          <LinkCard
            titulo="Captura de Leads"
            descricao="Link para clientes indicarem veículos vinculados à sua conta."
            link={links.linkLead}
          />
        </>
      )}
    </div>
  );
}
