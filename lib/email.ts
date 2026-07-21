const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = "Indique Placa <noreply@indiqueplaca.com.br>";

async function enviarEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function enviarEmailBoasVindas({
  email,
  nome,
  tipo,
}: {
  email: string;
  nome: string;
  tipo: "consultor" | "indicador" | "gestor";
}) {
  const labelTipo = tipo === "consultor" ? "Consultor" : tipo === "gestor" ? "Gestor" : "Indicador";
  const linkAccesso = tipo === "consultor"
    ? "https://indiqueplaca.com.br/consultor/login"
    : tipo === "gestor"
    ? "https://indiqueplaca.com.br/gestor/login"
    : "https://indiqueplaca.com.br/indicador/login";

  const mensagemTipo = tipo === "consultor"
    ? "Agora voce pode gerenciar suas indicacoes, acompanhar leads e fechar vendas."
    : tipo === "gestor"
    ? "Agora voce pode gerenciar sua equipe de consultores e acompanhar o desempenho."
    : "Agora voce pode indicar placas de veiculos e ganhar comissoes a cada venda fechada.";

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#04091a;padding:40px 20px;min-height:100vh">
      <div style="max-width:420px;margin:0 auto;background:#0c1425;border:1px solid rgba(245,158,11,.2);border-radius:16px;padding:36px 28px">
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:22px;font-weight:900;color:#f59e0b;letter-spacing:-0.5px">Indique Placa</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:4px">Sistema de indicacoes</div>
        </div>
        <p style="color:rgba(255,255,255,.7);font-size:14px;line-height:1.6;margin:0 0 16px">
          Ola, <strong style="color:#fff">${nome}</strong>!
        </p>
        <p style="color:rgba(255,255,255,.7);font-size:14px;line-height:1.6;margin:0 0 24px">
          Seu cadastro como <strong style="color:#f59e0b">${labelTipo}</strong> foi realizado com sucesso. ${mensagemTipo}
        </p>
        <div style="text-align:center;margin-bottom:24px">
          <a
            href="${linkAccesso}"
            style="display:inline-block;padding:12px 28px;background:#f59e0b;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none;letter-spacing:.5px"
          >
            ACESSAR AGORA
          </a>
        </div>
        <p style="color:rgba(255,255,255,.35);font-size:12px;line-height:1.6;margin:0">
          Se voce nao se cadastrou no Indique Placa, ignore este e-mail.
        </p>
        <div style="border-top:1px solid rgba(255,255,255,.08);margin-top:28px;padding-top:20px;text-align:center">
          <div style="font-size:11px;color:rgba(255,255,255,.2)">indiqueplaca.com.br</div>
        </div>
      </div>
    </div>
  `;

  return enviarEmail(email, `Bem-vindo ao Indique Placa, ${nome}!`, html);
}

export async function enviarEmailOTP({
  email,
  codigo,
  nome,
}: {
  email: string;
  codigo: string;
  nome?: string;
}) {
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

  return enviarEmail(email, `${codigo} e seu codigo de verificacao - Indique Placa`, html);
}
