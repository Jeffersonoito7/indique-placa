"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSubscribeIndicador() {
  const [ativo, setAtivo] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("push_subscribed_indicador") === "true") {
      setAtivo(true);
    }
  }, []);

  async function ativar() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setCarregando(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key nao configurada");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });

      await fetch("/api/indicador/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      localStorage.setItem("push_subscribed_indicador", "true");
      setAtivo(true);
    } catch (err) {
      console.error("Erro ao ativar notificacoes:", err);
    } finally {
      setCarregando(false);
    }
  }

  if (ativo) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-500">
        <BellRing className="h-4 w-4" />
        <span className="text-xs font-medium">Notificacoes ativas</span>
      </div>
    );
  }

  return (
    <button
      onClick={ativar}
      disabled={carregando}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-sm font-medium text-emerald-600 dark:text-emerald-400 disabled:opacity-60"
    >
      <Bell className="h-4 w-4" />
      {carregando ? "Ativando..." : "Ativar alertas de comissao"}
    </button>
  );
}
