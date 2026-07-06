"use client";

import { useState } from "react";
import { CheckCircle2, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FormIndicacao() {
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
      const res = await fetch("/api/publico/indicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome_lead: nome, telefone_lead: telefone, consultor_id: consultorId }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Erro ao enviar");
      else setSucesso(true);
    } catch { setErro("Erro de conexão."); }
    finally { setCarregando(false); }
  };

  if (sucesso) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Indicação enviada!</h2>
        <p className="text-sm text-gray-400">Em breve um consultor vai entrar em contato com você.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {erro && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">{erro}</div>}
      <div className="space-y-1.5">
        <Label htmlFor="nome" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome do indicado</Label>
        <input id="nome" type="text" placeholder="Ex: Joao da Silva" value={nome} onChange={(e) => setNome(e.target.value)} required
          style={{ width: "100%", padding: "12px 14px", background: "#111318", border: "1px solid #1A1A2E", borderRadius: 10, fontSize: 14, color: "#fff", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
          onFocus={(e) => (e.target.style.borderColor = "#10B981")} onBlur={(e) => (e.target.style.borderColor = "#1A1A2E")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tel" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Telefone (WhatsApp)</Label>
        <input id="tel" type="tel" placeholder="Ex: 11999999999" value={telefone} onChange={(e) => setTelefone(e.target.value)} required
          style={{ width: "100%", padding: "12px 14px", background: "#111318", border: "1px solid #1A1A2E", borderRadius: 10, fontSize: 14, color: "#fff", fontFamily: "inherit", boxSizing: "border-box", outline: "none" }}
          onFocus={(e) => (e.target.style.borderColor = "#10B981")} onBlur={(e) => (e.target.style.borderColor = "#1A1A2E")} />
      </div>
      <button type="submit" disabled={carregando} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg,#064e3b,#065f46)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: carregando ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: carregando ? 0.7 : 1, marginTop: 8 }}>
        {carregando ? "Enviando..." : "Enviar Indicação"}
      </button>
    </form>
  );
}

export default function IndiquePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#07070E", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24 }}>🚗</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#10B981", letterSpacing: 1, marginBottom: 6 }}>INDIQUE PLACA</div>
          <div style={{ fontSize: 14, color: "#9CA3AF" }}>Indique um amigo e ajude-o a proteger o veiculo</div>
        </div>

        <div style={{ background: "#0D0D18", border: "1px solid #1A1A2E", borderRadius: 20, padding: "32px 28px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4, marginTop: 0 }}>Fazer uma Indicação</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>Preencha os dados da pessoa que você quer indicar</p>
          <Suspense>
            <FormIndicacao />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
