"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { MockFoto } from "@/components/mtgl/mock-foto";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  PackageCheck,
  Radar,
  Gauge,
  Wrench,
  HeartPulse,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/status-map";
import { equipamentos, projetos } from "@/lib/mock-data";
import { getProximaAlocacao, statusDaSaude } from "@/lib/derivacoes";
import { cn } from "@/lib/utils";
import type { Equipamento } from "@/lib/types";

const situacaoMap: Record<
  Equipamento["situacao"],
  { label: string; status: "ok" | "info" | "atencao" | "critico" | "neutro" }
> = {
  disponivel: { label: "Disponível", status: "ok" },
  em_campo: { label: "Em campo", status: "info" },
  calibracao: { label: "Em calibração", status: "atencao" },
  manutencao: { label: "Em manutenção", status: "critico" },
  reservado: { label: "Reservado", status: "neutro" },
};

const ALOCACAO_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  aprovado: "Aprovado",
  disponibilizado: "Disponibilizado",
  em_campo: "Em campo",
  devolvido: "Devolvido",
};

export default function EquipamentosPage() {
  return (
    <Suspense fallback={null}>
      <EquipamentosContent />
    </Suspense>
  );
}

function EquipamentosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const situacaoFiltro = searchParams.get("situacao");
  const calibracaoFiltro = searchParams.get("calibracao");
  const openId = searchParams.get("open");

  // Mesmo padrão de Projetos: ?open= é a fonte, `abertoLocal` cobre o clique
  // local, e o sentinela undefined|string|null evita que fechar reabra o
  // painel via URL. Ver src/app/(app)/projetos/page.tsx.
  const [abertoLocal, setAbertoLocal] = useState<string | null | undefined>(
    undefined,
  );
  const selecionadoId = abertoLocal === undefined ? openId : abertoLocal;
  const selecionado = selecionadoId
    ? (equipamentos.find((x) => x.id === selecionadoId) ?? null)
    : null;

  function abrir(e: Equipamento) {
    setAbertoLocal(e.id);
  }

  function fechar() {
    setAbertoLocal(null);
    if (openId) {
      const q = new URLSearchParams(searchParams.toString());
      q.delete("open");
      router.replace(q.size ? `/equipamentos?${q}` : "/equipamentos", {
        scroll: false,
      });
    }
  }

  const listaFiltrada = useMemo(() => {
    return equipamentos.filter((e) => {
      if (situacaoFiltro && e.situacao !== situacaoFiltro) return false;
      if (
        calibracaoFiltro === "vencendo" &&
        e.statusCalibragem !== "atencao" &&
        e.statusCalibragem !== "critico"
      )
        return false;
      return true;
    });
  }, [situacaoFiltro, calibracaoFiltro]);

  const filtroAtivoLabel = situacaoFiltro
    ? situacaoMap[situacaoFiltro as Equipamento["situacao"]]?.label
    : calibracaoFiltro === "vencendo"
      ? "Calibração vencendo"
      : null;

  const saudeCritica = equipamentos.filter(
    (e) => statusDaSaude(e.saude) === "critico",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de Equipamentos"
        description="Instrumentos técnicos: calibração, saúde, disponibilidade e rastreabilidade completa."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Disponíveis"
          value={equipamentos.filter((e) => e.situacao === "disponivel").length}
          icon={PackageCheck}
          tone="success"
          href="/equipamentos?situacao=disponivel"
        />
        <KpiCard
          label="Em campo"
          value={equipamentos.filter((e) => e.situacao === "em_campo").length}
          icon={Radar}
          href="/equipamentos?situacao=em_campo"
        />
        <KpiCard
          label="Calibração vencendo"
          value={
            equipamentos.filter(
              (e) =>
                e.statusCalibragem === "atencao" ||
                e.statusCalibragem === "critico",
            ).length
          }
          icon={Gauge}
          tone="warning"
          href="/equipamentos?calibracao=vencendo"
        />
        <KpiCard
          label="Em manutenção"
          value={equipamentos.filter((e) => e.situacao === "manutencao").length}
          icon={Wrench}
          tone="critical"
          href="/equipamentos?situacao=manutencao"
        />
        <KpiCard
          label="Saúde crítica"
          value={saudeCritica}
          icon={HeartPulse}
          tone={saudeCritica > 0 ? "critical" : "success"}
          hint="Abaixo de 70%"
        />
      </div>

      <Card>
        <CardContent>
          {filtroAtivoLabel && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Filtro ativo:
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs font-medium">
                {filtroAtivoLabel}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="ml-0.5 size-4"
                  onClick={() => router.push("/equipamentos")}
                >
                  <X className="size-3" />
                </Button>
              </span>
              <span className="text-xs text-muted-foreground">
                {listaFiltrada.length} de {equipamentos.length}
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Validade calibração</TableHead>
                  <TableHead>Saúde</TableHead>
                  <TableHead>Projetos</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaFiltrada.map((e) => {
                  const map = situacaoMap[e.situacao];
                  const saudeStatus = statusDaSaude(e.saude);
                  return (
                    <TableRow
                      key={e.id}
                      className="cursor-pointer"
                      onClick={() => abrir(e)}
                    >
                      <TableCell className="font-mono text-xs tabular-nums">
                        {e.patrimonio}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{e.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.fabricante} · {e.modelo}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-muted-foreground">{e.responsavel}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.setor}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={e.statusCalibragem}>
                          {formatDate(e.validadeCalibragem)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                saudeStatus === "critico"
                                  ? "bg-destructive"
                                  : saudeStatus === "atencao"
                                    ? "bg-warning"
                                    : "bg-success",
                              )}
                              style={{ width: `${e.saude}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">
                            {e.saude}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                        {e.projetosUtilizados}
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selecionado && <DetalheEquipamento equipamento={selecionado} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetalheEquipamento({ equipamento: e }: { equipamento: Equipamento }) {
  const saudeStatus = statusDaSaude(e.saude);
  const proxima = getProximaAlocacao(e.id);
  const projetoProximo = proxima
    ? projetos.find((p) => p.id === proxima.projetoId)
    : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{e.nome}</DialogTitle>
        <DialogDescription>
          {e.patrimonio} · N/S {e.numeroSerie}
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-w-0 flex-col gap-4 pb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Fabricante / Modelo</p>
            <p className="font-medium">
              {e.fabricante} {e.modelo}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Localização</p>
            <p className="font-medium">{e.localizacao}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Responsável atual</p>
            <p className="font-medium">
              {e.responsavel} · {e.setor}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Certificado</p>
            <p className="font-mono text-xs">{e.certificado}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Última calibração</p>
            <p className="font-mono text-xs tabular-nums">
              {formatDate(e.ultimaCalibragem)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Validade calibração</p>
            <StatusBadge status={e.statusCalibragem}>
              {formatDate(e.validadeCalibragem)}
            </StatusBadge>
          </div>
        </div>

        {/* Par retirada/devolução documenta o estado do equipamento entre a
            saída para campo e o retorno — é a evidência de avaria. */}
        <div>
          <p className="mb-2 text-sm font-medium">Fotos do equipamento</p>
          {e.fotoRetirada ? (
            <div className="grid grid-cols-2 gap-3">
              <MockFoto
                etiqueta="Retirada"
                legenda={e.fotoRetirada.legenda}
                data={e.fotoRetirada.data}
                responsavel={e.fotoRetirada.responsavel}
              />
              {e.fotoDevolucao ? (
                <MockFoto
                  etiqueta="Devolução"
                  legenda={e.fotoDevolucao.legenda}
                  data={e.fotoDevolucao.data}
                  responsavel={e.fotoDevolucao.responsavel}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Devolução pendente — foto será registrada no retorno
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sem registros fotográficos para este equipamento.
            </p>
          )}
        </div>

        <Separator />

        {/* Saúde: -1% por retorno de campo, ajustável à mão. Ver
            docs/projeto-abas.md — estado persistido, não derivado. */}
        <div className="rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Saúde do equipamento</p>
            <StatusBadge status={saudeStatus}>{e.saude}%</StatusBadge>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                saudeStatus === "critico"
                  ? "bg-destructive"
                  : saudeStatus === "atencao"
                    ? "bg-warning"
                    : "bg-success",
              )}
              style={{ width: `${e.saude}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {e.projetosUtilizados} projetos utilizados
            {e.saudeAjustadaManualmente && " · valor ajustado manualmente"}
          </p>
        </div>

        {/* Próximo projeto + previsão de retorno — pedido explícito da doc. */}
        <div className="rounded-md border p-3">
          <p className="text-sm font-medium">Próximo projeto</p>
          {proxima && projetoProximo ? (
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{projetoProximo.nome}</span>
                <StatusBadge status="info">
                  {ALOCACAO_LABEL[proxima.status]}
                </StatusBadge>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Necessário</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDate(proxima.dataNecessaria)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Retorno previsto</dt>
                  <dd className="font-mono tabular-nums">
                    {formatDate(proxima.dataPrevistaRetorno)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Sem alocação futura no momento.
            </p>
          )}
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-sm font-medium">Histórico de utilização</p>
          <div className="flex flex-col gap-2">
            {e.historico.map((h, i) => (
              <div key={i} className="rounded-md border p-2.5 text-sm">
                <p className="font-medium">{h.evento}</p>
                <p className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatDate(h.data)} · {h.responsavel}
                  {h.projeto && ` · ${h.projeto}`}
                </p>
              </div>
            ))}
            {e.historico.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Sem movimentações recentes.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
