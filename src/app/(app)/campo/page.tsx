"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/mtgl/page-header";
import { StatusBadge } from "@/components/mtgl/status-badge";
import { DeviceFrame } from "@/components/mtgl/device-frame";
import { MockFoto } from "@/components/mtgl/mock-foto";
import { SyncBar, type SyncBarStatus } from "@/components/mtgl/sync-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  ClipboardList,
  Database,
  MapPin,
  Phone,
  Truck,
} from "lucide-react";
import { formatDate } from "@/lib/status-map";
import { cn } from "@/lib/utils";
import {
  atividadesConcluidas,
  campanhas,
  CHECKLIST_VEICULO_ITENS,
  checklistsSaida,
  contatosEmergencia,
  getColaboradorNome,
  HOJE,
  incidentesCampo,
  registrosCampo,
  registrosPonto,
  tarefasDia,
  USUARIO_ATUAL_ID,
  veiculos,
} from "@/lib/mock-data";
import type { IncidenteCampo, RegistroPonto, StatusSync } from "@/lib/types";

type Tela =
  | "home"
  | "ponto"
  | "incidente"
  | "checklist-veiculo"
  | "tarefas"
  | "atividade"
  | "dados";

const INCIDENTE_LABEL: Record<string, string> = {
  acidente_veicular: "Batida de veículo",
  fauna: "Picada/ataque de animal",
  acidente_trabalho: "Acidente de trabalho",
  quase_acidente: "Quase acidente",
  condicao_insegura: "Condição insegura",
  ambiental: "Ambiental",
};

/**
 * Registro de ponto enxuto para o estado local da tela — o mock só precisa
 * de hora, tipo e status de sync para contar a história do offline-first.
 */
type PontoLocal = {
  id: string;
  tipo: RegistroPonto["tipo"];
  hora: string;
  statusSync: StatusSync;
};

/** Hora do clique em HH:mm — o dia no mock é sempre HOJE, a hora é real. */
function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppCampoPage() {
  const [campanhaId, setCampanhaId] = useState(
    campanhas.find((c) => c.status === "em_campo")!.id,
  );
  const [tela, setTela] = useState<Tela>("home");
  // Simula a promessa central do campo: o toque salva no aparelho na hora,
  // a rede é problema de depois. Ver docs/dna-visual.md §5.
  const [sync, setSync] = useState<SyncBarStatus>("sincronizado");

  const campanha = campanhas.find((c) => c.id === campanhaId)!;
  const colaboradorAtivoId = campanha.equipeIds[0];

  // Ids dos timers da animação de sync. Guardados num ref (não em estado —
  // não afetam a renderização) para poderem ser cancelados em cliques
  // rápidos e no unmount, evitando setSync depois da tela sair.
  const syncTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function salvarOffline() {
    // Limpa timers pendentes antes de reagendar: dois toques em sequência
    // não devem sobrepor animações (um timer antigo poderia voltar o status
    // para "sincronizado" no meio do próximo salvamento).
    syncTimers.current.forEach(clearTimeout);
    syncTimers.current = [];
    setSync("offline");
    syncTimers.current.push(
      setTimeout(() => setSync("sincronizando"), 900),
      setTimeout(() => setSync("sincronizado"), 2200),
    );
  }

  // Cancela timers pendentes ao desmontar — sem isso um setSync agendado
  // dispararia após a tela sair da árvore.
  useEffect(() => {
    return () => {
      syncTimers.current.forEach(clearTimeout);
    };
  }, []);

  // Estado local de escrita — o que o técnico registra no aparelho vive
  // aqui em cima (e não dentro de cada tela) para o histórico sobreviver
  // à navegação e os contadores da home reagirem na hora.
  const [pontos, setPontos] = useState<PontoLocal[]>(() =>
    registrosPonto
      .filter(
        (r) =>
          r.colaboradorId === USUARIO_ATUAL_ID && r.dataHora.startsWith(HOJE),
      )
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
      .map((r) => ({
        id: r.id,
        tipo: r.tipo,
        hora: r.dataHora.split(" ")[1],
        statusSync: r.statusSync,
      })),
  );
  const [incidentes, setIncidentes] = useState(incidentesCampo);
  const [checklists, setChecklists] = useState(checklistsSaida);
  const [tarefas, setTarefas] = useState(tarefasDia);

  const incidentesCampanha = incidentes.filter(
    (i) => i.campanhaId === campanhaId,
  );
  const veiculosCampanha = veiculos.filter((v) =>
    campanha.veiculoIds.includes(v.id),
  );
  const checklistsCampanha = checklists.filter((c) =>
    veiculosCampanha.some((v) => v.id === c.veiculoId),
  );
  const tarefasCampanha = tarefas
    .filter((t) => t.campanhaId === campanhaId)
    .sort((a, b) => a.ordem - b.ordem);
  const tarefasPendentes = tarefasCampanha.filter((t) => !t.concluida).length;

  function baterPonto() {
    setPontos((prev) => {
      // Alternância pela pergunta "está dentro?": a pessoa está trabalhando
      // depois de "entrada" ou de "fim_intervalo" (voltou do intervalo), então
      // o próximo evento é "saida". Nos demais casos — "saida",
      // "inicio_intervalo" ou dia vazio — o próximo é "entrada".
      const ultimo = prev[prev.length - 1];
      const dentro =
        ultimo?.tipo === "entrada" || ultimo?.tipo === "fim_intervalo";
      const tipo = dentro ? "saida" : "entrada";
      return [
        ...prev,
        {
          id: `pon-local-${prev.length}`,
          tipo,
          hora: horaAgora(),
          statusSync: "pendente",
        },
      ];
    });
    salvarOffline();
  }

  function registrarIncidente(tipo: IncidenteCampo["tipo"], descricao: string) {
    setIncidentes((prev) => [
      {
        id: `icp-local-${prev.length}`,
        colaboradorId: USUARIO_ATUAL_ID,
        campanhaId,
        tipo,
        gravidadePercebida: "media",
        dataHora: `${HOJE} ${horaAgora()}`,
        gps: { lat: -19.6194, lng: -43.2262 },
        descricao,
        houveVitima: false,
        fotos: 0,
        statusSync: "pendente",
      },
      ...prev,
    ]);
    salvarOffline();
  }

  function confirmarChecklist(
    tipo: "saida" | "entrada",
    km: string,
    marcados: Record<string, boolean>,
  ) {
    setChecklists((prev) => [
      {
        id: `cks-local-${prev.length}`,
        veiculoId: veiculosCampanha[0]?.id ?? veiculos[0].id,
        motoristaId: USUARIO_ATUAL_ID,
        tipo,
        dataHora: `${HOJE} ${horaAgora()}`,
        kmSaida: Number(km) || 0,
        itens: CHECKLIST_VEICULO_ITENS.map((item) => ({
          item,
          conforme: Boolean(marcados[item]),
        })),
        nivelCombustivel: "cheio",
        aprovado: CHECKLIST_VEICULO_ITENS.every((item) => marcados[item]),
        fotos: 0,
        statusSync: "pendente",
      },
      ...prev,
    ]);
    salvarOffline();
  }

  function alternarTarefa(id: string) {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              concluida: !t.concluida,
              horaConclusao: t.concluida ? undefined : horaAgora(),
              // Desmarcar descarta a foto — ela documentava a conclusão.
              fotoConclusao: t.concluida ? undefined : t.fotoConclusao,
              statusSync: "pendente",
            }
          : t,
      ),
    );
    salvarOffline();
  }

  function anexarFotoTarefa(id: string) {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, fotoConclusao: "1 foto anexada", statusSync: "pendente" }
          : t,
      ),
    );
    salvarOffline();
  }

  function cadastrarTarefa(
    descricao: string,
    pontoColeta: string,
    obrigatoria: boolean,
  ) {
    setTarefas((prev) => [
      ...prev,
      {
        id: `tar-local-${prev.length}`,
        colaboradorId: colaboradorAtivoId,
        campanhaId,
        data: HOJE,
        descricao,
        pontoColeta: pontoColeta || undefined,
        concluida: false,
        ordem: prev.filter((t) => t.campanhaId === campanhaId).length + 1,
        obrigatoria,
        statusSync: "pendente",
      },
    ]);
    salvarOffline();
  }

  const atividadesCampanha = atividadesConcluidas.filter(
    (a) => a.campanhaId === campanhaId,
  );
  const registrosDados = registrosCampo.filter(
    (r) => r.campanhaId === campanhaId,
  );

  return (
    // Full-bleed: cancela o padding do <main> do layout compartilhado
    // (bg-muted/20 p-4 md:p-6) para esta página ficar branca por inteiro,
    // não só dentro do frame do celular.
    <div className="-m-4 min-h-[calc(100vh-3.5rem)] bg-card p-4 md:-m-6 md:p-6">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="App de Campo"
          description="Superfície mobile do técnico — os 6 fluxos do dia a dia, offline-first."
        />

        {/* Segmented control em vez de fileira de botões soltos — mesma
            função (trocar a campanha simulada), leitura mais deliberada. */}
        <div className="inline-flex w-fit flex-wrap gap-1 rounded-full border bg-muted/40 p-1">
          {campanhas
            .filter((c) => c.status === "em_campo" || c.status === "planejada")
            .map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCampanhaId(c.id);
                  setTela("home");
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  c.id === campanhaId
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                )}
              >
                {c.nome}
              </button>
            ))}
        </div>

        {/* Stage: painel de vitrine para o mockup — grid pontilhado + glow
            em camadas + sombra de contato. Ver a nota de exceção em
            device-frame.tsx. Isto é composição de apresentação, não UI
            operacional; nada aqui entra dentro do bezel do celular. */}
        <div className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-b from-muted/50 to-transparent py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage:
                "radial-gradient(ellipse 60% 55% at 50% 42%, black 30%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 55% at 50% 42%, black 30%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--primary) 22%, transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/3 left-2/3 -z-10 h-[320px] w-[320px] rounded-full blur-[100px]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--success) 18%, transparent)",
            }}
          />

          <div className="relative flex justify-center">
            <div
              aria-hidden
              className="absolute -bottom-4 left-1/2 h-10 w-72 -translate-x-1/2 rounded-full bg-foreground/25 blur-2xl"
            />
            <DeviceFrame>
              <div className="flex min-h-14 items-center gap-2 border-b px-4">
                {tela !== "home" && (
                  <button
                    onClick={() => setTela("home")}
                    aria-label="Voltar"
                    // Alvo de toque de campo do DNA §5: 56px (min-h-14/min-w-14),
                    // dimensionado para luva. O -ml-2 reabsorve o padding para o
                    // ícone continuar alinhado à borda esquerda do header.
                    className="-ml-2 flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-muted/60"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {campanha.nome}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {getColaboradorNome(colaboradorAtivoId)}
                  </p>
                </div>
              </div>

              <SyncBar status={sync} />

              {/* min-h-0: item flex sem isso não encolhe abaixo do min-content dos
                filhos — aqui o eixo é vertical, então em vez de rolar, o
                container comprimia os 6 task-cards para caber, cortando texto
                e produzindo um efeito visual de esmaecimento. Mesma classe de
                bug corrigida hoje em layout.tsx e kpi-card.tsx. */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {tela === "home" && (
                  <TelaHome
                    ir={setTela}
                    pontosHoje={pontos.length}
                    incidentes={incidentesCampanha.length}
                    tarefasPendentes={tarefasPendentes}
                    totalTarefas={tarefasCampanha.length}
                    atividades={atividadesCampanha.length}
                  />
                )}
                {tela === "ponto" && (
                  <TelaPonto registros={pontos} onBater={baterPonto} />
                )}
                {tela === "incidente" && (
                  <TelaIncidente
                    registros={incidentesCampanha}
                    onRegistrar={registrarIncidente}
                  />
                )}
                {tela === "checklist-veiculo" && (
                  <TelaChecklistVeiculo
                    veiculos={veiculosCampanha}
                    checklists={checklistsCampanha}
                    onConfirmar={confirmarChecklist}
                  />
                )}
                {tela === "tarefas" && (
                  <TelaTarefas
                    tarefas={tarefasCampanha}
                    onAlternar={alternarTarefa}
                    onAnexarFoto={anexarFotoTarefa}
                    onCadastrar={cadastrarTarefa}
                  />
                )}
                {tela === "atividade" && (
                  <TelaAtividade
                    atividades={atividadesCampanha}
                    onSalvar={salvarOffline}
                  />
                )}
                {tela === "dados" && <TelaDados registros={registrosDados} />}
              </div>
            </DeviceFrame>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  icon: Icon,
  titulo,
  subtitulo,
  badge,
  badgeStatus,
  onClick,
}: {
  icon: React.ElementType;
  titulo: string;
  subtitulo: string;
  badge?: string;
  badgeStatus?: "critico" | "atencao" | "ok" | "info" | "neutro";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      // Alvo primário do campo: 64px, sistema apertado ao redor pra não
      // ler como "grosso" — ver docs/dna-visual.md §5.
      className="flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors active:bg-muted/60"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{titulo}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {subtitulo}
        </span>
      </span>
      {badge && (
        <StatusBadge status={badgeStatus ?? "neutro"} className="shrink-0">
          {badge}
        </StatusBadge>
      )}
    </button>
  );
}

function TelaHome({
  ir,
  pontosHoje,
  incidentes,
  tarefasPendentes,
  totalTarefas,
  atividades,
}: {
  ir: (t: Tela) => void;
  pontosHoje: number;
  incidentes: number;
  tarefasPendentes: number;
  totalTarefas: number;
  atividades: number;
}) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      <TaskCard
        icon={Clock}
        titulo="Registro de ponto"
        subtitulo="Um toque — entrada e saída offline"
        badge={`${pontosHoje} hoje`}
        badgeStatus="neutro"
        onClick={() => ir("ponto")}
      />
      <TaskCard
        icon={AlertTriangle}
        titulo="Registrar incidente"
        subtitulo="Batida, picada de animal, acidente"
        badge={incidentes > 0 ? String(incidentes) : undefined}
        badgeStatus="critico"
        onClick={() => ir("incidente")}
      />
      <TaskCard
        icon={Truck}
        titulo="Checklist do veículo"
        subtitulo="Saída e entrada — itens e km"
        onClick={() => ir("checklist-veiculo")}
      />
      <TaskCard
        icon={ClipboardList}
        titulo="Tarefas do dia"
        subtitulo={`${tarefasPendentes} de ${totalTarefas} pendentes`}
        badge={tarefasPendentes > 0 ? String(tarefasPendentes) : "Tudo feito"}
        badgeStatus={tarefasPendentes > 0 ? "atencao" : "ok"}
        onClick={() => ir("tarefas")}
      />
      <TaskCard
        icon={Camera}
        titulo="Atividade concluída"
        subtitulo="Registro com foto do serviço"
        badge={`${atividades} hoje`}
        badgeStatus="neutro"
        onClick={() => ir("atividade")}
      />
      <TaskCard
        icon={Database}
        titulo="Dados coletados"
        subtitulo="Medições de campo — nível, vazão, pH"
        onClick={() => ir("dados")}
      />
    </div>
  );
}

function TelaPonto({
  registros,
  onBater,
}: {
  registros: PontoLocal[];
  onBater: () => void;
}) {
  const TIPO_LABEL: Record<string, string> = {
    entrada: "Entrada",
    saida: "Saída",
    inicio_intervalo: "Início intervalo",
    fim_intervalo: "Fim intervalo",
  };
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm font-semibold">Registro de ponto</p>
      {/* Um único CTA + o dia ao lado: o técnico não escolhe tipo — o app
          alterna entrada/saída sozinho e confirma o salvamento na hora.
          Em largura apertada, o par empilha (flex-wrap). */}
      <div className="flex flex-wrap items-start gap-3">
        <Button
          size="lg"
          onClick={onBater}
          className="h-14 min-w-32 flex-[2] text-base"
        >
          <Clock /> Registrar ponto
        </Button>
        <div className="min-w-44 flex-[3]">
          <p className="text-xs text-muted-foreground">Registros de hoje</p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {registros.map((r) => (
              <div key={r.id} className="rounded-lg border p-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {r.hora}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {TIPO_LABEL[r.tipo]}
                  </span>
                </div>
                <StatusBadge
                  status={r.statusSync === "sincronizado" ? "ok" : "atencao"}
                  className="mt-1"
                >
                  {r.statusSync === "sincronizado"
                    ? "Sincronizado"
                    : "Salvo no aparelho"}
                </StatusBadge>
              </div>
            ))}
            {registros.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum registro hoje.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelaIncidente({
  registros,
  onRegistrar,
}: {
  registros: typeof incidentesCampo;
  onRegistrar: (tipo: IncidenteCampo["tipo"], descricao: string) => void;
}) {
  const [tipoSelecionado, setTipoSelecionado] = useState<
    IncidenteCampo["tipo"] | null
  >(null);
  const [descricao, setDescricao] = useState("");
  const publicos = contatosEmergencia.filter((c) => c.tipo === "publico");
  const internos = contatosEmergencia.filter((c) => c.tipo === "interno");

  function registrar() {
    if (!tipoSelecionado) return;
    onRegistrar(
      tipoSelecionado,
      descricao.trim() || "Registro rápido em campo",
    );
    setTipoSelecionado(null);
    setDescricao("");
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Fluxo PAE oficial: em acidente grave, 192/193/190/191 vêm antes de
          qualquer registro no app — por isso a seção abre a tela. */}
      <p className="text-sm font-semibold">Emergência — PAE</p>
      <div className="rounded-lg border border-l-4 border-l-destructive p-3">
        <p className="text-sm font-semibold">
          Acidente grave: acione primeiro as unidades de emergência
        </p>
        <div className="mt-2 flex flex-col gap-1.5">
          {publicos.map((c) => (
            <button
              key={c.nome}
              type="button"
              className="flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors active:bg-muted/60"
            >
              <Phone className="size-5 shrink-0 text-destructive" />
              <span className="min-w-0 flex-1">
                <span className="block text-base leading-tight font-semibold">
                  {c.nome}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {c.papel}
                </span>
              </span>
              <span className="font-mono text-xl font-bold tabular-nums">
                {c.telefone}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold">Segurança do Trabalho</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {internos.map((c) => (
            <button
              key={c.nome}
              type="button"
              className="flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors active:bg-muted/60"
            >
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{c.nome}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {c.papel}
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums">
                {c.telefone}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Fluxo: Segurança do Trabalho → Gerência ADM → Gerência Operacional.
      </p>

      <p className="mt-1 text-sm font-semibold">Registrar incidente</p>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Tipo</Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            Object.entries(INCIDENTE_LABEL) as [
              IncidenteCampo["tipo"],
              string,
            ][]
          ).map(([k, label]) => {
            const selecionado = tipoSelecionado === k;
            return (
              <Button
                key={k}
                variant="outline"
                size="lg"
                onClick={() => setTipoSelecionado(k)}
                className={cn(
                  // Rótulo em text-base (16px, piso de fonte de campo do DNA §5);
                  // o grid segue em 2 colunas e o h-14 acomoda a quebra em 2 linhas.
                  "h-14 text-base leading-tight",
                  selecionado &&
                    "border-primary bg-primary/12 text-foreground hover:bg-primary/12 hover:text-foreground",
                )}
              >
                {selecionado && <CheckCircle2 className="size-4 shrink-0" />}
                {label}
              </Button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Descrição</Label>
        <Input
          placeholder="O que aconteceu..."
          className="h-14 text-base"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-muted-foreground">
        <span className="flex items-center gap-1.5 text-sm">
          <Camera className="size-4" /> Anexar fotos
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <MapPin className="size-4" /> GPS capturado
        </span>
      </div>
      <Button
        size="lg"
        className="h-14 w-full text-base"
        disabled={!tipoSelecionado}
        onClick={registrar}
      >
        <CheckCircle2 /> Registrar incidente (offline)
      </Button>

      <p className="mt-1 text-xs text-muted-foreground">Incidentes recentes</p>
      <div className="flex flex-col gap-2">
        {registros.map((i) => (
          <div key={i.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{INCIDENTE_LABEL[i.tipo]}</span>
              <StatusBadge
                status={
                  i.gravidadePercebida === "critica" ||
                  i.gravidadePercebida === "alta"
                    ? "critico"
                    : "atencao"
                }
              >
                {i.gravidadePercebida}
              </StatusBadge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{i.descricao}</p>
            <p className="mt-1 text-xs text-muted-foreground">{i.dataHora}</p>
          </div>
        ))}
        {registros.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum incidente nesta campanha.
          </p>
        )}
      </div>
    </div>
  );
}

function TelaChecklistVeiculo({
  veiculos: vs,
  checklists,
  onConfirmar,
}: {
  veiculos: typeof veiculos;
  checklists: typeof checklistsSaida;
  onConfirmar: (
    tipo: "saida" | "entrada",
    km: string,
    marcados: Record<string, boolean>,
  ) => void;
}) {
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [km, setKm] = useState("");
  const conformes = CHECKLIST_VEICULO_ITENS.filter((i) => marcados[i]).length;

  function confirmar() {
    onConfirmar(tipo, km, marcados);
    setMarcados({});
    setKm("");
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm font-semibold">Checklist do veículo</p>
      {vs.map((v) => (
        <div key={v.id} className="rounded-lg border p-3">
          <p className="font-mono text-sm font-semibold">{v.placa}</p>
          <p className="text-xs text-muted-foreground">{v.modelo}</p>
        </div>
      ))}

      {/* Saída antes de ir a campo; entrada na devolução — mesmo checklist,
          só o rótulo do km muda junto. */}
      <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1">
        {(["saida", "entrada"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={cn(
              "h-14 rounded-md text-base font-medium transition-colors",
              tipo === t
                ? "border bg-background font-semibold text-foreground"
                : "text-muted-foreground active:bg-background/80",
            )}
          >
            {t === "saida" ? "Saída" : "Entrada"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {CHECKLIST_VEICULO_ITENS.map((item) => {
          const ok = Boolean(marcados[item]);
          return (
            <button
              key={item}
              type="button"
              onClick={() =>
                setMarcados((prev) => ({ ...prev, [item]: !prev[item] }))
              }
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 text-left transition-colors active:bg-muted/60",
                ok && "border-primary/40 bg-primary/6",
              )}
            >
              {ok ? (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" />
              )}
              <span className="text-base">{item}</span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="font-mono font-medium text-foreground tabular-nums">
          {conformes} de {CHECKLIST_VEICULO_ITENS.length}
        </span>{" "}
        itens conformes
      </p>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">
          {tipo === "saida" ? "Km de saída" : "Km de retorno"}
        </Label>
        <Input
          placeholder="0"
          className="h-14 font-mono text-base"
          value={km}
          onChange={(e) => setKm(e.target.value)}
        />
      </div>
      <Button size="lg" className="h-14 w-full text-base" onClick={confirmar}>
        <CheckCircle2 /> Confirmar checklist (offline)
      </Button>

      <p className="mt-1 text-xs text-muted-foreground">Últimos checklists</p>
      <div className="flex flex-col gap-2">
        {checklists.map((c) => {
          const naoConformes = c.itens.filter((i) => !i.conforme);
          return (
            <div key={c.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-medium">
                  {veiculos.find((v) => v.id === c.veiculoId)?.placa}
                </span>
                <span className="flex items-center gap-1">
                  <StatusBadge status="neutro">
                    {c.tipo === "saida" ? "Saída" : "Entrada"}
                  </StatusBadge>
                  <StatusBadge status={c.aprovado ? "ok" : "critico"}>
                    {c.aprovado ? "Aprovado" : "Reprovado"}
                  </StatusBadge>
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Km saída: {c.kmSaida.toLocaleString("pt-BR")} · Combustível:{" "}
                {c.nivelCombustivel}
              </p>
              {naoConformes.length > 0 && (
                <ul className="mt-1.5 list-inside list-disc text-xs text-destructive">
                  {naoConformes.map((i, n) => (
                    <li key={n}>{i.item}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {checklists.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum checklist registrado.
          </p>
        )}
      </div>
    </div>
  );
}

function TelaTarefas({
  tarefas,
  onAlternar,
  onAnexarFoto,
  onCadastrar,
}: {
  tarefas: typeof tarefasDia;
  onAlternar: (id: string) => void;
  onAnexarFoto: (id: string) => void;
  onCadastrar: (
    descricao: string,
    pontoColeta: string,
    obrigatoria: boolean,
  ) => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [pontoColeta, setPontoColeta] = useState("");
  const [obrigatoria, setObrigatoria] = useState(false);

  function cadastrar() {
    if (!descricao.trim()) return;
    onCadastrar(descricao.trim(), pontoColeta.trim(), obrigatoria);
    setDescricao("");
    setPontoColeta("");
    setObrigatoria(false);
  }

  return (
    <div className="flex flex-col gap-2.5 p-4">
      <p className="text-sm font-semibold">Tarefas do dia</p>
      {tarefas.map((t) => (
        <div key={t.id} className="rounded-lg border">
          {/* A linha inteira é o alvo do check — 56px, sem miniatura de
              alvo pequeno no campo. */}
          <button
            type="button"
            onClick={() => onAlternar(t.id)}
            className="flex min-h-14 w-full items-center gap-3 p-3 text-left transition-colors active:bg-muted/60"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                t.concluida
                  ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {t.concluida ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Circle className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-sm font-medium",
                  t.concluida && "line-through text-muted-foreground",
                )}
              >
                {t.descricao}
              </span>
              {t.pontoColeta && (
                <span className="block text-xs text-muted-foreground">
                  Ponto {t.pontoColeta}
                </span>
              )}
            </span>
            {t.obrigatoria && !t.concluida && (
              <StatusBadge status="atencao" className="shrink-0">
                Obrigatória
              </StatusBadge>
            )}
          </button>
          {t.concluida && (
            <div className="px-3 pb-3">
              {t.fotoConclusao ? (
                <MockFoto
                  legenda={t.fotoConclusao}
                  etiqueta="Conclusão"
                  className="w-44"
                />
              ) : (
                <Button
                  variant="outline"
                  className="h-14 w-full text-base"
                  onClick={() => onAnexarFoto(t.id)}
                >
                  <Camera /> Adicionar foto (opcional)
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
      {tarefas.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhuma tarefa para hoje.
        </p>
      )}

      {/* Escrita do coordenador direto no app — a tarefa nova entra no fim
          da lista e conta como pendente na home na hora. */}
      <p className="mt-2 text-sm font-semibold">Coordenador — nova tarefa</p>
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Descrição</Label>
          <Input
            placeholder="O que precisa ser feito..."
            className="h-14 text-base"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Ponto de coleta (opcional)</Label>
          <Input
            placeholder="PM-01"
            className="h-14 text-base"
            value={pontoColeta}
            onChange={(e) => setPontoColeta(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setObrigatoria((o) => !o)}
          className="flex min-h-14 w-full items-center gap-2 rounded-lg border px-3 text-left text-sm transition-colors active:bg-muted/60"
        >
          {obrigatoria ? (
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
          ) : (
            <Circle className="size-4 shrink-0 text-muted-foreground" />
          )}
          Obrigatória
        </button>
        <Button
          size="lg"
          className="h-14 w-full text-base"
          disabled={!descricao.trim()}
          onClick={cadastrar}
        >
          <ClipboardList /> Cadastrar tarefa
        </Button>
      </div>
    </div>
  );
}

function TelaAtividade({
  atividades,
  onSalvar,
}: {
  atividades: typeof atividadesConcluidas;
  onSalvar: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm font-semibold">Registrar atividade concluída</p>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Descrição do serviço</Label>
        <Input placeholder="O que foi feito..." className="h-14 text-base" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-dashed border-warning/50 p-3 text-warning">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Camera className="size-4" /> Foto do serviço (obrigatória)
        </span>
      </div>
      <Button size="lg" className="h-14 w-full text-base" onClick={onSalvar}>
        <CheckCircle2 /> Concluir atividade (offline)
      </Button>

      <p className="mt-1 text-xs text-muted-foreground">Atividades de hoje</p>
      <div className="flex flex-col gap-2">
        {atividades.map((a) => (
          <div key={a.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{a.descricao}</span>
              <StatusBadge
                status={a.statusSync === "sincronizado" ? "ok" : "atencao"}
              >
                {a.statusSync === "sincronizado"
                  ? "Sincronizado"
                  : "Salvo no aparelho"}
              </StatusBadge>
            </div>
            <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Camera className="size-3" /> {a.fotos}
              </span>
              <span>{formatDate(a.dataHora.split(" ")[0])}</span>
            </p>
            {a.observacoes && (
              <p className="mt-1 text-xs italic text-muted-foreground">
                &ldquo;{a.observacoes}&rdquo;
              </p>
            )}
          </div>
        ))}
        {atividades.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma atividade registrada hoje.
          </p>
        )}
      </div>
    </div>
  );
}

function TelaDados({ registros }: { registros: typeof registrosCampo }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      <p className="text-sm font-semibold">Dados coletados</p>
      <p className="text-xs text-muted-foreground">
        Medições de campo já incluídas direto no app — nível, vazão, pH e mais.
      </p>
      {registros.map((r) => (
        <div key={r.id} className="rounded-lg border p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Ponto {r.pontoColeta}</span>
            <StatusBadge
              status={r.statusSync === "sincronizado" ? "ok" : "atencao"}
            >
              {r.statusSync === "sincronizado" ? "Sincronizado" : "Pendente"}
            </StatusBadge>
          </div>
          <p className="mt-0.5 text-muted-foreground">{r.dataHora}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono tabular-nums">
            {r.medicoes.map((m, i) => (
              <span key={i} className="text-muted-foreground">
                {m.parametro}:{" "}
                <span className="text-foreground">
                  {m.valor}
                  {m.unidade}
                </span>
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Camera className="size-3" /> {r.fotos}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {r.gps.lat.toFixed(4)},{" "}
              {r.gps.lng.toFixed(4)}
            </span>
          </div>
          {r.observacoes && (
            <p className="mt-1.5 italic text-muted-foreground">
              &ldquo;{r.observacoes}&rdquo;
            </p>
          )}
        </div>
      ))}
      {registros.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum registro para esta campanha ainda.
        </p>
      )}
    </div>
  );
}
