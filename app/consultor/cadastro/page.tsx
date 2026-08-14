"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS_CIDADES, ESTADOS_NOMES } from "@/lib/cidades-brasil";
import { PlacaMercosul } from "@/components/placa-mercosul";

/* ─── ESTILOS ─────────────────────────────────────────────────────────────
   Sistema de tokens local (custom properties) no topo do escopo .lp-cad.
   Nada de cor "no olho" ou número mágico repetido: toda cor, espaçamento,
   raio e tipografia vem da escala abaixo. Todo texto tem cor explícita via
   token com contraste AA garantido sobre o fundo navy.
   Tipografia herdada do global: títulos em var(--font-heading), corpo em
   var(--font-sans), com fallback grotesco robusto.
──────────────────────────────────────────────────────────────────────────*/
const STYLES = `
  .lp-cad *, .lp-cad *::before, .lp-cad *::after { box-sizing: border-box; }

  @keyframes lpFadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
  @keyframes lpFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes lpPulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
  @keyframes lpScan { 0% { transform: translateY(-100%); opacity: .5; } 100% { transform: translateY(1400%); opacity: 0; } }
  @keyframes lpCheck { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes lpBar { from { height: 0; opacity: 0; } to { opacity: 1; } }
  @keyframes lpLine { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
  @keyframes lpMoney { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-150px) scale(.6); opacity: 0; } }
  @keyframes lpTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes lpRing { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(1.9); opacity: 0; } }
  @keyframes lpCount { from { transform: translateY(6px); opacity: 0; } to { transform: none; opacity: 1; } }

  .lp-cad {
    /* superfícies (navy) */
    --bg-0:#060d18; --bg-1:#0d1525; --bg-2:#111d31; --bg-3:#16233a;
    /* marca */
    --brand:#00c389; --brand-2:#00a876; --brand-ink:#04241a;
    --brand-08:rgba(0,195,137,.08); --brand-12:rgba(0,195,137,.12);
    --brand-20:rgba(0,195,137,.22); --brand-40:rgba(0,195,137,.42);
    --amber:#f5b72e; --amber-bg:rgba(245,183,46,.09); --amber-line:rgba(245,183,46,.24);
    --plate-blue:#003399; --blue-2:#5b8cff;
    /* tinta / texto (todos AA sobre navy) */
    --ink:#eef3f8; --ink-2:#b6c4d4; --ink-3:#8a9bb0;
    --line:rgba(255,255,255,.08); --line-2:rgba(255,255,255,.15);
    --danger:#f87171; --danger-bg:rgba(248,113,113,.1); --danger-line:rgba(248,113,113,.25);
    /* espaçamento */
    --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px;
    --sp-6:32px; --sp-7:48px; --sp-8:64px; --sp-9:96px; --sp-10:128px;
    /* raios (uso intencional, não tudo igual) */
    --r-1:8px; --r-2:12px; --r-3:16px; --r-4:20px; --r-5:28px; --r-pill:999px;
    /* sombra / tipografia */
    --shadow:0 24px 60px -22px rgba(0,0,0,.75);
    --font-h:var(--font-heading,"Bricolage Grotesque","Hanken Grotesk",system-ui,sans-serif);
    --font-b:var(--font-sans,"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif);

    font-family: var(--font-b);
    background: var(--bg-1);
    color: var(--ink);
    min-height: 100vh;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .lp-cad h1, .lp-cad h2, .lp-cad h3 { font-family: var(--font-h); margin: 0; }
  .lp-cad p { margin: 0; }

  /* pontos comuns */
  .lp-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--brand); }

  /* ── NAV (coerente com tema escuro) ── */
  .lp-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--sp-3) clamp(var(--sp-4), 4vw, var(--sp-7));
    background: rgba(13,21,37,.82);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--line);
  }
  .nav-logo { height: 30px; object-fit: contain; }
  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-2);
    background: var(--brand); color: var(--brand-ink);
    font-family: var(--font-b); font-weight: 800; border: none; cursor: pointer;
    transition: background .15s ease, transform .12s ease, box-shadow .15s ease;
  }
  .btn-primary:hover:not(:disabled) { background: var(--brand-2); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: .55; cursor: not-allowed; }
  .nav-cta { padding: 9px 18px; border-radius: var(--r-2); font-size: 13px; }

  /* ── HERO ── */
  .lp-hero {
    position: relative; overflow: hidden;
    padding: var(--sp-8) var(--sp-5) var(--sp-9);
    text-align: center;
    background:
      linear-gradient(180deg, var(--bg-0) 0%, var(--bg-1) 40%, var(--bg-1) 100%);
  }
  /* trilhos técnicos discretos, sem bloom colorido atrás dos elementos */
  .hero-rails {
    position: absolute; inset: 0; pointer-events: none; opacity: .5;
    background-image:
      linear-gradient(var(--line) 1px, transparent 1px),
      linear-gradient(90deg, var(--line) 1px, transparent 1px);
    background-size: 68px 68px;
    -webkit-mask-image: radial-gradient(ellipse 70% 55% at 50% 30%, #000 30%, transparent 78%);
            mask-image: radial-gradient(ellipse 70% 55% at 50% 30%, #000 30%, transparent 78%);
  }
  .hero-in { position: relative; z-index: 2; max-width: 960px; margin: 0 auto; }

  .hero-plate { display: inline-block; margin-bottom: var(--sp-5); animation: lpFadeUp .6s ease both; }

  .chip {
    display: inline-flex; align-items: center; gap: var(--sp-2);
    padding: 6px 14px; border-radius: var(--r-pill);
    background: var(--brand-12); border: 1px solid var(--brand-20);
    font-size: 11px; font-weight: 800; letter-spacing: 1.4px;
    color: var(--brand); text-transform: uppercase;
  }
  .chip .lp-dot { animation: lpPulse 1.6s ease-in-out infinite; }

  .hero-headline {
    font-size: clamp(36px, 6vw, 68px); font-weight: 800;
    line-height: 1.04; letter-spacing: -.02em;
    color: var(--ink);
    margin: var(--sp-5) 0 var(--sp-4);
    animation: lpFadeUp .7s ease both .08s;
  }
  .accent { color: var(--brand); }
  .hero-sub {
    font-size: clamp(15px, 1.6vw, 18px); color: var(--ink-2);
    line-height: 1.65; max-width: 560px; margin: 0 auto var(--sp-7);
    animation: lpFadeUp .7s ease both .14s;
  }

  /* ── PAINEL DEMO ── */
  .demo-panel { position: relative; max-width: 920px; margin: 0 auto var(--sp-7); animation: lpFadeUp .8s ease both .2s; }
  .demo-card {
    background: linear-gradient(180deg, var(--bg-2), var(--bg-1));
    border: 1px solid var(--line-2); border-radius: var(--r-5); overflow: hidden;
    box-shadow: var(--shadow);
  }
  .demo-titlebar {
    display: flex; align-items: center; gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-5);
    background: rgba(255,255,255,.02); border-bottom: 1px solid var(--line);
  }
  .tb-dot { width: 10px; height: 10px; border-radius: 50%; }
  .tb-url { margin-left: var(--sp-3); font-size: 12px; color: var(--ink-3); font-family: ui-monospace, monospace; }
  .tb-live { margin-left: auto; font-size: 11px; color: var(--brand); font-weight: 800; display: flex; align-items: center; gap: var(--sp-2); letter-spacing: .5px; }
  .tb-live .lp-dot { animation: lpPulse 1.5s ease-in-out infinite; }

  .demo-body { display: grid; grid-template-columns: 1fr 1fr 1fr; }
  .demo-col { padding: var(--sp-6) var(--sp-5); border-right: 1px solid var(--line); text-align: left; }
  .demo-col:last-child { border-right: none; }
  .col-label { font-size: 10px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; color: var(--ink-3); margin-bottom: var(--sp-4); }

  .big-counter { font-family: var(--font-h); font-size: 54px; font-weight: 800; letter-spacing: -.03em; color: var(--brand); line-height: 1; margin-bottom: var(--sp-1); animation: lpCount .3s ease; }
  .counter-label { font-size: 12px; color: var(--ink-2); }

  .bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; margin-top: var(--sp-5); }
  .bar { flex: 1; border-radius: var(--r-1) var(--r-1) 0 0; background: linear-gradient(180deg, var(--brand), var(--brand-20)); animation: lpBar .8s ease both; transform-origin: bottom; }

  .line-chart { width: 100%; height: 80px; }
  .line-path { fill: none; stroke: var(--brand); stroke-width: 2.5; stroke-dasharray: 400; stroke-dashoffset: 400; animation: lpLine 2s ease both .5s; }
  .line-fill { fill: url(#lineGrad); opacity: .3; }
  .line-dot { fill: var(--brand); animation: lpFadeIn .3s ease both 2.2s; }
  .axis-row { display: flex; justify-content: space-between; margin-top: var(--sp-2); }
  .axis-tick { font-size: 10px; color: var(--ink-3); }

  .mini-stats { margin-top: var(--sp-5); display: flex; gap: var(--sp-3); }
  .mini-stat { flex: 1; padding: 10px 14px; border-radius: var(--r-2); border: 1px solid var(--line); }
  .mini-stat.brand { background: var(--brand-08); border-color: var(--brand-20); }
  .mini-stat.blue { background: rgba(91,140,255,.08); border-color: rgba(91,140,255,.2); }
  .mini-stat-label { font-size: 10px; color: var(--ink-3); margin-bottom: 2px; }
  .mini-stat-val { font-family: var(--font-h); font-size: 22px; font-weight: 800; letter-spacing: -.02em; }
  .mini-stat.brand .mini-stat-val { color: var(--brand); }
  .mini-stat.blue .mini-stat-val { color: var(--blue-2); }

  .live-leads { display: flex; flex-direction: column; gap: var(--sp-2); }
  .lead-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: var(--r-2); background: var(--brand-08); border: 1px solid var(--brand-12); animation: lpFadeUp .4s ease both; }
  .lead-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--brand-2), var(--brand)); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--brand-ink); flex-shrink: 0; }
  .lead-info { flex: 1; min-width: 0; }
  .lead-name { font-size: 12px; font-weight: 700; color: var(--ink); }
  .lead-via { font-size: 10px; color: var(--ink-3); }
  .lead-new { font-size: 9px; font-weight: 800; letter-spacing: 1px; color: var(--brand); background: var(--brand-12); padding: 2px 7px; border-radius: var(--r-pill); animation: lpPulse 2s ease-in-out infinite; }

  .money-float { position: absolute; pointer-events: none; font-size: 11px; font-weight: 800; color: var(--brand); background: var(--brand-12); border: 1px solid var(--brand-20); padding: 2px 8px; border-radius: var(--r-pill); animation: lpMoney 1.8s ease-out forwards; }

  .demo-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--sp-3); padding: var(--sp-4) var(--sp-5); border-top: 1px solid var(--line); background: rgba(255,255,255,.015); }
  .db-item { display: flex; align-items: center; gap: var(--sp-2); font-size: 13px; }
  .db-val { font-weight: 800; color: var(--brand); }
  .db-label { color: var(--ink-3); font-size: 11px; }
  .db-muted { font-size: 11px; color: var(--ink-3); }
  .ring-wrap { position: relative; display: inline-flex; }
  .ring-wrap .lp-dot { width: 8px; height: 8px; animation: lpPulse 1.8s ease-in-out infinite; }
  .ring { position: absolute; inset: -6px; border-radius: 50%; border: 2px solid var(--brand-40); animation: lpRing 2s ease-out infinite; }

  /* CTA hero */
  .hero-cta-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--sp-3); animation: lpFadeUp .7s ease both .3s; }
  .hero-cta { padding: 16px 38px; border-radius: var(--r-3); font-size: 17px; box-shadow: 0 14px 34px -12px var(--brand-40); }
  .hero-cta-note { font-size: 12px; color: var(--ink-3); }

  /* ── TICKER ── */
  .lp-ticker { overflow: hidden; white-space: nowrap; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--bg-0); padding: var(--sp-3) 0; }
  .ticker-inner { display: inline-flex; gap: var(--sp-8); animation: lpTicker 24s linear infinite; }
  .ticker-item { font-size: 13px; font-weight: 700; color: var(--ink-2); display: flex; align-items: center; gap: var(--sp-2); }
  .ticker-item .lp-dot { flex-shrink: 0; }

  /* ── NUMEROS ── */
  .lp-nums { display: grid; grid-template-columns: repeat(4, 1fr); background: var(--bg-0); border-bottom: 1px solid var(--line); }
  .num-item { padding: var(--sp-7) var(--sp-5); text-align: center; border-right: 1px solid var(--line); }
  .num-item:last-child { border-right: none; }
  .num-val { font-family: var(--font-h); font-size: clamp(34px, 4.5vw, 46px); font-weight: 800; color: var(--brand); letter-spacing: -.03em; }
  .num-label { font-size: 12px; color: var(--ink-2); margin-top: var(--sp-2); line-height: 1.5; }

  /* ── SEÇÕES ── */
  .lp-section { padding: var(--sp-9) var(--sp-5); }
  .section-inner { max-width: 1080px; margin: 0 auto; }
  .section-badge { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: var(--brand); padding: 5px 12px; border: 1px solid var(--brand-20); border-radius: var(--r-pill); margin-bottom: var(--sp-4); }
  .section-title { font-size: clamp(28px, 4vw, 46px); font-weight: 800; letter-spacing: -.02em; line-height: 1.1; color: var(--ink); margin-bottom: var(--sp-4); }
  .section-sub { font-size: 16px; color: var(--ink-2); line-height: 1.65; max-width: 540px; }

  /* mini placa como marcador de passo (motivo da marca, legível) */
  .plate-tag { display: inline-flex; flex-direction: column; width: 62px; border-radius: var(--r-1); overflow: hidden; border: 1px solid var(--line-2); background: #f5f5f0; box-shadow: 0 8px 20px -8px rgba(0,0,0,.6); }
  .plate-tag-top { background: var(--plate-blue); color: #fff; font-size: 8px; font-weight: 800; letter-spacing: 2px; text-align: center; padding: 2px 0; }
  .plate-tag-num { font-family: var(--font-h); color: #141414; font-weight: 800; font-size: 24px; text-align: center; letter-spacing: 2px; padding: 3px 0 5px; }

  /* passos: primeiro card em destaque, não 3 idênticos */
  .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-5); margin-top: var(--sp-7); }
  .step-card { position: relative; background: var(--bg-2); border: 1px solid var(--line); border-radius: var(--r-4); padding: var(--sp-6) var(--sp-5); transition: border-color .2s ease, transform .2s ease; }
  .step-card:hover { border-color: var(--brand-20); transform: translateY(-3px); }
  .step-card.feature { background: linear-gradient(180deg, var(--brand-08), var(--bg-2)); border-color: var(--brand-20); }
  .step-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-5); }
  .step-glyph { color: var(--brand); }
  .step-title { font-size: 18px; font-weight: 800; color: var(--ink); margin-bottom: var(--sp-3); }
  .step-desc { font-size: 14px; color: var(--ink-2); line-height: 1.6; }

  /* benefícios: mosaico com um card largo, não 6 iguais */
  .benefits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-4); margin-top: var(--sp-7); }
  .benefit-card { background: var(--bg-2); border: 1px solid var(--line); border-radius: var(--r-3); padding: var(--sp-5); transition: border-color .2s ease; }
  .benefit-card:hover { border-color: var(--brand-20); }
  .benefit-card.wide { grid-column: span 2; display: flex; gap: var(--sp-5); align-items: flex-start; background: linear-gradient(120deg, var(--brand-08), var(--bg-2)); border-color: var(--brand-20); }
  .benefit-glyph { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: var(--r-2); background: var(--brand-12); color: var(--brand); margin-bottom: var(--sp-3); flex-shrink: 0; }
  .benefit-card.wide .benefit-glyph { margin-bottom: 0; }
  .benefit-title { font-size: 15px; font-weight: 800; color: var(--ink); margin-bottom: var(--sp-2); }
  .benefit-desc { font-size: 13px; color: var(--ink-2); line-height: 1.6; }

  /* ── PROVA ── */
  .lp-proof { text-align: center; padding: var(--sp-9) var(--sp-5); background: var(--bg-0); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .proof-stars { font-size: 20px; color: var(--amber); letter-spacing: 4px; margin-bottom: var(--sp-5); }
  .proof-quote { font-family: var(--font-h); font-size: clamp(20px, 3vw, 30px); font-weight: 700; color: var(--ink); max-width: 720px; margin: 0 auto var(--sp-5); line-height: 1.4; }
  .proof-author { font-size: 13px; color: var(--ink-3); }

  /* ── URGENCIA ── */
  .lp-urgencia { background: var(--amber-bg); border-top: 1px solid var(--amber-line); border-bottom: 1px solid var(--amber-line); padding: var(--sp-7) var(--sp-5); text-align: center; }
  .urgencia-title { font-family: var(--font-h); font-size: 22px; font-weight: 800; color: var(--amber); margin-bottom: var(--sp-3); }
  .urgencia-desc { font-size: 15px; color: var(--ink-2); line-height: 1.6; max-width: 620px; margin: 0 auto; }

  /* ── FORM ── */
  .lp-form-section { position: relative; overflow: hidden; padding: var(--sp-9) var(--sp-5) var(--sp-10); background: linear-gradient(180deg, var(--bg-1), var(--bg-0)); }
  .form-rails { position: absolute; inset: 0; pointer-events: none; opacity: .5; background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 68px 68px; -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%); mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%); }
  .form-inner { position: relative; z-index: 2; max-width: 520px; margin: 0 auto; text-align: center; }
  .form-title { font-size: clamp(28px, 4vw, 42px); font-weight: 800; letter-spacing: -.02em; line-height: 1.1; color: var(--ink); margin-bottom: var(--sp-3); }
  .form-lead { font-size: 15px; color: var(--ink-2); line-height: 1.65; }
  .form-card { position: relative; overflow: hidden; background: var(--bg-2); border: 1px solid var(--line-2); border-radius: var(--r-5); padding: var(--sp-7) clamp(var(--sp-5), 5vw, var(--sp-7)); text-align: left; margin-top: var(--sp-6); box-shadow: var(--shadow); }
  .form-scan { position: absolute; left: 0; right: 0; top: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--brand-40), transparent); animation: lpScan 5s ease-in-out infinite; pointer-events: none; }
  .form-corner { position: absolute; width: 16px; height: 16px; border-color: var(--brand-40); border-style: solid; pointer-events: none; }
  .fc-tl { top: 12px; left: 12px; border-width: 2px 0 0 2px; border-radius: 3px 0 0 0; }
  .fc-tr { top: 12px; right: 12px; border-width: 2px 2px 0 0; border-radius: 0 3px 0 0; }
  .fc-bl { bottom: 12px; left: 12px; border-width: 0 0 2px 2px; border-radius: 0 0 0 3px; }
  .fc-br { bottom: 12px; right: 12px; border-width: 0 2px 2px 0; border-radius: 0 0 3px 0; }

  .campo-group { margin-bottom: var(--sp-4); }
  .campo-label { display: block; font-size: 11px; font-weight: 800; letter-spacing: .4px; color: var(--ink-2); text-transform: uppercase; margin-bottom: 7px; }
  .campo { width: 100%; padding: 13px 15px; background: rgba(255,255,255,.05); border: 1px solid var(--line-2); border-radius: var(--r-2); font-size: 15px; color: var(--ink); outline: none; font-family: var(--font-b); transition: border-color .2s ease, box-shadow .2s ease, background .2s ease; }
  .campo:focus { border-color: var(--brand-40); background: var(--brand-08); box-shadow: 0 0 0 3px var(--brand-12); }
  .campo::placeholder { color: var(--ink-3); }
  .campo:disabled { opacity: .55; cursor: not-allowed; }
  .campo-select { appearance: none; cursor: pointer; padding-right: 40px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a9bb0' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; }
  .campo-select option { background: var(--bg-3); color: var(--ink); }
  .senha-wrap { position: relative; }
  .senha-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--ink-3); display: flex; align-items: center; }
  .senha-toggle:hover { color: var(--ink-2); }

  .btn-cad { width: 100%; padding: 16px; border-radius: var(--r-3); font-size: 16px; gap: 10px; margin-top: var(--sp-2); box-shadow: 0 8px 26px -10px var(--brand-40); }

  .termos { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin: var(--sp-3) 0 6px; font-size: 12px; color: var(--ink-2); line-height: 1.6; }
  .termos input { margin-top: 2px; accent-color: var(--brand); width: 15px; height: 15px; flex-shrink: 0; cursor: pointer; }
  .termos a { color: var(--brand); text-decoration: underline; }
  .form-alt { margin-top: var(--sp-4); text-align: center; font-size: 12px; color: var(--ink-3); }
  .form-alt a { color: var(--brand); text-decoration: none; font-weight: 700; }

  .erro-box { background: var(--danger-bg); border: 1px solid var(--danger-line); border-radius: var(--r-2); padding: 11px 14px; font-size: 13px; color: var(--danger); margin-bottom: var(--sp-4); text-align: center; }

  /* sucesso */
  .sucesso-wrap { text-align: center; }
  .sucesso-icon { width: 84px; height: 84px; border-radius: 50%; background: var(--brand-12); border: 2px solid var(--brand-40); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--sp-5); animation: lpCheck .6s cubic-bezier(.34,1.56,.64,1) both; }
  .sucesso-title { font-family: var(--font-h); font-size: 24px; font-weight: 800; color: var(--ink); margin-bottom: var(--sp-2); }
  .sucesso-desc { font-size: 14px; color: var(--ink-2); margin-bottom: var(--sp-5); line-height: 1.6; }
  .cred-box { background: rgba(0,0,0,.28); border: 1px solid var(--line-2); border-radius: var(--r-2); padding: 14px 18px; text-align: left; }
  .cred-label { font-size: 10px; font-weight: 800; color: var(--ink-3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .cred-valor { font-size: 16px; font-weight: 700; color: var(--ink); font-family: ui-monospace, "Courier New", monospace; }

  .lp-footer { text-align: center; padding: var(--sp-6); font-size: 12px; color: var(--ink-3); border-top: 1px solid var(--line); background: var(--bg-0); }

  @media (max-width: 860px) {
    .benefit-card.wide { grid-column: span 3; }
  }
  @media (max-width: 768px) {
    .lp-nums { grid-template-columns: repeat(2, 1fr); }
    .steps-grid, .benefits-grid { grid-template-columns: 1fr; }
    .benefit-card.wide { grid-column: auto; }
    .demo-body { grid-template-columns: 1fr; }
    .demo-col:not(:first-child) { display: none; }
    .num-item:nth-child(2) { border-right: none; }
  }
`;

/* ─── GLYPHS BESPOKE (monoline, currentColor — sem lucide, sem emoji) ──── */
function Glyph({ name, size = 22 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "alvo": return <svg {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
    case "compartilhar": return <svg {...p}><circle cx="6" cy="12" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="17" cy="18" r="2.4" /><path d="M8.2 11 14.8 7.2M8.2 13l6.6 3.8" /></svg>;
    case "escala": return <svg {...p}><path d="M4 19h16" /><path d="M6 19v-5M11 19V9M16 19v-8M21 19V6" /><path d="M5 11l5-4 4 3 6-6" /></svg>;
    case "painel": return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /><path d="M7 14v3M11 12v5M15 15v2" /></svg>;
    case "time": return <svg {...p}><circle cx="9" cy="9" r="3" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M16 8.2a3 3 0 0 1 0 5.6M18.5 19c0-2-.9-3.6-2.3-4.6" /></svg>;
    case "link": return <svg {...p}><path d="M9 15l6-6" /><path d="M11 6.5 12.6 5a3.6 3.6 0 0 1 5.1 5.1L16 12" /><path d="M13 17.5 11.4 19a3.6 3.6 0 0 1-5.1-5.1L8 12" /></svg>;
    case "celular": return <svg {...p}><rect x="7" y="3" width="10" height="18" rx="2.4" /><path d="M11 18h2" /></svg>;
    case "raio": return <svg {...p}><path d="M13 2 5 13h5l-1 9 8-11h-5l1-9z" /></svg>;
    case "seta": return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case "check": return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
    default: return null;
  }
}

/* ─── DADOS MOCK DO PAINEL DEMO ──────────────────────────────────────── */
const BARS = [18, 34, 28, 52, 44, 68, 91];
const LEADS_MOCK = [
  { nome: "Carlos M.", via: "via Marcos Lima", ini: "C" },
  { nome: "Ana Paula", via: "via Juliana S.", ini: "A" },
  { nome: "Roberto F.", via: "direto",         ini: "R" },
];
const TICKER_ITEMS = [
  "+1 lead recebido em São Paulo",
  "+3 placas fechadas hoje",
  "+1 novo indicador ativo",
  "+R$ 150 em comissoes",
  "+2 leads recebidos em Recife",
  "+5 placas fechadas esta semana",
  "+1 lead recebido em BH",
  "+R$ 300 em comissoes",
];

type Associacao = { id: string; nome: string };
type Money = { id: number; left: string; top: string };

export default function ConsultorCadastroPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<NodeJS.Timeout | null>(null);

  /* form */
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [associacaoId, setAssociacaoId] = useState("");
  const [associacaoNome, setAssociacaoNome] = useState("");
  const [associacaoTexto, setAssociacaoTexto] = useState("");
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  /* demo */
  const [placasBase, setPlacasBase] = useState(0);
  const [placas, setPlacas] = useState(0);
  const [indicadores, setIndicadores] = useState(0);
  const [moneyCoins, setMoneyCoins] = useState<Money[]>([]);
  const [activeLead, setActiveLead] = useState(0);
  const coinId = useRef(0);

  useEffect(() => {
    fetch("/api/publico/associacoes")
      .then(r => r.json())
      .then(d => setAssociacoes(d.associacoes ?? []));
    // Busca contadores reais do banco
    fetch("/api/publico/stats")
      .then(r => r.json())
      .then(d => {
        const base = d.placas_mes ?? 0;
        setPlacasBase(base);
        setPlacas(base);
        setIndicadores(d.consultores_ativos ?? 0);
      })
      .catch(() => {
        // fallback silencioso se API falhar
        setPlacas(0);
        setIndicadores(0);
      });
  }, []);

  /* contador de placas sobe sozinho */
  useEffect(() => {
    counterRef.current = setInterval(() => {
      setPlacas(p => p + 1);
      if (Math.random() > .7) setIndicadores(i => i + 1);

      /* joga moeda */
      const id = ++coinId.current;
      const left = `${20 + Math.random() * 60}%`;
      const top  = `${30 + Math.random() * 40}%`;
      setMoneyCoins(c => [...c, { id, left, top }]);
      setTimeout(() => setMoneyCoins(c => c.filter(x => x.id !== id)), 2000);

      /* roda leads */
      setActiveLead(l => (l + 1) % LEADS_MOCK.length);
    }, 3000);
    return () => clearInterval(counterRef.current!);
  }, []);

  const fmtTelBR = (v: string): string => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n.length ? `(${n}` : "";
    if (n.length <= 6) return `(${n.slice(0,2)}) ${n.slice(2)}`;
    if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  };

  const irParaForm = useCallback(() =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const tel = telefone.replace(/\D/g,"");
    if (tel.length < 10) { setErro("Digite um WhatsApp valido com DDD"); return; }
    if (!estado) { setErro("Selecione o estado"); return; }
    if (!cidade) { setErro("Selecione a cidade"); return; }
    const nomeAssoc = associacaoId === "outra" ? associacaoTexto : associacaoNome;
    if (!nomeAssoc.trim()) { setErro("Informe a associação"); return; }
    if (senha.length < 6) { setErro("A senha precisa ter no mínimo 6 caracteres"); return; }
    if (senha !== confirmarSenha) { setErro("As senhas não coincidem"); return; }
    if (!aceitouTermos) { setErro("Voce precisa aceitar os Termos de Uso e a Politica de Privacidade (LGPD) para continuar."); return; }
    setCarregando(true);
    try {
      const payload: Record<string, unknown> = { nome, telefone, email, cidade: `${cidade} - ${estado}`, associacao: nomeAssoc, senha };
      if (associacaoId && associacaoId !== "outra") payload.associacao_id = associacaoId;
      const res = await fetch("/api/publico/consultor-cadastro", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Erro ao cadastrar");
      else { setSucesso(true); }
    } catch { setErro("Erro de conexão. Tente novamente."); }
    finally { setCarregando(false); }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-cad">

        {/* NAV */}
        <nav className="lp-nav">
          <img src="/logo-indique.png" alt="Indique Placa" className="nav-logo" />
          <button className="btn-primary nav-cta" onClick={irParaForm}>Quero me cadastrar</button>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="hero-rails" />

          <div className="hero-in">
            <div className="hero-plate">
              <PlacaMercosul placa="BRA2E19" tamanho="sm" />
            </div>

            <div className="chip">
              <span className="lp-dot" />
              Sistema de vendas em escala
            </div>

            <h1 className="hero-headline">
              Pare de vender sozinho.<br />
              <span className="accent">Monte seu time</span> e<br />
              exploda suas vendas.
            </h1>

            <p className="hero-sub">
              Pare de depender só de você mesmo. Com o Indique Placa você monta um time de indicadores que traz leads enquanto você fecha negócios e dorme.
            </p>

            {/* PAINEL DEMO ANIMADO */}
            <div className="demo-panel">
              <div className="demo-card">
                {/* titlebar */}
                <div className="demo-titlebar">
                  <div className="tb-dot" style={{ background: "#ff5f57" }} />
                  <div className="tb-dot" style={{ background: "#febc2e" }} />
                  <div className="tb-dot" style={{ background: "#28c840" }} />
                  <span className="tb-url">painel.indiqueplaca.com.br</span>
                  <span className="tb-live"><span className="lp-dot" />AO VIVO</span>
                </div>

                <div className="demo-body">
                  {/* COLUNA 1 — contador de placas */}
                  <div className="demo-col" style={{ position: "relative", overflow: "hidden" }}>
                    <div className="col-label">Placas vendidas este mes</div>
                    <div className="big-counter" key={placas}>{placas}</div>
                    <div className="counter-label">{placas > placasBase ? `+${placas - placasBase} agora mesmo` : "ao vivo"}</div>

                    {/* barras de crescimento */}
                    <div className="bar-chart">
                      {BARS.map((h, i) => (
                        <div
                          key={i}
                          className="bar"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * .12}s`,
                            opacity: i === BARS.length - 1 ? 1 : .5 + i * .07,
                          }}
                        />
                      ))}
                    </div>

                    {/* moedas flutuantes */}
                    {moneyCoins.map(c => (
                      <div
                        key={c.id}
                        className="money-float"
                        style={{ left: c.left, top: c.top }}
                      >
                        +R$
                      </div>
                    ))}
                  </div>

                  {/* COLUNA 2 — gráfico de linha */}
                  <div className="demo-col">
                    <div className="col-label">Crescimento de leads</div>
                    <svg className="line-chart" viewBox="0 0 200 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00c389" stopOpacity=".4"/>
                          <stop offset="100%" stopColor="#00c389" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path className="line-fill" d="M0 70 L30 62 L60 50 L90 38 L120 30 L160 18 L200 8 L200 80 L0 80 Z" />
                      <path className="line-path" d="M0 70 L30 62 L60 50 L90 38 L120 30 L160 18 L200 8" />
                      <circle className="line-dot" cx="200" cy="8" r="4" />
                    </svg>
                    <div className="axis-row">
                      <span className="axis-tick">Jan</span>
                      <span className="axis-tick">Abr</span>
                      <span className="axis-tick">Jul</span>
                    </div>

                    <div className="mini-stats">
                      <div className="mini-stat brand">
                        <div className="mini-stat-label">Indicadores ativos</div>
                        <div className="mini-stat-val">{indicadores}</div>
                      </div>
                      <div className="mini-stat blue">
                        <div className="mini-stat-label">Conversao</div>
                        <div className="mini-stat-val">68%</div>
                      </div>
                    </div>
                  </div>

                  {/* COLUNA 3 — leads ao vivo */}
                  <div className="demo-col">
                    <div className="col-label">Leads recebidos agora</div>
                    <div className="live-leads">
                      {LEADS_MOCK.map((l, i) => (
                        <div
                          key={i}
                          className="lead-item"
                          style={{
                            animationDelay: `${i * .15}s`,
                            opacity: i === activeLead ? 1 : .5,
                            transform: i === activeLead ? "scale(1.02)" : "scale(1)",
                            transition: "all .4s ease",
                            borderColor: i === activeLead ? "var(--brand-20)" : "var(--brand-12)",
                          }}
                        >
                          <div className="lead-avatar">{l.ini}</div>
                          <div className="lead-info">
                            <div className="lead-name">{l.nome}</div>
                            <div className="lead-via">{l.via}</div>
                          </div>
                          {i === activeLead && <div className="lead-new">NOVO</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* rodapé do painel */}
                <div className="demo-bottom">
                  <div className="db-item">
                    <div className="ring-wrap">
                      <div className="lp-dot" />
                      <div className="ring" />
                    </div>
                    <span className="db-val">{indicadores}</span>
                    <span className="db-label">indicadores ativos</span>
                  </div>
                  <div className="db-item">
                    <span className="db-val">+{placas - placasBase}</span>
                    <span className="db-label">placas esta sessao</span>
                  </div>
                  <div className="db-item">
                    <span className="db-muted">Atualizado agora</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-cta-wrap">
              <button className="btn-primary hero-cta" onClick={irParaForm}>
                Quero esse painel gratuitamente
                <Glyph name="seta" size={18} />
              </button>
              <span className="hero-cta-note">Grátis. Sem contrato. Em 2 minutos você está dentro.</span>
            </div>
          </div>
        </section>

        {/* TICKER AO VIVO */}
        <div className="lp-ticker">
          <div className="ticker-inner">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className="ticker-item">
                <span className="lp-dot" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* NUMEROS */}
        <div className="lp-nums">
          {[
            { val: "3x",   label: "Aumento medio de vendas com indicadores ativos" },
            { val: "200+", label: "Placas vendidas por mes pelos top consultores" },
            { val: "2min", label: "Para ativar seu painel e comecar a captar hoje" },
            { val: "100%", label: "Gratuito para consultores. Sempre." },
          ].map(({ val, label }) => (
            <div key={val} className="num-item">
              <div className="num-val">{val}</div>
              <div className="num-label">{label}</div>
            </div>
          ))}
        </div>

        {/* COMO FUNCIONA */}
        <section className="lp-section" style={{ background: "var(--bg-0)" }}>
          <div className="section-inner">
            <div className="section-badge">Como funciona</div>
            <h2 className="section-title">Simples. Rápido.<br />Resultados reais.</h2>
            <p className="section-sub">Três passos para transformar sua operação em uma máquina de vendas.</p>
            <div className="steps-grid">
              {[
                { n: "01", glyph: "alvo",         title: "Você se cadastra grátis", desc: "Em 2 minutos você tem seu painel com link exclusivo de captação de indicadores. Sem burocracia." },
                { n: "02", glyph: "compartilhar", title: "Compartilha seu link", desc: "Manda no WhatsApp, grupos, stories. Cada pessoa pode virar um indicador trabalhando pra você." },
                { n: "03", glyph: "escala",       title: "Recebe leads e fecha mais", desc: "Cada indicador traz clientes. Você só fecha. Quanto mais indicadores, mais leads. Escala sem limite." },
              ].map((s, i) => (
                <div key={s.n} className={`step-card${i === 0 ? " feature" : ""}`}>
                  <div className="step-head">
                    <div className="plate-tag">
                      <div className="plate-tag-top">PASSO</div>
                      <div className="plate-tag-num">{s.n}</div>
                    </div>
                    <div className="step-glyph"><Glyph name={s.glyph} size={30} /></div>
                  </div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="lp-section" style={{ background: "var(--bg-1)", borderTop: "1px solid var(--line)" }}>
          <div className="section-inner">
            <div className="section-badge">Por que usar</div>
            <h2 className="section-title">Tudo que você precisava<br />para vender em escala</h2>
            <div className="benefits-grid">
              {[
                { glyph: "painel",  title: "Painel em tempo real", desc: "Veja cada lead chegando, cada indicador ativo, suas conversoes. Dashboard limpo e moderno.", wide: true },
                { glyph: "time",    title: "Time sem custo fixo", desc: "Seus indicadores só ganham quando você ganha. Zero risco. Zero custo fixo." },
                { glyph: "link",    title: "Link exclusivo seu", desc: "Seu link único leva candidatos direto para a página de indicadores vinculada a você." },
                { glyph: "celular", title: "100% pelo celular", desc: "Acompanhe leads e indicadores de qualquer lugar. Rápido e sempre disponível." },
                { glyph: "raio",    title: "Lead chega em segundos", desc: "Assim que o indicador cadastra um cliente, você recebe o lead imediatamente." },
                { glyph: "escala",  title: "Escala sem limite", desc: "10 indicadores = 10x mais leads. 100 indicadores = 100x mais. Você decide." },
              ].map(b => (
                <div key={b.title} className={`benefit-card${b.wide ? " wide" : ""}`}>
                  <div className="benefit-glyph"><Glyph name={b.glyph} size={22} /></div>
                  <div>
                    <div className="benefit-title">{b.title}</div>
                    <div className="benefit-desc">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROVA */}
        <div className="lp-proof">
          <div className="proof-stars">★★★★★</div>
          <p className="proof-quote">&ldquo;Eu vendia 20 placas por mes sozinho. Com meus indicadores, no segundo mes ja tinha batido 80. Hoje trabalho menos e ganho muito mais.&rdquo;</p>
          <div className="proof-author">Consultor de proteção veicular, São Paulo, SP</div>
        </div>

        {/* URGENCIA */}
        <div className="lp-urgencia">
          <div className="urgencia-title">Cada dia sem indicadores e um dia perdendo vendas</div>
          <div className="urgencia-desc">Enquanto você vende sozinho, outros consultores já estão com times de 10, 20, 50 indicadores trazendo clientes todo dia. O cadastro é grátis e leva 2 minutos.</div>
        </div>

        {/* FORMULARIO */}
        <section className="lp-form-section" ref={formRef}>
          <div className="form-rails" />
          <div className="form-inner">
            <div className="section-badge">Quero fazer parte</div>
            <h2 className="form-title">
              Seu time de indicadores<br /><span className="accent">comeca aqui.</span>
            </h2>
            <p className="form-lead">2 minutos de cadastro. Acesso imediato ao painel. Sem custo, sem contrato.</p>

            <div className="form-card">
              <div className="form-scan" />
              <div className="form-corner fc-tl" /><div className="form-corner fc-tr" />
              <div className="form-corner fc-bl" /><div className="form-corner fc-br" />

              {sucesso ? (
                <div className="sucesso-wrap">
                  <div className="sucesso-icon" style={{ color: "var(--brand)" }}>
                    <Glyph name="check" size={38} />
                  </div>
                  <div className="sucesso-title">Cadastro realizado!</div>
                  <div className="sucesso-desc">Bem-vindo, {nome.split(" ")[0]}! Seu acesso foi criado. Entre agora com seu WhatsApp e a senha que você escolheu.</div>
                  <div className="cred-box"><div className="cred-label">WhatsApp</div><div className="cred-valor">{telefone}</div></div>
                  <button className="btn-primary btn-cad" style={{ marginTop: 24 }} onClick={() => router.push("/consultor/login")}>
                    Acessar meu painel
                    <Glyph name="seta" size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={enviar}>
                  {erro && <div className="erro-box">{erro}</div>}
                  <div className="campo-group">
                    <label className="campo-label">Nome completo</label>
                    <input className="campo" type="text" placeholder="Seu nome completo" value={nome} required onChange={e => setNome(e.target.value)} />
                  </div>
                  <div className="campo-group">
                    <label className="campo-label">WhatsApp (com DDD)</label>
                    <input className="campo" type="tel" placeholder="(11) 99999-9999" value={telefone} required onChange={e => setTelefone(fmtTelBR(e.target.value))} />
                  </div>
                  <div className="campo-group">
                    <label className="campo-label">Email (para recuperar sua senha)</label>
                    <input className="campo" type="text" inputMode="email" placeholder="seu@email.com" value={email} required onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="campo-group">
                    <label className="campo-label">Estado</label>
                    <select className="campo campo-select" required value={estado} onChange={e => { setEstado(e.target.value); setCidade(""); }}>
                      <option value="">Selecione o estado</option>
                      {Object.keys(ESTADOS_CIDADES).sort().map(uf => (
                        <option key={uf} value={uf}>{ESTADOS_NOMES[uf]} ({uf})</option>
                      ))}
                    </select>
                  </div>
                  <div className="campo-group">
                    <label className="campo-label">Cidade</label>
                    <select className="campo campo-select" required value={cidade} onChange={e => setCidade(e.target.value)} disabled={!estado}>
                      <option value="">{estado ? "Selecione a cidade" : "Selecione o estado primeiro"}</option>
                      {(ESTADOS_CIDADES[estado] ?? []).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="campo-group">
                    <label className="campo-label">Crie uma senha (mínimo 6 caracteres)</label>
                    <div className="senha-wrap">
                      <input className="campo" type={verSenha ? "text" : "password"} placeholder="Crie sua senha de acesso" value={senha} required style={{ paddingRight: 44 }} onChange={e => setSenha(e.target.value)} />
                      <button type="button" className="senha-toggle" onClick={() => setVerSenha(v => !v)} aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {verSenha ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="campo-group">
                    <label className="campo-label">Confirme a senha</label>
                    <input className="campo" type="password" placeholder="Digite a senha novamente" value={confirmarSenha} required onChange={e => setConfirmarSenha(e.target.value)} />
                  </div>
                  <div className="campo-group">
                    <label className="campo-label">Nome da empresa</label>
                    {associacoes.length > 0 ? (
                      <select className="campo campo-select" required value={associacaoId} onChange={e => {
                        const id = e.target.value;
                        setAssociacaoId(id);
                        const found = associacoes.find(a => a.id === id);
                        setAssociacaoNome(found ? found.nome : "");
                      }}>
                        <option value="">Selecione a associação</option>
                        {associacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                        <option value="outra">Outra associação</option>
                      </select>
                    ) : (
                      <input className="campo" type="text" placeholder="Nome da sua associação" value={associacaoNome} required onChange={e => setAssociacaoNome(e.target.value)} />
                    )}
                  </div>
                  {associacaoId === "outra" && (
                    <div className="campo-group">
                      <label className="campo-label">Qual associação?</label>
                      <input className="campo" type="text" placeholder="Digite o nome" value={associacaoTexto} required onChange={e => setAssociacaoTexto(e.target.value)} />
                    </div>
                  )}
                  <label className="termos">
                    <input
                      type="checkbox"
                      checked={aceitouTermos}
                      onChange={(e) => setAceitouTermos(e.target.checked)}
                    />
                    <span>
                      Li e aceito os{" "}
                      <a href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</a>
                      {" "}e a{" "}
                      <a href="/privacidade" target="_blank" rel="noopener noreferrer">Politica de Privacidade</a>
                      {" "}(LGPD).
                    </span>
                  </label>
                  <button className="btn-primary btn-cad" type="submit" disabled={carregando || !aceitouTermos}>
                    {carregando ? "Cadastrando..." : <>Quero meu painel gratuito <Glyph name="check" size={16} /></>}
                  </button>
                  <div className="form-alt">
                    Ja tem cadastro?{" "}
                    <a href="/consultor/login">Entrar no painel</a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        <footer className="lp-footer">© 2026 Indique Placa. Todos os direitos reservados</footer>
      </div>
    </>
  );
}
