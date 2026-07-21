# Lógica ensinada — Requisitos do mockup MDGEO Nexus

Fonte da verdade da auditoria `/ops-audit-finish`. Cada tópico e subtópico abaixo
foi ensinado pelo dono do produto e **não pode ser perdido**. Critério de aceite
global: **score gate de 100** — se qualquer item abaixo não estiver aplicado
corretamente, sem sistema quebrado e com 0 erros, a auditoria falha e manda refazer.

## Critério de aceite (gate global)

- **Score gate = 100.** Tudo o que foi solicitado, cada detalhe, cada tópico e
  subtópico, aplicado corretamente, sem erros e sem sistema quebrado. Abaixo de
  100 → refazer. Segurança > performance > estética.

## Home — princípios gerais

- **Todo dado mostrado na Home é clicável e leva ao dado completo na aba do setor.**
  O card da Home é uma porta de entrada; o clique navega para a aba onde o dado vive.
- **Remover o "Aviso da empresa"** (card e entidade) de toda a Home.

## Home → Comercial

- Trocar o card **"Projetos por fase" por "Projetos"**.
- **"Impeditivo comercial" não fez sentido.** Trocar por cards dos projetos com:
  status, prazos, projetos com pontos de atenção, projetos perto do encerramento
  de contrato, valores e renegociação. São as informações que mais importam para
  o comercial. Comercial só vende projetos — veículos, NR's e ASO's NÃO importam
  para o comercial.
- **Impeditivos do contrato** passam a conter o que afeta o contrato: acidentes,
  prazos, pendências de negociação, situação do contrato.
- Trocar **"Maiores clientes" por "Quantidade de projetos por cliente + valor
  total"**, clicável, levando aos projetos daquele cliente.

## Home → SSMA

- **Dividir o gráfico principal em 2:** um mostra o **DDSMA (emoção / emociograma)**
  e o outro a **quantidade de acidentes no mês**.
- **Remover o card "Regras de Ouro"** da Home — não faz sentido estar ali.

## Home → Administrativo

- **Mover a aba Administrativo para ser a primeira** a aparecer, e exibir um
  **gráfico mais volátil** como primeiro card.
- **Custo por setor na ordem fixa:** Pessoal (Folha) / RH → Logística →
  Mobilização → GSE (Compras) → Equipamentos. Valores fictícios, mantendo a ordem.
- Clicar na linha do setor **expande sublinhas** com os gastos daquele setor —
  um **top 3** para não mostrar demais.

## Aba Financeiro

- **Colaboradores aptos e com pendência não são relevantes** nessa tela — remover.
- Trocar o **gráfico de evolução mensal por cards lado a lado**, um card por setor,
  mostrando: nome do setor + descrição dos gastos do setor. Headline com nome do
  setor + **filtro de período**, exibindo dados financeiros. Referência visual:
  o dashboard financeiro do Screenshot_11 (cards de Receitas/Despesas/Resultado/Margem
  com filtros de período).

## Aba RH (Colaboradores)

- **Remover VIAGEM** em Administrativo → Colaboradores.
- **Mostrar as documentações do colaborador.**

## Aba Equipamentos

- Mostrar **responsável atual + setor**.
- Mostrar **foto do equipamento na retirada e na devolução**, exibida ao expandir
  as informações do equipamento na aba.

## Aba TI

- **Excluir a aba TI** por completo.

## Aba SSO

- Grid de certificados: **clicar no card** e exibir informação detalhada.
- Grid de certificados: por colaborador, usar **campo de pesquisa** em vez de
  colaboradores lado a lado.
- Grid de histórico de acidentes: ter a **foto de registro do acidente**.

## Aba Mobilização

- Mudar o card **"Mineradoras atendidas" para "Colaboradores com impedimentos"** —
  mostrar colaboradores com impedimentos que prejudicam a mobilização para campo.
- **Colaboradores aptos** mostrado como fração: aptos de quantidade total.

## Aba Logística (Mobilização de veículos)

- Ao clicar no veículo, **popular combustível com 2 abastecimentos**: onde foi,
  qual valor, quantos litros.
- Com base no veículo **QQR-6F78**, ao abrir deve mostrar o último projeto que usou
  o veículo (ou o projeto atual), populado com dados reais: motorista atual/último,
  **KM atual** e **KM antes de iniciar o projeto**.
- Em "Equipamentos de proteção instalados", **pintar de verde/vermelho** o que tem
  e o que falta.

## Aba Recepção

- **Remover a aba Recepção** por completo.

## Aba Técnico → Projetos

- Projetos devem aparecer no **mesmo design de cards da aba Comercial** do
  Administrativo (replicar o design), com **visualização padrão em "em andamento"** —
  ao abrir a aba de projetos, os em andamento aparecem primeiro.
- Trocar o card **"Suspensos" por "Projeto com pendência"** (algo impedindo o
  projeto de seguir).
- Ter uma **tela dedicada ao projeto** ao abrir um projeto (ex.: `/projetos/11823`),
  detalhando tudo start-to-end, overview geral. A aba Projetos vira um **"mini SaaS"**
  de gerenciamento completo, acompanhado por gestores e diretoria.
- **Somente diretoria vê valores $$$.** Criar **visão separada diretor/gestor** para
  demonstrar como ficaria (gestor não vê R$).

## GSE (Compras)

- Mover a **aba Fornecedores para dentro de GSE (Compras)**.

## Bônus — App de Campo

- Criar uma **aba Bônus**; como bônus, entregar o App de Campo.

### App de Campo — detalhes

- **Registro de ponto:** somente um botão "Registrar ponto" e, ao lado, o
  **histórico de ponto do dia atual**.
- **Registro de incidentes:** ao clicar, **mostrar que clicou** (feedback de seleção).
- **Registro de incidentes — contatos de emergência:** incluir Willy, Polícia, SAMU,
  seguindo o **Fluxograma de Comunicação de Acidente da MDGEO (PAE)**.
- **Checklist do veículo:** incluir o **checklist completo**, distinguindo
  **entrada/saída**, em formato **check/uncheck**.
- **Tarefas do dia:** podem ser **cadastradas pelo coordenador**, também check/uncheck.
  No check, **registrar foto (opcional)**.

## Fluxo PAE — Comunicação de Acidente da MDGEO

Fonte dos contatos de emergência do App de Campo. Acidente **GRAVE** aciona
primeiro as unidades de emergência públicas; qualquer acidente segue o fluxo
**Segurança do Trabalho → Gerência ADM → Gerência Operacional**.

- **Unidades de emergência (público):** SAMU 192 · Bombeiros 193 ·
  Polícia Militar 190 · PRF 191.
- **Segurança do Trabalho (interno):** Corp. SSMA (31) 97164-3445 ·
  Lucas (31) 99699-3467 · Jéssica (31) 99573-7536 · Rafaela (31) 97522-4029 ·
  Wanderson (31) 99223-0686 · Ithalo (31) 97100-3998.
- **Gerência ADM:** Willie (31) 98848-2241.
- **Gerência Operacional:** Maurício (31) 99419-3228.
