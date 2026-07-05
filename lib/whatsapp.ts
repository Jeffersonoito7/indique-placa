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
  nomeLead: string;
  telefoneLead: string;
  viaIndicador?: string | null;
}) {
  const via = opts.viaIndicador ? ` via indicador *${opts.viaIndicador}*` : "";
  const msg = `Ola, *${opts.nomeConsultor}*!\n\nVoce recebeu um novo lead${via}:\n\n*Nome:* ${opts.nomeLead}\n*Telefone:* ${opts.telefoneLead}\n\nAcesse o painel para acompanhar: https://app.indiqueplaca.com.br/consultor/leads`;
  return enviar(opts.telefoneConsultor, msg);
}

export async function notificarLeadFechado(opts: {
  nomeConsultor: string;
  telefoneConsultor: string;
  nomeLead: string;
}) {
  const msg = `Parabens, *${opts.nomeConsultor}*!\n\nO lead *${opts.nomeLead}* foi marcado como *FECHADO*.\n\nSua comissao foi registrada. Continue assim!`;
  return enviar(opts.telefoneConsultor, msg);
}

export async function notificarNovaIndicacao(opts: {
  nomeIndicador: string;
  telefoneIndicador: string;
  nomeLead: string;
}) {
  const msg = `Ola, *${opts.nomeIndicador}*!\n\nSua indicacao *${opts.nomeLead}* foi recebida com sucesso.\n\nAssim que houver atualizacao, voce sera avisado. Obrigado por indicar!`;
  return enviar(opts.telefoneIndicador, msg);
}
