"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

type HealthStatus = "ok" | "warning" | "critical";

export default function MasterHealthBanner() {
  const [status, setStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let mounted = true;

    async function verificar() {
      try {
        const res = await fetch("/api/master/health");
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setStatus(json.status as HealthStatus);
      } catch {
        // silencioso — banner nao deve quebrar o layout
      }
    }

    verificar();
    const interval = setInterval(verificar, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!status || status === "ok") return null;

  const isWarning = status === "warning";

  return (
    <div
      className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium ${
        isWarning
          ? "bg-amber-500/15 border-b border-amber-500/30 text-amber-300"
          : "bg-red-500/15 border-b border-red-500/30 text-red-300"
      }`}
    >
      {isWarning ? (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" />
      )}
      <span>
        {isWarning
          ? "Sistema com alertas — alguns indicadores estao proximos dos limites."
          : "Sistema em estado critico — verificacao imediata necessaria."}
      </span>
      <Link href="/master/health" className="underline underline-offset-2 ml-1 hover:opacity-80 transition-opacity">
        Ver Health Monitor
      </Link>
    </div>
  );
}
