export const dynamic = "force-dynamic";
import { getConsultorLogado } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail, Link2, Copy } from "lucide-react";
import CopiarLink from "./copiar-link";

export default async function ConsultorPerfilPage() {
  const consultor = await getConsultorLogado();
  if (!consultor) redirect("/consultor/login");

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://indiqueplaca.com.br";
  const linkIndicacao = `${base}/indique?c=${consultor.id}`;
  const linkIndicador = `${base}/indicador/cadastro?c=${consultor.id}`;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Meu Perfil</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Seus dados e links de captação</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-2xl space-y-5">
          <Card className="border-t-4 border-t-emerald-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" /> Dados Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-3 py-3 border-b border-border">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Nome</div>
                  <div className="text-sm font-medium text-foreground">{consultor.nome}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-border">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Telefone</div>
                  <div className="text-sm font-medium text-foreground font-mono">{consultor.fone}</div>
                </div>
              </div>
              {consultor.email && (
                <div className="flex items-center gap-3 py-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Email</div>
                    <div className="text-sm font-medium text-foreground">{consultor.email}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-500" /> Meus Links de Captação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <CopiarLink titulo="Link de Indicação" descricao="Envie para clientes indicarem conhecidos" url={linkIndicacao} cor="blue" />
              <CopiarLink titulo="Link para Indicadores" descricao="Envie para pessoas que querem te ajudar a captar" url={linkIndicador} cor="violet" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
