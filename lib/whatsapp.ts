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
      signal: AbortSignal.timeout(8000),
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
  const msg = `Olá, *${opts.nomeConsultor}*!\n\nNova placa indicada${via}:\n\n*Placa:* ${opts.placa}${proprietario}${contato}\n\nAcesse o painel para acompanhar: https://app.indiqueplaca.com.br/consultor/leads`;
  return enviar(opts.telefoneConsultor, msg);
}

export async function notificarLeadFechado(opts: {
  nomeConsultor: string;
  telefoneConsultor: string;
  placa?: string | null;
  nomeLead?: string | null;
}) {
  const identificador = opts.placa ? `placa *${opts.placa}*` : opts.nomeLead ? `*${opts.nomeLead}*` : "o lead";
  const msg = `Parabéns, *${opts.nomeConsultor}*!\n\nA indicação de ${identificador} foi marcada como *FECHADO*.\n\nSua comissão foi registrada. Continue assim!`;
  return enviar(opts.telefoneConsultor, msg);
}

export async function enviarOTP(opts: {
  telefone: string;
  codigo: string;
  tipo: "consultor" | "indicador" | "gestor" | "associacao" | "master";
}): Promise<boolean> {
  const msg = `Seu código de verificação para redefinir a senha: *${opts.codigo}*\n\nEle expira em 10 minutos. Não compartilhe este código com ninguém.`;
  return enviar(opts.telefone, msg);
}

export async function notificarNovoLeadGestor(opts: {
  nomeGestor: string;
  telefoneGestor: string;
  nomeConsultor: string;
  placa: string;
  nomeLead?: string | null;
  telefoneLead?: string | null;
}) {
  const proprietario = opts.nomeLead ? `\n*Proprietário:* ${opts.nomeLead}` : "";
  const contato = opts.telefoneLead ? `\n*Telefone:* ${opts.telefoneLead}` : "";
  const msg = `Olá, *${opts.nomeGestor}*!\n\nNova placa indicada pelo consultor *${opts.nomeConsultor}*:\n\n*Placa:* ${opts.placa}${proprietario}${contato}\n\nAcesse o painel para acompanhar: https://indiqueplaca.com.br/gestor/leads`;
  return enviar(opts.telefoneGestor, msg);
}

export async function notificarLeadDeIndicadorParaGestor(opts: {
  nomeGestor: string;
  telefoneGestor: string;
  nomeIndicador: string;
  placa: string;
  nomeLead?: string | null;
  telefoneLead?: string | null;
}) {
  const proprietario = opts.nomeLead ? `\n*Nome:* ${opts.nomeLead}` : "";
  const contato = opts.telefoneLead ? `\n*Contato:* ${opts.telefoneLead}` : "";
  const msg = `Olá, *${opts.nomeGestor}*!\n\nNova indicação recebida!\n\nPlaca: *${opts.placa}*${proprietario}${contato}\nIndicado por: *${opts.nomeIndicador}* (seu indicador)\n\nAcesse: https://indiqueplaca.com.br/gestor/meus-leads`;
  return enviar(opts.telefoneGestor, msg);
}

export async function notificarNovaIndicacao(opts: {
  nomeIndicador: string;
  telefoneIndicador: string;
  placa: string;
  nomeLead?: string | null;
}) {
  const proprietario = opts.nomeLead ? ` (${opts.nomeLead})` : "";
  const msg = `Olá, *${opts.nomeIndicador}*!\n\nSua indicação da placa *${opts.placa}*${proprietario} foi recebida com sucesso.\n\nAssim que houver atualização, você será avisado. Obrigado por indicar!`;
  return enviar(opts.telefoneIndicador, msg);
}
