export type TipoPix = "cpf" | "cnpj" | "telefone" | "email" | "aleatoria" | "desconhecida";

export interface InfoPix {
  tipo: TipoPix;
  label: string;
  descricao: string;
}

export function detectarTipoPix(chave: string): InfoPix {
  const c = chave.trim();

  if (!c) return { tipo: "desconhecida", label: "Chave PIX", descricao: "" };

  // E-mail
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) {
    return { tipo: "email", label: "E-mail", descricao: "Chave PIX por e-mail" };
  }

  // UUID aleatória
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) {
    return { tipo: "aleatoria", label: "Chave Aleatória", descricao: "Chave PIX aleatória" };
  }

  // Só dígitos (ou formatado com pontos/traços/parênteses)
  const digitos = c.replace(/\D/g, "");

  if (digitos.length === 11) {
    // Pode ser CPF ou celular (11 dígitos com DDD)
    // Celular começa com 9 após o DDD (posição 2)
    if (digitos[2] === "9") {
      return { tipo: "telefone", label: "Telefone", descricao: "Chave PIX por telefone celular" };
    }
    return { tipo: "cpf", label: "CPF", descricao: "Chave PIX por CPF" };
  }

  if (digitos.length === 14) {
    return { tipo: "cnpj", label: "CNPJ", descricao: "Chave PIX por CNPJ" };
  }

  // Telefone com +55 ou 55 + 10/11 dígitos
  if (/^\+?55\d{10,11}$/.test(digitos)) {
    return { tipo: "telefone", label: "Telefone", descricao: "Chave PIX por telefone" };
  }

  return { tipo: "desconhecida", label: "Chave PIX", descricao: "Tipo não identificado" };
}

// Badge de cor por tipo
export function corTipoPix(tipo: TipoPix): string {
  switch (tipo) {
    case "cpf":       return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "cnpj":      return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
    case "telefone":  return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    case "email":     return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "aleatoria": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    default:          return "bg-muted text-muted-foreground border-border";
  }
}
