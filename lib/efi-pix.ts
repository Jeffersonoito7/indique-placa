import EfiPay from "sdk-node-apis-efi";

interface CredenciaisEfi {
  client_id: string;
  client_secret: string;
  certificate_base64: string;
  pix_key: string;
}

interface ResultadoEnvio {
  ok: boolean;
  idEnvio?: string;
  status?: string;
  erro?: string;
}

export async function enviarPixIndicador({
  credenciais,
  chaveDestino,
  valorReais,
  idEnvio,
  descricao,
}: {
  credenciais: CredenciaisEfi;
  chaveDestino: string;
  valorReais: number;
  idEnvio: string;
  descricao?: string;
}): Promise<ResultadoEnvio> {
  if (valorReais <= 0) {
    return { ok: false, erro: "Valor invalido para envio PIX" };
  }

  const efi = new EfiPay({
    sandbox: false,
    client_id: credenciais.client_id,
    client_secret: credenciais.client_secret,
    certificate: credenciais.certificate_base64,
    cert_base64: true,
  });

  const resultado = await efi.pixSend(
    { idEnvio },
    {
      valor: valorReais.toFixed(2),
      pagador: {
        chave: credenciais.pix_key,
        infoPagador: descricao ?? "Comissao indicacao - Indique Placa",
      },
      favorecido: {
        chave: chaveDestino,
      },
    }
  ) as Record<string, unknown>;

  const status = resultado.status as string | undefined;
  return {
    ok: status !== "NAO_REALIZADO",
    idEnvio: resultado.idEnvio as string | undefined,
    status,
  };
}
