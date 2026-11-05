# 🎲 SISTEMA DE REGRAS UNIFICADO DE EVREN
## Proposta de Resolução de Testes, 28 Perícias, Métricas Vitais e Duelo Cinético

> **Classificação:** Proposta de Regras para Playtest (Cânone em Homologação)  
> **Status:** `proposal` (Compatível com os registros legados 0/5/10/15)  
> **Universo:** EVREN  

---

## 1. Atributos Fundamentais e Fórmula de Resolução Única

Personagens e agentes são definidos por **cinco atributos base**, graduados de **1 a 5**:

| Atributo | Abreviatura | Escala Canônica | Foco Operacional |
| :--- | :---: | :---: | :--- |
| **Força** | `FOR` | 1 a 5 | Potência muscular, atletismo, sustentação de carga e impacto físico. |
| **Vigor** | `VIG` | 1 a 5 | Constituição biológica, resistência a toxinas, absorção de trauma e estabilidade. |
| **Agilidade** | `AGI` | 1 a 5 | Destreza motora, velocidade de reação, reflexos evasivos e pontaria. |
| **Presença** | `PRE` | 1 a 5 | Força de personalidade, empatia, influência interpessoal, coragem e intuição. |
| **Intelecto** | `INT` | 1 a 5 | Capacidade analítica, investigação científica, medicina e conhecimentos táticos. |

### A Fórmula Única de Resolução de Testes
Para unificar as mecânicas das fichas, do compêndio e da arena sem quebrar códigos existentes:

$$\text{Resultado do Teste} = \max\Big(\text{Pool de } (\text{Atributo})\text{d20}\Big) + \text{Bônus de Treinamento}$$

- Rola-se uma quantidade de dados d20 igual ao valor do Atributo relacionado.
- Seleciona-se o **maior resultado individual** entre os dados rolados.
- Soma-se o **Bônus de Treinamento** da perícia.

#### Graus de Treinamento e Conversão Reversível:
| Grau de Treinamento | Bônus Proposto (Playtest) | Bônus Legado da Ficha | Contexto Ficcional |
| :--- | :---: | :---: | :--- |
| **Destreinado** | `+0` | `+0` | Ação por puro instinto ou tentativa sem instrução formal. |
| **Treinado** | `+1` | `+5` | Instrução técnica padrão ou rotina de campo consolidada. |
| **Veterano** | `+2` | `+10` | Anos de vivência sob estresse extremo e sobrevivência anômala. |
| **Expert** | `+3` | `+15` | Referência mundial ou autoridade técnica máxima no assunto. |

*Nota de Transição:* A aplicação converte reversivelmente bônus legados de `+5/+10/+15` para `+1/+2/+3` sem perda do dado cadastrado originalmente no banco IndexedDB/localStorage.

#### Dificuldades Padronizadas (DT):
- **DT 10 — Simples:** Ação rotineira realizada sob leve pressão de tempo.
- **DT 14 — Arriscada:** Desafio perigoso com oposição moderada ou em terreno hostil. *(Padrão para perguntas capciosas da gala de Oeht)*.
- **DT 18 — Difícil:** Situação extrema diante de anomalia ativa ou recursos escassos.
- **DT 22 — Extrema:** Proeza limítrofe entre sobrevivência e dissolução tecidual.

#### Regra do Conflito Direto e Empates:
- Em disputas diretas entre dois personagens (ou personagem vs. criatura), ambos rolam seus respectivos testes. O **maior total vence**.
- **Em caso de empate exato:** Pela regra canônica de Evren, **o empate favorece quem já defendia a situação** (o defensor mantém sua posição ou esquiva-se do golpe).

---

## 2. A Lista Canônica das 28 Perícias C.R.I.S.

O sistema formaliza **28 perícias operacionais**, divididas em 3 categorias. Aliases ortográficos existentes são preservados sem perda da string de origem:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AS 28 PERÍCIAS CANÔNICAS                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[MENTE (INT)]                 [FÍSICA (AGI / FOR / VIG)]      [SOCIAL (PRE)]
- Atualidades                 - Acrobacia (AGI)               - Adestramento (PRE)
- Ciências [Ciência]          - Atletismo (FOR)               - Artes (PRE)
- Investigação                - Crime (AGI)                   - Diplomacia (PRE)
- Medicina                    - Fortitude (VIG)               - Enganação (PRE)
- Ocultismo [Misticismo]      - Furtividade (AGI)             - Intimidação (PRE)
- Profissão                   - Iniciativa (AGI)              - Intuição (PRE)
- Sobrevivência               - Luta (FOR)                    - Percepção (PRE)
- Tática                      - Pilotagem (AGI) [Anexo]       - Religião (PRE)
- Tecnologia                  - Pontaria (AGI)                - Vontade (PRE)
                              - Reflexos (AGI)
```

1. **Acrobacia (AGI):** Equilíbrio em cordas, escaladas de escombros, quedas amortecidas.
2. **Adestramento (PRE):** Acalmar ou comandar animais e espécimes não mutantes.
3. **Artes (PRE):** Falsificação estética, códigos visuais, empatia cultural.
4. **Atletismo (FOR):** Natação contra correntezas, arrombamento por impacto, corrida prolongada.
5. **Atualidades (INT):** Conhecimento geopolítico, rotas comerciais, notícias de sindicatos.
6. **Ciências (INT) [Alias: Ciência]:** Bioquímica, física de partículas, genética, geologia de quartzo.
7. **Crime (AGI):** Destrancar fechaduras mecânicas, prestidigitação, sabotagem discreta.
8. **Diplomacia (PRE):** Negociação civilizada, acordos de trégua, pacificação de grupos.
9. **Enganação (PRE):** Disfarce de identidade, mentiras convincentes, manipulação de alvos.
10. **Fortitude (VIG):** Resistência fisiológica a venenos, gases tóxicos, choque térmico e dor.
11. **Furtividade (AGI):** Ocultação em sombras, deslocamento silencioso contra Ecos.
12. **Iniciativa (AGI):** Rapidez de percepção e reflexo para agir primeiro no combate.
13. **Intimidação (PRE):** Coerção física ou psicológica, quebra moral de adversários.
14. **Intuição (PRE):** Sexto sentido de perigo, identificação de blefes e incongruências de conduta.
15. **Investigação (INT):** Perícia forense, busca de pistas materiais em cenas de crime ou escombros.
16. **Luta (FOR):** Combate desarmado, lâminas curtas, facões e machados de mineração.
17. **Medicina (INT):** Primeiros socorros, contenção de hemorragias, cirurgias de emergência.
18. **Ocultismo (INT) [Alias: Misticismo]:** Fenomenologia dimensional, análise do Outro Lado e relíquias.
19. **Percepção (PRE):** Atenção sensorial ampla, detecção de ruídos, odor de ozônio e névoa anômala.
20. **Pilotagem (AGI):** *(Recuperada do Anexo Canônico)* Condução de veículos terrestres, lanchas navais e botes.
21. **Pontaria (AGI):** Disparo de pistolas, fuzis, sinalizadores náuticos e arpões elétricos.
22. **Profissão (INT):** Conhecimento de ofício prévio (engenheiro, mineiro, marinheiro, arquivista).
23. **Reflexos (AGI):** Esquiva instintiva de explosões, armadilhas desabadas e projéteis.
24. **Religião (PRE):** História de ordens monásticas medievais (Santo Agostinho), ritos e mitos.
25. **Sobrevivência (INT):** Orientação geográfica em selvas e mares, forrageamento e abrigo.
26. **Tática (INT):** Coordenação de esquadrão, escolha de posturas defensivas e pontos de estrangulamento.
27. **Tecnologia (INT):** Hackeamento de computadores, calibração de circuitos e reparo de rádios.
28. **Vontade (PRE):** Firmeza moral contra o horror, disciplina sob tormento e Foco Anímico.

---

## 3. Separação Rigorosa das Métricas Vitais (PV, PD, SAN, MDA)

> [!CAUTION]
> **INVARIANTE DE CÓDIGO E NARRATIVA:** Nunca substitua ou rotule uma métrica vital no lugar de outra.

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│     PV       │   │     PD       │   │     SAN      │   │     MDA      │
│ Integridade  │   │   Esforço    │   │ Estabilidade │   │  Exposição   │
│   Física     │   │ & Resiliência│   │  Subjetiva   │   │  Biológica   │
│  (0 = Óbito) │   │(0=Sobrecarga)│   │  (0=Pausa)   │   │  (0% a 99%)  │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

1. **Pontos de Vida (PV):** Medem a integridade anatômica e celular. Ataques armados, garras, quedas e explosões **sempre reduzem PV**. Em 0 PV, o personagem cai inconsciente e ativa o protocolo de óbito se não for estabilizado com perícia de Medicina (DT 14).
2. **Pontos de Determinação (PD):** Reserva psíquica e muscular de foco, fôlego e determinação. É consumido para ativar posturas extremas de combate e canalizar **Expressões Anímicas**. Em 0 PD, o personagem entra em **Sobrecarga / Exaustão** (visão com vinheta pulsante, tremor e penalidade de -2d20 em testes de Presença e Vontade), **mas seu corpo não sofre ferimentos físicos diretos**.
3. **Sanidade (SAN):** Medida subjetiva de resiliência psicológica perante o inexplicável. Reduzida ao testemunhar mortes atrozes ou desdobramentos de fenda. Ao zerar SAN, o personagem entra em crise de pânico ou catatonia temporária. O sistema proíbe transformar SAN 0 em descarte automático e irreversível do personagem; inclui a opção de **corte de cena e negociação de limites** para proteger a agência do jogador.
4. **Mutagênese Dimensional Anômala (MDA):** Escala percentual de contaminação e reescrita genética pelo tecido anômalo.

### A Escala de Marcos da MDA:
- **5% — Exposição Latente:** Zumbido sutil na audição; sensibilidade cutânea a variações de pressão.
- **10% — Ressonância Folicular:** Iris com leve bioluminescência sob luz ultravioleta; unhas espessas.
- **20% — Hipertrofia Adaptativa:** Maior tolerância a dor física (+1 em Fortitude); temperatura corporal oscilante.
- **40% — Divergência Celular:** Regeneração acelerada (+2 PV por descanso), porém rejeição severa a remédios e analgésicos farmacêuticos comuns.
- **60% — Biomorfose Parcial:** Pele enrijecida em placas minerais condutoras (+2 de absorção de dano); metabolismo acelerado exigindo o dobro de alimento calórico.
- **80% — Instabilidade Morfogenética:** Descargas bióticas involuntárias ao sofrer estresse; risco iminente de perder traços humanos.
- **99% — Transcendência Limítrofe:** Fusão definitiva com as leis da anomalia local (o estado do Arquiteto do Caos). O personagem deixa de operar pelas regras biológicas padrão do planeta.

---

## 4. O Framework da Expressão Anímica

A Expressão Anímica representa a capacidade de um indivíduo manifestar um efeito empírico através de sua própria identidade. Cada manifestação deve preencher obrigatoriamente a ficha:

1. **Crença / Conflito Central:** A dor, trauma ou convicção motriz que ancora a manifestação.
2. **Efeito Observável e Delimitado:** Descrição objetiva do que acontece no ambiente físico.
3. **Gatilho de Ativação:** O gesto, palavra, objeto ou condição de ativação.
4. **Alcance, Duração e Alvos:** Limites físicos precisos (ex.: raio de 2 metros por 6 segundos).
5. **Custo em PD & Risco em MDA:** Quantos pontos de esforço consome e se acrescenta porcentagem de MDA.
6. **Sinal Sensorial / Físico:** Como a manifestação é vista, ouvida ou cheirada por testemunhas ao redor (ex.: som de relógio, odor de ozônio, queda de temperatura).
7. **Limites e Contrajogo:** O que impede, anula ou neutraliza o poder no combate tático.
8. **Consequências Ficcionais:** Efeitos colaterais em corpo, memória ou vínculos sociais do usuário.

---

## 5. Princípios de Investigação (Regra dos Três Caminhos)

1. **Nenhuma Pista Vital Depende de Uma Única Rolagem:** Informações necessárias para que os personagens descubram o mistério principal ou fujam da morte são disponibilizadas através de pelo menos **três caminhos distintos** (ex.: documento físico, depoimento de testemunha e observação de marcas no terreno).
2. **Falha Gera Custo, Não Paralisia:** Se um personagem falhar em um teste de Investigação, a pista ainda pode ser obtida, mas ao custo de **tempo precioso**, **ruído que atrai predadores**, **dano acidental de recurso** ou **aumento de desconfiança de NPCs**.

---

## 6. O Duelo Cinético Resistido (`CombatArena`)

Evren não utiliza Classe de Armadura passiva estática. Todo ataque gera uma reação ativa declarada pelo defensor:

1. **Atacante Declara Ação:** Rola seu teste com base em Luta (corpo a corpo) ou Pontaria (à distância).
2. **Defensor Escolhe sua Postura Tática:**
   - **Esquiva Cinética (Agilidade + Reflexos):** Se o defensor vencer a disputa, esquiva-se de 100% do ataque e ganha Vantagem Tática (+2 no próximo teste).
   - **Bloqueio de Ferro (Vigor + Fortitude ou Força + Luta):** Se vencer, absorve o golpe com escudo ou músculos, aplicando a proteção da armadura.
   - **Contra-Ataque Desesperado (Ataque Simultâneo):** Ambos atacam ao mesmo tempo; se acertarem, ambos sofrem dano simultaneamente.
   - **Foco Anímico (Presença + Vontade):** Utilizado para resistir a ataques mentais, ilusões miméticas ou forças gravitacionais de portais.
3. **Resolução de Dano:** Dano infligido reduz **Pontos de Vida (PV)** da integridade corporal do alvo.
4. **Sacrifício de Armadura:** Diante de um golpe letal (*hitkill* ou crítico massivo), o defensor pode declarar o estilhaçamento definitivo de sua peça de armadura para **anular integralmente o dano do ataque**, destruindo a peça para sempre.
