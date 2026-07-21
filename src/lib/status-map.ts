import type { StatusSemantico } from "./types";

type Mapping = Record<string, { label: string; status: StatusSemantico }>;

/**
 * Cor de um status para consumidores que precisam de valor CSS cru — séries de
 * gráfico, `fill` de SVG. Aponta para os tokens; nunca hex literal, senão o
 * gráfico e a tabela do mesmo dado divergem de cor.
 */
export const statusFill: Record<StatusSemantico, string> = {
  ok: "var(--success)",
  atencao: "var(--warning)",
  critico: "var(--destructive)",
  info: "var(--info)",
  neutro: "var(--neutral)",
};

export const colaboradorStatusMap: Mapping = {
  apto: { label: "Apto", status: "ok" },
  pendente: { label: "Pendência", status: "atencao" },
  bloqueado: { label: "Bloqueado", status: "critico" },
};

export const veiculoStatusMap: Mapping = {
  disponivel: { label: "Disponível", status: "ok" },
  em_campo: { label: "Em campo", status: "info" },
  manutencao: { label: "Em manutenção", status: "atencao" },
  bloqueado: { label: "Bloqueado", status: "critico" },
};

export const equipamentoStatusMap: Mapping = {
  disponivel: { label: "Disponível", status: "ok" },
  em_campo: { label: "Em campo", status: "info" },
  calibracao: { label: "Em calibração", status: "atencao" },
  manutencao: { label: "Em manutenção", status: "critico" },
  reservado: { label: "Reservado", status: "neutro" },
};

export const projetoStatusMap: Mapping = {
  planejamento: { label: "Planejamento", status: "neutro" },
  em_andamento: { label: "Em andamento", status: "info" },
  concluido: { label: "Concluído", status: "ok" },
  suspenso: { label: "Suspenso", status: "critico" },
};

export const campanhaStatusMap: Mapping = {
  planejada: { label: "Planejada", status: "neutro" },
  em_campo: { label: "Em campo", status: "info" },
  concluida: { label: "Concluída", status: "ok" },
  bloqueada: { label: "Bloqueada", status: "critico" },
};

export const compraStatusMap: Mapping = {
  aberta: { label: "Aberta", status: "neutro" },
  cotando: { label: "Cotando", status: "info" },
  aprovacao: { label: "Aguardando aprovação", status: "atencao" },
  aprovada: { label: "Aprovada", status: "ok" },
  recusada: { label: "Recusada", status: "critico" },
  recebida: { label: "Recebida", status: "ok" },
};

export const despesaStatusMap: Mapping = {
  pendente: { label: "Pendente", status: "atencao" },
  aprovado: { label: "Aprovado", status: "info" },
  prestado: { label: "Prestado", status: "ok" },
  recusado: { label: "Recusado", status: "critico" },
};

export const prioridadeStatusMap: Mapping = {
  baixa: { label: "Baixa", status: "neutro" },
  media: { label: "Média", status: "info" },
  alta: { label: "Alta", status: "atencao" },
  urgente: { label: "Urgente", status: "critico" },
};

export const syncStatusMap: Mapping = {
  sincronizado: { label: "Sincronizado", status: "ok" },
  pendente: { label: "Sincronizando", status: "atencao" },
  offline: { label: "Offline", status: "neutro" },
};

export const servicoSistemaStatusMap: Mapping = {
  operacional: { label: "Operacional", status: "ok" },
  degradado: { label: "Degradado", status: "atencao" },
  indisponivel: { label: "Indisponível", status: "critico" },
};

export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split(" ")[0].split("-");
  return `${d}/${m}/${y}`;
}

export function diasAte(iso: string, hoje: string) {
  const a = new Date(hoje).getTime();
  const b = new Date(iso).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export type PrazoBucket = "T0" | "T1" | "T2" | "T3" | "T4";

export type Prazo = {
  bucket: PrazoBucket;
  status: StatusSemantico;
  label: string;
  dias: number;
};

function venceEm(dias: number) {
  if (dias === 0) return "Vence hoje";
  return `Vence em ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

/**
 * Escala de prazo canônica do produto. ASO, calibração, crachá, CNH, certificado
 * e treinamento passam todos por aqui — nenhum domínio define threshold próprio,
 * senão "vencendo" significa coisas diferentes em cada aba.
 *
 * Ver docs/dna-visual.md §4 (T-scale).
 */
export function prazoBucket(iso: string, hoje: string): Prazo {
  const dias = diasAte(iso, hoje);

  if (dias < 0) {
    const n = Math.abs(dias);
    return {
      bucket: "T0",
      status: "critico",
      dias,
      label: `Vencido há ${n} ${n === 1 ? "dia" : "dias"}`,
    };
  }
  if (dias <= 7)
    return { bucket: "T1", status: "critico", dias, label: venceEm(dias) };
  if (dias <= 30)
    return { bucket: "T2", status: "atencao", dias, label: venceEm(dias) };
  if (dias <= 90) {
    return {
      bucket: "T3",
      status: "neutro",
      dias,
      label: `Vence em ${formatDate(iso).slice(0, 5)}`,
    };
  }
  return { bucket: "T4", status: "ok", dias, label: "Válido" };
}
