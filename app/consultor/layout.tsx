"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LayoutDashboard, ClipboardList, UserCheck, Trophy, User, DollarSign } from "lucide-react";

const navItems = [
  { group: "Painel", items: [
    { href: "/consultor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Negócio", items: [
    { href: "/consultor/leads", label: "Meus Leads", icon: ClipboardList },
    { href: "/consultor/indicadores", label: "Meus Indicadores", icon: UserCheck },
    { href: "/consultor/ranking", label: "Ranking", icon: Trophy },
    { href: "/consultor/financeiro", label: "Financeiro", icon: DollarSign },
  ]},
  { group: "Conta", items: [
    { href: "/consultor/perfil", label: "Meu Perfil", icon: User },
  ]},
];

export default function ConsultorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/consultor/login" || pathname === "/consultor/cadastro") return <>{children}</>;

  return (
    <AppShell
      navItems={navItems}
      badgeLabel="CONSULTOR"
      badgeClass="border-emerald-400/30 text-emerald-400"
      activeClass="bg-emerald-500/10 text-emerald-500"
      avatarFallback="C"
      avatarGradient="bg-gradient-to-br from-emerald-900 to-blue-900"
      roleLabel="Consultor"
      roleColor="text-emerald-500"
      storageKey="consultor-sidebar-collapsed"
      logoutEndpoint="/api/consultor/logout"
      loginRedirect="/consultor/login"
    >
      {children}
    </AppShell>
  );
}
