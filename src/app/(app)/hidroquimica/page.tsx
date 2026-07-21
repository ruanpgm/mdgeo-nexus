"use client";

import { AlertTriangle, Beaker, FlaskConical, MapPin } from "lucide-react";

import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/status-map";
import {
  getClienteNome,
  projetos,
  resultadosLaboratoriais,
} from "@/lib/mock-data";
import {
  getExcedenciasCONAMA,
  statusResultadoLaboratorial,
} from "@/lib/derivacoes";
import type { ParametroHidroquimico } from "@/lib/types";

const PARAMETRO_LABEL: Record<ParametroHidroquimico, string> = {
  ferro_dissolvido: "Ferro dissolvido",
  manganes_dissolvido: "Manganês dissolvido",
  nitrato: "Nitrato",
  sulfato: "Sulfato",
  cloreto: "Cloreto",
  solidos_dissolvidos_totais: "Sólidos dissolvidos totais",
};

export default function HidroquimicaPage() {
  const excedencias = getExcedenciasCONAMA();
  const parametrosUnicos = new Set(
    resultadosLaboratoriais.map((r) => r.parametro),
  ).size;
  const laboratorios = new Set(
    resultadosLaboratoriais.map((r) => r.laboratorio),
  ).size;
  const pontosUnicos = new Set(
    resultadosLaboratoriais.map((r) => r.pontoColeta),
  ).size;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hidroquímica"
        description="Boletins de laboratório (ISO 17025) contra a classificação de águas subterrâneas da Resolução CONAMA 396/2008. Dados fictícios para demonstração."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Boletins processados"
          value={resultadosLaboratoriais.length}
          icon={FlaskConical}
        />
        <KpiCard label="Pontos de coleta" value={pontosUnicos} icon={MapPin} />
        <KpiCard
          label="Parâmetros monitorados"
          value={parametrosUnicos}
          icon={Beaker}
        />
        <KpiCard
          label="Excedências ao VMP"
          value={excedencias.length}
          icon={AlertTriangle}
          tone={excedencias.length > 0 ? "critical" : "success"}
          hint={`${laboratorios} laboratórios parceiros`}
        />
      </div>

      {excedencias.length > 0 && (
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle>Excedências à CONAMA 396/2008</CardTitle>
            <CardDescription>
              Parâmetros acima ou próximos do Valor Máximo Permitido (VMP) para
              a classe do aquífero.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {excedencias.map((r) => {
              const projeto = projetos.find((p) => p.id === r.projetoId);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {PARAMETRO_LABEL[r.parametro]} · {r.pontoColeta}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {projeto?.nome} ·{" "}
                      {projeto && getClienteNome(projeto.clienteId)} · Classe{" "}
                      {r.classeAquifero}
                    </p>
                  </div>
                  <StatusBadge
                    status={statusResultadoLaboratorial(r)}
                    className="shrink-0"
                  >
                    {r.valor} {r.unidade} (VMP {r.vmp})
                  </StatusBadge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Boletins por ponto de coleta</CardTitle>
          <CardDescription>
            Resultado, VMP aplicável e classe do aquífero por parâmetro
            analisado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ponto</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Parâmetro</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                  <TableHead className="text-right">VMP / Classe</TableHead>
                  <TableHead>Laboratório</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...resultadosLaboratoriais]
                  .sort((a, b) =>
                    b.dataResultado.localeCompare(a.dataResultado),
                  )
                  .map((r) => {
                    const projeto = projetos.find((p) => p.id === r.projetoId);
                    const status = statusResultadoLaboratorial(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.pontoColeta}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {projeto?.nome ?? "—"}
                        </TableCell>
                        <TableCell>{PARAMETRO_LABEL[r.parametro]}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {r.valor} {r.unidade}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                          {r.vmp} {r.unidade} (Classe {r.classeAquifero})
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.laboratorio}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {formatDate(r.dataResultado)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status}>
                            {status === "ok"
                              ? "Dentro do padrão"
                              : status === "atencao"
                                ? "Próximo do VMP"
                                : "Excedência"}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Sobre a classificação CONAMA 396/2008
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          A Resolução CONAMA nº 396/2008 classifica as águas subterrâneas em
          Classe Especial, 1, 2 e 3 e define o Valor Máximo Permitido (VMP) por
          parâmetro para cada classe — a régua usada aqui para apontar
          excedência. Amostragem e análise seguem laboratórios acreditados ISO
          17025, a mesma exigência já registrada nos contratos de monitoramento
          da carteira.
        </CardContent>
      </Card>
    </div>
  );
}
