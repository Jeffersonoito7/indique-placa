export const dynamic = "force-dynamic";
import { getGestorLogado } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Crown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function fmtData(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtTelBR(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

export default async function GestorPerfilPage() {
  const gestor = await getGestorLogado();
  if (!gestor) redirect("/gestor/login");

  const isPro = gestor.plano === "pro";

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Meu Perfil</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Informacoes da sua conta de gestor</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        <div className="max-w-lg space-y-4">

          {/* Avatar e plano */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-900 to-violet-900 flex items-center justify-center text-white text-2xl font-bold border border-indigo-500/30 shrink-0">
                  {gestor.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-foreground truncate">{gestor.nome}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Lider de Equipe</div>
                  <div className="mt-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                      isPro
                        ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {isPro && <Crown className="h-3 w-3" />}
                      Plano {isPro ? "Pro" : "Free"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold">Dados da Conta</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[
                { icon: User, label: "Nome", value: gestor.nome },
                { icon: Mail, label: "Email", value: gestor.email },
                { icon: Phone, label: "Telefone", value: gestor.fone ? fmtTelBR(gestor.fone) : null, placeholder: "Nao informado" },
              ].map(({ icon: Icon, label, value, placeholder }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
                    <div className={cn("text-sm mt-0.5", value ? "text-foreground" : "text-muted-foreground/50 italic")}>
                      {value ?? placeholder}
                    </div>
                  </div>
                </div>
              ))}

              {/* Plano expiracao (pro) */}
              {isPro && gestor.plano_ativo_ate && (
                <div className="flex items-center gap-4 px-5 py-4 border-t border-border">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Plano ativo ate</div>
                    <div className="text-sm mt-0.5 text-indigo-400 font-semibold">
                      {fmtData(gestor.plano_ativo_ate)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
