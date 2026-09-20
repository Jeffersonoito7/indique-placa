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
        Última atualização: julho de 2025
      </p>

      {[
        {
          titulo: "1. Aceitação dos Termos",
          texto: "Ao acessar ou usar a plataforma Indique Placa, você concorda com estes Termos de Uso. Se não concordar com qualquer parte, não utilize o serviço.",
        },
        {
          titulo: "2. Descrição do Serviço",
          texto: "O Indique Placa é uma plataforma que conecta indicadores (pessoas que identificam veículos potenciais clientes) a consultores de proteção veicular. O serviço facilita o registro de indicações e o pagamento de comissões mediante a conclusão de vendas.",
        },
        {
          titulo: "3. Cadastro e Responsabilidade",
          texto: "Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. As informações fornecidas no cadastro devem ser verdadeiras e atualizadas.",
        },
        {
          titulo: "4. Comissões e Pagamentos",
          texto: "As comissões são definidas pelo consultor responsável e pagas via PIX após a confirmação do fechamento da venda. O Indique Placa não garante o pagamento de comissões — este é de responsabilidade do consultor. O valor das comissões pode variar conforme o tipo de veículo e configuração do consultor.",
        },
        {
          titulo: "5. Conduta Proibida",
          texto: "É proibido: cadastrar informações falsas, usar o sistema para atividades ilegais, tentar acessar contas de outros usuários, fazer engenharia reversa da plataforma, ou realizar qualquer ação que prejudique outros usuários ou o funcionamento do serviço.",
        },
        {
          titulo: "6. Privacidade dos Dados",
          texto: "O tratamento de dados pessoais segue nossa Política de Privacidade, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018). Ao usar o serviço, você autoriza o tratamento dos seus dados para as finalidades descritas na Política de Privacidade.",
        },
        {
          titulo: "7. Limitação de Responsabilidade",
          texto: "O Indique Placa é disponibilizado 'como está'. Não garantimos disponibilidade ininterrupta e não nos responsabilizamos por danos decorrentes de uso indevido, interrupções do serviço ou perda de dados.",
        },
        {
          titulo: "8. Alterações dos Termos",
          texto: "Podemos atualizar estes Termos periodicamente. As alterações entram em vigor na data de publicação. O uso continuado do serviço após a publicação implica aceitação dos novos termos.",
        },
        {
          titulo: "9. Contato",
          texto: "Dúvidas sobre estes Termos? Entre em contato conosco pelo e-mail disponível na plataforma.",
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
