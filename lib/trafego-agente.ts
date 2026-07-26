import "server-only";
import OpenAI from "openai";

function criarCliente(apiKey: string) {
  return new OpenAI({ apiKey });
}

export type CopyGerado = {
  titulo: string;
  corpo: string;
  cta: string;
  justificativa: string;
};

const SYSTEM_PROMPT = `Você é um especialista em tráfego pago para o mercado de proteção veicular e seguros auto no Brasil.
Suas campanhas são voltadas para Instagram e têm como objetivo gerar LEADS qualificados — pessoas que possuem veículo e têm interesse em protegê-lo a um custo menor do que o seguro tradicional.

Perfil do público-alvo:
- Proprietários de veículos (carros, motos, caminhões)
- Renda C/B, entre 25 e 55 anos
- Insatisfeitos com o alto custo do seguro tradicional
- Buscam custo-benefício e cobertura real

Boas práticas obrigatórias:
- Proibido fazer promessas de valor específico (ex: "por apenas R$50")
- Proibido usar termos como "seguro" isolado (usar "proteção veicular" ou "proteção do seu veículo")
- O copy deve gerar CURIOSIDADE e URGÊNCIA sem ser agressivo
- Máximo 125 caracteres no título (limitação do Instagram)
- O corpo deve ter entre 100 e 280 caracteres — direto ao ponto
- Usar emojis com moderação (1-2 no máximo)
- Call-to-action deve ser claro: "Saiba mais", "Quero proteger meu veículo", "Simular agora"

Formato de resposta: JSON válido com os campos titulo, corpo, cta, justificativa.`;

export async function gerarCopyVariacoes(params: {
  tipo_veiculo: string;
  localizacao?: string;
  diferencial?: string;
  openai_api_key: string;
}): Promise<CopyGerado[]> {
  const client = criarCliente(params.openai_api_key);
  const userMsg = `Gere 3 variações de copy para campanha Instagram de proteção veicular.
Tipo de veículo foco: ${params.tipo_veiculo}
Localização: ${params.localizacao ?? "Brasil"}
Diferencial: ${params.diferencial ?? "Melhor custo-benefício vs seguro tradicional"}

Retorne um JSON array com 3 objetos, cada um com: titulo, corpo, cta, justificativa.`;

  const msg = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
  });

  const text = msg.choices[0].message.content ?? "[]";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]) as CopyGerado[];
}

export type AnaliseAlerta = {
  tipo: "positivo" | "negativo" | "info";
  titulo: string;
  mensagem: string;
  acao_tomada?: string;
};

export async function analisarPerformance(params: {
  nome_campanha: string;
  impressoes: number;
  cliques: number;
  ctr: number;
  cpm: number;
  gasto: number;
  leads: number;
  orcamento_diario: number;
  openai_api_key: string;
}): Promise<AnaliseAlerta> {
  const custo_por_lead = params.leads > 0 ? params.gasto / params.leads : null;

  const userMsg = `Analise a performance desta campanha de proteção veicular no Instagram e gere UM alerta.

Campanha: ${params.nome_campanha}
Impressões: ${params.impressoes}
Cliques: ${params.cliques}
CTR: ${params.ctr.toFixed(2)}%
CPM: R$ ${params.cpm.toFixed(2)}
Gasto hoje: R$ ${params.gasto.toFixed(2)} / orçamento diário: R$ ${params.orcamento_diario.toFixed(2)}
Leads gerados: ${params.leads}
Custo por lead: ${custo_por_lead ? `R$ ${custo_por_lead.toFixed(2)}` : "sem leads ainda"}

Regras de classificação:
- CTR >= 2%: POSITIVO (excelente engajamento)
- CTR entre 0.8% e 2%: INFO (performance normal)
- CTR < 0.8% e impressões > 500: NEGATIVO (criativo fraco)
- Custo por lead < R$ 15: POSITIVO (campanha eficiente)
- Custo por lead > R$ 50: NEGATIVO (campanha cara)
- Gasto >= 80% do orçamento sem leads: NEGATIVO (urgente)

Retorne JSON com: tipo ("positivo"|"negativo"|"info"), titulo (curto, max 60 chars), mensagem (explicação em 1-2 frases com dica prática), acao_tomada (o que o sistema fez automaticamente, se fez algo).`;

  try {
    const client = criarCliente(params.openai_api_key);
    const msg = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [{ role: "user", content: userMsg }],
    });

    const text = msg.choices[0].message.content ?? "{}";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("parse");
    return JSON.parse(match[0]) as AnaliseAlerta;
  } catch {
    // fallback sem IA
    if (params.ctr < 0.8 && params.impressoes > 500) {
      return { tipo: "negativo", titulo: "CTR abaixo do esperado", mensagem: `A campanha tem CTR de ${params.ctr.toFixed(2)}%, abaixo do ideal (>1%). Considere trocar o criativo ou o texto.` };
    }
    if (params.ctr >= 2) {
      return { tipo: "positivo", titulo: "Excelente engajamento!", mensagem: `CTR de ${params.ctr.toFixed(2)}% — campanha performando muito acima da média. Considere aumentar o orçamento.` };
    }
    return { tipo: "info", titulo: "Campanha em andamento", mensagem: `Performance dentro do esperado. Aguardando mais dados para análise conclusiva.` };
  }
}
