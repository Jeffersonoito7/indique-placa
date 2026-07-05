export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#07070E", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>🚗</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#10B981", letterSpacing: 1, marginBottom: 8 }}>INDIQUE PLACA</div>
        <div style={{ fontSize: 15, color: "#6B7280", marginBottom: 40 }}>Plataforma de indicacoes para protecao veicular</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a href="/master/login" style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#1a0080,#2222CC)", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Painel Master
          </a>
          <a href="/consultor/login" style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Painel do Consultor
          </a>
          <a href="/indicador/login" style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#78350f,#92400e)", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Painel do Indicador
          </a>
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <a href="/indique" style={{ flex: 1, display: "block", padding: "12px 20px", background: "#0D0D18", border: "1px solid #1A1A2E", borderRadius: 12, color: "#10B981", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Fazer Indicacao
            </a>
            <a href="/captador" style={{ flex: 1, display: "block", padding: "12px 20px", background: "#0D0D18", border: "1px solid #1A1A2E", borderRadius: 12, color: "#6C8FD4", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Ser Captador
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
