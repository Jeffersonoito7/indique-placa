"use client";
import { useEffect } from "react";

export function ManifestLink({ href }: { href: string }) {
  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.setAttribute("href", href);
    else {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = href;
      document.head.appendChild(link);
    }
  }, [href]);
  return null;
}
