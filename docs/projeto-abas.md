# Projeto das abas — MDGEO Nexus

Desenho de informação das 7 abas, derivado da documentação do dono do produto.
Complementa `dna-visual.md`, que decide *como* as coisas parecem; este decide
*o que* existe e *onde* mora.

## O princípio que organiza tudo

**As abas são vistas sobre entidades compartilhadas, não silos.**

Ao cruzar a documentação com o modelo atual, o padrão que salta é que quase todo
item pedido aparece em **duas ou três abas ao mesmo tempo**:

| O que a doc pede | Aparece em |
|---|---|
| Item fabricado em terceiros | Financeiro (custo) · Compras (status) · Projetos (entrada de material) |
| Acidente | Segurança (histórico) · Colaboradores (ficha) · Veículos (incidente) · Projetos |
| Locação de veículo | Veículos (contrato) · Financeiro (custo) |
| ASO / curso / crachá | Colaboradores (ficha) · Segurança (vencimentos) · Projetos (conformidade da equipe) |
| Equipamento alocado | Equipamentos (próximo projeto) · Projetos (solicitado/DISPONIBILIZADO) |
| Compra em campo no cartão | Financeiro (custo não-cotado) · Compras (pulou etapa) |

Se cada aba tiver seu próprio dado, o mesmo acidente vira três registros que
divergem. **Cada fato mora em UM lugar; as abas o consultam com lentes
diferentes.** É isso que faz "ASO vencido → colaborador bloqueado → campanha
bloqueada" funcionar de verdade em vez de ser um texto na tela.

## O que falta no modelo

Levantamento contra `src/lib/types.ts` atual. `~` = existe parcialmente.

| Aba | Pedido | Hoje |
|---|---|---|
| **Financeiro** | Hotel, alimentação | ✅ `DespesaCampo.tipo` |
| | Compra em campo no cartão | ~ `tipo:"cartao"` sem vínculo com o que foi comprado |
| | Materiais (construção, tubos/canos) | ❌ |
| | Fabricação em terceiros: solicitação, previsão, status | ❌ |
| | Custo de locação de veículo | ❌ |
| **Segurança** | Estoque de EPI | ❌ (`EpiItem` é entrega por pessoa, não estoque) |
| | ASO vencido / a vencer | ~ cabe em `DocumentoColaborador`, sem consumidor |
| | Certificados por categoria e colaborador | ~ sem categoria |
| | Treinamentos marcados com data | ~ tem validade, não tem agendamento |
| | Histórico de acidente (causa, motivo, período, projeto) | ❌ é só `acidentes: number` |
| **Compras** | Status por item | ✅ `SolicitacaoCompra.status` |
| | Avaliação de itens anteriores | ❌ |
| **Equipamentos** | Inventário, calibração, certificado | ✅ |
| | Último projeto e responsável | ~ dá para inferir do `historico` |
| | Próximo projeto + previsão de retorno | ❌ |
| | Saúde % com degradação automática | ❌ |
| | Qtd. de projetos utilizados | ❌ |
| **Veículos** | Ano, km, abastecimento | ✅ |
| | Projeto atual | ~ tem `cliente`, não tem projeto |
| | Câmera, telemetria, proteção instalada | ❌ |
| | Locação: custo, empresa | ❌ |
| | Multas + status de pagamento | ❌ |
| | Incidentes | ❌ |
| | Frequência de lavagem | ❌ |
| | Qtd. de projetos utilizados | ❌ |
| | Km antes do projeto | ❌ |
| **Colaboradores** | Admissão, cargo, treinamentos, EPI | ✅ |
| | CNH | ❌ (cabe como documento, com categoria) |
| | Crachá de mineradora com vencimento | ❌ |
| | Ocorrências | ❌ |
| | Acidentes detalhados | ❌ |
| **Projetos** | Status, prazo, equipe, orçamento | ✅ |
| | Valor do contrato | ~ `contrato` é string; `orcamento` é interno |
| | Conformidade da equipe | ~ derivável, sem consumidor |
| | Equipamento solicitado → DISPONIBILIZADO | ❌ |
| | Custo de projetos anteriores | ❌ |
| | Entrada e saída de materiais | ❌ |
| | Detalhes de entrega | ❌ |

## Entidades novas

Nomeadas pelo fato que representam, não pela aba que as mostra.

```ts
// ---- Materiais e fabricação -------------------------------------------

type Material = {
  id: string;
  projetoId: string;
  categoria: "construcao" | "tubulacao" | "consumivel" | "epi" | "outro";
  descricao: string;              // "Tubo PVC 150mm"
  unidade: string;                // "m", "un", "kg"
  quantidadePrevista: number;
  origem: "estoque" | "compra" | "fabricacao" | "campo";
  // `campo` = comprado no cartão, sem cotação. É o que a doc quer vigiar.
};

// Item que se manda fabricar fora. A doc pede as 3 datas explicitamente.
type Fabricacao = {
  id: string;
  materialId: string;
  fornecedor: string;
  dataSolicitacao: string;
  previsaoEntrega: string;
  dataEntregaReal?: string;
  status: "solicitado" | "em_producao" | "pronto" | "entregue" | "atrasado";
  // `atrasado` NÃO é armazenado — é derivado de previsaoEntrega vs hoje via
  // prazoBucket(). Armazenar geraria divergência com a T-scale.
};

// Entrada e saída de material do projeto (pedido explícito da aba Projetos).
type MovimentacaoMaterial = {
  id: string;
  materialId: string;
  tipo: "entrada" | "saida";
  data: string;
  quantidade: number;
  responsavelId: string;
  observacao?: string;
};

// ---- Segurança ---------------------------------------------------------

type EstoqueEpi = {
  id: string;
  item: string;                   // "Luva de vaqueta"
  ca: string;                     // Certificado de Aprovação (obrigatório por lei)
  tamanho?: string;
  quantidade: number;
  minimo: number;                 // dispara `atencao` quando quantidade <= minimo
  validadeLote: string;
};

// Um acidente é UM registro. Segurança vê o histórico, Colaboradores vê na
// ficha, Veículos vê como incidente, Projetos vê o impacto. Mesma linha.
type Acidente = {
  id: string;
  data: string;
  tipo: "trajeto" | "tipico" | "ambiental" | "veicular" | "fauna";
  gravidade: "sem_afastamento" | "com_afastamento" | "grave" | "fatal";
  colaboradorIds: string[];
  projetoId?: string;
  veiculoId?: string;             // preenchido quando tipo = veicular
  causa: string;
  motivo: string;                 // análise (5 porquês / causa raiz)
  diasAfastamento: number;
  cat: boolean;                   // Comunicação de Acidente de Trabalho emitida?
  acoesCorretivas: string[];
};

// Ocorrência ≠ acidente: quase-acidente, desvio, condição insegura.
// A doc pede as duas coisas na ficha do colaborador.
type Ocorrencia = {
  id: string;
  data: string;
  tipo: "quase_acidente" | "desvio_conduta" | "condicao_insegura" | "elogio";
  colaboradorId: string;
  projetoId?: string;
  descricao: string;
  gravidade: StatusSemantico;
};

type Treinamento = {
  id: string;
  nome: string;                   // "NR-35 Trabalho em Altura"
  categoria: "nr" | "cliente" | "interno" | "cnh";
  colaboradorIds: string[];
  dataAgendada: string;
  status: "agendado" | "realizado" | "cancelado";
  instrutor: string;
  cargaHoraria: number;
  validadeMeses: number;
};

// ---- Veículos ----------------------------------------------------------

type Locacao = {
  veiculoId: string;
  empresa: string;
  contrato: string;
  custoMensal: number;
  inicio: string;
  fim: string;
  franquiaKm: number;
};

type Multa = {
  id: string;
  veiculoId: string;
  data: string;
  local: string;
  infracao: string;
  gravidade: "leve" | "media" | "grave" | "gravissima";
  pontos: number;
  valor: number;
  condutorId?: string;            // quem dirigia — cruza com o histórico
  status: "aberta" | "paga" | "recurso" | "indicada";
  vencimento: string;
};

type IncidenteVeiculo = {
  id: string;
  veiculoId: string;
  data: string;
  tipo: "colisao" | "avaria" | "pane" | "furto" | "fauna";
  condutorId: string;
  projetoId?: string;
  descricao: string;
  custoReparo: number;
  acidenteId?: string;            // vira Acidente se houve lesão
};

type Lavagem = { veiculoId: string; data: string; tipo: "simples" | "completa"; custo: number };

// ---- Alocação (o elo Equipamento <-> Projeto) --------------------------

// É o que sustenta "solicitado -> DISPONIBILIZADO na data" e
// "próximo projeto com previsão de retorno". Uma entidade, duas abas.
type AlocacaoEquipamento = {
  id: string;
  equipamentoId: string;
  projetoId: string;
  solicitadoPor: string;
  dataSolicitacao: string;
  dataNecessaria: string;
  dataPrevistaRetorno: string;
  dataRetornoReal?: string;
  status: "solicitado" | "aprovado" | "disponibilizado" | "em_campo" | "devolvido";
  dataDisponibilizado?: string;   // compara com dataNecessaria => cumpriu ou não
};
```

### Campos a acrescentar em entidades existentes

```ts
Equipamento += {
  saude: number;                  // 0-100
  saudeAjustadaManualmente: boolean;
  projetosUtilizados: number;
}

Veiculo += {
  projetoAtualId?: string;
  protecoes: ("camera" | "telemetria" | "gaiola" | "engate" | "kit_primeiros_socorros"
             | "extintor" | "farol_led" | "antena")[];
  projetosUtilizados: number;
  kmAntesProjeto?: number;
  locacao?: Locacao;
}

Colaborador += {
  cnh?: { numero: string; categoria: string; validade: string; };
  crachas: { cliente: string; numero: string; emissao: string; validade: string }[];
}

Projeto += {
  servico: string;
  valorContrato: number;          // o que o cliente paga (≠ orcamento interno)
  detalhesEntrega: string;
}

SolicitacaoCompra += {
  avaliacao?: { nota: 1|2|3|4|5; prazoCumprido: boolean; comentario: string };
}
```

### Saúde do equipamento

A doc pede: degrada **-1% ao voltar de campo**, ajustável manualmente para mais
ou menos.

Regra: `saude` é **estado persistido**, não derivado — porque o ajuste manual
tem que sobreviver. A degradação acontece na transição
`AlocacaoEquipamento.status → "devolvido"`, uma vez por retorno, nunca no render.

Faixas: `> 85` ok · `70–85` atenção · `< 70` crítico. Mesmo eixo de risco do
resto do sistema (DNA §4), com ícone e texto — nunca a cor sozinha.

Num mockup a degradação não roda de verdade; `saude` já vem coerente com
`projetosUtilizados` no mock data, e a tela mostra a **mecânica** (o -1% no
histórico, o botão de ajuste). É a mecânica que se vende, não o cron.

## As abas

### Financeiro de Campo

A doc é explícita na intenção: *"garantir que tudo que a equipe precisa para
operar já está pronto"* e *"controle de tudo que é preciso ANTES do projeto
iniciar"*. Então a tela **não** é um relatório de gastos — é um **painel de
prontidão**, e o custo é consequência.

**Nível 1 — cards de projeto.** Projetos em andamento e agendados. Cada card:
cliente, data de início (com `prazoBucket()` — "Inicia em 6 dias" acende), custo
previsto vs. orçado, e **um selo de prontidão**: quantos itens ainda não estão
prontos. O card não é um resumo financeiro; é a resposta a "dá para mobilizar?".

**Nível 2 — ao clicar.** Custos por categoria, nas categorias que a doc nomeia:

- **Hotel** e **Alimentação** → `DespesaCampo`
- **Materiais** → `Material`, agrupado por categoria, com origem visível
- **Fabricação em terceiros** → destaque próprio, com as 3 datas
  (solicitação → previsão → status). É o item de maior risco de bloqueio, porque
  não depende de nós.
- **Locação de veículo** → `Locacao.custoMensal` rateado pelo período
- **Comprado em campo no cartão** → seção própria (ver abaixo)

**A seção do cartão sinaliza, mas não estima.** A doc diz que comprar em campo
*"pode elevar os custos do projeto por pular etapas"*. Então ela não pode parecer
só mais uma linha de custo — mas também **não inventa um sobrepreço**.

A tentação era mostrar "R$ 4.120 acima do que teria custado cotado". Foi
**descartado por decisão do dono do produto**: essa régua não existe de forma
confiável, e um número estimado apresentado como fato é exatamente o tipo de
coisa que desmonta a credibilidade quando alguém pergunta de onde saiu.

O que a seção mostra: **o que** foi comprado, **quanto** custou, **quem** comprou,
**quando**, e o fato de ter **pulado a cotação**. O peso vem da contagem e do
valor absoluto — *"7 compras sem cotação prévia · R$ 12.480"* — não de uma
comparação fabricada. O sinal é o comportamento, não o suposto prejuízo.

### Segurança do Trabalho

Cinco blocos, na ordem em que machucam:

1. **ASO vencido / a vencer** — topo, porque bloqueia pessoa. `prazoBucket()`.
   Cada linha leva à ficha e mostra **o que está travado por causa dela**.
2. **Treinamentos agendados** — `Treinamento.status: "agendado"` com data.
   Cruzado com quem está vencendo: "3 dos 5 com NR-35 a vencer já têm turma".
3. **Estoque de EPI** — quantidade vs. mínimo, CA e validade do lote.
4. **Certificados** — por categoria (NR / cliente / interno / CNH) e por
   colaborador. As duas visões da doc, uma alternância só.
5. **Histórico de acidentes** — por período e por projeto, com causa, motivo,
   gravidade, dias de afastamento e CAT. A doc pede "causa, motivo e etc"; o
   "etc" que importa é **ação corretiva**, senão é só estatística.

### Compras

Aba rasa por decisão (DNA §9 — procurement é genérico, ninguém compra o sistema
por isso). Tabela de solicitações com status, e a avaliação dos itens anteriores
(nota, prazo cumprido, comentário) alimentando a escolha do fornecedor.

**Sobre a API do sistema atual:** a doc diz "podemos verificar disponibilidade".
Isso é descoberta, não construção. No mockup entra como uma linha de estado —
`"Sincronizado com o ERP há 2h"` — que vende a integração sem fingir uma tela de
OAuth.

### Equipamentos

Inventário completo. Colunas: patrimônio, nome, situação, responsável, última
calibração, **certificado**, validade (via `prazoBucket()`), **saúde %**,
**projetos utilizados**, **próximo projeto + previsão de retorno**.

Ao abrir: histórico com os eventos de degradação visíveis ("-1% · retorno da
Campanha Brucutu Jul/26"), ajuste manual, e a linha do tempo de alocações.

### Veículos

Card por veículo com o que a doc pede, agrupado por quem pergunta:

- **Onde está** — projeto atual, motorista, equipe, cliente, km atual e km antes
  do projeto (o delta é o que interessa)
- **O que tem instalado** — câmera, telemetria, gaiola, extintor. Chips.
- **Quanto custa** — locação (empresa, custo mensal), combustível, manutenção
- **O que deu errado** — incidentes e multas com status de pagamento
- **Rotina** — frequência de lavagem, projetos utilizados, ano

Multas com `prazoBucket()` no vencimento. A API do governo entra como estado de
sincronização, igual a Compras.

### Colaboradores

Ficha completa. Além do que já existe: CNH com categoria e validade, crachás de
acesso por cliente **com vencimento** (a doc é explícita: "Crachá tem
vencimento"), ocorrências e acidentes ligados aos registros reais — não a um
contador.

Toda data de validade — ASO, curso, CNH, crachá — passa por `prazoBucket()`. É o
que faz "vencendo" significar a mesma coisa nas 7 abas.

### Projetos

O hub. A doc pede controle total, e o que amarra é **conformidade**:

- Serviço, detalhes de entrega, prazo, valor do contrato vs. custo aproximado
- **Custo de projetos anteriores** do mesmo cliente/serviço — a régua que diz se
  o custo atual está fora da curva
- **Conformidade da equipe** — derivada dos colaboradores alocados. Não é um
  campo; é uma pergunta respondida em tempo real: "a equipe pode entrar na
  mina?"
- **Equipamentos solicitados** com o ciclo `solicitado → aprovado →
  DISPONIBILIZADO`, comparando `dataDisponibilizado` com `dataNecessaria`
- **Entrada e saída de materiais** — `MovimentacaoMaterial`

## A cadeia causal

O que faz o produto ser um produto, e não sete tabelas:

```
ASO vencido (Colaborador.documentos)
  └─> colaborador bloqueado (Colaborador.status)
       └─> equipe incompleta (Projeto.equipeIds)
            └─> campanha bloqueada (Campanha.bloqueios)

Fabricação atrasada (Fabricacao.previsaoEntrega < hoje)
  └─> material indisponível (Material.origem = "fabricacao")
       └─> projeto não pode mobilizar

Equipamento não DISPONIBILIZADO na data (AlocacaoEquipamento)
  └─> campanha sem instrumento
       └─> campanha bloqueada
```

**Tem que ser percorrível nos dois sentidos.** Do badge crítico até a causa, e
da causa até o impacto. É o que separa "mostramos dados" de "entendemos sua
operação".

## Decidido pelo dono do produto

1. **Sobrepreço do cartão: não estimar.** A seção sinaliza o comportamento
   (comprou sem cotação, quanto, quem) e não compara com um custo cotado
   hipotético. Sem régua confiável, sem número inventado.
2. **Frota é mista** — locados e próprios convivem. Logo `Veiculo.locacao` é
   **opcional**: quando existe, o card mostra empresa, contrato e custo mensal;
   quando não, o custo do veículo é combustível + manutenção. O Financeiro só
   rateia locação nos que têm.
3. **Ocorrência ≠ acidente.** Duas entidades. Acidente gera CAT e tem gravidade
   legal; ocorrência é quase-acidente, desvio ou condição insegura. Ambas
   aparecem na ficha do colaborador; só acidente entra na estatística de
   Segurança.

## Em aberto

1. **API do ERP** (Compras) e **API do governo** (multas). Existem? Quais? É
   descoberta, não build — no mockup, ambas entram como linha de estado de
   sincronização, nunca como tela de integração fingida.
