"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Briefcase,
  CalendarClock,
  ChevronDown,
  FileText,
  HardHat,
  Heart,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/mtgl/status-badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatBRL,
  formatDate,
  prazoBucket,
  projetoStatusMap,
} from "@/lib/status-map";
import {
  HOJE,
  checklistsCampo,
  getClienteNome,
  getColaboradorNome,
  registrosDSSMA,
  setoresFinanceiro,
  tendenciaEmociograma,
  tendenciaMensal,
} from "@/lib/mock-data";
import {
  getAditivosDoProjeto,
  getAsoVencendoOuVencido,
  getCaixaAtual,
  getContasPagarComPrazo,
  getContasReceberComPrazo,
  getContratoDoProjeto,
  getCustoTotalOperacao,
  getEstoqueEpiComStatus,
  getImpeditivosComerciais,
  getPercentualConclusaoContrato,
  getProjetosPorCliente,
  getReceitaTotalContratada,
  getTendenciaSSMA,
  getTreinamentosAgendados,
  statusDoChecklist,
} from "@/lib/derivacoes";
import { useDataStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Projeto } from "@/lib/types";

/**
 * 3 personas, 3 setores — o que cada uma veria ao abrir o sistema hoje.
 * Willie Rodrigues Pena (Gerente Administrativo) e "Lucas" (Equipe SSMA) são
 * nomes reais das assinaturas/contatos dos documentos da MDGEO (Regras de
 * Ouro e Fluxograma de Comunicação de Acidente, ver docs desta sessão);
 * Marcos é um gerente comercial fictício — não há ninguém real documentado
 * para esse papel ainda. Nenhuma persona inventa dado: tudo aqui cruza com
 * o que já existe em Comercial, SSMA ou Financeiro.
 */
const custoConfig: ChartConfig = {
  custo: { label: "Custo mensal", color: "var(--chart-blue)" },
};
// Emociograma: mesmas cores semânticas do StatusBadge — humor é status.
const emociogramaConfig: ChartConfig = {
  otimo: { label: "Ótimo", color: "var(--success)" },
  bom: { label: "Bom", color: "var(--info)" },
  ruim: { label: "Ruim", color: "var(--destructive)" },
};
const acidentesConfig: ChartConfig = {
  acidentes: { label: "Acidentes", color: "var(--destructive)" },
};
const contratoConfig: ChartConfig = {
  pct: { label: "Conclusão", color: "var(--chart-blue)" },
};

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="willie">
        <TabsList>
          <TabsTrigger value="willie">Willie · Administrativo</TabsTrigger>
          <TabsTrigger value="marcos">Marcos · Comercial</TabsTrigger>
          <TabsTrigger value="lucas">Lucas · SSMA</TabsTrigger>
        </TabsList>

        <TabsContent value="willie" className="mt-4">
          <HomeWillie />
        </TabsContent>
        <TabsContent value="marcos" className="mt-4">
          <HomeMarcos />
        </TabsContent>
        <TabsContent value="lucas" className="mt-4">
          <HomeLucas />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Hero({
  nome,
  cargo,
  subtitulo,
}: {
  nome: string;
  cargo: string;
  subtitulo: string;
}) {
  return (
    <div className="relative col-span-1 overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-brand-green px-6 py-7 text-white shadow-md sm:col-span-2 lg:col-span-4">
      <div className="absolute -top-10 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 left-1/3 size-64 rounded-full bg-white/5 blur-3xl" />
      <div className="relative">
        <p className="flex items-center gap-1.5 text-sm font-medium text-white/75">
          <Sparkles className="size-4" /> MDGEO Nexus · {cargo}
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold tracking-tight">
          Bom dia, {nome.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-white/80">{subtitulo}</p>
      </div>
    </div>
  );
}

/* ==================================================== Marcos — Comercial */

type FaseComercial =
  "iniciando" | "ativo" | "finalizando" | "concluido" | "suspenso";

const IMPEDITIVO_TIPO_LABEL: Record<string, string> = {
  contrato: "Contrato",
  acidente: "Acidente",
  prazo: "Prazo",
  negociacao: "Negociação",
};

function faseComercial(p: Projeto): FaseComercial {
  if (p.status === "suspenso") return "suspenso";
  if (p.status === "concluido") return "concluido";
  if (p.status === "planejamento") return "iniciando";
  const fimEm = prazoBucket(p.dataFim, HOJE).dias;
  if (fimEm >= 0 && fimEm <= 60) return "finalizando";
  return "ativo";
}

function HomeMarcos() {
  const { projetos, contratos, aditivosContrato } = useDataStore();

  const ativos = projetos.filter((p) => faseComercial(p) === "ativo").length;
  const iniciando = projetos.filter(
    (p) => faseComercial(p) === "iniciando",
  ).length;
  const valorCarteira = projetos.reduce((a, p) => a + p.valorContrato, 0);

  const contratosAtivos = contratos
    .map((c) => {
      const projeto = projetos.find((p) => p.id === c.projetoId);
      return {
        nome: projeto?.nome.split(" ").slice(0, 2).join(" ") ?? c.projetoId,
        pct: getPercentualConclusaoContrato(c),
      };
    })
    .filter((c) => c.pct < 100);

  const porCliente = getProjetosPorCliente(projetos);
  const impeditivos = getImpeditivosComerciais(
    projetos,
    contratos,
    aditivosContrato,
  );
  const aditivosRecentes = [...aditivosContrato]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Hero
        nome="Marcos"
        cargo="Gerente Comercial"
        subtitulo={`${ativos} projetos ativos, ${iniciando} iniciando em breve · ${formatBRL(valorCarteira)} em carteira.`}
      />

      {/* Gráfico de desempenho — largura cheia agora que o aviso saiu */}
      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm">Conclusão dos contratos</CardTitle>
          <CardDescription>
            % de itens do checklist de contrato já concluídos, por projeto
          </CardDescription>
          <CardAction>
            <Link
              href="/comercial"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver Comercial →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={contratoConfig} className="h-[220px] w-full">
            <BarChart data={contratosAtivos} margin={{ left: 0, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="nome"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={32}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent formatter={(value) => `${value}%`} />
                }
              />
              <Bar
                dataKey="pct"
                fill="var(--color-pct)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Carteira completa em mini-cards — cada um abre o detalhe no Comercial */}
      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-4 text-info" /> Projetos
          </CardTitle>
          <CardDescription>
            Status, prazo de entrega, valor e pontos de atenção de cada contrato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projetos.map((p) => {
              const prazo = prazoBucket(p.dataFim, HOJE);
              // <= 60 dias do fim com projeto rodando = perto do encerramento
              const encerrando =
                p.status === "em_andamento" &&
                prazo.dias >= 0 &&
                prazo.dias <= 60;
              const contrato = getContratoDoProjeto(contratos, p.id);
              const qtdImpeditivos = contrato?.impeditivos.length ?? 0;
              const renegociacao = getAditivosDoProjeto(
                aditivosContrato,
                p.id,
              ).some((a) => a.status === "proposto");
              return (
                <Link
                  key={p.id}
                  href={`/comercial?open=${p.id}`}
                  className="flex flex-col gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getClienteNome(p.clienteId)}
                      </p>
                    </div>
                    <StatusBadge
                      status={projetoStatusMap[p.status].status}
                      className="shrink-0"
                    >
                      {projetoStatusMap[p.status].label}
                    </StatusBadge>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span
                      className={cn(
                        "truncate",
                        encerrando
                          ? "font-medium text-warning"
                          : "text-muted-foreground",
                      )}
                    >
                      Fim {formatDate(p.dataFim)} · {prazo.label}
                    </span>
                    <span className="shrink-0 font-mono font-semibold tabular-nums">
                      {formatBRL(p.valorContrato)}
                    </span>
                  </div>
                  {(encerrando || qtdImpeditivos > 0 || renegociacao) && (
                    <div className="flex flex-wrap gap-1.5">
                      {encerrando && (
                        <StatusBadge status="atencao">
                          Perto do encerramento do contrato
                        </StatusBadge>
                      )}
                      {qtdImpeditivos > 0 && (
                        <StatusBadge status="critico">
                          {qtdImpeditivos}{" "}
                          {qtdImpeditivos === 1 ? "impeditivo" : "impeditivos"}
                        </StatusBadge>
                      )}
                      {renegociacao && (
                        <StatusBadge status="atencao">
                          Renegociação pendente
                        </StatusBadge>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-success" /> Projetos por cliente
          </CardTitle>
          <CardDescription>
            Carteira consolidada, maior valor primeiro
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {porCliente.map((c) => (
            <Link
              key={c.clienteId}
              href={`/clientes?open=${c.clienteId}`}
              className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium hover:underline">
                  {c.clienteNome}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.qtdProjetos} {c.qtdProjetos === 1 ? "projeto" : "projetos"}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">
                {formatBRL(c.valorTotal)}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" /> Impeditivos do
            contrato
          </CardTitle>
          <CardDescription>
            Acidentes, prazos, travas de contrato e negociações em aberto
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {impeditivos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum impeditivo em aberto.
            </p>
          )}
          {impeditivos.map((imp, i) => (
            <Link
              key={`${imp.projetoId}-${imp.tipo}-${i}`}
              href={`/comercial?open=${imp.projetoId}`}
              className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium hover:underline">
                  {imp.projetoNome}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {imp.descricao}
                </p>
              </div>
              <StatusBadge status={imp.status} className="shrink-0">
                {IMPEDITIVO_TIPO_LABEL[imp.tipo]}
              </StatusBadge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Aditivos recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {aditivosRecentes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum aditivo registrado.
            </p>
          )}
          {aditivosRecentes.map((a) => {
            const projeto = projetos.find((p) => p.id === a.projetoId);
            return (
              <Link
                key={a.id}
                href={`/comercial?open=${a.projetoId}`}
                className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium hover:underline">
                    {projeto?.nome}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.descricao}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">
                  {formatBRL(a.valorAdicional)}
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/* ======================================================== Lucas — SSMA */

function HomeLucas() {
  const asoAlerta = getAsoVencendoOuVencido();
  const checklistsComDesvio = checklistsCampo.filter(
    (c) => statusDoChecklist(c) !== "ok",
  );
  const dssmaHoje = registrosDSSMA.filter((d) => d.data === HOJE);
  const tendencia = getTendenciaSSMA();
  const epiCritico = getEstoqueEpiComStatus().filter((e) => e.status !== "ok");
  const treinamentos = getTreinamentosAgendados().slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Hero
        nome="Lucas"
        cargo="Equipe SSMA"
        subtitulo={`${asoAlerta.length} ASO vencendo, ${checklistsComDesvio.length} checklists com desvio e ${epiCritico.length} itens de EPI críticos — visão completa do setor.`}
      />

      {/* Dois gráficos lado a lado: humor das equipes e acidentes */}
      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">DDSMA — Emociograma</CardTitle>
          <CardDescription>
            Como as equipes chegaram ao campo, mês a mês
          </CardDescription>
          <CardAction>
            <Link
              href="/ssma?tab=dssma"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver na aba SSMA →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={emociogramaConfig}
            className="h-[200px] w-full"
          >
            <BarChart data={tendenciaEmociograma} margin={{ left: 0, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="otimo"
                stackId="humor"
                fill="var(--color-otimo)"
                maxBarSize={32}
              />
              <Bar
                dataKey="bom"
                stackId="humor"
                fill="var(--color-bom)"
                maxBarSize={32}
              />
              <Bar
                dataKey="ruim"
                stackId="humor"
                fill="var(--color-ruim)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Acidentes no mês</CardTitle>
          <CardDescription>
            Histórico de 2026 — a régua de desempenho de segurança
          </CardDescription>
          <CardAction>
            <Link
              href="/ssma"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver na aba SSMA →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={acidentesConfig} className="h-[200px] w-full">
            <BarChart data={tendencia} margin={{ left: 0, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="acidentes"
                fill="var(--color-acidentes)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle>ASO vencido e a vencer</CardTitle>
          <CardDescription>
            Sem ASO válido não há acesso à área do cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {asoAlerta.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum ASO vencido ou vencendo.
            </p>
          )}
          {asoAlerta.slice(0, 5).map((a) => (
            <Link
              key={a.colaboradorId}
              href="/ssma"
              className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium hover:underline">{a.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.cargo}
                </p>
              </div>
              <StatusBadge status={a.prazo.status}>{a.prazo.label}</StatusBadge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle>Checklists com desvio</CardTitle>
          <CardDescription>
            Inspeções de campo que precisam de atenção
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {checklistsComDesvio.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum desvio em aberto.
            </p>
          )}
          {checklistsComDesvio.map((c) => (
            <Link
              key={c.id}
              href="/ssma?tab=checklists"
              className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <span className="truncate hover:underline">
                {c.local} · {formatDate(c.data)}
              </span>
              <StatusBadge status={statusDoChecklist(c)}>
                {statusDoChecklist(c) === "critico" ? "Reincidência" : "Desvio"}
              </StatusBadge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardHat className="size-4 text-warning" /> EPI — estoque crítico
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {epiCritico.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Estoque de EPI em dia.
            </p>
          )}
          {epiCritico.map((e) => (
            <Link
              key={e.id}
              href="/ssma"
              className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <span className="truncate hover:underline">
                {e.item}
                {e.tamanho && ` (${e.tamanho})`}
              </span>
              <StatusBadge status={e.status}>
                {e.motivo.join(" · ")}
              </StatusBadge>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" /> Treinamentos
            agendados
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {treinamentos.map((t) => (
            <Link
              key={t.id}
              href="/ssma"
              className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium hover:underline">{t.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.instrutor}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {formatDate(t.dataAgendada)}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Heart className="size-4 text-primary" /> DSSMA de hoje
          </CardTitle>
          <CardAction>
            <Link
              href="/ssma?tab=dssma"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver na aba SSMA →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {dssmaHoje.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum DSSMA registrado hoje ainda.
            </p>
          )}
          {dssmaHoje.map((d) =>
            d.participantes.map((p, i) => (
              <Link
                key={`${d.id}-${i}`}
                href="/ssma?tab=dssma"
                className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/60"
              >
                <span>{getColaboradorNome(p.colaboradorId)}</span>
                <StatusBadge
                  status={
                    p.estado === "otimo"
                      ? "ok"
                      : p.estado === "bom"
                        ? "atencao"
                        : "critico"
                  }
                >
                  {p.estado}
                </StatusBadge>
              </Link>
            )),
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =================================================== Willie — Administrativo */

function HomeWillie() {
  const receitaTotal = getReceitaTotalContratada();
  const custoTotal = getCustoTotalOperacao();
  const margemPct = Math.round(
    ((receitaTotal - custoTotal) / receitaTotal) * 100,
  );
  const caixa = getCaixaAtual();
  const contasReceber = getContasReceberComPrazo().slice(0, 4);
  const contasPagar = getContasPagarComPrazo().slice(0, 4);
  // Ordem fixa de leitura da diretoria: Pessoal → Logística → Mobilização →
  // GSE → Equipamentos. Um setor aberto por vez, mostrando os maiores gastos.
  const setores = [...setoresFinanceiro].sort((a, b) => a.ordem - b.ordem);
  const [setorAberto, setSetorAberto] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Hero
        nome="Willie Rodrigues Pena"
        cargo="Gerente Administrativo"
        subtitulo={`Margem consolidada de ${margemPct}% sobre ${formatBRL(receitaTotal)} em contratos, caixa em ${formatBRL(caixa.saldo)}.`}
      />

      <Card className="sm:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm">Evolução de custo mensal</CardTitle>
          <CardDescription>
            Custo consolidado da operação, mês a mês em 2026
          </CardDescription>
          <CardAction>
            <Link
              href="/financeiro?tab=diretoria"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver Financeiro →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={custoConfig} className="h-[220px] w-full">
            <AreaChart
              data={tendenciaMensal}
              margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillCustoHome" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-custo)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-custo)"
                    stopOpacity={0.03}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={42}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatBRL(Number(value))}
                  />
                }
              />
              <Area
                dataKey="custo"
                type="monotone"
                stroke="var(--color-custo)"
                fill="url(#fillCustoHome)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet className="size-4 text-primary" /> Caixa atual
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="font-mono text-2xl font-semibold tabular-nums">
            {formatBRL(caixa.saldo)}
          </p>
          <p className="text-xs text-muted-foreground">
            Entradas {formatBRL(caixa.entradas)} · Saídas{" "}
            {formatBRL(caixa.saidas)}
          </p>
          <Link
            href="/financeiro?tab=diretoria"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver Financeiro →
          </Link>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="size-4 text-success" /> Contas a receber
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {contasReceber.map((c) => (
            <Link
              key={c.id}
              href="/financeiro?tab=empresa"
              className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium hover:underline">
                  {c.descricao}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {getClienteNome(c.clienteId)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">
                {formatBRL(c.valor)}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="size-4 text-warning" /> Contas a pagar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {contasPagar.map((c) => (
            <Link
              key={c.id}
              href="/financeiro?tab=empresa"
              className="flex items-center justify-between gap-2 rounded-md -mx-2 px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium hover:underline">
                  {c.descricao}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.fornecedor}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">
                {formatBRL(c.valor)}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4 text-warning" /> Custo por setor —
            mês vigente
          </CardTitle>
          <CardDescription>
            Gasto de julho contra o orçamento — clique no setor para ver os
            maiores gastos
          </CardDescription>
          <CardAction>
            <Link
              href="/financeiro?tab=diretoria"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver completo →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {setores.map((s) => {
            const mesVigente = s.mensal[s.mensal.length - 1];
            const pct =
              mesVigente.orcamento > 0
                ? Math.round((mesVigente.gasto / mesVigente.orcamento) * 100)
                : 0;
            const aberto = setorAberto === s.id;
            return (
              <div key={s.id}>
                <button
                  onClick={() => setSetorAberto(aberto ? null : s.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 text-muted-foreground transition-transform",
                        aberto && "rotate-180",
                      )}
                    />
                    <span className="truncate font-medium">{s.nome}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline">
                      {formatBRL(mesVigente.gasto)} /{" "}
                      {formatBRL(mesVigente.orcamento)}
                    </span>
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          pct >= 100
                            ? "bg-destructive"
                            : pct >= 85
                              ? "bg-warning"
                              : "bg-success",
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </span>
                    <span className="w-10 text-right font-mono text-xs tabular-nums">
                      {pct}%
                    </span>
                  </span>
                </button>
                {aberto && (
                  <div className="mb-1 ml-6 flex flex-col gap-1 border-l pl-3">
                    {s.topGastos.map((g, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 py-0.5 text-xs"
                      >
                        <span className="min-w-0 truncate text-muted-foreground">
                          {g.descricao}
                        </span>
                        <span className="shrink-0 font-mono tabular-nums">
                          {formatBRL(g.valor)} · {formatDate(g.data)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
