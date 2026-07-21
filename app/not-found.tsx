export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--background)", fontFamily: "Inter, system-ui, sans-serif",
      padding: "24px",
    }}>
      <div style={{ fontSize: 80, fontWeight: 900, color: "var(--foreground)", opacity: 0.08, lineHeight: 1 }}>
        404
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", marginTop: -8 }}>
        Pagina nao encontrada
      </div>
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 8, marginBottom: 24 }}>
        O endereco que voce acessou nao existe ou foi removido.
      </div>
      <a
        href="/"
        style={{
          padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13,
          background: "#f59e0b", color: "#000", textDecoration: "none",
        }}
      >
        Ir para o inicio
      </a>
    </div>
  );
}
