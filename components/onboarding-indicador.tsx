"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Car, Hash, Send } from "lucide-react";

const STORAGE_KEY = "onboarding_dispensado";

interface OnboardingIndicadorProps {
  totalIndicacoes: number;
}

export function OnboardingIndicador({ totalIndicacoes }: OnboardingIndicadorProps) {
  const router = useRouter();
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (totalIndicacoes > 0) return;
    const dispensado = localStorage.getItem(STORAGE_KEY) === "true";
    if (!dispensado) setVisivel(true);
  }, [totalIndicacoes]);

  if (!visivel) return null;

  const dispensar = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisivel(false);
  };

  const passos = [
    { numero: 1, icone: <Car size={16} />, texto: "Viu um carro, moto ou caminhao? Anote a placa e os dados do dono" },
    { numero: 2, icone: <Hash size={16} />, texto: "Cadastre a placa e o contato do prospecto no painel" },
    { numero: 3, icone: <Send size={16} />, texto: "Avise ao prospecto que um consultor vai entrar em contato" },
  ];

  return (
    <div
      style={{
        margin: "0 16px 16px",
        background: "rgba(245,158,11,0.10)",
        border: "1px solid rgba(245,158,11,0.30)",
        borderRadius: 16,
        padding: "20px 16px",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
        Bem-vindo! Faca sua primeira indicacao
      </div>
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 16 }}>
        E simples. Siga os 3 passos:
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {passos.map((p) => (
          <div key={p.numero} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 99,
                background: "#f59e0b",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {p.numero}
            </div>
            <div style={{ color: "var(--foreground)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#f59e0b" }}>{p.icone}</span>
              {p.texto}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/indicador/indicar")}
        style={{
          display: "block",
          width: "100%",
          padding: "14px 0",
          borderRadius: 12,
          background: "#f59e0b",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        Comecar agora
      </button>

      <button
        onClick={dispensar}
        style={{
          display: "block",
          width: "100%",
          padding: "8px 0",
          borderRadius: 12,
          background: "transparent",
          color: "var(--muted-foreground)",
          fontWeight: 500,
          fontSize: 13,
          border: "none",
          cursor: "pointer",
        }}
      >
        Pular por enquanto
      </button>
    </div>
  );
}
