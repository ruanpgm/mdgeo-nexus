"use client";

/**
 * Seções reutilizáveis do projeto — roadmap, conformidade, equipamentos,
 * custo comparado e materiais. Extraídas da lista para servir também à tela
 * dedicada /projetos/[id], sem duplicar o CRUD do roadmap nem as derivações.
 */

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Circle,
  CircleCheck,
  CircleDashed,
  Plus,
  Route,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import { StatusBadge } from "@/components/mtgl/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL, formatDate } from "@/lib/status-map";
import { HOJE, colaboradores, getColaboradorNome } from "@/lib/mock-data";
import {
  avaliarAlocacao,
  getAlocacoesDoProjeto,
  getConformidadeDaEquipe,
  getCustosAnteriores,
  getEquipamentoPorId,
  getMaterialPorId,
  getMovimentacoesDoProjeto,
  getRoadmapDoProjeto,
  statusDaConformidade,
} from "@/lib/derivacoes";
import { useDataStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { EtapaRoadmap, StatusEtapaRoadmap } from "@/lib/types";

const ALOCACAO_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  aprovado: "Aprovado",
  disponibilizado: "Disponibilizado",
  em_campo: "Em campo",
  devolvido: "Devolvido",
};

const ETAPA_ROADMAP_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  atrasada: "Atrasada",
};

const ETAPA_ICON: Record<string, typeof Circle> = {
  concluida: CircleCheck,
  em_andamento: Circle,
  atrasada: TriangleAlert,
  pendente: CircleDashed,
};

const ETAPA_STATUS: Record<string, "ok" | "info" | "critico" | "neutro"> = {
  concluida: "ok",
  em_andamento: "info",
  atrasada: "critico",
  pendente: "neutro",
};

const ETAPA_STATUS_OPCOES: StatusEtapaRoadmap[] = [
  "pendente",
  "em_andamento",
  "concluida",
  "atrasada",
];
const ETAPA_STATUS_ITEMS = ETAPA_STATUS_OPCOES.map((s) => ({
  value: s,
  label: ETAPA_ROADMAP_LABEL[s],
}));

type EtapaForm = {
  nome: string;
  responsavelId: string;
  dataInicio: string;
  dataLimite: string;
  status: StatusEtapaRoadmap;
  descricao: string;
};

function etapaFormVazio(): EtapaForm {
  return {
    nome: "",
    responsavelId: colaboradores[0]?.id ?? "",
    dataInicio: HOJE,
    dataLimite: HOJE,
    status: "pendente",
    descricao: "",
  };
}

/**
 * Roadmap visual: os passos até a conclusão. Clicar numa etapa expande a
 * edição ali mesmo (sem abrir um segundo modal) — muda o status, o
 * responsável ou o prazo, e qualquer outra tela que leia `etapasRoadmap` do
 * store enxerga a mudança na hora.
 */
export function RoadmapDoProjeto({ projetoId }: { projetoId: string }) {
  const {
    etapasRoadmap,
    criarEtapaRoadmap,
    atualizarEtapaRoadmap,
    excluirEtapaRoadmap,
  } = useDataStore();
  const etapas = getRoadmapDoProjeto(etapasRoadmap, projetoId);

  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [form, setForm] = useState<EtapaForm>(etapaFormVazio());
  const [criando, setCriando] = useState(false);
  const [formNova, setFormNova] = useState<EtapaForm>(etapaFormVazio());

  function abrirEtapa(e: EtapaRoadmap) {
    if (abertaId === e.id) {
      setAbertaId(null);
      return;
    }
    setForm({
      nome: e.nome,
      responsavelId: e.responsavelId,
      dataInicio: e.dataInicio,
      dataLimite: e.dataLimite,
      status: e.status,
      descricao: e.descricao ?? "",
    });
    setAbertaId(e.id);
  }

  function salvarEtapa(id: string) {
    atualizarEtapaRoadmap(id, {
      nome: form.nome.trim(),
      responsavelId: form.responsavelId,
      dataInicio: form.dataInicio,
      dataLimite: form.dataLimite,
      status: form.status,
      descricao: form.descricao.trim() || undefined,
    });
    setAbertaId(null);
  }

  function criarNovaEtapa() {
    if (!formNova.nome.trim()) return;
    criarEtapaRoadmap({
      projetoId,
      nome: formNova.nome.trim(),
      responsavelId: formNova.responsavelId,
      dataInicio: formNova.dataInicio,
      dataLimite: formNova.dataLimite,
      status: formNova.status,
      // Deriva a ordem do maior valor existente, não da contagem: excluir uma
      // etapa intermediária reduz o length e faria a próxima nova colidir com
      // uma ordem já em uso. Math.max sobre as ordens evita a duplicata.
      ordem: (etapas.length ? Math.max(...etapas.map((e) => e.ordem)) : 0) + 1,
      descricao: formNova.descricao.trim() || undefined,
    });
    setFormNova(etapaFormVazio());
    setCriando(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Route className="size-4 text-primary" /> Roadmap até a conclusão
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => setCriando((v) => !v)}
        >
          {criando ? <X className="size-3" /> : <Plus className="size-3" />}
          {criando ? "Cancelar" : "Adicionar etapa"}
        </Button>
      </div>

      {etapas.length === 0 && !criando && (
        <p className="text-xs text-muted-foreground">
          Nenhuma etapa cadastrada.
        </p>
      )}

      <ol className="flex flex-col gap-0">
        {etapas.map((e, i) => {
          const Icon = ETAPA_ICON[e.status];
          const aberta = abertaId === e.id;
          return (
            <li key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    e.status === "concluida" && "text-success",
                    e.status === "em_andamento" && "text-info",
                    e.status === "atrasada" && "text-destructive",
                    e.status === "pendente" && "text-muted-foreground",
                  )}
                />
                {i < etapas.length - 1 && (
                  <div className="my-0.5 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-3">
                <button
                  onClick={() => abrirEtapa(e)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <p className="text-sm font-medium hover:underline">
                    {e.nome}
                  </p>
                  <StatusBadge
                    status={ETAPA_STATUS[e.status]}
                    className="shrink-0"
                  >
                    {ETAPA_ROADMAP_LABEL[e.status]}
                  </StatusBadge>
                </button>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {getColaboradorNome(e.responsavelId)} ·{" "}
                  {formatDate(e.dataInicio)} – {formatDate(e.dataLimite)}
                </p>
                {e.descricao && !aberta && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.descricao}
                  </p>
                )}

                {aberta && (
                  <div className="mt-2 flex flex-col gap-2 rounded-md border bg-muted/30 p-2.5">
                    <Input
                      value={form.nome}
                      onChange={(ev) =>
                        setForm((f) => ({ ...f, nome: ev.target.value }))
                      }
                      placeholder="Nome da etapa"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={form.responsavelId}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, responsavelId: v as string }))
                        }
                        items={colaboradores.map((c) => ({
                          value: c.id,
                          label: c.nome,
                        }))}
                      >
                        <SelectTrigger size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colaboradores.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={form.status}
                        onValueChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            status: v as StatusEtapaRoadmap,
                          }))
                        }
                        items={ETAPA_STATUS_ITEMS}
                      >
                        <SelectTrigger size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ETAPA_STATUS_OPCOES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {ETAPA_ROADMAP_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={form.dataInicio}
                        onChange={(ev) =>
                          setForm((f) => ({
                            ...f,
                            dataInicio: ev.target.value,
                          }))
                        }
                      />
                      <Input
                        type="date"
                        value={form.dataLimite}
                        onChange={(ev) =>
                          setForm((f) => ({
                            ...f,
                            dataLimite: ev.target.value,
                          }))
                        }
                      />
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Descrição (opcional)"
                      value={form.descricao}
                      onChange={(ev) =>
                        setForm((f) => ({ ...f, descricao: ev.target.value }))
                      }
                    />
                    <div className="flex justify-between gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => {
                          excluirEtapaRoadmap(e.id);
                          setAbertaId(null);
                        }}
                      >
                        <Trash2 className="size-3.5" /> Excluir etapa
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => salvarEtapa(e.id)}
                      >
                        <Check className="size-3.5" /> Salvar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {criando && (
        <div className="mt-2 flex flex-col gap-2 rounded-md border bg-muted/30 p-2.5">
          <Input
            value={formNova.nome}
            onChange={(ev) =>
              setFormNova((f) => ({ ...f, nome: ev.target.value }))
            }
            placeholder="Nome da etapa"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={formNova.responsavelId}
              onValueChange={(v) =>
                setFormNova((f) => ({ ...f, responsavelId: v as string }))
              }
              items={colaboradores.map((c) => ({ value: c.id, label: c.nome }))}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formNova.status}
              onValueChange={(v) =>
                setFormNova((f) => ({ ...f, status: v as StatusEtapaRoadmap }))
              }
              items={ETAPA_STATUS_ITEMS}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ETAPA_STATUS_OPCOES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ETAPA_ROADMAP_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={formNova.dataInicio}
              onChange={(ev) =>
                setFormNova((f) => ({ ...f, dataInicio: ev.target.value }))
              }
            />
            <Input
              type="date"
              value={formNova.dataLimite}
              onChange={(ev) =>
                setFormNova((f) => ({ ...f, dataLimite: ev.target.value }))
              }
            />
          </div>
          <Button size="sm" className="w-fit gap-1" onClick={criarNovaEtapa}>
            <Check className="size-3.5" /> Adicionar etapa
          </Button>
        </div>
      )}
    </div>
  );
}

/** "A equipe pode entrar na mina?" — derivado de ASO, curso, crachá e CNH. */
export function ConformidadeEquipe({ projetoId }: { projetoId: string }) {
  const itens = getConformidadeDaEquipe(projetoId);
  const status = statusDaConformidade(itens);
  const aptos = itens.filter((i) => i.status === "ok").length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Conformidade da equipe</p>
        <StatusBadge status={status}>
          {itens.length === 0
            ? "Sem equipe"
            : status === "ok"
              ? "Equipe liberada"
              : `${aptos} de ${itens.length} liberados`}
        </StatusBadge>
      </div>

      {itens.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum colaborador alocado.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {itens.map((i) => (
            <li key={i.colaboradorId} className="rounded-md border p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.cargo}
                  </p>
                </div>
                <StatusBadge status={i.status} className="shrink-0">
                  {i.status === "ok"
                    ? "Apto"
                    : i.status === "critico"
                      ? "Bloqueado"
                      : "Pendência"}
                </StatusBadge>
              </div>
              {i.pendencias.length > 0 && (
                <ul className="mt-1.5 list-inside list-disc text-xs text-muted-foreground">
                  {i.pendencias.map((p, n) => (
                    <li key={n}>{p}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Uma solicitação criada nesta sessão — vive só no useState local, como o
// resto do CRUD do mockup, sem tocar no store.
type SolicitacaoLocal = { id: string; nome: string; dataNecessaria: string };

/** Ciclo solicitado -> aprovado -> DISPONIBILIZADO, contra a data necessária. */
export function EquipamentosSolicitados({ projetoId }: { projetoId: string }) {
  const alocacoes = getAlocacoesDoProjeto(projetoId);

  // Toggle do formulário inline (espelha o "Adicionar etapa" do roadmap) e o
  // acúmulo das solicitações feitas nesta sessão.
  const [solicitando, setSolicitando] = useState(false);
  const [nomeEquip, setNomeEquip] = useState("");
  const [dataNecessaria, setDataNecessaria] = useState(HOJE);
  const [solicitacoesLocais, setSolicitacoesLocais] = useState<
    SolicitacaoLocal[]
  >([]);

  function adicionarSolicitacao() {
    if (!nomeEquip.trim()) return;
    setSolicitacoesLocais((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nome: nomeEquip.trim(),
        dataNecessaria,
      },
    ]);
    // Zera o formulário e o fecha — o feedback vira o item na lista abaixo.
    setNomeEquip("");
    setDataNecessaria(HOJE);
    setSolicitando(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Equipamentos solicitados</p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => setSolicitando((v) => !v)}
        >
          {solicitando ? <X className="size-3" /> : <Plus className="size-3" />}
          {solicitando ? "Cancelar" : "Solicitar equipamento"}
        </Button>
      </div>

      {solicitando && (
        <div className="mb-2 flex flex-col gap-2 rounded-md border bg-muted/30 p-2.5">
          <Input
            value={nomeEquip}
            onChange={(ev) => setNomeEquip(ev.target.value)}
            placeholder="Nome do equipamento"
          />
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Data necessária
            <Input
              type="date"
              value={dataNecessaria}
              onChange={(ev) => setDataNecessaria(ev.target.value)}
            />
          </label>
          <Button
            size="sm"
            className="w-fit gap-1"
            onClick={adicionarSolicitacao}
          >
            <Check className="size-3.5" /> Adicionar
          </Button>
        </div>
      )}

      {/* Some quando não há nada persistido nem solicitado nesta sessão. */}
      {alocacoes.length === 0 && solicitacoesLocais.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum equipamento solicitado.
        </p>
      )}

      {alocacoes.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {alocacoes.map((a) => {
            const e = getEquipamentoPorId(a.equipamentoId);
            const av = avaliarAlocacao(a);
            return (
              <li key={a.id} className="rounded-md border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {e?.nome ?? a.equipamentoId}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {e?.patrimonio}
                    </p>
                  </div>
                  <StatusBadge status={av.status} className="shrink-0">
                    {ALOCACAO_LABEL[a.status]}
                  </StatusBadge>
                </div>

                <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Necessário</dt>
                    <dd className="font-mono tabular-nums">
                      {formatDate(a.dataNecessaria)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Disponibilizado</dt>
                    <dd
                      className={cn(
                        "font-mono tabular-nums",
                        av.cumpriuPrazo === false &&
                          "font-semibold text-warning",
                        av.cumpriuPrazo === null && "text-muted-foreground",
                      )}
                    >
                      {a.dataDisponibilizado
                        ? formatDate(a.dataDisponibilizado)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Retorno previsto</dt>
                    <dd className="font-mono tabular-nums">
                      {formatDate(a.dataPrevistaRetorno)}
                    </dd>
                  </div>
                </dl>

                <p
                  className={cn(
                    "mt-1.5 text-xs",
                    av.status === "critico"
                      ? "font-medium text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {av.label}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {/* Solicitações desta sessão — só aparecem quando há alguma. */}
      {solicitacoesLocais.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Solicitações desta sessão
          </p>
          <ul className="flex flex-col gap-1.5">
            {solicitacoesLocais.map((s) => (
              <li key={s.id} className="rounded-md border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.nome}</p>
                    <p className="truncate font-mono text-xs tabular-nums text-muted-foreground">
                      Necessário {formatDate(s.dataNecessaria)}
                    </p>
                  </div>
                  <StatusBadge status="neutro" className="shrink-0">
                    Solicitado nesta sessão
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * A régua: o custo atual está fora da curva dos projetos anteriores?
 * `mostrarValores=false` (visão do gestor) esconde os R$ — só a diretoria vê
 * dinheiro; o desvio em % permanece porque é a leitura comparativa, não o valor.
 */
export function CustoComparado({
  projetoId,
  mostrarValores = true,
}: {
  projetoId: string;
  mostrarValores?: boolean;
}) {
  const anteriores = getCustosAnteriores(projetoId);
  if (!anteriores.length) return null;

  const oculto = (
    <span title="Visível apenas para a diretoria" className="font-mono">
      •••
    </span>
  );

  return (
    <div>
      <p className="mb-1 text-sm font-medium">Custo de projetos anteriores</p>
      <p className="mb-2 text-xs text-muted-foreground">
        Como serviços semelhantes fecharam — a régua para julgar o orçamento
        deste.
      </p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead className="text-right">Orçado</TableHead>
              <TableHead className="text-right">Fechou em</TableHead>
              <TableHead className="text-right">Desvio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {anteriores.map((a) => (
              <TableRow key={a.projetoId}>
                <TableCell className="font-medium">{a.nome}</TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {mostrarValores ? formatBRL(a.orcamento) : oculto}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {mostrarValores ? formatBRL(a.custoFinal) : oculto}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      a.desvioPct > 0
                        ? "font-semibold text-destructive"
                        : "text-success",
                    )}
                  >
                    {a.desvioPct > 0 ? "+" : ""}
                    {a.desvioPct}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Controle de entrada e saída de materiais — pedido explícito da doc. */
export function MateriaisDoProjeto({ projetoId }: { projetoId: string }) {
  const movs = getMovimentacoesDoProjeto(projetoId);
  if (!movs.length) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Entrada e saída de materiais</p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movs.map((m) => {
              const mat = getMaterialPorId(m.materialId);
              const entrada = m.tipo === "entrada";
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatDate(m.data)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {entrada ? (
                        <ArrowDownToLine
                          className="size-3 shrink-0 text-success"
                          aria-hidden
                        />
                      ) : (
                        <ArrowUpFromLine
                          className="size-3 shrink-0 text-info"
                          aria-hidden
                        />
                      )}
                      <span className="font-medium">
                        {mat?.descricao ?? m.materialId}
                      </span>
                    </div>
                    {m.observacao && (
                      <p className="mt-0.5 pl-4.5 text-xs text-muted-foreground">
                        {m.observacao}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getColaboradorNome(m.responsavelId)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <span className={entrada ? "text-success" : "text-info"}>
                      {entrada ? "+" : "−"}
                      {m.quantidade}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      {mat?.unidade}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
