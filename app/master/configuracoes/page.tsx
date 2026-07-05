export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Globe, Phone, Mail, MapPin, Building2, AlertCircle } from "lucide-react";

async function getConfig() {
  try {
    const { data, error } = await supabaseAdmin
      .from("configuracoes")
      .select("*")
      .limit(1)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

function Campo({ label, valor, icon: Icon }: { label: string; valor?: string | null; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-4 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm text-foreground font-medium">
          {valor ? valor : <span className="text-muted-foreground/50 italic text-xs">nao configurado</span>}
        </div>
      </div>
    </div>
  );
}

export default async function ConfiguracoesPage() {
  const config = await getConfig();

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-base font-bold text-foreground">Configuracoes</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Dados e parametros da plataforma</p>
      </div>

      <div className="flex-1 p-8 bg-muted/30">
        {!config ? (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-1">Configuracoes nao encontradas</div>
                <p className="text-xs text-muted-foreground">
                  A tabela <code className="bg-muted px-1 rounded text-[11px]">configuracoes</code> ainda nao possui registros.
                  Insira os dados diretamente no Supabase ou aguarde a tela de edicao.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-2xl space-y-5">
            <Card className="border-t-4 border-t-blue-500 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-500" />
                  Dados da Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Campo label="Nome da plataforma" valor={config.nome_plataforma} icon={Building2} />
                <Campo label="Site" valor={config.site} icon={Globe} />
                <Campo label="Email de contato" valor={config.email} icon={Mail} />
                <Campo label="Telefone" valor={config.telefone} icon={Phone} />
                <Campo label="Endereco" valor={config.endereco} icon={MapPin} />
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Edicao de configuracoes disponivel em breve. Por enquanto, edite diretamente no painel do Supabase.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
