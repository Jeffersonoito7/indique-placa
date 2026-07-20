"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Wifi, WifiOff, Download } from "lucide-react";

type Config = {
  mensagem_prospecto: string;
  mensagem_indicacao: string;
  horarios: string[];
  limite_diario: number;
  intervalo_min: number;
  intervalo_max: number;
  modo_envio: string;
  ativo_prospecto: boolean;
};

const DEFAULT_CONFIG: Config = {
  mensagem_prospecto:
    "Olá {nome_lead}, sou {nome_consultor} e soube que você tem um veículo. Gostaria de te apresentar nossa proteção veicular. Posso te ligar?",
  mensagem_indicacao:
    "Olá! Sou consultor de proteção veicular. Você conhece alguém com carro, moto ou caminhão que gostaria de proteger? Indique e ganhe dinheiro!",
  horarios: ["manha", "tarde"],
  limite_diario: 30,
  intervalo_min: 30,
  intervalo_max: 90,
  modo_envio: "manual",
  ativo_prospecto: false,
};

export default function WhatsAppPage() {
  const [aba, setAba] = useState<"conexao" | "disparadores">("conexao");
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [conectado, setConectado] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [loadingDesconectar, setLoadingDesconectar] = useState(false);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [numerosRaw, setNumerosRaw] = useState("");
  const [mensagemCampanha, setMensagemCampanha] = useState("");
  const [rodandoCampanha, setRodandoCampanha] = useState(false);
  const [links, setLinks] = useState<{ numero: string; link: string }[]>([]);
  const [enviados, setEnviados] = useState<number | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/consultor/whatsapp/config")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setConfig({ ...DEFAULT_CONFIG, ...d });
        setMensagemCampanha(d.mensagem_indicacao ?? DEFAULT_CONFIG.mensagem_indicacao);
      })
      .finally(() => setLoadingConfig(false));

    verificarStatus();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function verificarStatus() {
    fetch("/api/consultor/whatsapp/status")
      .then((r) => r.json())
      .then((d) => setConectado(!!d.conectado))
      .catch(() => setConectado(false));
  }

  function iniciarPoll() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetch("/api/consultor/whatsapp/status")
        .then((r) => r.json())
        .then((d) => {
          if (d.conectado) {
            setConectado(true);
            setQrcode(null);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        })
        .catch(() => {});
    }, 5000);
  }

  async function conectar() {
    setLoadingQr(true);
    setQrcode(null);
    try {
      const res = await fetch("/api/consultor/whatsapp/qrcode", { method: "POST" });
      const data = await res.json();
      if (data.qrcode) {
        setQrcode(data.qrcode);
        iniciarPoll();
      }
    } finally {
      setLoadingQr(false);
    }
  }

  async function desconectar() {
    setLoadingDesconectar(true);
    try {
      await fetch("/api/consultor/whatsapp/disconnect", { method: "POST" });
      setConectado(false);
      setQrcode(null);
      if (pollRef.current) clearInterval(pollRef.current);
    } finally {
      setLoadingDesconectar(false);
    }
  }

  async function salvarConfig() {
    setSalvando(true);
    try {
      const res = await fetch("/api/consultor/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const d = await res.json();
      if (!d.error) setConfig({ ...DEFAULT_CONFIG, ...d });
    } finally {
      setSalvando(false);
    }
  }

  async function iniciarCampanha() {
    const numeros = numerosRaw
      .split("\n")
      .map((n) => n.trim().replace(/\D/g, ""))
      .filter((n) => n.length >= 10);

    if (numeros.length === 0) return;

    setRodandoCampanha(true);
    setLinks([]);
    setEnviados(null);

    try {
      const res = await fetch("/api/consultor/whatsapp/campanha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeros,
          mensagem: mensagemCampanha,
          modo: config.modo_envio,
        }),
      });
      const data = await res.json();
      setLinks(data.links ?? []);
      setEnviados(data.enviados ?? 0);
    } finally {
      setRodandoCampanha(false);
    }
  }

  function toggleHorario(h: string) {
    setConfig((prev) => ({
      ...prev,
      horarios: prev.horarios.includes(h)
        ? prev.horarios.filter((x) => x !== h)
        : [...prev.horarios, h],
    }));
  }

  function baixarCSV(endpoint: string, nome: string) {
    const a = document.createElement("a");
    a.href = endpoint;
    a.download = nome;
    a.click();
  }

  const btnBase =
    "px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const btnEmerald = `${btnBase} bg-emerald-500 hover:bg-emerald-600 text-white`;
  const btnMuted = `${btnBase} bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)]`;
  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50";

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-[var(--border)]">
        <h1 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-500" />
          WhatsApp
        </h1>
        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
          Conexao, disparadores e exportacao de dados
        </p>
      </div>

      <div className="flex gap-1 px-8 pt-5">
        {(["conexao", "disparadores"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAba(tab)}
            className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
              aba === tab
                ? "bg-[var(--background)] border border-b-0 border-[var(--border)] text-emerald-500"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab === "conexao" ? "Conexao" : "Disparadores"}
          </button>
        ))}
      </div>

      <div className="flex-1 p-8 bg-[var(--muted)]/30 space-y-5">
        {aba === "conexao" && (
          <>
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Evolution API (Automatico)</span>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      conectado
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {conectado ? (
                      <Wifi className="h-3.5 w-3.5" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5" />
                    )}
                    {conectado ? "Conectado" : "Desconectado"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Conecte seu WhatsApp via QR Code para enviar mensagens automaticamente pela
                  Evolution API.
                </p>

                {!conectado && (
                  <button onClick={conectar} disabled={loadingQr} className={btnEmerald}>
                    {loadingQr ? "Gerando QR Code..." : "Conectar WhatsApp"}
                  </button>
                )}

                {conectado && (
                  <button
                    onClick={desconectar}
                    disabled={loadingDesconectar}
                    className={`${btnBase} bg-red-500/10 text-red-500 hover:bg-red-500/20`}
                  >
                    {loadingDesconectar ? "Desconectando..." : "Desconectar"}
                  </button>
                )}

                {qrcode && !conectado && (
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Abra o WhatsApp no celular, va em Dispositivos Conectados e escaneie o QR
                      abaixo:
                    </p>
                    <img
                      src={`data:image/png;base64,${qrcode}`}
                      alt="QR Code WhatsApp"
                      className="w-48 h-48 border border-[var(--border)] rounded-xl"
                    />
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      Aguardando leitura...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <CardTitle className="text-sm font-semibold">WhatsApp Web (Manual)</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs text-[var(--muted-foreground)]">
                  No modo manual, as mensagens sao geradas como links wa.me. Voce clica em cada
                  link e envia pelo WhatsApp Web ou celular, sem precisar conectar aqui. Basta
                  selecionar "WhatsApp Web (manual)" como modo de envio na aba Disparadores.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {aba === "disparadores" && (
          <>
            {loadingConfig ? (
              <p className="text-sm text-[var(--muted-foreground)]">Carregando configuracoes...</p>
            ) : (
              <>
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b border-[var(--border)]">
                    <CardTitle className="text-sm font-semibold">
                      Mensagem automatica para prospecto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          Ativar envio automatico
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Envia mensagem ao novo lead assim que ele chegar
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setConfig((p) => ({ ...p, ativo_prospecto: !p.ativo_prospecto }))
                        }
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          config.ativo_prospecto ? "bg-emerald-500" : "bg-[var(--border)]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                            config.ativo_prospecto ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                        Mensagem
                      </label>
                      <p className="text-[11px] text-[var(--muted-foreground)] mb-1.5">
                        Variaveis: {"{nome_consultor}"}, {"{nome_lead}"}, {"{placa}"}
                      </p>
                      <textarea
                        rows={4}
                        value={config.mensagem_prospecto}
                        onChange={(e) =>
                          setConfig((p) => ({ ...p, mensagem_prospecto: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] block mb-2">
                        Modo de envio
                      </label>
                      <div className="flex gap-4">
                        {[
                          { value: "evolution", label: "Evolution (automatico)" },
                          { value: "manual", label: "WhatsApp Web (manual)" },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="modo_envio"
                              value={opt.value}
                              checked={config.modo_envio === opt.value}
                              onChange={() =>
                                setConfig((p) => ({ ...p, modo_envio: opt.value }))
                              }
                              className="accent-emerald-500"
                            />
                            <span className="text-sm text-[var(--foreground)]">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button onClick={salvarConfig} disabled={salvando} className={btnEmerald}>
                      {salvando ? "Salvando..." : "Salvar"}
                    </button>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b border-[var(--border)]">
                    <CardTitle className="text-sm font-semibold">Campanha de indicacao</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                        Numeros (um por linha)
                      </label>
                      <textarea
                        rows={5}
                        placeholder="5511999999999"
                        value={numerosRaw}
                        onChange={(e) => setNumerosRaw(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                        Mensagem da campanha
                      </label>
                      <textarea
                        rows={4}
                        value={mensagemCampanha}
                        onChange={(e) => setMensagemCampanha(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] block mb-2">
                        Horarios preferidos
                      </label>
                      <div className="flex gap-4">
                        {[
                          { value: "manha", label: "Manha (9h-11h)" },
                          { value: "tarde", label: "Tarde (14h-16h)" },
                          { value: "noite", label: "Noite (18h-20h)" },
                        ].map((h) => (
                          <label key={h.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.horarios.includes(h.value)}
                              onChange={() => toggleHorario(h.value)}
                              className="accent-emerald-500"
                            />
                            <span className="text-sm text-[var(--foreground)]">{h.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                          Intervalo minimo (seg): {config.intervalo_min}s
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={config.intervalo_max}
                          value={config.intervalo_min}
                          onChange={(e) =>
                            setConfig((p) => ({ ...p, intervalo_min: Number(e.target.value) }))
                          }
                          className="w-full accent-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                          Intervalo maximo (seg): {config.intervalo_max}s
                        </label>
                        <input
                          type="range"
                          min={config.intervalo_min}
                          max={300}
                          value={config.intervalo_max}
                          onChange={(e) =>
                            setConfig((p) => ({ ...p, intervalo_max: Number(e.target.value) }))
                          }
                          className="w-full accent-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                        Limite diario de envios
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={config.limite_diario}
                        onChange={(e) =>
                          setConfig((p) => ({ ...p, limite_diario: Number(e.target.value) }))
                        }
                        className={`${inputClass} max-w-[120px]`}
                      />
                    </div>

                    <button
                      onClick={iniciarCampanha}
                      disabled={rodandoCampanha}
                      className={btnEmerald}
                    >
                      {rodandoCampanha ? "Executando campanha..." : "Iniciar campanha"}
                    </button>

                    {enviados !== null && config.modo_envio === "evolution" && (
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-500">
                          Campanha concluida: {enviados} mensagem(ns) enviada(s)
                        </p>
                      </div>
                    )}

                    {links.length > 0 && config.modo_envio === "manual" && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-[var(--foreground)]">
                          Clique em cada link para abrir o WhatsApp:
                        </p>
                        <div className="max-h-60 overflow-y-auto space-y-1.5">
                          {links.map((l) => (
                            <a
                              key={l.numero}
                              href={l.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-emerald-500 hover:underline"
                            >
                              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                              {l.numero}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b border-[var(--border)]">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Download className="h-4 w-4 text-[var(--muted-foreground)]" />
                      Exportar dados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex gap-3">
                    <button
                      onClick={() => baixarCSV("/api/consultor/exportar/leads", "leads.csv")}
                      className={btnMuted}
                    >
                      Exportar Leads (CSV)
                    </button>
                    <button
                      onClick={() =>
                        baixarCSV("/api/consultor/exportar/indicadores", "indicadores.csv")
                      }
                      className={btnMuted}
                    >
                      Exportar Indicadores (CSV)
                    </button>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
