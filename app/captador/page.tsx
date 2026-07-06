"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FormCaptador() {
  const params = useSearchParams();
  const consultorId = params.get("c") ?? "";
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/captador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, consultor_id: consultorId }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Erro ao enviar");
      else setSucesso(true);
    } catch { setErro("Erro de conexão."); }
    finally { setCarregando(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "#111318", border: "1px solid #1A1A2E", borderRadius: 10, fontSize: 14, color: "#fff", fontFamily: "inherit", boxSizing: "border-box", outline: "none", marginBottom: 12 };

  if (sucesso) {
    return (
      <div className="text-center py-8">
        <div style={{ width: 64, height: 64, background: "rgba(16,185,129,.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle2 size={32} color="#10B981" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Cadastro realizado!</h2>
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Seu cadastro foi enviado. Em breve entraremos em contato.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      {erro && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#EF4444", marginBottom: 12 }}>{erro}</div>}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Nome completo</div>
      <input type="text" placeholder="Ex: Maria da Silva" value={nome} onChange={(e) => setNome(e.target.value)} required style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#6C8FD4")} onBlur={(e) => (e.target.style.borderColor = "#1A1A2E")} />
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Telefone (WhatsApp)</div>
      <input type="tel" placeholder="Ex: 11999999999" value={telefone} onChange={(e) => setTelefone(e.target.value)} required style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#6C8FD4")} onBlur={(e) => (e.target.style.borderColor = "#1A1A2E")} />
      <button type="submit" disabled={carregando} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg,#1a0080,#2222CC)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: carregando ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: carregando ? 0.7 : 1 }}>
        {carregando ? "Enviando..." : "Quero Me Cadastrar"}
      </button>
    </form>
  );
}

export default function CaptadorPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#07070E", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#1a0080,#2222CC)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 }}>🤝</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#6C8FD4", letterSpacing: 1, marginBottom: 6 }}>INDIQUE PLACA</div>
          <div style={{ fontSize: 14, color: "#9CA3AF" }}>Torne-se um captador e ganhe por indicacoes</div>
        </div>
        <div style={{ background: "#0D0D18", border: "1px solid #1A1A2E", borderRadius: 20, padding: "32px 28px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4, marginTop: 0 }}>Cadastro de Captador</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>Preencha seus dados para participar da rede</p>
          <Suspense>
            <FormCaptador />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
