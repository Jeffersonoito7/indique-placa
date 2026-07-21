export const dynamic = "force-dynamic";
import { getAssociacaoLogada } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default async function AssociacaoPerfilPage() {
  const assoc = await getAssociacaoLogada();
  if (!assoc) redirect("/associacao/login");

  const campos: { label: string; value: string | null | undefined }[] = [
    { label: "Nome", value: assoc.nome },
    { label: "Email", value: assoc.email },
    { label: "Telefone", value: assoc.fone },
    { label: "Cidade", value: assoc.cidade },
    { label: "Estado", value: assoc.estado },
    { label: "Plano", value: assoc.plano },
    { label: "Status", value: assoc.status },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Perfil da Associacao</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Dados cadastrais</p>
      </div>
      <div className="flex-1 p-8 bg-muted/30">
        <Card className="shadow-sm max-w-lg">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-500" />
              {assoc.nome}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {campos.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-20 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-foreground">{value ?? <span className="italic text-muted-foreground/50">nao informado</span>}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
