"use client";

import { useState, useEffect } from "react";
import { Search, Star, MessageCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const ESTADOS = [
  { uf: "AC", nome: "Acre" }, { uf: "AL", nome: "Alagoas" }, { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" }, { uf: "BA", nome: "Bahia" }, { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" }, { uf: "ES", nome: "Espírito Santo" }, { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" }, { uf: "MT", nome: "Mato Grosso" }, { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" }, { uf: "PA", nome: "Pará" }, { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" }, { uf: "PE", nome: "Pernambuco" }, { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" }, { uf: "RN", nome: "Rio Grande do Norte" }, { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" }, { uf: "RR", nome: "Roraima" }, { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" }, { uf: "SE", nome: "Sergipe" }, { uf: "TO", nome: "Tocantins" },
];

const SEGMENTOS = [
  "Oficinas mecanicas",
  "Concessionarias",
  "Despachantes",
  "Transportadoras",
  "Mototaxistas",
  "Posto de combustivel",
  "Lava-rapido",
  "Seguradora",
  "Corretor de seguros",
  "Outro",
];

type Parceiro = {
  nome: string;
  endereco: string;
  telefone: string;
  rating: number | null;
  total_avaliacoes: number;
  place_id: string;
};

function Estrelas({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-[var(--muted-foreground)]">sem avaliacao</span>;
  const cheia = Math.floor(rating);
  const meia = rating - cheia >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i <= cheia ? "text-amber-400" : meia && i === cheia + 1 ? "text-amber-300" : "text-[var(--border)]"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-[var(--muted-foreground)] ml-1">{rating.toFixed(1)} ({String(new Intl.NumberFormat("pt-BR").format(Number(String(rating))))})</span>
    </span>
  );
}

export default function ParceirosPage() {
  const router = useRouter();
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [segmento, setSegmento] = useState(SEGMENTOS[0]);
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<Parceiro[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [cidadeBuscada, setCidadeBuscada] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    // verifica autenticacao
    fetch("/api/gestor/upgrade-pro")
      .then((r) => { if (r.status === 401) router.replace("/gestor/login"); })
      .catch(() => {});
  }, [router]);

  async function selecionarUf(novoUf: string) {
    setUf(novoUf);
    setCidade("");
    setCidades([]);
    setResultados([]);
    setTotal(null);
    if (!novoUf) return;
    setCarregandoCidades(true);
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${novoUf}/municipios?orderBy=nome`);
      const data = await res.json() as Array<{ nome: string }>;
      setCidades(data.map((m) => m.nome));
    } catch {
      setCidades([]);
    } finally {
      setCarregandoCidades(false);
    }
  }

  async function buscar() {
    if (!uf || !cidade.trim()) return;
    setBuscando(true);
    setErro(null);
    setResultados([]);
    setTotal(null);
    const cidadeCompleta = `${cidade.trim()}, ${uf}`;
    try {
      const params = new URLSearchParams({ cidade: cidadeCompleta, tipo: segmento });
      const res = await fetch(`/api/gestor/buscar-parceiros?${params}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setErro("Buscador temporariamente indisponivel. Entre em contato com o suporte para ativar.");
        } else {
          setErro(data.error ?? "Erro ao buscar parceiros.");
        }
        return;
      }
      setResultados(data.resultados ?? []);
      setTotal(data.total ?? 0);
      setCidadeBuscada(cidadeCompleta);
      setIsMock(!!data.mock);
    } finally {
      setBuscando(false);
    }
  }

  function mensagemWhatsApp(parceiro: Parceiro) {
    const msg = encodeURIComponent(
      `Ola! Sou consultor de protecao veicular e gostaria de apresentar uma oportunidade de parceria. Podemos conversar?`
    );
    const fone = parceiro.telefone.replace(/\D/g, "");
    return fone ? `https://wa.me/55${fone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  }

  function urlCadastrarIndicador(parceiro: Parceiro) {
    const params = new URLSearchParams({ nome: parceiro.nome, fone: parceiro.telefone });
    return `/gestor/meus-indicadores?${params}`;
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50";
  const btnBase =
    "px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";


  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-[var(--border)]">
        <h1 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <Search className="h-5 w-5 text-violet-500" />
          Buscar Parceiros
        </h1>
        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
          Encontre empresas e pessoas para recrutar como indicadores
        </p>
      </div>

      <div className="flex-1 p-8 bg-[var(--muted)]/30 space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-[var(--border)]">
            <CardTitle className="text-sm font-semibold">Pesquisar</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                  Estado (UF)
                </label>
                <select
                  value={uf}
                  onChange={(e) => void selecionarUf(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  {ESTADOS.map((e) => (
                    <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                  Cidade {carregandoCidades && <span className="text-violet-400 font-normal">(carregando...)</span>}
                </label>
                <select
                  value={cidade}
                  disabled={!uf || carregandoCidades}
                  onChange={(e) => setCidade(e.target.value)}
                  className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">{uf ? (carregandoCidades ? "Carregando..." : "Selecione a cidade...") : "Selecione o estado primeiro"}</option>
                  {cidades.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] block mb-1">
                  Segmento
                </label>
                <select
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                  className={inputClass}
                >
                  {SEGMENTOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={buscar}
                  disabled={buscando || !uf || !cidade}
                  className={`${btnBase} bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2 w-full justify-center`}
                >
                  <Search className="h-4 w-4" />
                  {buscando ? "Buscando..." : "Buscar"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {erro && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-sm text-red-500">{erro}</p>
          </div>
        )}

        {isMock && total !== null && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <p className="text-sm text-amber-500 font-semibold">Modo de demonstracao</p>
            <p className="text-xs text-amber-400/80 mt-0.5">Os resultados abaixo sao exemplos fictícios. Para buscar empresas reais do Google Maps, o administrador precisa ativar a integracao Google Places no painel master.</p>
          </div>
        )}

        {total !== null && (
          <p className="text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{total}</span>{" "}
            {total === 1 ? "resultado encontrado" : "resultados encontrados"} em{" "}
            <span className="font-semibold text-[var(--foreground)]">{cidadeBuscada}</span>
          </p>
        )}

        {resultados.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.map((p) => (
              <Card key={p.place_id} className="shadow-sm">
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-2">{p.nome}</p>
                    {p.endereco && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">{p.endereco}</p>
                    )}
                    {p.telefone && (
                      <p className="text-xs text-[var(--foreground)] mt-1">{p.telefone}</p>
                    )}
                  </div>

                  {p.rating !== null && (
                    <div className="flex items-center gap-1.5">
                      <Estrelas rating={p.rating} />
                      {p.total_avaliacoes > 0 && (
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          ({p.total_avaliacoes})
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <a
                      href={mensagemWhatsApp(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnBase} bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center gap-1.5 text-xs`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Contatar
                    </a>
                    <Link
                      href={urlCadastrarIndicador(p)}
                      className={`${btnBase} bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 flex items-center gap-1.5 text-xs`}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Adicionar
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
