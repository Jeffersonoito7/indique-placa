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

      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Politica de Privacidade</h1>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 32 }}>
        Ultima atualizacao: julho de 2025
      </p>

      {[
        {
          titulo: "1. Quem somos",
          texto: "O Indique Placa e uma plataforma de gestao de indicacoes para consultores de protecao veicular. Esta Politica descreve como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a LGPD (Lei 13.709/2018).",
        },
        {
          titulo: "2. Dados que coletamos",
          texto: "Coletamos: nome completo, endereco de e-mail, numero de telefone/WhatsApp, chave PIX (quando informada voluntariamente), dados de acesso (IP, data e hora de login), e dados de uso da plataforma (indicacoes realizadas, status de vendas).",
        },
        {
          titulo: "3. Finalidade do tratamento",
          texto: "Seus dados sao usados para: criar e gerenciar sua conta, processar e registrar indicacoes de veiculos, calcular e registrar comissoes, enviar notificacoes relacionadas ao servico (push, e-mail, WhatsApp), e cumprir obrigacoes legais.",
        },
        {
          titulo: "4. Compartilhamento de dados",
          texto: "Nao vendemos seus dados. Compartilhamos apenas: com consultores responsaveis pelas suas indicacoes (nome e contato do lead), com provedores de servico essenciais (Supabase para banco de dados, Resend para e-mails, Evolution API para WhatsApp), e com autoridades quando exigido por lei.",
        },
        {
          titulo: "5. Retencao de dados",
          texto: "Mantemos seus dados enquanto sua conta estiver ativa. Apos o encerramento da conta, excluimos ou anonimizamos os dados em ate 90 dias, salvo obrigacao legal de retencao.",
        },
        {
          titulo: "6. Seus direitos (LGPD)",
          texto: "Voce tem direito a: acessar seus dados, corrigir dados incorretos, solicitar exclusao dos seus dados, revogar consentimento, solicitar portabilidade, e obter informacoes sobre o uso dos seus dados. Para exercer esses direitos, entre em contato conosco.",
        },
        {
          titulo: "7. Seguranca",
          texto: "Adotamos medidas tecnicas e organizacionais para proteger seus dados: senhas armazenadas com hash bcrypt, comunicacao via HTTPS, tokens de sessao assinados com HMAC, e acesso ao banco restrito por autenticacao.",
        },
        {
          titulo: "8. Cookies",
          texto: "Usamos cookies de sessao (httpOnly, Secure, SameSite=Strict) exclusivamente para autenticacao. Nao usamos cookies de rastreamento ou publicidade de terceiros.",
        },
        {
          titulo: "9. Contato e DPO",
          texto: "Para questoes sobre privacidade ou para exercer seus direitos, entre em contato pelo e-mail disponivel na plataforma. Nos comprometemos a responder em ate 15 dias uteis.",
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
