"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCheck, UserCog, UserX, X } from "lucide-react";
import {
  colaboradorStatusMap,
  formatDate,
  prazoBucket,
} from "@/lib/status-map";
import {
  HOJE,
  colaboradores,
  dashboardKpis,
  getAcidentesDoColaborador,
  getOcorrenciasDoColaborador,
} from "@/lib/mock-data";
import {
  GRAVIDADE_ACIDENTE_LABEL,
  TIPO_ACIDENTE_LABEL,
  statusDoAcidente,
} from "@/lib/derivacoes";
import type { Colaborador } from "@/lib/types";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Estado agregado da documentação (documentos + CNH + crachás) para a coluna
 * da tabela. Documentos contam pelo status já derivado; CNH e crachás passam
 * pela T-scale: T0/T1 (vencido/vencendo crítico) somam em vencidos, T2 em
 * vencendo. Vencido domina o badge; depois vencendo; senão em dia.
 */
function documentacaoAgregada(c: Colaborador): {
  status: "ok" | "atencao" | "critico";
  label: string;
} {
  let vencidos = 0;
  let vencendo = 0;
  for (const d of c.documentos) {
    if (d.status === "critico") vencidos += 1;
    else if (d.status === "atencao") vencendo += 1;
  }
  const validades = [
    ...(c.cnh ? [c.cnh.validade] : []),
    ...c.crachas.map((cr) => cr.validade),
  ];
  for (const v of validades) {
    const { bucket } = prazoBucket(v, HOJE);
    if (bucket === "T0" || bucket === "T1") vencidos += 1;
    else if (bucket === "T2") vencendo += 1;
  }
  if (vencidos > 0) {
    return {
      status: "critico",
      label: `${vencidos} vencido${vencidos === 1 ? "" : "s"}`,
    };
  }
  if (vencendo > 0) {
    return { status: "atencao", label: `${vencendo} vencendo` };
  }
  return { status: "ok", label: "Em dia" };
}

const FILTER_LABELS: Record<string, string> = {
  apto: "Aptos",
  pendente: "Com pendência",
  bloqueado: "Bloqueados",
  pendencia: "Com pendência ou bloqueados",
};

const OCORRENCIA_LABEL: Record<string, string> = {
  quase_acidente: "Quase acidente",
  desvio_conduta: "Desvio de conduta",
  condicao_insegura: "Condição insegura",
  elogio: "Elogio",
};

export default function ColaboradoresPage() {
  return (
    <Suspense fallback={null}>
      <ColaboradoresContent />
    </Suspense>
  );
}

function ColaboradoresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFiltro = searchParams.get("status");
  const treinamentoFiltro = searchParams.get("treinamento");
  const openId = searchParams.get("open");
  const abaInicial = searchParams.get("aba") ?? "documentos";

  // Sentinela undefined|string|null — ver src/app/(app)/projetos/page.tsx.
  const [abertoLocal, setAbertoLocal] = useState<string | null | undefined>(
    undefined,
  );
  const selecionadoId = abertoLocal === undefined ? openId : abertoLocal;
  const selecionado = selecionadoId
    ? (colaboradores.find((x) => x.id === selecionadoId) ?? null)
    : null;

  function abrir(c: Colaborador) {
    setAbertoLocal(c.id);
  }

  function fechar() {
    setAbertoLocal(null);
    if (openId) {
      const q = new URLSearchParams(searchParams.toString());
      q.delete("open");
      q.delete("aba");
      router.replace(q.size ? `/colaboradores?${q}` : "/colaboradores", {
        scroll: false,
      });
    }
  }

  const listaFiltrada = useMemo(() => {
    return colaboradores.filter((c) => {
      if (statusFiltro === "pendencia" && c.status === "apto") return false;
      if (
        statusFiltro &&
        statusFiltro !== "pendencia" &&
        c.status !== statusFiltro
      )
        return false;
      if (
        treinamentoFiltro === "vencendo" &&
        !c.treinamentos.some((t) => t.status !== "ok")
      )
        return false;
      return true;
    });
  }, [statusFiltro, treinamentoFiltro]);

  const filtroAtivoLabel = statusFiltro
    ? FILTER_LABELS[statusFiltro]
    : treinamentoFiltro === "vencendo"
      ? "Treinamentos vencendo"
      : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mobilização de Colaboradores"
        description="Ficha completa: documentação, CNH, crachás de acesso, treinamentos e histórico."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          label="Aptos"
          value={dashboardKpis.colaboradoresAptos}
          icon={UserCheck}
          tone="success"
          href="/colaboradores?status=apto"
        />
        <KpiCard
          label="Com pendência"
          value={colaboradores.filter((c) => c.status === "pendente").length}
          icon={UserCog}
          tone="warning"
          href="/colaboradores?status=pendente"
        />
        <KpiCard
          label="Bloqueados"
          value={colaboradores.filter((c) => c.status === "bloqueado").length}
          icon={UserX}
          tone="critical"
          href="/colaboradores?status=bloqueado"
        />
      </div>

      <Tabs
        value={statusFiltro ?? "todos"}
        onValueChange={(v) =>
          router.push(
            v === "todos" ? "/colaboradores" : `/colaboradores?status=${v}`,
          )
        }
      >
        <TabsList>
          <TabsTrigger value="todos">
            Todos ({colaboradores.length})
          </TabsTrigger>
          <TabsTrigger value="apto">
            Aptos ({colaboradores.filter((c) => c.status === "apto").length})
          </TabsTrigger>
          <TabsTrigger value="pendente">
            Pendência (
            {colaboradores.filter((c) => c.status === "pendente").length})
          </TabsTrigger>
          <TabsTrigger value="bloqueado">
            Bloqueados (
            {colaboradores.filter((c) => c.status === "bloqueado").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent>
          {treinamentoFiltro === "vencendo" && (
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
                  onClick={() => router.push("/colaboradores")}
                >
                  <X className="size-3" />
                </Button>
              </span>
              <span className="text-xs text-muted-foreground">
                {listaFiltrada.length} de {colaboradores.length}
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead>Documentação</TableHead>
                  <TableHead>Pendências</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaFiltrada.map((c) => {
                  const map = colaboradorStatusMap[c.status];
                  const doc = documentacaoAgregada(c);
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => abrir(c)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7">
                            <AvatarFallback className="text-[10px]">
                              {iniciais(c.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{c.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.cargo}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.supervisor}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {formatDate(c.admissao)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status}>
                          {doc.label}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.pendencias.length > 0
                          ? c.pendencias.join(", ")
                          : "—"}
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {selecionado && (
            <DetalheColaborador
              colaborador={selecionado}
              abaInicial={abaInicial}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetalheColaborador({
  colaborador: c,
  abaInicial,
}: {
  colaborador: Colaborador;
  abaInicial: string;
}) {
  const acidentes = getAcidentesDoColaborador(c.id);
  const ocorrencias = getOcorrenciasDoColaborador(c.id);

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle>{c.nome}</DialogTitle>
            <DialogDescription>
              {c.cargo} · {c.funcao}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="min-w-0 pb-4">
        <Tabs defaultValue={abaInicial} key={c.id}>
          <TabsList className="w-full">
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="acesso">Acesso</TabsTrigger>
            <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
            <TabsTrigger value="epis">EPIs</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="mt-3 flex flex-col gap-2">
            <div className="mb-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">CPF</p>
                <p className="font-mono text-xs">{c.cpf}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contato</p>
                <p className="text-xs">{c.telefone}</p>
              </div>
            </div>
            {c.documentos.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{d.tipo}</p>
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    Emissão {formatDate(d.emissao)} · Validade{" "}
                    {formatDate(d.validade)}
                  </p>
                </div>
                <StatusBadge status={d.status}>
                  {d.status === "ok"
                    ? "Válido"
                    : d.status === "atencao"
                      ? "Vencendo"
                      : "Vencido"}
                </StatusBadge>
              </div>
            ))}
          </TabsContent>

          {/* CNH + crachás de acesso — a doc é explícita: "Crachá tem
              vencimento", e sem ele não há acesso à mina mesmo com tudo em dia. */}
          <TabsContent value="acesso" className="mt-3 flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                CNH
              </p>
              {c.cnh ? (
                <div className="rounded-md border p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Categoria {c.cnh.categoria}
                    </span>
                    <StatusBadge
                      status={prazoBucket(c.cnh.validade, HOJE).status}
                    >
                      {formatDate(c.cnh.validade)}
                    </StatusBadge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    {c.cnh.numero} · 1ª habilitação{" "}
                    {formatDate(c.cnh.primeiraHabilitacao)}
                  </p>
                  {c.cnh.observacoes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.cnh.observacoes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sem CNH cadastrada.
                </p>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Crachás de acesso ao cliente
              </p>
              <div className="flex flex-col gap-2">
                {c.crachas.map((cr, i) => {
                  const prazo = prazoBucket(cr.validade, HOJE);
                  return (
                    <div key={i} className="rounded-md border p-2.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cr.cliente}</span>
                        <StatusBadge status={prazo.status}>
                          {prazo.label}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cr.unidade}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground tabular-nums">
                        Nº {cr.numero} · válido até {formatDate(cr.validade)}
                      </p>
                    </div>
                  );
                })}
                {c.crachas.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum crachá emitido.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="treinamentos"
            className="mt-3 flex flex-col gap-2"
          >
            <p className="mb-1 text-xs text-muted-foreground">
              Matriz de treinamentos exigidos por cliente/projeto.
            </p>
            {c.treinamentos.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {t.concluido ? "✔" : "❌"} {t.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.cliente}</p>
                </div>
                <StatusBadge status={t.status}>
                  {t.validade ? formatDate(t.validade) : "pendente"}
                </StatusBadge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="epis" className="mt-3 flex flex-col gap-2">
            {c.epis.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{e.item}</p>
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    Entrega {formatDate(e.dataEntrega)} · Validade{" "}
                    {formatDate(e.validade)}
                  </p>
                </div>
                <StatusBadge status={e.status}>
                  {e.status === "ok"
                    ? "Ok"
                    : e.status === "atencao"
                      ? "Renovar"
                      : "Vencido"}
                </StatusBadge>
              </div>
            ))}
            {c.epis.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum EPI registrado.
              </p>
            )}
          </TabsContent>

          {/* Acidentes e ocorrências ligados aos registros reais — não a um
              contador. Ver docs/projeto-abas.md. */}
          <TabsContent value="historico" className="mt-3 flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Acidentes ({acidentes.length})
              </p>
              <div className="flex flex-col gap-2">
                {acidentes.map((a) => (
                  <div key={a.id} className="rounded-md border p-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {TIPO_ACIDENTE_LABEL[a.tipo]}
                      </span>
                      <StatusBadge status={statusDoAcidente(a)}>
                        {GRAVIDADE_ACIDENTE_LABEL[a.gravidade]}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.local}</p>
                    <p className="font-mono text-xs text-muted-foreground tabular-nums">
                      {formatDate(a.data)}
                      {a.diasAfastamento > 0 &&
                        ` · ${a.diasAfastamento} dias de afastamento`}
                    </p>
                  </div>
                ))}
                {acidentes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum acidente registrado.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Ocorrências ({ocorrencias.length})
              </p>
              <div className="flex flex-col gap-2">
                {ocorrencias.map((o) => (
                  <div key={o.id} className="rounded-md border p-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {OCORRENCIA_LABEL[o.tipo]}
                      </span>
                      <StatusBadge status={o.gravidade}>
                        {formatDate(o.data)}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {o.descricao}
                    </p>
                  </div>
                ))}
                {ocorrencias.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma ocorrência registrada.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">
              Histórico de projetos: {c.projetosHistorico.join(", ") || "—"}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
