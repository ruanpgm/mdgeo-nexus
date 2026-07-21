"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  CheckCircle2,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Timer,
  TrendingDown,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  compraStatusMap,
  formatBRL,
  formatDate,
  prioridadeStatusMap,
} from "@/lib/status-map";
import { solicitacoesCompra } from "@/lib/mock-data";
import {
  getInsightsFornecedores,
  getRankingFornecedores,
} from "@/lib/derivacoes";
import type { SolicitacaoCompra } from "@/lib/types";

export default function ComprasPage() {
  return (
    <Suspense fallback={null}>
      <ComprasContent />
    </Suspense>
  );
}

function ComprasContent() {
  const tabParam = useSearchParams().get("tab");
  const tabInicial = ["solicitacoes", "fornecedores"].includes(tabParam ?? "")
    ? tabParam!
    : "solicitacoes";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Compras"
        description="Solicitações, cotações comparativas e desempenho de fornecedores — mínimo de 3 orçamentos por solicitação."
      />

      {/* key força remount quando o link da sidebar muda de aba via query — clique
          manual na TabsList não altera a URL, então não afeta este key. */}
      <Tabs defaultValue={tabInicial} key={tabInicial}>
        <TabsList>
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitacoes" className="mt-4">
          <SolicitacoesView />
        </TabsContent>

        <TabsContent value="fornecedores" className="mt-4">
          <FornecedoresView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================ Solicitações */

function SolicitacoesView() {
  const [selecionado, setSelecionado] = useState<SolicitacaoCompra | null>(
    null,
  );

  const aguardandoAprovacao = solicitacoesCompra.filter(
    (s) => s.status === "aprovacao",
  ).length;
  const emCotacao = solicitacoesCompra.filter(
    (s) => s.status === "cotando",
  ).length;
  const economiaTotal = solicitacoesCompra
    .filter((s) => s.cotacoes.length > 1)
    .reduce((acc, s) => {
      const valores = s.cotacoes.map((c) => c.valor);
      return acc + (Math.max(...valores) - Math.min(...valores));
    }, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Verificar disponibilidade de API com o sistema atual da empresa é
          descoberta, não construção — entra como estado de sincronização, não
          como tela de integração fingida. Ver docs/projeto-abas.md. */}
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Wifi className="size-3.5 text-info" />
        Sincronizado com o ERP há 2h · integração de status de pedido em
        avaliação
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Solicitações abertas"
          value={solicitacoesCompra.length}
          icon={ShoppingCart}
        />
        <KpiCard
          label="Aguardando aprovação"
          value={aguardandoAprovacao}
          icon={Timer}
          tone="warning"
        />
        <KpiCard label="Em cotação" value={emCotacao} icon={CheckCircle2} />
        <KpiCard
          label="Economia obtida"
          value={formatBRL(economiaTotal)}
          icon={TrendingDown}
          tone="success"
        />
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Necessário até</TableHead>
                  <TableHead>Cotações</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitacoesCompra.map((s) => {
                  const map = compraStatusMap[s.status];
                  const prio = prioridadeStatusMap[s.prioridade];
                  return (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => setSelecionado(s)}
                    >
                      <TableCell>
                        <p className="font-medium">{s.item}</p>
                        <p className="text-xs text-muted-foreground">
                          Qtd. {s.quantidade}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.solicitante}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.projeto}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {formatBRL(s.valorEstimado)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={prio.status}>
                          {prio.label}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {formatDate(s.dataNecessaria)}
                      </TableCell>
                      <TableCell>
                        {s.cotacoes.length}/3
                        {s.cotacoes.length < 3 && s.status !== "recebida"
                          ? " ⚠"
                          : ""}
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

      <Dialog
        open={!!selecionado}
        onOpenChange={(v) => !v && setSelecionado(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selecionado && (
            <>
              <DialogHeader>
                <DialogTitle>{selecionado.item}</DialogTitle>
                <DialogDescription>
                  {selecionado.solicitante} · {selecionado.centroCusto} ·{" "}
                  {selecionado.projeto}
                </DialogDescription>
              </DialogHeader>
              <div className="flex min-w-0 flex-col gap-4 pb-4">
                <p className="text-sm text-muted-foreground">
                  {selecionado.justificativa}
                </p>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Valor estimado
                    </p>
                    <p className="font-mono font-medium tabular-nums">
                      {formatBRL(selecionado.valorEstimado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Necessário até
                    </p>
                    <p className="font-mono text-xs tabular-nums">
                      {formatDate(selecionado.dataNecessaria)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <StatusBadge
                      status={compraStatusMap[selecionado.status].status}
                    >
                      {compraStatusMap[selecionado.status].label}
                    </StatusBadge>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 text-sm font-medium">
                    Mapa comparativo de cotações
                    {selecionado.cotacoes.length > 0 &&
                      selecionado.cotacoes.length < 3 && (
                        <span className="ml-2 text-xs font-normal text-warning">
                          Mínimo de 3 cotações exigido para envio à diretoria
                        </span>
                      )}
                  </p>
                  <div className="flex flex-col gap-2">
                    {selecionado.cotacoes.map((c, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-md border p-3 text-sm",
                          c.vencedora && "border-success/40 bg-success/5",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{c.fornecedor}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono tabular-nums">
                              {formatBRL(c.valor)}
                            </span>
                            {c.vencedora && (
                              <StatusBadge status="ok">
                                Menor proposta
                              </StatusBadge>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {c.contato} · {c.cnpj}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                          Prazo: {c.prazoEntrega}d · Frete: {formatBRL(c.frete)}{" "}
                          · {c.condicaoPagamento}
                        </p>
                        {c.observacoes && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {c.observacoes}
                          </p>
                        )}
                      </div>
                    ))}
                    {selecionado.cotacoes.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma cotação registrada ainda.
                      </p>
                    )}
                  </div>
                </div>

                {/* Avaliação do fornecedor após o recebimento — alimenta a
                    próxima escolha. Pedido explícito da doc. */}
                {selecionado.avaliacao && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-sm font-medium">
                        Avaliação do fornecedor
                      </p>
                      <div className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "size-3.5",
                                  i < selecionado.avaliacao!.nota
                                    ? "fill-warning text-warning"
                                    : "text-muted-foreground/30",
                                )}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">
                            {formatDate(selecionado.avaliacao.data)}
                          </span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <StatusBadge
                            status={
                              selecionado.avaliacao.prazoCumprido
                                ? "ok"
                                : "atencao"
                            }
                          >
                            {selecionado.avaliacao.prazoCumprido
                              ? "Prazo cumprido"
                              : "Prazo não cumprido"}
                          </StatusBadge>
                          <StatusBadge
                            status={
                              selecionado.avaliacao.qualidadeConforme
                                ? "ok"
                                : "atencao"
                            }
                          >
                            {selecionado.avaliacao.qualidadeConforme
                              ? "Qualidade conforme"
                              : "Qualidade em desacordo"}
                          </StatusBadge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {selecionado.avaliacao.comentario}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Avaliado por {selecionado.avaliacao.avaliadoPor}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================================ Fornecedores */

/* Conteúdo migrado da antiga rota /fornecedores — o histórico de cotações das
   solicitações vira ranking e melhor preço por item, sem cadastro paralelo. */
function FornecedoresView() {
  const ranking = getRankingFornecedores();
  const insights = getInsightsFornecedores();
  const melhorFornecedor = ranking[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          label="Fornecedores cotados"
          value={ranking.length}
          icon={Store}
        />
        <KpiCard label="Itens comparados" value={insights.length} icon={Tags} />
        <KpiCard
          label="Mais vitórias"
          value={melhorFornecedor?.fornecedor ?? "—"}
          icon={Award}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ranking de fornecedores</CardTitle>
          <CardDescription>
            Quem mais venceu cotações — proxy de melhor fornecedor pelo
            histórico real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Cotações</TableHead>
                  <TableHead>Vitórias</TableHead>
                  <TableHead>Taxa de vitória</TableHead>
                  <TableHead>Valor total vencido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((f) => (
                  <TableRow key={f.fornecedor}>
                    <TableCell className="font-medium">
                      {f.fornecedor}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {f.cotacoes}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {f.vitorias}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {f.cotacoes > 0
                        ? Math.round((f.vitorias / f.cotacoes) * 100)
                        : 0}
                      %
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {formatBRL(f.valorTotalVencido)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {ranking.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhuma cotação registrada no período.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Melhor preço por item</CardTitle>
          <CardDescription>
            Menor valor já cotado por item, cruzando todas as solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Melhor fornecedor</TableHead>
                  <TableHead>Melhor valor</TableHead>
                  <TableHead>Cotações registradas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.map((i) => (
                  <TableRow key={i.item}>
                    <TableCell className="font-medium">{i.item}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {i.melhorFornecedor}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {formatBRL(i.melhorValor)}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {i.cotacoesRegistradas}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {insights.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum item comparado no período.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
