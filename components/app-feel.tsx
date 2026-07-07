"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AppFeel() {
  const pathname = usePathname();

  useEffect(() => {
    // Vibracao leve ao trocar de pagina (sensacao de click nativo)
    if ("vibrate" in navigator) navigator.vibrate(8);
  }, [pathname]);

  useEffect(() => {
    // Vibracao em todos os botoes e links ao tocar
    const handler = (e: TouchEvent) => {
      const el = e.target as HTMLElement;
      const tappable = el.closest("button, a, [role='button']");
      if (tappable && !tappable.hasAttribute("disabled")) {
        if ("vibrate" in navigator) navigator.vibrate(6);
      }
    };
    document.addEventListener("touchstart", handler, { passive: true });
    return () => document.removeEventListener("touchstart", handler);
  }, []);

  return null;
}
