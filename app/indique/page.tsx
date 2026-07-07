"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PlacaMercosul } from "@/components/placa-mercosul";

function formatarPlaca(valor: string): string {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (limpo.length > 3) return limpo.slice(0, 3) + "-" + limpo.slice(3);
  return limpo;
}

function placaValida(placa: string): boolean {
  const limpo = placa.replace("-", "");
  if (limpo.length !== 7) return false;
  return /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(limpo) || /^[A-Z]{3}[0-9]{4}$/.test(limpo);
}

function FormIndicacao() {
  const params = useSearchParams();
  const consultorId = params.get("c") ?? "";
  const [placa, setPlaca] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handlePlaca = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaca(formatarPlaca(e.target.value));
    setErro("");
  };

  const placaLimpa = placa.replace("-", "");
  const valida = placaValida(placa);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valida) { setErro("Digite uma placa válida (ex: ABC-1D23 ou ABC-1234)"); return; }
    if (!nome.trim()) { setErro("Informe o nome do dono do veículo"); return; }
    if (telefone.replace(/\D/g, "").length < 10) { setErro("Informe o WhatsApp do dono com DDD"); return; }
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/indicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: placaLimpa,
          nome_lead: nome.trim(),
          telefone_lead: telefone,
          consultor_id: consultorId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Erro ao enviar");
      else setSucesso(true);
    } catch { setErro("Erro de conexão."); }
    finally { setCarregando(false); }
  };

  if (sucesso) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ width: 64, height: 64, background: "rgba(16,185,129,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle2 style={{ color: "#10B981", width: 32, height: 32 }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Indicação enviada!</h2>
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Um consultor vai entrar em contato em breve.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {erro && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#f87171" }}>
          {erro}
        </div>
      )}

      {/* Preview placa */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <PlacaMercosul placa={placaLimpa} tamanho="md" />
        {valida && <span style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>Placa válida</span>}
      </div>

      {/* Campo placa */}
      <div>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Placa do veículo
        </label>
        <input
          type="text"
          value={placa}
          onChange={handlePlaca}
          placeholder="ABC-1234"
          maxLength={8}
          autoCapitalize="characters"
          autoComplete="off"
          style={{ width: "100%", padding: "14px", background: "#111318", border: "2px solid #1A1A2E", borderRadius: 10, fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: "'Arial Black', Arial, sans-serif", letterSpacing: "0.25em", textAlign: "center", textTransform: "uppercase", boxSizing: "border-box", outline: "none" }}
          onFocus={(e) => (e.target.style.borderColor = "#F59E0B")}
          onBlur={(e) => (e.target.style.borderColor = "#1A1A2E")}
        />
      </div>

      {/* Dados opcionais */}
      <div style={{ borderTop: "1px solid #1A1A2E", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
          Dados do dono do veículo
        </p>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
            style={{ width: "100%", padding: "12px 14px", background: "#111318", border: "1px solid #1A1A2E", borderRadius: 10, fontSize: 14, color: "#fff", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#F59E0B")}
            onBlur={(e) => (e.target.style.borderColor = "#1A1A2E")}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>WhatsApp</label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Ex: 11999999999"
            style={{ width: "100%", padding: "12px 14px", background: "#111318", border: "1px solid #1A1A2E", borderRadius: 10, fontSize: 14, color: "#fff", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#F59E0B")}
            onBlur={(e) => (e.target.style.borderColor = "#1A1A2E")}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={carregando || !valida}
        style={{ width: "100%", padding: 14, background: carregando || !valida ? "#374151" : "linear-gradient(135deg,#d97706,#b45309)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: carregando || !valida ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4 }}
      >
        {carregando ? "Enviando..." : "Indicar esta placa"}
      </button>
    </form>
  );
}

export default function IndiquePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#07070E", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#F59E0B", letterSpacing: 1, marginBottom: 6 }}>INDIQUE PLACA</div>
          <div style={{ fontSize: 14, color: "#9CA3AF" }}>Viu um carro sem proteção? Indique a placa.</div>
        </div>
        <div style={{ background: "#0D0D18", border: "1px solid #1A1A2E", borderRadius: 20, padding: "28px 24px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4, marginTop: 0 }}>Indicar veículo</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>Digite a placa do veículo que você quer indicar</p>
          <Suspense>
            <FormIndicacao />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
