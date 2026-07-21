# DNA Visual — MDGEO Nexus

Fonte de verdade de design. Decidido na Fase 1 por `AGT-DESIGN-DIRECTOR`, com paleta
verificada mecanicamente. Toda decisão visual do produto se resolve aqui — se uma tela
precisa de algo que este documento não cobre, o documento está incompleto e deve ser
atualizado, não contornado.

## Contexto

Produto: sistema de gestão operacional para prestadora de serviços de campo
(hidrogeologia, hidrologia, hidroquímica) que opera em mineradoras.

**Posicionamento: mockup de demo/pitch.** O objetivo primário é demonstrar a ideia
para stakeholder, não operar de verdade ainda. Isso é o vetor que mais dirige as
decisões abaixo — em especial §9 (profundidade) e §7 (motion).

Duas superfícies, um sistema:
- **App de campo (mobile)** — técnico em campo: sol forte, luvas, EPI, conectividade ruim.
- **Dashboard admin (desktop)** — denso em dados: inventário, custos, compliance, vencimentos.

## 1. Estilo

**"Instrumento de Campo"** — grid suíço denso, semântica de sinalização industrial,
flat e border-first. Três camadas, em ordem de prioridade:

1. **Gramática base:** dashboard data-dense — grid 12 col, gaps 8–12px, linhas 36px.
2. **Camada de restrição (sobrepõe a base):** acessibilidade — piso 4.5:1, alvos grandes,
   nunca cor sozinha, reduced-motion.
3. **Camada semântica:** shape coding de placa de trânsito. O público **já está treinado**
   nisso — octógono significa "pare" para um técnico de EPI antes de qualquer cor.

**Rejeitados, para não relitigar:** dark mode como padrão no campo (superfície escura no
sol tem contraste ambiente péssimo), glassmorphism/neumorphism (blur é o oposto da
restrição), alertas com pulse/glow (40 certificados piscando é ruído), Material You
(idioma errado, briga com shadcn).

## 2. Frase-guia

> **"O sistema mede risco e prazo como um instrumento mede vazão: com precisão, sem
> drama, e legível no pior contexto possível."**

Teste toda decisão contra ela. Drama falha. Decoração falha. "Fica premium" falha.
Legível-sob-sol-de-luva ganha.

## 3. Referências

| Âncora | O que tirar | O que **não** tirar |
|---|---|---|
| **Linear** | Densidade sem ruído; borda no lugar de sombra; status como cidadão de primeira classe. | Dark-first. Cultura keyboard-only. |
| **Stripe Dashboard** | Gramática de tabela; numeral mono tabular; cor semântica calma; "estado de um objeto ao longo do tempo". | Gradiente de marca; densidade de marketing. |
| **SafetyCulture (iAuditor)** | Offline-first visível; alvo de luva; fluxo de checklist; contraste outdoor. | Estética genérica de app corporativo. |

## 4. Cor — dois eixos, não um

**Eixo A — Risco** (ordenado, saturado, shape-coded): `neutro → ok → atenção → crítico`
**Eixo B — Ciclo de vida** (categórico, mudo, sempre outline): `planejado / ativo / concluído / suspenso`

> **Lei do preenchimento:** *fill é recurso escasso.* Só `crítico` e o **único** CTA
> primário da tela podem ser sólidos. `atenção`/`ok` são tint 12% com texto da cor.
> Ciclo de vida é **sempre** outline, nunca preenchido.

Consequência: em qualquer aba densa, as manchas sólidas vermelhas são a única coisa
sólida na tela. "O que está pegando fogo" vira pré-atentivo, sem piscar nada.

### Paleta verificada

Todos os valores conferidos mecanicamente contra `#FFFFFF` (card) e `#F5F7FC` (fundo
da página), incluindo texto sobre o próprio tint 12%. **Pior caso de cada cor ≥ 5.0:1**,
com folga sobre o piso AA de 4.5:1.

| Papel | Hex | s/ branco | s/ #F5F7FC | pior (tint 12%) | Ícone fixo | Render |
|---|---|---|---|---|---|---|
| `crítico` | `#B42318` | 6.57 | 6.13 | 5.05 | `OctagonAlert` | **sólido**, texto branco |
| `atenção` | `#9C3D07` | 6.81 | 6.35 | 5.30 | `TriangleAlert` | tint 12%, texto da cor |
| `ok` | `#3E6A2F` | 6.35 | 5.92 | 5.01 | `CheckCircle2` | tint 12%, texto da cor |
| `neutro` | `#475467` | 7.69 | 7.17 | 5.98 | `MinusCircle` | outline |
| `ativo` | `#0C6178` | 7.01 | 6.54 | 5.46 | `Circle` | outline |
| `primary` (ação) | `#235E95` | 6.76 | 6.31 | 5.31 | — | sólido (CTA único) |

### A marca

`#769ABC` **não é uma cor quebrada** — falha sobre fundo claro (2.95:1) e **funciona
sobre o sidebar escuro `#12233A` (5.36:1)**. Portanto:

- **Sidebar** (`--sidebar-primary`, `--sidebar-ring`, estado ativo): `#769ABC` **original,
  intocado**. É o chrome mais visível da marca no app inteiro.
- **Logo**: `#769ABC` + `#7DBD67` **originais**, via tokens próprios
  `--brand-blue-logo` / `--brand-green-logo`. Precisam ser separados de `--primary`,
  senão mudar a UI muda o logo junto.
- **UI sobre fundo claro** (botão, link, foco): `#235E95` = hsl(209, 62%, 36%).
  **Hue 209° idêntico** ao `#769ABC`. Lightness desce 60% → 36% (obrigatório: é o
  que compra o contraste) e **a saturação sobe 34% → 62% (deliberado)**.

  A saturação sobe porque *o mesmo número de saturação não produz o mesmo efeito
  em lightness diferente*. A 60% de lightness, 34% de saturação lê como "suave e
  arejado" — é o caráter do `#769ABC`. A 36% de lightness, os mesmos 34% leem como
  **cinza sujo**. Preservar a identidade percebida do azul ao escurecer exige
  compensar com saturação; preservar o número da saturação a destrói.

  Este ponto custou uma iteração: a primeira tentativa foi `#406282` (sat 34%
  mantida, por leitura literal de "mesma família cromática"), foi implementada,
  e o dono do produto rejeitou de imediato — "ficou estranho". Não repetir.

**O verde da marca escurecido *é* o `ok`** (`#3E6A2F` = hsl(105, 39%, 30%), hue e
saturação intactos). Autorizado pelo dono do produto. Elimina o problema dos verdes
concorrentes — havia **três** verdes quebrados na paleta original (`--success` #009966
a 3.65:1, `--brand-green` #7DBD67 a 2.25:1, e um terceiro proposto). Ganho: os dois
estados que o stakeholder mais vê — a ação primária e o "está tudo certo" — passam a
ser a identidade da empresa.

Plano B, se `#3E6A2F` ficar terroso demais na tela: `#397326` (hsl 105, 50%, 30%), 5.75:1.

### Revisão R1 — tom do azul e do verde (2026-07-20)

**Gatilho.** Dono do produto: "as cores atuais não estão bonitas — melhorar o tom
do azul e do verde." Feedback estético subjetivo, não regressão de contraste. Os
contratos de contraste desta seção permanecem e foram reverificados.

**Diagnóstico.**
- **Verde `#3E6A2F` = hsl(105, 39%, 30%): problema real, e é a *mesma* falha que
  esta seção já nomeia para o azul.** O verde do logo `#7DBD67` é hsl(105, **39%**,
  57%); ao escurecê-lo para virar o `ok` baixou-se a lightness 57→30 mas
  **manteve-se a saturação em 39%** — exatamente o erro do "mesmo número de saturação
  não produz o mesmo efeito em lightness diferente". A 30% de lightness, hue 105
  (amarelo-esverdeado) com sat 39% lê como **oliva/drab** (o "terroso" do Plano B).
  Pior: hue 105 é a faixa mais frágil possível para um verde escuro — amarelo +
  escuro = oliva por física de cor. Verdes que escurecem limpos ficam em ~130–145.
  A compensação de saturação foi aplicada ao azul e esquecida no verde.
- **Azul `#235E95` = hsl(209, 62%, 36%): marginal.** Hue e compensação corretos; lê
  "pesado/denim", não feio. O lever disponível é croma, não lightness.
- **Amplificador — o gradiente do Hero (`from-primary … to-brand-green`).** Único
  lugar onde os dois aparecem grandes, sólidos e lado a lado (topo da home, 1ª tela
  do pitch). Navy→oliva passa por meios-tons lamacentos: é aí que "não está bonito"
  grita. Trocar os tokens conserta o gradiente de graça (azul-límpido→floresta via
  teal — água→terra).

**Por que o azul não pode só clarear.** `--primary` é texto sobre o próprio tint 12%
(chip do `KpiCard`), então precisa ser escuro o bastante para 4.5:1 sobre seu tint
pálido: L=43 dá tint-worst 4.12 (reprova), L=39 dá 4.70. O `#769ABC` claro dá 2.95:1
e branco-sobre-ele também reprova (2.95) — por isso a UI o escureceu. Único lever
dentro do contrato: saturação. Azul mais *rico*, não mais *claro*.

**Decisão.**
- **Azul → `#1961A4` = hsl(209, 74%, 37%).** Hue 209 preservado. Lightness ~igual
  (36→37). Saturação 62→74: a mesma jogada já sancionada aqui (compensar identidade
  com croma). Azul-água límpido no lugar de denim.
- **Verde → `#196C2D` = hsl(135, 63%, 26%). Quebra deliberada do hue 105
  (justificativa explícita, como esta seção exige).** Hue 105 é insalvável no
  escuro; o logo segue 105 (`--brand-green-logo` intocado), e só o token de UI
  migra para 135 (floresta) — igual ao azul de UI, que já não é o azul-claro do
  logo. "Seu estado ok é a cor da empresa" vira "…a cor da empresa adaptada ao
  escuro". Descartado o Plano B (`#397326`, hue 105 + saturação): tira parte da
  lama mas mantém o viés oliva. Descartado 140 (esmeralda, mais frio): 135 é o
  menor deslocamento que já sai decisivamente do oliva.
- **`--info` `#0C6178` (hsl 193): inalterado.** Gap de hue ao novo azul segue 16° e
  o de lightness aumenta (26 vs 37). Verde novo a 58° do teal — sem colisão.
- **Sidebar `#769ABC` (claro): intocado.** Não é a queixa — ali o azul-claro da
  marca é o bonito; funciona a 5.36:1 sobre `#12233A`; mexer quebra a consistência
  do chrome. A queixa é sobre os derivados escurecidos em superfície clara.
- **Dark (coerência):** azul `#8FB4D1 → #7BAAD5`; verde `#96CE81 → #68CA81` (hue 135).
  `--sidebar-primary` dark alinhado a `#7BAAD5`, prioridade baixa.

**Tokens afetados.** `--primary`, `--ring`, `--chart-blue`, `--chart-1` (azul);
`--success`, `--brand-green`, `--chart-green`, `--chart-2` (verde) — em `:root` e
`.dark`. `--info`, `--brand-blue-logo`, `--brand-green-logo` e sidebar claro:
inalterados.

**Paleta reverificada (mesmo método desta seção).**

Claro (`#FFFFFF` card, `#F5F7FC` página, tint 12% pior caso):

| Papel | Hex | s/ branco | s/ #F5F7FC | pior (tint 12%) |
|---|---|---|---|---|
| azul (primary/ring/chart-blue/chart-1) | `#1961A4` | 6.39 | 5.96 | 5.01 |
| verde (success/brand-green/chart-green/chart-2) | `#196C2D` | 6.51 | 6.08 | 5.10 |

`StatusBadge` usa tint 15%: verde novo 4.88 vs. `#3E6A2F` 4.80 — melhora, ≥4.5.

Escuro (card `oklch(0.205)`≈`#262626`, tint 12% pior caso):

| Papel | Hex | s/ card | pior (tint 12%) |
|---|---|---|---|
| azul | `#7BAAD5` | 6.16 | 4.98 |
| verde | `#68CA81` | 7.46 | 5.86 |

Todos ≥ 4.5 (piso duro) e ≈ ≥ 5.0 (padrão folgado desta seção). Branco no azul
sólido (CTA) = 6.39; no verde sólido = 6.51. Texto branco do Hero ≥ 6.3:1 em todo
o gradiente.

**Follow-up sinalizado, não feito aqui:** se o dono ainda quiser um azul
visivelmente *mais claro* (não só mais rico), isso exige mudar o **uso** — ex.: um
token de acento claro separado só para superfícies grandes com texto branco, sem
passar pelo constraint de texto-sobre-tint. É build, não decisão de token; entra
como proposta separada.

### Revisão R2 — refactor visual completo (2026-07-20)

**Gatilho.** Pedido do dono do produto: visual mais clean/moderno, novas fontes,
"outro design de cores mais vivas porém azul e verde", cara de "SaaS de $5000",
via skill `ui-ux-pro-max` (não a `ops-design-director` fantasma citada na
Proveniência — essa não existe; usou-se `ui-ux-pro-max` diretamente, como a R1).

**O que a busca do `ui-ux-pro-max` devolveu, e por que parte foi descartada.**
Rodado `--design-system` para "B2B SaaS dashboard field-ops mining compliance":
recomendou estilo **Glassmorphism** e tipografia **Fira Code/Fira Sans**. Ambos
descartados, não por preferência, mas porque contradizem restrições já verificadas
neste documento:
- **Glassmorphism** = blur decorativo. §1 já rejeita explicitamente ("blur é o
  oposto da restrição") e §5/§8 exigem legibilidade sob sol forte com luva — a
  transparência do glass é o oposto de contraste confiável em campo. A skill não
  conhece essa restrição de produto; o documento conhece. Mantido: **Flat Design**
  (mesmo resultado da busca por estilo em `--domain style`), que já é a linha
  border-first/shadow-mínimo do §8 — zero mudança estrutural necessária,
  compatível "10/10" com Tailwind segundo a própria base da skill.
- **Fira Code/Fira Sans** é par heading+body pensado pra código/terminal — errado
  pro tom "colega técnico, não corporativo" do §11. Ver decisão de tipografia na
  Revisão R2 do §6 (Outfit/Inter/Geist Mono).

Os demais achados da skill (paletas de referência SaaS/fintech e o par de
tipografia "Geometric Modern"/"Friendly SaaS") **informaram** a decisão abaixo, mas
nenhuma paleta pronta da busca combinava azul+verde (todas eram azul+laranja ou
dark-mode fintech) — a paleta final foi recalculada aqui, não copiada da busca.

**Decisão de cor — mais vívido não é mais claro, de novo.** Mesma lição da R1:
dentro do contrato "`--primary`/`--success` são texto sobre o próprio tint 12%",
vivacidade vem de **saturação**, e escurecer um pouco *ajuda* o contraste em vez de
brigar com ele (ao contrário do que a intuição diria). Espaço de busca ampliado
mecanicamente (script de verificação HSL→hex→contraste, mesmo método do §4
original) confirmou o padrão nos dois hues:

- **Azul → `#0A59A3` = hsl(209, 88%, 34%)**, de `#1961A4` (R1, hsl 209/74/37). Hue
  209 (marca) mantido. Saturação 74→88, lightness 37→34: mais croma **e** mais
  escuro juntos → contraste **sobe** (7.07 vs 6.39 s/ branco; 5.49 vs 5.02 no pior
  caso de tint). Lê como azul royal/cobalto rico, não denim.
- **Verde → `#0C5F25` = hsl(138, 78%, 21%)**, de `#196C2D` (R1, hsl 135/63/26). Hue
  138 (a mesma correção "sair do oliva" da R1, ajustado +3° por ficar melhor nos
  testes) mantido fora do 105 do logo, pela mesma razão de sempre. Saturação
  63→78, lightness 26→21: mesmo padrão do azul, contraste sobe (7.84 vs 6.51 s/
  branco; 6.07 vs 5.10 no pior caso de tint). Lê como esmeralda profundo.
- **Testados e descartados nesta rodada:** saturações ainda mais altas (95%+ no
  azul, 85%+ no verde) — em alguns pontos do espaço a lightness necessária pra
  segurar o contraste cai rápido demais e o pior-caso de tint fura 4.5:1 (ex.: hsl
  209/90/40 dá 4.35 — reprova). A dupla escolhida é o ponto de saturação mais alta
  que ainda sobra margem confortável (>5.0) em **todos** os três testes.
- **Dark mode, mesmo hue, coerência:** azul `#76AFE5` (hsl 209/68/68, 6.51 s/ card,
  5.25 pior-caso tint); verde `#5AD880` (hsl 138/62/60, 8.34 s/ card, 6.51 pior-caso
  tint). `--sidebar-primary` dark realinhado a `#76AFE5`.
- **Inalterado, mesma justificativa da R1:** `--info` (teal, sem colisão de hue com
  os novos tons), `--brand-blue-logo`/`--brand-green-logo` (só logo), sidebar claro
  `#769ABC` (não era a queixa, e mexer quebra o chrome de marca).

**Nota sobre "vívido" dentro do contrato de acessibilidade.** Como `--primary`/
`--success` precisam ler como texto sobre o próprio tint pálido, o teto de
lightness é baixo (~34% e ~21%) — então "vívido" aqui significa **tom joia rico e
saturado** (cobalto, esmeralda), não um azul/verde claro tipo neon. Isso é
consistente com o pedido ("cara de SaaS de $5000" lê como sério/premium, não
playful) — se o dono quiser depois um azul *claro e brilhante* de verdade, é o
mesmo follow-up já sinalizado na R1: token de acento novo, sem o constraint de
texto-sobre-tint, para superfícies grandes (ex.: o gradiente do Hero) — não os
tokens semânticos.

**Paleta reverificada (mesmo método das seções acima).**

Claro:

| Papel | Hex | s/ branco | s/ #F5F7FC | pior (tint 12%) |
|---|---|---|---|---|
| azul (primary/ring/chart-blue/chart-1) | `#0A59A3` | 7.07 | 6.60 | 5.49 |
| verde (success/brand-green/chart-green/chart-2) | `#0C5F25` | 7.84 | 7.31 | 6.07 |

Escuro (card `oklch(0.205)`≈`#262626`):

| Papel | Hex | s/ card | pior (tint 12%) |
|---|---|---|---|
| azul | `#76AFE5` | 6.51 | 5.25 |
| verde | `#5AD880` | 8.34 | 6.51 |

Branco sobre sólido (CTA/fill crítico): azul 7.07, verde 7.84 — ambos com folga
grande sobre o piso AA.

**Tokens afetados.** Mesmo conjunto da R1 (`--primary`, `--ring`, `--chart-blue`,
`--chart-1`; `--success`, `--brand-green`, `--chart-green`, `--chart-2`, `:root` e
`.dark`, mais `--sidebar-primary` dark). Nada fora desse conjunto muda nesta
revisão.

### Revisão R3 — azul e verde claros de verdade, destravando a lightness (2026-07-21)

**Gatilho.** Dono do produto, depois de ver a R2 rodando: as cores estão "escuras/pesadas
demais". Perguntado se queria manter o tom escuro só subindo saturação (rota das R1/R2)
ou aceitar mudar o *uso* das cores para conseguir azul/verde genuinamente mais claros,
escolheu explicitamente a segunda. Isto autoriza destravar o lever de lightness que R1
e R2 assumiram fixo.

**Diagnóstico — a trava tinha DUAS causas, e não eram iguais para azul e verde.**
R1/R2 concluíram "vívido só via saturação + escurecer" porque `--primary`/`--success`
seriam "texto sobre o próprio tint 12%". Ao rastrear o uso real:
- **O chip do `KpiCard` e o foco/borda/ring são ÍCONE e OBJETO GRÁFICO — piso WCAG
  3:1, não 4.5:1.** A R1 escreveu literalmente que o azul "precisa ser escuro para
  4.5:1 sobre seu tint", tratando um ícone como texto. Essa é a sobre-restrição que
  travou o azul. Azul quase nunca é *letra* sobre tint: os `text-primary` do app são
  links de 12px sobre card branco (passam), e o único ponto de letra-azul-sobre-tint
  era o rótulo do segmentado selecionado no campo (`campo/page.tsx`).
- **`--brand-green` e `--success` foram amarrados no mesmo hex por conveniência
  (R1/R2), não por necessidade.** `--brand-green` é usado **só** no stop verde do
  gradiente do Hero (fill, texto branco *grande* → piso 3:1). `--success` é o que
  carrega texto (badge `ok`, número do KPI, inline → piso 4.5:1). São papéis
  diferentes; podem divergir.

**Trade-off branco-sobre-cor-clara, resolvido explicitamente.** Azul: **mantido
texto branco, com teto em L43** — branco sobre hue-209 reprova acima de ~L45, e
texto-escuro-no-CTA quebraria a convenção branco-sobre-cor de todo fill do sistema.
Verde: o vívido sobe muito mais (L33) porque, pela Lei do Preenchimento, verde
**nunca** é fill sólido exceto o canto do Hero, que só tem heading branco grande
(piso 3:1).

**Decisão.**
- **Azul → `#0F71CC` = hsl(209, 86%, 43%)**, de `#0A59A3` (R2, L34). Hue 209 da
  marca preservado. L34→L43: azure claro no lugar de navy. Máximo L que ainda dá
  branco-no-botão (4.94) e link-sobre-página (4.61) ≥4.5. Aplica a `--primary`,
  `--ring`, `--chart-blue`, `--chart-1`. Ícone do chip sobre tint 12% (sobre o
  branco do card, contexto real de renderização) = 4.19 (gráfico, ≥3 ✓).
- **Verde semântico `--success` → `#0E722C` = hsl(138, 78%, 25%)**, de `#0C5F25`
  (R2, L21). Sobe 4 pontos de lightness (menos "pesado" no número do KPI) mantendo
  texto ≥4.5 (badge tint 15% sobre card = 4.87; sobre branco = 6.07). Hue 138
  mantido fora do oliva. Aplica também a `--chart-green`, `--chart-2` (uma série
  verde e o número verde da tabela têm que casar — contrato do §4).
- **Verde de marca `--brand-green` → `#0F9939` = hsl(138, 82%, 33%). Agora DIVERGE
  de `--success`.** Vívido grass, só o stop do Hero. Branco grande sobre ele = 3.73
  (≥3). O gradiente do Hero vira azure→grass no lugar de navy→esmeralda-profundo —
  o conserto da queixa. **Nunca usar este token onde `--success` entraria** (badge,
  número, texto pequeno) — ele não passa 4.5:1 como texto.
- **Uma mudança estrutural:** o rótulo do segmentado selecionado no campo
  (`campo/page.tsx`, linha ~711) trocou `text-primary`→`text-foreground` — único
  ponto de letra-azul-sobre-tint do app. O estado "selecionado" continua com 4
  canais (`border-primary` + `bg-primary/12` + ícone `CheckCircle2` azul + rótulo
  escuro em negrito), não depende de cor no texto, e lê melhor sob sol.
- **Inalterados:** `--warning`/`--info`/`--destructive` (cores de risco devem ser
  escuras — §1 "sem drama"; não eram a queixa), `--brand-blue-logo`/
  `--brand-green-logo`, sidebar, e **todo o `.dark`** (já claro/vívido desde a R2;
  não era a queixa). Nenhum token CSS novo — só desamarrar `--brand-green` de
  `--success`.

**A relaxação de contraste é deliberada e limitada.** Texto continua ≥4.5 em toda
combinação nova. Só objetos gráficos (ícone, ring, borda, stop de gradiente) passam
a valer pelo piso real 3:1 — que é o que R1/R2 sobre-restringiram a 5.0 e o que
prendeu o azul no escuro. Isto encerra o "follow-up sinalizado" de R1/R2 (azul/verde
claros exigiriam mudar o uso): o uso mudou (ícone≠texto; `--brand-green`≠
`--success`), sem token de acento novo.

**Paleta reverificada (mesmo método, calculada e reconferida de forma independente).**

Claro:

| Papel | Hex | s/ branco | s/ #F5F7FC | branco no fill | pior uso real |
|---|---|---|---|---|---|
| azul (primary/ring/chart-blue/chart-1) | `#0F71CC` | 4.94 | 4.61 | 4.94 (botão) | 4.19 ícone-tint12%/card (piso 3:1) |
| verde (success/chart-green/chart-2) | `#0E722C` | 6.07 | 5.66 | 6.07 | 4.87 badge-tint15%/card (piso 4.5:1) |
| verde marca (brand-green, só Hero) | `#0F9939` | 3.73 | 3.48 | 3.73 (heading grande) | — fill only, sem texto pequeno |

Escuro: sem alteração — reverificação R2 permanece válida (azul `#76AFE5` 6.51 s/
card; verde `#5AD880` 8.34 s/ card).

**Tokens afetados.** `--primary`, `--ring`, `--chart-blue`, `--chart-1` (azul →
`#0F71CC`); `--success`, `--chart-green`, `--chart-2` (verde → `#0E722C`);
`--brand-green` (→ `#0F9939`, desacoplado de `--success`). Só `:root`. `.dark`
inalterado. Fix de código em `campo/page.tsx` (linha ~711).

### Escala de Prazo (T-scale)

`diasAte()` já existia em `status-map.ts` sem nenhum consumidor visual. Sem esta escala,
cada domínio inventa seus próprios thresholds e ASO, calibração, crachá e certificado
ficam incoerentes entre si. **Canônica, única, não negociável:**

| Bucket | Dias | Mapeia para | Label |
|---|---|---|---|
| `T0` | `< 0` | `crítico` | "Vencido há N dias" |
| `T1` | `0–7` | `crítico` | "Vence em N dias" |
| `T2` | `8–30` | `atenção` | "Vence em N dias" |
| `T3` | `31–90` | `neutro` | "Vence em DD/MM" |
| `T4` | `> 90` | `ok` | "Válido" |

Uma função `prazoBucket(dias)`. Todo domínio com validade a consome. Nenhum
threshold local, em lugar nenhum.

**Nunca depende de cor:** todo estado carrega **três canais redundantes** —
cor + **forma do ícone** + **texto**. É isso que faz o sistema sobreviver a daltonismo
*e* a sol forte.

## 5. Duas superfícies, um sistema

Não são dois design systems. São os mesmos tokens em dois modos de densidade.

| | `density="compact"` (dashboard) | `density="field"` (campo) |
|---|---|---|
| bg / fg | `#F5F7FC` / `#333333` | **`#FFFFFF` / `#0B1220`** (~18.5:1) |
| borda | `#E7E7EF`, 1px | **`#667085`, 2px** (hairline some no sol) |
| alvo mínimo | 32px | **56px** (64px na ação primária) |
| corpo | 13–14px | **16px piso absoluto** |
| padding card | 12px | 16px |
| dark mode | sim | **não. Nunca.** |

**56px, não 44px.** 44 é o piso para dedo nu. Com luva, 44 gera mis-tap.

**Risco nomeado:** 56px numa moldura de 390px, projetado num telão, **vai parecer
grosso** — e quem não conhece a razão lê "grosso = amador". Mitigação: alvo grande +
sistema apertado. Ritmo de 8px rigoroso, alinhamento impecável, numeral mono, zero
espaço desperdiçado *entre* os alvos grandes. Aí lê como "dimensionado pra luva".

**Os 6 fluxos de campo não são abas.** `TabsList` com 6 itens a 390px é inviável.
Estrutura: **home com 6 task-cards de 64px + navegação com back**, um fluxo por vez.
O técnico com pressa faz *uma* tarefa; ele não navega, ele executa.

**Offline é sistema visual de primeira classe**, não badge de canto. Barra de sync
persistente no topo do field, 3 estados: `Offline` (slate sólido, `WifiOff`) →
`Sincronizando` (teal, animado) → `Sincronizado` (verde tint, auto-oculta em 3s).
**Toda escrita em campo confirma "salvo no aparelho" imediatamente** — nunca um
spinner esperando rede. Optimistic-first, sempre.

## 6. Tipografia

**Revisão R2 (2026-07-20) — trio Outfit / Inter / Geist Mono, substitui Geist + Geist
Mono.** A revisão anterior desta seção dizia "trocar fonte aqui é valor zero para o
usuário" — verdade quando ninguém tinha pedido. Pedido explícito do dono do produto
("novas fontes", parte de um refactor visual maior via `ui-ux-pro-max`) muda o cálculo:
agora há um usuário pedindo. Decisão, com o mesmo raciocínio de "onde investir" do §9 —
gasta-se troca de fonte só onde ela é vista, não em tudo:

- **`--font-heading` (títulos, wordmark, `CardTitle`/`DialogTitle`/etc. via shadcn):
  Outfit.** Geométrica, distinta, é o que lê como "marca com direção", não commodity.
  Único ponto de contato novo de verdade — a maior parte do produto é tabela/corpo,
  não título.
- **`--font-sans` (corpo, UI, tabela — a maior parte da tela): Inter.** Trocado de
  Geist Sans por ser o padrão comprovado em dashboard denso (x-height alto, ótima
  legibilidade em 12-14px, tabular figures nativas) — mais neutro que a alternativa
  cogitada (Plus Jakarta Sans, "amigável" demais para um produto de compliance
  industrial) e sem custo de self-host (Google Fonts via `next/font/google`, igual
  ao que já existia).
- **`--font-geist-mono` (todo numeral): inalterada.** Zero motivo para trocar — já
  cumpre a lei abaixo, e o pedido era "novas fontes", não "trocar tudo".

Ambas via `next/font/google` em `layout.tsx`, mesmo padrão de antes (variável CSS +
`@theme inline`), zero custo de infraestrutura nova.

- Dashboard: 12 (micro) / 13 (célula) / 14 (corpo) / 16 (título de card) / 20 (h1).
- Field: 16 (piso) / 18 (label) / 20 (valor) / 24 (o único número que importa na tela).

**Lei:** todo número em coluna, KPI, data, medição ou contagem → **Geist Mono +
`tabular-nums`**. Número em prosa, não.

## 7. Motion

**Nenhuma lib de motion.** `tw-animate-css` (já presente) + transitions do Tailwind
cobrem tudo. Durações: **150ms micro / 200ms estado / 250ms overlay.** Ease-out
entrando, ease-in saindo. `prefers-reduced-motion` respeitado.

| Decisão | Veredito |
|---|---|
| **hover-lift em card com `href`** | **Fica.** Os cards *são* navegação; num pitch o apresentador hoverea para mostrar "dá pra entrar aqui". É funcional, não decorativo. `-translate-y-0.5` a 150ms, só em card com `href`. |
| **count-up em KPI** | **Rejeitado.** Numa demo alguém está falando por cima enquanto o olho pousa no número. Número animado não se lê ouvindo. O demo *piora* esse caso. |
| **pulse/glow em alerta** | **Rejeitado.** 40 linhas pulsando destrói o read de "somos sérios", que é o ativo do pitch. |
| **lib de motion** | **Rejeitada, porta aberta.** Se a Fase 2 achar um momento de demo específico que precise, é argumento real — traga o momento. |
| **gradiente** | **Um só: a marca no `SidebarHeader`.** Gradiente em superfície de dado reduz legibilidade do dado, e legibilidade *é* o pitch. |

**Única exceção onde motion é obrigatório:** a transição `offline → sincronizando →
sincronizado`. É o único lugar onde o movimento carrega significado.

## 8. Profundidade

**Flat, border-first, shadow-mínimo.** Sombra em UI densa de tabela é ruído; borda
carrega estrutura a 1px. Três níveis, só:

| Nível | Uso | Render |
|---|---|---|
| 0 | página, card, tabela | **borda apenas**, sem sombra |
| 1 | popover, dropdown, tooltip | `shadow-md` |
| 2 | dialog, sheet | `shadow-lg` + scrim 50% |

Zero glassmorphism, zero blur decorativo, zero gradiente em superfície.

## 9. Profundidade funcional — onde investir (vetor demo)

O que está sendo vendido é **"nós entendemos sua operação"**. Logo: profundidade onde
prova domínio, raso onde é genérico.

**PRECISA de profundidade real (é o pitch):**

1. **A cadeia causal da criticidade.** ASO vencido → colaborador bloqueado → equipe
   incompleta → **campanha bloqueada**. Já existe nos tipos (`Campanha.bloqueios`,
   `Colaborador.pendencias`). **Essa cadeia é o produto inteiro**, e tem que ser
   **percorrível**: clicar no badge crítico → cai na pessoa → vê a campanha travada.
   É onde mais se investe. É o que a T-scale sustenta.
2. **Os 6 fluxos do app de campo.** É o diferenciador. Ninguém na sala pensou em
   registro de **picada de animal**. Essa especificidade *é* o produto.
3. **Realismo do mock data.** Nomes de mina plausíveis, NRs corretas, datas que
   **acendem a T-scale nos 5 buckets**. Dado com cara de fake mata credibilidade mais
   rápido que qualquer falha visual.

**Pode ser raso, sem risco:** compras/cotação (procurement genérico, todo ERP tem),
financeiro (cartão + tabela), as "integrações" (uma linha de `"última sincronização:
há 2h"` vende melhor que tela fake de OAuth), charts (2–3 no máximo — quase todo dado
de compliance é melhor em tabela), settings/auth/admin (não construir).

**A contenção tem uma dívida atrelada.** Contenção + conteúdo denso = "essa gente
conhece nossa operação". Contenção + conteúdo raso = "não terminaram". Sem gradiente
e sem animação, só sobra o conteúdo — e ele passa a ser julgado sozinho. Se o mock
data não for bom, a contenção vira sem-graça.

**Estados vazios:** bem desenhados, mas **a demo nunca deve encontrá-los**. O mock data
tem que ser denso o bastante para que nenhuma tela primária caia em empty state.

**A home (`src/app/(app)/page.tsx`) é a tese**, não um utilitário. Tem 5 segundos para
dizer "rastreamos o que mata seu compliance". Investimento desproporcional.

## 10. Complexidade

**Baixa-média, e isso é restrição, não limitação.** Componente novo só entra se um
primitivo shadcn não resolver. `src/components/mtgl/` fica pequeno de propósito:
`StatusBadge`, `KpiCard`, `PageHeader`, `AppSidebar`, `AppTopbar`, `StatusDonut`
+ os novos `DeviceFrame`, `SyncBar`, `PrazoBadge`. Um 12º componente custom exige
justificativa.

## 11. Tom

**Colega técnico, não corporativo.** PT-BR direto, sem jargão, sem alarmismo,
**sem ponto de exclamação**, nunca culpa o usuário. Fórmula:

> **Fato + consequência operacional + ação.**

- Não: `"Erro! ASO inválido."`
- Sim: `"ASO vencido há 3 dias — Rafael não pode entrar na mina. Renovar ASO."`

Estados vazios afirmam o fato, sem pedir desculpa: `"Nenhum acidente registrado no período."`

## Contratos que a implementação não pode quebrar

- Nenhum par fg/bg abaixo de 4.5:1 (3:1 para borda/componente). `#769ABC` não volta
  para fundo claro.
- Todo status = cor **+ forma de ícone + texto**. Sempre os três.
- Fill sólido só em `crítico` e no CTA primário único da tela.
- Todo prazo passa por `prazoBucket()`. Nenhum threshold local.
- Field: 16px piso de fonte, 56px piso de alvo, sem dark mode, escrita confirma antes da rede.
- Sem lib de motion. Sem count-up. Sem pulse. Sem glass.
- Numerais de dado: mono + tabular.

## Notas técnicas

- **Next 16.2.10 / React 19.2.4.** O `AGENTS.md` avisa que a API mudou — ler
  `node_modules/next/dist/docs/` antes de escrever código.
- **shadcn aqui roda sobre `@base-ui/react`, não Radix.** `AppSidebar` usa
  `render={<Link href={...} />}`, não `asChild`. Componente novo segue a API Base UI.
  Fonte de verdade de padrão: o registry shadcn em `Outros\ui`.
- `recharts@3.8` já instalado — sem lib de chart nova.

## Proveniência

- Fase 1 conduzida por `AGT-DESIGN-DIRECTOR`, apoiada na skill `ui-ux-pro-max` v2.6.2.
- **Ressalva de auditoria:** a definição do `AGT-DESIGN-DIRECTOR` declara a skill
  `ops-design-director` como fonte de verdade obrigatória. Essa skill **não existe** —
  não é "não instalada", é referência fantasma na própria spec do agent. Este DNA foi
  produzido sem ela. Quem auditar precisa saber disso.
- Paleta **não** aceita como dada: todos os contrastes foram recalculados
  mecanicamente. Duas correções resultaram — `atenção` `#B54708` → `#9C3D07` e
  `ativo` `#0E7490` → `#0C6178`, porque os originais falhavam (4.28 e 4.24) sobre o
  fundo real `#F5F7FC` quando renderizados como tint 12%; a proposta original só tinha
  sido conferida contra branco puro.
