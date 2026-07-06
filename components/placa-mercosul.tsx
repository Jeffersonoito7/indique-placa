"use client";

interface PlacaMercosulProps {
  placa: string;
  tamanho?: "sm" | "md" | "lg";
}

export function PlacaMercosul({ placa, tamanho = "md" }: PlacaMercosulProps) {
  const formatada = placa.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);

  const partes = formatada.length <= 3
    ? [formatada, ""]
    : [formatada.slice(0, 3), formatada.slice(3)];

  const escalas = { sm: 0.55, md: 0.85, lg: 1.2 };
  const escala = escalas[tamanho];

  const w = Math.round(400 * escala);
  const h = Math.round(130 * escala);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 400 130"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* Sombra */}
      <filter id="sombra">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
      </filter>

      {/* Fundo branco */}
      <rect x="0" y="0" width="400" height="130" rx="8" ry="8" fill="#f5f5f0" filter="url(#sombra)" />

      {/* Borda externa cinza */}
      <rect x="0" y="0" width="400" height="130" rx="8" ry="8" fill="none" stroke="#bbb" strokeWidth="3" />

      {/* Borda interna preta */}
      <rect x="6" y="6" width="388" height="118" rx="5" ry="5" fill="none" stroke="#1a1a1a" strokeWidth="2" />

      {/* Faixa azul topo (Mercosul) */}
      <rect x="7" y="7" width="386" height="28" rx="4" ry="4" fill="#003399" />

      {/* Bandeira do Brasil simplificada */}
      <rect x="16" y="10" width="32" height="22" rx="2" fill="#009c3b" />
      <polygon points="16,21 32,12 48,21 32,30" fill="#fedf00" />
      <circle cx="32" cy="21" r="6" fill="#003399" />

      {/* BRASIL */}
      <text
        x="200"
        y="27"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="14"
        fontWeight="900"
        fill="#ffffff"
        textAnchor="middle"
        letterSpacing="4"
      >
        BRASIL
      </text>

      {/* Caracteres da placa */}
      <text
        x="200"
        y="102"
        fontFamily="'Arial Black', 'FE-FONT', Arial, sans-serif"
        fontSize="62"
        fontWeight="900"
        fill="#1a1a1a"
        textAnchor="middle"
        letterSpacing="6"
      >
        {partes[0]}{partes[0] && partes[1] ? "-" : ""}{partes[1]}
      </text>

      {/* Tracos de posicao quando vazio */}
      {formatada.length === 0 && (
        <text
          x="200"
          y="102"
          fontFamily="'Arial Black', Arial, sans-serif"
          fontSize="62"
          fontWeight="900"
          fill="#ccc"
          textAnchor="middle"
          letterSpacing="6"
        >
          ABC-1234
        </text>
      )}
    </svg>
  );
}
