"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { useState, useEffect, useLayoutEffect } from "react";
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
  accentColor?: string;
};

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// useLayoutEffect seguro para SSR
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  accentColor = "#3b82f6",
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // mobile-first: default true evita flash no SSR
  const [isMobile, setIsMobile] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Detecta tamanho real assim que o DOM estiver disponivel
  useIsomorphicLayoutEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile && localStorage.getItem(storageKey) === "1") setCollapsed(true);
  }, [storageKey, isMobile]);

  // Controle de animacao do drawer
  useEffect(() => {
    if (drawerOpen) {
      setDrawerMounted(true);
      // dispara animacao no proximo frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDrawerVisible(true));
      });
    } else {
      setDrawerVisible(false);
      const t = setTimeout(() => setDrawerMounted(false), 280);
      return () => clearTimeout(t);
    }
  }, [drawerOpen]);

  // Fecha drawer ao navegar
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

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

  // Bottom nav: 4 primeiros itens + botao Mais
  const bottomItems = allItems.slice(0, 4);

  // ---- LAYOUT MOBILE ----
  if (isMobile) {
    return (
      <div
        suppressHydrationWarning
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100dvh",
          background: "var(--background)",
          position: "relative",
        }}
      >
        {/* Topbar mobile */}
        <header
          suppressHydrationWarning
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 40,
            backgroundColor: "#070f1a",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
            paddingLeft: 16,
            paddingRight: 8,
          }}
        >
          {/* Logo */}
          <img
            src="/favicon-indique.png"
            alt="Indique Placa"
            style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6, flexShrink: 0 }}
          />

          {/* Nome da pagina centralizado */}
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {currentPage && (
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.92)",
                  letterSpacing: -0.2,
                }}
              >
                {currentPage.label}
              </span>
            )}
          </div>

          {/* Botao sair discreto */}
          <button
            onClick={sair}
            aria-label="Sair"
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <LogOut size={18} style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </header>

        {/* Conteudo */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 72,
          }}
        >
          {children}
        </div>

        {/* Bottom navigation - tab bar nativa */}
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            backgroundColor: "#070f1a",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            height: "calc(56px + env(safe-area-inset-bottom))",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: 4,
            paddingRight: 4,
          }}
        >
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  textDecoration: "none",
                  paddingTop: 6,
                  paddingBottom: 4,
                }}
              >
                {/* Pill ativa atras do icone */}
                <div
                  style={{
                    width: 40,
                    height: 28,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? hexToRgba(accentColor, 0.2) : "transparent",
                    border: active ? `1px solid ${hexToRgba(accentColor, 0.4)}` : "1px solid transparent",
                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <Icon
                    size={active ? 22 : 20}
                    style={{
                      color: active ? accentColor : "rgba(255,255,255,0.35)",
                      transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      flexShrink: 0,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: active ? 700 : 500,
                    color: active ? accentColor : "rgba(255,255,255,0.35)",
                    letterSpacing: 0.2,
                    lineHeight: 1,
                    transition: "color 0.15s ease",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Botao Mais */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Mais opções"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              paddingTop: 6,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                width: 40,
                height: 28,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: drawerOpen ? hexToRgba(accentColor, 0.2) : "transparent",
                border: drawerOpen ? `1px solid ${hexToRgba(accentColor, 0.4)}` : "1px solid transparent",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <LayoutGrid
                size={drawerOpen ? 22 : 20}
                style={{
                  color: drawerOpen ? accentColor : "rgba(255,255,255,0.35)",
                  transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: drawerOpen ? 700 : 500,
                color: drawerOpen ? accentColor : "rgba(255,255,255,0.35)",
                letterSpacing: 0.2,
                lineHeight: 1,
                transition: "color 0.15s ease",
              }}
            >
              Mais
            </span>
          </button>
        </nav>

        {/* Drawer bottom sheet - slide de baixo para cima */}
        {drawerMounted && (
          <>
            {/* Overlay */}
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                backgroundColor: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                opacity: drawerVisible ? 1 : 0,
                transition: "opacity 0.25s ease-out",
              }}
            />

            {/* Painel bottom sheet */}
            <div
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 51,
                maxHeight: "85dvh",
                backgroundColor: "#0a1628",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px 20px 0 0",
                display: "flex",
                flexDirection: "column",
                transform: drawerVisible ? "translateY(0)" : "translateY(100%)",
                transition: "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
                willChange: "transform",
              }}
            >
              {/* Handle bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: 12,
                  paddingBottom: 4,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.2)",
                  }}
                />
              </div>

              {/* Header drawer */}
              <div
                style={{
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingLeft: 20,
                  paddingRight: 12,
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                  Menu
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fechar menu"
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Itens do menu */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
                }}
              >
                {navItems.map((group) => (
                  <div key={group.group}>
                    <div
                      style={{
                        padding: "16px 20px 4px",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      {group.group}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "14px 20px",
                            textDecoration: "none",
                            background: active ? hexToRgba(accentColor, 0.1) : "transparent",
                            borderLeft: active
                              ? `3px solid ${accentColor}`
                              : "3px solid transparent",
                          }}
                        >
                          <Icon
                            size={20}
                            style={{
                              color: active ? accentColor : "rgba(255,255,255,0.45)",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: active ? 600 : 500,
                              color: active ? accentColor : "rgba(255,255,255,0.72)",
                            }}
                          >
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---- LAYOUT DESKTOP (sem alteracoes) ----
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
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", minHeight: 60 }}
        >
          {!collapsed && (
            <div className="flex flex-col gap-2 flex-1 min-w-0 py-1">
              <img
                src="/logo-sidebar.png"
                alt="Indique Placa"
                style={{ width: "100%", maxWidth: 140, height: 40, objectFit: "contain" }}
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
                src="/favicon-indique.png"
                alt="Indique Placa"
                style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 8 }}
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
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
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
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
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
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}
        >
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div
              className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0", avatarGradient)}
            >
              {avatarFallback}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {roleLabel}
                </div>
                <div className={cn("text-[10px] font-semibold", roleColor)}>ATIVO</div>
              </div>
            )}
          </div>

          <button
            onClick={sair}
            className={cn("mt-2.5 w-full flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors", collapsed ? "justify-center" : "gap-2")}
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            {!collapsed && <span>Sair da conta</span>}
          </button>
        </div>
      </aside>

      {/* Conteudo desktop */}
      <div
        className="flex-1 flex flex-col transition-all duration-200"
        style={{ marginLeft: sidebarW }}
      >
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

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors duration-100 mb-0.5",
        collapsed ? "justify-center px-2" : "gap-3 px-3"
      )}
      style={{
        background: active
          ? "rgba(59,130,246,0.18)"
          : hovered
          ? "rgba(255,255,255,0.06)"
          : "transparent",
        color: active
          ? "#93c5fd"
          : hovered
          ? "rgba(255,255,255,0.85)"
          : "rgba(255,255,255,0.42)",
        borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
      }}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  );
}
