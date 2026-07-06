const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

function habilitado() {
  return Boolean(BASE_URL && API_KEY && INSTANCE);
}

async function enviar(telefone: string, mensagem: string): Promise<boolean> {
  if (!habilitado()) return false;

  const numero = telefone.replace(/\D/g, "");
  const numeroFormatado = numero.startsWith("55") ? numero : `55${numero}`;

  try {
    const resp = await fetch(`${BASE_URL}/message/sendText/${INSTANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY!,
      },
      body: JSON.stringify({
        number: numeroFormatado,
        text: mensagem,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function notificarNovoLead(opts: {
  nomeConsultor: string;
  telefoneConsultor: string;
  placa: string;
  nomeLead?: string | null;
  telefoneLead?: string | null;
  viaIndicador?: string | null;
}) {
  const via = opts.viaIndicador ? ` via indicador *${opts.viaIndicador}*` : "";
  const proprietario = opts.nomeLead ? `\n*Proprietário:* ${opts.nomeLead}` : "";
  const contato = opts.telefoneLead ? `\n*Telefone:* ${opts.telefoneLead}` : "";
  const msg = `Ola, *${opts.nomeConsultor}*!\n\nNova placa indicada${via}:\n\n*Placa:* ${opts.placa}${proprietario}${contato}\n\nAcesse o painel para acompanhar: https://app.indiqueplaca.com.br/consultor/leads`;
  return enviar(opts.telefoneConsultor, msg);
}

export async function notificarLeadFechado(opts: {
  nomeConsultor: string;
  telefoneConsultor: string;
  placa?: string | null;
  nomeLead?: string | null;
}) {
  const identificador = opts.placa ? `placa *${opts.placa}*` : opts.nomeLead ? `*${opts.nomeLead}*` : "o lead";
  const msg = `Parabens, *${opts.nomeConsultor}*!\n\nA indicacao de ${identificador} foi marcada como *FECHADO*.\n\nSua comissao foi registrada. Continue assim!`;
  return enviar(opts.telefoneConsultor, msg);
}

export async function enviarOTP(opts: {
  telefone: string;
  codigo: string;
  tipo: "consultor" | "indicador";
}): Promise<boolean> {
  const msg = `Seu codigo de verificacao para redefinir a senha: *${opts.codigo}*\n\nEle expira em 10 minutos. Nao compartilhe este codigo com ninguem.`;
  return enviar(opts.telefone, msg);
}

export async function notificarNovaIndicacao(opts: {
  nomeIndicador: string;
  telefoneIndicador: string;
  placa: string;
  nomeLead?: string | null;
}) {
  const proprietario = opts.nomeLead ? ` (${opts.nomeLead})` : "";
  const msg = `Ola, *${opts.nomeIndicador}*!\n\nSua indicacao da placa *${opts.placa}*${proprietario} foi recebida com sucesso.\n\nAssim que houver atualizacao, voce sera avisado. Obrigado por indicar!`;
  return enviar(opts.telefoneIndicador, msg);
}
