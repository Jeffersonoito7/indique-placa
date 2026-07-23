"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/app-shell";
import { LayoutDashboard, Users, User, UserCheck, Briefcase, ClipboardList } from "lucide-react";

const navItems = [
  { group: "Painel", items: [
    { href: "/associacao/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Negocios", items: [
    { href: "/associacao/leads", label: "Leads", icon: ClipboardList },
  ]},
  { group: "Equipe", items: [
    { href: "/associacao/gestores", label: "Gestores", icon: Briefcase },
    { href: "/associacao/consultores", label: "Consultores", icon: Users },
    { href: "/associacao/indicadores", label: "Indicadores", icon: UserCheck },
  ]},
  { group: "Conta", items: [
    { href: "/associacao/perfil", label: "Perfil", icon: User },
  ]},
];

export default function AssociacaoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/associacao/login") return <>{children}</>;

  return (
    <AppShell
      navItems={navItems}
      badgeLabel="ASSOCIACAO"
      badgeClass="border-violet-400/30 text-violet-400"
      activeClass="bg-violet-500/10 text-violet-400"
      avatarFallback="A"
      avatarGradient="bg-gradient-to-br from-indigo-900 to-violet-900"
      roleLabel="Administrador"
      roleColor="text-violet-400"
      storageKey="assoc-sidebar-collapsed"
      logoutEndpoint="/api/associacao/logout"
      loginRedirect="/associacao/login"
      accentColor="#7c3aed"
    >
      {children}
    </AppShell>
  );
}
