export default function TermosPage() {
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

      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Termos de Uso</h1>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 32 }}>
        Ultima atualizacao: julho de 2025
      </p>

      {[
        {
          titulo: "1. Aceitacao dos Termos",
          texto: "Ao acessar ou usar a plataforma Indique Placa, voce concorda com estes Termos de Uso. Se nao concordar com qualquer parte, nao utilize o servico.",
        },
        {
          titulo: "2. Descricao do Servico",
          texto: "O Indique Placa e uma plataforma que conecta indicadores (pessoas que identificam veiculos potenciais clientes) a consultores de protecao veicular. O servico facilita o registro de indicacoes e o pagamento de comissoes mediante a conclusao de vendas.",
        },
        {
          titulo: "3. Cadastro e Responsabilidade",
          texto: "Voce e responsavel por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. As informacoes fornecidas no cadastro devem ser verdadeiras e atualizadas.",
        },
        {
          titulo: "4. Comissoes e Pagamentos",
          texto: "As comissoes sao definidas pelo consultor responsavel e pagas via PIX apos a confirmacao do fechamento da venda. O Indique Placa nao garante o pagamento de comissoes — este e de responsabilidade do consultor. O valor das comissoes pode variar conforme o tipo de veiculo e configuracao do consultor.",
        },
        {
          titulo: "5. Conducta Proibida",
          texto: "E proibido: cadastrar informacoes falsas, usar o sistema para atividades ilegais, tentar acessar contas de outros usuarios, fazer engenharia reversa da plataforma, ou realizar qualquer acao que prejudique outros usuarios ou o funcionamento do servico.",
        },
        {
          titulo: "6. Privacidade dos Dados",
          texto: "O tratamento de dados pessoais segue nossa Politica de Privacidade, em conformidade com a Lei Geral de Protecao de Dados (LGPD — Lei 13.709/2018). Ao usar o servico, voce autoriza o tratamento dos seus dados para as finalidades descritas na Politica de Privacidade.",
        },
        {
          titulo: "7. Limitacao de Responsabilidade",
          texto: "O Indique Placa e disponibilizado 'como esta'. Nao garantimos disponibilidade ininterrupta e nao nos responsabilizamos por danos decorrentes de uso indevido, interrupcoes do servico ou perda de dados.",
        },
        {
          titulo: "8. Alteracoes dos Termos",
          texto: "Podemos atualizar estes Termos periodicamente. As alteracoes entram em vigor na data de publicacao. O uso continuado do servico apos a publicacao implica aceitacao dos novos termos.",
        },
        {
          titulo: "9. Contato",
          texto: "Duvidas sobre estes Termos? Entre em contato conosco pelo e-mail disponivel na plataforma.",
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
