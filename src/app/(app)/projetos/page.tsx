"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FolderCheck,
  FolderClock,
  FolderKanban,
  OctagonAlert,
  UserCog,
  X,
} from "lucide-react";
import { formatBRL, projetoStatusMap } from "@/lib/status-map";
import { USUARIO_ATUAL_ID, getClienteNome } from "@/lib/mock-data";
import {
  getConformidadeDaEquipe,
  getProjetosVisiveis,
  getProntidaoDoProjeto,
  getRoadmapDoProjeto,
} from "@/lib/derivacoes";
import { useDataStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PapelVisualizacao } from "@/lib/types";

export default function ProjetosPage() {
  return (
    <Suspense fallback={null}>
      <ProjetosContent />
    </Suspense>
  );
}

function ProjetosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sem ?status= na URL, a lista abre na carteira viva ("em_andamento").
  // "todos" é o valor explícito de filtro limpo — se o chip navegasse para
  // /projetos sem query, o padrão reaplicaria o filtro que o usuário limpou.
  const statusParam = searchParams.get("status");
  const statusFiltro = statusParam ?? "em_andamento";

  const { projetos, etapasRoadmap } = useDataStore();

  // Compatibilidade com o padrão antigo de deep-link: ?open=<id> abria o
  // Dialog de detalhe. O detalhe agora é a tela /projetos/[id] — redireciona.
  const openId = searchParams.get("open");
  useEffect(() => {
    if (openId) router.replace(`/projetos/${openId}`);
  }, [openId, router]);

  // Rafael (USUARIO_ATUAL_ID) é coordenador de verdade na Home — o padrão
  // aqui é ver só o que lhe foi atribuído; "ver como gerente" é quem enxerga
  // a carteira inteira, papel de quem distribui os projetos entre coordenadores.
  const [papel, setPapel] = useState<PapelVisualizacao>("coordenador");
  const projetosVisiveis = useMemo(
    () => getProjetosVisiveis(projetos, papel, USUARIO_ATUAL_ID),
    [projetos, papel],
  );

  // "Com pendência" = algo impedindo o avanço: suspenso, bloqueio de
  // mobilização (prontidão), colaborador bloqueado ou etapa do roadmap
  // atrasada. Não é um status do projeto — é uma leitura transversal.
  const idsComPendencia = useMemo(() => {
    const ids = new Set<string>();
    for (const p of projetosVisiveis) {
      const impedido =
        p.status === "suspenso" ||
        getProntidaoDoProjeto(p.id).length > 0 ||
        getConformidadeDaEquipe(p.id).some((i) => i.status === "critico") ||
        getRoadmapDoProjeto(etapasRoadmap, p.id).some(
          (e) => e.status === "atrasada",
        );
      if (impedido) ids.add(p.id);
    }
    return ids;
  }, [projetosVisiveis, etapasRoadmap]);

  const listaFiltrada = useMemo(() => {
    if (statusFiltro === "todos") return projetosVisiveis;
    if (statusFiltro === "pendencia")
      return projetosVisiveis.filter((p) => idsComPendencia.has(p.id));
    return projetosVisiveis.filter((p) => p.status === statusFiltro);
  }, [statusFiltro, projetosVisiveis, idsComPendencia]);

  const emAndamento = projetosVisiveis.filter(
    (p) => p.status === "em_andamento",
  ).length;
  const planejamento = projetosVisiveis.filter(
    (p) => p.status === "planejamento",
  ).length;
  const concluidos = projetosVisiveis.filter(
    (p) => p.status === "concluido",
  ).length;
  const comPendencia = idsComPendencia.size;

  const filtroLabel =
    statusFiltro === "pendencia"
      ? "Com pendência"
      : (projetoStatusMap[statusFiltro]?.label ?? statusFiltro);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projetos, Contratos & Campanhas"
        description="Núcleo da operação: clientes, contratos, equipes e campanhas de campo."
        action={
          <div className="flex items-center gap-1.5 rounded-md border p-1">
            <UserCog className="ml-1 size-3.5 text-muted-foreground" />
            {(["coordenador", "gerente"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPapel(p)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium capitalize transition-colors",
                  papel === p
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                Ver como {p}
              </button>
            ))}
          </div>
        }
      />
      {papel === "coordenador" && (
        <p className="-mt-4 text-xs text-muted-foreground">
          Mostrando só os projetos atribuídos a você. Troque para
          &ldquo;gerente&rdquo; para ver a carteira inteira.
        </p>
      )}

      {/* O anel marca qual KPI está aplicado como filtro na lista abaixo. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div
          className={cn(
            statusFiltro === "em_andamento" &&
              "rounded-xl ring-2 ring-primary/40",
          )}
        >
          <KpiCard
            label="Em andamento"
            value={emAndamento}
            icon={FolderKanban}
            tone="success"
            href="/projetos?status=em_andamento"
          />
        </div>
        <div
          className={cn(
            statusFiltro === "planejamento" &&
              "rounded-xl ring-2 ring-primary/40",
          )}
        >
          <KpiCard
            label="Planejamento"
            value={planejamento}
            icon={FolderClock}
            href="/projetos?status=planejamento"
          />
        </div>
        <div
          className={cn(
            statusFiltro === "concluido" && "rounded-xl ring-2 ring-primary/40",
          )}
        >
          <KpiCard
            label="Concluídos"
            value={concluidos}
            icon={FolderCheck}
            href="/projetos?status=concluido"
          />
        </div>
        <div
          className={cn(
            statusFiltro === "pendencia" && "rounded-xl ring-2 ring-primary/40",
          )}
        >
          <KpiCard
            label="Com pendência"
            value={comPendencia}
            icon={OctagonAlert}
            tone={comPendencia > 0 ? "critical" : "default"}
            href="/projetos?status=pendencia"
          />
        </div>
      </div>

      {statusFiltro !== "todos" && (
        <div className="-mb-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtro ativo:</span>
          <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs font-medium">
            {filtroLabel}
            <Button
              variant="ghost"
              size="icon-xs"
              className="ml-0.5 size-4"
              onClick={() => router.push("/projetos?status=todos")}
            >
              <X className="size-3" />
            </Button>
          </span>
          <span className="text-xs text-muted-foreground">
            {listaFiltrada.length} de {projetosVisiveis.length}
          </span>
        </div>
      )}

      {listaFiltrada.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum projeto neste filtro.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {listaFiltrada.map((p) => {
            const map = projetoStatusMap[p.status];
            const etapas = getRoadmapDoProjeto(etapasRoadmap, p.id);
            const concluidas = etapas.filter(
              (e) => e.status === "concluida",
            ).length;
            const pct = etapas.length
              ? Math.round((concluidas / etapas.length) * 100)
              : 0;
            return (
              <Card
                key={p.id}
                onClick={() => router.push(`/projetos/${p.id}`)}
                className="cursor-pointer gap-3 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="flex flex-col gap-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getClienteNome(p.clienteId)} · {p.contrato}
                      </p>
                    </div>
                    <StatusBadge status={map.status} className="shrink-0">
                      {map.label}
                    </StatusBadge>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">
                      Valor do contrato
                    </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatBRL(p.valorContrato)}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progresso do roadmap</span>
                      <span className="font-mono tabular-nums">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
