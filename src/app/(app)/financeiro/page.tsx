"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  CreditCard,
  Factory,
  Fuel,
  Landmark,
  PackageCheck,
  TrendingUp,
  Truck,
  UsersRound,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { StatusDonut } from "@/components/mtgl/status-donut";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  campanhaStatusMap,
  formatBRL,
  formatDate,
  prazoBucket,
} from "@/lib/status-map";
import {
  HOJE,
  campanhas,
  dashboardKpis,
  fabricacoes,
  getClienteNome,
  getColaboradorNome,
  getDistribuicaoEquipamentos,
  getDistribuicaoVeiculos,
  projetos,
  setoresFinanceiro,
} from "@/lib/mock-data";
import {
  custoDoMaterial,
  fabricacaoAtrasada,
  getCaixaAtual,
  getComprasEmCampo,
  getContasPagarComPrazo,
  getContasReceberComPrazo,
  getCustoTotalOperacao,
  getCustosDoProjeto,
  getDespesasAdminPorCategoria,
  getFabricacaoDoMaterial,
  getFolhaDoMes,
  getGastoPorSetor,
  getMateriaisDoProjeto,
  getProjetosAtivosEAgendados,
  getProntidaoDoProjeto,
  getRankingContratos,
  getReceitaPorCliente,
  getReceitaTotalContratada,
  getResumoSetor,
  getTotalAPagar,
  getTotalAReceber,
  prazoDaFabricacao,
  statusDaProntidao,
  type Bloqueio,
  type GastoSetor,
  type ItemGasto,
  type PeriodoFinanceiro,
} from "@/lib/derivacoes";
import type { SetorFinanceiro } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORIA_LABEL: Record<string, string> = {
  construcao: "Construção",
  tubulacao: "Tubulação",
  consumivel: "Consumível",
  epi: "EPI",
  instrumentacao: "Instrumentação",
  outro: "Outro",
};

const ORIGEM_LABEL: Record<string, string> = {
  estoque: "Estoque",
  compra: "Compra cotada",
  fabricacao: "Fabricação",
  campo: "Comprado em campo",
};

const FABRICACAO_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  em_producao: "Em produção",
  pronto: "Pronto para retirada",
  entregue: "Entregue",
};

const CATEGORIA_ADMIN_LABEL: Record<string, string> = {
  aluguel: "Aluguel",
  utilidades: "Utilidades",
  software: "Software",
  contabilidade: "Contabilidade",
  marketing: "Marketing",
  seguros: "Seguros",
  outros: "Outros",
};

const CATEGORIA_PAGAR_LABEL: Record<string, string> = {
  ...CATEGORIA_ADMIN_LABEL,
  material: "Material",
  servico: "Serviço",
  locacao: "Locação",
  folha: "Folha",
};

export default function FinanceiroPage() {
  return (
    <Suspense fallback={null}>
      <FinanceiroContent />
    </Suspense>
  );
}

function FinanceiroContent() {
  const tabParam = useSearchParams().get("tab");
  const tabInicial = ["diretoria", "custos", "empresa", "campo"].includes(
    tabParam ?? "",
  )
    ? tabParam!
    : "diretoria";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financeiro"
        description="Visão de diretoria, orçamento por setor, financeiro da empresa e financeiro de campo. Dados fictícios para demonstração."
      />

      {/* key força remount quando o link da sidebar muda de aba via query — clique
          manual na TabsList não altera a URL, então não afeta este key. */}
      <Tabs defaultValue={tabInicial} key={tabInicial}>
        <TabsList>
          <TabsTrigger value="diretoria">Visão Diretoria</TabsTrigger>
          <TabsTrigger value="custos">Custos &amp; Orçamento</TabsTrigger>
          <TabsTrigger value="empresa">Financeiro da Empresa</TabsTrigger>
          <TabsTrigger value="campo">Financeiro de Campo</TabsTrigger>
        </TabsList>

        <TabsContent value="diretoria" className="mt-4">
          <DiretoriaView />
        </TabsContent>

        <TabsContent value="custos" className="mt-4">
          <CustosOrcamento />
        </TabsContent>

        <TabsContent value="empresa" className="mt-4">
          <FinanceiroEmpresa />
        </TabsContent>

        <TabsContent value="campo" className="mt-4">
          <FinanceiroCampo />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ======================================================== Visão Diretoria */

/**
 * Leitura agrupada e macro da saúde da empresa — não duplica as tabelas
 * detalhadas de Financeiro da Empresa/Campo, só o que um diretor olha
 * primeiro: faturamento, margem, caixa e o orçamento por setor.
 */
function DiretoriaView() {
  const receitaTotal = getReceitaTotalContratada();
  const custoTotal = getCustoTotalOperacao();
  const margemPct = Math.round(
    ((receitaTotal - custoTotal) / receitaTotal) * 100,
  );
  const caixa = getCaixaAtual();
  const totalReceber = getTotalAReceber();
  const totalPagar = getTotalAPagar();
  const campanhasAtivas = campanhas.filter((c) => c.status === "em_campo");
  const distEquipamentos = getDistribuicaoEquipamentos().map((d) => ({
    label: d.situacao,
    value: d.value,
    fill: d.fill,
  }));
  const distVeiculos = getDistribuicaoVeiculos().map((d) => ({
    label: d.status,
    value: d.value,
    fill: d.fill,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-brand-green px-6 py-7 text-white shadow-md">
        <div className="absolute -top-10 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 size-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/75">
              <Landmark className="size-4" /> MDGEO Nexus · Saúde consolidada da
              empresa
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              O que importa para a diretoria
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Visão agrupada, não o detalhe operacional — esse está nas outras
              abas.
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-white/70">Faturamento contratado</p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {formatBRL(receitaTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">Margem consolidada</p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {margemPct}%
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">Caixa atual</p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {formatBRL(caixa.saldo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Projetos em andamento"
          value={dashboardKpis.projetosEmAndamento}
          icon={TrendingUp}
          href="/comercial"
        />
        <KpiCard
          label="Campanhas em execução"
          value={dashboardKpis.campanhasEmExecucao}
          icon={Truck}
          tone="info"
          href="/projetos"
        />
        <KpiCard
          label="A receber"
          value={formatBRL(totalReceber)}
          icon={ArrowDownToLine}
          tone="success"
          href="/financeiro?tab=empresa"
        />
        <KpiCard
          label="A pagar"
          value={formatBRL(totalPagar)}
          icon={ArrowUpFromLine}
          tone="warning"
          href="/financeiro?tab=empresa"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Financeiro por setor</h2>
          <p className="text-xs text-muted-foreground">
            Gasto realizado vs. orçamento de cada setor operacional. O período
            é escolhido em cada card.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...setoresFinanceiro]
            .sort((a, b) => a.ordem - b.ordem)
            .map((s) => (
              <SetorFinanceiroCard key={s.id} setor={s} />
            ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Campanhas em execução</CardTitle>
          <CardDescription>
            Equipes atualmente mobilizadas em campo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanhasAtivas.map((c) => {
                  const projeto = projetos.find((p) => p.id === c.projetoId)!;
                  const map = campanhaStatusMap[c.status];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {projeto.nome}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getClienteNome(projeto.clienteId)}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {formatDate(c.dataInicio)} – {formatDate(c.dataFim)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={map.status}>
                          {map.label}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Equipamentos por situação</CardTitle>
            <CardDescription>Disponibilidade da frota técnica</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonut data={distEquipamentos} totalLabel="equipamentos" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Veículos por status</CardTitle>
            <CardDescription>Disponibilidade da frota 4x4</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonut data={distVeiculos} totalLabel="veículos" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const PERIODO_OPCOES: { value: PeriodoFinanceiro; label: string }[] = [
  { value: "mes", label: "Julho/2026" },
  { value: "trimestre", label: "Mai–Jul/2026" },
  { value: "ano", label: "Jan–Jul/2026" },
];

/**
 * Card de um setor com filtro de período próprio — cada card guarda seu
 * estado, para o diretor comparar setores em janelas diferentes lado a lado.
 * Faixas da barra seguem a mesma régua de Custos & Orçamento: >=100 estouro,
 * >=85 alerta, abaixo disso dentro do orçamento.
 */
function SetorFinanceiroCard({ setor }: { setor: SetorFinanceiro }) {
  const [periodo, setPeriodo] = useState<PeriodoFinanceiro>("mes");
  const resumo = getResumoSetor(setor, periodo);
  const estourado = resumo.pct >= 100;
  const alerta = resumo.pct >= 85;

  return (
    <Card
      className={cn(
        "gap-3 border-l-4 py-4",
        estourado
          ? "border-l-destructive"
          : alerta
            ? "border-l-warning"
            : "border-l-success",
      )}
    >
      <CardContent className="flex h-full flex-col px-4">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium">{setor.nome}</p>
          <Select
            value={periodo}
            onValueChange={(v) => setPeriodo(v as PeriodoFinanceiro)}
          >
            <SelectTrigger size="sm" className="shrink-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODO_OPCOES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {formatBRL(resumo.gasto)}
          </span>
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            de {formatBRL(resumo.orcamento)} orçados
          </span>
        </div>
        <Progress
          value={Math.min(100, resumo.pct)}
          className={cn(
            "mt-2",
            estourado
              ? "[&_[data-slot=progress-indicator]]:bg-destructive"
              : alerta
                ? "[&_[data-slot=progress-indicator]]:bg-warning"
                : "[&_[data-slot=progress-indicator]]:bg-success",
          )}
        />
        <p
          className={cn(
            "mt-1.5 text-xs",
            estourado
              ? "font-medium text-destructive"
              : "text-muted-foreground",
          )}
        >
          {resumo.pct}% do orçamento de {resumo.label}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{setor.descricao}</p>

        <div className="mt-auto flex flex-col pt-3">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Maiores gastos
          </p>
          <div className="mt-1 flex flex-col divide-y">
            {setor.topGastos.map((g) => (
              <div
                key={g.descricao}
                className="flex items-center justify-between gap-2 py-1.5 text-xs"
              >
                <span className="min-w-0 truncate">{g.descricao}</span>
                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                  {formatBRL(g.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ======================================================= Custos & Orçamento */

/**
 * Cards de gasto por setor vs. budget do mês. O clique abre UM modal com
 * navegação interna (lista de lançamentos → detalhe de um item), em vez de
 * empilhar modal sobre modal — mais acessível e consistente com o resto do
 * design system.
 */
function CustosOrcamento() {
  const mes = HOJE.slice(0, 7);
  const setores = getGastoPorSetor(mes);
  const [setorAberto, setSetorAberto] = useState<GastoSetor | null>(null);
  const [itemAberto, setItemAberto] = useState<ItemGasto | null>(null);

  function fechar() {
    setSetorAberto(null);
    setItemAberto(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-muted-foreground">
        Orçamento de {mes.split("-").reverse().join("/")} por setor. Clique num
        card para ver os lançamentos que compõem o valor.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {setores.map((s) => {
          const estourado = s.pct >= 100;
          const alerta = s.pct >= 85;
          return (
            <Card
              key={s.setor}
              onClick={() => setSetorAberto(s)}
              className={cn(
                "cursor-pointer gap-3 border-l-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                estourado
                  ? "border-l-destructive"
                  : alerta
                    ? "border-l-warning"
                    : "border-l-success",
              )}
            >
              <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-medium">{s.setorLabel}</p>
                  {s.setor === "combustivel" && (
                    <Fuel className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {formatBRL(s.atual)}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    de {formatBRL(s.budget)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, s.pct)}
                  className={cn(
                    "mt-2",
                    estourado
                      ? "[&_[data-slot=progress-indicator]]:bg-destructive"
                      : alerta
                        ? "[&_[data-slot=progress-indicator]]:bg-warning"
                        : undefined,
                  )}
                />
                <p
                  className={cn(
                    "mt-1.5 text-xs",
                    estourado
                      ? "font-medium text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {s.pct}% do orçamento · {s.itens.length} lançamentos
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!setorAberto} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {setorAberto && !itemAberto && (
            <>
              <DialogHeader>
                <DialogTitle>{setorAberto.setorLabel}</DialogTitle>
                <DialogDescription>
                  {formatBRL(setorAberto.atual)} de{" "}
                  {formatBRL(setorAberto.budget)} · {setorAberto.pct}% do
                  orçamento de {mes.split("-").reverse().join("/")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex min-w-0 flex-col gap-1.5 pb-2">
                {setorAberto.itens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum lançamento neste mês.
                  </p>
                ) : (
                  setorAberto.itens.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setItemAberto(item)}
                      className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                    >
                      <span className="min-w-0 truncate">{item.descricao}</span>
                      <span className="shrink-0 font-mono font-medium tabular-nums">
                        {formatBRL(item.valor)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {setorAberto && itemAberto && (
            <>
              <DialogHeader>
                <button
                  onClick={() => setItemAberto(null)}
                  className="mb-1 flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="size-3.5" /> Voltar para{" "}
                  {setorAberto.setorLabel}
                </button>
                <DialogTitle>{itemAberto.descricao}</DialogTitle>
                <DialogDescription>
                  {formatDate(itemAberto.data)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex min-w-0 flex-col gap-3 pb-2">
                <dl className="flex flex-col gap-2 rounded-md border p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">Valor</dt>
                    <dd className="font-mono text-sm font-semibold tabular-nums">
                      {formatBRL(itemAberto.valor)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">
                      % do setor
                    </dt>
                    <dd className="font-mono text-sm tabular-nums">
                      {setorAberto.atual > 0
                        ? Math.round(
                            (itemAberto.valor / setorAberto.atual) * 100,
                          )
                        : 0}
                      %
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">
                      % do orçamento total do setor
                    </dt>
                    <dd className="font-mono text-sm tabular-nums">
                      {setorAberto.budget > 0
                        ? Math.round(
                            (itemAberto.valor / setorAberto.budget) * 100,
                          )
                        : 0}
                      %
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==================================================== Financeiro da Empresa */

function FinanceiroEmpresa() {
  const receitaTotal = getReceitaTotalContratada();
  const custoTotal = getCustoTotalOperacao();
  const margemPct = Math.round(
    ((receitaTotal - custoTotal) / receitaTotal) * 100,
  );
  const caixa = getCaixaAtual();
  const totalReceber = getTotalAReceber();
  const totalPagar = getTotalAPagar();
  const folhaMes = getFolhaDoMes(HOJE.slice(0, 7));
  const receitaPorCliente = getReceitaPorCliente();
  const ranking = getRankingContratos();
  const contasReceber = getContasReceberComPrazo();
  const contasPagar = getContasPagarComPrazo();
  const despesasAdmin = getDespesasAdminPorCategoria();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Receita contratada"
          value={formatBRL(receitaTotal)}
          icon={TrendingUp}
          hint={`${projetos.length} contratos`}
        />
        <KpiCard
          label="Margem consolidada"
          value={`${margemPct}%`}
          icon={PackageCheck}
          tone="success"
          hint={`${formatBRL(receitaTotal - custoTotal)} de resultado`}
        />
        <KpiCard
          label="Caixa atual"
          value={formatBRL(caixa.saldo)}
          icon={Landmark}
          hint={`${caixa.mes.split("-").reverse().join("/")} · entradas ${formatBRL(caixa.entradas)}`}
        />
        <KpiCard
          label="A receber / a pagar"
          value={formatBRL(totalReceber - totalPagar)}
          icon={totalReceber >= totalPagar ? ArrowDownToLine : ArrowUpFromLine}
          tone={totalReceber >= totalPagar ? "success" : "warning"}
          hint={`${formatBRL(totalReceber)} vs ${formatBRL(totalPagar)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Receita e margem por cliente
            </CardTitle>
            <CardDescription>
              Valor contratado, custo até agora e margem consolidada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Contratado</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receitaPorCliente.map((r) => (
                    <TableRow key={r.clienteId}>
                      <TableCell>
                        <p className="font-medium">{r.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.projetos}{" "}
                          {r.projetos === 1 ? "projeto" : "projetos"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatBRL(r.valorContratado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            r.margemPct < 30
                              ? "font-semibold text-warning"
                              : "text-success",
                          )}
                        >
                          {r.margemPct}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Ranking de contratos por margem
            </CardTitle>
            <CardDescription>
              Do maior para o menor resultado sobre o valor contratado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="text-right">Contrato</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((r) => (
                    <TableRow key={r.projetoId}>
                      <TableCell>
                        <p className="font-medium">{r.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.cliente}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {formatBRL(r.valorContrato)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            r.margemPct < 30
                              ? "font-semibold text-warning"
                              : "text-success",
                          )}
                        >
                          {r.margemPct}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowDownToLine className="size-4 text-success" />
              Contas a receber
            </CardTitle>
            <CardDescription>
              {formatBRL(totalReceber)} em aberto.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {contasReceber.map((c) => (
              <div key={c.id} className="rounded-md border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getClienteNome(c.clienteId)} · {c.numeroNF}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                    {formatBRL(c.valor)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <StatusBadge status={c.prazo.status}>
                    {c.prazo.label}
                  </StatusBadge>
                </div>
              </div>
            ))}
            {contasReceber.length === 0 && (
              <p className="text-xs text-muted-foreground">Nada em aberto.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpFromLine className="size-4 text-warning" />
              Contas a pagar
            </CardTitle>
            <CardDescription>
              {formatBRL(totalPagar)} em aberto.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {contasPagar.map((c) => (
              <div key={c.id} className="rounded-md border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.fornecedor} · {CATEGORIA_PAGAR_LABEL[c.categoria]}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                    {formatBRL(c.valor)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <StatusBadge status={c.prazo.status}>
                    {c.prazo.label}
                  </StatusBadge>
                </div>
              </div>
            ))}
            {contasPagar.length === 0 && (
              <p className="text-xs text-muted-foreground">Nada em aberto.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UsersRound className="size-4 text-primary" />
              Folha de pagamento
            </CardTitle>
            <CardDescription>
              {folhaMes
                ? `${folhaMes.totalColaboradores} colaboradores · ${folhaMes.mes.split("-").reverse().join("/")}`
                : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {folhaMes ? (
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Salários</dt>
                  <dd className="font-mono font-semibold tabular-nums">
                    {formatBRL(folhaMes.salarios)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Encargos</dt>
                  <dd className="font-mono tabular-nums">
                    {formatBRL(folhaMes.encargos)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Benefícios</dt>
                  <dd className="font-mono tabular-nums">
                    {formatBRL(folhaMes.beneficios)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sem dados para o mês.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Despesas administrativas por categoria
            </CardTitle>
            <CardDescription>
              Aluguel, utilidades, software e demais custos fixos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {despesasAdmin.map(([categoria, valor]) => (
              <div
                key={categoria}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {CATEGORIA_ADMIN_LABEL[categoria]}
                </span>
                <span className="font-mono tabular-nums">
                  {formatBRL(valor)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ====================================================== Financeiro de Campo */

function FinanceiroCampo() {
  const [projetoId, setProjetoId] = useState<string | null>(null);
  const ativos = getProjetosAtivosEAgendados();

  const projetosBloqueados = ativos.filter(
    (p) => statusDaProntidao(getProntidaoDoProjeto(p.id)) === "critico",
  ).length;

  const totalEmCampo = ativos.reduce(
    (acc, p) => acc + getComprasEmCampo(p.id).reduce((a, d) => a + d.valor, 0),
    0,
  );
  const qtdEmCampo = ativos.reduce(
    (acc, p) => acc + getComprasEmCampo(p.id).length,
    0,
  );

  const fabricacoesPendentes = fabricacoes.filter(
    (f) => f.status !== "entregue",
  );
  const fabricacoesAtrasadas =
    fabricacoesPendentes.filter(fabricacaoAtrasada).length;

  const custoPrevistoTotal = ativos.reduce(
    (acc, p) => acc + getCustosDoProjeto(p.id).reduce((a, c) => a + c.valor, 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Projetos com impedimento"
          value={projetosBloqueados}
          icon={AlertTriangle}
          tone={projetosBloqueados > 0 ? "critical" : "success"}
          hint="Não podem mobilizar como estão"
        />
        <KpiCard
          label="Comprado em campo"
          value={formatBRL(totalEmCampo)}
          icon={CreditCard}
          tone="warning"
          hint={`${qtdEmCampo} compras sem cotação prévia`}
        />
        <KpiCard
          label="Fabricação em terceiros"
          value={fabricacoesPendentes.length}
          icon={Factory}
          tone={fabricacoesAtrasadas > 0 ? "critical" : "info"}
          hint={
            fabricacoesAtrasadas > 0
              ? `${fabricacoesAtrasadas} com previsão vencida`
              : "Nenhuma atrasada"
          }
        />
        <KpiCard
          label="Custos de campo"
          value={formatBRL(custoPrevistoTotal)}
          icon={Wallet}
          hint="Hotel, materiais, fabricação e locação"
        />
      </div>

      <div>
        <h2 className="mb-1 text-sm font-semibold">
          Projetos em andamento e agendados
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Clique em um projeto para ver os custos previstos e o que falta ficar
          pronto.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ativos.map((p) => {
            const bloqueios = getProntidaoDoProjeto(p.id);
            const prontidao = statusDaProntidao(bloqueios);
            const previsto = getCustosDoProjeto(p.id).reduce(
              (a, c) => a + c.valor,
              0,
            );
            const inicio = prazoBucket(p.dataInicio, HOJE);
            const jaComecou = inicio.dias < 0;
            const consumo = Math.min(
              100,
              Math.round((p.custoAtual / p.orcamento) * 100),
            );

            return (
              <Card
                key={p.id}
                onClick={() => setProjetoId(p.id)}
                className={cn(
                  "cursor-pointer gap-3 border-l-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  prontidao === "critico" && "border-l-destructive",
                  prontidao === "atencao" && "border-l-warning",
                  prontidao === "ok" && "border-l-success",
                )}
              >
                <CardContent className="px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getClienteNome(p.clienteId)} · {p.servico}
                      </p>
                    </div>
                    <StatusBadge status={prontidao} className="shrink-0">
                      {prontidao === "ok"
                        ? "Pronto"
                        : `${bloqueios.length} ${bloqueios.length === 1 ? "pendência" : "pendências"}`}
                    </StatusBadge>
                  </div>

                  <p className="mt-3 text-xs">
                    {jaComecou ? (
                      <span className="text-muted-foreground">
                        Iniciado em {formatDate(p.dataInicio)}
                      </span>
                    ) : (
                      <span className="font-medium text-warning">
                        Inicia em {formatDate(p.dataInicio)} ·{" "}
                        {inicio.label.toLowerCase()}
                      </span>
                    )}
                  </p>

                  <div className="mt-3 space-y-1">
                    {/* Custos de campo são um subconjunto do custo do projeto —
                        não incluem mão de obra nem overhead. Rotular como
                        "custo previsto" ao lado do consumido dá a impressão de
                        estouro de 25x. */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        Custos de campo
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        {formatBRL(previsto)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        Orçamento do projeto
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatBRL(p.custoAtual)} de {formatBRL(p.orcamento)}
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                      role="img"
                      aria-label={`${consumo}% do orçamento consumido`}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full",
                          consumo >= 90
                            ? "bg-destructive"
                            : consumo >= 75
                              ? "bg-warning"
                              : "bg-primary",
                        )}
                        style={{ width: `${consumo}%` }}
                      />
                    </div>
                  </div>

                  {bloqueios.length > 0 && (
                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                      {bloqueios[0].o}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <DetalheProjeto
        projetoId={projetoId}
        onClose={() => setProjetoId(null)}
      />
    </div>
  );
}

function ListaBloqueios({ bloqueios }: { bloqueios: Bloqueio[] }) {
  if (!bloqueios.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nada pendente. Tudo que a equipe precisa para operar já está pronto.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {bloqueios.map((b, i) => (
        <li key={i} className="rounded-md border p-3">
          <div className="flex items-start gap-2">
            <StatusBadge status={b.status} className="shrink-0">
              {b.status === "critico" ? "Impede" : "Atenção"}
            </StatusBadge>
            <div className="min-w-0">
              <p className="text-sm font-medium">{b.o}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{b.logo}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DetalheProjeto({
  projetoId,
  onClose,
}: {
  projetoId: string | null;
  onClose: () => void;
}) {
  const p = projetos.find((x) => x.id === projetoId);

  return (
    <Dialog open={!!projetoId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {p && (
          <>
            <DialogHeader>
              <DialogTitle>{p.nome}</DialogTitle>
              <DialogDescription>
                {getClienteNome(p.clienteId)} · {p.servico} · contrato{" "}
                {p.contrato}
              </DialogDescription>
            </DialogHeader>
            <CorpoDetalhe projetoId={p.id} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CorpoDetalhe({ projetoId }: { projetoId: string }) {
  const p = projetos.find((x) => x.id === projetoId)!;
  const bloqueios = getProntidaoDoProjeto(p.id);
  const custos = getCustosDoProjeto(p.id);
  const previsto = custos.reduce((a, c) => a + c.valor, 0);
  const mats = getMateriaisDoProjeto(p.id);
  const matsFabricados = mats.filter((m) => m.origem === "fabricacao");
  const comprasCampo = getComprasEmCampo(p.id);
  const totalCampo = comprasCampo.reduce((a, d) => a + d.valor, 0);

  return (
    <div className="flex min-w-0 flex-col gap-6 pb-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PackageCheck className="size-4 text-primary" />
            Prontidão para operar
          </CardTitle>
          <CardDescription>
            O que ainda falta para a equipe conseguir trabalhar neste projeto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListaBloqueios bloqueios={bloqueios} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Custos de campo por categoria
          </CardTitle>
          <CardDescription>
            {formatBRL(previsto)} em custos de campo. O orçamento total do
            projeto é {formatBRL(p.orcamento)} e o contrato vale{" "}
            {formatBRL(p.valorContrato)} — a diferença é mão de obra,
            laboratório e overhead, que não passam por esta tela.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custos.map((c) => (
                  <TableRow key={c.chave}>
                    <TableCell className="font-medium">{c.label}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                      {c.itens}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatBRL(c.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {matsFabricados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Factory className="size-4 text-primary" />
              Fabricação em terceiros
            </CardTitle>
            <CardDescription>
              Itens que não dependem de nós — são os que mais bloqueiam a
              mobilização.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {matsFabricados.map((m) => {
              const f = m.fabricacaoId
                ? getFabricacaoDoMaterial(m.id)
                : undefined;
              if (!f) return null;
              const prazo = prazoDaFabricacao(f);
              const atrasada = fabricacaoAtrasada(f);
              return (
                <div key={m.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{m.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.fornecedor} · pedido {f.pedido} ·{" "}
                        {m.quantidadePrevista} {m.unidade}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        atrasada
                          ? "critico"
                          : f.status === "pronto"
                            ? "ok"
                            : "info"
                      }
                      className="shrink-0"
                    >
                      {FABRICACAO_LABEL[f.status]}
                    </StatusBadge>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Solicitado</dt>
                      <dd className="font-mono tabular-nums">
                        {formatDate(f.dataSolicitacao)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Previsão</dt>
                      <dd
                        className={cn(
                          "font-mono tabular-nums",
                          atrasada && "font-semibold text-destructive",
                        )}
                      >
                        {formatDate(f.previsaoEntrega)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Situação</dt>
                      <dd
                        className={cn(
                          "tabular-nums",
                          atrasada && "font-semibold text-destructive",
                        )}
                      >
                        {f.dataEntregaReal
                          ? `Entregue ${formatDate(f.dataEntregaReal)}`
                          : prazo.label}
                      </dd>
                    </div>
                  </dl>

                  {f.observacoes && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {f.observacoes}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Materiais</CardTitle>
          <CardDescription>
            Previsto, recebido e de onde veio cada item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mats.map((m) => {
                  const completo = m.quantidadeRecebida >= m.quantidadePrevista;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="font-medium">{m.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORIA_LABEL[m.categoria]}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={m.origem === "campo" ? "atencao" : "neutro"}
                        >
                          {ORIGEM_LABEL[m.origem]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        <span
                          className={cn(
                            !completo && "font-semibold text-warning",
                          )}
                        >
                          {m.quantidadeRecebida}
                        </span>
                        <span className="text-muted-foreground">
                          /{m.quantidadePrevista} {m.unidade}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatBRL(custoDoMaterial(m))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {comprasCampo.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="size-4 text-warning" />
              Comprado em campo, no cartão
            </CardTitle>
            <CardDescription>
              {comprasCampo.length}{" "}
              {comprasCampo.length === 1 ? "compra" : "compras"} sem cotação
              prévia · {formatBRL(totalCampo)}. Pular a cotação resolve o dia e
              tira o custo do controle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>O que</TableHead>
                    <TableHead>Quem</TableHead>
                    <TableHead>Quando</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprasCampo.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <p className="font-medium">{d.descricao}</p>
                        {d.fornecedor && (
                          <p className="text-xs text-muted-foreground">
                            {d.fornecedor}
                            {d.notaFiscal ? ` · ${d.notaFiscal}` : ""}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getColaboradorNome(d.colaboradorId)}
                      </TableCell>
                      <TableCell className="font-mono tabular-nums text-muted-foreground">
                        {formatDate(d.data)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">
                        {formatBRL(d.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Truck className="size-4 text-primary" />
            Entrega contratada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{p.detalhesEntrega}</p>
        </CardContent>
      </Card>
    </div>
  );
}
