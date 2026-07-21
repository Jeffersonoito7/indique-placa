"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--background)", fontFamily: "Inter, system-ui, sans-serif",
      padding: "24px",
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", marginBottom: 8 }}>
        Algo deu errado
      </div>
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 24, textAlign: "center", maxWidth: 360 }}>
        Ocorreu um erro inesperado. Tente novamente ou volte para o inicio.
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
            background: "#f59e0b", color: "#000", border: "none", cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
        <a
          href="/"
          style={{
            padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13,
            background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)",
            textDecoration: "none",
          }}
        >
          Inicio
        </a>
      </div>
    </div>
  );
}
