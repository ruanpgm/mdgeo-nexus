"use client";

/**
 * O "mini-SaaS" do projeto: overview start-to-end em tela dedicada, com o
 * toggle Diretor | Gestor — pedido explícito: SOMENTE a diretoria vê R$.
 * Em visão de gestor, todo valor monetário vira "•••".
 */

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CircleCheck,
  CircleDashed,
  Eye,
  Play,
  Route,
  Users,
  Wallet,
} from "lucide-react";

import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  campanhaStatusMap,
  formatBRL,
  formatDate,
  prazoBucket,
  projetoStatusMap,
  veiculoStatusMap,
} from "@/lib/status-map";
import {
  HOJE,
  colaboradores,
  getCampanhasDoProjeto,
  getClienteNome,
  getColaboradorNome,
  veiculos,
} from "@/lib/mock-data";
import {
  getAditivosDoProjeto,
  getConformidadeDaEquipe,
  getContratoDoProjeto,
  getPercentualConclusaoContrato,
  getRoadmapDoProjeto,
  statusDaConformidade,
} from "@/lib/derivacoes";
import { useDataStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { StatusSemantico } from "@/lib/types";
import {
  ConformidadeEquipe,
  CustoComparado,
  EquipamentosSolicitados,
  MateriaisDoProjeto,
  RoadmapDoProjeto,
} from "../secoes-projeto";

type VisaoValores = "diretor" | "gestor";

const TONE_BY_STATUS: Record<
  StatusSemantico,
  "success" | "warning" | "critical" | "info" | "default"
> = {
  ok: "success",
  atencao: "warning",
  critico: "critical",
  info: "info",
  neutro: "default",
};

const ADITIVO_STATUS_LABEL: Record<string, string> = {
  proposto: "Proposto",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const ADITIVO_STATUS_MAP: Record<string, "ok" | "atencao" | "critico"> = {
  proposto: "atencao",
  aprovado: "ok",
  recusado: "critico",
};

/** R$ que respeita o toggle: gestor vê "•••", diretoria vê o valor. */
function Dinheiro({
  valor,
  visivel,
  className,
}: {
  valor: number;
  visivel: boolean;
  className?: string;
}) {
  if (!visivel) {
    return (
      <span
        className={cn("font-mono", className)}
        title="Visível apenas para a diretoria"
      >
        •••
      </span>
    );
  }
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatBRL(valor)}
    </span>
  );
}

export default function ProjetoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const {
    projetos,
    contratos,
    aditivosContrato,
    etapasRoadmap,
    iniciarProjeto,
  } = useDataStore();
  const projeto = projetos.find((p) => p.id === id) ?? null;

  // Padrão Diretor para a demo mostrar tudo; o toggle demonstra o que o
  // gestor NÃO vê — nenhum valor em R$.
  const [visao, setVisao] = useState<VisaoValores>("diretor");
  const mostrarValores = visao === "diretor";

  if (!projeto) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          render={<Link href="/projetos" />}
        >
          <ArrowLeft className="size-3.5" /> Voltar para projetos
        </Button>
      </div>
    );
  }

  const map = projetoStatusMap[projeto.status];
  const prazo = prazoBucket(projeto.dataFim, HOJE);
  const etapas = getRoadmapDoProjeto(etapasRoadmap, projeto.id);
  const concluidas = etapas.filter((e) => e.status === "concluida").length;
  const pctRoadmap = etapas.length
    ? Math.round((concluidas / etapas.length) * 100)
    : 0;
  const conformidade = getConformidadeDaEquipe(projeto.id);
  const statusConf = statusDaConformidade(conformidade);
  const aptos = conformidade.filter((i) => i.status === "ok").length;
  const pctCusto = projeto.orcamento
    ? Math.round((projeto.custoAtual / projeto.orcamento) * 100)
    : 0;
  const contrato = getContratoDoProjeto(contratos, projeto.id);
  const aditivos = getAditivosDoProjeto(aditivosContrato, projeto.id);
  const campanhas = getCampanhasDoProjeto(projeto.id);
  const pctContrato = contrato ? getPercentualConclusaoContrato(contrato) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Volta para a lista — o breadcrumb mínimo que a tela precisa. */}
      <div className="flex flex-col gap-3">
        <Link
          href="/projetos"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Projetos
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {projeto.nome}
              </h1>
              <StatusBadge status={map.status}>{map.label}</StatusBadge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {getClienteNome(projeto.clienteId)} · Contrato {projeto.contrato}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border p-1">
              <Eye className="ml-1 size-3.5 text-muted-foreground" />
              {(["diretor", "gestor"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisao(v)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium capitalize transition-colors",
                    visao === v
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            {projeto.status === "planejamento" && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => iniciarProjeto(projeto.id)}
              >
                <Play className="size-3.5" /> Iniciar projeto
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Prazo de entrega"
          value={formatDate(projeto.dataFim)}
          hint={prazo.label}
          icon={CalendarClock}
          tone={TONE_BY_STATUS[prazo.status]}
        />
        <KpiCard
          label="Progresso do roadmap"
          value={`${pctRoadmap}%`}
          hint={`${concluidas} de ${etapas.length} etapas concluídas`}
          icon={Route}
        />
        <KpiCard
          label="Conformidade da equipe"
          value={
            conformidade.length ? `${aptos} de ${conformidade.length}` : "—"
          }
          hint={
            conformidade.length
              ? "liberados para entrar na área"
              : "Nenhum colaborador alocado."
          }
          icon={Users}
          tone={TONE_BY_STATUS[statusConf]}
        />
        <KpiCard
          label="Custo vs orçamento"
          value={mostrarValores ? `${pctCusto}%` : "•••"}
          hint={
            mostrarValores
              ? `${formatBRL(projeto.custoAtual)} de ${formatBRL(projeto.orcamento)}`
              : "Visível apenas para a diretoria"
          }
          icon={Wallet}
          tone={
            !mostrarValores
              ? "default"
              : pctCusto >= 90
                ? "critical"
                : pctCusto >= 75
                  ? "warning"
                  : "default"
          }
        />
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="equipe">Equipe &amp; Equipamentos</TabsTrigger>
          <TabsTrigger value="contrato">Contrato &amp; Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Serviço</p>
                  <p className="font-medium">{projeto.servico}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="font-medium">
                    {getColaboradorNome(projeto.responsavelId)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Período</p>
                  <p className="font-mono text-xs tabular-nums">
                    {formatDate(projeto.dataInicio)} –{" "}
                    {formatDate(projeto.dataFim)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Equipe</p>
                  <p className="font-medium">
                    {projeto.equipeIds.length}{" "}
                    {projeto.equipeIds.length === 1
                      ? "colaborador"
                      : "colaboradores"}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium">Descrição</p>
                <p className="text-sm text-muted-foreground">
                  {projeto.descricao}
                </p>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium">Detalhes de entrega</p>
                <p className="text-sm text-muted-foreground">
                  {projeto.detalhesEntrega}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-sm font-medium">Equipe alocada</p>
                <div className="flex flex-wrap gap-1.5">
                  {projeto.equipeIds.map((cid) => {
                    const c = colaboradores.find((x) => x.id === cid);
                    if (!c) return null;
                    return (
                      <span
                        key={cid}
                        className="rounded-md border bg-muted/40 px-2 py-1 text-xs"
                      >
                        {c.nome}
                        <span className="text-muted-foreground">
                          {" "}
                          · {c.cargo}
                        </span>
                      </span>
                    );
                  })}
                  {projeto.equipeIds.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum colaborador alocado.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Veículos</p>
                <div className="flex flex-wrap gap-1.5">
                  {projeto.veiculoIds.map((vid) => {
                    const v = veiculos.find((x) => x.id === vid);
                    if (!v) return null;
                    const impedido =
                      v.status === "bloqueado" || v.status === "manutencao";
                    return (
                      <span
                        key={vid}
                        className={cn(
                          "rounded-md border px-2 py-1 font-mono text-xs",
                          impedido
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : "bg-muted/40",
                        )}
                      >
                        {v.placa}
                        {impedido &&
                          ` · ${veiculoStatusMap[v.status].label.toLowerCase()}`}
                      </span>
                    );
                  })}
                  {projeto.veiculoIds.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum veículo alocado.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="mb-2 text-sm font-medium">
                Campanhas ({campanhas.length})
              </p>
              {campanhas.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma campanha registrada.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {campanhas.map((c) => {
                    const cMap = campanhaStatusMap[c.status];
                    return (
                      <div key={c.id} className="rounded-md border p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{c.nome}</span>
                          <StatusBadge status={cMap.status}>
                            {cMap.label}
                          </StatusBadge>
                        </div>
                        <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                          {formatDate(c.dataInicio)} – {formatDate(c.dataFim)} ·{" "}
                          {c.pontosColeta.length} pontos de coleta
                        </p>
                        {c.bloqueios.length > 0 && (
                          <ul className="mt-1.5 list-inside list-disc text-xs text-destructive">
                            {c.bloqueios.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4">
          <Card>
            <CardContent>
              <RoadmapDoProjeto projetoId={projeto.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-5">
              <ConformidadeEquipe projetoId={projeto.id} />
              <Separator />
              <EquipamentosSolicitados projetoId={projeto.id} />
              <MateriaisDoProjeto projetoId={projeto.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contrato" className="mt-4 flex flex-col gap-4">
          {contrato ? (
            <Card>
              <CardContent className="flex flex-col gap-5">
                <div>
                  <p className="mb-1 text-sm font-medium">Objeto do contrato</p>
                  <p className="text-sm text-muted-foreground">
                    {contrato.objeto}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium">Briefing</p>
                  <p className="text-sm text-muted-foreground">
                    {contrato.briefing}
                  </p>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Prazo de execução
                    </p>
                    <p className="font-medium">{contrato.prazoExecucao}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Condições de pagamento
                    </p>
                    <p className="font-medium">{contrato.condicoesPagamento}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium">Impeditivos</p>
                  {contrato.impeditivos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum impeditivo registrado.
                    </p>
                  ) : (
                    <ul className="list-inside list-disc text-xs text-destructive">
                      {contrato.impeditivos.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Checklist de conclusão</span>
                    <span className="font-mono tabular-nums">
                      {pctContrato}%
                    </span>
                  </div>
                  <Progress value={pctContrato} />
                  <ul className="mt-2 flex flex-col gap-1">
                    {contrato.checklist.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs">
                        {item.concluido ? (
                          <CircleCheck
                            className="size-3.5 shrink-0 text-success"
                            aria-hidden
                          />
                        ) : (
                          <CircleDashed
                            className="size-3.5 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                        )}
                        <span
                          className={cn(
                            item.concluido && "text-muted-foreground",
                          )}
                        >
                          {item.item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nenhum contrato vinculado ao projeto.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <p className="mb-2 text-sm font-medium">
                Aditivos ({aditivos.length})
              </p>
              {aditivos.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum aditivo registrado.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {aditivos.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-2 rounded-md border p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.descricao}</p>
                        <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                          {formatDate(a.data)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Dinheiro
                          valor={a.valorAdicional}
                          visivel={mostrarValores}
                          className="text-sm font-semibold"
                        />
                        <StatusBadge status={ADITIVO_STATUS_MAP[a.status]}>
                          {ADITIVO_STATUS_LABEL[a.status]}
                        </StatusBadge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-5">
              {/* Empilhado, não em colunas: valores em BRL não cabem lado a
                  lado e colidem. */}
              <dl className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-muted-foreground">
                    Valor do contrato
                  </dt>
                  <dd>
                    <Dinheiro
                      valor={projeto.valorContrato}
                      visivel={mostrarValores}
                      className="text-sm font-semibold"
                    />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-muted-foreground">
                    Orçamento interno
                  </dt>
                  <dd>
                    <Dinheiro
                      valor={projeto.orcamento}
                      visivel={mostrarValores}
                      className="text-sm"
                    />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t pt-2">
                  <dt className="text-xs text-muted-foreground">
                    Custo até agora
                  </dt>
                  <dd className="flex items-baseline gap-2">
                    <Dinheiro
                      valor={projeto.custoAtual}
                      visivel={mostrarValores}
                      className={cn(
                        "text-sm",
                        mostrarValores &&
                          pctCusto >= 90 &&
                          "font-semibold text-destructive",
                      )}
                    />
                    {mostrarValores && (
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        ({pctCusto}% do orçamento)
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              <CustoComparado
                projetoId={projeto.id}
                mostrarValores={mostrarValores}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
