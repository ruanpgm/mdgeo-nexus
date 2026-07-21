/**
 * Perguntas respondidas a partir dos fatos.
 *
 * `mock-data.ts` guarda o que aconteceu; este arquivo responde o que isso
 * significa. Nada aqui é armazenado — se fosse, divergiria do fato na primeira
 * mudança. Ver docs/projeto-abas.md.
 */
import {
  HOJE,
  acidentes,
  aceitesRegrasOuro,
  alocacoesEquipamento,
  budgetMensalSetor,
  checklistsCampo,
  clientes,
  colaboradores,
  contasPagar,
  contasReceber,
  despesasAdministrativas,
  despesasCampo,
  equipamentos,
  estoqueEpi,
  fabricacoes,
  folhaPagamento,
  materiais,
  movimentacoesMaterial,
  ocorrencias,
  projetos,
  registrosDSSMA,
  resultadosLaboratoriais,
  saldoCaixaMensal,
  solicitacoesCompra,
  treinamentos,
  veiculos,
} from "./mock-data";
import { formatBRL, formatDate, prazoBucket } from "./status-map";
import type { Prazo } from "./status-map";
import type {
  Acidente,
  AditivoContrato,
  CategoriaTreinamento,
  ChecklistCampo,
  Contrato,
  CorMesFerramenta,
  EstacaoTelemetria,
  EtapaRoadmap,
  Fabricacao,
  Material,
  Ocorrencia,
  PapelVisualizacao,
  Projeto,
  ResultadoLaboratorial,
  SetorCusto,
  SetorFinanceiro,
  StatusSemantico,
  TipoChecklistCampo,
  Treinamento,
  UsoVeiculoProjeto,
  Veiculo,
} from "./types";

/** RG.xx-PSSO.xx — código de documento real de cada checklist de campo. */
export const CODIGO_DOCUMENTO_CHECKLIST: Record<TipoChecklistCampo, string> = {
  preposto: "RG.04-PSSO.02",
  "3rs_5s": "RG.09-PSSO.02",
  ferramentas_pre_uso: "RG.07-PSSO.02",
  kit_primeiros_socorros: "RG.01-PSSO.04",
  kit_emergencia: "RG.10-PSSO.02",
};

/** Cronograma anual de cores (RG.02-PSSO.02) — rotação trimestral fixa. */
export const CRONOGRAMA_CORES_MESES: Record<CorMesFerramenta, number[]> = {
  verde: [1, 5, 9],
  amarelo: [2, 6, 10],
  azul: [3, 7, 11],
  vermelho: [4, 8, 12],
};

/* ---------------------------------------------------------------- material */

export function getMateriaisDoProjeto(projetoId: string) {
  return materiais.filter((m) => m.projetoId === projetoId);
}

/**
 * Recebe o id do MATERIAL, não o da fabricação. Material.fabricacaoId e
 * Fabricacao.materialId apontam um para o outro e ambos são `string`, então
 * trocar os dois compila — e some com a fabricação em silêncio.
 */
export function getFabricacaoDoMaterial(materialId: string) {
  return fabricacoes.find((f) => f.materialId === materialId);
}

export function getMaterialPorId(materialId: string) {
  return materiais.find((m) => m.id === materialId);
}

export function getMovimentacoesDoProjeto(projetoId: string) {
  return movimentacoesMaterial
    .filter((m) => m.projetoId === projetoId)
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function custoDoMaterial(m: Material) {
  return m.quantidadePrevista * m.custoUnitario;
}

/**
 * Uma fabricação está atrasada se a previsão já passou e ela não chegou.
 * Derivado, nunca persistido — senão diverge da T-scale (docs/dna-visual.md §4).
 */
export function fabricacaoAtrasada(f: Fabricacao) {
  if (f.status === "entregue") return false;
  return prazoBucket(f.previsaoEntrega, HOJE).dias < 0;
}

export function prazoDaFabricacao(f: Fabricacao): Prazo {
  return prazoBucket(f.previsaoEntrega, HOJE);
}

/* ---------------------------------------------------------------- despesas */

export function getDespesasDoProjeto(projetoId: string) {
  return despesasCampo.filter((d) => d.projetoId === projetoId);
}

/** Compras no cartão: sem cotação prévia, por definição. */
export function getComprasEmCampo(projetoId: string) {
  return getDespesasDoProjeto(projetoId).filter((d) => d.tipo === "cartao");
}

export type CustoPorCategoria = {
  chave: string;
  label: string;
  valor: number;
  /** Quantos lançamentos compõem o total — o peso do "quantas vezes". */
  itens: number;
};

/**
 * Custo previsto do projeto quebrado nas categorias que a doc nomeia.
 * Materiais e fabricação saem de `materiais`; o resto sai de `despesasCampo`.
 */
export function getCustosDoProjeto(projetoId: string): CustoPorCategoria[] {
  const desp = getDespesasDoProjeto(projetoId);
  const mats = getMateriaisDoProjeto(projetoId);

  const soma = (tipo: string) =>
    desp.filter((d) => d.tipo === tipo).reduce((a, d) => a + d.valor, 0);
  const conta = (tipo: string) => desp.filter((d) => d.tipo === tipo).length;

  const matsDeCompra = mats.filter(
    (m) => m.origem === "compra" || m.origem === "estoque",
  );
  const matsDeFabricacao = mats.filter((m) => m.origem === "fabricacao");

  return [
    {
      chave: "hospedagem",
      label: "Hospedagem",
      valor: soma("hospedagem"),
      itens: conta("hospedagem"),
    },
    {
      chave: "alimentacao",
      label: "Alimentação",
      valor: soma("alimentacao"),
      itens: conta("alimentacao"),
    },
    {
      chave: "materiais",
      label: "Materiais",
      valor: matsDeCompra.reduce((a, m) => a + custoDoMaterial(m), 0),
      itens: matsDeCompra.length,
    },
    {
      chave: "fabricacao",
      label: "Fabricação em terceiros",
      valor: matsDeFabricacao.reduce((a, m) => a + custoDoMaterial(m), 0),
      itens: matsDeFabricacao.length,
    },
    {
      chave: "locacao",
      label: "Locação de veículo",
      valor: soma("locacao"),
      itens: conta("locacao"),
    },
    {
      chave: "cartao",
      label: "Comprado em campo",
      valor: soma("cartao"),
      itens: conta("cartao"),
    },
    {
      chave: "extraordinaria",
      label: "Extraordinária",
      valor: soma("extraordinaria"),
      itens: conta("extraordinaria"),
    },
  ].filter((c) => c.valor > 0);
}

/* -------------------------------------------------------------- equipamento */

export function getAlocacoesDoProjeto(projetoId: string) {
  return alocacoesEquipamento.filter((a) => a.projetoId === projetoId);
}

export function getEquipamentoPorId(id: string) {
  return equipamentos.find((e) => e.id === id);
}

/** Faixas de saúde do equipamento — docs/dna-visual.md §4. */
export function statusDaSaude(saude: number): StatusSemantico {
  if (saude > 85) return "ok";
  if (saude >= 70) return "atencao";
  return "critico";
}

/* -------------------------------------------------------------- prontidão */

export type Bloqueio = {
  /** O fato. */
  o: string;
  /** A consequência operacional. Fórmula do tom: fato + consequência + ação. */
  logo: string;
  status: StatusSemantico;
  /** Para onde ir resolver. */
  href?: string;
};

/**
 * "Dá para mobilizar?" — a pergunta que o Financeiro de Campo responde.
 *
 * A doc é explícita: "garantir que tudo que a equipe precisa para operar já
 * está pronto" e "controle de tudo que é preciso ANTES do projeto iniciar".
 * Logo, isto não é um resumo de gasto; é uma lista de impedimentos.
 */
export function getProntidaoDoProjeto(projetoId: string): Bloqueio[] {
  const projeto = projetos.find((p) => p.id === projetoId);
  if (!projeto) return [];

  const b: Bloqueio[] = [];
  const inicio = projeto.dataInicio;

  // 1. Fabricação que não chega a tempo. Não depende de nós — o pior tipo.
  for (const m of getMateriaisDoProjeto(projetoId)) {
    const f = m.fabricacaoId ? getFabricacaoDoMaterial(m.id) : undefined;
    if (!f || f.status === "entregue") continue;

    const data = f.previsaoEntrega.split("-").reverse().join("/");

    // "pronto" = fabricado, aguardando retirada. O gargalo virou nosso, e isso
    // muda tanto a severidade quanto a quem cobrar.
    if (f.status === "pronto") {
      b.push({
        o: `${m.descricao} — pronto para retirada`,
        logo: `Fabricação concluída em ${f.fornecedor}. Falta a logística de retirada — o gargalo é nosso.`,
        status: "atencao",
      });
      continue;
    }

    const chegaDepoisDoInicio = f.previsaoEntrega > inicio;
    const atrasada = fabricacaoAtrasada(f);
    if (!chegaDepoisDoInicio && !atrasada) continue;

    b.push({
      o: `${m.descricao} — previsão ${data}`,
      logo: atrasada
        ? `Fabricação atrasada em ${f.fornecedor}. Cobrar o pedido ${f.pedido}.`
        : `Chega depois do início do projeto. Antecipar com ${f.fornecedor} ou replanejar a mobilização.`,
      status: "critico",
    });
  }

  // 2. Material previsto que ainda não entrou por completo.
  // Vale inclusive para fabricação já "entregue": entrega parcial é falta.
  for (const m of getMateriaisDoProjeto(projetoId)) {
    if (m.quantidadeRecebida >= m.quantidadePrevista) continue;

    const f = m.fabricacaoId ? getFabricacaoDoMaterial(m.id) : undefined;
    // Fabricação ainda em curso já foi reportada acima — não duplicar.
    if (f && f.status !== "entregue") continue;

    const falta = m.quantidadePrevista - m.quantidadeRecebida;
    b.push({
      o: `${m.descricao} — faltam ${falta} ${m.unidade} de ${m.quantidadePrevista}`,
      logo: f
        ? `Entrega parcial de ${f.fornecedor}. Saldo do pedido ${f.pedido} ainda não veio.`
        : "Material previsto ainda não recebido. Confirmar entrega antes de mobilizar.",
      status: "atencao",
    });
  }

  // 3. Equipamento solicitado que não foi DISPONIBILIZADO na data necessária.
  for (const a of getAlocacoesDoProjeto(projetoId)) {
    const equip = getEquipamentoPorId(a.equipamentoId);
    if (!equip) continue;
    if (a.status === "devolvido") continue;

    const naoDisponibilizado = !a.dataDisponibilizado;
    const prazo = prazoBucket(a.dataNecessaria, HOJE);

    if (naoDisponibilizado && prazo.dias <= 7) {
      b.push({
        o: `${equip.nome} — necessário ${a.dataNecessaria.split("-").reverse().join("/")}, ainda ${a.status}`,
        logo: `${prazo.label}. Sem ele a campanha não tem instrumento. Liberar o equipamento.`,
        status: prazo.dias < 0 ? "critico" : "atencao",
        href: "/equipamentos",
      });
    }
    if (a.dataDisponibilizado && a.dataDisponibilizado > a.dataNecessaria) {
      b.push({
        o: `${equip.nome} — disponibilizado com atraso`,
        logo: `Precisava em ${a.dataNecessaria.split("-").reverse().join("/")}, saiu em ${a.dataDisponibilizado.split("-").reverse().join("/")}.`,
        status: "atencao",
        href: "/equipamentos",
      });
    }
  }

  // 4. Equipe que não pode entrar. ASO, curso, crachá — tudo pela T-scale.
  for (const id of projeto.equipeIds) {
    const c = colaboradores.find((x) => x.id === id);
    if (!c) continue;

    if (c.status === "bloqueado") {
      b.push({
        o: `${c.nome} — ${c.pendencias.join(", ") || "bloqueado"}`,
        logo: "Não pode entrar na área do cliente. Equipe incompleta até regularizar.",
        status: "critico",
        href: "/colaboradores",
      });
      continue;
    }
    for (const cr of c.crachas) {
      const p = prazoBucket(cr.validade, HOJE);
      if (p.bucket === "T0" || p.bucket === "T1") {
        b.push({
          o: `Crachá de ${c.nome} em ${cr.unidade} — ${p.label.toLowerCase()}`,
          logo: "Sem crachá válido não há acesso à mina, mesmo com todo o resto em dia.",
          status: "critico",
          href: "/colaboradores",
        });
      }
    }
    if (c.cnh) {
      const p = prazoBucket(c.cnh.validade, HOJE);
      const ehMotorista = c.cargo.toLowerCase().includes("motorista");
      if (
        ehMotorista &&
        (p.bucket === "T0" || p.bucket === "T1" || p.bucket === "T2")
      ) {
        b.push({
          o: `CNH de ${c.nome} — ${p.label.toLowerCase()}`,
          logo: "Motorista sem CNH válida não dirige. Renovar antes da mobilização.",
          status: p.dias < 0 ? "critico" : "atencao",
          href: "/colaboradores",
        });
      }
    }
  }

  // 5. Veículo alocado impedido de rodar.
  for (const id of projeto.veiculoIds) {
    const v = veiculos.find((x) => x.id === id);
    if (!v) continue;
    if (v.status === "bloqueado" || v.status === "manutencao") {
      const motivo = v.checklist
        .filter((i) => i.status === "critico")
        .map((i) => i.item);
      b.push({
        o: `${v.placa} ${v.modelo} — ${v.status === "bloqueado" ? "bloqueado" : "em manutenção"}`,
        logo: motivo.length
          ? `${motivo.join(", ")} irregular. Sem veículo a equipe não chega ao ponto.`
          : "Sem veículo a equipe não chega ao ponto de coleta.",
        status: "critico",
        href: "/veiculos",
      });
    }
  }

  return b;
}

export function statusDaProntidao(bloqueios: Bloqueio[]): StatusSemantico {
  if (bloqueios.some((x) => x.status === "critico")) return "critico";
  if (bloqueios.some((x) => x.status === "atencao")) return "atencao";
  return "ok";
}

/** Projetos que o Financeiro acompanha: em andamento ou com início agendado. */
export function getProjetosAtivosEAgendados() {
  return projetos
    .filter(
      (p) =>
        p.status === "em_andamento" ||
        p.status === "planejamento" ||
        p.status === "suspenso",
    )
    .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
}

/* ---------------------------------------------------- conformidade da equipe */

export type ConformidadeItem = {
  colaboradorId: string;
  nome: string;
  cargo: string;
  status: StatusSemantico;
  /** O que falta. Vazio = pode entrar na área do cliente hoje. */
  pendencias: string[];
};

/**
 * "A equipe pode entrar na mina?" — não é um campo, é uma pergunta respondida
 * em tempo real a partir de ASO, curso, crachá e CNH. Pedido explícito da doc:
 * "status de conformidade da equipe (se já tem tudo da equipe pronto)".
 */
export function getConformidadeDaEquipe(projetoId: string): ConformidadeItem[] {
  const projeto = projetos.find((p) => p.id === projetoId);
  if (!projeto) return [];

  return projeto.equipeIds.flatMap((id) => {
    const c = colaboradores.find((x) => x.id === id);
    if (!c) return [];

    const pend: string[] = [...c.pendencias];

    for (const cr of c.crachas) {
      const p = prazoBucket(cr.validade, HOJE);
      if (p.bucket === "T0")
        pend.push(`Crachá ${cr.cliente} ${p.label.toLowerCase()}`);
      else if (p.bucket === "T1")
        pend.push(`Crachá ${cr.cliente} ${p.label.toLowerCase()}`);
    }
    if (c.cnh && c.cargo.toLowerCase().includes("motorista")) {
      const p = prazoBucket(c.cnh.validade, HOJE);
      if (p.bucket === "T0" || p.bucket === "T1" || p.bucket === "T2") {
        pend.push(`CNH ${p.label.toLowerCase()}`);
      }
    }

    const status: StatusSemantico =
      c.status === "bloqueado" ? "critico" : pend.length ? "atencao" : "ok";

    return [
      {
        colaboradorId: c.id,
        nome: c.nome,
        cargo: c.cargo,
        status,
        pendencias: pend,
      },
    ];
  });
}

export function statusDaConformidade(
  itens: ConformidadeItem[],
): StatusSemantico {
  if (!itens.length) return "neutro";
  if (itens.some((i) => i.status === "critico")) return "critico";
  if (itens.some((i) => i.status === "atencao")) return "atencao";
  return "ok";
}

/* ------------------------------------------------ ciclo do equipamento */

export type StatusAlocacao = {
  /** Cumpriu a data necessária? Só responde depois de disponibilizado. */
  cumpriuPrazo: boolean | null;
  atrasoDias: number;
  label: string;
  status: StatusSemantico;
};

/**
 * "Equipamentos solicitados e se já marcados com DISPONIBILIZADO na data
 * solicitada" — a comparação que a doc pede, em um lugar só.
 */
export function avaliarAlocacao(a: {
  status: string;
  dataNecessaria: string;
  dataDisponibilizado?: string;
}): StatusAlocacao {
  if (!a.dataDisponibilizado) {
    const p = prazoBucket(a.dataNecessaria, HOJE);
    const vencido = p.dias < 0;
    return {
      cumpriuPrazo: null,
      atrasoDias: vencido ? Math.abs(p.dias) : 0,
      label: vencido
        ? `Não disponibilizado — ${p.label.toLowerCase()}`
        : `Aguardando — ${p.label.toLowerCase()}`,
      status: vencido ? "critico" : p.dias <= 7 ? "atencao" : "neutro",
    };
  }

  const dias = diasEntre(a.dataNecessaria, a.dataDisponibilizado);
  if (dias <= 0) {
    return {
      cumpriuPrazo: true,
      atrasoDias: 0,
      label: "Disponibilizado no prazo",
      status: "ok",
    };
  }
  return {
    cumpriuPrazo: false,
    atrasoDias: dias,
    label: `Disponibilizado ${dias} ${dias === 1 ? "dia" : "dias"} depois do necessário`,
    status: "atencao",
  };
}

function diasEntre(de: string, ate: string) {
  return Math.round(
    (new Date(ate).getTime() - new Date(de).getTime()) / 86_400_000,
  );
}

/* ------------------------------------------------------ custo comparado */

export type CustoAnterior = {
  projetoId: string;
  nome: string;
  cliente: string;
  orcamento: number;
  custoFinal: number;
  /** Positivo = estourou o orçamento. */
  desvioPct: number;
};

/**
 * "Custo de projetos anteriores" — a régua que diz se o custo atual está fora
 * da curva. Sem ela, um número de orçamento não significa nada sozinho.
 */
export function getCustosAnteriores(projetoId: string): CustoAnterior[] {
  const p = projetos.find((x) => x.id === projetoId);
  if (!p) return [];

  return p.projetosAnterioresIds.flatMap((id) => {
    const a = projetos.find((x) => x.id === id);
    if (!a) return [];
    return [
      {
        projetoId: a.id,
        nome: a.nome,
        cliente: a.clienteId,
        orcamento: a.orcamento,
        custoFinal: a.custoAtual,
        desvioPct: Math.round(
          ((a.custoAtual - a.orcamento) / a.orcamento) * 100,
        ),
      },
    ];
  });
}

/* ================================================== Segurança do Trabalho */

export type AsoStatus = {
  colaboradorId: string;
  nome: string;
  cargo: string;
  validade: string;
  prazo: Prazo;
};

/**
 * ASO vencido/a vencer, no topo da aba porque é o que bloqueia pessoa —
 * ver docs/projeto-abas.md. Um colaborador pode não ter ASO cadastrado
 * (mock incompleto não deve virar crash, só fica de fora da lista).
 */
export function getAsoStatus(): AsoStatus[] {
  return colaboradores.flatMap((c) => {
    const aso = c.documentos.find((d) => d.tipo === "ASO");
    if (!aso) return [];
    return [
      {
        colaboradorId: c.id,
        nome: c.nome,
        cargo: c.cargo,
        validade: aso.validade,
        prazo: prazoBucket(aso.validade, HOJE),
      },
    ];
  });
}

/** Só os que merecem atenção — T0 a T2. Ordenado do mais urgente ao menos. */
export function getAsoVencendoOuVencido(): AsoStatus[] {
  return getAsoStatus()
    .filter(
      (a) =>
        a.prazo.bucket === "T0" ||
        a.prazo.bucket === "T1" ||
        a.prazo.bucket === "T2",
    )
    .sort((a, b) => a.prazo.dias - b.prazo.dias);
}

export type TreinamentoAgendado = Treinamento & {
  /** Quantos dos participantes já estão vencendo o próprio treinamento — o
   * cruzamento que a doc pede: "cruzar treinamentos marcados com quem está
   * vencendo". */
  participantesVencendo: number;
};

export function getTreinamentosAgendados(): TreinamentoAgendado[] {
  return treinamentos
    .filter((t) => t.status === "agendado")
    .map((t) => ({
      ...t,
      participantesVencendo: t.colaboradorIds.filter((id) => {
        const c = colaboradores.find((x) => x.id === id);
        if (!c) return false;
        return (
          c.treinamentos.some(
            (tc) =>
              tc.nome === t.nome.split(" (")[0].split(" — ")[0] &&
              tc.status !== "ok",
          ) || c.status !== "apto"
        );
      }).length,
    }))
    .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));
}

export type ItemEstoqueEpiStatus = {
  id: string;
  item: string;
  ca: string;
  tamanho?: string;
  quantidade: number;
  minimo: number;
  validadeLote: string;
  /** Pior dos dois: quantidade abaixo do mínimo OU lote vencendo. */
  status: StatusSemantico;
  motivo: string[];
};

/** Estoque de EPI com status combinado — quantidade e validade do lote. */
export function getEstoqueEpiComStatus(): ItemEstoqueEpiStatus[] {
  return estoqueEpi.map((e) => {
    const motivo: string[] = [];
    let status: StatusSemantico = "ok";

    if (e.quantidade < e.minimo) {
      motivo.push(`${e.quantidade} de ${e.minimo} mínimo`);
      status = "critico";
    } else if (e.quantidade === e.minimo) {
      motivo.push("no limite do mínimo");
      status = "atencao";
    }

    const prazo = prazoBucket(e.validadeLote, HOJE);
    if (prazo.bucket === "T0" || prazo.bucket === "T1") {
      motivo.push(`lote ${prazo.label.toLowerCase()}`);
      status = "critico";
    } else if (prazo.bucket === "T2" && status === "ok") {
      motivo.push(`lote ${prazo.label.toLowerCase()}`);
      status = "atencao";
    }

    return { ...e, status, motivo };
  });
}

const CATEGORIA_TREINAMENTO_LABEL: Record<CategoriaTreinamento, string> = {
  nr: "NR",
  cliente: "Cliente",
  interno: "Interno",
  cnh: "CNH",
};

export type CertificadoColaborador = {
  colaboradorId: string;
  nome: string;
  categoria: CategoriaTreinamento | "documento";
  categoriaLabel: string;
  nomeCertificado: string;
  validade?: string;
  status: StatusSemantico;
};

/**
 * A tabela `treinamentos` só registra agendamentos — não cobre o histórico
 * completo de cada colaborador. Por isso a categoria vem do próprio nome, não
 * de um lookup que ficaria incompleto e jogaria tudo em "interno" por padrão.
 */
function categoriaPeloNome(nome: string): CategoriaTreinamento {
  const n = nome.toUpperCase();
  if (
    n.startsWith("NR") ||
    n.includes("ESPAÇO CONFINADO") ||
    n.includes("TRABALHO EM ALTURA")
  )
    return "nr";
  if (n.includes("CNH") || n.includes("DIREÇÃO")) return "cnh";
  if (n.includes("INTEGRAÇÃO")) return "cliente";
  return "interno";
}

/**
 * Certificados de todos os colaboradores, separados por categoria — pedido
 * explícito da doc. Junta documentos (ASO, CNH) e treinamentos concluídos,
 * porque para quem consulta ambos são "coisa que vence e libera acesso".
 */
export function getCertificadosPorColaborador(): CertificadoColaborador[] {
  return colaboradores.flatMap((c) => {
    const doDocumento = c.documentos.map((d) => ({
      colaboradorId: c.id,
      nome: c.nome,
      categoria: "documento" as const,
      categoriaLabel: "Documento",
      nomeCertificado: d.tipo,
      validade: d.validade,
      status: d.status,
    }));

    const doTreinamento = c.treinamentos
      .filter((t) => t.concluido)
      .map((t) => {
        const categoria = categoriaPeloNome(t.nome);
        return {
          colaboradorId: c.id,
          nome: c.nome,
          categoria,
          categoriaLabel: CATEGORIA_TREINAMENTO_LABEL[categoria],
          nomeCertificado: t.nome,
          validade: t.validade,
          status: t.status,
        };
      });

    return [...doDocumento, ...doTreinamento];
  });
}

export function agruparCertificadosPorCategoria(
  itens: CertificadoColaborador[],
) {
  const grupos = new Map<string, CertificadoColaborador[]>();
  for (const i of itens) {
    grupos.set(i.categoriaLabel, [...(grupos.get(i.categoriaLabel) ?? []), i]);
  }
  return [...grupos.entries()].map(([label, itens]) => ({ label, itens }));
}

/** Acidentes filtrados por período (inclusive) e opcionalmente por projeto. */
export function getAcidentesPeriodo(
  de: string,
  ate: string,
  projetoId?: string,
): Acidente[] {
  return acidentes
    .filter((a) => a.data >= de && a.data <= ate)
    .filter((a) => !projetoId || a.projetoId === projetoId)
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function getOcorrenciasPeriodo(de: string, ate: string): Ocorrencia[] {
  return ocorrencias
    .filter((o) => o.data >= de && o.data <= ate)
    .sort((a, b) => b.data.localeCompare(a.data));
}

export const GRAVIDADE_ACIDENTE_LABEL: Record<Acidente["gravidade"], string> = {
  sem_afastamento: "Sem afastamento",
  com_afastamento: "Com afastamento",
  grave: "Grave",
  fatal: "Fatal",
};

export const TIPO_ACIDENTE_LABEL: Record<Acidente["tipo"], string> = {
  trajeto: "Trajeto",
  tipico: "Típico",
  ambiental: "Ambiental",
  veicular: "Veicular",
  fauna: "Fauna",
};

export function statusDoAcidente(a: Acidente): StatusSemantico {
  if (a.gravidade === "fatal" || a.gravidade === "grave") return "critico";
  if (a.gravidade === "com_afastamento") return "critico";
  return "atencao";
}

/* ===================================================== Ciclo do equipamento */

/** Todas as alocações de um equipamento, mais recentes primeiro. */
export function getAlocacoesDoEquipamento(equipamentoId: string) {
  return alocacoesEquipamento
    .filter((a) => a.equipamentoId === equipamentoId)
    .sort((a, b) => b.dataSolicitacao.localeCompare(a.dataSolicitacao));
}

/**
 * "Próximo projeto onde o equipamento será utilizado" — pedido explícito da
 * doc. É a alocação futura mais próxima que ainda não foi devolvida.
 */
export function getProximaAlocacao(equipamentoId: string) {
  return (
    getAlocacoesDoEquipamento(equipamentoId).find(
      (a) => a.status !== "devolvido",
    ) ?? null
  );
}

/* ==================================================== Financeiro da Empresa */

export type ReceitaPorCliente = {
  clienteId: string;
  nome: string;
  valorContratado: number;
  custoAtual: number;
  margemPct: number;
  projetos: number;
};

/**
 * Receita e margem por contrato — deriva de Projeto (valorContrato,
 * custoAtual), não de tipo novo. Mesma base de dado do Financeiro de Campo,
 * lente diferente: lá é prontidão de custo, aqui é receita/margem.
 */
export function getReceitaPorCliente(): ReceitaPorCliente[] {
  return clientes
    .map((c) => {
      const doCliente = projetos.filter((p) => p.clienteId === c.id);
      const valorContratado = doCliente.reduce(
        (a, p) => a + p.valorContrato,
        0,
      );
      const custoAtual = doCliente.reduce((a, p) => a + p.custoAtual, 0);
      return {
        clienteId: c.id,
        nome: c.nome,
        valorContratado,
        custoAtual,
        margemPct:
          valorContratado > 0
            ? Math.round(
                ((valorContratado - custoAtual) / valorContratado) * 100,
              )
            : 0,
        projetos: doCliente.length,
      };
    })
    .filter((r) => r.projetos > 0)
    .sort((a, b) => b.valorContratado - a.valorContratado);
}

export type RankingContrato = {
  projetoId: string;
  nome: string;
  cliente: string;
  valorContrato: number;
  custoAtual: number;
  margemPct: number;
};

export function getRankingContratos(): RankingContrato[] {
  return projetos
    .map((p) => ({
      projetoId: p.id,
      nome: p.nome,
      cliente: clientes.find((c) => c.id === p.clienteId)?.nome ?? "—",
      valorContrato: p.valorContrato,
      custoAtual: p.custoAtual,
      margemPct: Math.round(
        ((p.valorContrato - p.custoAtual) / p.valorContrato) * 100,
      ),
    }))
    .sort((a, b) => b.margemPct - a.margemPct);
}

export function getReceitaTotalContratada() {
  return projetos.reduce((a, p) => a + p.valorContrato, 0);
}

export function getCustoTotalOperacao() {
  return projetos.reduce((a, p) => a + p.custoAtual, 0);
}

/** Contas a receber vencidas/vencendo — mesma T-scale de todo o resto. */
export function getContasReceberComPrazo() {
  return contasReceber
    .filter((c) => c.status !== "recebida")
    .map((c) => ({ ...c, prazo: prazoBucket(c.vencimento, HOJE) }))
    .sort((a, b) => a.prazo.dias - b.prazo.dias);
}

export function getContasPagarComPrazo() {
  return contasPagar
    .filter((c) => c.status !== "paga")
    .map((c) => ({ ...c, prazo: prazoBucket(c.vencimento, HOJE) }))
    .sort((a, b) => a.prazo.dias - b.prazo.dias);
}

export function getTotalAReceber() {
  return contasReceber
    .filter((c) => c.status !== "recebida")
    .reduce((a, c) => a + c.valor, 0);
}

export function getTotalAPagar() {
  return contasPagar
    .filter((c) => c.status !== "paga")
    .reduce((a, c) => a + c.valor, 0);
}

export function getFolhaDoMes(mes: string) {
  return folhaPagamento.find((f) => f.mes === mes) ?? null;
}

export function getCaixaAtual() {
  return saldoCaixaMensal[saldoCaixaMensal.length - 1];
}

export function getDespesasAdminPorCategoria() {
  const grupos = new Map<string, number>();
  for (const d of despesasAdministrativas) {
    grupos.set(d.categoria, (grupos.get(d.categoria) ?? 0) + d.valor);
  }
  return [...grupos.entries()].sort((a, b) => b[1] - a[1]);
}

/* ============================================================== Home ==== */

export type VencimentoItem = {
  tipo: "cracha" | "multa" | "aso" | "calibracao" | "treinamento";
  tipoLabel: string;
  titulo: string;
  detalhe: string;
  prazo: Prazo;
  href: string;
};

/**
 * Cruza todos os domínios com data de vencimento (crachá, ASO, treinamento,
 * multa, calibração) pela mesma T-scale — é o que dá à Home uma visão real
 * de "o que vence esta semana" sem inventar um novo threshold por domínio.
 */
export function getVencimentosDaSemana(): VencimentoItem[] {
  const itens: VencimentoItem[] = [];
  /**
   * Janela real de "esta semana" — vencido há até 7 dias ou vencendo nos
   * próximos 7. Bucket T0 sozinho incluiria um atraso de meses junto com um
   * vencimento de amanhã; aqui os dois merecem o mesmo peso, mas um atraso
   * antigo não é "desta semana", é backlog de outro problema.
   */
  const vencendo = (dias: number) => dias >= -7 && dias <= 7;

  for (const c of colaboradores) {
    for (const cr of c.crachas) {
      const prazo = prazoBucket(cr.validade, HOJE);
      if (vencendo(prazo.dias)) {
        itens.push({
          tipo: "cracha",
          tipoLabel: "Crachá",
          titulo: `Crachá ${cr.cliente} de ${c.nome}`,
          detalhe: `${cr.unidade} · ${prazo.label}`,
          prazo,
          href: "/colaboradores",
        });
      }
    }

    const aso = c.documentos.find((d) => d.tipo === "ASO");
    if (aso) {
      const prazo = prazoBucket(aso.validade, HOJE);
      if (vencendo(prazo.dias)) {
        itens.push({
          tipo: "aso",
          tipoLabel: "ASO",
          titulo: `ASO de ${c.nome}`,
          detalhe: prazo.label,
          prazo,
          href: "/colaboradores",
        });
      }
    }

    for (const t of c.treinamentos) {
      if (!t.validade) continue;
      const prazo = prazoBucket(t.validade, HOJE);
      if (vencendo(prazo.dias)) {
        itens.push({
          tipo: "treinamento",
          tipoLabel: "Treinamento",
          titulo: `${t.nome} de ${c.nome}`,
          detalhe: prazo.label,
          prazo,
          href: "/colaboradores",
        });
      }
    }
  }

  for (const v of veiculos) {
    for (const m of v.multas) {
      if (m.status !== "aberta" && m.status !== "indicada") continue;
      const prazo = prazoBucket(m.vencimento, HOJE);
      if (vencendo(prazo.dias)) {
        itens.push({
          tipo: "multa",
          tipoLabel: "Multa",
          titulo: `Multa ${v.placa}`,
          detalhe: `${m.infracao} · ${prazo.label}`,
          prazo,
          href: "/veiculos",
        });
      }
    }
  }

  for (const e of equipamentos) {
    const prazo = prazoBucket(e.validadeCalibragem, HOJE);
    if (vencendo(prazo.dias)) {
      itens.push({
        tipo: "calibracao",
        tipoLabel: "Calibração",
        titulo: `Calibração de ${e.nome}`,
        detalhe: prazo.label,
        prazo,
        href: "/equipamentos",
      });
    }
  }

  return itens.sort((a, b) => a.prazo.dias - b.prazo.dias);
}

/* ==================================================================== SSMA */

export function getChecklistsDoProjeto(projetoId: string) {
  return checklistsCampo
    .filter((c) => c.projetoId === projetoId)
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function getChecklistsDoVeiculo(veiculoId: string) {
  return checklistsCampo
    .filter((c) => c.veiculoId === veiculoId)
    .sort((a, b) => b.data.localeCompare(a.data));
}

/**
 * Reprovado (kits) é sempre crítico. Fora isso, um item "não atende" só é
 * crítico se a inspeção anterior já tinha o mesmo desvio sem correção —
 * mesma lógica de "reincidência" destacada nos documentos reais da MDGEO.
 */
export function statusDoChecklist(c: ChecklistCampo): StatusSemantico {
  if (c.aprovado === false) return "critico";
  const temNaoAtende = c.itens.some((i) => i.status === "nao_atende");
  if (!temNaoAtende) return "ok";
  return c.desviosCorrigidos === false ? "critico" : "atencao";
}

export function getColaboradoresSemAceiteRegrasOuro() {
  const aceitaram = new Set(aceitesRegrasOuro.map((a) => a.colaboradorId));
  return colaboradores.filter((c) => !aceitaram.has(c.id));
}

export function getAceiteRegrasOuroDoColaborador(colaboradorId: string) {
  return (
    aceitesRegrasOuro.find((a) => a.colaboradorId === colaboradorId) ?? null
  );
}

export function getRegistrosDSSMAPeriodo(de: string, ate: string) {
  return registrosDSSMA
    .filter((r) => r.data >= de && r.data <= ate)
    .sort((a, b) => b.data.localeCompare(a.data));
}

/* ============================================================ Mobilização */

export type MobilizacaoItem = {
  colaboradorId: string;
  nome: string;
  cargo: string;
  clienteNome: string;
  clienteId?: string;
  unidade: string;
  numeroCracha: string;
  prazoCracha: Prazo;
  /** Aptidão geral do colaborador — vem de Colaborador.status, não é recalculada aqui. */
  statusGeral: StatusSemantico;
  pendenciasGerais: string[];
};

/**
 * Uma linha por crachá (colaborador × mineradora). `Cracha.cliente` é o NOME
 * do cliente, não o id — casa por nome porque é assim que a ficha do
 * colaborador já guarda o dado; não inventamos um id novo aqui.
 */
export function getMobilizacoes(): MobilizacaoItem[] {
  return colaboradores
    .flatMap((c) =>
      c.crachas.map((cr) => {
        const cliente = clientes.find((cl) => cl.nome === cr.cliente);
        return {
          colaboradorId: c.id,
          nome: c.nome,
          cargo: c.cargo,
          clienteNome: cr.cliente,
          clienteId: cliente?.id,
          unidade: cr.unidade,
          numeroCracha: cr.numero,
          prazoCracha: prazoBucket(cr.validade, HOJE),
          statusGeral: (c.status === "apto"
            ? "ok"
            : c.status === "pendente"
              ? "atencao"
              : "critico") as StatusSemantico,
          pendenciasGerais: c.pendencias,
        };
      }),
    )
    .sort((a, b) => a.prazoCracha.dias - b.prazoCracha.dias);
}

export function getMobilizacoesPorCliente(clienteId: string) {
  return getMobilizacoes().filter((m) => m.clienteId === clienteId);
}

export type ColaboradorImpedido = {
  colaboradorId: string;
  nome: string;
  cargo: string;
  pendencias: string[];
  clientes: string[];
};

/**
 * Quem NÃO está pronto para mobilizar, agregado por pessoa: as mobilizações
 * são uma linha por crachá, mas a pergunta "quem está impedido?" se responde
 * por colaborador — juntando pendências gerais, crachá crítico e os clientes
 * afetados em um registro só.
 *
 * Um crachá crítico (vencido/vencendo) sozinho já é impedimento: trava o acesso
 * daquela pessoa naquele cliente mesmo que ela esteja apta no geral. Por isso a
 * guarda só pula a linha quando o colaborador está apto E o crachá não é
 * crítico — assim um apto com crachá crítico em um cliente e válido em outro
 * entra na lista trazendo apenas o cliente do crachá crítico.
 */
export function getColaboradoresComImpedimento(): ColaboradorImpedido[] {
  const porColaborador = new Map<string, ColaboradorImpedido>();

  for (const m of getMobilizacoes()) {
    if (m.statusGeral === "ok" && m.prazoCracha.status !== "critico") continue;

    const atual = porColaborador.get(m.colaboradorId) ?? {
      colaboradorId: m.colaboradorId,
      nome: m.nome,
      cargo: m.cargo,
      pendencias: [...m.pendenciasGerais],
      clientes: [],
    };

    // Crachá vencido/vencendo entra como pendência nomeada — é o que trava
    // o acesso naquele cliente específico.
    if (m.prazoCracha.status === "critico") {
      atual.pendencias.push(
        `Crachá ${m.clienteNome} ${m.prazoCracha.label.toLowerCase()}`,
      );
    }
    if (!atual.clientes.includes(m.clienteNome)) {
      atual.clientes.push(m.clienteNome);
    }
    porColaborador.set(m.colaboradorId, atual);
  }

  return [...porColaborador.values()];
}

/* ================================================================ Comercial */

/**
 * Recebe a lista de contratos como parâmetro (não importa o array do mock
 * diretamente) porque Projetos/Comercial agora leem do store mutável
 * (`useDataStore()`) — se a função lesse o array estático, criar/editar um
 * contrato não refletiria aqui.
 */
export function getContratoDoProjeto(
  contratosList: Contrato[],
  projetoId: string,
) {
  return contratosList.find((c) => c.projetoId === projetoId) ?? null;
}

export function getAditivosDoProjeto(
  aditivosList: AditivoContrato[],
  projetoId: string,
) {
  return aditivosList.filter((a) => a.projetoId === projetoId);
}

export function getPercentualConclusaoContrato(contrato: Contrato) {
  if (!contrato.checklist.length) return 0;
  const feitos = contrato.checklist.filter((i) => i.concluido).length;
  return Math.round((feitos / contrato.checklist.length) * 100);
}

export type ImpeditivoComercial = {
  projetoId: string;
  projetoNome: string;
  tipo: "contrato" | "acidente" | "prazo" | "negociacao";
  descricao: string;
  status: StatusSemantico;
};

/**
 * Tudo que trava ou ameaça um contrato, em uma lista só: impeditivo textual
 * do contrato, acidente em projeto ativo, entrega a menos de 60 dias e
 * aditivo ainda em negociação. Recebe as listas como parâmetro (padrão
 * getContratoDoProjeto) porque Comercial lê do store mutável.
 */
export function getImpeditivosComerciais(
  projetosList: Projeto[],
  contratosList: Contrato[],
  aditivosList: AditivoContrato[],
): ImpeditivoComercial[] {
  const itens: ImpeditivoComercial[] = [];
  const nomeDe = (projetoId: string) =>
    projetosList.find((p) => p.id === projetoId)?.nome ?? "—";

  // 1. Impeditivos declarados no contrato — só de projeto ainda não concluído.
  for (const c of contratosList) {
    const projeto = projetosList.find((p) => p.id === c.projetoId);
    if (!projeto || projeto.status === "concluido") continue;
    for (const imp of c.impeditivos) {
      itens.push({
        projetoId: c.projetoId,
        projetoNome: projeto.nome,
        tipo: "contrato",
        descricao: imp,
        status: "critico",
      });
    }
  }

  // 2. Acidente em projeto em andamento — risco contratual imediato.
  for (const a of acidentes) {
    if (!a.projetoId) continue;
    const projeto = projetosList.find((p) => p.id === a.projetoId);
    if (!projeto || projeto.status !== "em_andamento") continue;
    itens.push({
      projetoId: a.projetoId,
      projetoNome: projeto.nome,
      tipo: "acidente",
      descricao: `Acidente em campo — ${a.local}`,
      status: "critico",
    });
  }

  // 3. Entrega contratual a 60 dias ou menos — mesma T-scale de todo o resto.
  for (const p of projetosList) {
    if (p.status !== "em_andamento") continue;
    const prazo = prazoBucket(p.dataFim, HOJE);
    if (prazo.dias > 60) continue;
    itens.push({
      projetoId: p.id,
      projetoNome: p.nome,
      tipo: "prazo",
      descricao: `Entrega em ${formatDate(p.dataFim)} — ${prazo.label.toLowerCase()}`,
      status: "atencao",
    });
  }

  // 4. Aditivo proposto = valor em negociação, ainda fora do contrato.
  for (const a of aditivosList) {
    if (a.status !== "proposto") continue;
    itens.push({
      projetoId: a.projetoId,
      projetoNome: nomeDe(a.projetoId),
      tipo: "negociacao",
      descricao: `Aditivo em negociação — ${formatBRL(a.valorAdicional)}`,
      status: "atencao",
    });
  }

  return itens;
}

export type ProjetosPorCliente = {
  clienteId: string;
  clienteNome: string;
  qtdProjetos: number;
  valorTotal: number;
};

/** Carteira por cliente — quantos projetos e quanto valem, maior primeiro. */
export function getProjetosPorCliente(
  projetosList: Projeto[],
): ProjetosPorCliente[] {
  const porCliente = new Map<string, ProjetosPorCliente>();
  for (const p of projetosList) {
    const atual = porCliente.get(p.clienteId) ?? {
      clienteId: p.clienteId,
      clienteNome:
        clientes.find((c) => c.id === p.clienteId)?.nome ?? p.clienteId,
      qtdProjetos: 0,
      valorTotal: 0,
    };
    atual.qtdProjetos += 1;
    atual.valorTotal += p.valorContrato;
    porCliente.set(p.clienteId, atual);
  }
  return [...porCliente.values()].sort((a, b) => b.valorTotal - a.valorTotal);
}

/* ================================================================== Técnico */

/** Gerente vê tudo; coordenador só o que lhe foi atribuído (responsavelId). */
export function getProjetosVisiveis(
  projetosList: Projeto[],
  papel: PapelVisualizacao,
  colaboradorId: string,
) {
  if (papel === "gerente") return projetosList;
  return projetosList.filter((p) => p.responsavelId === colaboradorId);
}

export function getRoadmapDoProjeto(
  etapasList: EtapaRoadmap[],
  projetoId: string,
) {
  return etapasList
    .filter((e) => e.projetoId === projetoId)
    .sort((a, b) => a.ordem - b.ordem);
}

export type InsightFornecedor = {
  item: string;
  melhorFornecedor: string;
  melhorValor: number;
  cotacoesRegistradas: number;
};

/** Melhor preço já cotado por item — cruza todas as solicitações de compra. */
export function getInsightsFornecedores(): InsightFornecedor[] {
  const porItem = new Map<string, { fornecedor: string; valor: number }[]>();
  for (const s of solicitacoesCompra) {
    for (const c of s.cotacoes) {
      porItem.set(s.item, [
        ...(porItem.get(s.item) ?? []),
        { fornecedor: c.fornecedor, valor: c.valor },
      ]);
    }
  }
  return [...porItem.entries()]
    .map(([item, cotas]) => {
      const melhor = cotas.reduce((a, b) => (b.valor < a.valor ? b : a));
      return {
        item,
        melhorFornecedor: melhor.fornecedor,
        melhorValor: melhor.valor,
        cotacoesRegistradas: cotas.length,
      };
    })
    .sort((a, b) => a.item.localeCompare(b.item));
}

export type RankingFornecedor = {
  fornecedor: string;
  cotacoes: number;
  vitorias: number;
  valorTotalVencido: number;
};

/** Quem mais venceu cotações — proxy de "melhor fornecedor" pelo histórico real. */
export function getRankingFornecedores(): RankingFornecedor[] {
  const mapa = new Map<string, RankingFornecedor>();
  for (const s of solicitacoesCompra) {
    for (const c of s.cotacoes) {
      const atual = mapa.get(c.fornecedor) ?? {
        fornecedor: c.fornecedor,
        cotacoes: 0,
        vitorias: 0,
        valorTotalVencido: 0,
      };
      atual.cotacoes += 1;
      if (c.vencedora) {
        atual.vitorias += 1;
        atual.valorTotalVencido += c.valor;
      }
      mapa.set(c.fornecedor, atual);
    }
  }
  return [...mapa.values()].sort((a, b) => b.vitorias - a.vitorias);
}

/* ========================================================== Financeiro/setor */

export type ItemGasto = { descricao: string; valor: number; data: string };

export type GastoSetor = {
  setor: SetorCusto;
  setorLabel: string;
  budget: number;
  atual: number;
  pct: number;
  itens: ItemGasto[];
};

const SETOR_LABEL: Record<SetorCusto, string> = {
  campo: "Campo (hospedagem, alimentação, extraordinárias)",
  combustivel: "Combustível",
  veiculos: "Veículos (locação e manutenção)",
  pessoal: "Pessoal (folha)",
  administrativo: "Administrativo",
};

/**
 * Gasto por setor contra o budget do mês — nunca guarda o "atual", sempre
 * soma de despesasCampo/abastecimentos/manutenções/folha/despesas admin já
 * existentes. Alimenta os cards de orçamento e o drill-down do Financeiro.
 */
export function getGastoPorSetor(mes: string): GastoSetor[] {
  const budgets = budgetMensalSetor.filter((b) => b.mes === mes);

  const campoItens: ItemGasto[] = despesasCampo
    .filter(
      (d) =>
        (d.tipo === "hospedagem" ||
          d.tipo === "alimentacao" ||
          d.tipo === "extraordinaria") &&
        d.data.startsWith(mes),
    )
    .map((d) => ({ descricao: d.descricao, valor: d.valor, data: d.data }));

  const combustivelItens: ItemGasto[] = veiculos.flatMap((v) =>
    v.abastecimentos
      .filter((a) => a.data.startsWith(mes))
      .map((a) => ({
        descricao: `${v.placa} · ${a.posto}`,
        valor: a.valor,
        data: a.data,
      })),
  );

  const veiculosItens: ItemGasto[] = [
    ...despesasCampo
      .filter((d) => d.tipo === "locacao" && d.data.startsWith(mes))
      .map((d) => ({ descricao: d.descricao, valor: d.valor, data: d.data })),
    ...veiculos.flatMap((v) =>
      v.manutencoes
        .filter((m) => m.data.startsWith(mes))
        .map((m) => ({
          descricao: `${v.placa} · ${m.descricao}`,
          valor: m.custo,
          data: m.data,
        })),
    ),
  ];

  const folha = folhaPagamento.find((f) => f.mes === mes);
  const pessoalItens: ItemGasto[] = folha
    ? [
        { descricao: "Salários", valor: folha.salarios, data: mes },
        { descricao: "Encargos", valor: folha.encargos, data: mes },
        { descricao: "Benefícios", valor: folha.beneficios, data: mes },
      ]
    : [];

  const adminItens: ItemGasto[] = despesasAdministrativas
    .filter((d) => d.data.startsWith(mes))
    .map((d) => ({
      descricao: `${d.descricao} (${d.fornecedor})`,
      valor: d.valor,
      data: d.data,
    }));

  const porSetor: Record<SetorCusto, ItemGasto[]> = {
    campo: campoItens,
    combustivel: combustivelItens,
    veiculos: veiculosItens,
    pessoal: pessoalItens,
    administrativo: adminItens,
  };

  return budgets.map((b) => {
    const itens = [...porSetor[b.setor]].sort((a, c) => c.valor - a.valor);
    const atual = itens.reduce((a, i) => a + i.valor, 0);
    return {
      setor: b.setor,
      setorLabel: SETOR_LABEL[b.setor],
      budget: b.budget,
      atual,
      pct: b.budget > 0 ? Math.round((atual / b.budget) * 100) : 0,
      itens,
    };
  });
}

export type PeriodoFinanceiro = "mes" | "trimestre" | "ano";

/** Meses da série `SetorFinanceiro.mensal` cobertos por cada período. */
const MESES_PERIODO: Record<PeriodoFinanceiro, { meses: string[]; label: string }> = {
  mes: { meses: ["2026-07"], label: "Julho/2026" },
  trimestre: {
    meses: ["2026-05", "2026-06", "2026-07"],
    label: "Mai–Jul/2026",
  },
  ano: {
    meses: [
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ],
    label: "Jan–Jul/2026",
  },
};

/**
 * Gasto vs. orçamento de um setor no período escolhido — soma da série
 * mensal, nunca um total persistido (senão divergiria ao trocar o filtro).
 */
export function getResumoSetor(
  s: SetorFinanceiro,
  periodo: PeriodoFinanceiro,
): { gasto: number; orcamento: number; pct: number; label: string } {
  const { meses, label } = MESES_PERIODO[periodo];
  const doPeriodo = s.mensal.filter((m) => meses.includes(m.mes));
  const gasto = doPeriodo.reduce((a, m) => a + m.gasto, 0);
  const orcamento = doPeriodo.reduce((a, m) => a + m.orcamento, 0);
  return {
    gasto,
    orcamento,
    pct: orcamento > 0 ? Math.round((gasto / orcamento) * 100) : 0,
    label,
  };
}

/* ============================================================== Logística */

/**
 * Último projeto que usou o veículo, com nomes resolvidos. Uso em aberto
 * (sem `fim`) vence de qualquer histórico encerrado — é o "onde o carro está
 * agora"; só depois vale o início mais recente.
 */
export function getUltimoUsoVeiculo(
  v: Veiculo,
): (UsoVeiculoProjeto & { projetoNome: string; motoristaNome: string }) | null {
  if (!v.historicoUso.length) return null;

  const ordenado = [...v.historicoUso].sort((a, b) => {
    const aAberto = a.fim ? 1 : 0;
    const bAberto = b.fim ? 1 : 0;
    if (aAberto !== bAberto) return aAberto - bAberto;
    return b.inicio.localeCompare(a.inicio);
  });

  const uso = ordenado[0];
  return {
    ...uso,
    projetoNome: projetos.find((p) => p.id === uso.projetoId)?.nome ?? "—",
    motoristaNome:
      colaboradores.find((c) => c.id === uso.motoristaId)?.nome ?? "—",
  };
}

/* ============================================================ Hidroquímica */

/**
 * Compara contra o VMP da CONAMA 396/2008 — 90% do limite já acende
 * atenção, igual à régua de estoque de EPI (não é binário só no estouro).
 */
export function statusResultadoLaboratorial(
  r: ResultadoLaboratorial,
): StatusSemantico {
  if (r.valor > r.vmp) return "critico";
  if (r.valor >= r.vmp * 0.9) return "atencao";
  return "ok";
}

export function getExcedenciasCONAMA() {
  return resultadosLaboratoriais
    .filter((r) => statusResultadoLaboratorial(r) !== "ok")
    .sort((a, b) => b.valor / b.vmp - a.valor / a.vmp);
}

export function getResultadosDoPonto(pontoColeta: string) {
  return resultadosLaboratoriais.filter((r) => r.pontoColeta === pontoColeta);
}

/* ===================================================================== TEA */

export function statusEstacaoTelemetria(e: EstacaoTelemetria): StatusSemantico {
  if (e.statusConexao === "offline") return "critico";
  if (e.statusConexao === "instavel" || e.bateriaPct < 25) return "atencao";
  return "ok";
}

/* ============================================================ Home — SSMA */

const MESES_2026 = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
];
const MES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];

/**
 * Acidentes e ocorrências por mês em 2026 — gráfico de desempenho de
 * segurança para a Home. Conta o que já existe em `acidentes`/`ocorrencias`,
 * não inventa uma série nova.
 */
export function getTendenciaSSMA() {
  return MESES_2026.map((mes, i) => ({
    mes: MES_LABEL[i],
    acidentes: acidentes.filter((a) => a.data.startsWith(mes)).length,
    ocorrencias: ocorrencias.filter((o) => o.data.startsWith(mes)).length,
  }));
}
