import "server-only";
import EfiPay from "sdk-node-apis-efi";

export function criarEfiMaster(): EfiPay {
  const client_id = process.env.MASTER_EFI_CLIENT_ID;
  const client_secret = process.env.MASTER_EFI_CLIENT_SECRET;
  const certificate = process.env.MASTER_EFI_CERTIFICATE_BASE64;

  if (!client_id || !client_secret || !certificate) {
    throw new Error("Credenciais Efi do master nao configuradas. Defina MASTER_EFI_CLIENT_ID, MASTER_EFI_CLIENT_SECRET e MASTER_EFI_CERTIFICATE_BASE64 no Vercel.");
  }

  return new EfiPay({
    sandbox: false,
    client_id,
    client_secret,
    certificate,
    cert_base64: true,
  });
}

export function masterEfiConfigurado(): boolean {
  return Boolean(
    process.env.MASTER_EFI_CLIENT_ID &&
    process.env.MASTER_EFI_CLIENT_SECRET &&
    process.env.MASTER_EFI_CERTIFICATE_BASE64 &&
    process.env.MASTER_EFI_PIX_KEY
  );
}
