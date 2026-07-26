"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LayoutDashboard, Users, BarChart2, User, ClipboardList, Link2, TrendingUp, DollarSign, Bell, UserCheck, Megaphone, QrCode, MessageCircle, Search, Target } from "lucide-react";

const navItems = [
  { group: "Meu Painel", items: [
    { href: "/gestor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Minha Producao", items: [
    { href: "/gestor/meus-leads", label: "Meus Leads", icon: ClipboardList },
    { href: "/gestor/meus-indicadores", label: "Meus Indicadores", icon: UserCheck },
    { href: "/gestor/financeiro-proprio", label: "Financeiro", icon: DollarSign },
    { href: "/gestor/metas", label: "Metas", icon: Target },
  ]},
  { group: "Meu Time", items: [
    { href: "/gestor/consultores", label: "Consultores", icon: Users },
    { href: "/gestor/indicadores", label: "Indicadores do Time", icon: UserCheck },
    { href: "/gestor/leads", label: "Leads do Time", icon: ClipboardList },
    { href: "/gestor/relatorio", label: "Relatorio", icon: BarChart2 },
    { href: "/gestor/comissoes", label: "Comissoes", icon: DollarSign },
    { href: "/gestor/ranking", label: "Ranking", icon: TrendingUp },
  ]},
  { group: "Captacao", items: [
    { href: "/gestor/captura", label: "Link de Captura", icon: Link2 },
    { href: "/gestor/qrcode", label: "QR Code", icon: QrCode },
    { href: "/gestor/whatsapp", label: "WhatsApp", icon: MessageCircle },
    { href: "/gestor/parceiros", label: "Buscar Parceiros", icon: Search },
    { href: "/gestor/trafego", label: "Trafego Pago", icon: Megaphone },
  ]},
  { group: "Conta", items: [
    { href: "/gestor/perfil", label: "Meu Perfil", icon: User },
  ]},
];

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/gestor/login") return <>{children}</>;

  return (
    <AppShell
      navItems={navItems}
      badgeLabel="GESTOR"
      badgeClass="border-cyan-400/30 text-cyan-400"
      activeClass="bg-emerald-500/10 text-emerald-400"
      avatarFallback="G"
      avatarGradient="bg-gradient-to-br from-emerald-900 to-cyan-900"
      roleLabel="Lider de Equipe"
      roleColor="text-cyan-400"
      storageKey="gestor-sidebar-collapsed"
      logoutEndpoint="/api/gestor/logout"
      loginRedirect="/gestor/login"
      accentColor="#06b6d4"
    >
      {children}
    </AppShell>
  );
}
