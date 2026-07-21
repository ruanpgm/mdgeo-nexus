export type StatusSemantico = "ok" | "atencao" | "critico" | "info" | "neutro";

export type ContatoCliente = {
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
};

export type Cliente = {
  id: string;
  nome: string;
  cnpj: string;
  segmento: string;
  unidades: string[];
  contato: ContatoCliente;
  /** Exigências de acesso da mineradora — cursos, documentos, equipamentos. */
  exigenciasAcesso: string[];
  documentosNecessarios: string[];
};

export type Projeto = {
  id: string;
  clienteId: string;
  nome: string;
  contrato: string;
  dataInicio: string;
  dataFim: string;
  responsavelId: string;
  status: "planejamento" | "em_andamento" | "concluido" | "suspenso";
  equipeIds: string[];
  veiculoIds: string[];
  equipamentoIds: string[];
  /** Orçamento interno — o que planejamos gastar. */
  orcamento: number;
  custoAtual: number;
  /** O que o cliente paga. Nunca confundir com `orcamento`. */
  valorContrato: number;
  servico: string;
  detalhesEntrega: string;
  descricao: string;
  /** Projetos anteriores do mesmo cliente/serviço — a régua de custo. */
  projetosAnterioresIds: string[];
};

export type Campanha = {
  id: string;
  projetoId: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: "planejada" | "em_campo" | "concluida" | "bloqueada";
  equipeIds: string[];
  veiculoIds: string[];
  equipamentoIds: string[];
  pontosColeta: string[];
  bloqueios: string[];
};

export type DocumentoColaborador = {
  tipo: string;
  emissao: string;
  validade: string;
  status: StatusSemantico;
};

export type TreinamentoColaborador = {
  nome: string;
  cliente: string;
  concluido: boolean;
  validade?: string;
  status: StatusSemantico;
};

export type EpiItem = {
  item: string;
  dataEntrega: string;
  validade: string;
  status: StatusSemantico;
};

export type GastoViagem = {
  data: string;
  tipo: string;
  projeto: string;
  valor: number;
  status: "pendente" | "aprovado" | "prestado" | "recusado";
};

export type Cnh = {
  numero: string;
  categoria: string;
  validade: string;
  primeiraHabilitacao: string;
  observacoes?: string;
};

/**
 * Crachá de acesso à área do cliente. A doc é explícita: "Crachá tem
 * vencimento" — sem ele o colaborador não entra na mina, por mais apto que
 * esteja em todo o resto.
 */
export type CrachaCliente = {
  cliente: string;
  unidade: string;
  numero: string;
  emissao: string;
  validade: string;
};

export type Colaborador = {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  funcao: string;
  empresa: string;
  supervisor: string;
  status: "apto" | "pendente" | "bloqueado";
  pendencias: string[];
  documentos: DocumentoColaborador[];
  treinamentos: TreinamentoColaborador[];
  epis: EpiItem[];
  gastos: GastoViagem[];
  projetosHistorico: string[];
  cnh?: Cnh;
  crachas: CrachaCliente[];
  telefone: string;
  email: string;
  admissao: string;
};

export type ChecklistItemVeiculo = {
  item: string;
  validade: string;
  status: StatusSemantico;
};

export type Manutencao = {
  data: string;
  tipo: string;
  descricao: string;
  km: number;
  custo: number;
};

export type Abastecimento = {
  data: string;
  posto: string;
  motorista: string;
  km: number;
  litros: number;
  valor: number;
};

/** Frota é mista — locados e próprios convivem. Por isso é opcional. */
export type Locacao = {
  empresa: string;
  cnpj: string;
  contrato: string;
  custoMensal: number;
  inicio: string;
  fim: string;
  franquiaKm: number;
  custoKmExcedente: number;
};

export type ProtecaoVeiculo =
  | "camera_frontal"
  | "camera_cabine"
  | "telemetria"
  | "gaiola"
  | "extintor"
  | "kit_primeiros_socorros"
  | "farol_led"
  | "antena_alta"
  | "cinto_4_pontos"
  | "protetor_carter";

export type Multa = {
  id: string;
  data: string;
  local: string;
  infracao: string;
  codigo: string;
  gravidade: "leve" | "media" | "grave" | "gravissima";
  pontos: number;
  valor: number;
  /** Quem dirigia — cruza com o histórico de uso do veículo. */
  condutorId?: string;
  status: "aberta" | "paga" | "recurso" | "indicada";
  vencimento: string;
};

export type IncidenteVeiculo = {
  id: string;
  data: string;
  tipo: "colisao" | "avaria" | "pane" | "furto" | "fauna" | "atolamento";
  condutorId: string;
  projetoId?: string;
  local: string;
  descricao: string;
  custoReparo: number;
  /** Preenchido quando houve lesão — o incidente também vira Acidente. */
  acidenteId?: string;
};

export type Lavagem = {
  data: string;
  tipo: "simples" | "completa" | "motor";
  local: string;
  custo: number;
};

export type UsoVeiculoProjeto = {
  projetoId: string;
  campanhaId?: string;
  motoristaId: string;
  equipeIds: string[];
  inicio: string;
  fim?: string;
  kmInicio: number;
  kmFim?: number;
};

export type Veiculo = {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  renavam: string;
  proprietario: string;
  motoristaPrincipal: string;
  status: "disponivel" | "em_campo" | "manutencao" | "bloqueado";
  kmAtual: number;
  cliente: string;
  projetoAtualId?: string;
  /** Km no início do projeto atual. O delta com kmAtual é o que interessa. */
  kmAntesProjeto?: number;
  protecoes: ProtecaoVeiculo[];
  locacao?: Locacao;
  projetosUtilizados: number;
  multas: Multa[];
  incidentes: IncidenteVeiculo[];
  lavagens: Lavagem[];
  historicoUso: UsoVeiculoProjeto[];
  checklist: ChecklistItemVeiculo[];
  manutencoes: Manutencao[];
  abastecimentos: Abastecimento[];
};

export type HistoricoEquipamento = {
  data: string;
  evento: string;
  responsavel: string;
  projeto?: string;
};

/**
 * Registro fotográfico simulado — o mockup não armazena binário; a foto é
 * renderizada como placeholder pelo componente MockFoto, e estes campos dão
 * o contexto real (quando, quem, o quê) que aparece na legenda.
 */
export type FotoRegistro = {
  data: string;
  responsavel: string;
  legenda: string;
};

/**
 * O elo Equipamento <-> Projeto. Sustenta duas coisas que a doc pede em abas
 * diferentes: "próximo projeto com data prevista de retorno" (Equipamentos) e
 * "equipamentos solicitados, marcados DISPONIBILIZADO na data" (Projetos).
 * Uma entidade, duas lentes.
 */
export type AlocacaoEquipamento = {
  id: string;
  equipamentoId: string;
  projetoId: string;
  campanhaId?: string;
  solicitadoPor: string;
  dataSolicitacao: string;
  /** Quando a equipe precisa dele em mãos. */
  dataNecessaria: string;
  dataPrevistaRetorno: string;
  dataRetornoReal?: string;
  status:
    "solicitado" | "aprovado" | "disponibilizado" | "em_campo" | "devolvido";
  /** Comparar com dataNecessaria responde "cumpriu o prazo?". */
  dataDisponibilizado?: string;
};

export type Equipamento = {
  id: string;
  patrimonio: string;
  nome: string;
  tipo: string;
  numeroSerie: string;
  fabricante: string;
  modelo: string;
  localizacao: string;
  situacao:
    "disponivel" | "em_campo" | "calibracao" | "manutencao" | "reservado";
  responsavel: string;
  ultimaCalibragem: string;
  validadeCalibragem: string;
  certificado: string;
  statusCalibragem: StatusSemantico;
  /**
   * 0-100. Estado persistido, NÃO derivado: degrada -1% na transição para
   * "devolvido" (uma vez por retorno de campo) e pode ser ajustado à mão para
   * mais ou para menos. Derivar apagaria o ajuste manual.
   */
  saude: number;
  saudeAjustadaManualmente: boolean;
  projetosUtilizados: number;
  /** Setor da empresa que responde pelo equipamento hoje (junto do responsável). */
  setor: string;
  historico: HistoricoEquipamento[];
  /** Estado do equipamento no momento em que saiu para campo. */
  fotoRetirada?: FotoRegistro;
  /** Estado na devolução — o par retirada/devolução documenta avarias. */
  fotoDevolucao?: FotoRegistro;
};

export type CategoriaMaterial =
  | "construcao"
  | "tubulacao"
  | "consumivel"
  | "epi"
  | "instrumentacao"
  | "outro";

export type Material = {
  id: string;
  projetoId: string;
  categoria: CategoriaMaterial;
  descricao: string;
  unidade: string;
  quantidadePrevista: number;
  quantidadeRecebida: number;
  custoUnitario: number;
  /**
   * `campo` = comprado no cartão, sem cotação prévia. É exatamente o que a doc
   * quer vigiar: pular etapa pode elevar o custo do projeto.
   */
  origem: "estoque" | "compra" | "fabricacao" | "campo";
  /** Preenchido quando origem = "fabricacao". */
  fabricacaoId?: string;
  /** Preenchido quando origem = "compra". */
  solicitacaoCompraId?: string;
};

/**
 * Item que se manda fabricar em terceiros. A doc pede as três datas
 * explicitamente: solicitação, previsão de entrega e status atual. É o maior
 * risco de bloqueio do projeto, porque não depende de nós.
 */
export type Fabricacao = {
  id: string;
  materialId: string;
  fornecedor: string;
  cnpj: string;
  pedido: string;
  dataSolicitacao: string;
  previsaoEntrega: string;
  dataEntregaReal?: string;
  /**
   * "atrasado" NÃO se armazena aqui — deriva de previsaoEntrega vs. hoje via
   * prazoBucket(). Persistir geraria divergência com a T-scale.
   */
  status: "solicitado" | "em_producao" | "pronto" | "entregue";
  valor: number;
  observacoes?: string;
};

/** Entrada e saída de material do projeto — pedido explícito da aba Projetos. */
export type MovimentacaoMaterial = {
  id: string;
  materialId: string;
  projetoId: string;
  tipo: "entrada" | "saida";
  data: string;
  quantidade: number;
  responsavelId: string;
  documento?: string;
  observacao?: string;
};

export type Cotacao = {
  fornecedor: string;
  cnpj: string;
  contato: string;
  valor: number;
  prazoEntrega: number;
  frete: number;
  condicaoPagamento: string;
  observacoes: string;
  vencedora: boolean;
};

/** Avaliação do fornecedor depois do recebimento — alimenta a próxima escolha. */
export type AvaliacaoCompra = {
  nota: 1 | 2 | 3 | 4 | 5;
  prazoCumprido: boolean;
  qualidadeConforme: boolean;
  comentario: string;
  avaliadoPor: string;
  data: string;
};

export type SolicitacaoCompra = {
  id: string;
  solicitante: string;
  centroCusto: string;
  projeto: string;
  item: string;
  quantidade: number;
  justificativa: string;
  valorEstimado: number;
  prioridade: "baixa" | "media" | "alta" | "urgente";
  dataNecessaria: string;
  status:
    "aberta" | "cotando" | "aprovacao" | "aprovada" | "recusada" | "recebida";
  cotacoes: Cotacao[];
  avaliacao?: AvaliacaoCompra;
};

/** Estoque de EPI — não confundir com EpiItem, que é entrega a uma pessoa. */
export type EstoqueEpi = {
  id: string;
  item: string;
  /** Certificado de Aprovação — obrigatório por lei (NR-6). */
  ca: string;
  tamanho?: string;
  quantidade: number;
  /** Abaixo disto acende `atencao`. */
  minimo: number;
  validadeLote: string;
  fornecedor: string;
  ultimaEntrada: string;
};

/**
 * Um acidente é UM registro. Segurança vê o histórico, Colaboradores vê na
 * ficha, Veículos vê como incidente, Projetos vê o impacto. Mesma linha.
 */
export type Acidente = {
  id: string;
  data: string;
  tipo: "trajeto" | "tipico" | "ambiental" | "veicular" | "fauna";
  gravidade: "sem_afastamento" | "com_afastamento" | "grave" | "fatal";
  colaboradorIds: string[];
  projetoId?: string;
  veiculoId?: string;
  local: string;
  /** Formato real do "Alerta de Incidente" MDGEO: local + atividade exercida. */
  atividadeExercida?: string;
  descricao: string;
  causa: string;
  /** Análise de causa raiz — o "motivo" que a doc pede. */
  motivo: string;
  diasAfastamento: number;
  fotos?: number;
  /** Legenda de cada foto do registro — renderizadas via MockFoto. */
  fotoLegendas?: string[];
  /** Comunicação de Acidente de Trabalho emitida? */
  cat: boolean;
  numeroCat?: string;
  /** O "etc" que importa: sem ação corretiva o histórico é só estatística. */
  acoesCorretivas: string[];
};

/**
 * Ocorrência não é acidente. Acidente gera CAT e tem gravidade legal;
 * ocorrência é quase-acidente, desvio ou condição insegura. Decisão do dono
 * do produto: são entidades distintas.
 */
export type Ocorrencia = {
  id: string;
  data: string;
  tipo: "quase_acidente" | "desvio_conduta" | "condicao_insegura" | "elogio";
  colaboradorId: string;
  projetoId?: string;
  local: string;
  descricao: string;
  acaoTomada: string;
  gravidade: StatusSemantico;
  registradoPor: string;
};

export type CategoriaTreinamento = "nr" | "cliente" | "interno" | "cnh";

/** Treinamento agendado — a doc pede "treinamentos marcados com data". */
export type Treinamento = {
  id: string;
  nome: string;
  categoria: CategoriaTreinamento;
  colaboradorIds: string[];
  dataAgendada: string;
  status: "agendado" | "realizado" | "cancelado";
  instrutor: string;
  local: string;
  cargaHoraria: number;
  validadeMeses: number;
  custo: number;
};

export type DespesaCampo = {
  id: string;
  colaboradorId: string;
  tipo: "hospedagem" | "alimentacao" | "cartao" | "locacao" | "extraordinaria";
  descricao: string;
  data: string;
  projeto: string;
  projetoId: string;
  valor: number;
  status: "pendente" | "aprovado" | "prestado" | "recusado";
  /**
   * Quando tipo = "cartao": o que foi comprado. Sem este vínculo a despesa diz
   * quanto saiu, mas não o quê entrou — e é o "o quê" que a doc quer controlar.
   */
  materialId?: string;
  fornecedor?: string;
  notaFiscal?: string;
};

export type CartaoCampo = {
  colaboradorId: string;
  numero: string;
  saldoDisponivel: number;
  limiteDiario: number;
  ultimaMovimentacao: string;
};

export type MedicaoCampo = {
  parametro: string;
  valor: number;
  unidade: string;
};

export type RegistroCampo = {
  id: string;
  campanhaId: string;
  colaboradorId: string;
  pontoColeta: string;
  dataHora: string;
  medicoes: MedicaoCampo[];
  observacoes: string;
  fotos: number;
  gps: { lat: number; lng: number };
  statusSync: StatusSync;
};

/* ------------------------------------------------------------------------ *
 * App de Campo — os 6 fluxos
 *
 * Tudo aqui nasce offline. `statusSync` não é detalhe técnico: é a promessa
 * de que o registro sobreviveu ao aperto do botão sem depender de rede.
 * Ver docs/dna-visual.md §5.
 * ------------------------------------------------------------------------ */

export type StatusSync = "sincronizado" | "pendente" | "offline";

/** 1 — Registro de ponto OFFLINE. */
export type RegistroPonto = {
  id: string;
  colaboradorId: string;
  projetoId?: string;
  campanhaId?: string;
  tipo: "entrada" | "saida" | "inicio_intervalo" | "fim_intervalo";
  dataHora: string;
  gps: { lat: number; lng: number };
  /** Precisão do GPS em metros — em mina, sinal ruim é regra, não exceção. */
  precisaoGps: number;
  statusSync: StatusSync;
  /** Registrado sem rede e sincronizado depois. */
  registradoOffline: boolean;
  observacao?: string;
};

/** 2 — Incidente em campo: batida, picada de animal, acidente de trabalho. */
export type IncidenteCampo = {
  id: string;
  colaboradorId: string;
  projetoId?: string;
  campanhaId?: string;
  veiculoId?: string;
  tipo:
    | "acidente_veicular"
    | "fauna"
    | "acidente_trabalho"
    | "quase_acidente"
    | "condicao_insegura"
    | "ambiental";
  gravidadePercebida: "baixa" | "media" | "alta" | "critica";
  dataHora: string;
  gps: { lat: number; lng: number };
  descricao: string;
  houveVitima: boolean;
  fotos: number;
  statusSync: StatusSync;
  /** Vira Acidente formal quando Segurança valida. */
  acidenteId?: string;
};

/** 3 — Checklist do veículo na saída E na entrada (retorno), com quilometragem. */
export type ItemChecklistSaida = {
  item: string;
  conforme: boolean;
  observacao?: string;
};

export type ChecklistSaidaVeiculo = {
  id: string;
  veiculoId: string;
  motoristaId: string;
  projetoId?: string;
  /** Saída = antes de ir a campo; entrada = na devolução do veículo. */
  tipo: "saida" | "entrada";
  dataHora: string;
  /** A doc pede explicitamente o registro do km antes de sair. */
  kmSaida: number;
  itens: ItemChecklistSaida[];
  nivelCombustivel: "reserva" | "1/4" | "1/2" | "3/4" | "cheio";
  aprovado: boolean;
  fotos: number;
  statusSync: StatusSync;
};

/**
 * Contato do fluxo de comunicação de acidente (PAE — Fluxograma oficial
 * MDGEO). Acidente grave aciona primeiro as unidades de emergência públicas;
 * qualquer acidente segue para Segurança do Trabalho → Gerência ADM →
 * Gerência Operacional.
 */
export type ContatoEmergencia = {
  nome: string;
  papel: string;
  telefone: string;
  /** interno = equipe MDGEO; publico = SAMU/Bombeiros/Polícia/PRF. */
  tipo: "interno" | "publico";
};

/** 4 — Checklist de tarefas a concluir no dia. */
export type TarefaDia = {
  id: string;
  colaboradorId: string;
  campanhaId: string;
  data: string;
  descricao: string;
  pontoColeta?: string;
  concluida: boolean;
  horaConclusao?: string;
  ordem: number;
  obrigatoria: boolean;
  /** Legenda da foto opcional registrada no check da tarefa. */
  fotoConclusao?: string;
  statusSync: StatusSync;
};

/** 5 — Registro da atividade concluída, com foto do serviço. */
export type AtividadeConcluida = {
  id: string;
  tarefaId?: string;
  colaboradorId: string;
  campanhaId: string;
  descricao: string;
  dataHora: string;
  gps: { lat: number; lng: number };
  fotos: number;
  /** A doc pede foto do serviço — sem ela a atividade não fecha. */
  fotoObrigatoria: boolean;
  observacoes: string;
  statusSync: StatusSync;
};

/* ======================================================================== *
 * Financeiro da Empresa — visão corporativa, separada do Financeiro de
 * Campo (que é custo de projeto). Receita/margem por contrato deriva de
 * Projeto (valorContrato, custoAtual, clienteId) e não precisa de tipo
 * novo; o que segue é só o que não existia em lugar nenhum: folha, despesa
 * administrativa, contas a pagar/receber e caixa.
 * ======================================================================== */

export type FolhaPagamento = {
  mes: string;
  salarios: number;
  encargos: number;
  beneficios: number;
  totalColaboradores: number;
};

export type CategoriaDespesaAdmin =
  | "aluguel"
  | "utilidades"
  | "software"
  | "contabilidade"
  | "marketing"
  | "seguros"
  | "outros";

export type DespesaAdministrativa = {
  id: string;
  categoria: CategoriaDespesaAdmin;
  descricao: string;
  fornecedor: string;
  data: string;
  valor: number;
  recorrente: boolean;
};

export type ContaReceber = {
  id: string;
  clienteId: string;
  projetoId?: string;
  descricao: string;
  numeroNF: string;
  valor: number;
  emissao: string;
  vencimento: string;
  status: "aberta" | "recebida" | "atrasada";
  dataRecebimento?: string;
};

export type ContaPagar = {
  id: string;
  fornecedor: string;
  categoria:
    CategoriaDespesaAdmin | "material" | "servico" | "locacao" | "folha";
  descricao: string;
  valor: number;
  vencimento: string;
  status: "aberta" | "paga" | "atrasada";
  dataPagamento?: string;
};

/** Snapshot mensal de caixa — paralelo ao tendenciaMensal de custo de campo. */
export type SaldoCaixaMensal = {
  mes: string;
  saldo: number;
  entradas: number;
  saidas: number;
};

/* ======================================================================== *
 * Admin — controle do sistema (acesso, saúde, segurança). Não confundir com
 * Segurança do Trabalho (SST): aqui é segurança da informação/infra.
 * ======================================================================== */

export type LogAcesso = {
  id: string;
  colaboradorId: string;
  dataHora: string;
  ip: string;
  local: string;
  dispositivo: string;
  acao: string;
  sucesso: boolean;
};

export type ServicoSistema = {
  id: string;
  nome: string;
  status: "operacional" | "degradado" | "indisponivel";
  uptimePct: number;
  ultimaVerificacao: string;
  descricao: string;
};

export type SessaoAtiva = {
  id: string;
  colaboradorId: string;
  dispositivo: string;
  local: string;
  iniciadoEm: string;
  ultimoAcesso: string;
  atual: boolean;
};

/* ======================================================================== *
 * SSMA — Saúde, Segurança e Meio Ambiente. Modelado a partir dos documentos
 * reais da MDGEO (RG.xx-PSSO.xx): checklists de campo compartilham um único
 * template (Local/Data/CC → Responsável → Participantes → itens Atende/Não
 * Atende/Não Aplicável → Boas Práticas → verificação de eficácia anterior),
 * por isso é UM tipo com `tipo` discriminando o formulário, não seis tipos
 * redundantes.
 * ======================================================================== */

export type TipoChecklistCampo =
  | "preposto"
  | "3rs_5s"
  | "ferramentas_pre_uso"
  | "kit_primeiros_socorros"
  | "kit_emergencia";

export type StatusItemChecklist = "atende" | "nao_atende" | "nao_aplicavel";

export type ItemChecklistCampo = {
  item: string;
  status: StatusItemChecklist;
  observacao?: string;
  prazo?: string;
  responsavel?: string;
};

export type PapelInspecionador =
  "preposto" | "responsavel_ma" | "equipe_ssma" | "gestor_fiscal";

export type ChecklistCampo = {
  id: string;
  tipo: TipoChecklistCampo;
  revisao: string;
  projetoId?: string;
  veiculoId?: string;
  local: string;
  data: string;
  horario: string;
  centroCusto: string;
  responsavelInspecao: string;
  tipoInspecao: "programada" | "nao_programada";
  papelInspecionador: PapelInspecionador;
  /** Só se aplica a "ferramentas_pre_uso" — referencia o cronograma de cores. */
  corMes?: CorMesFerramenta;
  participantes: { nome: string; matricula: string }[];
  itens: ItemChecklistCampo[];
  boasPraticas?: { item: string; descricao: string }[];
  /** Kits (primeiros socorros / emergência) fecham com Aprovado/Reprovado. */
  aprovado?: boolean;
  eficaciaInspecaoAnterior: boolean | null;
  desviosCorrigidos: boolean | null;
  observacoesGerais?: string;
};

/** Cronograma anual de cores (RG.02-PSSO.02) — rotação trimestral fixa. */
export type CorMesFerramenta = "verde" | "amarelo" | "azul" | "vermelho";

export type RegraOuro = {
  numero: number;
  texto: string;
};

/** Termo de ciência assinado — Regras de Ouro R04, 10/07/2024. */
export type AceiteRegrasOuro = {
  colaboradorId: string;
  versao: string;
  dataAceite: string;
};

export type EstadoEmocional = "otimo" | "bom" | "ruim";

/** DSSMA diário — "Emociograma": bem-estar antes de ir a campo. */
export type RegistroDSSMA = {
  id: string;
  projetoId: string;
  area: "adm" | "operacional";
  data: string;
  horario: string;
  participantes: { colaboradorId: string; estado: EstadoEmocional }[];
  comentarios?: string;
};

/* ======================================================================== *
 * Comercial — contrato como entidade própria (aditivos, impeditivos,
 * checklist e briefing), separada de Projeto para não inflar o tipo usado
 * em todo o Técnico/Financeiro com campos que só interessam ao comercial.
 * ======================================================================== */

export type ItemChecklistContrato = {
  item: string;
  concluido: boolean;
};

export type AditivoContrato = {
  id: string;
  projetoId: string;
  descricao: string;
  valorAdicional: number;
  data: string;
  status: "proposto" | "aprovado" | "recusado";
};

export type Contrato = {
  projetoId: string;
  objeto: string;
  briefing: string;
  prazoExecucao: string;
  condicoesPagamento: string;
  impeditivos: string[];
  checklist: ItemChecklistContrato[];
};

/* ======================================================================== *
 * Técnico — roadmap visual do projeto ("caminhos a percorrer até a
 * conclusão") e visibilidade por papel (gerente vê tudo, coordenador só o
 * que lhe foi atribuído).
 * ======================================================================== */

export type PapelVisualizacao = "gerente" | "coordenador";

export type StatusEtapaRoadmap =
  "pendente" | "em_andamento" | "concluida" | "atrasada";

export type EtapaRoadmap = {
  id: string;
  projetoId: string;
  nome: string;
  responsavelId: string;
  dataInicio: string;
  dataLimite: string;
  status: StatusEtapaRoadmap;
  ordem: number;
  descricao?: string;
};

/* ======================================================================== *
 * Custos por setor — Financeiro: cards de gasto vs. budget mensal, base do
 * drill-down "quanto cada setor está gastando até agora".
 * ======================================================================== */

export type SetorCusto =
  "campo" | "combustivel" | "veiculos" | "pessoal" | "administrativo";

export type BudgetMensalSetor = {
  setor: SetorCusto;
  mes: string;
  budget: number;
};

/* ======================================================================== *
 * Resumo financeiro por setor operacional — alimenta os cards por setor do
 * Financeiro (com filtro de período) e a linha expansível de custo por setor
 * da Home. A ordem de exibição é decisão do dono do produto:
 * Pessoal (Folha)/RH → Logística → Mobilização → GSE (Compras) → Equipamentos.
 * ======================================================================== */

export type SetorFinanceiroId =
  "pessoal" | "logistica" | "mobilizacao" | "gse" | "equipamentos";

export type LancamentoSetor = {
  descricao: string;
  valor: number;
  data: string;
};

export type SetorFinanceiro = {
  id: SetorFinanceiroId;
  nome: string;
  /** Descrição do que compõe o gasto do setor — aparece no card. */
  descricao: string;
  /** Posição fixa de exibição (1 = primeiro). */
  ordem: number;
  /** Série mensal jan–jul/2026: gasto realizado vs. orçamento do mês. */
  mensal: { mes: string; gasto: number; orcamento: number }[];
  /** Os 3 maiores gastos do setor no período corrente — drill-down enxuto. */
  topGastos: LancamentoSetor[];
};

/* ======================================================================== *
 * Hidroquímica — resultados de laboratório contra a Resolução CONAMA
 * 396/2008 (classificação de águas subterrâneas). Não duplica as medições
 * de campo de RegistroCampo (pH, condutividade, turbidez, OD — lidas na
 * hora, em campo); aqui é o boletim que volta do laboratório acreditado
 * ISO 17025 depois da amostra coletada, com os parâmetros que só o
 * laboratório mede (metais, ânions).
 * ======================================================================== */

export type ParametroHidroquimico =
  | "ferro_dissolvido"
  | "manganes_dissolvido"
  | "nitrato"
  | "sulfato"
  | "cloreto"
  | "solidos_dissolvidos_totais";

export type ResultadoLaboratorial = {
  id: string;
  campanhaId: string;
  projetoId: string;
  pontoColeta: string;
  dataColeta: string;
  dataResultado: string;
  laboratorio: string;
  /** Classe do aquífero pela CONAMA 396/2008 — define o VMP aplicável. */
  classeAquifero: "Especial" | "1" | "2" | "3";
  parametro: ParametroHidroquimico;
  valor: number;
  unidade: string;
  /** Valor Máximo Permitido (CONAMA 396/2008, Anexo — classe 1/2). */
  vmp: number;
};

/* ======================================================================== *
 * TEA (Tecnologia e Automação) — telemetria remota, levantamentos aéreos
 * (drone/VANT), geofísica e geoprocessamento. Espelha os serviços reais da
 * MDGEO (hidrogeologia, hidroquímica, geofísica e levantamentos aéreos,
 * geoprocessamento — ver mdgeo.com.br), não uma automação genérica.
 * ======================================================================== */

export type TipoEstacaoTelemetria = "nivel_dagua" | "vazao" | "multiparametro";
export type StatusConexaoTelemetria = "online" | "offline" | "instavel";

export type EstacaoTelemetria = {
  id: string;
  nome: string;
  projetoId: string;
  pontoColeta: string;
  tipo: TipoEstacaoTelemetria;
  statusConexao: StatusConexaoTelemetria;
  ultimaTransmissao: string;
  bateriaPct: number;
};

export type TipoLevantamento = "drone" | "vant" | "geofisica";
export type StatusLevantamento =
  "planejado" | "em_execucao" | "processando_dados" | "concluido";

export type LevantamentoAereo = {
  id: string;
  projetoId: string;
  tipo: TipoLevantamento;
  data: string;
  responsavelId: string;
  areaHectares: number;
  status: StatusLevantamento;
  entregavel?: string;
};

