const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = "Indique Placa <noreply@indiqueplaca.com.br>";

export async function enviarEmailOTP({
  email,
  codigo,
  nome,
}: {
  email: string;
  codigo: string;
  nome?: string;
}) {
  if (!RESEND_API_KEY) return false;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#04091a;padding:40px 20px;min-height:100vh">
      <div style="max-width:420px;margin:0 auto;background:#0c1425;border:1px solid rgba(245,158,11,.2);border-radius:16px;padding:36px 28px">
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:22px;font-weight:900;color:#f59e0b;letter-spacing:-0.5px">Indique Placa</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:4px">Sistema de indicações</div>
        </div>
        <p style="color:rgba(255,255,255,.7);font-size:14px;line-height:1.6;margin:0 0 24px">
          ${nome ? `Olá, <strong style="color:#fff">${nome}</strong>!<br><br>` : ""}
          Recebemos uma solicitação para redefinir sua senha. Use o código abaixo:
        </p>
        <div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <div style="font-size:38px;font-weight:900;letter-spacing:12px;color:#f59e0b;font-variant-numeric:tabular-nums">${codigo}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.35);margin-top:8px">Válido por 10 minutos</div>
        </div>
        <p style="color:rgba(255,255,255,.35);font-size:12px;line-height:1.6;margin:0">
          Se você não solicitou a redefinição de senha, ignore este email. Sua senha continua a mesma.
        </p>
        <div style="border-top:1px solid rgba(255,255,255,.08);margin-top:28px;padding-top:20px;text-align:center">
          <div style="font-size:11px;color:rgba(255,255,255,.2)">indiqueplaca.com.br</div>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: `${codigo} é seu código de verificação - Indique Placa`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
