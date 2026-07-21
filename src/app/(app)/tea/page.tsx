"use client";

import { Battery, Plane, Radio, Wifi } from "lucide-react";

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
  estacoesTelemetria,
  getClienteNome,
  getColaboradorNome,
  levantamentosAereos,
  projetos,
} from "@/lib/mock-data";
import { statusEstacaoTelemetria } from "@/lib/derivacoes";
import { cn } from "@/lib/utils";
import type { StatusLevantamento, TipoLevantamento } from "@/lib/types";

const TIPO_ESTACAO_LABEL: Record<string, string> = {
  nivel_dagua: "Nível d'água",
  vazao: "Vazão",
  multiparametro: "Multiparâmetro",
};

const CONEXAO_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  instavel: "Instável",
};

const TIPO_LEVANTAMENTO_LABEL: Record<TipoLevantamento, string> = {
  drone: "Drone",
  vant: "VANT",
  geofisica: "Geofísica",
};

const STATUS_LEVANTAMENTO_LABEL: Record<StatusLevantamento, string> = {
  planejado: "Planejado",
  em_execucao: "Em execução",
  processando_dados: "Processando dados",
  concluido: "Concluído",
};

const STATUS_LEVANTAMENTO_MAP: Record<
  StatusLevantamento,
  "ok" | "info" | "atencao" | "neutro"
> = {
  planejado: "neutro",
  em_execucao: "info",
  processando_dados: "atencao",
  concluido: "ok",
};

export default function TeaPage() {
  const online = estacoesTelemetria.filter(
    (e) => e.statusConexao === "online",
  ).length;
  const comAlerta = estacoesTelemetria.filter(
    (e) => statusEstacaoTelemetria(e) !== "ok",
  ).length;
  const concluidos = levantamentosAereos.filter(
    (l) => l.status === "concluido",
  ).length;
  const areaTotal = levantamentosAereos.reduce((a, l) => a + l.areaHectares, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="TEA — Tecnologia e Automação"
        description="Telemetria remota, levantamentos aéreos (drone/VANT) e geofísica — os mesmos serviços de tecnologia que a MDGEO presta na operação real. Dados fictícios para demonstração."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Estações online"
          value={online}
          icon={Wifi}
          tone="success"
          hint={`${estacoesTelemetria.length} estações no total`}
        />
        <KpiCard
          label="Estações com alerta"
          value={comAlerta}
          icon={Radio}
          tone={comAlerta > 0 ? "critical" : "success"}
        />
        <KpiCard
          label="Levantamentos concluídos"
          value={concluidos}
          icon={Plane}
        />
        <KpiCard
          label="Área levantada"
          value={`${areaTotal} ha`}
          icon={Plane}
          tone="info"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="size-4 text-primary" /> Estações de telemetria
            remota
          </CardTitle>
          <CardDescription>
            Sensores de nível, vazão e multiparâmetro com transmissão
            automática.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estação</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Última transmissão</TableHead>
                  <TableHead className="text-right">Bateria</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estacoesTelemetria.map((e) => {
                  const projeto = projetos.find((p) => p.id === e.projetoId);
                  const status = statusEstacaoTelemetria(e);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {projeto?.nome}{" "}
                        {projeto && `· ${getClienteNome(projeto.clienteId)}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {TIPO_ESTACAO_LABEL[e.tipo]}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {e.ultimaTransmissao}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "flex items-center justify-end gap-1 font-mono tabular-nums",
                            e.bateriaPct < 25 &&
                              "font-semibold text-destructive",
                          )}
                        >
                          <Battery className="size-3.5" /> {e.bateriaPct}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status}>
                          {CONEXAO_LABEL[e.statusConexao]}
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
          <CardTitle className="flex items-center gap-2">
            <Plane className="size-4 text-primary" /> Levantamentos aéreos e
            geofísica
          </CardTitle>
          <CardDescription>
            Drone, VANT e geofísica — captura e processamento de dados de campo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {levantamentosAereos.map((l) => {
            const projeto = projetos.find((p) => p.id === l.projetoId);
            return (
              <div key={l.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {TIPO_LEVANTAMENTO_LABEL[l.tipo]} · {projeto?.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {projeto && getClienteNome(projeto.clienteId)} ·{" "}
                      {getColaboradorNome(l.responsavelId)} ·{" "}
                      {formatDate(l.data)} · {l.areaHectares} ha
                    </p>
                  </div>
                  <StatusBadge
                    status={STATUS_LEVANTAMENTO_MAP[l.status]}
                    className="shrink-0"
                  >
                    {STATUS_LEVANTAMENTO_LABEL[l.status]}
                  </StatusBadge>
                </div>
                {l.entregavel && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Entregável: {l.entregavel}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
