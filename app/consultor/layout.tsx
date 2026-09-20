"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LayoutDashboard, ClipboardList, UserCheck, Trophy, User, DollarSign, Target, Percent, MessageCircle, Search, Zap, Megaphone, Link2, MessageCircleQuestion } from "lucide-react";
import { ManifestLink } from "@/components/manifest-link";

const navItems = [
  { group: "Painel", items: [
    { href: "/consultor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Negócio", items: [
    { href: "/consultor/leads", label: "Meus Leads", icon: ClipboardList },
    { href: "/consultor/indicadores", label: "Meus Indicadores", icon: UserCheck },
    { href: "/consultor/ranking", label: "Ranking", icon: Trophy },
    { href: "/consultor/financeiro", label: "Financeiro", icon: DollarSign },
    { href: "/consultor/comissoes", label: "Comissões", icon: Percent },
    { href: "/consultor/metas", label: "Metas", icon: Target },
    { href: "/consultor/whatsapp", label: "WhatsApp", icon: MessageCircle },
    { href: "/consultor/trafego", label: "Trafego Pago", icon: Megaphone },
  ]},
  { group: "Captação", items: [
    { href: "/consultor/links", label: "Links de Captação", icon: Link2 },
  ]},
  { group: "Conta", items: [
    { href: "/consultor/perfil", label: "Meu Perfil", icon: User },
    { href: "/consultor/upgrade", label: "Upgrade Pro", icon: Zap },
    { href: "/consultor/suporte", label: "Suporte", icon: MessageCircleQuestion },
  ]},
];

export default function ConsultorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/consultor/login" || pathname === "/consultor/cadastro" || pathname === "/consultor/recuperar-senha") return <>{children}</>;

  return (
    <>
    <ManifestLink href="/manifest.json" />
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
      accentColor="#3b82f6"
    >
      {children}
    </AppShell>
    </>
  );
}
