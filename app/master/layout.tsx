"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LayoutDashboard, Building2, Users, UserCheck, ClipboardList, Trophy, Link2, Settings, DollarSign, BarChart2, ShieldCheck } from "lucide-react";

const navItems = [
  { group: "Visão Geral", items: [
    { href: "/master/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "White-Label", items: [
    { href: "/master/associacoes", label: "Associações", icon: Building2 },
  ]},
  { group: "Base Nacional", items: [
    { href: "/master/gestores", label: "Gestores", icon: ShieldCheck },
    { href: "/master/consultores", label: "Consultores", icon: Users },
    { href: "/master/indicadores", label: "Indicadores", icon: UserCheck },
    { href: "/master/leads", label: "Leads", icon: ClipboardList },
    { href: "/master/ranking", label: "Ranking", icon: Trophy },
    { href: "/master/relatorio", label: "Relatorio", icon: BarChart2 },
  ]},
  { group: "Administração", items: [
    { href: "/master/financeiro", label: "Financeiro", icon: DollarSign },
    { href: "/master/links", label: "Links de Captura", icon: Link2 },
    { href: "/master/configuracoes", label: "Configurações", icon: Settings },
  ]},
];

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/master/login") return <>{children}</>;

  return (
    <AppShell
      navItems={navItems}
      badgeLabel="MASTER"
      badgeClass="border-blue-400/30 text-blue-400"
      activeClass="bg-blue-500/10 text-blue-500"
      avatarFallback="M"
      avatarGradient="bg-gradient-to-br from-green-900 to-blue-900"
      roleLabel="Admin"
      roleColor="text-emerald-500"
      storageKey="master-sidebar-collapsed"
      logoutEndpoint="/api/master/logout"
      loginRedirect="/master/login"
      accentColor="#3b82f6"
    >
      {children}
    </AppShell>
  );
}
