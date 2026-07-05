"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export type NavItem = { href: string; label: string; icon: React.ElementType };
export type NavGroup = { group: string; items: NavItem[] };

type AppShellProps = {
  children: React.ReactNode;
  navItems: NavGroup[];
  badgeLabel: string;
  badgeClass: string;
  activeClass: string;
  avatarFallback: string;
  avatarGradient: string;
  roleLabel: string;
  roleColor: string;
  storageKey: string;
  logoutEndpoint: string;
  loginRedirect: string;
};

export default function AppShell({
  children,
  navItems,
  badgeLabel,
  badgeClass,
  activeClass,
  avatarFallback,
  avatarGradient,
  roleLabel,
  roleColor,
  storageKey,
  logoutEndpoint,
  loginRedirect,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(storageKey) === "1") setCollapsed(true);
  }, [storageKey]);

  const toggleCollapse = () => {
    setCollapsed((v) => {
      localStorage.setItem(storageKey, !v ? "1" : "");
      return !v;
    });
  };

  const sair = async () => {
    await fetch(logoutEndpoint, { method: "POST" });
    window.location.href = loginRedirect;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground tracking-wide">INDIQUE PLACA</div>
              <Badge variant="outline" className={cn("mt-1 text-[9px] px-2 py-0", badgeClass)}>
                {badgeLabel}
              </Badge>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={toggleCollapse}
            className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0 ml-auto">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {navItems.map((group) => (
            <div key={group.group} className="mb-2">
              {!collapsed && (
                <div className="text-[9px] font-semibold uppercase tracking-[1.5px] text-muted-foreground/60 px-2 py-3">
                  {group.group}
                </div>
              )}
              {collapsed && <div className="h-3" />}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium mb-1 transition-colors",
                      collapsed ? "justify-center px-0" : "",
                      active ? activeClass : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Rodape */}
        <div className="border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className={cn("text-white text-xs font-bold", avatarGradient)}>
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{roleLabel}</div>
                <div className={cn("text-[10px] font-semibold", roleColor)}>ATIVO</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={sair}
              className="mt-2 text-[11px] text-muted-foreground hover:text-foreground underline bg-none border-none cursor-pointer font-sans w-full text-left flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Sair
            </button>
          )}
        </div>
      </aside>

      {/* Conteudo principal */}
      <div className={cn("flex-1 flex flex-col transition-all duration-200", collapsed ? "ml-[60px]" : "ml-[220px]")}>
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur flex items-center justify-end px-5 gap-3 flex-shrink-0 sticky top-0 z-40">
          <ThemeToggle />
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
