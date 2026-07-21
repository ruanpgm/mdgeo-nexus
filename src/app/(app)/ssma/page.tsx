"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  HardHat,
  Heart,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { MockFoto } from "@/components/mtgl/mock-foto";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/status-map";
import {
  getColaboradorNome,
  checklistsCampo,
  regrasOuro,
} from "@/lib/mock-data";
import {
  CODIGO_DOCUMENTO_CHECKLIST,
  GRAVIDADE_ACIDENTE_LABEL,
  TIPO_ACIDENTE_LABEL,
  agruparCertificadosPorCategoria,
  getAcidentesPeriodo,
  getAsoStatus,
  getAsoVencendoOuVencido,
  getCertificadosPorColaborador,
  getColaboradoresSemAceiteRegrasOuro,
  getEstoqueEpiComStatus,
  getOcorrenciasPeriodo,
  getRegistrosDSSMAPeriodo,
  getTreinamentosAgendados,
  statusDoAcidente,
  statusDoChecklist,
} from "@/lib/derivacoes";
import { cn } from "@/lib/utils";
import type { ChecklistCampo, EstadoEmocional } from "@/lib/types";

const OCORRENCIA_LABEL: Record<string, string> = {
  quase_acidente: "Quase acidente",
  desvio_conduta: "Desvio de conduta",
  condicao_insegura: "Condição insegura",
  elogio: "Elogio",
};

const TIPO_CHECKLIST_LABEL: Record<string, string> = {
  preposto: "Inspeção de Preposto",
  "3rs_5s": "3Rs e 5S",
  ferramentas_pre_uso: "Ferramentas — pré-uso",
  kit_primeiros_socorros: "Kit de Primeiros Socorros",
  kit_emergencia: "Kit de Atendimento à Emergência",
};

const ESTADO_EMOCIONAL_LABEL: Record<EstadoEmocional, string> = {
  otimo: "Ótimo",
  bom: "Bom",
  ruim: "Ruim",
};

const ESTADO_EMOCIONAL_STATUS: Record<
  EstadoEmocional,
  "ok" | "atencao" | "critico"
> = {
  otimo: "ok",
  bom: "atencao",
  ruim: "critico",
};

export default function SsmaPage() {
  return (
    <Suspense fallback={null}>
      <SsmaContent />
    </Suspense>
  );
}

function SsmaContent() {
  const tabParam = useSearchParams().get("tab");
  const tabInicial = ["geral", "checklists", "regras", "dssma"].includes(
    tabParam ?? "",
  )
    ? tabParam!
    : "geral";

  const asoTodos = getAsoStatus();
  const asoAlerta = getAsoVencendoOuVencido();
  const treinamentosAgendados = getTreinamentosAgendados();
  const estoque = getEstoqueEpiComStatus();
  const estoqueCritico = estoque.filter((e) => e.status !== "ok");
  const certificados = getCertificadosPorColaborador();
  const gruposCertificados = agruparCertificadosPorCategoria(certificados);
  const acidentesAno = getAcidentesPeriodo("2026-01-01", "2026-12-31");
  const ocorrenciasAno = getOcorrenciasPeriodo("2026-01-01", "2026-12-31");
  const semAceite = getColaboradoresSemAceiteRegrasOuro();
  const dssmaRecentes = getRegistrosDSSMAPeriodo("2026-07-01", "2026-12-31");
  const checklistsComDesvio = checklistsCampo.filter(
    (c) => statusDoChecklist(c) !== "ok",
  );

  // Pesquisa por nome — vazio mostra todos, sem estado "selecionado" a limpar.
  const [buscaColaborador, setBuscaColaborador] = useState("");
  const buscaNormalizada = buscaColaborador.trim().toLowerCase();
  const certificadosFiltrados = buscaNormalizada
    ? certificados.filter((c) =>
        c.nome.toLowerCase().includes(buscaNormalizada),
      )
    : certificados;
  // Detalhe da categoria de certificados — guarda o label do grupo clicado.
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null);
  const certificadosDaCategoria = categoriaAberta
    ? certificados.filter((c) => c.categoriaLabel === categoriaAberta)
    : [];
  const [checklistAberto, setChecklistAberto] = useState<ChecklistCampo | null>(
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SSMA"
        description="Saúde, Segurança e Meio Ambiente — checklists de campo, Regras de Ouro, DSSMA, EPI, treinamentos e histórico de incidentes. Dados fictícios para demonstração."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="ASO vencido ou vencendo"
          value={asoAlerta.length}
          icon={AlertTriangle}
          tone={
            asoAlerta.some(
              (a) => a.prazo.bucket === "T0" || a.prazo.bucket === "T1",
            )
              ? "critical"
              : "warning"
          }
          hint={`${asoTodos.length} colaboradores com ASO cadastrado`}
        />
        <KpiCard
          label="Checklists com desvio"
          value={checklistsComDesvio.length}
          icon={ClipboardList}
          tone={
            checklistsComDesvio.some((c) => statusDoChecklist(c) === "critico")
              ? "critical"
              : "warning"
          }
          hint={`${checklistsCampo.length} checklists registrados`}
        />
        <KpiCard
          label="EPI — estoque crítico"
          value={estoqueCritico.length}
          icon={HardHat}
          tone={
            estoqueCritico.some((e) => e.status === "critico")
              ? "critical"
              : "warning"
          }
          hint="Abaixo do mínimo ou lote vencendo"
        />
        <KpiCard
          label="Acidentes no ano"
          value={acidentesAno.length}
          icon={ShieldAlert}
          tone={acidentesAno.length > 0 ? "critical" : "success"}
          hint={`${ocorrenciasAno.length} ocorrências registradas`}
        />
      </div>

      <Tabs defaultValue={tabInicial} key={tabInicial}>
        <TabsList>
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="checklists">Checklists de Campo</TabsTrigger>
          <TabsTrigger value="regras">Regras de Ouro</TabsTrigger>
          <TabsTrigger value="dssma">DSSMA</TabsTrigger>
        </TabsList>

        {/* VISÃO GERAL */}
        <TabsContent value="geral" className="mt-4 flex flex-col gap-6">
          <Card
            className={
              asoAlerta.length > 0
                ? "border-l-4 border-l-destructive"
                : undefined
            }
          >
            <CardHeader>
              <CardTitle>ASO vencido e a vencer</CardTitle>
              <CardDescription>
                Sem ASO válido o colaborador não entra na área do cliente, mesmo
                com todo o resto em dia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {asoAlerta.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum ASO vencido ou vencendo nos próximos 30 dias.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asoAlerta.map((a) => (
                        <TableRow key={a.colaboradorId}>
                          <TableCell className="font-medium">
                            {a.nome}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {a.cargo}
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums">
                            {formatDate(a.validade)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={a.prazo.status}>
                              {a.prazo.label}
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Treinamentos e reciclagens agendadas</CardTitle>
              <CardDescription>
                Turmas marcadas — quantos dos participantes já estão com
                pendência resolvida por esta data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Treinamento</TableHead>
                      <TableHead>Instrutor / local</TableHead>
                      <TableHead className="text-right">
                        Participantes
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treinamentosAgendados.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {formatDate(t.dataAgendada)}
                        </TableCell>
                        <TableCell className="font-medium">{t.nome}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.instrutor} · {t.local}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono tabular-nums">
                            {t.colaboradorIds.length}
                          </span>
                          {t.participantesVencendo > 0 && (
                            <span className="ml-1.5 text-xs text-warning">
                              ({t.participantesVencendo} resolvendo pendência)
                            </span>
                          )}
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
              <CardTitle>Estoque de EPI</CardTitle>
              <CardDescription>
                Quantidade contra o mínimo e validade do lote.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>CA</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Validade do lote</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estoque.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">
                          {e.item}
                          {e.tamanho && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              ({e.tamanho})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {e.ca}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "font-mono tabular-nums",
                              e.quantidade < e.minimo &&
                                "font-semibold text-destructive",
                            )}
                          >
                            {e.quantidade}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {e.minimo} mín.
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {formatDate(e.validadeLote)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={e.status}>
                            {e.status === "ok" ? "Ok" : e.motivo.join(" · ")}
                          </StatusBadge>
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
              <CardTitle>Certificados</CardTitle>
              <CardDescription>
                Separados por categoria ou por colaborador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="categoria">
                <TabsList>
                  <TabsTrigger value="categoria">Por categoria</TabsTrigger>
                  <TabsTrigger value="colaborador">Por colaborador</TabsTrigger>
                </TabsList>

                <TabsContent value="categoria" className="mt-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gruposCertificados.map((g) => {
                      const vencendo = g.itens.filter(
                        (i) => i.status !== "ok",
                      ).length;
                      return (
                        <button
                          key={g.label}
                          type="button"
                          onClick={() => setCategoriaAberta(g.label)}
                          className="cursor-pointer rounded-md border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{g.label}</p>
                            <span className="font-mono text-xs tabular-nums text-muted-foreground">
                              {g.itens.length}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {vencendo > 0
                              ? `${vencendo} vencidos ou vencendo`
                              : "Todos válidos"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="colaborador" className="mt-4">
                  <div className="relative mb-3 max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={buscaColaborador}
                      onChange={(e) => setBuscaColaborador(e.target.value)}
                      placeholder="Pesquisar colaborador…"
                      className="pl-8"
                    />
                  </div>
                  {certificadosFiltrados.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum colaborador encontrado para a pesquisa.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Certificado</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {certificadosFiltrados.map((c, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">
                                {c.nome}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {c.categoriaLabel}
                              </TableCell>
                              <TableCell>{c.nomeCertificado}</TableCell>
                              <TableCell className="font-mono text-xs tabular-nums">
                                {c.validade ? formatDate(c.validade) : "—"}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={c.status}>
                                  {c.status === "ok"
                                    ? "Válido"
                                    : c.status === "atencao"
                                      ? "Vencendo"
                                      : "Vencido"}
                                </StatusBadge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de acidentes</CardTitle>
              <CardDescription>
                Por período, com causa, motivo e ação corretiva aplicada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {acidentesAno.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum acidente registrado no período.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {acidentesAno.map((a) => (
                    <li key={a.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {TIPO_ACIDENTE_LABEL[a.tipo]} · {a.local}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(a.data)}
                            {a.atividadeExercida && ` · ${a.atividadeExercida}`}
                            {a.diasAfastamento > 0 &&
                              ` · ${a.diasAfastamento} dias de afastamento`}
                            {a.cat && a.numeroCat && ` · CAT ${a.numeroCat}`}
                          </p>
                        </div>
                        <StatusBadge
                          status={statusDoAcidente(a)}
                          className="shrink-0"
                        >
                          {GRAVIDADE_ACIDENTE_LABEL[a.gravidade]}
                        </StatusBadge>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {a.descricao}
                      </p>

                      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground">
                            Causa
                          </dt>
                          <dd className="text-xs">{a.causa}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground">
                            Motivo (causa raiz)
                          </dt>
                          <dd className="text-xs">{a.motivo}</dd>
                        </div>
                      </dl>

                      {a.acoesCorretivas.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Medidas corretivas e preventivas
                          </p>
                          <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                            {a.acoesCorretivas.map((ac, n) => (
                              <li key={n}>{ac}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {a.fotoLegendas && a.fotoLegendas.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {a.fotoLegendas.map((legenda, n) => (
                            <MockFoto
                              key={n}
                              legenda={legenda}
                              etiqueta="Registro"
                              data={a.data}
                            />
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-primary" />
                Ocorrências no período
              </CardTitle>
              <CardDescription>
                Quase-acidentes, desvios e condições inseguras — não geram CAT,
                mas apontam risco antes de virar acidente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ocorrenciasAno.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ocorrência registrada no período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Ação tomada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ocorrenciasAno.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs tabular-nums">
                            {formatDate(o.data)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={o.gravidade}>
                              {OCORRENCIA_LABEL[o.tipo]}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {o.descricao}
                          </TableCell>
                          <TableCell className="text-xs">
                            {o.acaoTomada}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHECKLISTS DE CAMPO */}
        <TabsContent value="checklists" className="mt-4 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Modelo real MDGEO (RG.xx-PSSO.02/04) — Local/Data/CC → Responsável →
            itens Atende/Não Atende/Não Aplicável → verificação de eficácia da
            inspeção anterior.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Desvios</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...checklistsCampo]
                  .sort((a, b) => b.data.localeCompare(a.data))
                  .map((c) => {
                    const desvios = c.itens.filter(
                      (i) => i.status === "nao_atende",
                    ).length;
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => setChecklistAberto(c)}
                      >
                        <TableCell className="font-mono text-xs tabular-nums">
                          {formatDate(c.data)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {TIPO_CHECKLIST_LABEL[c.tipo]}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {CODIGO_DOCUMENTO_CHECKLIST[c.tipo]}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.local}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.responsavelInspecao}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {desvios}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={statusDoChecklist(c)}>
                            {statusDoChecklist(c) === "ok"
                              ? "Sem desvios"
                              : statusDoChecklist(c) === "atencao"
                                ? "Com desvios"
                                : "Reincidência / reprovado"}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* REGRAS DE OURO */}
        <TabsContent value="regras" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Regras de Ouro MDGEO — R04
              </CardTitle>
              <CardDescription>
                10 regras de SSMA que todo colaborador assina ciência de
                cumprimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-2">
                {regrasOuro.map((r) => (
                  <li key={r.numero} className="flex gap-2 text-sm">
                    <span className="font-mono font-semibold text-primary">
                      {r.numero}.
                    </span>
                    <span>{r.texto}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card
            className={
              semAceite.length > 0 ? "border-l-4 border-l-warning" : undefined
            }
          >
            <CardHeader>
              <CardTitle>Termo de ciência</CardTitle>
              <CardDescription>
                {semAceite.length === 0
                  ? "Todos os colaboradores aceitaram a versão vigente."
                  : `${semAceite.length} ${semAceite.length === 1 ? "colaborador ainda não aceitou" : "colaboradores ainda não aceitaram"} a versão vigente (R04).`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {semAceite.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {semAceite.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                    >
                      <div>
                        <p className="font-medium">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.cargo}
                        </p>
                      </div>
                      <StatusBadge status="atencao">Pendente</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DSSMA */}
        <TabsContent value="dssma" className="mt-4 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Diálogo de Saúde, Segurança e Meio Ambiente diário — registro do
            estado emocional da equipe antes de ir a campo
            (&ldquo;Emociograma&rdquo;).
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dssmaRecentes.map((d) => (
              <Card key={d.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <Heart className="size-4 text-primary" />
                      {formatDate(d.data)}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {d.area === "adm" ? "ADM" : "Operacional"} · {d.horario}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {d.participantes.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{getColaboradorNome(p.colaboradorId)}</span>
                      <StatusBadge status={ESTADO_EMOCIONAL_STATUS[p.estado]}>
                        {ESTADO_EMOCIONAL_LABEL[p.estado]}
                      </StatusBadge>
                    </div>
                  ))}
                  {d.comentarios && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.comentarios}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!checklistAberto}
        onOpenChange={(v) => !v && setChecklistAberto(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {checklistAberto && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {TIPO_CHECKLIST_LABEL[checklistAberto.tipo]}
                </DialogTitle>
                <DialogDescription>
                  {CODIGO_DOCUMENTO_CHECKLIST[checklistAberto.tipo]} · Rev.{" "}
                  {checklistAberto.revisao} · {checklistAberto.local} ·{" "}
                  {formatDate(checklistAberto.data)} {checklistAberto.horario}
                </DialogDescription>
              </DialogHeader>
              <div className="flex min-w-0 flex-col gap-4 pb-2">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Centro de custo
                    </dt>
                    <dd className="font-mono text-xs">
                      {checklistAberto.centroCusto}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Responsável
                    </dt>
                    <dd className="font-medium">
                      {checklistAberto.responsavelInspecao}
                    </dd>
                  </div>
                  {checklistAberto.corMes && (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Cor do mês
                      </dt>
                      <dd className="font-medium capitalize">
                        {checklistAberto.corMes}
                      </dd>
                    </div>
                  )}
                  {checklistAberto.aprovado !== undefined && (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Resultado
                      </dt>
                      <dd>
                        <StatusBadge
                          status={checklistAberto.aprovado ? "ok" : "critico"}
                        >
                          {checklistAberto.aprovado ? "Aprovado" : "Reprovado"}
                        </StatusBadge>
                      </dd>
                    </div>
                  )}
                </dl>

                <div>
                  <p className="mb-2 text-sm font-medium">Participantes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {checklistAberto.participantes.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs"
                      >
                        {p.nome} · {p.matricula}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Itens</p>
                  <ul className="flex flex-col gap-1.5">
                    {checklistAberto.itens.map((item, i) => (
                      <li key={i} className="rounded-md border p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm">{item.item}</span>
                          {item.status === "atende" && (
                            <CheckCircle2
                              className="size-4 shrink-0 text-success"
                              aria-label="Atende"
                            />
                          )}
                          {item.status === "nao_atende" && (
                            <XCircle
                              className="size-4 shrink-0 text-destructive"
                              aria-label="Não atende"
                            />
                          )}
                          {item.status === "nao_aplicavel" && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </div>
                        {item.observacao && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.observacao}
                          </p>
                        )}
                        {item.prazo && item.responsavel && (
                          <p className="mt-1 text-xs text-warning">
                            Prazo {formatDate(item.prazo)} · {item.responsavel}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {checklistAberto.boasPraticas &&
                  checklistAberto.boasPraticas.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">
                        Boas práticas e conformidades
                      </p>
                      <ul className="flex flex-col gap-1">
                        {checklistAberto.boasPraticas.map((b, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {b.item}:
                            </span>{" "}
                            {b.descricao}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs">
                  <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
                  {checklistAberto.eficaciaInspecaoAnterior === null ? (
                    <span className="text-muted-foreground">
                      Sem inspeção anterior para comparar.
                    </span>
                  ) : checklistAberto.eficaciaInspecaoAnterior ? (
                    <span className="text-muted-foreground">
                      Eficácia da inspeção anterior verificada.
                    </span>
                  ) : (
                    <span className="font-medium text-destructive">
                      Desvio de inspeção anterior não corrigido — registrado
                      como reincidência.
                    </span>
                  )}
                </div>

                {checklistAberto.observacoesGerais && (
                  <p className="text-sm text-muted-foreground">
                    {checklistAberto.observacoesGerais}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Detalhe da categoria de certificados — todos os certificados do grupo clicado. */}
      <Dialog
        open={!!categoriaAberta}
        onOpenChange={(v) => !v && setCategoriaAberta(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {categoriaAberta && (
            <>
              <DialogHeader>
                <DialogTitle>{categoriaAberta}</DialogTitle>
                <DialogDescription>
                  {certificadosDaCategoria.length === 1
                    ? "1 certificado na categoria."
                    : `${certificadosDaCategoria.length} certificados na categoria.`}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-x-auto pb-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Certificado</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificadosDaCategoria.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell>{c.nomeCertificado}</TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {c.validade ? formatDate(c.validade) : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status}>
                            {c.status === "ok"
                              ? "Válido"
                              : c.status === "atencao"
                                ? "Vencendo"
                                : "Vencido"}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
