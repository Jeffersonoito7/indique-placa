"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2, Smartphone, DollarSign, X } from "lucide-react";

const STORAGE_KEY = "onboarding_consultor_dispensado";

interface OnboardingConsultorProps {
  totalLeads: number;
  totalIndicadores: number;
}

export function OnboardingConsultor({ totalLeads, totalIndicadores }: OnboardingConsultorProps) {
  const router = useRouter();
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (totalLeads > 0 || totalIndicadores > 0) return;
    const dispensado = localStorage.getItem(STORAGE_KEY) === "true";
    if (!dispensado) setVisivel(true);
  }, [totalLeads, totalIndicadores]);

  if (!visivel) return null;

  const dispensar = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisivel(false);
  };

  const passos = [
    {
      numero: 1,
      icone: <Smartphone size={16} />,
      titulo: "Conecte o WhatsApp",
      texto: "Va em WhatsApp no menu lateral e conecte seu numero para enviar mensagens automaticas",
      acao: { label: "Conectar agora", href: "/consultor/whatsapp" },
    },
    {
      numero: 2,
      icone: <Link2 size={16} />,
      titulo: "Compartilhe seu link",
      texto: "Envie o link de indicacao para amigos, clientes e conhecidos. Cada um que indicar uma placa vai gerar um lead pra voce",
      acao: { label: "Ver meus links", href: "/consultor/perfil" },
    },
    {
      numero: 3,
      icone: <DollarSign size={16} />,
      titulo: "Feche vendas e pague comissoes",
      texto: "Quando converter um lead, marque como fechado. O sistema mostra o que deve pagar ao indicador",
      acao: null,
    },
  ];

  return (
    <div
      style={{
        margin: "0 0 20px",
        background: "rgba(6,182,212,0.08)",
        border: "1px solid rgba(6,182,212,0.25)",
        borderRadius: 16,
        padding: "20px",
        position: "relative",
      }}
    >
      <button
        onClick={dispensar}
        style={{
          position: "absolute", top: 12, right: 12,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--muted-foreground)", padding: 4,
        }}
      >
        <X size={16} />
      </button>

      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
        Bem-vindo ao Indique Placa!
      </div>
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 16 }}>
        Siga esses 3 passos para comecar a fechar vendas:
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {passos.map((p) => (
          <div
            key={p.numero}
            style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#06b6d4",
            }}>
              {p.icone}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 2 }}>
                {p.numero}. {p.titulo}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                {p.texto}
              </div>
              {p.acao && (
                <button
                  onClick={() => { dispensar(); router.push(p.acao!.href); }}
                  style={{
                    marginTop: 8, fontSize: 11, fontWeight: 700,
                    color: "#06b6d4", background: "none", border: "none",
                    cursor: "pointer", padding: 0, textDecoration: "underline",
                  }}
                >
                  {p.acao.label} →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={dispensar}
        style={{
          marginTop: 16, fontSize: 11, color: "var(--muted-foreground)",
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}
      >
        Nao mostrar novamente
      </button>
    </div>
  );
}
