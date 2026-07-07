"use client";

import { useRef } from "react";

interface PlacaMercosulProps {
  placa: string;
  tamanho?: "sm" | "md" | "lg";
  editavel?: boolean;
  onChange?: (valor: string) => void;
}

function formatarPlaca(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function PlacaMercosul({ placa, tamanho = "md", editavel = false, onChange }: PlacaMercosulProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formatada = placa.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);

  const partes = formatada.length <= 3
    ? [formatada, ""]
    : [formatada.slice(0, 3), formatada.slice(3)];

  const escalas = { sm: 0.55, md: 0.85, lg: 1.2 };
  const escala = escalas[tamanho];

  const w = Math.round(400 * escala);
  const h = Math.round(130 * escala);

  const placaDisplay = partes[0] + (partes[0] && partes[1] ? "-" : "") + partes[1];
  const vazia = formatada.length === 0;

  const svg = (
    <svg
      width={w}
      height={h}
      viewBox="0 0 400 130"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", pointerEvents: editavel ? "none" : "auto" }}
    >
      <filter id="sombra-placa">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
      </filter>
      <rect x="0" y="0" width="400" height="130" rx="8" ry="8" fill="#f5f5f0" filter="url(#sombra-placa)" />
      <rect x="0" y="0" width="400" height="130" rx="8" ry="8" fill="none" stroke="#bbb" strokeWidth="3" />
      <rect x="6" y="6" width="388" height="118" rx="5" ry="5" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <rect x="7" y="7" width="386" height="28" rx="4" ry="4" fill="#003399" />
      <text x="200" y="27" fontFamily="Arial Black, Arial, sans-serif" fontSize="13" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="3">
        INDIQUE PLACA
      </text>
      <text x="200" y="102" fontFamily="'Arial Black', 'FE-FONT', Arial, sans-serif" fontSize="62" fontWeight="900" fill={vazia ? "#ccc" : "#1a1a1a"} textAnchor="middle" letterSpacing="6">
        {vazia ? "ABC-1234" : placaDisplay}
      </text>
      {editavel && (
        <rect x="20" y="42" width="360" height="76" rx="4" fill="transparent" />
      )}
    </svg>
  );

  if (!editavel) return svg;

  return (
    <div
      style={{ position: "relative", display: "inline-block", cursor: "text" }}
      onClick={() => inputRef.current?.focus()}
    >
      {svg}
      <input
        ref={inputRef}
        type="text"
        value={formatada.length <= 3 ? formatada : formatada.slice(0, 3) + "-" + formatada.slice(3)}
        onChange={(e) => onChange?.(formatarPlaca(e.target.value))}
        maxLength={8}
        autoComplete="off"
        autoCapitalize="characters"
        inputMode="text"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "text",
          fontSize: 16,
        }}
      />
    </div>
  );
}
