export default function PrivacidadePage() {
  return (
    <div style={{
      maxWidth: 720, margin: "0 auto", padding: "48px 24px",
      fontFamily: "Inter, system-ui, sans-serif", color: "var(--foreground)",
      lineHeight: 1.7,
    }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/" style={{ fontSize: 13, color: "var(--muted-foreground)", textDecoration: "none" }}>
          ← Voltar
        </a>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Política de Privacidade</h1>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 32 }}>
        Última atualização: julho de 2025
      </p>

      {[
        {
          titulo: "1. Quem somos",
          texto: "O Indique Placa é uma plataforma de gestão de indicações para consultores de proteção veicular. Esta Política descreve como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a LGPD (Lei 13.709/2018).",
        },
        {
          titulo: "2. Dados que coletamos",
          texto: "Coletamos: nome completo, endereço de e-mail, número de telefone/WhatsApp, chave PIX (quando informada voluntariamente), dados de acesso (IP, data e hora de login), e dados de uso da plataforma (indicações realizadas, status de vendas).",
        },
        {
          titulo: "3. Finalidade do tratamento",
          texto: "Seus dados são usados para: criar e gerenciar sua conta, processar e registrar indicações de veículos, calcular e registrar comissões, enviar notificações relacionadas ao serviço (push, e-mail, WhatsApp), e cumprir obrigações legais.",
        },
        {
          titulo: "4. Compartilhamento de dados",
          texto: "Não vendemos seus dados. Compartilhamos apenas: com consultores responsáveis pelas suas indicações (nome e contato do lead), com provedores de serviço essenciais (Supabase para banco de dados, Resend para e-mails, Evolution API para WhatsApp), e com autoridades quando exigido por lei.",
        },
        {
          titulo: "5. Retenção de dados",
          texto: "Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento da conta, excluímos ou anonimizamos os dados em até 90 dias, salvo obrigação legal de retenção.",
        },
        {
          titulo: "6. Seus direitos (LGPD)",
          texto: "Você tem direito a: acessar seus dados, corrigir dados incorretos, solicitar exclusão dos seus dados, revogar consentimento, solicitar portabilidade, e obter informações sobre o uso dos seus dados. Para exercer esses direitos, entre em contato conosco.",
        },
        {
          titulo: "7. Segurança",
          texto: "Adotamos medidas técnicas e organizacionais para proteger seus dados: senhas armazenadas com hash bcrypt, comunicação via HTTPS, tokens de sessão assinados com HMAC, e acesso ao banco restrito por autenticação.",
        },
        {
          titulo: "8. Cookies",
          texto: "Usamos cookies de sessão (httpOnly, Secure, SameSite=Strict) exclusivamente para autenticação. Não usamos cookies de rastreamento ou publicidade de terceiros.",
        },
        {
          titulo: "9. Contato e DPO",
          texto: "Para questões sobre privacidade ou para exercer seus direitos, entre em contato pelo e-mail disponível na plataforma. Nos comprometemos a responder em até 15 dias úteis.",
        },
      ].map(({ titulo, texto }) => (
        <div key={titulo} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{titulo}</h2>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)", margin: 0 }}>{texto}</p>
        </div>
      ))}
    </div>
  );
}
