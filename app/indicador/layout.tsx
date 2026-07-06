"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LayoutDashboard, PlusCircle, ClipboardList } from "lucide-react";

const navItems = [
  { group: "Painel", items: [
    { href: "/indicador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Indicações", items: [
    { href: "/indicador/indicar", label: "Nova Indicação", icon: PlusCircle },
    { href: "/indicador/historico", label: "Histórico", icon: ClipboardList },
  ]},
];

export default function IndicadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/indicador/login" || pathname === "/indicador/cadastro" || pathname === "/indicador/recuperar-senha") return <>{children}</>;

  return (
    <AppShell
      navItems={navItems}
      badgeLabel="INDICADOR"
      badgeClass="border-amber-400/30 text-amber-400"
      activeClass="bg-amber-500/10 text-amber-500"
      avatarFallback="I"
      avatarGradient="bg-gradient-to-br from-amber-900 to-orange-900"
      roleLabel="Indicador"
      roleColor="text-amber-500"
      storageKey="indicador-sidebar-collapsed"
      logoutEndpoint="/api/indicador/logout"
      loginRedirect="/indicador/login"
    >
      {children}
    </AppShell>
  );
}
