"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const ESTADOS_CIDADES: Record<string, string[]> = {
  "AC": ["Rio Branco","Cruzeiro do Sul","Sena Madureira","Tarauacá","Feijó"],
  "AL": ["Maceió","Arapiraca","Palmeira dos Índios","Rio Largo","Penedo","União dos Palmares"],
  "AM": ["Manaus","Parintins","Itacoatiara","Manacapuru","Coari","Tefé","Maués"],
  "AP": ["Macapá","Santana","Laranjal do Jari","Oiapoque","Mazagão"],
  "BA": ["Salvador","Feira de Santana","Vitória da Conquista","Camaçari","Juazeiro","Itabuna","Ilhéus","Lauro de Freitas","Jequié","Alagoinhas","Barreiras","Porto Seguro","Simões Filho","Paulo Afonso","Eunápolis"],
  "CE": ["Fortaleza","Caucaia","Juazeiro do Norte","Maracanaú","Sobral","Crato","Itapipoca","Maranguape","Iguatu","Quixadá"],
  "DF": ["Brasília","Ceilândia","Taguatinga","Planaltina","Samambaia","Santa Maria","Gama"],
  "ES": ["Vitória","Vila Velha","Serra","Cariacica","Linhares","Cachoeiro de Itapemirim","Colatina","Guarapari"],
  "GO": ["Goiânia","Aparecida de Goiânia","Anápolis","Rio Verde","Luziânia","Águas Lindas de Goiás","Valparaíso de Goiás","Trindade","Formosa","Novo Gama"],
  "MA": ["São Luís","Imperatriz","São José de Ribamar","Timon","Caxias","Codó","Paço do Lumiar","Açailândia","Bacabal","Balsas"],
  "MG": ["Belo Horizonte","Uberlândia","Contagem","Juiz de Fora","Betim","Montes Claros","Ribeirão das Neves","Uberaba","Governador Valadares","Ipatinga","Sete Lagoas","Divinópolis","Santana do Paraíso","Ibirité","Poços de Caldas","Patos de Minas","Pouso Alegre","Teófilo Otoni","Barbacena","Sabará"],
  "MS": ["Campo Grande","Dourados","Três Lagoas","Corumbá","Grande Dourados","Ponta Porã","Naviraí","Nova Andradina"],
  "MT": ["Cuiabá","Várzea Grande","Rondonópolis","Sinop","Tangará da Serra","Cáceres","Sorriso","Lucas do Rio Verde","Primavera do Leste"],
  "PA": ["Belém","Ananindeua","Santarém","Marabá","Castanhal","Parauapebas","Altamira","Abaetetuba","Cametá","Marituba"],
  "PB": ["João Pessoa","Campina Grande","Santa Rita","Patos","Bayeux","Sousa","Caruaru"],
  "PE": ["Recife","Caruaru","Petrolina","Olinda","Paulista","Palmares","Vitória de Santo Antão","Serra Talhada","Garanhuns","Jaboatão dos Guararapes","Cabo de Santo Agostinho","Camaçari"],
  "PI": ["Teresina","Parnaíba","Picos","Piripiri","Floriano","Campo Maior","Barras"],
  "PR": ["Curitiba","Londrina","Maringá","Ponta Grossa","Cascavel","São José dos Pinhais","Foz do Iguaçu","Colombo","Guarapuava","Paranaguá","Araucária","Toledo","Apucarana","Umuarama","Pinhais"],
  "RJ": ["Rio de Janeiro","São Gonçalo","Duque de Caxias","Nova Iguaçu","Belford Roxo","Niterói","São João de Meriti","Campos dos Goytacazes","Petrópolis","Volta Redonda","Magé","Itaboraí","Macaé","Cabo Frio","Nova Friburgo","Resende"],
  "RN": ["Natal","Mossoró","Parnamirim","São Gonçalo do Amarante","Caicó","Macaíba"],
  "RO": ["Porto Velho","Ji-Paraná","Ariquemes","Vilhena","Cacoal","Rolim de Moura"],
  "RR": ["Boa Vista","Rorainópolis","Caracaraí"],
  "RS": ["Porto Alegre","Caxias do Sul","Pelotas","Canoas","Santa Maria","Gravataí","Viamão","Novo Hamburgo","São Leopoldo","Rio Grande","Alvorada","Passo Fundo","Sapucaia do Sul","Uruguaiana","Santa Cruz do Sul","Cachoeirinha","Bagé","Bento Gonçalves"],
  "SC": ["Joinville","Florianópolis","Blumenau","São José","Criciúma","Chapecó","Itajaí","Lages","Jaraguá do Sul","Palhoça","Balneário Camboriú","Brusque","Tubarão","Caçador"],
  "SE": ["Aracaju","Nossa Senhora do Socorro","Lagarto","Itabaiana","São Cristóvão","Estância"],
  "SP": ["São Paulo","Guarulhos","Campinas","São Bernardo do Campo","Santo André","Osasco","Ribeirão Preto","Sorocaba","Mauá","São José dos Campos","Mogi das Cruzes","Santos","Diadema","Piracicaba","Bauru","São José do Rio Preto","Jundiaí","Carapicuíba","Franca","Limeira","Taubaté","Praia Grande","Caçapava","Suzano","Barueri","Taboão da Serra","Guarujá","Indaiatuba","Americana","Araraquara"],
  "TO": ["Palmas","Araguaína","Gurupi","Porto Nacional","Paraíso do Tocantins","Colinas do Tocantins"],
};

const ESTADOS_NOMES: Record<string, string> = {
  AC:"Acre", AL:"Alagoas", AM:"Amazonas", AP:"Amapá", BA:"Bahia", CE:"Ceará",
  DF:"Distrito Federal", ES:"Espírito Santo", GO:"Goiás", MA:"Maranhão",
  MG:"Minas Gerais", MS:"Mato Grosso do Sul", MT:"Mato Grosso", PA:"Pará",
  PB:"Paraíba", PE:"Pernambuco", PI:"Piauí", PR:"Paraná", RJ:"Rio de Janeiro",
  RN:"Rio Grande do Norte", RO:"Rondônia", RR:"Roraima", RS:"Rio Grande do Sul",
  SC:"Santa Catarina", SE:"Sergipe", SP:"São Paulo", TO:"Tocantins",
};

/* ─── ESTILOS ─────────────────────────────────────────────────────────── */
const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  @keyframes gradientShift {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes glowPulse {
    0%,100% { opacity: .25; transform: scale(1); }
    50%     { opacity: .55; transform: scale(1.1); }
  }
  @keyframes floatUp {
    0%   { transform: translateY(0) scale(1); opacity: .7; }
    100% { transform: translateY(-120vh) scale(0); opacity: 0; }
  }
  @keyframes scanLine {
    0%   { transform: translateY(-100%); opacity: .5; }
    100% { transform: translateY(600%); opacity: 0; }
  }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50%     { opacity: .35; }
  }
  @keyframes checkPop {
    0%   { transform: scale(0); opacity: 0; }
    70%  { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes barGrow {
    from { height: 0; opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes lineDrawX {
    from { stroke-dashoffset: 400; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes floatMoney {
    0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: .9; }
    100% { transform: translateY(-180px) rotate(20deg) scale(.5); opacity: 0; }
  }
  @keyframes tickerSlide {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes ringPulse {
    0%   { transform: scale(1); opacity: .5; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  @keyframes counterFlip {
    from { transform: translateY(8px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }

  .lp-cad {
    font-family: Inter, system-ui, sans-serif;
    background: #020d1a; color: #fff; min-height: 100vh;
  }

  /* NAV */
  .lp-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 40px;
    background: rgba(2,13,26,.92);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255,255,255,.05);
  }
  .nav-cta {
    padding: 10px 22px; border-radius: 10px;
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff; font-size: 13px; font-weight: 700; border: none; cursor: pointer;
    transition: opacity .15s, transform .1s;
    box-shadow: 0 4px 16px rgba(16,185,129,.3);
  }
  .nav-cta:hover { opacity: .9; transform: translateY(-1px); }

  /* HERO */
  .lp-hero {
    position: relative; overflow: hidden;
    padding: 80px 24px 100px;
    background: #020d1a;
    text-align: center;
  }

  /* Grid de linhas tech no fundo */
  .hero-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(16,185,129,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(16,185,129,.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .hero-grid::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #020d1a 100%);
  }

  .hero-glow-c {
    position: absolute; width: 800px; height: 800px; border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,.09) 0%, transparent 60%);
    top: 50%; left: 50%; transform: translate(-50%,-50%);
    animation: glowPulse 8s ease-in-out infinite;
    pointer-events: none;
  }

  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 16px; border-radius: 99px;
    background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2);
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #10b981;
    text-transform: uppercase; margin-bottom: 36px;
    animation: fadeUp .6s ease both;
  }
  .badge-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #10b981;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .hero-headline {
    font-size: clamp(38px, 6vw, 76px);
    font-weight: 900; line-height: 1.03; letter-spacing: -3px;
    margin-bottom: 20px;
    animation: fadeUp .7s ease both .1s;
  }
  .green { color: #10b981; }
  .hero-sub {
    font-size: clamp(15px, 2vw, 18px); color: rgba(255,255,255,.45);
    line-height: 1.7; max-width: 560px; margin: 0 auto 52px;
    animation: fadeUp .7s ease both .15s;
  }

  /* PAINEL DEMO — coração visual */
  .demo-panel {
    position: relative; max-width: 900px; margin: 0 auto 60px;
    animation: fadeUp .8s ease both .2s;
  }
  .demo-card {
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 24px; overflow: hidden;
    box-shadow: 0 40px 120px rgba(0,0,0,.7), 0 0 0 1px rgba(16,185,129,.08);
  }
  /* barra de título do painel */
  .demo-titlebar {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 20px;
    background: rgba(255,255,255,.03);
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .tb-dot { width: 10px; height: 10px; border-radius: 50%; }

  .demo-body {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
  }
  .demo-col {
    padding: 28px 24px;
    border-right: 1px solid rgba(255,255,255,.06);
  }
  .demo-col:last-child { border-right: none; }
  .demo-col-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: rgba(255,255,255,.3); margin-bottom: 16px;
  }

  /* Contador grande */
  .big-counter {
    font-size: 56px; font-weight: 900; letter-spacing: -3px;
    color: #10b981; line-height: 1; margin-bottom: 6px;
    animation: counterFlip .3s ease;
  }
  .counter-label { font-size: 12px; color: rgba(255,255,255,.35); }

  /* Gráfico de barras */
  .bar-chart {
    display: flex; align-items: flex-end; gap: 6px; height: 80px;
  }
  .bar {
    flex: 1; border-radius: 4px 4px 0 0;
    background: linear-gradient(180deg, #10b981, rgba(16,185,129,.3));
    animation: barGrow .8s ease both;
    transform-origin: bottom;
  }

  /* Gráfico de linha SVG */
  .line-chart { width: 100%; height: 80px; }
  .line-path {
    fill: none; stroke: #10b981; stroke-width: 2.5;
    stroke-dasharray: 400; stroke-dashoffset: 400;
    animation: lineDrawX 2s ease both .5s;
  }
  .line-fill {
    fill: url(#lineGrad); opacity: .3;
  }
  .line-dot {
    fill: #10b981;
    animation: fadeIn .3s ease both 2.2s;
  }

  /* Leads ao vivo */
  .live-leads { display: flex; flex-direction: column; gap: 8px; }
  .lead-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: 10px;
    background: rgba(16,185,129,.06);
    border: 1px solid rgba(16,185,129,.12);
    font-size: 12px;
    animation: fadeUp .4s ease both;
  }
  .lead-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #065f46, #10b981);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #fff; flex-shrink: 0;
  }
  .lead-info { flex: 1; }
  .lead-name { font-size: 12px; font-weight: 700; color: #fff; }
  .lead-via  { font-size: 10px; color: rgba(255,255,255,.35); }
  .lead-new  {
    font-size: 9px; font-weight: 800; letter-spacing: 1px;
    color: #10b981; background: rgba(16,185,129,.15);
    padding: 2px 7px; border-radius: 99px;
    animation: pulse 2s ease-in-out infinite;
  }

  /* Moedas flutuantes */
  .money-float {
    position: absolute; font-size: 20px; pointer-events: none;
    animation: floatMoney ease-out forwards;
  }

  /* Indicadores ativos */
  .demo-bottom {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,.06);
    background: rgba(16,185,129,.03);
  }
  .db-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .db-dot  { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.8s ease-in-out infinite; }
  .db-val  { font-weight: 800; color: #10b981; }
  .db-label { color: rgba(255,255,255,.4); font-size: 11px; }
  .ring-wrap { position: relative; display: inline-flex; }
  .ring {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px solid rgba(16,185,129,.4);
    animation: ringPulse 2s ease-out infinite;
  }

  /* TICKER */
  .lp-ticker {
    overflow: hidden; white-space: nowrap;
    border-top: 1px solid rgba(16,185,129,.1);
    border-bottom: 1px solid rgba(16,185,129,.1);
    background: rgba(16,185,129,.04);
    padding: 12px 0;
  }
  .ticker-inner {
    display: inline-flex; gap: 60px;
    animation: tickerSlide 20s linear infinite;
  }
  .ticker-item { font-size: 13px; font-weight: 700; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: 8px; }
  .ticker-green { color: #10b981; }

  /* NUMEROS */
  .lp-nums {
    display: grid; grid-template-columns: repeat(4, 1fr);
    background: rgba(255,255,255,.02);
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .num-item { padding: 44px 24px; text-align: center; border-right: 1px solid rgba(255,255,255,.06); }
  .num-item:last-child { border-right: none; }
  .num-val { font-size: 46px; font-weight: 900; color: #10b981; letter-spacing: -2px; }
  .num-label { font-size: 12px; color: rgba(255,255,255,.35); margin-top: 6px; line-height: 1.5; }

  /* SECTIONS */
  .section-badge {
    display: inline-block; font-size: 11px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; color: #10b981; margin-bottom: 12px;
  }
  .section-title {
    font-size: clamp(28px, 4vw, 48px); font-weight: 900;
    letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px;
  }
  .section-sub { font-size: 16px; color: rgba(255,255,255,.4); line-height: 1.7; max-width: 520px; }

  /* STEPS */
  .steps-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-top: 48px; }
  .step-card {
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px; padding: 32px 24px; position: relative; overflow: hidden;
    transition: border-color .2s, background .2s;
  }
  .step-card:hover { border-color: rgba(16,185,129,.2); background: rgba(16,185,129,.03); }
  .step-num { font-size: 56px; font-weight: 900; letter-spacing: -3px; color: rgba(16,185,129,.1); position: absolute; top: 12px; right: 16px; line-height: 1; }
  .step-icon { font-size: 32px; margin-bottom: 16px; }
  .step-title { font-size: 17px; font-weight: 800; margin-bottom: 10px; }
  .step-desc { font-size: 14px; color: rgba(255,255,255,.4); line-height: 1.6; }

  /* BENEFICIOS */
  .benefits-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 48px; }
  .benefit-card {
    background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
    border-radius: 16px; padding: 28px 24px; transition: border-color .2s;
  }
  .benefit-card:hover { border-color: rgba(16,185,129,.2); }
  .benefit-icon { font-size: 28px; margin-bottom: 12px; }
  .benefit-title { font-size: 15px; font-weight: 800; margin-bottom: 8px; }
  .benefit-desc { font-size: 13px; color: rgba(255,255,255,.4); line-height: 1.6; }

  /* PROVA */
  .lp-proof { text-align: center; padding: 80px 24px; background: rgba(16,185,129,.03); border-top: 1px solid rgba(16,185,129,.1); border-bottom: 1px solid rgba(16,185,129,.1); }
  .proof-stars { font-size: 24px; color: #f59e0b; letter-spacing: 4px; margin-bottom: 20px; }
  .proof-quote { font-size: clamp(18px,3vw,26px); font-weight: 700; font-style: italic; color: rgba(255,255,255,.85); max-width: 700px; margin: 0 auto 20px; line-height: 1.5; }
  .proof-author { font-size: 13px; color: rgba(255,255,255,.3); }

  /* URGENCIA */
  .lp-urgencia { background: rgba(245,158,11,.06); border-top: 1px solid rgba(245,158,11,.12); border-bottom: 1px solid rgba(245,158,11,.12); padding: 40px 24px; text-align: center; }
  .urgencia-title { font-size: 22px; font-weight: 900; color: #f59e0b; margin-bottom: 10px; }
  .urgencia-desc { font-size: 15px; color: rgba(255,255,255,.45); line-height: 1.6; max-width: 600px; margin: 0 auto; }

  /* FORM */
  .lp-form-section { padding: 100px 24px 120px; background: #020d1a; position: relative; overflow: hidden; }
  .form-grid-bg {
    position: absolute; inset: 0; pointer-events: none;
    background-image: linear-gradient(rgba(16,185,129,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .form-grid-bg::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, #020d1a 100%); }
  .form-glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,.1) 0%, transparent 65%); top: 50%; left: 50%; transform: translate(-50%,-50%); animation: glowPulse 8s ease-in-out infinite; pointer-events: none; }
  .form-inner { position: relative; max-width: 520px; margin: 0 auto; text-align: center; }
  .form-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 28px; padding: 44px 40px; text-align: left; margin-top: 40px; box-shadow: 0 40px 120px rgba(0,0,0,.6); position: relative; overflow: hidden; }
  .form-scan { position: absolute; left: 0; right: 0; height: 2px; top: 0; background: linear-gradient(90deg, transparent, rgba(16,185,129,.5), transparent); animation: scanLine 5s ease-in-out infinite; pointer-events: none; }
  .form-corner { position: absolute; width: 18px; height: 18px; border-color: rgba(16,185,129,.3); border-style: solid; pointer-events: none; }
  .fc-tl { top: 14px; left: 14px; border-width: 2px 0 0 2px; border-radius: 3px 0 0 0; }
  .fc-tr { top: 14px; right: 14px; border-width: 2px 2px 0 0; border-radius: 0 3px 0 0; }
  .fc-bl { bottom: 14px; left: 14px; border-width: 0 0 2px 2px; border-radius: 0 0 0 3px; }
  .fc-br { bottom: 14px; right: 14px; border-width: 0 2px 2px 0; border-radius: 0 0 3px 0; }

  .campo-group { margin-bottom: 16px; }
  .campo-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .5px; color: rgba(255,255,255,.4); text-transform: uppercase; margin-bottom: 7px; }
  .campo { width: 100%; padding: 14px 16px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 12px; font-size: 15px; color: #fff; outline: none; font-family: inherit; transition: border-color .2s, box-shadow .2s, background .2s; }
  .campo:focus { border-color: rgba(16,185,129,.45); background: rgba(16,185,129,.04); box-shadow: 0 0 0 3px rgba(16,185,129,.12); }
  .campo::placeholder { color: rgba(255,255,255,.2); }
  .campo-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px; }
  .campo-select option { background: #0c1929; color: #fff; }
  .btn-cad { width: 100%; padding: 17px; border: none; border-radius: 14px; background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 6px 28px rgba(16,185,129,.35); transition: opacity .15s, transform .1s, box-shadow .15s; margin-top: 8px; }
  .btn-cad:hover:not(:disabled) { opacity: .9; transform: translateY(-2px); box-shadow: 0 12px 36px rgba(16,185,129,.45); }
  .btn-cad:disabled { opacity: .5; cursor: not-allowed; }
  .erro-box { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2); border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #f87171; margin-bottom: 16px; text-align: center; }

  .sucesso-wrap { text-align: center; }
  .sucesso-icon { width: 88px; height: 88px; border-radius: 50%; background: rgba(16,185,129,.12); border: 2px solid rgba(16,185,129,.35); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; animation: checkPop .6s cubic-bezier(.34,1.56,.64,1) both; }
  .cred-box { background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.1); border-radius: 14px; padding: 16px 20px; margin-bottom: 10px; text-align: left; }
  .cred-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,.3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .cred-valor { font-size: 16px; font-weight: 700; color: #fff; font-family: 'Courier New', monospace; }
  .cred-hint { background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.18); border-radius: 10px; padding: 12px 16px; font-size: 12px; color: rgba(245,158,11,.85); margin-top: 16px; line-height: 1.6; text-align: center; }

  .lp-footer { text-align: center; padding: 32px; font-size: 12px; color: rgba(255,255,255,.2); border-top: 1px solid rgba(255,255,255,.05); }

  @media (max-width: 768px) {
    .lp-nums { grid-template-columns: repeat(2,1fr); }
    .steps-grid, .benefits-grid { grid-template-columns: 1fr; }
    .demo-body { grid-template-columns: 1fr; }
    .demo-col:not(:first-child) { display: none; }
    .lp-nav { padding: 14px 20px; }
    .form-card { padding: 32px 24px; }
  }
`;

/* ─── DADOS MOCK DO PAINEL DEMO ──────────────────────────────────────── */
const BARS = [18, 34, 28, 52, 44, 68, 91];
const LEADS_MOCK = [
  { nome: "Carlos M.", via: "via Marcos Lima", ini: "C" },
  { nome: "Ana Paula", via: "via Juliana S.", ini: "A" },
  { nome: "Roberto F.", via: "direto",         ini: "R" },
];
const TICKER_ITEMS = [
  "🟢 +1 lead recebido em São Paulo",
  "🟢 +3 placas fechadas hoje",
  "🟢 +1 novo indicador ativo",
  "🟢 +R$ 150 em comissoes",
  "🟢 +2 leads recebidos em Recife",
  "🟢 +5 placas fechadas esta semana",
  "🟢 +1 lead recebido em BH",
  "🟢 +R$ 300 em comissoes",
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
  const [associacao, setAssociacao] = useState("");
  const [associacaoTexto, setAssociacaoTexto] = useState("");
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  /* demo */
  const [placas, setPlacas] = useState(127);
  const [indicadores, setIndicadores] = useState(18);
  const [moneyCoins, setMoneyCoins] = useState<Money[]>([]);
  const [activeLead, setActiveLead] = useState(0);
  const coinId = useRef(0);

  useEffect(() => {
    fetch("/api/publico/associacoes")
      .then(r => r.json())
      .then(d => setAssociacoes(d.associacoes ?? []));
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
    const nomeAssoc = associacao === "outra" ? associacaoTexto : associacao;
    if (!nomeAssoc.trim()) { setErro("Informe a associação"); return; }
    if (senha.length < 6) { setErro("A senha precisa ter no mínimo 6 caracteres"); return; }
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/consultor-cadastro", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, email, cidade: `${cidade} - ${estado}`, associacao: nomeAssoc, senha }),
      });
      const json = await res.json();
      if (!res.ok) setErro(json.error ?? "Erro ao cadastrar");
      else { setSucesso(true); }
    } catch { setErro("Erro de conexão. Tente novamente."); }
    finally { setCarregando(false); }
  };

  const lead = LEADS_MOCK[activeLead];

  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-cad">

        {/* NAV */}
        <nav className="lp-nav">
          <img src="/logo-indique.png" alt="Indique Placa" style={{ height: 32, objectFit: "contain" }} />
          <button className="nav-cta" onClick={irParaForm}>Quero me cadastrar</button>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="hero-grid" />
          <div className="hero-glow-c" />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="hero-badge" style={{ animation: "fadeUp .6s ease both" }}>
              <div className="badge-dot" />
              Sistema de vendas em escala
            </div>

            <h1 className="hero-headline">
              Pare de vender sozinho.<br />
              <span className="green">Monte seu time</span> e<br />
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
                  <span style={{ marginLeft: 12, fontSize: 12, color: "rgba(255,255,255,.3)", fontFamily: "monospace" }}>
                    painel.indiqueplaca.com.br
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                    AO VIVO
                  </span>
                </div>

                <div className="demo-body">
                  {/* COLUNA 1 — contador de placas */}
                  <div className="demo-col" style={{ position: "relative", overflow: "hidden" }}>
                    <div className="demo-col-label">Placas vendidas este mes</div>
                    <div className="big-counter" key={placas}>{placas}</div>
                    <div className="counter-label">+{Math.floor((placas - 127) / 3 + 1)} agora mesmo</div>

                    {/* barras de crescimento */}
                    <div className="bar-chart" style={{ marginTop: 20 }}>
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
                        style={{ left: c.left, top: c.top, animationDuration: "1.8s" }}
                      >
                        💰
                      </div>
                    ))}
                  </div>

                  {/* COLUNA 2 — gráfico de linha */}
                  <div className="demo-col">
                    <div className="demo-col-label">Crescimento de leads</div>
                    <svg className="line-chart" viewBox="0 0 200 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity=".4"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path className="line-fill" d="M0 70 L30 62 L60 50 L90 38 L120 30 L160 18 L200 8 L200 80 L0 80 Z" />
                      <path className="line-path" d="M0 70 L30 62 L60 50 L90 38 L120 30 L160 18 L200 8" />
                      <circle className="line-dot" cx="200" cy="8" r="4" />
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)" }}>Jan</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)" }}>Abr</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)" }}>Jul</span>
                    </div>

                    <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                      <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.15)" }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginBottom: 2 }}>Indicadores ativos</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981", letterSpacing: -1 }}>{indicadores}</div>
                      </div>
                      <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.15)" }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginBottom: 2 }}>Conversao</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#60a5fa", letterSpacing: -1 }}>68%</div>
                      </div>
                    </div>
                  </div>

                  {/* COLUNA 3 — leads ao vivo */}
                  <div className="demo-col">
                    <div className="demo-col-label">Leads recebidos agora</div>
                    <div className="live-leads">
                      {LEADS_MOCK.map((l, i) => (
                        <div
                          key={i}
                          className="lead-item"
                          style={{
                            animationDelay: `${i * .15}s`,
                            opacity: i === activeLead ? 1 : .45,
                            transform: i === activeLead ? "scale(1.02)" : "scale(1)",
                            transition: "all .4s ease",
                            borderColor: i === activeLead ? "rgba(16,185,129,.3)" : "rgba(16,185,129,.1)",
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
                      <div className="db-dot" />
                      <div className="ring" />
                    </div>
                    <span className="db-val">{indicadores}</span>
                    <span className="db-label">indicadores ativos</span>
                  </div>
                  <div className="db-item">
                    <span className="db-val">+{placas - 127}</span>
                    <span className="db-label">placas esta sessao</span>
                  </div>
                  <div className="db-item">
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>Atualizado agora</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animation: "fadeUp .7s ease both .3s" }}>
              <button
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "18px 44px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 10px 40px rgba(16,185,129,.4)",
                  transition: "opacity .15s, transform .15s",
                }}
                onClick={irParaForm}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.opacity = ".9"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = ""; }}
              >
                Quero esse painel gratuitamente
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>Grátis. Sem contrato. Em 2 minutos você está dentro.</span>
            </div>
          </div>
        </section>

        {/* TICKER AO VIVO */}
        <div className="lp-ticker">
          <div className="ticker-inner">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className="ticker-item">
                <span className="ticker-green">●</span> {t}
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
        <section style={{ padding: "100px 24px", background: "#040c14" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="section-badge">Como funciona</div>
            <h2 className="section-title">Simples. Rápido.<br />Resultados reais.</h2>
            <p className="section-sub">Três passos para transformar sua operação em uma máquina de vendas.</p>
            <div className="steps-grid">
              {[
                { n: "01", icon: "🎯", title: "Você se cadastra grátis", desc: "Em 2 minutos você tem seu painel com link exclusivo de captação de indicadores. Sem burocracia." },
                { n: "02", icon: "📲", title: "Compartilha seu link", desc: "Manda no WhatsApp, grupos, stories. Cada pessoa pode virar um indicador trabalhando pra você." },
                { n: "03", icon: "💰", title: "Recebe leads e fecha mais", desc: "Cada indicador traz clientes. Você só fecha. Quanto mais indicadores, mais leads. Escala sem limite." },
              ].map(s => (
                <div key={s.n} className="step-card">
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon">{s.icon}</div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section style={{ padding: "80px 24px", background: "rgba(255,255,255,.01)", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="section-badge">Por que usar</div>
            <h2 className="section-title">Tudo que você precisava<br />para vender em escala</h2>
            <div className="benefits-grid">
              {[
                { icon: "📊", title: "Painel em tempo real", desc: "Veja cada lead chegando, cada indicador ativo, suas conversoes. Dashboard limpo e moderno." },
                { icon: "🤝", title: "Time sem custo fixo", desc: "Seus indicadores só ganham quando você ganha. Zero risco. Zero custo fixo." },
                { icon: "🔗", title: "Link exclusivo seu", desc: "Seu link único leva candidatos direto para a página de indicadores vinculada a você." },
                { icon: "📱", title: "100% pelo celular", desc: "Acompanhe leads e indicadores de qualquer lugar. Rápido e sempre disponível." },
                { icon: "⚡", title: "Lead chega em segundos", desc: "Assim que o indicador cadastra um cliente, você recebe o lead imediatamente." },
                { icon: "📈", title: "Escala sem limite", desc: "10 indicadores = 10x mais leads. 100 indicadores = 100x mais. Você decide." },
              ].map(b => (
                <div key={b.title} className="benefit-card">
                  <div className="benefit-icon">{b.icon}</div>
                  <div className="benefit-title">{b.title}</div>
                  <div className="benefit-desc">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROVA */}
        <div className="lp-proof">
          <div className="proof-stars">★★★★★</div>
          <p className="proof-quote">"Eu vendia 20 placas por mes sozinho. Com meus indicadores, no segundo mes ja tinha batido 80. Hoje trabalho menos e ganho muito mais."</p>
          <div className="proof-author">Consultor de proteção veicular, São Paulo, SP</div>
        </div>

        {/* URGENCIA */}
        <div className="lp-urgencia">
          <div className="urgencia-title">Cada dia sem indicadores e um dia perdendo vendas</div>
          <div className="urgencia-desc">Enquanto você vende sozinho, outros consultores já estão com times de 10, 20, 50 indicadores trazendo clientes todo dia. O cadastro é grátis e leva 2 minutos.</div>
        </div>

        {/* FORMULARIO */}
        <section className="lp-form-section" ref={formRef}>
          <div className="form-grid-bg" />
          <div className="form-glow" />
          <div className="form-inner">
            <div className="section-badge">Quero fazer parte</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 12 }}>
              Seu time de indicadores<br /><span className="green">comeca aqui.</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.35)", lineHeight: 1.7 }}>
              2 minutos de cadastro. Acesso imediato ao painel. Sem custo, sem contrato.
            </p>

            <div className="form-card">
              <div className="form-scan" />
              <div className="form-corner fc-tl" /><div className="form-corner fc-tr" />
              <div className="form-corner fc-bl" /><div className="form-corner fc-br" />

              {sucesso ? (
                <div className="sucesso-wrap">
                  <div className="sucesso-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Cadastro realizado!</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.4)", marginBottom: 24 }}>Bem-vindo, {nome.split(" ")[0]}! Seu acesso foi criado. Entre agora com seu WhatsApp e a senha que você escolheu.</div>
                  <div className="cred-box"><div className="cred-label">WhatsApp</div><div className="cred-valor">{telefone}</div></div>
                  <button className="btn-cad" style={{ marginTop: 24 }} onClick={() => router.push("/consultor/login")}>
                    Acessar meu painel
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
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
                    <input className="campo" type="email" placeholder="seu@email.com" value={email} required onChange={e => setEmail(e.target.value)} />
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
                    <div style={{ position: "relative" }}>
                      <input className="campo" type={verSenha ? "text" : "password"} placeholder="Crie sua senha de acesso" value={senha} required style={{ paddingRight: 44 }} onChange={e => setSenha(e.target.value)} />
                      <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.45)", display: "flex", alignItems: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {verSenha ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="campo-group">
                    <label className="campo-label">Nome da empresa</label>
                    {associacoes.length > 0 ? (
                      <select className="campo campo-select" required value={associacao} onChange={e => setAssociacao(e.target.value)}>
                        <option value="">Selecione a associação</option>
                        {associacoes.map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
                        <option value="outra">Outra associação</option>
                      </select>
                    ) : (
                      <input className="campo" type="text" placeholder="Nome da sua associação" value={associacao} required onChange={e => setAssociacao(e.target.value)} />
                    )}
                  </div>
                  {associacao === "outra" && (
                    <div className="campo-group">
                      <label className="campo-label">Qual associação?</label>
                      <input className="campo" type="text" placeholder="Digite o nome" value={associacaoTexto} required onChange={e => setAssociacaoTexto(e.target.value)} />
                    </div>
                  )}
                  <button className="btn-cad" type="submit" disabled={carregando}>
                    {carregando ? "Cadastrando..." : <>Quero meu painel gratuito <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></>}
                  </button>
                  <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.25)", lineHeight: 1.6 }}>
                    Ja tem cadastro?{" "}
                    <a href="/consultor/login" style={{ color: "rgba(16,185,129,.6)", textDecoration: "none" }}>Entrar no painel</a>
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
