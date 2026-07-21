"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  TruckElectric,
  Wrench,
  Ban,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  formatBRL,
  formatDate,
  prazoBucket,
  veiculoStatusMap,
} from "@/lib/status-map";
import { getUltimoUsoVeiculo } from "@/lib/derivacoes";
import { HOJE, projetos, veiculos } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { ProtecaoVeiculo, Veiculo } from "@/lib/types";

const PROTECAO_LABEL: Record<ProtecaoVeiculo, string> = {
  camera_frontal: "Câmera frontal",
  camera_cabine: "Câmera de cabine",
  telemetria: "Telemetria",
  gaiola: "Gaiola de proteção",
  extintor: "Extintor",
  kit_primeiros_socorros: "Kit de primeiros socorros",
  farol_led: "Farol LED",
  antena_alta: "Antena alta",
  cinto_4_pontos: "Cinto 4 pontos",
  protetor_carter: "Protetor de cárter",
};

const MULTA_STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  paga: "Paga",
  recurso: "Em recurso",
  indicada: "Indicada",
};

const INCIDENTE_LABEL: Record<string, string> = {
  colisao: "Colisão",
  avaria: "Avaria",
  pane: "Pane",
  furto: "Furto",
  fauna: "Fauna",
  atolamento: "Atolamento",
};

export default function VeiculosPage() {
  return (
    <Suspense fallback={null}>
      <VeiculosContent />
    </Suspense>
  );
}

function VeiculosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFiltro = searchParams.get("status");
  const openId = searchParams.get("open");

  // Sentinela undefined|string|null — ver src/app/(app)/projetos/page.tsx.
  const [abertoLocal, setAbertoLocal] = useState<string | null | undefined>(
    undefined,
  );
  const selecionadoId = abertoLocal === undefined ? openId : abertoLocal;
  const selecionado = selecionadoId
    ? (veiculos.find((x) => x.id === selecionadoId) ?? null)
    : null;

  function abrir(v: Veiculo) {
    setAbertoLocal(v.id);
  }

  function fechar() {
    setAbertoLocal(null);
    if (openId) {
      const q = new URLSearchParams(searchParams.toString());
      q.delete("open");
      router.replace(q.size ? `/veiculos?${q}` : "/veiculos", {
        scroll: false,
      });
    }
  }

  const listaFiltrada = useMemo(() => {
    if (!statusFiltro) return veiculos;
    return veiculos.filter((v) => v.status === statusFiltro);
  }, [statusFiltro]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mobilização de Veículos"
        description="Frota 4x4: localização, proteções, custos, multas e incidentes."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Disponíveis"
          value={veiculos.filter((v) => v.status === "disponivel").length}
          icon={Truck}
          tone="success"
          href="/veiculos?status=disponivel"
        />
        <KpiCard
          label="Em campo"
          value={veiculos.filter((v) => v.status === "em_campo").length}
          icon={TruckElectric}
          href="/veiculos?status=em_campo"
        />
        <KpiCard
          label="Em manutenção"
          value={veiculos.filter((v) => v.status === "manutencao").length}
          icon={Wrench}
          tone="warning"
          href="/veiculos?status=manutencao"
        />
        <KpiCard
          label="Bloqueados"
          value={veiculos.filter((v) => v.status === "bloqueado").length}
          icon={Ban}
          tone="critical"
          href="/veiculos?status=bloqueado"
        />
      </div>

      <Tabs
        value={statusFiltro ?? "todos"}
        onValueChange={(v) =>
          router.push(v === "todos" ? "/veiculos" : `/veiculos?status=${v}`)
        }
      >
        <TabsList>
          <TabsTrigger value="todos">Todos ({veiculos.length})</TabsTrigger>
          <TabsTrigger value="disponivel">
            Disponíveis (
            {veiculos.filter((v) => v.status === "disponivel").length})
          </TabsTrigger>
          <TabsTrigger value="em_campo">
            Em campo ({veiculos.filter((v) => v.status === "em_campo").length})
          </TabsTrigger>
          <TabsTrigger value="manutencao">
            Manutenção (
            {veiculos.filter((v) => v.status === "manutencao").length})
          </TabsTrigger>
          <TabsTrigger value="bloqueado">
            Bloqueados (
            {veiculos.filter((v) => v.status === "bloqueado").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Projeto atual</TableHead>
                  <TableHead>KM atual</TableHead>
                  <TableHead>Multas abertas</TableHead>
                  <TableHead>Checklist</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaFiltrada.map((v) => {
                  const map = veiculoStatusMap[v.status];
                  const criticos = v.checklist.filter(
                    (c) => c.status === "critico",
                  ).length;
                  const atencao = v.checklist.filter(
                    (c) => c.status === "atencao",
                  ).length;
                  const multasAbertas = v.multas.filter(
                    (m) => m.status === "aberta",
                  ).length;
                  const projetoAtual = v.projetoAtualId
                    ? projetos.find((p) => p.id === v.projetoAtualId)
                    : null;
                  return (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer"
                      onClick={() => abrir(v)}
                    >
                      <TableCell className="font-mono font-medium tabular-nums">
                        {v.placa}
                      </TableCell>
                      <TableCell>{v.modelo}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {projetoAtual ? projetoAtual.nome : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {v.kmAtual.toLocaleString("pt-BR")} km
                      </TableCell>
                      <TableCell>
                        {multasAbertas > 0 ? (
                          <StatusBadge status="critico">
                            {multasAbertas}
                          </StatusBadge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {criticos > 0 ? (
                          <StatusBadge status="critico">
                            {criticos} item(ns) crítico(s)
                          </StatusBadge>
                        ) : atencao > 0 ? (
                          <StatusBadge status="atencao">
                            {atencao} vencendo
                          </StatusBadge>
                        ) : (
                          <StatusBadge status="ok">Conforme</StatusBadge>
                        )}
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

      <Dialog open={!!selecionado} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selecionado && <DetalheVeiculo veiculo={selecionado} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetalheVeiculo({ veiculo: v }: { veiculo: Veiculo }) {
  const projetoAtual = v.projetoAtualId
    ? projetos.find((p) => p.id === v.projetoAtualId)
    : null;
  const kmRodadoNoProjeto =
    v.kmAntesProjeto !== undefined ? v.kmAtual - v.kmAntesProjeto : null;
  // Sem projeto atual, o card "Onde está" cai para o último uso do histórico.
  const ultimoUso = projetoAtual ? null : getUltimoUsoVeiculo(v);
  const multasAbertas = v.multas.filter((m) => m.status === "aberta");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono">{v.placa}</DialogTitle>
        <DialogDescription>
          {v.modelo} · {v.ano} · RENAVAM {v.renavam} · {v.proprietario}
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-w-0 flex-col gap-4 pb-4">
        {/* Onde está — projeto, motorista, km atual vs antes do projeto.
            Sem projeto atual, mostra o último uso registrado no histórico. */}
        <div className="rounded-md border p-3">
          {projetoAtual ? (
            <>
              <p className="text-sm font-medium">{projetoAtual.nome}</p>
              <p className="text-xs text-muted-foreground">
                Motorista: {v.motoristaPrincipal} · Cliente: {v.cliente}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Km atual</dt>
                  <dd className="font-mono tabular-nums">
                    {v.kmAtual.toLocaleString("pt-BR")} km
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Km antes do projeto</dt>
                  <dd className="font-mono tabular-nums">
                    {v.kmAntesProjeto !== undefined
                      ? `${v.kmAntesProjeto.toLocaleString("pt-BR")} km`
                      : "—"}
                    {kmRodadoNoProjeto !== null && (
                      <span className="ml-1.5 text-muted-foreground">
                        (+{kmRodadoNoProjeto.toLocaleString("pt-BR")} km)
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </>
          ) : ultimoUso ? (
            <>
              <p className="text-sm font-medium">
                Último projeto: {ultimoUso.projetoNome}
              </p>
              <p className="text-xs text-muted-foreground">
                Motorista: {ultimoUso.motoristaNome} · Cliente: {v.cliente}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Km antes do projeto</dt>
                  <dd className="font-mono tabular-nums">
                    {ultimoUso.kmInicio.toLocaleString("pt-BR")} km
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Km ao fim do projeto</dt>
                  <dd className="font-mono tabular-nums">
                    {ultimoUso.kmFim !== undefined
                      ? `${ultimoUso.kmFim.toLocaleString("pt-BR")} km`
                      : "—"}
                    {ultimoUso.kmFim !== undefined && (
                      <span className="ml-1.5 text-muted-foreground">
                        (+
                        {(
                          ultimoUso.kmFim - ultimoUso.kmInicio
                        ).toLocaleString("pt-BR")}{" "}
                        km)
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Sem projeto no momento</p>
              <p className="text-xs text-muted-foreground">
                Motorista: {v.motoristaPrincipal} · Cliente: {v.cliente}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Km atual</dt>
                  <dd className="font-mono tabular-nums">
                    {v.kmAtual.toLocaleString("pt-BR")} km
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>

        {/* Todas as proteções esperadas na frota — instalada vs faltante,
            sempre ícone + texto junto da cor (nunca cor sozinha). */}
        <div>
          <p className="mb-2 text-sm font-medium">
            Equipamentos de proteção — instalados e faltantes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PROTECAO_LABEL) as ProtecaoVeiculo[]).map((p) => {
              const instalada = v.protecoes.includes(p);
              return (
                <span
                  key={p}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                    instalada
                      ? "bg-success/12 text-success"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {instalada ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <X className="size-3" />
                  )}
                  {PROTECAO_LABEL[p]}
                </span>
              );
            })}
          </div>
        </div>

        {/* Quanto custa — locação (se houver) e projetos utilizados. */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Locação</p>
            {v.locacao ? (
              <>
                <p className="text-sm font-medium">{v.locacao.empresa}</p>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatBRL(v.locacao.custoMensal)}/mês · franquia{" "}
                  {v.locacao.franquiaKm.toLocaleString("pt-BR")} km
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Frota própria</p>
            )}
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Projetos utilizados</p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {v.projetosUtilizados}
            </p>
          </div>
        </div>

        <Tabs defaultValue="checklist">
          <TabsList className="w-full">
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
            <TabsTrigger value="combustivel">Combustível</TabsTrigger>
            <TabsTrigger value="multas">
              Multas
              {multasAbertas.length > 0 && (
                <span className="ml-1 rounded-full bg-destructive/15 px-1.5 text-destructive">
                  {multasAbertas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
            <TabsTrigger value="lavagens">Lavagens</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="mt-3 flex flex-col gap-2">
            {v.checklist.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-2.5 text-sm"
              >
                <span className="font-medium">{item.item}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatDate(item.validade)}
                  </span>
                  <StatusBadge status={item.status}>
                    {item.status === "ok"
                      ? "Conforme"
                      : item.status === "atencao"
                        ? "Vencendo"
                        : "Vencido"}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="manutencao" className="mt-3 flex flex-col gap-2">
            {v.manutencoes.map((m, i) => (
              <div key={i} className="rounded-md border p-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{m.tipo}</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatBRL(m.custo)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{m.descricao}</p>
                <p className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatDate(m.data)} · {m.km.toLocaleString("pt-BR")} km
                </p>
              </div>
            ))}
            {v.manutencoes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma manutenção registrada.
              </p>
            )}
          </TabsContent>

          <TabsContent value="combustivel" className="mt-3 flex flex-col gap-2">
            {/* Total do período — soma de valor e litros de todos os registros. */}
            {v.abastecimentos.length > 0 && (
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-2.5 text-sm">
                <span className="text-xs text-muted-foreground">
                  Total do período · {v.abastecimentos.length} abastecimento(s)
                </span>
                <span className="font-mono text-xs font-medium tabular-nums">
                  {formatBRL(
                    v.abastecimentos.reduce((acc, a) => acc + a.valor, 0),
                  )}{" "}
                  ·{" "}
                  {v.abastecimentos
                    .reduce((acc, a) => acc + a.litros, 0)
                    .toLocaleString("pt-BR")}
                  L
                </span>
              </div>
            )}
            {v.abastecimentos.map((a, i, arr) => {
              const anterior = arr[i + 1];
              // Guard: sem registro anterior, delta zero/negativo ou litros
              // zerados não geram km/L (evita divisão por zero e valor sem
              // sentido no último item da lista).
              const kmRodado = anterior ? a.km - anterior.km : null;
              const kmL =
                kmRodado !== null && kmRodado > 0 && a.litros > 0
                  ? (kmRodado / a.litros).toFixed(1)
                  : null;
              return (
                <div key={i} className="rounded-md border p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.posto}</span>
                    <span className="font-mono text-xs tabular-nums">
                      {formatBRL(a.valor)}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatDate(a.data)} · {a.litros}L ·{" "}
                    {a.km.toLocaleString("pt-BR")} km
                    {kmL && ` · ${kmL} km/L`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Motorista: {a.motorista}
                  </p>
                </div>
              );
            })}
            {v.abastecimentos.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum abastecimento registrado.
              </p>
            )}
          </TabsContent>

          {/* Multas com status de pagamento — governo entra como estado de
              sincronização, ver docs/projeto-abas.md. */}
          <TabsContent value="multas" className="mt-3 flex flex-col gap-2">
            {v.multas.map((m) => {
              const prazo = prazoBucket(m.vencimento, HOJE);
              return (
                <div key={m.id} className="rounded-md border p-2.5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{m.infracao}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.local} · {formatDate(m.data)}
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        m.status === "paga"
                          ? "ok"
                          : m.status === "aberta"
                            ? "critico"
                            : "atencao"
                      }
                      className="shrink-0"
                    >
                      {MULTA_STATUS_LABEL[m.status]}
                    </StatusBadge>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {m.pontos} pontos · {formatBRL(m.valor)}
                    </span>
                    {m.status === "aberta" && (
                      <span
                        className={cn(
                          "font-medium",
                          prazo.status === "critico"
                            ? "text-destructive"
                            : "text-warning",
                        )}
                      >
                        {prazo.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {v.multas.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma multa registrada.
              </p>
            )}
          </TabsContent>

          <TabsContent value="incidentes" className="mt-3 flex flex-col gap-2">
            {v.incidentes.map((i) => (
              <div key={i.id} className="rounded-md border p-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{INCIDENTE_LABEL[i.tipo]}</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatBRL(i.custoReparo)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{i.descricao}</p>
                <p className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatDate(i.data)} · {i.local}
                </p>
              </div>
            ))}
            {v.incidentes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum incidente registrado.
              </p>
            )}
          </TabsContent>

          <TabsContent value="lavagens" className="mt-3 flex flex-col gap-2">
            {v.lavagens.map((l, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-2.5 text-sm"
              >
                <div>
                  <span className="font-medium capitalize">{l.tipo}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {l.local}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tabular-nums">
                    {formatDate(l.data)}
                  </span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatBRL(l.custo)}
                  </span>
                </div>
              </div>
            ))}
            {v.lavagens.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma lavagem registrada.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
