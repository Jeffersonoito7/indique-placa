"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
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

  const allItems = navItems.flatMap((g) => g.items);
  const currentPage = allItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );

  const sidebarW = collapsed ? 64 : 232;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarW,
          background: "linear-gradient(180deg, #0c1929 0%, #081320 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-all duration-200"
      >
        {/* Cabecalho sidebar */}
        <div
          className="flex items-center px-3 py-3.5"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            minHeight: 60,
          }}
        >
          {!collapsed && (
            <div className="flex flex-col gap-2 flex-1 min-w-0 py-1">
              <img
                src="/logo-indique-placa.png"
                alt="Indique Placa"
                style={{ width: "100%", maxWidth: 176, height: "auto", objectFit: "contain" }}
              />
              <span
                className={cn("inline-block text-[9px] font-bold px-2 py-0.5 rounded w-fit", badgeClass)}
                style={{ letterSpacing: "0.1em" }}
              >
                {badgeLabel}
              </span>
            </div>
          )}
          {collapsed && (
            <div className="flex-1 flex justify-center">
              <img
                src="/logo-indique-placa.png"
                alt="Indique Placa"
                style={{ width: 36, height: 36, objectFit: "contain" }}
              />
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Navegacao */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {navItems.map((group) => (
            <div key={group.group} className="mb-1">
              {!collapsed && (
                <div
                  className="text-[9px] font-bold uppercase px-3 pt-4 pb-1.5"
                  style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}
                >
                  {group.group}
                </div>
              )}
              {collapsed && <div className="h-4" />}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}>
                    <NavBtn
                      active={active}
                      collapsed={collapsed}
                      icon={<Icon className="h-4 w-4 flex-shrink-0" />}
                      label={item.label}
                    />
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Rodape */}
        <div
          className="p-3"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                avatarGradient
              )}
            >
              {avatarFallback}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-bold truncate"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {roleLabel}
                </div>
                <div className={cn("text-[10px] font-semibold", roleColor)}>ATIVO</div>
              </div>
            )}
          </div>

          <button
            onClick={sair}
            className={cn(
              "mt-2.5 w-full flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              collapsed ? "justify-center" : "gap-2"
            )}
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f87171";
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.35)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>Sair da conta</span>}
          </button>
        </div>
      </aside>

      {/* Conteudo */}
      <div
        className="flex-1 flex flex-col transition-all duration-200"
        style={{ marginLeft: sidebarW }}
      >
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-background/95 backdrop-blur flex items-center px-6 gap-4 flex-shrink-0 sticky top-0 z-40">
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            {currentPage && (
              <>
                <currentPage.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">{currentPage.label}</span>
              </>
            )}
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function NavBtn({
  active,
  collapsed,
  icon,
  label,
}: {
  active: boolean;
  collapsed: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);

  const bg = active
    ? "rgba(59,130,246,0.18)"
    : hovered
    ? "rgba(255,255,255,0.06)"
    : "transparent";

  const color = active
    ? "#93c5fd"
    : hovered
    ? "rgba(255,255,255,0.85)"
    : "rgba(255,255,255,0.42)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors duration-100 mb-0.5",
        collapsed ? "justify-center px-2" : "gap-3 px-3"
      )}
      style={{
        background: bg,
        color,
        borderLeft: active
          ? "2px solid #3b82f6"
          : "2px solid transparent",
        paddingLeft: active && !collapsed ? 10 : collapsed ? undefined : 12,
      }}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </div>
  );
}
