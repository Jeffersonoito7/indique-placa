"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --navy: #04091a;
  --navy2: #080f24;
  --gold: #f59e0b;
  --gold2: #fbbf24;
  --green: #10b981;
  --txt2: rgba(255,255,255,.55);
  --txt3: rgba(255,255,255,.28);
  --border: rgba(255,255,255,.08);
}

@keyframes fadeUp  { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
@keyframes float   { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
@keyframes pulse   { 0%,100% { opacity:.35; transform:scale(1) } 50% { opacity:.7; transform:scale(1.12) } }
@keyframes toastIn { from { transform:translateX(120%); opacity:0 } to { transform:translateX(0); opacity:1 } }
@keyframes toastOut{ from { transform:translateX(0); opacity:1 } to { transform:translateX(120%); opacity:0 } }
@keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
@keyframes scan    { 0% { transform:translateY(-100%); opacity:.6 } 100% { transform:translateY(1000%); opacity:0 } }
@keyframes popIn   { 0% { transform:scale(0); opacity:0 } 60% { transform:scale(1.18); opacity:1 } 100% { transform:scale(1) } }
@keyframes ripple  { 0% { transform:scale(1); opacity:.6 } 100% { transform:scale(3); opacity:0 } }
@keyframes ticker  { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }

.page { min-height:100vh; background:var(--navy); font-family:Inter,system-ui,sans-serif; color:#fff; overflow-x:hidden; }

.toast-wrap { position:fixed; top:20px; right:20px; z-index:999; display:flex; flex-direction:column; gap:10px; pointer-events:none; }
.toast { background:rgba(10,15,35,.96); border:1px solid rgba(16,185,129,.3); border-radius:14px; padding:12px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 8px 32px rgba(0,0,0,.5); min-width:240px; max-width:300px; animation: toastIn .4s cubic-bezier(.34,1.56,.64,1) both; }
.toast.saindo { animation: toastOut .35s ease forwards; }
.toast-avatar { width:38px; height:38px; border-radius:50%; flex-shrink:0; border:2px solid rgba(16,185,129,.4); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:900; }
.toast-nome { font-size:12px; font-weight:700; color:#fff; margin-bottom:2px; }
.toast-val  { font-size:15px; font-weight:900; color:var(--green); }
.toast-desc { font-size:11px; color:rgba(255,255,255,.4); margin-top:1px; }
.toast-dot  { width:7px; height:7px; border-radius:50%; background:var(--green); flex-shrink:0; position:relative; }
.toast-dot::after { content:''; position:absolute; inset:-4px; border-radius:50%; border:1px solid var(--green); animation:ripple 1.5s infinite; }

.hero { position:relative; overflow:hidden; padding:90px 24px 80px; background:radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,.12), transparent), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(16,185,129,.06), transparent), var(--navy2); text-align:center; }
.hero-grid { position:absolute; inset:0; pointer-events:none; background-image:linear-gradient(rgba(245,158,11,.04) 1px, transparent 1px),linear-gradient(90deg, rgba(245,158,11,.04) 1px, transparent 1px); background-size:60px 60px; mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%); }
.hero-glow1 { position:absolute; width:700px; height:700px; border-radius:50%; background:radial-gradient(circle, rgba(245,158,11,.09) 0%, transparent 65%); top:-200px; left:-200px; animation:pulse 10s ease-in-out infinite; pointer-events:none; }
.hero-glow2 { position:absolute; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle, rgba(16,185,129,.06) 0%, transparent 65%); bottom:-100px; right:-100px; animation:pulse 12s ease-in-out infinite reverse; pointer-events:none; }

.hero-pill { display:inline-flex; align-items:center; gap:8px; background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.25); border-radius:99px; padding:6px 16px; font-size:12px; font-weight:700; color:var(--green); letter-spacing:.8px; text-transform:uppercase; margin-bottom:28px; animation:fadeUp .5s ease both; }
.pill-dot { width:7px; height:7px; border-radius:50%; background:var(--green); position:relative; }
.pill-dot::after { content:''; position:absolute; inset:-3px; border-radius:50%; border:1px solid var(--green); animation:ripple 1.8s ease-out infinite; }

.hero-logo { animation:float 5s ease-in-out infinite; margin-bottom:24px; display:flex; justify-content:center; }
.hero-h1 { font-size:clamp(36px, 6vw, 72px); font-weight:900; line-height:1.02; letter-spacing:-2px; margin-bottom:18px; animation:fadeUp .6s .1s ease both; }
.hero-h1 em { font-style:normal; color:var(--gold); }
.hero-h1 .green { color:var(--green); }
.hero-sub { font-size:clamp(15px, 2vw, 19px); color:var(--txt2); max-width:560px; margin:0 auto 40px; line-height:1.7; animation:fadeUp .6s .2s ease both; }
.hero-cta { display:inline-flex; align-items:center; gap:10px; padding:18px 40px; background:linear-gradient(135deg, #92400e, #f59e0b, #fde68a, #f59e0b, #92400e); background-size:300% 300%; animation:shimmer 4s linear infinite, fadeUp .6s .3s ease both; border:none; border-radius:16px; color:#000; font-size:16px; font-weight:900; cursor:pointer; font-family:inherit; letter-spacing:.4px; box-shadow:0 6px 32px rgba(245,158,11,.4); transition:transform .2s, box-shadow .2s; }
.hero-cta:hover { transform:translateY(-3px); box-shadow:0 12px 48px rgba(245,158,11,.6); }

.ticker-wrap { background:rgba(245,158,11,.06); border-top:1px solid rgba(245,158,11,.12); border-bottom:1px solid rgba(245,158,11,.12); overflow:hidden; padding:10px 0; }
.ticker-inner { display:flex; white-space:nowrap; animation:ticker 28s linear infinite; }
.ticker-item { display:inline-flex; align-items:center; gap:8px; padding:0 36px; font-size:13px; color:var(--gold2); font-weight:700; }

.ganhos { padding:90px 24px; background:var(--navy2); }
.ganhos-inner { max-width:1060px; margin:0 auto; }
.sec-eyebrow { font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:var(--gold); margin-bottom:10px; display:block; }
.sec-h2 { font-size:clamp(28px,4vw,46px); font-weight:900; letter-spacing:-1px; line-height:1.1; margin-bottom:14px; }
.sec-sub { font-size:16px; color:var(--txt2); max-width:500px; line-height:1.65; margin-bottom:56px; }

.comissoes { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:16px; }
.com-card { background:linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); border:1px solid var(--border); border-radius:22px; padding:30px 24px; transition:transform .2s, border-color .2s, box-shadow .2s; position:relative; overflow:hidden; }
.com-card:hover { transform:translateY(-6px); border-color:rgba(245,158,11,.3); box-shadow:0 16px 48px rgba(0,0,0,.4); }
.com-veiculo { font-size:13px; font-weight:700; color:var(--txt3); text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
.com-icon { font-size:36px; margin-bottom:14px; display:block; }
.com-valor { font-size:clamp(34px,4vw,48px); font-weight:900; color:var(--green); letter-spacing:-1px; line-height:1; margin-bottom:6px; }
.com-por { font-size:13px; color:var(--txt3); }
.com-badge { display:inline-block; font-size:10px; font-weight:800; letter-spacing:.8px; text-transform:uppercase; background:rgba(16,185,129,.12); color:var(--green); border:1px solid rgba(16,185,129,.2); border-radius:6px; padding:3px 8px; margin-top:14px; }

.calc { padding:80px 24px; background:var(--navy); }
.calc-inner { max-width:800px; margin:0 auto; text-align:center; }
.calc-card { background:rgba(255,255,255,.03); border:1px solid rgba(245,158,11,.15); border-radius:28px; padding:48px 40px; margin-top:48px; }
.calc-sliders { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-bottom:40px; text-align:left; }
.slider-label { font-size:12px; font-weight:700; color:var(--txt3); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
.slider-val { font-size:28px; font-weight:900; margin-bottom:14px; }
.slider-val span { font-size:14px; color:var(--txt2); font-weight:600; }
input[type=range] { -webkit-appearance:none; width:100%; height:6px; background:rgba(255,255,255,.1); border-radius:99px; outline:none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:22px; height:22px; border-radius:50%; background:var(--gold); cursor:pointer; border:3px solid #fff; box-shadow:0 2px 8px rgba(245,158,11,.5); }
.calc-resultado { background:linear-gradient(135deg, rgba(16,185,129,.1), rgba(16,185,129,.04)); border:1px solid rgba(16,185,129,.2); border-radius:18px; padding:28px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.calc-res-label { font-size:13px; color:var(--txt2); margin-bottom:6px; }
.calc-res-val { font-size:clamp(36px,5vw,56px); font-weight:900; color:var(--green); letter-spacing:-2px; }
.calc-tags { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
.ctag { font-size:11px; font-weight:700; background:rgba(16,185,129,.12); color:var(--green); border:1px solid rgba(16,185,129,.2); border-radius:6px; padding:4px 10px; }

.stats { padding:70px 24px; background:linear-gradient(135deg, rgba(16,185,129,.06), transparent, rgba(245,158,11,.05)); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
.stats-inner { max-width:860px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:32px; text-align:center; }
.stat-val { font-size:clamp(32px,5vw,52px); font-weight:900; letter-spacing:-2px; margin-bottom:6px; }
.stat-desc { font-size:13px; color:var(--txt2); font-weight:600; }

.prova { padding:80px 24px; background:var(--navy2); }
.prova-inner { max-width:960px; margin:0 auto; }
.depoimentos { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px,1fr)); gap:18px; margin-top:48px; }
.dep { background:rgba(255,255,255,.03); border:1px solid var(--border); border-radius:20px; padding:26px; transition:transform .2s; }
.dep:hover { transform:translateY(-4px); }
.dep-header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.dep-avatar { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; flex-shrink:0; }
.dep-nome { font-size:14px; font-weight:800; }
.dep-loc  { font-size:11px; color:var(--txt3); margin-top:2px; }
.dep-stars { color:var(--gold); font-size:13px; margin-bottom:10px; }
.dep-txt  { font-size:13px; color:var(--txt2); line-height:1.65; }
.dep-pix  { display:flex; align-items:center; gap:6px; margin-top:14px; padding-top:14px; border-top:1px solid var(--border); }
.dep-pix-val { font-weight:900; color:var(--green); font-size:14px; }

.form-sec { padding:90px 24px 100px; background:var(--navy); position:relative; overflow:hidden; }
.form-bg { position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,158,11,.05), transparent); pointer-events:none; }
.form-inner { max-width:480px; margin:0 auto; position:relative; }
.form-card { background:rgba(255,255,255,.04); backdrop-filter:blur(24px); border:1px solid rgba(245,158,11,.15); border-radius:28px; padding:42px 36px; box-shadow:0 40px 120px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06); position:relative; overflow:hidden; }
.form-scan { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg, transparent, rgba(245,158,11,.5), transparent); animation:scan 5s ease-in-out infinite; pointer-events:none; }
.corner { position:absolute; width:16px; height:16px; border-color:rgba(245,158,11,.3); border-style:solid; }
.c-tl { top:12px; left:12px; border-width:2px 0 0 2px; border-radius:4px 0 0 0; }
.c-tr { top:12px; right:12px; border-width:2px 2px 0 0; border-radius:0 4px 0 0; }
.c-bl { bottom:12px; left:12px; border-width:0 0 2px 2px; border-radius:0 0 0 4px; }
.c-br { bottom:12px; right:12px; border-width:0 2px 2px 0; border-radius:0 0 4px 0; }
.campo-g { margin-bottom:14px; }
.campo-l { display:block; font-size:11px; font-weight:700; letter-spacing:.5px; color:var(--txt3); text-transform:uppercase; margin-bottom:7px; }
.campo { width:100%; padding:14px 16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; font-size:15px; color:#fff; outline:none; font-family:inherit; transition:all .2s; }
.campo:focus { border-color:rgba(245,158,11,.5); background:rgba(245,158,11,.04); box-shadow:0 0 0 3px rgba(245,158,11,.1); }
.campo::placeholder { color:rgba(255,255,255,.2); }
.pw-wrap { position:relative; }
.pw-wrap .campo { padding-right:46px; }
.pw-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--txt3); transition:color .15s; padding:4px; }
.pw-btn:hover { color:rgba(255,255,255,.8); }
.btn-cad { width:100%; padding:16px; background:linear-gradient(135deg, #92400e, #d97706, #f59e0b, #d97706, #92400e); background-size:300% 300%; animation:shimmer 4s linear infinite; border:none; border-radius:13px; color:#000; font-size:16px; font-weight:900; letter-spacing:.5px; cursor:pointer; font-family:inherit; transition:transform .2s, box-shadow .2s; box-shadow:0 6px 28px rgba(245,158,11,.35); margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px; }
.btn-cad:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 40px rgba(245,158,11,.5); }
.btn-cad:disabled { opacity:.5; cursor:not-allowed; }
.erro-box { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.2); border-radius:10px; padding:10px 14px; font-size:13px; color:#f87171; margin-bottom:14px; text-align:center; }
.sucesso-icon { width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.05)); border:2px solid rgba(16,185,129,.4); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; animation:popIn .6s cubic-bezier(.34,1.56,.64,1) both; }
.footer { padding:28px 24px; text-align:center; border-top:1px solid var(--border); font-size:12px; color:var(--txt3); }

@media (max-width:640px) {
  .hero { padding:60px 20px 60px; }
  .calc-sliders { grid-template-columns:1fr; }
  .calc-resultado { flex-direction:column; text-align:center; }
  .calc-tags { justify-content:center; }
  .form-card { padding:28px 20px; }
}
`;

const TOASTS = [
  { inicial:"C", nome:"Carlos M.",   val:"R$150", desc:"indicou um carro • Petrolina-PE",    cor:"#1a3a5c" },
  { inicial:"A", nome:"Amanda S.",   val:"R$300", desc:"indicou dois carros • Juazeiro-BA",  cor:"#1a3a1a" },
  { inicial:"R", nome:"Roberto L.",  val:"R$500", desc:"indicou um caminhão • Recife-PE",    cor:"#3a1a1a" },
  { inicial:"F", nome:"Fernanda P.", val:"R$50",  desc:"indicou uma moto • Caruaru-PE",      cor:"#1a2a3a" },
  { inicial:"J", nome:"João V.",     val:"R$600", desc:"indicou três carros • Fortaleza-CE", cor:"#1a3a5c" },
  { inicial:"M", nome:"Monique T.",  val:"R$150", desc:"indicou um carro • Salvador-BA",     cor:"#2a1a3a" },
];

const DEPOIMENTOS = [
  { inicial:"D", nome:"Daniel R.",   loc:"Petrolina, PE", cor:"#1a3a5c", txt:"Comecei há dois meses. Só fico de olho nos carros da rua e registro a placa pelo celular. Já recebi R$1.200 em PIX.", pix:"R$ 1.200" },
  { inicial:"P", nome:"Patricia V.", loc:"Caruaru, PE",   cor:"#1a3a1a", txt:"Indiquei o carro da minha vizinha, do marido e de dois colegas. Em menos de 30 dias recebi R$400.", pix:"R$ 400" },
  { inicial:"L", nome:"Lucas S.",    loc:"Juazeiro, BA",  cor:"#3a1a1a", txt:"No começo achei que era difícil. Mas é simples demais. Digita a placa, espera o consultor confirmar e o PIX cai.", pix:"R$ 750" },
];

const TICKER = [
  "Carlos recebeu R$150 hoje","Amanda recebeu R$300 esta semana",
  "Roberto recebeu R$500 por indicação de caminhão","Fernanda recebeu R$50 por moto indicada",
  "João acumulou R$1.800 este mês","Monique recebeu R$600 nesta semana",
  "Paulo recebeu R$150 por carro indicado","Marcia recebeu R$100 por indicação fechada",
];

function Toasts() {
  const [ativo, setAtivo] = useState<(typeof TOASTS[0] & { id:number }) | null>(null);
  const [saindo, setSaindo] = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    const mostrar = () => {
      const t = TOASTS[idx.current % TOASTS.length]; idx.current++;
      setAtivo({ ...t, id: Date.now() }); setSaindo(false);
      setTimeout(() => setSaindo(true), 4000);
      setTimeout(() => setAtivo(null), 4500);
    };
    const a = setTimeout(mostrar, 2500);
    const b = setInterval(mostrar, 7000);
    return () => { clearTimeout(a); clearInterval(b); };
  }, []);
  if (!ativo) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast${saindo?" saindo":""}`}>
        <div className="toast-avatar" style={{ background:`linear-gradient(135deg,${ativo.cor},${ativo.cor}88)` }}>{ativo.inicial}</div>
        <div style={{ flex:1 }}>
          <div className="toast-nome">{ativo.nome}</div>
          <div className="toast-val">{ativo.val} via PIX</div>
          <div className="toast-desc">{ativo.desc}</div>
        </div>
        <div className="toast-dot" />
      </div>
    </div>
  );
}

function Calculadora() {
  const [qtd, setQtd] = useState(5);
  const [mix, setMix] = useState(50);
  const motos = Math.round(qtd*(1-mix/100));
  const carros = Math.round(qtd*(mix/100));
  const mes = (motos*50+carros*100)*4;
  return (
    <div className="calc">
      <div className="calc-inner">
        <span className="sec-eyebrow" style={{ display:"block", textAlign:"center" }}>Simulador de renda</span>
        <h2 className="sec-h2" style={{ textAlign:"center" }}>Quanto você pode ganhar?</h2>
        <p style={{ fontSize:15, color:"var(--txt2)", textAlign:"center", maxWidth:480, margin:"0 auto" }}>Arraste os controles e veja a projeção real baseada nas comissões.</p>
        <div className="calc-card">
          <div className="calc-sliders">
            <div>
              <div className="slider-label">Indicações por semana</div>
              <div className="slider-val">{qtd} <span>indicações</span></div>
              <input type="range" min={1} max={20} value={qtd} onChange={e=>setQtd(Number(e.target.value))} />
            </div>
            <div>
              <div className="slider-label">Proporção carros vs motos</div>
              <div className="slider-val">{mix}% <span>carros</span></div>
              <input type="range" min={0} max={100} value={mix} onChange={e=>setMix(Number(e.target.value))} />
            </div>
          </div>
          <div className="calc-resultado">
            <div>
              <div className="calc-res-label">Projeção mensal estimada</div>
              <div className="calc-res-val">{mes.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div className="calc-tags">
                <span className="ctag">{motos*4} motos x R$50</span>
                <span className="ctag">{carros*4} carros x R$100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormIndicador() {
  const router = useRouter();
  const params = useSearchParams();
  const consultorId = params.get("c") ?? null;
  const formRef = useRef<HTMLDivElement>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior:"smooth", block:"center" });
  const fmtTel = (v:string) => {
    const n = v.replace(/\D/g,"").slice(0,11);
    if(n.length<=2) return n.length?`(${n}`:"";
    if(n.length<=6) return `(${n.slice(0,2)}) ${n.slice(2)}`;
    if(n.length<=10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  };

  const cadastrar = async (e:React.FormEvent) => {
    e.preventDefault(); setErro("");
    const tel = telefone.replace(/\D/g,"");
    if(tel.length<10){ setErro("Digite um WhatsApp válido com DDD"); return; }
    if(senha.length<6){ setErro("A senha precisa ter pelo menos 6 caracteres"); return; }
    setCarregando(true);
    try {
      const res = await fetch("/api/publico/indicador-cadastro",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ nome, telefone, email, senha, consultor_id:consultorId }),
      });
      const json = await res.json();
      if(!res.ok) setErro(json.error??"Erro ao cadastrar");
      else setSucesso(true);
    } catch { setErro("Erro de conexão. Tente novamente."); }
    finally { setCarregando(false); }
  };

  const icone = (v:boolean) => v
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <Toasts />

        {/* HERO */}
        <section className="hero">
          <div className="hero-grid" /><div className="hero-glow1" /><div className="hero-glow2" />
          <div className="hero-pill"><span className="pill-dot" />Muitos indicadores já recebendo via PIX</div>
          <div className="hero-logo">
            <img src="/logo-indique.png" alt="Indique Placa" style={{ width:130, height:130, objectFit:"contain" }} />
          </div>
          <h1 className="hero-h1">
            Conhece alguém com<br />carro, moto ou<br /><span className="green">caminhão?</span>
          </h1>
          <p className="hero-sub">
            Traga ele para proteger o patrimônio dele. Você indica, o consultor cuida do resto. Quando fechar, cai PIX direto na sua conta. Você não vende nada. Só conecta pessoas.
          </p>
          <button className="hero-cta" onClick={scrollToForm}>
            Quero meu primeiro PIX
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </section>

        {/* TICKER */}
        <div className="ticker-wrap" aria-hidden="true">
          <div className="ticker-inner">
            {[...TICKER,...TICKER].map((t,i) => (
              <span key={i} className="ticker-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--gold)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {t}
                <span style={{ opacity:.3 }}>|</span>
              </span>
            ))}
          </div>
        </div>

        {/* COMISSÕES */}
        <section className="ganhos">
          <div className="ganhos-inner">
            <span className="sec-eyebrow">Tabela de comissões</span>
            <h2 className="sec-h2">Você escolhe o que indicar.<br />O sistema calcula o que você ganha.</h2>
            <p className="sec-sub">Cada tipo de veículo tem uma comissão diferente. Quanto maior, maior o ganho.</p>
            <div className="comissoes">
              {[
                { icon:"🏍️", tipo:"Moto",    valor:"R$ 50",  desc:"por moto protegida",     badge:"Mais comum" },
                { icon:"🚗", tipo:"Carro",   valor:"R$ 100", desc:"por carro protegido",    badge:"Mais indicado" },
                { icon:"🚛", tipo:"Caminhão",valor:"R$ 500", desc:"por caminhão protegido", badge:"Maior ganho" },
              ].map(c=>(
                <div key={c.tipo} className="com-card">
                  <div className="com-veiculo">{c.tipo}</div>
                  <span className="com-icon">{c.icon}</span>
                  <div className="com-valor">{c.valor}</div>
                  <div className="com-por">{c.desc}</div>
                  <div className="com-badge">{c.badge}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop:24, fontSize:12, color:"var(--txt3)", textAlign:"center" }}>* Valores configurados pelo consultor. Podem variar conforme a associação.</p>
          </div>
        </section>

        {/* CALCULADORA */}
        <Calculadora />

        {/* STATS */}
        <div className="stats">
          <div className="stats-inner">
            {[
              { val:"R$0",  green:false, desc:"para começar a indicar" },
              { val:"100%", green:true,  desc:"via PIX direto na sua conta" },
              { val:"24h",  green:false, desc:"para confirmar o pagamento" },
              { val:"∞",    green:true,  desc:"sem limite de indicações" },
            ].map(s=>(
              <div key={s.desc}>
                <div className="stat-val" style={{ color:s.green?"var(--green)":"var(--gold)" }}>{s.val}</div>
                <div className="stat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DEPOIMENTOS */}
        <section className="prova">
          <div className="prova-inner">
            <span className="sec-eyebrow">Quem já está ganhando</span>
            <h2 className="sec-h2">Pessoas reais, ganhos reais.</h2>
            <p className="sec-sub" style={{ marginBottom:0 }}>Indicadores de todo o Nordeste já usam a plataforma para aumentar a renda.</p>
            <div className="depoimentos">
              {DEPOIMENTOS.map(d=>(
                <div key={d.nome} className="dep">
                  <div className="dep-header">
                    <div className="dep-avatar" style={{ background:`linear-gradient(135deg,${d.cor},${d.cor}88)`, color:"#fff" }}>{d.inicial}</div>
                    <div><div className="dep-nome">{d.nome}</div><div className="dep-loc">{d.loc}</div></div>
                  </div>
                  <div className="dep-stars">{"★★★★★"}</div>
                  <div className="dep-txt">{d.txt}</div>
                  <div className="dep-pix">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ color:"var(--txt2)", fontSize:12 }}>Recebeu via PIX:</span>
                    <span className="dep-pix-val">{d.pix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FORM */}
        <section className="form-sec" ref={formRef}>
          <div className="form-bg" />
          <div className="form-inner">
            <div style={{ textAlign:"center", marginBottom:32, animation:"fadeUp .6s ease both" }}>
              <span className="sec-eyebrow" style={{ display:"block", marginBottom:8 }}>Cadastro 100% gratuito</span>
              <h2 style={{ fontSize:"clamp(28px,4vw,42px)", fontWeight:900, letterSpacing:-1, lineHeight:1.1, marginBottom:12 }}>
                Crie sua conta.<br />Comece a ganhar.
              </h2>
              <p style={{ fontSize:14, color:"var(--txt2)" }}>Leva menos de 1 minuto. Sem cartão, sem taxa.</p>
            </div>
            <div className="form-card">
              <div className="form-scan" />
              <div className="corner c-tl" /><div className="corner c-tr" />
              <div className="corner c-bl" /><div className="corner c-br" />

              {sucesso ? (
                <div style={{ textAlign:"center" }}>
                  <div className="sucesso-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>Cadastro realizado!</div>
                  <div style={{ fontSize:14, color:"var(--txt2)", lineHeight:1.6, marginBottom:24 }}>
                    Bem-vindo, {nome.split(" ")[0]}! Seu painel está pronto.<br />
                    Acesse com seu WhatsApp e a senha que criou.
                  </div>
                  <button className="btn-cad" onClick={()=>router.push("/indicador/login")}>
                    Acessar meu painel
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
              ) : (
                <>
                  {erro && <div className="erro-box">{erro}</div>}
                  <form onSubmit={cadastrar}>
                    <div className="campo-g">
                      <label className="campo-l">Nome completo</label>
                      <input className="campo" type="text" placeholder="Ex: João Silva" value={nome} required onChange={e=>setNome(e.target.value)} />
                    </div>
                    <div className="campo-g">
                      <label className="campo-l">WhatsApp (com DDD)</label>
                      <input className="campo" type="tel" placeholder="(87) 99999-9999" value={telefone} required onChange={e=>setTelefone(fmtTel(e.target.value))} />
                    </div>
                    <div className="campo-g">
                      <label className="campo-l">Email (para recuperar senha)</label>
                      <input className="campo" type="email" placeholder="seu@email.com" value={email} required onChange={e=>setEmail(e.target.value)} />
                    </div>
                    <div className="campo-g">
                      <label className="campo-l">Crie uma senha</label>
                      <div className="pw-wrap">
                        <input className="campo" type={verSenha?"text":"password"} placeholder="Mínimo 6 caracteres" value={senha} required minLength={6} onChange={e=>setSenha(e.target.value)} />
                        <button type="button" className="pw-btn" onClick={()=>setVerSenha(v=>!v)} tabIndex={-1}>{icone(verSenha)}</button>
                      </div>
                    </div>
                    <button className="btn-cad" type="submit" disabled={carregando}>
                      {carregando?"Cadastrando...":(
                        <>Quero meu painel gratuito <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></>
                      )}
                    </button>
                    <div style={{ marginTop:16, fontSize:12, color:"var(--txt3)", textAlign:"center" }}>
                      Já tem conta?{" "}<a href="/indicador/login" style={{ color:"rgba(245,158,11,.7)", textDecoration:"none" }}>Entrar</a>
                    </div>
                    <div style={{ marginTop:10, fontSize:11, color:"rgba(255,255,255,.2)", textAlign:"center", lineHeight:1.6 }}>
                      Ao se cadastrar, voce concorda com os{" "}
                      <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color:"rgba(245,158,11,.5)", textDecoration:"underline" }}>Termos de Uso</a>
                      {" "}e a{" "}
                      <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color:"rgba(245,158,11,.5)", textDecoration:"underline" }}>Politica de Privacidade</a>.
                    </div>
                  </form>
                </>
              )}
            </div>
            <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:24, flexWrap:"wrap" }}>
              {["100% Gratuito","PIX Direto","Sem Risco"].map(s=>(
                <div key={s} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--txt3)", fontWeight:700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="footer">© {new Date().getFullYear()} Indique Placa. Todos os direitos reservados.</footer>
      </div>
    </>
  );
}

export default function IndicadorCadastroPage() {
  return <Suspense fallback={null}><FormIndicador /></Suspense>;
}
