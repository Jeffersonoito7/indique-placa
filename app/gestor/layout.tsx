"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LayoutDashboard, Users, BarChart2, User, ClipboardList, Link2, TrendingUp, DollarSign, UserCheck, Megaphone, QrCode, MessageCircle, Search, Target, MessageCircleQuestion } from "lucide-react";
import { ManifestLink } from "@/components/manifest-link";

const baseNavItems = [
  { group: "Meu Painel", items: [
    { href: "/gestor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Minha Produção", items: [
    { href: "/gestor/meus-leads", label: "Meus Leads", icon: ClipboardList },
    { href: "/gestor/meus-indicadores", label: "Meus Indicadores", icon: UserCheck },
    { href: "/gestor/financeiro-proprio", label: "Financeiro", icon: DollarSign },
    { href: "/gestor/metas", label: "Metas", icon: Target },
  ]},
  { group: "Meu Time", items: [
    { href: "/gestor/consultores", label: "Consultores", icon: Users },
    { href: "/gestor/indicadores", label: "Indicadores do Time", icon: UserCheck },
    { href: "/gestor/leads", label: "Leads do Time", icon: ClipboardList },
    { href: "/gestor/relatorio", label: "Relatório", icon: BarChart2 },
    { href: "/gestor/comissoes", label: "Comissões", icon: DollarSign },
    { href: "/gestor/ranking", label: "Ranking", icon: TrendingUp },
  ]},
  { group: "Captação", items: [
    { href: "/gestor/captura", label: "Link de Captura", icon: Link2 },
    { href: "/gestor/qrcode", label: "QR Code", icon: QrCode },
    { href: "/gestor/whatsapp", label: "WhatsApp", icon: MessageCircle },
    { href: "/gestor/trafego", label: "Trafego Pago", icon: Megaphone },
  ]},
  { group: "Conta", items: [
    { href: "/gestor/perfil", label: "Meu Perfil", icon: User },
    { href: "/gestor/suporte", label: "Suporte", icon: MessageCircleQuestion },
  ]},
];

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [parceirosHabilitado, setParceirosHabilitado] = useState(false);

  useEffect(() => {
    fetch("/api/gestor/parceiros-flag")
      .then((r) => (r.ok ? r.json() : { habilitado: false }))
      .then((j) => setParceirosHabilitado(j.habilitado === true))
      .catch(() => {});
  }, []);

  if (pathname === "/gestor/login" || pathname === "/gestor/recuperar-senha" || pathname === "/gestor/cadastro") return <>{children}</>;

  const navItems = baseNavItems.map((group) => {
    if (group.group !== "Captação") return group;
    const captacaoItems = parceirosHabilitado
      ? [
          ...group.items,
          { href: "/gestor/parceiros", label: "Buscar Parceiros", icon: Search },
        ]
      : group.items;
    return { ...group, items: captacaoItems };
  });

  return (
    <>
    <ManifestLink href="/manifest-gestor.json" />
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
    </>
  );
}
