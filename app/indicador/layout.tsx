"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LayoutDashboard, PlusCircle, ClipboardList, Target, UserCircle, Wallet, MessageCircleQuestion, Link2 } from "lucide-react";
import { ManifestLink } from "@/components/manifest-link";

const navItems = [
  { group: "Painel", items: [
    { href: "/indicador/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Indicações", items: [
    { href: "/indicador/indicar", label: "Nova Indicação", icon: PlusCircle },
    { href: "/indicador/meu-link", label: "Meu Link / QR Code", icon: Link2 },
    { href: "/indicador/historico", label: "Histórico", icon: ClipboardList },
    { href: "/indicador/metas", label: "Minhas Metas", icon: Target },
    { href: "/indicador/comissoes", label: "Comissões", icon: Wallet },
  ]},
  { group: "Conta", items: [
    { href: "/indicador/perfil", label: "Meu Perfil / PIX", icon: UserCircle },
    { href: "/indicador/suporte", label: "Suporte", icon: MessageCircleQuestion },
  ]},
];

export default function IndicadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/indicador/login" || pathname === "/indicador/cadastro" || pathname === "/indicador/recuperar-senha") return <>{children}</>;

  return (
    <>
    <ManifestLink href="/manifest-indicador.json" />
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
      accentColor="#f59e0b"
    >
      {children}
    </AppShell>
    </>
  );
}
