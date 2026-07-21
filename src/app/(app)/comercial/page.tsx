"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Check,
  FileText,
  FolderClock,
  FolderKanban,
  Handshake,
  Pencil,
  Play,
  Plus,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/mtgl/page-header";
import { KpiCard } from "@/components/mtgl/kpi-card";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  formatBRL,
  formatDate,
  prazoBucket,
  projetoStatusMap,
} from "@/lib/status-map";
import { HOJE, clientes, colaboradores, getClienteNome } from "@/lib/mock-data";
import {
  getAditivosDoProjeto,
  getContratoDoProjeto,
  getPercentualConclusaoContrato,
} from "@/lib/derivacoes";
import { useDataStore } from "@/lib/store";
import type { AditivoContrato, Contrato, Projeto } from "@/lib/types";

type FaseComercial =
  "iniciando" | "ativo" | "finalizando" | "concluido" | "suspenso";

const FASE_LABEL: Record<FaseComercial, string> = {
  iniciando: "Iniciando em breve",
  ativo: "Ativo",
  finalizando: "Finalizando em breve",
  concluido: "Concluído",
  suspenso: "Suspenso",
};

const FASE_STATUS: Record<
  FaseComercial,
  "ok" | "info" | "atencao" | "critico" | "neutro"
> = {
  iniciando: "info",
  ativo: "ok",
  finalizando: "atencao",
  concluido: "neutro",
  suspenso: "critico",
};

function faseComercial(p: Projeto): FaseComercial {
  if (p.status === "suspenso") return "suspenso";
  if (p.status === "concluido") return "concluido";
  if (p.status === "planejamento") return "iniciando";
  const fimEm = prazoBucket(p.dataFim, HOJE).dias;
  if (fimEm >= 0 && fimEm <= 60) return "finalizando";
  return "ativo";
}

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

export default function ComercialPage() {
  return (
    <Suspense fallback={null}>
      <ComercialContent />
    </Suspense>
  );
}

function ComercialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("open");
  const { projetos, contratos } = useDataStore();
  const [novoAberto, setNovoAberto] = useState(false);

  // `?open=` da URL abre o detalhe (a Home linka para cá assim), e `selecionado`
  // é derivado — sem efeito sincronizando state com URL.
  //
  // `abertoLocal` tem três valores, e os três importam:
  //   undefined -> ninguém mexeu; manda o ?open= da URL
  //   string    -> abriu este aqui pelo clique
  //   null      -> fechou de propósito; ignora o ?open=
  // Sem o sentinela, `null` significaria "nunca cliquei" e "fechei" ao mesmo
  // tempo, e o ?open= reabriria o detalhe que o usuário acabou de fechar.
  const [abertoLocal, setAbertoLocal] = useState<string | null | undefined>(
    undefined,
  );
  const selecionadoId = abertoLocal === undefined ? openId : abertoLocal;
  const selecionado = projetos.find((p) => p.id === selecionadoId) ?? null;

  function fechar() {
    setAbertoLocal(null);
    if (openId) {
      const q = new URLSearchParams(searchParams.toString());
      q.delete("open");
      router.replace(q.size ? `/comercial?${q}` : "/comercial", {
        scroll: false,
      });
    }
  }

  const ativos = projetos.filter((p) => faseComercial(p) === "ativo").length;
  const iniciando = projetos.filter(
    (p) => faseComercial(p) === "iniciando",
  ).length;
  const finalizando = projetos.filter(
    (p) => faseComercial(p) === "finalizando",
  ).length;
  const contratosComChecklist = projetos
    .map((p) => getContratoDoProjeto(contratos, p.id))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const conclusaoMedia = contratosComChecklist.length
    ? Math.round(
        contratosComChecklist.reduce(
          (a, c) => a + getPercentualConclusaoContrato(c),
          0,
        ) / contratosComChecklist.length,
      )
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Comercial"
        description="Carteira de projetos, contratos, aditivos e negociações. Dados fictícios para demonstração."
        action={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setNovoAberto(true)}
          >
            <Plus className="size-4" /> Novo projeto
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Projetos ativos"
          value={ativos}
          icon={FolderKanban}
          tone="success"
        />
        <KpiCard
          label="Iniciando em breve"
          value={iniciando}
          icon={FolderClock}
          tone="info"
        />
        <KpiCard
          label="Finalizando em breve"
          value={finalizando}
          icon={TrendingUp}
          tone="warning"
        />
        <KpiCard
          label="Conclusão média do contrato"
          value={`${conclusaoMedia}%`}
          icon={Handshake}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projetos.map((p) => {
          const fase = faseComercial(p);
          const contrato = getContratoDoProjeto(contratos, p.id);
          const pct = contrato ? getPercentualConclusaoContrato(contrato) : 0;
          return (
            <Card
              key={p.id}
              onClick={() => setAbertoLocal(p.id)}
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
                  <StatusBadge status={FASE_STATUS[fase]} className="shrink-0">
                    {FASE_LABEL[fase]}
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
                    <span>Conclusão do contrato</span>
                    <span className="font-mono tabular-nums">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selecionado} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selecionado && (
            <DetalheComercial projeto={selecionado} onExcluido={fechar} />
          )}
        </DialogContent>
      </Dialog>

      <NovoProjetoDialog
        open={novoAberto}
        onClose={() => setNovoAberto(false)}
        onCriado={(id) => {
          setNovoAberto(false);
          setAbertoLocal(id);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- Novo projeto */

function NovoProjetoDialog({
  open,
  onClose,
  onCriado,
}: {
  open: boolean;
  onClose: () => void;
  onCriado: (id: string) => void;
}) {
  const { criarProjeto } = useDataStore();
  const [form, setForm] = useState({
    nome: "",
    clienteId: clientes[0]?.id ?? "",
    contrato: "",
    responsavelId: colaboradores[0]?.id ?? "",
    dataInicio: HOJE,
    dataFim: HOJE,
    servico: "",
    valorContrato: "",
    orcamento: "",
    descricao: "",
    detalhesEntrega: "",
  });

  function campo<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function limpar() {
    setForm({
      nome: "",
      clienteId: clientes[0]?.id ?? "",
      contrato: "",
      responsavelId: colaboradores[0]?.id ?? "",
      dataInicio: HOJE,
      dataFim: HOJE,
      servico: "",
      valorContrato: "",
      orcamento: "",
      descricao: "",
      detalhesEntrega: "",
    });
  }

  const valido =
    form.nome.trim() && form.contrato.trim() && form.servico.trim();

  function salvar() {
    if (!valido) return;
    const id = criarProjeto({
      clienteId: form.clienteId,
      nome: form.nome.trim(),
      contrato: form.contrato.trim(),
      dataInicio: form.dataInicio,
      dataFim: form.dataFim,
      responsavelId: form.responsavelId,
      status: "planejamento",
      equipeIds: [],
      veiculoIds: [],
      equipamentoIds: [],
      orcamento: Number(form.orcamento) || 0,
      custoAtual: 0,
      valorContrato: Number(form.valorContrato) || 0,
      servico: form.servico.trim(),
      detalhesEntrega: form.detalhesEntrega.trim() || "A definir.",
      descricao: form.descricao.trim() || form.servico.trim(),
      projetosAnterioresIds: [],
    });
    limpar();
    onCriado(id);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>
            Entra como planejamento — use &ldquo;Iniciar projeto&rdquo; quando
            mobilizar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-w-0 flex-col gap-3 pb-2">
          <div className="grid gap-1.5">
            <Label htmlFor="np-nome">Nome do projeto</Label>
            <Input
              id="np-nome"
              value={form.nome}
              onChange={(e) => campo("nome", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Cliente</Label>
              <Select
                value={form.clienteId}
                onValueChange={(v) => campo("clienteId", v as string)}
                items={clientes.map((c) => ({ value: c.id, label: c.nome }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-contrato">Nº do contrato</Label>
              <Input
                id="np-contrato"
                placeholder="CT-2026-0000"
                value={form.contrato}
                onChange={(e) => campo("contrato", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Responsável</Label>
            <Select
              value={form.responsavelId}
              onValueChange={(v) => campo("responsavelId", v as string)}
              items={colaboradores.map((c) => ({ value: c.id, label: c.nome }))}
            >
              <SelectTrigger className="w-full">
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="np-inicio">Início</Label>
              <Input
                id="np-inicio"
                type="date"
                value={form.dataInicio}
                onChange={(e) => campo("dataInicio", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-fim">Fim previsto</Label>
              <Input
                id="np-fim"
                type="date"
                value={form.dataFim}
                onChange={(e) => campo("dataFim", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-servico">Serviço</Label>
            <Input
              id="np-servico"
              value={form.servico}
              onChange={(e) => campo("servico", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="np-valor">Valor do contrato (R$)</Label>
              <Input
                id="np-valor"
                type="number"
                value={form.valorContrato}
                onChange={(e) => campo("valorContrato", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="np-orcamento">Orçamento interno (R$)</Label>
              <Input
                id="np-orcamento"
                type="number"
                value={form.orcamento}
                onChange={(e) => campo("orcamento", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-descricao">Descrição</Label>
            <Textarea
              id="np-descricao"
              rows={2}
              value={form.descricao}
              onChange={(e) => campo("descricao", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!valido} onClick={salvar}>
            Criar projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------- Detalhe/edição */

function DetalheComercial({
  projeto,
  onExcluido,
}: {
  projeto: Projeto;
  onExcluido: () => void;
}) {
  const {
    contratos,
    aditivosContrato,
    atualizarProjeto,
    excluirProjeto,
    iniciarProjeto,
    atualizarContrato,
  } = useDataStore();
  const contrato = getContratoDoProjeto(contratos, projeto.id);
  const aditivos = getAditivosDoProjeto(aditivosContrato, projeto.id);
  const pct = contrato ? getPercentualConclusaoContrato(contrato) : 0;

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nome: projeto.nome,
    valorContrato: String(projeto.valorContrato),
    objeto: contrato?.objeto ?? "",
    briefing: contrato?.briefing ?? "",
    prazoExecucao: contrato?.prazoExecucao ?? "",
    condicoesPagamento: contrato?.condicoesPagamento ?? "",
  });

  function iniciarEdicao() {
    setForm({
      nome: projeto.nome,
      valorContrato: String(projeto.valorContrato),
      objeto: contrato?.objeto ?? "",
      briefing: contrato?.briefing ?? "",
      prazoExecucao: contrato?.prazoExecucao ?? "",
      condicoesPagamento: contrato?.condicoesPagamento ?? "",
    });
    setEditando(true);
  }

  function salvarEdicao() {
    atualizarProjeto(projeto.id, {
      nome: form.nome.trim(),
      valorContrato: Number(form.valorContrato) || 0,
    });
    atualizarContrato(projeto.id, {
      objeto: form.objeto,
      briefing: form.briefing,
      prazoExecucao: form.prazoExecucao,
      condicoesPagamento: form.condicoesPagamento,
    });
    setEditando(false);
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between gap-2 pr-8">
          <div className="min-w-0">
            <DialogTitle>{projeto.nome}</DialogTitle>
            <DialogDescription>
              {getClienteNome(projeto.clienteId)} · Contrato {projeto.contrato}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {!editando && (
              <Button
                size="icon-xs"
                variant="outline"
                onClick={iniciarEdicao}
                aria-label="Editar"
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button size="icon-xs" variant="outline" aria-label="Excluir">
                    <Trash2 className="size-3.5" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir {projeto.nome}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Remove o projeto, contrato, aditivos e roadmap associados.
                    Não afeta dados já sincronizados fora da sessão.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      excluirProjeto(projeto.id);
                      onExcluido();
                    }}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogHeader>
      <div className="flex min-w-0 flex-col gap-5 pb-2">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status do projeto</p>
            <div className="mt-0.5 flex items-center gap-2">
              <StatusBadge status={projetoStatusMap[projeto.status].status}>
                {projetoStatusMap[projeto.status].label}
              </StatusBadge>
              {projeto.status === "planejamento" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 gap-1 text-xs"
                  onClick={() => iniciarProjeto(projeto.id)}
                >
                  <Play className="size-3" /> Iniciar
                </Button>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Período</p>
            <p className="font-mono text-xs tabular-nums">
              {formatDate(projeto.dataInicio)} – {formatDate(projeto.dataFim)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor do contrato</p>
            {editando ? (
              <Input
                type="number"
                className="h-7"
                value={form.valorContrato}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valorContrato: e.target.value }))
                }
              />
            ) : (
              <p className="font-mono text-sm font-semibold tabular-nums">
                {formatBRL(projeto.valorContrato)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Conclusão</p>
            <p className="font-mono text-sm tabular-nums">{pct}%</p>
          </div>
        </div>

        {editando && (
          <div className="grid gap-1.5">
            <Label htmlFor="ed-nome">Nome do projeto</Label>
            <Input
              id="ed-nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />
          </div>
        )}

        <Separator />

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <FileText className="size-4 text-primary" /> O que é o contrato
          </p>
          {editando ? (
            <Textarea
              rows={2}
              value={form.objeto}
              onChange={(e) =>
                setForm((f) => ({ ...f, objeto: e.target.value }))
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {contrato?.objeto || "—"}
            </p>
          )}
        </div>

        <div>
          <p className="mb-1 text-sm font-medium">Briefing</p>
          {editando ? (
            <Textarea
              rows={2}
              value={form.briefing}
              onChange={(e) =>
                setForm((f) => ({ ...f, briefing: e.target.value }))
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {contrato?.briefing || "—"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Prazo de execução</p>
            {editando ? (
              <Input
                className="h-7"
                value={form.prazoExecucao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, prazoExecucao: e.target.value }))
                }
              />
            ) : (
              <p className="font-medium">{contrato?.prazoExecucao || "—"}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Condições de pagamento
            </p>
            {editando ? (
              <Input
                className="h-7"
                value={form.condicoesPagamento}
                onChange={(e) =>
                  setForm((f) => ({ ...f, condicoesPagamento: e.target.value }))
                }
              />
            ) : (
              <p className="font-medium">
                {contrato?.condicoesPagamento || "—"}
              </p>
            )}
          </div>
        </div>

        {editando && (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={salvarEdicao}>
              Salvar
            </Button>
          </div>
        )}

        {contrato && contrato.impeditivos.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="mb-1.5 text-sm font-medium text-destructive">
              Impeditivos
            </p>
            <ul className="list-inside list-disc text-xs text-muted-foreground">
              {contrato.impeditivos.map((imp, i) => (
                <li key={i}>{imp}</li>
              ))}
            </ul>
          </div>
        )}

        <ChecklistContrato projetoId={projeto.id} contrato={contrato} />

        <AditivosContrato projetoId={projeto.id} aditivos={aditivos} />
      </div>
    </>
  );
}

/** Itens clicáveis: alternam concluído/pendente e recalculam a % na hora, em qualquer tela que leia este contrato. */
function ChecklistContrato({
  projetoId,
  contrato,
}: {
  projetoId: string;
  contrato: Contrato | null;
}) {
  const { alternarItemChecklistContrato } = useDataStore();
  if (!contrato) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Checklist do contrato</p>
      <ul className="flex flex-col gap-1.5">
        {contrato.checklist.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => alternarItemChecklistContrato(projetoId, i)}
              className="flex w-full items-center justify-between rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted/60"
            >
              <span>{item.item}</span>
              <StatusBadge status={item.concluido ? "ok" : "neutro"}>
                {item.concluido ? "Concluído" : "Pendente"}
              </StatusBadge>
            </button>
          </li>
        ))}
        {contrato.checklist.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum item de checklist cadastrado.
          </p>
        )}
      </ul>
    </div>
  );
}

function AditivosContrato({
  projetoId,
  aditivos,
}: {
  projetoId: string;
  aditivos: AditivoContrato[];
}) {
  const { criarAditivo, atualizarAditivo, excluirAditivo } = useDataStore();
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    valorAdicional: "",
    data: HOJE,
  });

  function salvar() {
    if (!form.descricao.trim()) return;
    criarAditivo({
      projetoId,
      descricao: form.descricao.trim(),
      valorAdicional: Number(form.valorAdicional) || 0,
      data: form.data,
      status: "proposto",
    });
    setForm({ descricao: "", valorAdicional: "", data: HOJE });
    setNovo(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Briefcase className="size-4 text-primary" /> Aditivos
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => setNovo((v) => !v)}
        >
          {novo ? <X className="size-3" /> : <Plus className="size-3" />}
          {novo ? "Cancelar" : "Novo aditivo"}
        </Button>
      </div>

      {novo && (
        <div className="mb-2 flex flex-col gap-2 rounded-md border p-2.5">
          <Input
            placeholder="Descrição do aditivo"
            value={form.descricao}
            onChange={(e) =>
              setForm((f) => ({ ...f, descricao: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Valor adicional (R$)"
              value={form.valorAdicional}
              onChange={(e) =>
                setForm((f) => ({ ...f, valorAdicional: e.target.value }))
              }
            />
            <Input
              type="date"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            />
          </div>
          <Button size="sm" className="w-fit gap-1" onClick={salvar}>
            <Check className="size-3.5" /> Salvar aditivo
          </Button>
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        {aditivos.map((a) => (
          <li key={a.id} className="rounded-md border p-2.5 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0">{a.descricao}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <Select
                  value={a.status}
                  onValueChange={(v) =>
                    atualizarAditivo(a.id, {
                      status: v as AditivoContrato["status"],
                    })
                  }
                  items={[
                    { value: "proposto", label: "Proposto" },
                    { value: "aprovado", label: "Aprovado" },
                    { value: "recusado", label: "Recusado" },
                  ]}
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposto">Proposto</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="recusado">Recusado</SelectItem>
                  </SelectContent>
                </Select>
                <StatusBadge status={ADITIVO_STATUS_MAP[a.status]}>
                  {ADITIVO_STATUS_LABEL[a.status]}
                </StatusBadge>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => excluirAditivo(a.id)}
                  aria-label="Excluir aditivo"
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
              {formatBRL(a.valorAdicional)} · {formatDate(a.data)}
            </p>
          </li>
        ))}
        {aditivos.length === 0 && !novo && (
          <p className="text-xs text-muted-foreground">
            Nenhum aditivo registrado.
          </p>
        )}
      </ul>
    </div>
  );
}
