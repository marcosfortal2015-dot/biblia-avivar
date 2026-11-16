// CÓDIGOS AVIVAR — PROFETAS DOS ÚLTIMOS DIAS
// Fase 0: protótipo navegável. Os dados ficam salvos só neste aparelho (localStorage).
// Na Fase 1 o login, as permissões e os dados passam para o Supabase.
import React, { createContext, lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { LIVROS, BIBLIOTECA, REPORTAGENS } from './conteudo.js'
import { TEMAS } from './quantica.js'
import { ESFERAS, MARCOS } from './mesesTab.js'
import { CURIOSIDADES } from './curiosidades.js'
import { SELOS_EFODE, VESTES_PADRAO, SLOTS_PADRAO, PEDRAS, INTERVALO_DIAS, MIN_ACERTOS, PROMPTS_SELOS } from './selos.js'
import { LIVROS_DEUTERO, ARGUMENTOS_REF, COMPARADOR, TRADICOES, ESTAGIOS_CANON, EVENTOS_REF, PERSONAGENS_REF, MESA_TEMAS, MESA_COLUNAS, MESA, CORREL_REF, PROMPTS_REF } from './reforma.js'
import { SERVIDOR, SB, planoVigente } from './servidor.js'
import { ESTADOS_CIVIS, UFS, validarDados, montarContrato, MODELO_PADRAO, MARCADORES, marcadoresDesconhecidos, cpfValido, formatarCpf, reaisC, somarDias, opcoesParcelas } from './contratolib.js'
import { ESTUDOS_MESA, CAMPOS_ESTUDO } from './reforma_mesa.js'
import { IGREJAS, TEMAS_IGREJAS } from './igrejas.js'
import { LIVROS_PROFETAS, NOMES_BIBLIA } from './livros_profetas.js'
import { ASCENSAO_ESTUDOS } from './ascensao_estudos.js'
import { TEMPOS as J_TEMPOS, MAPAS as J_MAPAS, ESTACOES as J_ESTACOES } from './jornada_roteiro.js'
import { MAR_MEDITERRANEO, MAR_NEGRO, MAR_CASPIO, GOLFO_PERSICO, MAR_VERMELHO, MAR_MORTO, MAR_GALILEIA, LAGO_VAN, LAGO_URMIA, ILHAS, RIOS, ROTULOS, criarProjecao, ajustarCaixa, caixaDaEstacao, caminhoPoligono, caminhoLinha } from './mapas.js'
import { ORG_JORNADA, ORG_ESTUDOS, ORG_VERSO_PADRAO, ORG_QUANTICA, ORG_REFORMA, ORG_IGREJAS, ORG_IGREJAS_TITULOS, ORG_CURSOS_VERSOS } from './organogramas.js'
import { PROT_ATIVO, IDS, MAPA, hidratar, hidratarNoLugar, esvaziar, idDe } from './protegido.js'
import { BotaoInstalar, InstalarModal } from './instalar.jsx'
import { enviarItem, enviarRemocao, enviarConfig, retomar, ouvir, aplicarEdicoes, diffLocal, enviarLote } from './sincronia.js'
import * as NS_conteudo from './conteudo.js'
// Livros Avivar: vitrine, leitor e controle de acesso (carrega só quando a pessoa abre a tela)
const LvEstante = lazy(() => import('./LivrosAvivar.jsx').then((m) => ({ default: m.Estante })))
const LvDetalhe = lazy(() => import('./LivrosAvivar.jsx').then((m) => ({ default: m.Detalhe })))
const LvFaixa = lazy(() => import('./LivrosAvivar.jsx').then((m) => ({ default: m.FaixaLivros })))
const LvEntrada = lazy(() => import('./LivrosAvivar.jsx').then((m) => ({ default: m.BibliotecaEntrada })))
const LvComprar = lazy(() => import('./LivrosAvivar.jsx').then((m) => ({ default: m.Comprar })))
const NarradorAvivar = lazy(() => import('./narrador/Narrador.jsx'))
const LvLeitorPdf = lazy(() => import('./LivrosAvivar.jsx').then((m) => ({ default: m.LeitorPdf })))
const LvLeitor = lazy(() => import('./LivrosAvivar.jsx').then((m) => ({ default: m.Leitor })))
const LvAdmin = lazy(() => import('./LivrosAvivar.jsx').then((m) => ({ default: m.AdminLivros })))
const EspiritoApp = lazy(() => import('./espirito/Espirito.jsx'))
import * as NS_quantica from './quantica.js'
import * as NS_meses from './mesesTab.js'
import * as NS_selos from './selos.js'
import * as NS_reforma from './reforma.js'
import * as NS_mesa from './reforma_mesa.js'
import * as NS_refTermos from './reforma_termos.js'
import * as NS_igrejas from './igrejas.js'
import * as NS_livrosProf from './livros_profetas.js'
import * as NS_ascEst from './ascensao_estudos.js'
import * as NS_jornada from './jornada_roteiro.js'
import * as NS_igrTermos from './igrejas_termos.js'
import * as NS_apo from './apocrifos.js'
import * as NS_apo2 from './apocrifos_etapa2.js'
import * as NS_apoT from './apocrifos_termos.js'
import * as NS_apoT2 from './apocrifos_termos2.js'
import { TERMOS_AP, CANON_LIVROS, CRITERIOS, MITOS, ENOQUE_LIVROS, SEMANAS, ANIMAIS, CORREL, USO_ENOQUE, TEMPO_ENOQUE, COMPARATIVO, PROMPTS_TABUA, EVANGELHOS_AP, ETIOPE_AP, OUTROS_EVANGELHOS, REGUA_CANONICOS, LINHA_AXUM } from './apocrifos.js'

const MINISTERIO = 'https://avivardoespirito.com.br'
const CHAVE = 'codigos-avivar-demo-v2'
const LIMITE_ANJO = 3

const slug = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const novoId = () => Math.random().toString(36).slice(2, 9)
const linhas = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean)
const preco = (v) => (v ? 'R$ ' + v : 'preço em breve')
const embed = (u) => {
  if (!u) return ''
  const m = u.match(/(?:youtu\.be\/|v=|embed\/|live\/)([\w-]{11})/)
  return m ? 'https://www.youtube.com/embed/' + m[1] : u
}

/* ───────────── DADOS INICIAIS ───────────── */

const livro = (titulo, autor, extra = {}) => ({
  id: slug(titulo), titulo, autor, sinopse: '', capaUrl: '', pdfUrl: '', pdfAtivo: false,
  precoPdf: '', fisico: 'embreve', precoFisico: '', amostra: '', demo: false, ...extra,
})
const gratis = (titulo) => ({ id: slug(titulo), titulo, autor: 'Kenneth Hagin', capaUrl: '', pdfUrl: '', pdfAtivo: false })
const tarefasPadrao = (ref) => `Ler ${ref}\nEstudar o contexto histórico da passagem\nRegistrar a minha reflexão no Diário do Profeta`
const exercicio = (titulo, tipo, minutos, ref, passos) => ({ id: slug(titulo), titulo, tipo, minutos, ref, passos, rascunho: true })
const termo = (titulo, etiqueta, definicao) => ({ id: slug(titulo), titulo, etiqueta, definicao })
const ETIQUETAS = ['CIÊNCIA ESTABELECIDA', 'INTERPRETAÇÃO TEOLÓGICA', 'HISTÓRIA', 'FILOSOFIA', 'HIPÓTESE', 'TESTEMUNHO']
const profeta = (titulo, papel, sinal, ref) => ({ id: slug(titulo), titulo, papel, sinal, ref })
const pilar = (titulo, texto, ref) => ({ id: slug(titulo), titulo, texto, ref })
const codigo = (titulo, chamada, ref) => ({ id: slug(titulo), titulo, chamada, ref })
const ABERTURA = 'Os Códigos Avivar são um treinamento profético para os últimos dias. Cremos que nasceram pelo agir do Espírito Santo de Deus, com um propósito claro: preparar homens e mulheres para reconhecer cada comando do Espírito, discernir as armadilhas e os enganos das trevas e caminhar com poder e equilíbrio na hora da grande batalha.\nUm povo. Uma escolha.'
const MUNDO = 'A tecnologia avança a passos largos. As máquinas aprendem a pensar um pouco mais a cada ano, e as pessoas, a viver como máquinas: conectadas o tempo todo, distraídas, programadas pelo que consomem e cada vez mais longe do silêncio onde Deus fala.\nCremos que os sinais do fim estão por toda parte (Mateus 24) e que muitos ainda dormem. Mas o Senhor chama a um despertar jamais visto sobre a face da terra (Romanos 13:11; Efésios 5:14).\nCremos que o Apocalipse se aproxima e que a hora pede homens e mulheres acordados, preparados e cheios do Espírito, para a grande batalha final.'
const monte = (titulo, ref, descricao) => ({ id: slug(titulo), titulo, ref, descricao, tarefas: tarefasPadrao(ref) })

// Textos de apoio de cada exercício: fundamento, para que serve e por que ler o texto. Todos seguem em RASCUNHO PARA REVISÃO do Pastor.
const TEXTOS_EX = {
  'silencio-diante-de-deus': {
    fundamento: `{{INTERPRETAÇÃO TEOLÓGICA}} Aquietar-se, na Bíblia, é parar de lutar com as próprias forças e reconhecer quem Deus é. O Salmo 46 descreve a terra tremendo e as nações em tumulto e, no meio disso, ouve-se: "Aquietai-vos e sabei que eu sou Deus" (Salmos 46:10). Elias ouviu o Senhor num cicio suave (1 Reis 19:11-13), e Jesus se retirava a lugares solitários para orar (Lucas 5:16).`,
    serve: `{{INTERPRETAÇÃO TEOLÓGICA}} Serve para desacelerar, entregar a ansiedade e deixar o coração atento a Deus, cuja voz se confirma sempre pela Palavra (Filipenses 4:6-7; 1 Pedro 5:7).

{{CIÊNCIA ESTABELECIDA}} Respirar devagar ajuda o corpo a reduzir a tensão. É um apoio físico, e não uma técnica espiritual.`,
    porque: `{{INTERPRETAÇÃO TEOLÓGICA}} O Salmo 46 é um salmo de refúgio: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia" (Salmos 46:1). O versículo 10 só se entende nesse quadro: a calma vem de saber quem é o Senhor. O silêncio cristão não é esvaziar a mente. É voltar a atenção a Deus e à sua Palavra (Salmos 119:15).`,
  },
  'os-ceus-proclamam': {
    fundamento: `{{INTERPRETAÇÃO TEOLÓGICA}} A criação fala de Deus sem usar palavras: "Os céus declaram a glória de Deus" (Salmos 19:1). Paulo diz que o poder eterno e a divindade de Deus se percebem pelas coisas criadas (Romanos 1:20). Meditar, na Bíblia, é repetir e pensar devagar na Palavra, dia e noite (Salmos 1:2; 119:15).`,
    serve: `{{INTERPRETAÇÃO TEOLÓGICA}} Serve para aprender a olhar a criação como convite à adoração e para treinar a atenção em uma frase da Escritura até ela se tornar oração.`,
    porque: `{{INTERPRETAÇÃO TEOLÓGICA}} O Salmo 19 tem duas partes: a criação (versículos 1 a 6) e a Lei do Senhor (7 a 14). O céu mostra que Deus é glorioso. A Palavra mostra quem ele é e o que ele quer. Por isso começamos pelo céu e voltamos à Palavra.

{{CIÊNCIA ESTABELECIDA}} A astronomia estima centenas de bilhões de galáxias no universo observável. Esse fato não prova Deus, mas ajuda a pensar com reverência.`,
  },
  'contemplacao-da-criacao': {
    fundamento: `{{INTERPRETAÇÃO TEOLÓGICA}} Davi olhou para o céu à noite e perguntou: "Que é o homem, para que dele te lembres?" (Salmos 8:4). Contemplar é olhar com reverência e deixar a criação e o texto conduzirem à adoração. Isaías convida: "Levantai ao alto os vossos olhos e vede quem criou estas coisas" (Isaías 40:26).`,
    serve: `{{INTERPRETAÇÃO TEOLÓGICA}} Serve para dar a dimensão certa às coisas: pequenos diante da grandeza de Deus, e mesmo assim lembrados e cuidados por ele. Isso produz humildade e gratidão, e enfraquece a autossuficiência.`,
    porque: `{{INTERPRETAÇÃO TEOLÓGICA}} O Salmo 8 abre e fecha com o louvor: "Ó Senhor, Senhor nosso, quão admirável é o teu nome em toda a terra!" (Salmos 8:1, 9). O espanto de Davi não termina na criação. Termina no Criador.

{{CIÊNCIA ESTABELECIDA}} A luz das estrelas que vemos saiu delas há muito tempo, por isso olhar o céu é, de certo modo, olhar o passado. Esse fato não prova Deus. Apenas ajuda a pensar com reverência.`,
  },
  'oracao-de-gratidao': {
    fundamento: `{{INTERPRETAÇÃO TEOLÓGICA}} "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco" (1 Tessalonicenses 5:18). A gratidão é um mandamento e uma prática da vida de oração (Salmos 100:4; Filipenses 4:6; Colossenses 3:15-17). Jesus deu graças antes de repartir o pão e antes de chamar Lázaro (João 6:11; 11:41).`,
    serve: `{{INTERPRETAÇÃO TEOLÓGICA}} Serve para treinar o olhar a enxergar o que Deus já fez. Dar graças "em tudo" não é fingir que a dor não existe: o salmista chorava e, mesmo assim, confiava (Salmos 13).`,
    porque: `{{INTERPRETAÇÃO TEOLÓGICA}} Paulo escreve a uma igreja que passava por perseguição (1 Tessalonicenses 1:6; 2:14). Ele não pede um sentimento, e sim uma escolha: dar graças pelo que Deus fez e continua a fazer.

{{CIÊNCIA ESTABELECIDA}} Pesquisas em psicologia associam o hábito de anotar motivos de gratidão a uma maior sensação de bem-estar. Isso não promete resultado e não substitui o cuidado profissional de saúde.`,
  },
}

// Os estudos da sala Estudos Proféticos. Sem texto ainda: aparecem como "em preparação" até o Pastor colar o estudo pelo painel.
const estudoProf = (titulo, modalidade, etiqueta, resumo, ref, id) => ({ id: id || slug(titulo), titulo, modalidade, etiqueta, resumo, ref, imagem: '', texto: '', rascunho: false })
const ESTUDOS_PROF = [
  estudoProf('Samuel', 'Vida dos Profetas', 'INTERPRETAÇÃO TEOLÓGICA', 'O menino que ouviu o seu nome três vezes e aprendeu a dizer: "Fala, Senhor, porque o teu servo ouve".', '1 Samuel 3:1-21; 7:5-9; 12:18-23; 16:1-13'),
  estudoProf('Davi', 'Vida dos Profetas', 'INTERPRETAÇÃO TEOLÓGICA', 'O pastor, rei e salmista cujas palavras o Novo Testamento reconhece como inspiradas pelo Espírito.', '1 Samuel 16:13; 2 Samuel 23:1-2; Atos 1:16; 2:29-31; Salmos 16:10; 110:1'),
  estudoProf('Isaías', 'A Mensagem', 'INTERPRETAÇÃO TEOLÓGICA', 'A visão do trono, a brasa que toca os lábios e as promessas que se cumprem em Jesus.', 'Isaías 6:1-8; 7:14; 9:6-7; 53:1-12; 61:1-2; Lucas 4:17-21'),
  estudoProf('A profecia antes e depois do Pentecostes', 'Estudo de Caso', 'INTERPRETAÇÃO TEOLÓGICA', 'O que mudou e o que continua igual: do Espírito sobre alguns ao Espírito derramado sobre todos os que creem.', 'Números 11:25-29; Joel 2:28-29; Atos 2:1-21; Jeremias 31:33; 1 Coríntios 12 e 14', 'pentecostes'),
  estudoProf('O Chamado', 'Estudo de Caso', 'INTERPRETAÇÃO TEOLÓGICA', 'Como a Bíblia mostra o chamado de Deus, como ele é reconhecido e como ele é confirmado.', '1 Samuel 3:1-10; Êxodo 3; Jeremias 1:4-10; Romanos 11:29; 1 João 4:1'),
  estudoProf('O Silêncio', 'Estudo de Caso', 'INTERPRETAÇÃO TEOLÓGICA', 'O cicio suave de Elias, o aquietar-se do salmista e a meia hora de silêncio no céu.', '1 Reis 19:11-13; Salmos 46:10; Habacuque 2:20; Apocalipse 8:1'),
  estudoProf('Portais Avivar', 'Estudo de Caso', 'INTERPRETAÇÃO TEOLÓGICA', 'A porta verdadeira é Cristo. O que a Bíblia diz sobre entrar, discernir e ser ensinado pelo Espírito.', 'João 10:9; Gênesis 28:10-17; Salmos 24:7-10; Mateus 7:13-14; 1 Coríntios 2:10-14'),
  estudoProf('Selos Avivar', 'Estudo de Caso', 'INTERPRETAÇÃO TEOLÓGICA', 'A diferença entre os selos de Deus, que só o Cordeiro abre, e os Selos Avivar, marcas de estudo do aplicativo.', 'Apocalipse 5:1-5; Daniel 12:4; Efésios 1:13; 2 Timóteo 2:15; Atos 17:11'),
]

// Cópia própria dos dados iniciais: o banco local nunca divide objetos com os textos fixos (que recebem o conteúdo completo do servidor).
function clonar(x) {
  if (Array.isArray(x)) return x.map(clonar)
  if (x && typeof x === 'object' && Object.getPrototypeOf(x) === Object.prototype) { const r = {}; for (const k of Object.keys(x)) r[k] = clonar(x[k]); return r }
  return x
}
const SEED = clonar({
  config: {
    aoVivoLivre: 'sim',
    espiritoQuerubim: 'não',
    espiritoAnjo: 'não',
    remetenteNome: 'Códigos Avivar — Ministério Avivar do Espírito',
    remetenteEndereco: '',
    agradecimento: 'Obrigado pela sua compra. Que esta leitura edifique a sua vida.',
    oQueSao: '',
    aoVivoAtivo: 'não',
    aoVivoUrl: '',
    aoVivoTitulo: '',
  },
  livros: [
    ...LIVROS,
    livro('Livro de demonstração', 'Exemplo para testar a compra', {
      demo: true, pdfAtivo: true, fisico: 'disponivel',
      sinopse: 'Livro fictício, criado só para testar o caminho de compra em PDF e em livro físico. Remova pelo painel do admin quando quiser.',
    }),
  ],
  biblioteca: BIBLIOTECA,
  reportagens: REPORTAGENS,
  tv: [
    { id: 'apresentacao-codigos-avivar', titulo: 'Apresentação dos Códigos Avivar', tipo: 'Mensagem', url: 'https://youtu.be/YaOJUgFyTCM', descricao: 'Em 30 segundos, conheça os Códigos Avivar.', livre: 'sim' },
  ],
  cupons: [],
  cursos: [
    { id: 'curso-demo', titulo: 'Curso de demonstração', categoria: 'Fundamentos', descricao: 'Curso fictício para mostrar como ficam as aulas em vídeo, texto e livro. Remova pelo painel do admin.', demo: true },
    { id: 'fisica-quantica-e-espiritualidade', titulo: 'Física Quântica e Espiritualidade', categoria: 'Fé e Ciência', area: 'Sala Quântica', descricao: '' },
  ],
  aulas: [
    { id: 'aula-demo-1', cursoId: 'curso-demo', titulo: 'Aula 1 — vídeo', tipo: 'video', url: '', texto: '' },
    { id: 'aula-demo-2', cursoId: 'curso-demo', titulo: 'Aula 2 — texto', tipo: 'texto', url: '', texto: 'O texto da aula aparece aqui. O admin escreve ou cola o conteúdo pelo painel.' },
    { id: 'aula-demo-3', cursoId: 'curso-demo', titulo: 'Aula 3 — livro de apoio', tipo: 'livro', url: '', texto: '' },
  ],
  salas: [
    { id: 'celestial', titulo: 'Celestial', descricao: 'Céu noturno, estrelas e luz dourada.' },
    { id: 'mistico', titulo: 'Místico', descricao: 'Púrpura profundo, névoa e partículas de luz.' },
    { id: 'angelical', titulo: 'Angelical', descricao: 'Luz branca e dourada, arquitetura abstrata.' },
    { id: 'rio', titulo: 'Rio', descricao: 'Água, névoa e luz azul.' },
    { id: 'deserto', titulo: 'Deserto', descricao: 'Areia, montanhas distantes e céu estrelado.' },
    { id: 'montanha', titulo: 'Montanha', descricao: 'Montanhas, nuvens e vento.' },
    { id: 'presenca', titulo: 'Presença', descricao: 'Ambiente claro, simples e contemplativo.' },
  ],
  montanhas: [
    monte('Mar Vermelho', 'Êxodo 14', 'A travessia: o povo sai do Egito.'),
    monte('Monte Sinai', 'Êxodo 19 e 20', 'A aliança e os mandamentos.'),
    monte('Rio Jordão', 'Josué 3', 'A entrada na terra prometida.'),
    monte('Muralhas de Jericó', 'Josué 6', 'A primeira conquista.'),
    monte('Monte Carmelo', '1 Reis 18', 'Elias e os profetas de Baal.'),
    monte('Monte Horebe', '1 Reis 19', 'Elias diante de Deus no monte.'),
  ],
  estudos: [
    { id: 'vida', titulo: 'Vida dos Profetas', descricao: 'A biografia de cada profeta da Bíblia, do chamado ao fim do ministério.' },
    { id: 'tempo', titulo: 'O Profeta e o Seu Tempo', descricao: 'Contexto histórico: reis, povos, geografia e costumes da época.' },
    { id: 'mensagem', titulo: 'A Mensagem', descricao: 'O que cada profeta anunciou, a quem e em que situação.' },
    { id: 'linha', titulo: 'Linha do Tempo Profética', descricao: 'Os profetas em ordem cronológica, lado a lado com a história de Israel.' },
    { id: 'caso', titulo: 'Estudo de Caso', descricao: 'Um episódio por vez: texto bíblico, contexto, interpretação e aplicação.' },
    { id: 'desafio', titulo: 'Desafio da Porta Profética', descricao: 'Perguntas e respostas com explicação e referência bíblica.' },
  ],
  quantica: [
    { id: 'energia-quantica', titulo: 'Energia quântica e espiritualidade', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: '' },
    { id: 'fisica-da-fe', titulo: 'A Física da Fé e o Campo de Poder (Mãos de Moisés em Refidim)', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: '' },
    ...TEMAS,
  ],
  exercicios: [
    exercicio('Silêncio diante de Deus', 'Silêncio', '5', 'Salmo 46:10',
      'Sente-se em um lugar tranquilo e desligue as notificações\nRespire devagar, acompanhando o círculo na tela\nLeia o Salmo 46:10 uma vez, sem pressa\nPermaneça em silêncio até o tempo terminar\nAnote uma frase sobre o que você percebeu'),
    exercicio('Os céus proclamam', 'Meditação bíblica', '10', 'Salmo 19:1-6',
      'Leia o Salmo 19:1-6 em voz baixa\nEscolha o versículo que mais chamou a sua atenção\nRepita esse versículo devagar, algumas vezes\nOre com as suas próprias palavras a partir dele\nAnote o versículo no seu caderno de estudo'),
    exercicio('Contemplação da criação', 'Contemplação', '10', 'Salmo 8:3-4',
      'Leia o Salmo 8:3-4\nObserve o céu, ou a tela estelar desta sala, por alguns minutos\nPergunte-se: o que este texto diz sobre Deus e sobre o ser humano?\nAgradeça em oração\nAnote uma pergunta que ficou para estudar depois'),
    exercicio('Oração de gratidão', 'Oração', '5', '1 Tessalonicenses 5:18',
      'Leia 1 Tessalonicenses 5:18\nListe três motivos de gratidão de hoje\nApresente cada um a Deus em oração\nTermine em silêncio por um minuto'),
  ].map((x) => ({ ...x, ...(TEXTOS_EX[x.id] || {}) })),
  estudosProf: ESTUDOS_PROF,
  esferasTab: ESFERAS,
  marcosOracao: MARCOS,
  glossario: [
    termo('Quantum', 'CIÊNCIA ESTABELECIDA', 'A menor porção de energia que pode ser trocada em uma interação. O fóton, por exemplo, é o quantum da luz.'),
    termo('Superposição', 'CIÊNCIA ESTABELECIDA', 'Antes de ser medido, um sistema quântico é descrito por uma combinação de estados possíveis. A medição dá um único resultado.'),
    termo('Emaranhamento', 'CIÊNCIA ESTABELECIDA', 'Duas partículas podem ter estados ligados entre si: o resultado medido em uma está correlacionado com o da outra, mesmo à distância. Isso não permite enviar mensagens mais rápido que a luz.'),
    termo('Medição (o "observador")', 'CIÊNCIA ESTABELECIDA', 'Medir um sistema quântico altera o seu estado. Na física, "observador" é qualquer aparelho de medida; não exige uma consciência humana.'),
    termo('Princípio da incerteza', 'CIÊNCIA ESTABELECIDA', 'Não é possível conhecer ao mesmo tempo, com precisão ilimitada, a posição e a quantidade de movimento de uma partícula.'),
    termo('Energia (na física)', 'CIÊNCIA ESTABELECIDA', 'Grandeza que mede a capacidade de realizar trabalho. É medida em joules e se conserva.'),
    termo('Energia (no uso espiritual)', 'INTERPRETAÇÃO TEOLÓGICA', 'Quando esta sala fala em energia no sentido espiritual, usa linguagem de fé e de analogia. Não é uma grandeza medida pela física. Rascunho para revisão do Pastor Marcos.'),
  ],
  profetas: [
    profeta('Adão', 'O primeiro a ouvir a voz de Deus', 'Ouviu a voz de Deus no jardim, conversou com Ele e recebeu do próprio Deus, diretamente, a instrução sobre o que podia e o que não podia fazer. Essa palavra chegou a Eva, que a repete em Gênesis 3:2-3. Deu nome a cada ser vivo e, ao ver Eva, declarou: "Esta é osso dos meus ossos e carne da minha carne". Ali começou a comunhão entre Deus e o homem, e com ela o ouvir profético: receber de Deus e passar adiante.', 'Gênesis 2:16-24; 3:2-3; 3:8-13'),
    profeta('Noé', 'O que avisou sobre o que ainda não se via', 'Deus falou com ele e lhe revelou o juízo que vinha, com as instruções para construir a arca. Noé obedeceu pela fé, foi pregador da justiça e salvou a sua família enquanto o mundo seguia a vida normal.', 'Gênesis 6:13-22; 7:1; 9:1-17; Hebreus 11:7; 2 Pedro 2:5; Mateus 24:37-39'),
    profeta('Abraão', 'O amigo de Deus', 'Ouviu o chamado de Deus para sair da sua terra, recebeu promessas e conversou com o Senhor, intercedendo por cidades inteiras. Foi chamado de profeta pelo próprio Deus, que o escolheu para ordenar aos seus filhos e à sua casa o caminho do Senhor.', 'Gênesis 12:1-3; 15:1-6; 18:17-33; 20:7'),
    profeta('Moisés', 'O libertador', 'Deus falou com ele na sarça ardente e, depois, face a face, como alguém fala com um amigo. Recebeu a aliança e os mandamentos no Sinai e contou ao povo todas as palavras do Senhor. Feriu o Egito com sinais e abriu o Mar Vermelho. Em Refidim, enquanto as suas mãos estavam erguidas, Israel prevalecia.', 'Êxodo 3; 7 a 14; 17:8-13; 19 a 24; 33:11; Deuteronômio 34:10'),
    profeta('Josué', 'O que entrou na terra prometida', 'Depois da morte de Moisés, o Senhor falou com ele e lhe deu instruções para atravessar o Jordão e para a queda de Jericó. Josué as passou aos sacerdotes e ao povo, viu o Jordão se abrir, as muralhas caírem e o sol se deter sobre Gibeão.', 'Josué 1:1-9; 3:7-13; 6:2-10; 10:12-14'),
    profeta('Samuel', 'O que aprendeu a ouvir', 'Ainda menino, no santuário, ouviu o Senhor chamá-lo pelo nome e, orientado por Eli, aprendeu a responder: "Fala, Senhor, que o teu servo ouve". O Senhor estava com ele e nenhuma das suas palavras caiu por terra, e todo o Israel soube que Samuel era confirmado como profeta do Senhor. Intercedeu pelo povo e ungiu Saul e, depois, Davi, por ordem de Deus.', '1 Samuel 3:1-21; 7:5-9; 12:23; 16:1-13'),
    profeta('Davi', 'O rei que profetizou', 'Ungido por Samuel ainda jovem, o Espírito do Senhor veio sobre ele desde aquele dia. Ele mesmo diz: "O Espírito do Senhor fala por meu intermédio, e a sua palavra está na minha língua". Pedro o chama de profeta e mostra que os seus salmos apontavam para o Messias. Foi adorador, intercessor e homem que buscava o coração de Deus.', '1 Samuel 16:13; 2 Samuel 23:1-2; Atos 1:16; 2:29-31; Salmos 16:10; 110:1'),
    profeta('Elias', 'O fogo sobre o Carmelo', 'A palavra do Senhor veio a ele, e ele a levou ao rei: anunciou a seca. Multiplicou o azeite e a farinha de uma viúva, orou por um menino que voltou à vida e fez descer fogo no Carmelo. No Horebe, ouviu Deus num cicio suave e recebeu novas ordens.', '1 Reis 17 a 19'),
    profeta('Eliseu', 'A porção dobrada', 'Seguiu Elias, pediu e recebeu a porção dobrada do seu espírito. Falava "assim diz o Senhor" ao povo e aos reis: purificou águas, viu Naamã ser curado da lepra e fez o ferro de um machado flutuar.', '2 Reis 2; 3:11-17; 5; 6:1-7'),
    profeta('Isaías', 'A visão do trono', 'No ano em que morreu o rei Uzias, viu o Senhor assentado num trono alto e elevado e ouviu os serafins. Purificado, respondeu ao chamado: "Eis-me aqui, envia-me a mim". Anunciou o Messias séculos antes, e Jesus leu uma das suas profecias na sinagoga de Nazaré e disse que ela se cumpria naquele dia.', 'Isaías 6:1-8; 7:14; 9:6-7; 53:1-12; 61:1-2; Lucas 4:17-21'),
    profeta('Jesus', 'O cumprimento de todos os profetas', 'O Filho ouve o Pai e fala o que o Pai lhe deu a dizer. Transformou água em vinho, abriu os olhos de um cego de nascença, ressuscitou Lázaro e venceu a morte. Os sinais apontam para quem Ele é: a razão de toda profecia.', 'João 2; 5:19; 8:28; 9; 11; 12:49-50; Atos 3:22; Apocalipse 19:10'),
    profeta('Os apóstolos', 'O Espírito derramado', 'No Pentecostes o Espírito foi derramado, e eles passaram a falar o que Ele dava. Em Antioquia, o Espírito Santo falou à igreja que separasse Barnabé e Saulo. Um coxo andou à porta do templo, portas de prisão foram abertas e Deus operava milagres extraordinários pelas mãos de Paulo.', 'Atos 2; 3; 13:1-3; 16:25-26; 19:11'),
  ],
  dom: [
    { id: 'antiga-alianca', titulo: 'Antiga Aliança: o profeta', lista: true, ref: 'Êxodo 20:18-19; Números 11:25-29; 1 Samuel 10:5-13; Jeremias 1:5',
      texto: 'Poucos profetizavam, e o povo ouvia a Deus por meio do profeta (Êxodo 20:19)\nO Espírito vinha sobre pessoas escolhidas, em geral por um tempo e para uma missão (Números 11:25; 1 Samuel 10:10)\nAlguns foram chamados desde o ventre (Jeremias 1:5)\nMoisés desejou que todo o povo do Senhor fosse profeta (Números 11:29), e Joel anunciou que isso viria (Joel 2:28-29)' },
    { id: 'nova-alianca', titulo: 'Nova Aliança: o dom de profecia', lista: true, ref: 'Atos 2:17-18; 1 Coríntios 12:7-11; 14:1-5, 29; Efésios 4:11',
      texto: 'No Pentecostes o Espírito foi derramado sobre toda a carne: filhos e filhas, jovens e velhos, servos e servas (Atos 2:17-18)\nO dom é repartido pelo Espírito a cada um como Ele quer, para o proveito comum (1 Coríntios 12:7 e 11)\nNão é dado a todos (1 Coríntios 12:29), e serve para edificação, exortação e consolação (1 Coríntios 14:3)\nA igreja julga o que é dito, à luz da Palavra (1 Coríntios 14:29; 1 Tessalonicenses 5:20-21)\nAo lado do dom, Cristo ainda concede à igreja o ministério de profeta (Efésios 4:11)' },
    { id: 'filhas-de-filipe', titulo: 'As filhas de Filipe', lista: false, ref: 'Atos 21:8-9; Atos 2:17; Lucas 2:36',
      texto: 'Em Cesareia, Paulo ficou na casa de Filipe, o evangelista, que tinha quatro filhas virgens que profetizavam (Atos 21:8-9). O texto usa o verbo \"profetizavam\", uma ação contínua, e não o título \"profetisas\". No Novo Testamento esse título é dado a Ana (Lucas 2:36), que viveu antes do Pentecostes.\nLucas não diz quando elas começaram a profetizar nem se nasceram assim. O que o relato mostra é o cumprimento do que Joel anunciou e Pedro repetiu no Pentecostes: \"vossas filhas profetizarão\" (Atos 2:17). Por isso lemos o caso como dom do Espírito, e não como uma classe de pessoas.' },
  ],
  pilares: [
    pilar('Identificar o comando do Espírito', 'Aprender a reconhecer a voz do Senhor entre tantas vozes: o que é Palavra, o que é impressão, o que é desejo próprio. O Espírito conduz, e a Escritura confirma.', 'João 10:27; 1 Reis 19:12'),
    pilar('Discernir as armadilhas das trevas', 'O engano mais perigoso é o que parece luz. O profeta treina para provar os espíritos, comparar tudo com a Palavra e reconhecer a mentira antes que ela se instale.', 'Mateus 24:4; 2 Coríntios 11:14; 1 João 4:1'),
    pilar('Equilibrar o poder', 'O Senhor derramou muito sobre os seus filhos, e poder sem caráter, ordem e humildade vira dano. Aqui se treina o equilíbrio entre dom, fruto e submissão.', '1 Coríntios 14:32 e 40; Gálatas 5:22-23'),
    pilar('Ser instrumento nas mãos de Deus', 'O profeta não é o centro. Pedro, diante do coxo curado, perguntou por que olhavam para ele. Treinar é aprender a servir sem tomar a glória.', 'Atos 3:12-13'),
    pilar('Travar e vencer a batalha', 'A luta não é contra carne e sangue. Aprender a vestir a armadura de Deus, interceder, resistir e permanecer de pé quando o dia mau chegar.', 'Efésios 6:10-18'),
    pilar('Glorificar o nome de Jesus', 'Todo dom, toda revelação e todo sinal existem para apontar para o Cristo amado. O testemunho de Jesus é o espírito da profecia.', 'Apocalipse 19:10; João 16:14'),
  ],
  selos: [
    codigo('Portais', 'Jacó acordou e disse que aquele lugar era a porta do céu. O que a Bíblia chama de portal, e o que ela diz sobre atravessá-lo?', 'Gênesis 28:10-17'),
    codigo('As Horas', 'Há horas marcadas na Palavra: a hora de Jesus, a hora da oração, a hora do juízo. O que as Escrituras revelam sobre elas?', 'João 2:4; 12:23'),
    codigo('O Campo de Poder', 'Em Refidim, enquanto as mãos de Moisés estavam erguidas, Israel prevalecia. Que princípio se esconde naquela cena?', 'Êxodo 17:8-13'),
    codigo('Fé e Comunhão', 'A fé que move montanhas e a linha fina entre comunhão e manipulação.', 'Mateus 17:20'),
    codigo('Discernimento', 'Como distinguir a voz de Deus do engano mais sutil, e o dom verdadeiro do falso brilho?', '1 Coríntios 12:10; 1 João 4:1'),
    codigo('Energia e Espírito', 'O que a ciência afirma, o que a Escritura afirma e onde cada uma termina. Aqui nada se mistura sem etiqueta.', 'Sala Quântica'),
    codigo('O Chamado', 'Samuel foi chamado pelo nome três vezes antes de saber que era o Senhor. O que a Bíblia revela sobre ouvir o chamado, reconhecê-lo e responder?', '1 Samuel 3:1-10; Jeremias 1:5; Romanos 11:29'),
    codigo('O Silêncio', 'Elias não achou o Senhor no vento, no terremoto nem no fogo, mas num cicio suave. O que Deus ensina no silêncio, e por que o céu se calou por meia hora em Apocalipse 8:1?', '1 Reis 19:11-13; Salmos 46:10; Apocalipse 8:1'),
    codigo('Reservado ao Cume', 'Há um código que só se abre a quem completar a subida.', 'Montanha Profética'),
  ],
  planos: [
    { id: 'anjo', titulo: 'Anjo', frase: 'O anjo é o mensageiro — o primeiro a anunciar a boa nova. Este é o seu ponto de partida em Códigos Avivar: gratuito, sempre aberto, para que ninguém fique de fora do chamado.', precoSemestral: 'Gratuito', precoAnual: 'Gratuito',
      recursos: 'Biblioteca Avivar\nAmostra de 15 páginas dos livros\nCompra de livros em PDF e físico\nON LINE e cursos básicos\nEtapas iniciais da Jornada\n3 entradas na Sala Profética\nDiário do Profeta' },
    { id: 'querubim', titulo: 'Querubim', frase: 'Os querubins guardavam a entrada do Éden e contemplavam de perto a glória de Deus. Neste nível os véus começam a se abrir: livros completos, estudos mais profundos e ferramentas práticas para a sua caminhada.', precoSemestral: '', precoAnual: '',
      recursos: 'Tudo do plano Anjo\nLivros completos liberados para o plano\nEstudos e vídeo-aulas parciais\nExercícios guiados\nSala Profética sem limite de entradas' },
    { id: 'serafim', titulo: 'Serafim', frase: 'Os serafins estão ao redor do trono, na presença mais íntima da glória (Isaías 6). Este é o nível mais pleno de Códigos Avivar — tudo liberado, para quem deseja viver na frequência mais alta da revelação.', precoSemestral: '', precoAnual: '',
      recursos: 'Tudo liberado\nEstudos e vídeo-aulas completos\nTodos os ambientes da Sala Profética\nCódigos do Espírito (estudo por tema, letras e números)\nLançamentos em primeira mão\nCertificados dos cursos concluídos' },
  ],
  termosAp: TERMOS_AP.map((t) => ({ ...t })),
  mitosAp: MITOS.map((m) => ({ ...m, titulo: m.mito })),
  enoqueLivros: ENOQUE_LIVROS.map(({ cenas, numCaps, ...l }) => ({ ...l, titulo: l.nome, rascunho: true })),
  correlacoesEn: CORREL.map((c) => ({ ...c, titulo: c.tema })),
  promptsTabua: PROMPTS_TABUA.map((x) => ({ ...x })),
  evangelhosAp: EVANGELHOS_AP.map((x) => ({ ...x })),
  etiopeAp: ETIOPE_AP.map((x) => ({ ...x })),
  livrosRef: LIVROS_DEUTERO.map((x) => ({ ...x })),
  argumentosRef: ARGUMENTOS_REF.map((x) => ({ ...x })),
  eventosRef: EVENTOS_REF.map((x) => ({ ...x })),
  personagensRef: PERSONAGENS_REF.map((x) => ({ ...x })),
  estudosMesa: ESTUDOS_MESA.map((x) => ({ ...x })),
  igrejasProt: IGREJAS.map((x) => ({ ...x })),
  correlacoesRef: CORREL_REF.map((x) => ({ ...x })),
  promptsRef: PROMPTS_REF.map((x) => ({ ...x })),
  selosEfode: SELOS_EFODE.map((x) => ({ ...x })),
  vestes: VESTES_PADRAO.map((x) => ({ ...x })),
  promptsSelos: PROMPTS_SELOS.map((x) => ({ ...x })),
  tabernaculo: [
    { id: 'abertura', titulo: 'Abertura do Tabernáculo', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: '', ref: 'Êxodo 25:8; 33:7-11; Hebreus 4:16; 8:5; João 1:14; Ezequiel 48:30-35; Mateus 8:11; Lucas 13:29; João 10:9; 14:6; Apocalipse 21:12-14,21,25',
      texto: `{{INTERPRETAÇÃO TEOLÓGICA}} O Tabernáculo de Oração é a sala em que todas as outras se encontram. Cada sala dos Códigos Avivar mostra um lado do encontro com Deus: o céu, o mistério, os anjos, a ciência, o rio, o deserto, o monte e a presença. Aqui elas deixam de ser caminhos separados e se recolhem em um só ato, a oração.

Ao redor do tabernáculo estão doze esferas, número que a Bíblia liga ao governo de Deus sobre o seu povo: as doze tribos de Israel, os doze apóstolos e os doze meses do ano. Cada esfera é um mês do calendário bíblico e, neste aplicativo, uma dimensão de oração para estudo. Quem ora, escolhe uma delas, recolhe as esferas e permanece diante de Deus pelo tempo que decidiu.

Por que um tabernáculo

{{HISTÓRIA}} O tabernáculo foi a tenda que Deus mandou Moisés construir no deserto, para que Ele habitasse no meio do povo (Êxodo 25:8). A tenda do encontro era o lugar onde o Senhor falava com Moisés face a face, como alguém fala com um amigo (Êxodo 33:7-11).

{{INTERPRETAÇÃO TEOLÓGICA}} A carta aos Hebreus lê o tabernáculo como figura das realidades celestiais, feito segundo o modelo mostrado a Moisés no monte (Êxodo 25:40; Hebreus 8:5; 9:23-24). Por meio de Jesus o acesso a Deus está aberto: podemos nos chegar com confiança ao trono da graça (Hebreus 4:16; 10:19-22). João diz que a Palavra "habitou" entre nós, verbo que lembra armar uma tenda (João 1:14), e Jesus promete que o Pai e o Filho farão morada em quem o ama (João 14:23). Hoje o corpo do cristão é santuário do Espírito Santo (1 Coríntios 6:19), e a visão final da Bíblia é a de Deus morando com os homens (Apocalipse 21:3).

A oração de Jesus passou por todas as salas

{{INTERPRETAÇÃO TEOLÓGICA}} O Evangelho de Lucas mostra Jesus orando com frequência. Ao olhar esses momentos, vemos cada sala dos Códigos aparecer dentro de uma oração:
• No Jordão, depois de batizado, Jesus estava orando e o céu se abriu (Lucas 3:21-22). Rio e céu.
• Em lugares desertos, Ele se retirava para orar (Marcos 1:35; Lucas 5:16). Deserto.
• No monte, passou a noite orando antes de escolher os doze (Lucas 6:12). Montanha.
• No monte, enquanto orava, o aspecto do seu rosto mudou e as suas vestes resplandeceram (Lucas 9:28-29). Místico.
• No Getsêmani, orando, um anjo do céu o fortaleceu (Lucas 22:41-43; alguns manuscritos antigos não trazem os versículos 43 e 44). Angelical.
• Levantou os olhos ao céu e agradeceu ao Pai antes de chamar Lázaro (João 11:41) e orou pelos seus discípulos (João 17:1). Celestial e presença.

{{INTERPRETAÇÃO TEOLÓGICA}} Em todas essas cenas, o que reúne os ambientes é a oração. Dessa leitura nasce a ideia deste lugar: se a oração atravessa todas as salas, ela pode também reunir todas elas. Aqui, o Pastor Marcos Fagner ensina a entrar em cada sala pelo caminho da oração e a perceber que, quando as esferas se recolhem, resta o encontro com o Pai.

Os doze portais celestiais

{{INTERPRETAÇÃO TEOLÓGICA}} A Bíblia não fala em "portais" que o homem abre ou conquista, e sim em portas, e a mais importante delas está no último livro. João viu a cidade santa, a nova Jerusalém, descendo do céu, com uma muralha grande e alta e doze portas. Em cada porta havia um anjo, e sobre as portas estavam escritos os nomes das doze tribos de Israel: três portas ao oriente, três ao norte, três ao sul e três ao ocidente (Apocalipse 21:12-13). Os fundamentos da muralha trazem os nomes dos doze apóstolos do Cordeiro (Apocalipse 21:14). As doze portas são doze pérolas, cada porta feita de uma só pérola, e jamais se fecharão (Apocalipse 21:21,25).

{{INTERPRETAÇÃO TEOLÓGICA}} O profeta Ezequiel já havia visto a cidade com doze portas, com os nomes das tribos e três em cada lado, e o nome da cidade será "O Senhor está ali" (Ezequiel 48:30-35). As portas abertas para os quatro lados lembram que o convite alcança todos: Jesus disse que muitos virão do oriente e do ocidente e se assentarão à mesa no Reino (Mateus 8:11; Lucas 13:29).

• Quem é a porta? O próprio Jesus: "Eu sou a porta; se alguém entrar por mim, será salvo" (João 10:9). E Ele é o caminho para o Pai (João 14:6).
• O que as doze portas ensinam? Que o povo de Deus, das doze tribos e dos doze apóstolos, é um só povo, e que a entrada é pela graça, e não por técnica.
• E as doze esferas deste lugar? São uma leitura de estudo: doze meses, doze dimensões de oração. Elas não são lugares a conquistar nem um ritual que abre o céu. A oração não abre portas por si mesma: ela nos leva a Aquele que já abriu o caminho.

{{INTERPRETAÇÃO TEOLÓGICA}} O desenho que acompanha este texto mostra doze portas de pérola, em quatro grupos de três, cada uma tocada pela luz de uma esfera. Ele ilustra a promessa de Apocalipse 21, e nada além disso.` },
    { id: 'celestial', titulo: 'Celestial', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: 'O primeiro gesto de quem ora é levantar os olhos. Na oração, o céu inteiro cabe em um olhar dirigido ao Pai.', ref: 'Salmos 8:3-4; 19:1-4; Isaías 40:26; Mateus 6:9; João 11:41; 17:1; Apocalipse 4 e 5',
      texto: `O que esta sala mostra

{{INTERPRETAÇÃO TEOLÓGICA}} O céu estrelado é a primeira pregação da criação: os céus declaram a glória de Deus (Salmo 19:1-4) e levam o salmista a perguntar o que é o homem para merecer o cuidado do Criador (Salmo 8:3-4). Isaías convida: levantai os olhos e vede quem criou todas essas coisas (Isaías 40:26).

Por que a oração a recolhe

{{INTERPRETAÇÃO TEOLÓGICA}} Na Bíblia, o primeiro gesto de quem ora costuma ser olhar para cima. Jesus levantou os olhos ao céu para abençoar o pão (Marcos 6:41), para agradecer antes de chamar Lázaro (João 11:41) e para orar pelos seus (João 17:1). Ensinou a começar assim: "Pai nosso, que estás nos céus" (Mateus 6:9). Em Apocalipse 4 e 5 o céu aparece como uma sala de adoração. Na oração, o céu inteiro cabe em um olhar dirigido ao Pai.

{{CIÊNCIA ESTABELECIDA}} A astronomia estima centenas de bilhões de galáxias no universo observável, e a luz de cada estrela que vemos saiu dela há muito tempo. Olhar para o céu é, de certo modo, olhar para o passado.

{{INTERPRETAÇÃO TEOLÓGICA}} Esse fato não prova Deus, mas ajuda a pensar em reverência. A Bíblia diz que, para o Senhor, um dia é como mil anos e mil anos como um dia (2 Pedro 3:8): quem ora fala com Aquele que não está preso ao tempo em que vivemos.` },
    { id: 'mistico', titulo: 'Místico', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: 'O mistério cristão não se fabrica nem se alcança por técnica: é concedido a quem se coloca diante de Deus em oração.', ref: 'Êxodo 3; 33:11; Isaías 6; Atos 10:9-16; 22:17-18; Lucas 9:28-29; 2 Coríntios 12:2-4; Apocalipse 1:10; 1 João 4:1',
      texto: `O que esta sala mostra

{{INTERPRETAÇÃO TEOLÓGICA}} Na fé cristã, místico não é técnica nem segredo: é o encontro real com Deus que vai além do que as palavras explicam. A Bíblia tem muitos exemplos: a sarça que ardia sem se consumir (Êxodo 3), Moisés falando com Deus face a face (Êxodo 33:11), a visão do trono por Isaías (Isaías 6), Paulo arrebatado ao terceiro céu, onde ouviu palavras que ao homem não é lícito repetir (2 Coríntios 12:2-4), e João, em espírito, no dia do Senhor (Apocalipse 1:10).

Por que a oração a recolhe

{{INTERPRETAÇÃO TEOLÓGICA}} Na Bíblia, o místico e a oração caminham juntos. Pedro orava no terraço quando sobreveio um êxtase e ele viu o céu aberto (Atos 10:9-16). Paulo orava no templo quando entrou em êxtase e ouviu o Senhor (Atos 22:17-18). Jesus orava no monte quando o seu aspecto mudou (Lucas 9:28-29). O mistério não se fabrica: é concedido a quem se dispõe a estar diante de Deus.

{{!TRADIÇÃO | Escritos de cristãos de séculos passados (Teresa de Ávila, João da Cruz, Irmão Lourenço). São obras humanas, fora da Bíblia. | Praticar a presença de Deus; 1 Tessalonicenses 5:21}} Registraram experiências de contemplação e de oração. Servem como testemunho histórico, nunca como fonte de doutrina. Tudo é provado pela Escritura, e a revelação vem somente de Deus.

Cuidado

{{INTERPRETAÇÃO TEOLÓGICA}} Quem busca o místico pela experiência acaba perseguindo sensações. Quem busca a Deus recebe o que Ele quiser dar. Toda impressão é provada pela Escritura (1 João 4:1), e o Espírito não contradiz a Palavra. Aqui não há ritual oculto nem técnica de transe: o místico é a oração simples, de coração aberto.` },
    { id: 'angelical', titulo: 'Angelical', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: 'Na Bíblia os anjos aparecem em resposta à oração ou durante ela. O anjo é resposta, nunca o destino da oração.', ref: 'Daniel 9:20-23; 10:12; Lucas 1:8-13; Atos 10:3-4; 12:5-11; Hebreus 1:14; Apocalipse 8:3-4; 22:8-9; Colossenses 2:18',
      texto: `O que esta sala mostra

{{INTERPRETAÇÃO TEOLÓGICA}} Os anjos aparecem na Bíblia como servos e mensageiros de Deus. Hebreus 1:14 os descreve como espíritos ministradores, enviados em favor dos que hão de herdar a salvação. Eles louvam diante do trono (Salmo 103:20-21; Isaías 6:2-3) e executam a palavra do Senhor.

Por que a oração a recolhe

{{INTERPRETAÇÃO TEOLÓGICA}} Na Bíblia, os anjos costumam aparecer em resposta a uma oração, ou durante ela:
• Enquanto Daniel orava, Gabriel foi enviado e lhe disse que, desde o início das suas súplicas, a palavra tinha sido dada (Daniel 9:20-23; 10:12).
• Cornélio orava quando um anjo lhe disse que as suas orações subiram como memorial diante de Deus (Atos 10:3-4).
• Zacarias estava no templo, na hora do incenso, com o povo orando do lado de fora, quando o anjo lhe anunciou que a sua oração fora ouvida (Lucas 1:8-13).
• Quando a igreja orava por Pedro, um anjo o tirou da prisão (Atos 12:5-11).
• Na visão de João, as orações dos santos sobem diante de Deus junto com o incenso, da mão de um anjo (Apocalipse 8:3-4).

O anjo é resposta, não destino

{{INTERPRETAÇÃO TEOLÓGICA}} A oração não se dirige aos anjos. A própria Bíblia corrige quem tenta adorá-los: o anjo manda João não fazer isso e adorar somente a Deus (Apocalipse 22:8-9; Colossenses 2:18). O anjo serve; quem recebe a oração é o Pai, em nome do Filho. Por isso, nesta sala, pedimos a Deus e agradecemos a Ele por quem Ele envia, sem buscar aparições.` },
    { id: 'quantico', titulo: 'Quântico', etiqueta: 'HIPÓTESE', resumo: 'A imagem do colapso da onda ilustra a oração: tirar os ruídos, reunir a mente em um ponto e voltar-se a Deus. É uma analogia, não uma prova.', ref: 'Salmo 46:10; Mateus 6:6; Mateus 10:29-30; Hebreus 4:13',
      texto: `O que esta sala mostra

{{CIÊNCIA ESTABELECIDA}} A física quântica descreve o mundo muito pequeno por meio da função de onda, que reúne as possibilidades de um sistema. Ao medir, encontramos um resultado definido. Também está bem demonstrado em laboratório o emaranhamento: partículas cujas medidas continuam correlacionadas mesmo a grande distância. Esses experimentos renderam o Nobel de Física de 2022 a Alain Aspect, John Clauser e Anton Zeilinger.

{{CIÊNCIA ESTABELECIDA}} O que continua em debate é o significado da medição. Existem várias interpretações, e a ideia de que a consciência cause o colapso é uma proposta minoritária, sem consenso. A ciência não prova nem refuta a existência de Deus.

Por que a oração a recolhe

{{!ANALOGIA | Ideia devocional do Pastor Marcos Fagner, inspirada na física quântica. Não vem da Bíblia nem da física. | Colapso da função de onda; Salmo 46:10; Mateus 6:6}} Quando a pessoa retira os ruídos de fora, entra em si e concentra tudo em Deus, as muitas possibilidades da mente se reúnem em um ponto, e ali o Criador recebe e age. É só uma imagem para ajudar a entender o recolhimento. A oração não depende de física: quem responde é Deus.

{{INTERPRETAÇÃO TEOLÓGICA}} A Bíblia pede esse recolhimento: "Aquietai-vos e sabei que eu sou Deus" (Salmo 46:10), e Jesus manda entrar no quarto, fechar a porta e orar ao Pai em secreto (Mateus 6:6). E afirma que nada escapa aos olhos do Pai (Mateus 10:29-30; Hebreus 4:13).

{{FILOSOFIA}} Física e fé respondem a perguntas diferentes. A física descreve como o mundo se comporta; a fé pergunta por quem o sustenta e a quem ele pertence. Por isso podemos usar uma imagem da ciência para ilustrar a oração, sem pedir à ciência que a prove.` },
    { id: 'rio', titulo: 'Rio do Espírito', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: 'O rio de Ezequiel nasce no santuário. No Tabernáculo, a oração é a fonte de onde a vida corre para o resto da vida.', ref: 'João 7:37-39; Ezequiel 47:1-12; Apocalipse 22:1; Salmos 1:3; 42:1-2; 46:4; Atos 16:13; Lucas 3:21',
      texto: `O que esta sala mostra

{{INTERPRETAÇÃO TEOLÓGICA}} A água viva é uma imagem constante do Espírito. Jesus convidou quem tem sede a vir a Ele e disse que do interior de quem crê correriam rios de água viva, referindo-se ao Espírito que seria dado (João 7:37-39). Ezequiel viu um rio que saía do santuário e dava vida por onde passava (Ezequiel 47:1-12), e João viu o rio da água da vida saindo do trono (Apocalipse 22:1).

Por que a oração a recolhe

{{INTERPRETAÇÃO TEOLÓGICA}} Note onde nasce o rio de Ezequiel: debaixo da porta do templo, no próprio santuário. No Tabernáculo de Oração, o rio brota do lugar da presença e dali corre para a vida: a família, o trabalho, a igreja. O salmista compara quem medita na Palavra a uma árvore plantada junto a ribeiros (Salmo 1:3), diz que um rio alegra a cidade de Deus (Salmo 46:4) e descreve a sede de Deus como oração (Salmo 42:1-2).

{{HISTÓRIA}} Em Filipos, Paulo e os companheiros saíram da cidade, no sábado, para junto de um rio, onde supunham haver um lugar de oração, e ali o Senhor abriu o coração de Lídia (Atos 16:13-14). E Jesus estava orando, depois de batizado no Jordão, quando o céu se abriu (Lucas 3:21).` },
    { id: 'deserto', titulo: 'Deserto', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: 'O deserto retira o que sobra e deixa o essencial. Orar é entrar num deserto interior para ouvir a voz do Pai.', ref: 'Oseias 2:14; 1 Reis 19:4-12; Mateus 4:1-11; Marcos 1:35; Lucas 5:16; Gálatas 1:17; Mateus 6:16-18',
      texto: `O que esta sala mostra

{{INTERPRETAÇÃO TEOLÓGICA}} Na Bíblia, o deserto é o lugar onde os ruídos cessam e Deus fala. Israel foi formado ali durante quarenta anos. Por meio de Oseias, Deus diz que levaria o povo ao deserto e falaria ao seu coração (Oseias 2:14). No deserto, Elias ouviu o Senhor num cicio suave (1 Reis 19:4-12). Paulo passou um tempo na Arábia depois da conversão (Gálatas 1:17).

Por que a oração a recolhe

{{INTERPRETAÇÃO TEOLÓGICA}} Orar é, em si, entrar num deserto interior: sair do barulho para ouvir. Jesus fazia isso: de madrugada saiu para um lugar deserto e ali orava (Marcos 1:35), e costumava retirar-se para lugares solitários para orar (Lucas 5:16). Foi ao deserto antes de começar o ministério e venceu a tentação com a Palavra (Mateus 4:1-11). O deserto retira o que sobra e deixa o essencial: a voz do Pai.

Cuidado

{{INTERPRETAÇÃO TEOLÓGICA}} O jejum pode acompanhar a oração (Mateus 6:16-18), mas exige prudência. Quem tem alguma condição de saúde ou usa medicação contínua deve ouvir o seu médico antes. Oração e silêncio já são, por si, um deserto suficiente.` },
    { id: 'montanha', titulo: 'Montanha', etiqueta: 'HISTÓRIA', resumo: 'O tabernáculo nasceu num monte. Orar é subir, etapa por etapa, e a oração guarda a memória dessa subida.', ref: 'Êxodo 19; 24; 25:40; 1 Reis 18 e 19; Salmo 24:3-4; Isaías 2:2-3; Mateus 14:23; Lucas 6:12; Hebreus 12:18-24',
      texto: `O que esta sala mostra

{{INTERPRETAÇÃO TEOLÓGICA}} Os grandes encontros com Deus costumam acontecer no alto: o Sinai (Êxodo 19 e 24), o Carmelo (1 Reis 18), o Horebe (1 Reis 19), o monte do Sermão (Mateus 5:1) e o monte da transfiguração (Lucas 9:28-36). O salmista pergunta quem poderá subir ao monte do Senhor e responde: o de mãos limpas e coração puro (Salmo 24:3-4).

Por que a oração a recolhe

{{HISTÓRIA}} O tabernáculo nasceu numa montanha. Foi no monte que Deus mostrou a Moisés o modelo da tenda (Êxodo 25:40). Jesus subia ao monte para orar (Mateus 14:23; Lucas 6:12), e Isaías vê o monte da casa do Senhor, para onde afluem todos os povos (Isaías 2:2-3).

{{INTERPRETAÇÃO TEOLÓGICA}} A Montanha Profética dos Códigos Avivar segue esse desenho, do Mar Vermelho ao Horebe: cada etapa se abre quando a anterior é concluída. No Tabernáculo, a subida deixa de ser apenas caminho e passa a ser lugar. Hebreus lembra, porém, que o cristão não chega a um monte que se possa tocar, e sim ao monte Sião, à cidade do Deus vivo (Hebreus 12:18-24).` },
    { id: 'presenca', titulo: 'Presença', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: 'A Presença dá sentido a todas as salas. Quando as outras portas se recolhem, é ela que permanece.', ref: 'Êxodo 33:14-15; Salmos 16:11; 27:4; 139:7-10; Atos 17:27-28; Mateus 7:7-8; 18:20; 28:20; Apocalipse 3:20; João 14:23',
      texto: `O que esta sala mostra

{{INTERPRETAÇÃO TEOLÓGICA}} A Presença é o que dá sentido a todas as outras salas. Moisés disse a Deus que, se a sua presença não fosse com eles, não os fizesse subir dali (Êxodo 33:14-15). O salmista pediu uma só coisa: habitar na casa do Senhor todos os dias da vida (Salmo 27:4), e disse que na presença de Deus há plenitude de alegria (Salmo 16:11).

Por que a oração a recolhe

{{INTERPRETAÇÃO TEOLÓGICA}} A oração é a forma de estar atento à presença. Deus está em toda parte: o Salmo 139:7-10 pergunta para onde se poderia fugir da sua presença, e Paulo diz em Atenas que Ele não está longe de cada um de nós (Atos 17:27-28). Mas estar presente é uma coisa e estar atento é outra. A oração é a atenção do coração voltada para o Deus que já está ali. Jesus prometeu estar no meio de dois ou três reunidos em seu nome (Mateus 18:20) e estar conosco todos os dias (Mateus 28:20).

{{INTERPRETAÇÃO TEOLÓGICA}} Em Apocalipse 3:20 o Senhor diz que está à porta e bate. Jesus nos manda bater (Mateus 7:7-8): no Tabernáculo, o bater de quem ora e o bater do Senhor se encontram. É por isso que esta é a última porta e a primeira: quando as outras se recolhem, o que sobra é a Presença.` },
    { id: 'como-orar', titulo: 'Como orar no Tabernáculo', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: '', ref: 'Mateus 6:6; Salmos 46:10; 100:4; Mateus 7:7-8; 1 Samuel 3:10',
      texto: `{{INTERPRETAÇÃO TEOLÓGICA}} Este roteiro é um caminho de oração, não uma fórmula. Quem ouve a oração é o Pai, e Ele responde como quer e quando quer.

Entrar

Procure um lugar tranquilo, silencie as notificações, respire devagar e aquiete o corpo. Jesus ensinou a orar ao Pai em secreto, de porta fechada (Mateus 6:6), e o salmista pede silêncio diante de Deus (Salmo 46:10).

Adorar

Comece por quem Deus é, antes do que você precisa. Entre pelas portas com ação de graças e pelos átrios com louvor (Salmo 100:4). Adore em espírito e em verdade (João 4:23-24).

Agradecer e confessar

Agradeça concretamente e entregue o que pesa. Quem confessa os pecados encontra um Deus fiel e justo que perdoa (1 João 1:9). Não se preocupe com nada, mas apresente tudo a Deus em oração, com ação de graças (Filipenses 4:6).

Pedir e bater

Peça, busque e bata, como Jesus ensinou (Mateus 7:7-8; Lucas 11:9-13). Peça com fé (Marcos 11:24) e conforme a vontade de Deus (1 João 5:14), lembrando que o Pai sabe do que precisamos antes de pedirmos (Mateus 6:8).

Ouvir

Fique em silêncio e escute: "Fala, Senhor, que o teu servo ouve" (1 Samuel 3:10). As ovelhas ouvem a voz do Pastor (João 10:27). O que você sentir ou receber será provado pela Escritura e, se for o caso, conversado com a sua liderança.

Interceder e voltar à vida

Ore por outros (1 Timóteo 2:1; Tiago 5:16) e então desça da montanha: pratique a Palavra, e não apenas a ouça (Tiago 1:22).` },
    { id: 'cuidados', titulo: 'Cuidados', etiqueta: 'INTERPRETAÇÃO TEOLÓGICA', resumo: '', ref: 'João 16:23; Efésios 2:18; 6:18; Colossenses 2:18; 1 João 4:1; 1 Tessalonicenses 5:21',
      texto: `{{INTERPRETAÇÃO TEOLÓGICA}} Reunir as salas em oração não nos faz buscar experiências, e sim o Deus que se dá. Alguns cuidados:
• Oramos ao Pai, em nome do Filho, pelo Espírito (João 16:23; Efésios 2:18; 6:18). Não oramos aos anjos nem os adoramos (Colossenses 2:18; Apocalipse 22:8-9).
• Visões, sensações e impressões são provadas à luz da Escritura (1 João 4:1; 1 Tessalonicenses 5:21). Nada que contrarie a Bíblia vem de Deus.
• Não prometemos sinais, visões, curas nem respostas em prazo determinado. Oração não substitui tratamento médico, acompanhamento psicológico nem cuidado pastoral.
• Jejum e vigílias longas pedem prudência. Quem tem alguma condição de saúde deve ouvir o seu médico.
• Os trechos bíblicos aqui são resumidos com as nossas palavras. Confira sempre na sua Bíblia.` },
  ],
})

const ESQUEMAS = {
  livros: { nome: 'Loja Avivar (antiga)', campos: [
    ['titulo', 'Título'], ['autor', 'Autor'], ['sinopse', 'Sinopse', 'area'], ['capaUrl', 'Endereço da capa (URL da imagem)'],
    ['pdfAtivo', 'Botão de PDF ativo', 'bool'], ['pdfUrl', 'Endereço do PDF (URL)'], ['precoPdf', 'Preço do PDF (ex.: 29,90)'],
    ['fisico', 'Livro físico', 'sel', ['disponivel', 'esgotado', 'embreve']], ['precoFisico', 'Preço do físico (ex.: 59,90)'],
    ['amostra', 'Amostra: uma URL de imagem por linha (15 primeiras páginas)', 'area'],
  ] },
  biblioteca: { nome: 'Biblioteca Avivar', campos: [
    ['titulo', 'Título'], ['autor', 'Autor'], ['sinopse', 'Sinopse', 'area'], ['capaUrl', 'Endereço da capa (URL da imagem)'],
    ['pdfAtivo', 'Botão de baixar PDF ativo', 'bool'], ['pdfUrl', 'Endereço do PDF (URL)'],
  ] },
  reportagens: { nome: 'Estudos Avivar', campos: [
    ['titulo', 'Título'], ['autor', 'Autor'], ['etiqueta', 'Natureza do texto', 'sel', ETIQUETAS], ['resumo', 'Resumo (uma ou duas frases)', 'area'],
    ['imagemUrl', 'Endereço da imagem (URL)'], ['texto', 'Texto completo (deixe uma linha em branco entre parágrafos; use "• " para listas)', 'longo'],
  ] },
  tv: { nome: 'ON LINE: vídeos anteriores', campos: [
    ['titulo', 'Título'], ['tipo', 'Tipo', 'sel', ['Aula', 'Live', 'Série', 'Mensagem']], ['url', 'Endereço do vídeo (link do YouTube ou de incorporação)'], ['descricao', 'Descrição', 'area'],
    ['livre', 'Liberado para todos? (sim = o plano Anjo, grátis, também assiste; não = só assinantes)', 'sel', ['não', 'sim']],
  ] },
  cursos: { nome: 'Cursos Avivar', campos: [
    ['titulo', 'Título'], ['categoria', 'Categoria'], ['area', 'Onde aparece', 'sel', ['Geral', 'Sala Quântica']],
    ['plano', 'Plano que dá acesso a este curso (quem tem este plano, ou um maior, assiste sem comprar)', 'sel', ['Serafim', 'Querubim', 'Anjo']],
    ['avulso', 'Vender este curso avulso em Livros Avivar? (qualquer pessoa cadastrada pode comprar só este curso)', 'sel', ['Não', 'Sim']],
    ['precoAvulso', 'Preço avulso (ex.: R$ 97,00)'],
    ['emiteCertificado', 'Este curso emite certificado?', 'sel', ['Não', 'Sim']], ['cargaHoraria', 'Carga horária do curso (em horas, ex.: 20)'],
    ['descricao', 'Descrição', 'area']] },
  aulas: { nome: 'Aulas dos cursos', campos: [
    ['cursoId', 'Curso', 'curso'], ['titulo', 'Título da aula'], ['tipo', 'Tipo', 'sel', ['video', 'texto', 'livro']],
    ['url', 'Endereço do vídeo ou do livro (URL)'], ['texto', 'Texto da aula', 'area'],
  ] },
  salas: { nome: 'Sala Profética (climas)', campos: [['titulo', 'Nome do clima'], ['descricao', 'Descrição', 'area']] },
  montanhas: { nome: 'Montanha Profética', campos: [
    ['titulo', 'Nome da etapa'], ['ref', 'Referência bíblica'], ['descricao', 'Descrição', 'area'], ['tarefas', 'Tarefas (uma por linha)', 'area'],
  ] },
  estudos: { nome: 'Estudos Proféticos: modalidades', campos: [['titulo', 'Modalidade'], ['descricao', 'Descrição', 'area']] },
  esferasTab: { nome: 'Tabernáculo: 12 esferas (meses)', campos: [
    ['mes', 'Mês (nome transliterado)'], ['dimensao', 'Dimensão de oração'], ['foco', 'Foco da oração (uma frase)', 'area'], ['ordem', 'Posição no relógio (1 = Nisan)'],
    ['hebraico', 'Nome do mês em hebraico'], ['nomeBiblico', 'Nome bíblico antigo (se houver)'], ['letra', 'Letra (tradição do Sefer Yetzirah)'], ['letraNome', 'Nome da letra'], ['tribo', 'Tribo (tradição)'], ['cor', 'Cor da esfera (#RRGGBB)'],
    ['mensagem', 'Mensagem bíblica ao concluir a oração', 'area'], ['mensagemRef', 'Referência da mensagem'],
    ['cartoes', 'Cartões (cada um começa com uma linha "@@ Título")', 'longo'], ['rascunho', 'Rascunho para revisão', 'bool'],
  ] },
  marcosOracao: { nome: 'Tabernáculo: marcos de oração', campos: [
    ['titulo', 'Título'], ['minutos', 'Minutos do marco'], ['resumo', 'Resumo', 'area'], ['ref', 'Referências'], ['texto', 'Texto', 'longo'],
  ] },
  estudosProf: { nome: 'Estudos Proféticos: estudos', campos: [
    ['titulo', 'Título'], ['modalidade', 'Modalidade', 'sel', ['Vida dos Profetas', 'O Profeta e o Seu Tempo', 'A Mensagem', 'Linha do Tempo Profética', 'Estudo de Caso', 'Desafio da Porta Profética']],
    ['etiqueta', 'Natureza do texto', 'sel', ETIQUETAS], ['resumo', 'Resumo (uma ou duas frases)', 'area'], ['ref', 'Referências bíblicas'],
    ['imagem', 'Imagem: nome do arquivo em public/img, sem .webp (opcional)'],
    ['texto', 'Texto completo (linha em branco entre parágrafos; "• " para listas; {{ETIQUETA}} no início de cada parágrafo; uma linha curta sozinha vira subtítulo)', 'longo'],
    ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  quantica: { nome: 'Sala Quântica: temas', campos: [
    ['titulo', 'Tema'], ['etiqueta', 'Etiqueta', 'sel', ['CIÊNCIA ESTABELECIDA', 'INTERPRETAÇÃO TEOLÓGICA', 'HISTÓRIA', 'FILOSOFIA', 'HIPÓTESE', 'TESTEMUNHO']], ['resumo', 'Resumo', 'area'],
    ['texto', 'Texto completo (linha em branco entre parágrafos; "• " para listas; {{ETIQUETA}} no início do parágrafo; [[imagem: arquivo | legenda]] reserva uma imagem)', 'longo'],
  ] },
  exercicios: { nome: 'Sala Quântica: exercícios', campos: [
    ['titulo', 'Nome do exercício'], ['tipo', 'Tipo', 'sel', ['Oração', 'Meditação bíblica', 'Silêncio', 'Contemplação', 'Leitura', 'Jejum']],
    ['minutos', 'Duração em minutos'], ['ref', 'Referência bíblica'], ['passos', 'Passos (um por linha)', 'area'],
    ['fundamento', 'Fundamento (use {{ETIQUETA}} no início de cada parágrafo)', 'longo'], ['serve', 'Para que serve', 'longo'], ['porque', 'Por que ler este texto', 'longo'],
    ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  glossario: { nome: 'Sala Quântica: glossário', campos: [['titulo', 'Termo'], ['etiqueta', 'Etiqueta', 'sel', ETIQUETAS], ['definicao', 'Definição', 'area']] },
  profetas: { nome: 'O que são os Códigos: profetas', campos: [
    ['titulo', 'Nome'], ['papel', 'Título (ex.: O libertador)'], ['sinal', 'O que Deus fez por meio dele', 'area'], ['ref', 'Referências bíblicas'],
  ] },
  pilares: { nome: 'O que são os Códigos: eixos do treinamento', campos: [['titulo', 'Título'], ['texto', 'Texto', 'area'], ['ref', 'Referências bíblicas']] },
  selos: { nome: 'O que são os Códigos: códigos selados', campos: [['titulo', 'Título'], ['chamada', 'Chamada (a pergunta que gera expectativa)', 'area'], ['ref', 'Referência']] },
  dom: { nome: 'O que são os Códigos: o dom de profecia', campos: [['titulo', 'Título'], ['lista', 'Mostrar como lista (uma linha por item)', 'bool'], ['texto', 'Texto (um parágrafo ou item por linha)', 'area'], ['ref', 'Referências']] },
  termosAp: { nome: 'Tábua: glossário (termos)', campos: [
    ['titulo', 'Termo'], ['etiqueta', 'Etiqueta', 'sel', ETIQUETAS], ['oque', 'O que é', 'area'],
    ['fundamentos', 'Fundamentos (um por linha, começando com "• "; use [[termo:id|texto]] para ligar a outro termo)', 'longo'],
    ['avaliacao', 'Como a fé cristã avalia', 'longo'], ['ref', 'Referências bíblicas'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  mitosAp: { nome: 'Tábua: mitos e fatos', campos: [
    ['titulo', 'O mito (frase)'], ['fato', 'O fato (frase)'],
    ['texto', 'Explicação (linha em branco entre parágrafos; {{ETIQUETA}} no início; [[termo:id|texto]] liga a um termo)', 'longo'], ['ref', 'Referências bíblicas'],
  ] },
  enoqueLivros: { nome: 'Tábua: livros de Enoque', campos: [
    ['titulo', 'Nome do livro'], ['ordem', 'Ordem (1 a 5)'], ['caps', 'Capítulos (ex.: 1–36)'], ['datacao', 'Datação'], ['efeito', 'Rótulo do efeito'],
    ['resumo', 'O que o livro diz (linha em branco entre parágrafos; {{ETIQUETA}} no início)', 'longo'],
    ['cuidado', 'Cuidado (vira o selo de origem não comprovada)', 'area'], ['veredito', 'Veredito do livro', 'area'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  evangelhosAp: { nome: 'Tábua: evangelhos fora do cânon', campos: [
    ['titulo', 'Nome do evangelho'], ['ordem', 'Ordem (1 a 11)'], ['tipo', 'Tipo (rótulo curto)'], ['data', 'Data provável'],
    ['achado', 'De onde veio (use [[termo:id|texto]] para ligar a um termo)', 'area'], ['resumo', 'O que é', 'area'],
    ['contem', 'O que contém (um item por linha)', 'longo'], ['veredito', 'Veredito', 'area'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  etiopeAp: { nome: 'Tábua: livros da Bíblia Etíope', campos: [
    ['titulo', 'Nome do livro'], ['ordem', 'Ordem'], ['tipo', 'Tipo (rótulo curto)'], ['data', 'Data provável'],
    ['resumo', 'O que é', 'area'], ['onde', 'Onde está', 'area'], ['avaliacao', 'Como a fé cristã avalia', 'area'], ['veredito', 'Veredito', 'area'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  livrosRef: { nome: 'Cânon e Reforma: os 7 livros', campos: [
    ['titulo', 'Título'], ['ordem', 'Ordem'], ['curto', 'Nome curto (na lombada)'], ['tipo', 'Tipo (rótulo curto)'], ['data', 'Data provável'],
    ['resumo', 'O que é', 'longo'], ['ensina', 'O que ensina (um item por linha, começando com "• ")', 'longo'], ['onde', 'Onde está', 'area'], ['ecos', 'Ecos apontados no Novo Testamento', 'area'],
    ['cuidado', 'Cuidado ao ler', 'area'], ['catolico', 'Como os católicos tratam', 'area'], ['evangelico', 'Como os evangélicos tratam', 'area'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  argumentosRef: { nome: 'Cânon e Reforma: debates (por que não aceitam)', campos: [
    ['titulo', 'Título do debate'], ['ordem', 'Ordem (1 a 7)'], ['evangelico', 'Afirmação evangélica', 'longo'], ['catolico', 'Resposta católica', 'longo'],
    ['replica', 'Réplica evangélica', 'longo'], ['aberto', 'Em aberto (síntese neutra)', 'area'], ['ref', 'Referências bíblicas'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  eventosRef: { nome: 'Cânon e Reforma: marcos do Túnel do Tempo', campos: [
    ['titulo', 'Título do marco'], ['ordem', 'Ordem no túnel'], ['rotulo', 'Data para exibir (ex.: 1517)'], ['tipo', 'Tipo', 'sel', ['CÂNON', 'PRECURSOR', 'RUPTURA', 'CONSOLIDAÇÃO', 'CONTRARREFORMA', 'CONTEXTO']],
    ['resumo', 'Resumo no cartão do túnel', 'area'], ['aconteceu', 'O que aconteceu', 'longo'], ['causa', 'Por que aconteceu', 'longo'], ['depois', 'O que veio depois', 'longo'],
    ['canon', 'Os sete livros neste momento', 'area'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  personagensRef: { nome: 'Cânon e Reforma: precursores e reformadores', campos: [
    ['titulo', 'Nome'], ['ordem', 'Ordem'], ['grupo', 'Grupo', 'sel', ['PRECURSOR', 'REFORMADOR', 'RESPOSTA CATÓLICA']], ['anos', 'Anos'], ['onde', 'Onde atuou'],
    ['resumo', 'Quem foi', 'area'], ['ensinou', 'O que ensinou (um item por linha, começando com "• ")', 'longo'], ['limites', 'Limites e sombras', 'area'], ['canon', 'Relação com os sete livros', 'area'],
    ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  estudosMesa: { nome: 'Cânon e Reforma: estudos da Mesa dos reformadores', campos: [
    ['titulo', 'Nome'], ['ordem', 'Ordem'], ['anos', 'Anos'], ['onde', 'Onde atuou'], ['quem', 'Quem foi', 'longo'], ['obras', 'Principais escritos (um por linha, começando com "• ")', 'longo'],
    ['ceia', 'A Ceia', 'longo'], ['batismo', 'O batismo', 'longo'], ['salvacao', 'Salvação', 'longo'], ['estado', 'Igreja e Estado', 'longo'], ['autoridade', 'Autoridade da Escritura', 'longo'], ['livros', 'Os sete livros', 'longo'], ['culto', 'O culto', 'longo'],
    ['discordou', 'Com quem discordou (um por linha, começando com "• ")', 'longo'], ['legado', 'Quem veio depois', 'area'], ['sombras', 'Luz e sombra', 'area'], ['ref', 'Referências bíblicas'],
    ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  igrejasProt: { nome: 'Igrejas Protestantes: fichas', campos: [
    ['titulo', 'Nome da igreja ou família'], ['ordem', 'Ordem'], ['familia', 'Família (selo)'], ['origem', 'Origem'], ['oque', 'O que é', 'longo'], ['defende', 'O que defende (um por linha, começando com "• ")', 'longo'],
    ['batismo', 'Batismo', 'area'], ['salvacao', 'Salvação', 'area'], ['ceia', 'A Ceia', 'area'], ['dons', 'Dons do Espírito Santo', 'area'], ['governo', 'Governo da igreja', 'area'],
    ['grupos', 'Principais grupos e exemplos (um por linha, começando com "• ")', 'longo'], ['tamanho', 'Tamanho (aproximado)', 'area'], ['debate', 'O que é debatido', 'longo'], ['ref', 'Referências bíblicas'],
    ['cena', 'Cena da imagem (em inglês, para o gerador)', 'area'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  correlacoesRef: { nome: 'Cânon e Reforma: correlações de tempos', campos: [
    ['titulo', 'Título'], ['ano', 'Anos (ex.: 1517 → 1519)'], ['tipo', 'Tipo da relação', 'sel', ['CAUSA E EFEITO', 'MESMO ANO', 'ECO']],
    ['livros', 'Livros e cânon', 'area'], ['mundo', 'Mundo e Reforma', 'area'], ['nota', 'Nota', 'area'],
  ] },
  selosEfode: { nome: 'Selos do Éfode (os 24 selos)', campos: [
    ['titulo', 'Título do selo (aparece só nesta lista)'], ['mes', 'Mês (selos 1 a 12)'], ['ordem', 'Número do selo (1 a 24)'], ['hebraico', 'Nome do mês em hebraico'], ['dimensao', 'Dimensão (significado)'], ['cor', 'Cor (ex.: #f2b45e)'], ['refChave', 'Versículo-chave (referência)'],
    ['antiga', 'Antiga Aliança', 'area'], ['jesus', 'Tempo de Jesus', 'area'], ['nova', 'Nova Aliança', 'area'], ['desafio', 'Desafio do selo', 'area'], ['cena', 'Cena da imagem do selo', 'area'],
    ['aprofundamento', 'Aprofundamento (selos 13 a 24)', 'area'], ['base', 'Base bíblica do aprofundamento (selos 13 a 24)'], ['mesDe', 'Selo duplo: número do mês de origem (1 a 12)'], ['nota', 'Observação (o que não é bíblico ou pede cuidado)', 'area'], ['rascunho', 'Mostrar o selo "rascunho para revisão"', 'bool'],
  ] },
  promptsSelos: { nome: 'Selos do Éfode: prompts das imagens', campos: [
    ['titulo', 'Título'], ['tipo', 'Tipo', 'sel', ['imagem', 'vídeo']], ['arquivo', 'Nome do arquivo em public/img'], ['onde', 'Onde aparece'], ['prompt', 'Prompt', 'longo'],
  ] },
  promptsRef: { nome: 'Cânon e Reforma: painel de demonstrações (prompts)', campos: [
    ['titulo', 'Título'], ['tipo', 'Tipo', 'sel', ['imagem', 'vídeo']], ['arquivo', 'Nome do arquivo em public/img'], ['onde', 'Onde aparece'], ['prompt', 'Prompt', 'longo'],
  ] },
  correlacoesEn: { nome: 'Tábua: correlações Enoque e Bíblia', campos: [
    ['titulo', 'Tema'], ['livro', 'Livro de Enoque (vigilantes, parabolas, astronomico, sonhos ou epistola)'], ['enoque', 'Referência em 1 Enoque'], ['biblia', 'Referência bíblica'],
    ['tipo', 'Tipo da relação', 'sel', ['CITAÇÃO DIRETA', 'ECO', 'TEMA PARALELO', 'CONTRASTE']], ['nota', 'Nota', 'area'],
  ] },
  promptsTabua: { nome: 'Tábua: painel de demonstrações (prompts)', campos: [
    ['titulo', 'Título'], ['tipo', 'Tipo', 'sel', ['imagem', 'vídeo']], ['arquivo', 'Nome do arquivo em public/img'], ['onde', 'Onde aparece'], ['prompt', 'Prompt', 'longo'],
  ] },
  tabernaculo: { nome: 'Tabernáculo de Oração', campos: [['titulo', 'Título'], ['etiqueta', 'Natureza do texto', 'sel', ETIQUETAS], ['resumo', 'Resumo (uma frase)', 'area'], ['texto', 'Texto', 'area'], ['ref', 'Referências']] },
  planos: { nome: 'Planos', campos: [
    ['titulo', 'Nome'], ['frase', 'Frase'], ['precoSemestral', 'Preço semestral'], ['precoAnual', 'Preço anual'], ['precoRecMensal', 'Renovação automática (cartão): preço MENSAL (vazio = não oferecer)'], ['precoRecSemestral', 'Renovação automática (cartão): preço SEMESTRAL (vazio = não oferecer)'], ['precoRecAnual', 'Renovação automática (cartão): preço ANUAL (vazio = não oferecer)'], ['recursos', 'Recursos (um por linha)', 'area'],
  ] },
}
const CAMPOS_CONFIG = [
  ['aoVivoLivre', 'ON LINE: a transmissão ao vivo é liberada também para o plano Anjo (grátis)?', 'sel', ['sim', 'não']],
  ['remetenteNome', 'Nome do remetente (etiquetas)'], ['remetenteEndereco', 'Endereço do remetente (etiquetas)', 'area'],
  ['agradecimento', 'Mensagem de agradecimento (etiqueta)', 'area'], ['oQueSaoAbertura', 'O que são os Códigos: texto de abertura (um parágrafo por linha; vazio = texto padrão)', 'area'], ['oQueSaoMundo', 'O que são os Códigos: seção "O mundo dorme" (vazio = texto padrão)', 'area'], ['oQueSao', 'O que são os Códigos: Palavra do Pastor no fim da página (opcional)', 'area'],
  ['aoVivoAtivo', 'ON LINE: a transmissão ao vivo está no ar? (verde = sim, azul = não)', 'sel', ['não', 'sim']], ['aoVivoUrl', 'ON LINE: endereço da transmissão ao vivo (link do YouTube)'], ['aoVivoTitulo', 'ON LINE: título da transmissão ao vivo'],
]

const CLIMAS = {
  celestial: { ceu: ['#070b26', '#1d1a55'], monte: '#141038', monte2: '#272066', luz: '#f3d98b' },
  mistico: { ceu: ['#12062e', '#4a1d8a'], monte: '#1d0b45', monte2: '#3a1877', luz: '#d9b8ff' },
  angelical: { ceu: ['#cfc6e8', '#fbf4dc'], monte: '#e9dfc2', monte2: '#f4ecd6', luz: '#d4af37' },
  rio: { ceu: ['#06202e', '#14606b'], monte: '#0b3440', monte2: '#16525c', luz: '#a8f0e2', rio: true },
  deserto: { ceu: ['#0c1030', '#5b4a6b'], monte: '#b08a57', monte2: '#8a6a45', luz: '#f3d98b', tenda: true },
  montanha: { ceu: ['#27344d', '#8fa0b8'], monte: '#2c3a52', monte2: '#55657e', luz: '#f3d98b' },
  presenca: { ceu: ['#f6f0e0', '#fffaf0'], monte: '#eadfc4', monte2: '#f3ead4', luz: '#d4af37' },
}

const ETAPAS = [
  { n: 'Vale', d: 'O ponto de partida: conhecer o projeto.', to: '/o-que-sao', x: 8, y: 82 },
  { n: 'Rio do Espírito', d: 'Oração, leitura, reflexão e diário.', to: null, x: 22, y: 68 },
  { n: 'Tenda do Saber', d: 'Cursos, aulas e materiais.', to: '/cursos', x: 36, y: 74 },
  { n: 'Monte dos Milagres', d: 'Relatos bíblicos, contexto e interpretação.', to: null, x: 50, y: 52 },
  { n: 'Cume da Fé', d: 'A subida da Montanha Profética.', to: '/montanha-profetica', x: 62, y: 36 },
  { n: 'Nuvem', d: 'Encontros ao vivo na Sala Profética.', to: '/sala-profetica', x: 76, y: 24 },
  { n: 'Portas Celestiais', d: 'Desafios dos Estudos Proféticos.', to: '/estudos-profeticos', x: 90, y: 14 },
]

/* ───────────── ESTADO ───────────── */

const CONTEUDO_V = 19 // sobe quando o conteúdo real do ministério é atualizado
const INICIAL = { sessao: null, db: SEED, pedidos: [], tarefas: {}, entradasSala: 0, anotacoes: [], lidos: {}, efodes: {}, assinaturas: [], cuponsUsos: {}, cadastros: [], conteudoV: CONTEUDO_V }

// Atualiza quem já abriu o protótipo antes: completa só o que está vazio ou ainda no valor antigo,
// para nunca apagar o que o admin editou (preços, textos, botões).
function mesclar(atual, novo) {
  const mapa = new Map(novo.map((n) => [n.id, n]))
  const ids = new Set(atual.map((i) => i.id))
  const mesclados = atual.map((i) => {
    const n = mapa.get(i.id)
    if (!n) return i
    const m = { ...i }
    Object.keys(n).forEach((k) => { if (m[k] === undefined || m[k] === '') m[k] = n[k] })
    if (!i.pdfUrl && n.pdfUrl) { m.pdfUrl = n.pdfUrl; m.pdfAtivo = n.pdfAtivo }
    if (i.fisico === 'embreve' && n.fisico === 'esgotado') m.fisico = 'esgotado'
    if (i.autor === 'Kenneth Hagin') m.autor = n.autor
    return m
  })
  return [...mesclados, ...novo.filter((n) => !ids.has(n.id))]
}
// Dados pessoais do aluno que ficam na conta (servidor). A foto do éfode fica só no aparelho, até a decisão sobre a LGPD (etapa 6).
const ALUNO_CHAVES = ['anotacoes', 'lidos', 'tarefas', 'efodes']
const semFotos = (ef) => { const r = {}; Object.keys(ef || {}).forEach((n) => { r[n] = { ...ef[n], foto: '' } }); return r }
const comFotos = (srv, loc) => { const r = {}; Object.keys(srv || {}).forEach((n) => { r[n] = { ...srv[n], foto: ((loc || {})[n] || {}).foto || '' } }); return r }
const PROFETAS_ANTIGOS = ["1x0z3he","1deqz77","1fte1c","pujo0k","1ltv5xm","1wg1028","1jpq7xn","18de5cs","kw6xpc","35jsan","b42x3i","38daoe"] // códigos (não o texto) dos textos que já foram o padrão: só estes são trocados, o que o admin editou fica
const codigoTexto = (t) => { let x = 5381; const q = String(t || ''); for (let i = 0; i < q.length; i++) x = ((x * 33) ^ q.charCodeAt(i)) >>> 0; return x.toString(36) }
const FRASES_ANTIGAS = { anjo: 'O mensageiro, o primeiro a anunciar a boa nova.', querubim: 'Guardavam a entrada do Éden.', serafim: 'Ao redor do trono (Isaías 6).' }

function carregar() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE))
    if (s && s.db) {
      const e = { ...INICIAL, ...s, db: { ...SEED, ...s.db } }
      if (s.conteudoV !== CONTEUDO_V) {
        e.db.livros = mesclar(e.db.livros || [], SEED.livros)
        e.db.biblioteca = mesclar(e.db.biblioteca || [], SEED.biblioteca)
        e.db.quantica = mesclar(e.db.quantica || [], SEED.quantica)
        e.db.selos = mesclar(e.db.selos || [], SEED.selos)
        e.db.exercicios = mesclar(e.db.exercicios || [], SEED.exercicios)
        e.db.estudosProf = mesclar(e.db.estudosProf || [], SEED.estudosProf)
        e.db.esferasTab = mesclar(e.db.esferasTab || [], SEED.esferasTab)
        e.db.marcosOracao = mesclar(e.db.marcosOracao || [], SEED.marcosOracao)
        e.db.profetas = [...SEED.profetas.map((n) => (e.db.profetas || []).find((x) => x.id === n.id) || n), ...(e.db.profetas || []).filter((x) => !SEED.profetas.some((n) => n.id === x.id))]
        e.db.planos = (e.db.planos || []).map((p) => (FRASES_ANTIGAS[p.id] === p.frase ? { ...p, frase: SEED.planos.find((x) => x.id === p.id).frase } : p))
        e.db.profetas = (e.db.profetas || []).map((x) => {
          const n = SEED.profetas.find((y) => y.id === x.id)
          return n && PROFETAS_ANTIGOS.includes(codigoTexto(x.sinal)) ? { ...x, sinal: n.sinal, ref: n.ref } : x
        })
        e.db.tabernaculo = (e.db.tabernaculo || []).map((t) => (t.id === 'abertura' && !String(t.texto || '').includes('Os doze portais celestiais') ? { ...t, texto: SEED.tabernaculo.find((x) => x.id === 'abertura').texto, ref: SEED.tabernaculo.find((x) => x.id === 'abertura').ref } : t))
        ;['termosAp', 'mitosAp', 'enoqueLivros', 'correlacoesEn', 'promptsTabua', 'evangelhosAp', 'etiopeAp', 'livrosRef', 'argumentosRef', 'eventosRef', 'personagensRef', 'estudosMesa', 'igrejasProt', 'correlacoesRef', 'promptsRef', 'selosEfode', 'promptsSelos'].forEach((k) => { e.db[k] = mesclar(e.db[k] || [], SEED[k]) })
        e.db.vestes = mesclar(e.db.vestes || [], SEED.vestes)
        // termos que ganharam "quem defende": troca só estes dois pelo texto novo
        e.db.termosAp = (e.db.termosAp || []).map((t) => (['predestinacao', 'presenca-real'].includes(t.id) ? (SEED.termosAp.find((x) => x.id === t.id) || t) : t))
        // planos, cupons e vídeo de apresentação (ON LINE)
        e.db.config = { ...(e.db.config || {}) }
        delete e.db.config.videoEntrada
        if (e.db.config.aoVivoLivre === undefined) e.db.config.aoVivoLivre = 'sim'
        if (e.db.config.espiritoQuerubim === undefined) e.db.config.espiritoQuerubim = 'não'
        if (e.db.config.espiritoAnjo === undefined) e.db.config.espiritoAnjo = 'não'
        e.db.cupons = e.db.cupons || []
        if (!(e.db.tv || []).some((v) => v.id === 'apresentacao-codigos-avivar')) e.db.tv = [SEED.tv[0], ...(e.db.tv || [])]
        e.db.planos = (e.db.planos || []).map((p) => (p.id === 'anjo' && p.recursos ? { ...p, recursos: p.recursos.replace('3 entradas na Sala Profética', 'Vitrine de todas as páginas (para abrir o conteúdo, assine o Querubim ou o Serafim)') } : p))
        e.conteudoV = CONTEUDO_V
      }
      e.db = esvaziar(e.db) // textos completos de versões antigas voltam para a vitrine (o texto cheio só vem do servidor)
      return e
    }
  } catch (e) { /* sem armazenamento: segue com os dados iniciais */ }
  return INICIAL
}

const Ctx = createContext(null)
const useLoja = () => useContext(Ctx)


// Dados da pessoa logada no servidor, no formato que o aplicativo usa.
const sessaoDe = (p) => ({ nome: p.nome || 'Irmão(ã)', plano: planoVigente(p), planoAte: p.plano_ate || '', admin: p.papel === 'admin', email: p.email, whatsapp: p.whatsapp, uid: p.id, servidor: true })

// Ao abrir o aplicativo: confere no servidor se a pessoa já está logada e trata os links do e-mail (confirmar cadastro e nova senha).
function SessaoServidor() {
  const { definirSessao, fimRestauro } = useLoja()
  const nav = useNavigate()
  const [aviso, setAviso] = useState('')
  useEffect(() => {
    if (!SERVIDOR) return undefined
    let vivo = true
    // Se o servidor demorar a responder, a tela de entrada não fica só no fundo: depois de 6 segundos mostra o acesso
    // (se a conferência terminar depois, a sessão ainda é aplicada normalmente).
    const limite = setTimeout(() => { if (vivo) fimRestauro() }, 6000)
    ;(async () => {
      const link = SB.processarLink()
      try {
        const p = await SB.perfil()
        if (vivo && p) definirSessao(sessaoDe(p))
        if (link && link.erro) setAviso(link.erro)
        else if (link && p) nav(link.tipo === 'recovery' ? '/nova-senha' : '/inicio', { replace: true })
      } catch (e) { /* sem sessão válida: segue como visitante */ } finally { clearTimeout(limite); if (vivo) fimRestauro() }
    })()
    return () => { vivo = false; clearTimeout(limite) }
  }, [])
  return aviso ? <div className="aviso aviso-forte aviso-fixo" role="alert">{aviso} <button type="button" className="btn pequeno" onClick={() => setAviso('')}>Fechar</button></div> : null
}

function Provedor({ children }) {
  const [st, setSt] = useState(() => { const e = carregar(); return SERVIDOR ? { ...e, sessao: null } : e }) // no modo servidor, a sessão só vale depois de conferida no servidor
  const [restaurando, setRestaurando] = useState(SERVIDOR)
  const [pleno, setPleno] = useState({ estado: 'ocioso' }) // conteúdo completo vindo do servidor: ocioso · carregando · ok · erro
  const baixando = useRef(false)
  const assinante = ehAssinante(st.sessao)
  const sessaoRef = useRef(st.sessao)
  sessaoRef.current = st.sessao
  const uid = st.sessao && st.sessao.uid
  const uidRef = useRef(uid)
  uidRef.current = uid
  const enviadoAluno = useRef({}) // o que o servidor já tem de cada dado do aluno
  const [alunoPronto, setAlunoPronto] = useState(false)
  const [tentaAluno, setTentaAluno] = useState(0)
  // Etapa 3: edições do admin (valem para todos). Lê ao abrir, ao voltar para a aba e de tempos em tempos.
  const buscarEdicoes = useRef(async () => {})
  buscarEdicoes.current = async () => {
    try {
      const rows = await SB.edicoesBaixar()
      setSt((s) => { const n = aplicarEdicoes(s.db, rows); return n === s.db ? s : { ...s, db: n } })
    } catch (e) { /* sem conexão: segue com o que já tem */ }
  }
  // Lê de novo quando a pessoa entra, sai ou muda de plano (as aulas dos cursos pagos só chegam para quem tem direito).
  const planoAtual = st.sessao ? st.sessao.plano : ''
  useEffect(() => {
    if (!SERVIDOR) return undefined
    buscarEdicoes.current()
    const vis = () => { if (document.visibilityState === 'visible') buscarEdicoes.current() }
    document.addEventListener('visibilitychange', vis)
    const t = setInterval(() => buscarEdicoes.current(), 600000)
    return () => { document.removeEventListener('visibilitychange', vis); clearInterval(t) }
  }, [uid, planoAtual])
  const ehAdmin = !!(st.sessao && st.sessao.admin)
  useEffect(() => { if (SERVIDOR && ehAdmin) retomar() }, [ehAdmin])
  // Etapa 3: dados do aluno ficam na conta (anotações, textos lidos, tarefas, éfode). A foto do éfode fica só no aparelho.
  useEffect(() => {
    if (!SERVIDOR || !uid) { setAlunoPronto(false); return undefined }
    let vivo = true
    ;(async () => {
      try {
        const d = await SB.alunoBaixar()
        if (!vivo) return
        setSt((s) => {
          const meu = !s.donoDados || s.donoDados === uid // dados antigos deste aparelho (de antes das contas) passam para a primeira conta que entrar
          const pega = (k, vazio) => (d[k] !== undefined ? d[k] : (meu ? s[k] : vazio))
          const efs = d.efodes !== undefined ? comFotos(d.efodes, meu ? s.efodes : {}) : (meu ? s.efodes : {})
          return { ...s, donoDados: uid, anotacoes: pega('anotacoes', []), tarefas: pega('tarefas', {}), efodes: efs, lidos: { ...(meu ? s.lidos : {}), ...(d.lidos || {}) } }
        })
        const env = {}
        ALUNO_CHAVES.forEach((k) => { if (d[k] !== undefined) env[k] = JSON.stringify(k === 'efodes' ? semFotos(d[k]) : d[k]) })
        env.lidos = undefined // a lista de lidos é unida com a do aparelho: envia de novo se mudou
        enviadoAluno.current = env
        setAlunoPronto(true)
      } catch (e) { if (vivo) setTimeout(() => setTentaAluno((n) => n + 1), 8000) }
    })()
    return () => { vivo = false }
  }, [uid, tentaAluno])
  useEffect(() => {
    if (!SERVIDOR || !uid || !alunoPronto) return undefined
    const t = setTimeout(() => {
      if (!uidRef.current) return
      ALUNO_CHAVES.forEach((k) => {
        const v = k === 'efodes' ? semFotos(st[k]) : st[k]
        const j = JSON.stringify(v)
        const vazio = j === '[]' || j === '{}'
        if (enviadoAluno.current[k] === j || (vazio && enviadoAluno.current[k] === undefined)) return
        enviadoAluno.current[k] = j
        SB.alunoGravar(k, v).catch(() => { enviadoAluno.current[k] = undefined; setTimeout(() => setTentaAluno((n) => n + 1), 10000) })
      })
    }, 1200)
    return () => clearTimeout(t)
  }, [st.anotacoes, st.lidos, st.tarefas, st.efodes, uid, alunoPronto])
  // Saiu da conta (ou a sessão acabou): os dados pessoais do aluno saem deste aparelho.
  useEffect(() => {
    if (!SERVIDOR || restaurando || uid || !st.donoDados) return
    setSt((s) => ({ ...s, donoDados: undefined, anotacoes: [], lidos: {}, tarefas: {}, efodes: {}, entradasSala: 0 }))
  }, [uid, restaurando, st.donoDados])
  useEffect(() => {
    try { localStorage.setItem(CHAVE, JSON.stringify(st)) } catch (e) { /* ignora */ }
  }, [st])
  // Assinante (Querubim, Serafim ou admin): baixa os textos completos do servidor e coloca no lugar da vitrine.
  useEffect(() => {
    if (!PROT_ATIVO || !SERVIDOR || !assinante || pleno.estado !== 'ocioso' || baixando.current) return
    baixando.current = true
    setPleno({ estado: 'carregando' })
    SB.conteudoBaixar()
      .then((l) => { l.forEach((r) => MAPA.set(r.id, r.texto)); hidratarNoLugar(DADOS_FIXOS); setPleno({ estado: 'ok', n: l.length }) })
      .catch(() => setPleno({ estado: 'erro' }))
      .finally(() => { baixando.current = false })
  }, [assinante, pleno.estado])
  // Perdeu o plano (ou saiu): recarrega a página para os textos completos saírem da memória.
  useEffect(() => {
    if (!PROT_ATIVO || pleno.estado !== 'ok' || assinante || restaurando) return undefined
    const t = setTimeout(() => window.location.reload(), 250)
    return () => clearTimeout(t)
  }, [assinante, pleno.estado, restaurando])
  const dbVis = useMemo(() => (PROT_ATIVO && pleno.estado === 'ok' ? hidratar(st.db) : st.db), [st.db, pleno.estado])
  const noServidor = (fn) => { const x = sessaoRef.current; if (SERVIDOR && x && x.admin) fn() }
  const api = useMemo(() => ({
    entrar: (nome, plano, admin) => setSt((s) => ({ ...s, sessao: { nome, plano, admin } })),
    sair: () => { if (SERVIDOR) SB.sair(); setSt((s) => ({ ...s, sessao: null })) },
    definirSessao: (sessao) => setSt((s) => ({ ...s, sessao })),
    fimRestauro: () => setRestaurando(false),
    cadastrar: (c) => setSt((s) => ({ ...s, cadastros: [...(s.cadastros || []), c], sessao: { nome: c.nome, plano: 'anjo', admin: false, email: c.email } })),
    entrarCadastro: (email) => setSt((s) => {
      const c = (s.cadastros || []).find((x) => x.email === email)
      return c ? { ...s, sessao: { nome: c.nome, plano: c.plano || 'anjo', admin: false, email } } : s
    }),
    removerCadastro: (email) => setSt((s) => ({ ...s, cadastros: (s.cadastros || []).filter((x) => x.email !== email), sessao: s.sessao && s.sessao.email === email ? null : s.sessao })),
    mudarPlano: (plano) => setSt((s) => ({ ...s, sessao: { ...s.sessao, plano }, cadastros: (s.cadastros || []).map((c) => (s.sessao && c.email === s.sessao.email ? { ...c, plano } : c)) })),
    salvarItem: (col, item) => {
      noServidor(() => enviarItem(col, item))
      setSt((s) => {
        const l = s.db[col]
        const tem = l.some((i) => i.id === item.id)
        return { ...s, db: { ...s.db, [col]: tem ? l.map((i) => (i.id === item.id ? item : i)) : [...l, item] } }
      })
    },
    removerItem: (col, id) => { noServidor(() => enviarRemocao(col, id)); setSt((s) => ({ ...s, db: { ...s.db, [col]: s.db[col].filter((i) => i.id !== id) } })) },
    salvarConfig: (c) => { noServidor(() => enviarConfig(c)); setSt((s) => ({ ...s, db: { ...s.db, config: c } })) },
    criarPedido: (p) => setSt((s) => ({ ...s, pedidos: [...s.pedidos, p] })),
    pagarPedido: (id) => setSt((s) => ({ ...s, pedidos: s.pedidos.map((p) => (p.id === id ? { ...p, status: 'pago' } : p)) })),
    marcarTarefa: (k) => setSt((s) => ({ ...s, tarefas: { ...s.tarefas, [k]: !s.tarefas[k] } })),
    usarEntrada: () => setSt((s) => ({ ...s, entradasSala: s.entradasSala + 1 })),
    salvarAnotacao: (a) => setSt((s) => ({ ...s, anotacoes: [{ ...a, id: 'an-' + novoId(), quando: new Date().toISOString() }, ...(s.anotacoes || [])] })),
    marcarLido: (k) => setSt((s) => (s.lidos && s.lidos[k] ? s : { ...s, lidos: { ...(s.lidos || {}), [k]: true } })),
    removerAnotacao: (id) => setSt((s) => ({ ...s, anotacoes: (s.anotacoes || []).filter((a) => a.id !== id) })),
    salvarEfode: (nome, fn) => setSt((s) => ({ ...s, efodes: { ...(s.efodes || {}), [nome]: fn({ ...EFODE_INICIAL, ...((s.efodes || {})[nome] || {}) }) } })),
    assinar: ({ plano, periodo, pct, cupom, valor }) => setSt((s) => ({
      ...s,
      sessao: { ...s.sessao, plano },
      cadastros: (s.cadastros || []).map((c) => (s.sessao && c.email === s.sessao.email ? { ...c, plano } : c)),
      assinaturas: [...(s.assinaturas || []), { id: 'as-' + novoId(), nome: s.sessao ? s.sessao.nome : '', plano, periodo, pct, cupom, valor, data: new Date().toLocaleDateString('pt-BR') }],
      cuponsUsos: cupom ? { ...(s.cuponsUsos || {}), [cupom]: ((s.cuponsUsos || {})[cupom] || 0) + 1 } : (s.cuponsUsos || {}),
    })),
    reiniciar: () => setSt(INICIAL),
    recarregarConteudo: () => setPleno({ estado: 'ocioso' }),
    atualizarEdicoes: () => buscarEdicoes.current(),
  }), [])
  return <Ctx.Provider value={{ ...st, db: dbVis, ...api, restaurando, plenoEstado: pleno.estado }}><SessaoServidor /><AvisoSincronia />{children}</Ctx.Provider>
}

/* ───────────── PEÇAS VISUAIS ───────────── */

const ESTRELAS = Array.from({ length: 46 }, (_, i) => [(i * 97) % 800, (i * 53) % 230, (i % 3) * 0.5 + 0.6])

function Paisagem({ ceu = ['#0a0d2e', '#34186f'], monte = '#170c3a', monte2 = '#2b1962', luz = '#f3d98b', portal = true, tenda = false, rio = false, className = '' }) {
  const id = useMemo(() => 'p' + novoId(), [])
  return (
    <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" className={'paisagem ' + className} aria-hidden="true">
      <defs>
        <linearGradient id={id + 'c'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ceu[0]} /><stop offset="1" stopColor={ceu[1]} />
        </linearGradient>
        <radialGradient id={id + 'l'} cx="50%" cy="28%" r="45%">
          <stop offset="0" stopColor={luz} stopOpacity="0.55" /><stop offset="1" stopColor={luz} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="450" fill={`url(#${id}c)`} />
      {ESTRELAS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={luz} opacity={0.35 + (i % 4) * 0.15} />)}
      <rect width="800" height="450" fill={`url(#${id}l)`} />
      <path d="M0 450 L0 330 L140 230 L260 310 L400 130 L540 300 L660 220 L800 320 L800 450Z" fill={monte2} />
      {portal && <path d="M386 134 v-24 a14 14 0 0 1 28 0 v24Z" fill={luz} fillOpacity="0.35" stroke={luz} strokeWidth="3" />}
      <path d="M0 450 L0 385 L200 305 L360 372 L520 292 L700 382 L800 342 L800 450Z" fill={monte} />
      {rio && <path d="M330 450 C 360 410, 300 380, 380 350 S 430 320, 400 300" stroke={luz} strokeWidth="14" strokeOpacity="0.5" fill="none" strokeLinecap="round" />}
      {tenda && <path d="M150 400 L190 340 L230 400Z M190 340 L190 400" fill={luz} fillOpacity="0.45" stroke={luz} strokeWidth="2" />}
      <path d="M120 446 C 260 410, 300 335, 360 265 S 396 175, 400 138" stroke={luz} strokeWidth="2.5" strokeDasharray="3 9" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  )
}

function Estrelas() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const x = c.getContext('2d')
    const parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const es = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1 }))
    let raf = 0, w = 0, h = 0
    const tam = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; if (parado) des() }
    const des = () => {
      x.clearRect(0, 0, w, h)
      for (const e of es) {
        if (!parado) { e.y += e.z * 0.0011; if (e.y > 1) { e.y = 0; e.x = Math.random() } }
        x.globalAlpha = 0.3 + e.z * 0.7
        x.fillStyle = e.z > 0.8 ? '#f3d98b' : '#ffffff'
        x.beginPath(); x.arc(e.x * w, e.y * h, e.z * 1.6, 0, 7); x.fill()
      }
      if (!parado) raf = requestAnimationFrame(des)
    }
    tam(); if (!parado) des()
    window.addEventListener('resize', tam)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', tam) }
  }, [])
  return <canvas ref={ref} className="estrelas" aria-hidden="true" />
}

function Capa({ item }) {
  if (item.capaUrl) return <img className="capa" src={item.capaUrl} alt={'Capa do livro ' + item.titulo} />
  return (
    <div className="capa capa-gerada" role="img" aria-label={'Capa provisória de ' + item.titulo}>
      <span className="capa-marca">CÓDIGOS AVIVAR</span>
      <strong>{item.titulo}</strong>
      <span>{item.autor || 'autor em breve'}</span>
    </div>
  )
}

// Foto por cima da paisagem desenhada. Se o arquivo não existir em public/img, a paisagem continua aparecendo.
function Foto({ src, veu = true, reserva }) {
  const [ok, setOk] = useState(true)
  const [usaReserva, setUsaReserva] = useState(false)
  const atual = usaReserva ? reserva : src
  if (!ok || !atual) return null
  return <><img className="foto" src={atual} alt="" onError={() => { if (!usaReserva && reserva) setUsaReserva(true); else setOk(false) }} />{veu && <span className="veu" />}</>
}
// Miniatura do clima da Sala Profética: paisagem desenhada por baixo, foto por cima quando existir.
function ClimaImg({ id }) {
  return (
    <div className="clima-box">
      <Paisagem className="miniatura" {...(CLIMAS[id] || {})} />
      <Foto src={'/img/clima-' + id + '.webp'} veu={false} />
    </div>
  )
}
// Cabeçalho da Sala Quântica: foto cósmica se existir; senão estrelas e órbitas desenhadas.
function FundoQuantico() {
  const [ok, setOk] = useState(true)
  return (
    <>
      {ok && <img className="foto" src="/img/sala-quantica.webp" alt="" onError={() => setOk(false)} />}
      <Estrelas />
      <VideoVivo nome="sala-quantica" />
      <ControlesSom nome="sala-quantica" />
      <Particulas tipo="rede" />
      {ok ? <span className="veu veu-leve" /> : <div className="orbita" aria-hidden="true"><i /><i /><i /></div>}
    </>
  )
}
// Partículas em movimento por cima das imagens de entrada. Cada ambiente tem o seu tipo.
const PARTICULAS = {
  brasas: { n: 55, cor: '#f3d98b', r: [0.8, 2.6], v: [0.0004, 0.0012], dir: [0, -1], brilho: 8 },
  estrelas: { n: 110, cor: '#dfe6ff', r: [0.5, 1.7], v: [0.00002, 0.00008], dir: [1, 0], brilho: 5, pisca: true, cadente: true },
  rede: { n: 46, cor: '#b9a6ff', r: [1, 2.3], v: [0.00008, 0.00022], dir: [0, 0], brilho: 7, pisca: true, rede: true, cadente: true },
  poeira: { n: 60, cor: '#fff2c9', r: [0.6, 2], v: [0.00008, 0.0003], dir: [0.3, -0.5], brilho: 6 },
  vento: { n: 55, cor: '#ecd9a8', r: [0.5, 1.6], v: [0.0006, 0.0016], dir: [1, 0.12], brilho: 2 },
  neblina: { n: 24, cor: '#e6ecff', r: [0.5, 1.4], v: [0.00006, 0.00018], dir: [0.6, -0.1], brilho: 3, nevoa: 7, corNevoa: '190,200,225' },
  luz: { n: 52, cor: '#f3d98b', r: [0.9, 2.4], v: [0.00008, 0.00022], dir: [0, 0], brilho: 9, pisca: true, rede: true, cadente: true, nevoa: 4, corNevoa: '212,175,55' },
  agua: { n: 40, cor: '#a8f0e2', r: [0.6, 1.8], v: [0.00005, 0.0002], dir: [0.2, -0.2], brilho: 6, nevoa: 5, corNevoa: '110,200,210' },
  'rede-violeta': { n: 46, cor: '#d9c2ff', r: [1, 2.3], v: [0.00008, 0.00022], dir: [0, 0], brilho: 8, pisca: true, rede: true, cadente: true, nevoa: 4, corNevoa: '160,110,255' },
  'rede-ciano': { n: 50, cor: '#9be8ff', r: [1, 2.4], v: [0.0001, 0.00026], dir: [0, 0], brilho: 8, pisca: true, rede: true },
  'rede-azul': { n: 44, cor: '#b6cdff', r: [1, 2.2], v: [0.00008, 0.0002], dir: [0, 0], brilho: 7, pisca: true, rede: true, cadente: true },
  'vaga-lume': { n: 40, cor: '#dcffa6', r: [1.3, 3], v: [0.0001, 0.00036], dir: [0.12, -0.22], brilho: 13, pisca: true },
}
const parouMovimento = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
function Particulas({ tipo = 'brasas' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (parouMovimento()) return undefined
    const cfg = PARTICULAS[tipo] || PARTICULAS.brasas
    const c = ref.current
    const x = c.getContext('2d')
    const rnd = (a, b) => a + Math.random() * (b - a)
    const aleatoria = cfg.dir[0] === 0 && cfg.dir[1] === 0
    const ps = Array.from({ length: cfg.n }, () => {
      const ang = Math.random() * 6.283
      return { x: Math.random(), y: Math.random(), v: rnd(cfg.v[0], cfg.v[1]), r: rnd(cfg.r[0], cfg.r[1]), f: Math.random() * 6, dx: aleatoria ? Math.cos(ang) : cfg.dir[0], dy: aleatoria ? Math.sin(ang) : cfg.dir[1] }
    })
    const nev = Array.from({ length: cfg.nevoa || 0 }, () => ({ x: Math.random(), y: 0.3 + Math.random() * 0.7, r: rnd(0.25, 0.5), v: rnd(0.00005, 0.00015) * (Math.random() < 0.5 ? -1 : 1), a: rnd(0.05, 0.12) }))
    let cad = null, proxima = 400, raf = 0, w = 0, h = 0, t = 0
    const tam = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight }
    const des = () => {
      t += 0.02
      x.clearRect(0, 0, w, h)
      x.shadowBlur = 0
      for (const n of nev) {
        n.x += n.v
        if (n.x < -0.5) n.x = 1.5
        if (n.x > 1.5) n.x = -0.5
        const g = x.createRadialGradient(n.x * w, n.y * h, 0, n.x * w, n.y * h, n.r * w)
        g.addColorStop(0, 'rgba(' + cfg.corNevoa + ',' + n.a + ')'); g.addColorStop(1, 'rgba(' + cfg.corNevoa + ',0)')
        x.globalAlpha = 1; x.fillStyle = g; x.fillRect(0, 0, w, h)
      }
      for (const p of ps) {
        p.x += p.dx * p.v + Math.sin(t + p.f) * 0.0002
        p.y += p.dy * p.v
        if (p.x > 1.03) p.x = -0.03
        if (p.x < -0.03) p.x = 1.03
        if (p.y < -0.03) p.y = 1.03
        if (p.y > 1.03) p.y = -0.03
      }
      if (cfg.rede) {
        x.lineWidth = 0.7
        const lim = Math.max(90, w * 0.14)
        for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
          const d = Math.hypot((ps[i].x - ps[j].x) * w, (ps[i].y - ps[j].y) * h)
          if (d < lim) { x.globalAlpha = (1 - d / lim) * 0.32; x.strokeStyle = cfg.cor; x.beginPath(); x.moveTo(ps[i].x * w, ps[i].y * h); x.lineTo(ps[j].x * w, ps[j].y * h); x.stroke() }
        }
      }
      for (const p of ps) {
        x.globalAlpha = cfg.pisca ? 0.2 + 0.7 * Math.abs(Math.sin(t * 1.2 + p.f)) : 0.25 + 0.5 * Math.abs(Math.sin(t * 1.5 + p.f))
        x.fillStyle = cfg.cor; x.shadowColor = cfg.cor; x.shadowBlur = cfg.brilho
        x.beginPath(); x.arc(p.x * w, p.y * h, p.r, 0, 7); x.fill()
      }
      x.shadowBlur = 0
      if (cfg.cadente) {
        proxima -= 1
        if (!cad && proxima <= 0) { cad = { x: rnd(0.1, 0.7), y: rnd(0.02, 0.35), vida: 1 }; proxima = 450 + Math.random() * 400 }
        if (cad) {
          const px = cad.x * w, py = cad.y * h
          const g = x.createLinearGradient(px, py, px - 90, py - 45)
          g.addColorStop(0, 'rgba(255,255,255,' + cad.vida + ')'); g.addColorStop(1, 'rgba(255,255,255,0)')
          x.globalAlpha = 1; x.strokeStyle = g; x.lineWidth = 1.4
          x.beginPath(); x.moveTo(px, py); x.lineTo(px - 90, py - 45); x.stroke()
          cad.x += 0.012; cad.y += 0.006; cad.vida -= 0.025
          if (cad.vida <= 0) cad = null
        }
      }
      raf = requestAnimationFrame(des)
    }
    tam(); des()
    window.addEventListener('resize', tam)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', tam) }
  }, [tipo])
  return <canvas ref={ref} className="brasas" aria-hidden="true" />
}
const Brasas = () => <Particulas tipo="brasas" />

// Vídeo em loop por cima da imagem, se existir public/img/NOME.mp4. Sem o arquivo, nada aparece e a imagem continua em movimento.
function VideoVivo({ nome }) {
  const [ok, setOk] = useState(true)
  const [on, setOn] = useState(false)
  const poupar = typeof navigator !== 'undefined' && !!navigator.connection && !!navigator.connection.saveData
  if (!ok || !nome || poupar || parouMovimento()) return null
  return <video className={'fundo-video' + (on ? ' on' : '')} src={'/img/' + nome + '.mp4'} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" onPlaying={() => setOn(true)} onError={() => setOk(false)} />
}

// Botões de som e de tela grande para os vídeos que têm áudio. Fica dentro da caixa do vídeo e age no <video> que estiver ali.
// O navegador só libera o som depois de um toque da pessoa, por isso o vídeo começa mudo e o botão liga o áudio.
const COM_SOM = ['sala-quantica', 'montanha', 'jornada', 'cursos', 'tab-oracao-salas']
let videoComSom = null
function ControlesSom({ nome }) {
  const raiz = useRef(null)
  const [pronto, setPronto] = useState(false)
  const [som, setSom] = useState(false)
  const [grande, setGrande] = useState(false)
  const achar = () => { const p = raiz.current && raiz.current.parentElement; return p ? p.querySelector('video') : null }
  useEffect(() => {
    const p = raiz.current && raiz.current.parentElement
    if (!p) return undefined
    const ver = () => { const v = p.querySelector('video'); if (v && v.readyState >= 1) setPronto(true) }
    const vol = () => { const v = p.querySelector('video'); if (!v) return; const lig = !v.muted && v.volume > 0; setSom(lig); window.dispatchEvent(new CustomEvent('avivar-video-som', { detail: lig })) }
    const tela = () => {
      const v = p.querySelector('video')
      const dentro = !!(document.fullscreenElement || document.webkitFullscreenElement)
      setGrande(dentro)
      if (v && !dentro) v.controls = false
    }
    ver()
    p.addEventListener('loadedmetadata', ver, true)
    p.addEventListener('loadeddata', ver, true)
    p.addEventListener('volumechange', vol, true)
    p.addEventListener('webkitendfullscreen', tela, true)
    document.addEventListener('fullscreenchange', tela)
    document.addEventListener('webkitfullscreenchange', tela)
    return () => {
      p.removeEventListener('loadedmetadata', ver, true)
      p.removeEventListener('loadeddata', ver, true)
      p.removeEventListener('volumechange', vol, true)
      p.removeEventListener('webkitendfullscreen', tela, true)
      document.removeEventListener('fullscreenchange', tela)
      document.removeEventListener('webkitfullscreenchange', tela)
      window.dispatchEvent(new CustomEvent('avivar-video-som', { detail: false }))
    }
  }, [])
  if (!COM_SOM.includes(nome)) return null
  const ligar = (v) => {
    if (videoComSom && videoComSom !== v) videoComSom.muted = true
    v.muted = false
    v.volume = 1
    videoComSom = v
    const r = v.play()
    if (r && r.catch) r.catch(() => {})
  }
  const alternarSom = (e) => {
    e.preventDefault(); e.stopPropagation()
    const v = achar()
    if (!v) return
    if (v.muted || v.volume === 0) ligar(v); else v.muted = true
  }
  const alternarTela = (e) => {
    e.preventDefault(); e.stopPropagation()
    const v = achar()
    if (!v) return
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const sair = document.exitFullscreen || document.webkitExitFullscreen
      if (sair) sair.call(document)
      return
    }
    ligar(v)
    v.controls = true
    const abrir = v.requestFullscreen || v.webkitRequestFullscreen
    if (abrir) { const r = abrir.call(v); if (r && r.catch) r.catch(() => { v.controls = false }) } else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen()
  }
  return (
    <span ref={raiz} data-livre="1" className={'vsom-barra' + (pronto ? ' on' : '')}>
      <button type="button" className={'vsom-btn' + (som ? ' ativo' : '')} onClick={alternarSom} aria-pressed={som} aria-label={som ? 'Desligar o som do vídeo' : 'Ativar o som do vídeo'} tabIndex={pronto ? 0 : -1}>
        <span aria-hidden="true">{som ? '🔊' : '🔇'}</span><b>{som ? 'Som do vídeo ligado' : 'Ativar som do vídeo'}</b>
      </button>
      <button type="button" className="vsom-btn" onClick={alternarTela} aria-pressed={grande} aria-label={grande ? 'Sair da tela grande' : 'Ver o vídeo em tela grande'} tabIndex={pronto ? 0 : -1}>
        <span aria-hidden="true">{grande ? '✕' : '⛶'}</span><b>{grande ? 'Sair' : 'Tela grande'}</b>
      </button>
    </span>
  )
}
const VIDA_CLIMA = { celestial: 'estrelas', mistico: 'rede', angelical: 'poeira', rio: 'agua', deserto: 'vento', montanha: 'neblina', presenca: 'poeira' }

// Fundo que ganha vida: ao mexer o mouse (ou tocar, rolar, apertar uma tecla), ou depois de 8 segundos parado, ele começa a se mover.
// Se existir public/img/NOME.mp4, o vídeo toca em loop por cima da imagem.
// Sem o vídeo, a imagem respira, acompanha o mouse e solta brasas douradas. Com "reduzir movimento" ligado no aparelho, fica parada.
function FundoVivo({ nome }) {
  const [imgOk, setImgOk] = useState(true)
  const [videoOk, setVideoOk] = useState(true)
  const [ativo, setAtivo] = useState(false)
  const [tocando, setTocando] = useState(false)
  const caixa = useRef(null)
  const vid = useRef(null)
  const parado = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const poupar = typeof navigator !== 'undefined' && !!navigator.connection && !!navigator.connection.saveData
  const podeVideo = videoOk && !poupar
  useEffect(() => {
    if (parado) return undefined
    const ligar = () => setAtivo(true)
    const t = setTimeout(ligar, 8000)
    const eventos = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'scroll']
    eventos.forEach((e) => window.addEventListener(e, ligar, { once: true, passive: true }))
    return () => { clearTimeout(t); eventos.forEach((e) => window.removeEventListener(e, ligar)) }
  }, [parado])
  useEffect(() => {
    if (!ativo || parado) return undefined
    const el = caixa.current
    const mover = (e) => {
      el.style.setProperty('--px', ((e.clientX / window.innerWidth - 0.5) * -18).toFixed(1) + 'px')
      el.style.setProperty('--py', ((e.clientY / window.innerHeight - 0.5) * -12).toFixed(1) + 'px')
    }
    window.addEventListener('pointermove', mover, { passive: true })
    return () => window.removeEventListener('pointermove', mover)
  }, [ativo, parado])
  useEffect(() => {
    const v = vid.current
    if (!v) return undefined
    v.muted = true
    v.play().catch(() => {})
    const ver = () => { if (document.hidden) v.pause(); else v.play().catch(() => {}) }
    document.addEventListener('visibilitychange', ver)
    return () => document.removeEventListener('visibilitychange', ver)
  }, [ativo, podeVideo])
  const semVideo = !podeVideo
  return (
    <div ref={caixa} className={'fundo-vivo' + (ativo && semVideo && !parado ? ' respira' : '')}>
      {imgOk && <img className="foto-vivo" src={'/img/' + nome + '.webp'} alt="" onError={() => setImgOk(false)} />}
      {ativo && podeVideo && !parado && (
        <video ref={vid} className={'fundo-video' + (tocando ? ' on' : '')} src={'/img/' + nome + '.mp4'} autoPlay muted loop playsInline preload="auto" aria-hidden="true" onPlaying={() => setTocando(true)} onError={() => setVideoOk(false)} />
      )}
      {ativo && semVideo && !parado && <Brasas />}
      <span className="veu" />
    </div>
  )
}

// Imagem de entrada: ocupa a metade esquerda, com um efeito próprio por página (classe fx-<video>);
// os dados da página (children) ficam na metade direita. Em telas estreitas, a imagem vem em cima e os dados embaixo.
const Faixa = ({ src, reserva, titulo, frase, vida, video, pulso, children }) => (
  <section className={'faixa-par' + (children ? '' : ' so-imagem')}>
    <div className={'faixa' + (video ? ' fx-' + video : '') + (pulso ? ' pulsa' : '')}>
      <div className="faixa-camada"><Foto src={src} reserva={reserva} veu={false} /><VideoVivo nome={video} /></div>
      <span className="veu" />
      <ControlesSom nome={video} />
      {[].concat(vida || []).map((v) => <Particulas key={v} tipo={v} />)}
      <div className="faixa-texto"><h2>{titulo}</h2>{frase && <p>{frase}</p>}</div>
    </div>
    {children && <div className="faixa-dados">{children}</div>}
  </section>
)

// Selo de conteúdo não comprovado: letras grandes, cor por origem, e sempre diz de onde vem e o que se relaciona.
const ORIGENS_NC = { 'HIPÓTESE': 'azul', 'TRADIÇÃO': 'ambar', 'FILOSOFIA': 'roxo', 'TESTEMUNHO': 'verde', 'ANALOGIA': 'azul' }
function OrigemNC({ tipo = 'HIPÓTESE', origem, relacionado, children }) {
  const t = String(tipo).trim().toUpperCase()
  return (
    <aside className={'origem-nc ' + (ORIGENS_NC[t] || 'ambar')} role="note">
      <b className="onc-titulo">ORIGEM NÃO COMPROVADA · {t}</b>
      {origem && <p className="onc-linha"><b>ORIGEM:</b> {origem}</p>}
      {relacionado && <p className="onc-linha"><b>RELACIONADO:</b> {relacionado}</p>}
      {children && <p className="onc-corpo">{children}</p>}
      <b className="onc-rodape">NÃO É DOUTRINA NEM REVELAÇÃO. A REVELAÇÃO VEM SOMENTE DE DEUS, PELO ESPÍRITO SANTO.</b>
    </aside>
  )
}
const Selo = ({ children, tipo = '' }) => <span className={'selo ' + tipo}>{children}</span>

// Cartão creme de curiosidade: completa a última fileira de uma grade.
// Cada vez que o cartão gira para mostrar o verso, aparece uma informação diferente (textos, a partir de "inicio", de "passo" em "passo").
function CartaoCuriosidade({ texto, textos, inicio = 0, passo = 1, rotulo = 'CURIOSIDADE', sempre, como = 'aside', children }) {
  const Tag = como
  const [virado, setVirado] = useState(false)
  const [giros, setGiros] = useState(0)
  // Com conteúdo próprio (ex.: Interpretação Teológica dos marcos): cartão fixo, creme, texto justificado.
  if (children) {
    return (
      <Tag className={'cartao curiosidade' + (sempre ? ' sempre' : '')} aria-label={rotulo.toLowerCase()}>
        <span className="cur-rotulo">{rotulo}</span>
        {children}
      </Tag>
    )
  }
  const lista = textos && textos.length ? textos : [texto]
  const pos = (inicio + Math.max(0, giros - 1) * passo) % lista.length
  const atual = lista[pos]
  // Ao virar para o verso, já entra a próxima curiosidade (o verso está escondido nesse momento).
  const virar = () => {
    if (!virado) setGiros((g) => g + 1)
    setVirado((v) => !v)
    try { somTique(true) } catch (e) { /* som é opcional */ }
  }
  return (
    <Tag className="cur-giro" data-livre>
      <button type="button" className={'cur-flip' + (virado ? ' virado' : '')} onClick={virar} aria-pressed={virado} aria-label={virado ? 'Curiosidade: ' + atual + ' Toque para virar de volta.' : 'Curiosidade. Toque para virar o cartão e ler.'}>
        <span className="cur-face cur-frente" aria-hidden={virado}>
          <small>{rotulo}</small>
          <b>Você sabia?</b>
          <em>TOQUE PARA VIRAR ↻</em>
        </span>
        <span className="cur-face cur-verso" aria-hidden={!virado}>
          <small>{rotulo}{lista.length > 1 ? ' · ' + (pos + 1) + ' DE ' + lista.length : ''}</small>
          <span className="cur-texto">{atual}</span>
        </span>
      </button>
    </Tag>
  )
}

// Quantas colunas a grade de livros mostra agora: 4 em tela larga, 3 em tela média, 2 no celular.
function useColunasLivros() {
  const calc = () => (typeof window === 'undefined' ? 4 : window.innerWidth >= 1000 ? 4 : window.innerWidth > 760 ? 3 : 2)
  const [n, setN] = useState(calc)
  useEffect(() => {
    const f = () => setN(calc())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return n
}

// Grade de colunas (três por padrão; colunas="livros" usa 4/3/2). Se a última fileira ficar incompleta, os lugares vazios recebem curiosidades sobre o tema.
// tema: chave de CURIOSIDADES. extras: cartões próprios para usar no lugar das curiosidades.
function GradeTres({ className = '', tema, extras, tag = 'div', itens = 'aside', colunas = 3, children, ...resto }) {
  const doLivros = useColunasLivros()
  const cols = colunas === 'livros' ? doLivros : colunas
  const filhos = React.Children.toArray(children)
  const falta = filhos.length ? (cols - (filhos.length % cols)) % cols : 0
  const pool = CURIOSIDADES[tema] || []
  const textos = pool.map((c) => c[0])
  const Tag = tag
  const fim = []
  for (let i = 0; i < falta; i++) {
    if (extras && extras[i]) fim.push(React.cloneElement(extras[i], { key: 'cur' + i }))
    else if (textos.length) fim.push(<CartaoCuriosidade key={'cur' + i} como={itens} textos={textos} inicio={i} passo={falta} />)
  }
  return <Tag className={className} {...resto}>{filhos}{fim}</Tag>
}
const Aviso = ({ children, forte }) => <div className={'aviso' + (forte ? ' aviso-forte' : '')} role="status">{children}</div>

function Tela({ url, titulo }) {
  const u = embed(url)
  const ref = useRef(null)
  const [nativa, setNativa] = useState(false)
  const [simulada, setSimulada] = useState(false)
  useEffect(() => {
    const f = () => { const el = document.fullscreenElement || document.webkitFullscreenElement; setNativa(!!el && el === ref.current) }
    document.addEventListener('fullscreenchange', f); document.addEventListener('webkitfullscreenchange', f)
    return () => { document.removeEventListener('fullscreenchange', f); document.removeEventListener('webkitfullscreenchange', f) }
  }, [])
  // Em aparelhos que não liberam a tela cheia do navegador (alguns iPhones), a tela cheia é simulada: o vídeo cobre a janela inteira.
  useEffect(() => {
    if (!simulada) return undefined
    const k = (e) => { if (e.key === 'Escape') setSimulada(false) }
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [simulada])
  if (!u) return <div className="tela tela-vazia"><span>ON LINE</span><small>Programação em breve</small></div>
  const cheia = nativa || simulada
  const alternar = () => {
    if (simulada) { setSimulada(false); return }
    if (nativa) { const sai = document.exitFullscreen || document.webkitExitFullscreen; if (sai) sai.call(document); return }
    const el = ref.current
    const pede = el && (el.requestFullscreen || el.webkitRequestFullscreen)
    if (!pede) { setSimulada(true); return }
    try { const r = pede.call(el); if (r && r.catch) r.catch(() => setSimulada(true)) } catch (e) { setSimulada(true) }
  }
  return (
    <div className="tela-envolve">
      <div className={'tela' + (simulada ? ' tela-simulada' : '')} ref={ref}>
        <iframe src={u} title={titulo || 'Vídeo'} allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        {simulada && <button type="button" className="tela-fechar" onClick={() => setSimulada(false)}>Sair da tela cheia</button>}
      </div>
      <div className="tela-barra">
        <button type="button" className="btn tela-cheia" onClick={alternar} aria-pressed={cheia}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          {cheia ? 'SAIR DA TELA CHEIA' : 'TELA CHEIA'}
        </button>
      </div>
    </div>
  )
}

const BotaoMinisterio = ({ fixo }) => (
  <a className={'btn-ministerio' + (fixo ? ' fixo' : '')} href={MINISTERIO} aria-label="Voltar ao site do Ministério Avivar do Espírito">
    MINISTÉRIO
  </a>
)

function EditarLink({ col }) {
  const { sessao } = useLoja()
  if (!sessao || !sessao.admin) return null
  return <Link className="editar-link no-print" to={'/admin/' + col}>✎ Editar esta página (admin)</Link>
}

/* ───────────── CASCA (menu, topo, voltar) ───────────── */

// Menu em grupos, cada um com uma cor suave (cor = classe g0 a g4 no styles.css)
const MENU_GRUPOS = [
  { cor: 'g0', itens: [['/inicio', 'Início'], ['/tv', 'ON LINE'], ['/o-que-sao', 'Códigos Avivar']] },
  { cor: 'g5', itens: [['/jornada', 'Minha Jornada'], ['/efode', 'Túnica com Éfode']] },
  { cor: 'g6', itens: [['/livros', 'Livros Avivar'], ['/biblioteca', 'Biblioteca Avivar']] },
  { cor: 'g2', itens: [['/cursos', 'Cursos Avivar'], ['/reportagens', 'Estudos Avivar'], ['/estudos-profeticos', 'Estudos Proféticos'], ['/jornada-das-estacoes', 'Jornada das Estações'], ['/mestre-avivar', 'Mestre Avivar']] },
  { cor: 'g1', itens: [['/tabua-dos-apocrifos', 'Tábua dos Apócrifos'], ['/canon-e-reforma', 'Cânon e Reforma'], ['/igrejas-protestantes', 'Igrejas Protestantes']] },
  { cor: 'g4', itens: [['/montanha-profetica', 'Montanha Profética'], ['/sala-profetica', 'Sala Profética']] },
  { cor: 'g3', itens: [['/sala-quantica', 'Sala Quântica'], ['/tabernaculo-de-oracao', 'Tabernáculo de Oração'], ['/espirito', 'Códigos do Espírito']] },
  { cor: 'g0', itens: [['/planos', 'Planos'], ['/perfil', 'Meu Perfil']] },
]
const MENU = MENU_GRUPOS.flatMap((g) => g.itens)
const ATALHOS_INICIO = ['/tv', '/o-que-sao', '/reportagens', '/jornada', '/efode', '/livros', '/biblioteca', '/cursos', '/estudos-profeticos', '/jornada-das-estacoes', '/mestre-avivar', '/montanha-profetica']


// Em todas as sessões de estudo aparece a vitrine com os Livros Avivar (no curso, primeiro os livros daquele curso).
const SESSOES_ESTUDO = ['/cursos', '/reportagens', '/estudos-profeticos', '/jornada', '/jornada-das-estacoes', '/mestre-avivar', '/sala-profetica', '/sala-quantica', '/tabernaculo-de-oracao', '/tabua-dos-apocrifos', '/canon-e-reforma', '/igrejas-protestantes', '/montanha-profetica', '/efode']

function Shell({ titulo, editar, children }) {
  const { sessao, sair, db: dbLoja } = useLoja()
  const nav = useNavigate()
  const loc = useLocation()
  const [aberto, setAberto] = useState(false)
  const [ocultas, setOcultas] = useState(() => { try { return JSON.parse(localStorage.getItem('codigos-avivar-barras') || '{}') || {} } catch (e) { return {} } })
  const alternarBarra = (qual) => setOcultas((o) => { const n = { ...o, [qual]: !o[qual] }; try { localStorage.setItem('codigos-avivar-barras', JSON.stringify(n)) } catch (e) { /* sem efeito */ } return n })
  const aoVivo = useAoVivo()
  const vitrine = useContext(VitrineCtx)
  const captura = useCapturaVitrine()
  const travado = !ehAssinante(sessao)
  const faixaLivros = loc.pathname !== '/estudos-profeticos' && SESSOES_ESTUDO.some((p) => loc.pathname === p || loc.pathname.startsWith(p + '/'))
  const cursoFaixa = (loc.pathname.match(/^\/cursos\/([^/]+)/) || [])[1]
  useEffect(() => { setAberto(false); window.scrollTo(0, 0) }, [loc.pathname])
  const voltar = () => { if (window.history.length > 1) nav(-1); else nav(sessao ? '/inicio' : '/') }
  return (
    <div className={'app' + (ocultas.menus ? ' oculta-menus' : '') + (ocultas.acoes ? ' oculta-acoes' : '')}>
      <aside className={'lateral' + (aberto ? ' aberta' : '')} aria-label="Menu do Códigos Avivar">
        <Link to="/" className="marca"><b>CÓDIGOS AVIVAR</b><small>Profetas dos Últimos Dias</small></Link>
        <nav>
          {MENU_GRUPOS.map((g, i) => (
            <div key={i} className={'menu-grupo ' + g.cor}>
              {g.itens.map(([to, t]) => <NavLink key={to} to={to}>{t}{((travado && MENUS_TRAVADOS.includes(to)) || (to === '/espirito' && !temEspirito(sessao, dbLoja.config))) && <span className="cad" role="img" aria-label="conteúdo para assinantes">🔒</span>}{to === '/tv' && <span className={'ol-ponto ' + (aoVivo.ativo ? 'verde' : 'azul')} role="img" aria-label={aoVivo.ativo ? 'ao vivo' : 'fora do ar'} />}</NavLink>)}
            </div>
          ))}
          {sessao && sessao.admin && <NavLink to="/admin">Painel do admin</NavLink>}
          <a className="menu-ministerio" href={MINISTERIO}>Ministério</a>
          {sessao
            ? <button className="link-menu" onClick={() => { sair(); nav('/') }}>Sair</button>
            : <NavLink to="/entrar">Entrar</NavLink>}
        </nav>
      </aside>
      {aberto && <button className="fundo-menu" aria-label="Fechar menu" onClick={() => setAberto(false)} />}
      <div className="coluna">
        <header className="topo barra-acoes">
          <button className="btn-voltar" onClick={voltar} aria-label="Voltar para a página anterior">← Voltar</button>
          <h1>{titulo}</h1>
          <span id="slot-narrador" className="slot-narrador" data-no-narrar />
          <BotaoInstalar />
          <button type="button" className="barra-ocultar" onClick={() => alternarBarra('acoes')} aria-label="Ocultar a barra de voltar e ouvir" title="Ocultar esta barra">▾</button>
        </header>
        {ocultas.acoes && <button type="button" className="barra-alca alca-acoes" onClick={() => alternarBarra('acoes')} aria-label="Mostrar a barra de voltar e ouvir">▴ Voltar · Ouvir</button>}
        {ocultas.menus && <button type="button" className="barra-alca alca-menus" onClick={() => alternarBarra('menus')} aria-label="Mostrar a barra de menus">▾ Menus</button>}
        <main className="conteudo" {...(vitrine ? captura : {})}>
          {vitrine && <div className="faixa-vitrine" data-livre>🔒 <span>Você está vendo a vitrine: pode rolar e olhar. Para abrir o conteúdo, assine o plano Querubim ou Serafim.</span> <Link to="/planos">Ver os planos</Link></div>}
          {editar && <EditarLink col={editar} />}
          {children}
          {faixaLivros && <Suspense fallback={null}><LvFaixa sessao={sessao} cursoId={cursoFaixa} /></Suspense>}
        </main>
        <nav className="nav-inferior barra-menus" aria-label="Atalhos">
          <NavLink to="/inicio">Início</NavLink>
          <NavLink to="/jornada">Jornada</NavLink>
          <NavLink to="/livros">Livros</NavLink>
          <NavLink to="/sala-profetica">Sala</NavLink>
          <NavLink to="/perfil">Perfil</NavLink>
          <button onClick={() => setAberto((a) => !a)} aria-expanded={aberto}>Menu</button>
          <a className="barra-min" href={MINISTERIO} aria-label="Voltar ao site do Ministério Avivar do Espírito">Ministério</a>
          <button type="button" className="barra-ocultar" onClick={() => alternarBarra('menus')} aria-label="Ocultar a barra de menus" title="Ocultar esta barra">▴</button>
        </nav>
      </div>
    </div>
  )
}

function Privado({ children, admin, nivel }) {
  const { sessao, restaurando, plenoEstado, recarregarConteudo } = useLoja()
  const loc = useLocation()
  if (restaurando) return <div className="carregando" role="status">Carregando…</div>
  if (!sessao) return <Navigate to="/entrar" state={{ de: loc.pathname }} replace />
  if (admin && !sessao.admin) return <Navigate to="/inicio" replace />
  if (PROT_ATIVO && SERVIDOR && ehAssinante(sessao) && plenoEstado !== 'ok' && !(admin && plenoEstado === 'erro')) { // o admin sempre consegue entrar no painel, mesmo se o conteúdo não carregar
    if (plenoEstado === 'erro') return (
      <Shell titulo="Conteúdo">
        <div className="cartao bloqueio">
          <h2>Não foi possível carregar o conteúdo</h2>
          <p>Confira a internet e tente de novo. Se o problema continuar, avise o Ministério.</p>
          <div className="botoes centro"><button type="button" className="btn ouro" onClick={recarregarConteudo}>Tentar de novo</button></div>
        </div>
      </Shell>
    )
    return <div className="carregando" role="status">Carregando o conteúdo…</div>
  }
  return <PorPlano nivel={nivel}>{children}</PorPlano>
}

/* ───────────── ENTRADA E LOGIN ───────────── */

// ===== Som ambiente da entrada =====
// Gerado no próprio aparelho (Web Audio), sem arquivo de áudio: base grave que respira, um par de tons
// com diferença de 6 Hz entre os ouvidos (efeito binaural, melhor com fones), sopro de ondas e brilhos suaves.
const SOM_NIVEL = 0.5

// Cada ambiente tem o seu clima sonoro. Todos são sintetizados no próprio aparelho (nenhum arquivo de áudio).
// base: [frequência, volume, desafinação]; binaural: um tom em cada ouvido (a diferença de 6 Hz é a faixa teta, usada em relaxamento).
const PERFIS = {
  entrada: {
    base: [[110, 0.5, -4], [110, 0.5, 4], [165, 0.7, 0], [220, 0.5, 3]], corte: 520, volume: 0.16,
    binaural: [174, 180], ruido: [380, 0.05, 120], brilhos: [[659.25, 0.1, 0.008], [987.77, 0.13, 0.008]],
  },
  silencio: { // Sala Quântica: mais grave, mais ondas, quase sem brilhos
    base: [[98, 0.55, -3], [98, 0.55, 3], [146.83, 0.6, 0], [196, 0.4, 2]], corte: 420, volume: 0.17,
    binaural: [150, 156], ruido: [300, 0.075, 90], brilhos: [[783.99, 0.07, 0.005]],
  },
  profetica: { // Sala e Montanha Proféticas: acorde aberto e luminoso
    base: [[130.81, 0.5, -3], [196, 0.55, 3], [261.63, 0.5, 0], [329.63, 0.4, 2]], corte: 760, volume: 0.15,
    binaural: [200, 206], ruido: [460, 0.025, 140], brilhos: [[880, 0.09, 0.011], [1318.51, 0.12, 0.009]],
  },
}

Object.assign(PERFIS, {
  loja: { base: [[146.83, 0.5, -3], [220, 0.55, 3], [293.66, 0.45, 0], [369.99, 0.3, 2]], corte: 900, volume: 0.14, binaural: [210, 215], ruido: [600, 0.02, 200], brilhos: [[1174.66, 0.1, 0.012], [1567.98, 0.1, 0.01]] },
  biblioteca: { base: [[87.31, 0.55, -3], [130.81, 0.55, 3], [196, 0.4, 0], [261.63, 0.3, 2]], corte: 380, volume: 0.13, binaural: [180, 184], ruido: [260, 0.05, 80], brilhos: [[523.25, 0.06, 0.005]] },
  cursos: { base: [[110, 0.5, -3], [164.81, 0.55, 3], [246.94, 0.45, 0], [329.63, 0.3, 2]], corte: 640, volume: 0.14, binaural: [200, 210], ruido: [420, 0.03, 150], brilhos: [[880, 0.08, 0.01], [1318.51, 0.1, 0.008]] },
  quantica: { // Sala Quântica: ciência e mistério. Quintas abertas, pulso grave, chiado cósmico e notas cristalinas que surgem ao acaso
    base: [[55, 0.8, 0], [82.41, 0.5, 3], [123.47, 0.45, -3], [185, 0.25, 0]], corte: 620, volume: 0.17,
    binaural: [160, 166], ruido: [900, 0.025, 400], brilhos: [[1174.66, 0.08, 0.006], [1760, 0.11, 0.005]],
    pings: [659.25, 739.99, 880, 987.77, 1318.51, 1479.98],
  },
  'c-celestial': { base: [[130.81, 0.5, -3], [196, 0.55, 3], [261.63, 0.5, 0], [392, 0.3, 2]], corte: 800, volume: 0.15, binaural: [200, 206], ruido: [500, 0.02, 120], brilhos: [[1046.5, 0.1, 0.012], [1568, 0.13, 0.009]] },
  'c-mistico': { base: [[73.42, 0.7, -3], [110, 0.55, 3], [146.83, 0.5, 0], [174.61, 0.4, 2]], corte: 540, volume: 0.17, binaural: [170, 176], ruido: [330, 0.045, 100], brilhos: [[587.33, 0.07, 0.008], [880, 0.1, 0.006]], pings: [293.66, 349.23, 440, 523.25, 587.33] },
  'c-angelical': { base: [[220, 0.45, -2], [277.18, 0.5, 2], [329.63, 0.5, 0], [440, 0.4, 3]], corte: 1100, volume: 0.13, binaural: [210, 216], ruido: [800, 0.015, 200], brilhos: [[1318.51, 0.12, 0.014], [1760, 0.15, 0.012]], pings: [1046.5, 1318.51, 1567.98, 2093] },
  'c-rio': { base: [[98, 0.5, -3], [147, 0.5, 3], [196, 0.35, 0]], corte: 420, volume: 0.12, binaural: [180, 186], ruido: [650, 0.1, 260], brilhos: [[880, 0.08, 0.004]] },
  'c-deserto': { base: [[82.41, 0.7, -2], [123.47, 0.55, 2], [164.81, 0.3, 0]], corte: 360, volume: 0.15, binaural: [165, 171], ruido: [260, 0.085, 220], brilhos: [[659.25, 0.06, 0.004]] },
  'c-montanha': { base: [[87.31, 0.7, -2], [130.81, 0.55, 2], [174.61, 0.3, 0]], corte: 380, volume: 0.15, binaural: [175, 181], ruido: [300, 0.095, 260], brilhos: [[783.99, 0.06, 0.004]] },
  tabernaculo: { // Tabernáculo de Oração: todas as salas juntas. Grave cósmico, quintas abertas, brilho celestial e notas de sinos que surgem ao acaso
    base: [[55, 0.7, 0], [110, 0.5, -3], [164.81, 0.55, 3], [220, 0.4, 0], [329.63, 0.3, 2]], corte: 760, volume: 0.17,
    binaural: [190, 196], ruido: [520, 0.045, 220], brilhos: [[1046.5, 0.1, 0.01], [1567.98, 0.12, 0.008]],
    pings: [523.25, 659.25, 783.99, 987.77, 1318.51, 1567.98, 2093],
  },
  apocrifos: { // Tábua dos Apócrifos: caverna-arquivo. Grave de pedra, sopro de vento no deserto e gotas ao longe
    base: [[55, 0.7, 0], [82.41, 0.5, 3], [98, 0.35, -3], [146.83, 0.25, 0]], corte: 460, volume: 0.15,
    binaural: [170, 176], ruido: [700, 0.07, 300], brilhos: [[659.25, 0.05, 0.004]],
    pings: [392, 466.16, 587.33, 698.46],
  },
  'c-presenca': { base: [[130.81, 0.5, -2], [196, 0.5, 2], [261.63, 0.35, 0]], corte: 650, volume: 0.13, binaural: [210, 216], ruido: [420, 0.015, 80], brilhos: [[1046.5, 0.07, 0.007]] },
})

function montarSom(ctx, destino, p) {
  const mestre = ctx.createGain()
  mestre.gain.value = 0
  mestre.connect(destino)
  const fontes = []
  const osc = (f, alvo, detune = 0) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = detune; o.connect(alvo); o.start(); fontes.push(o); return o }
  const ganho = (v, alvo) => { const g = ctx.createGain(); g.gain.value = v; g.connect(alvo); return g }
  // 1) Base grave, que respira devagar
  const respira = ctx.createGain(); respira.gain.value = p.volume
  const passa = ctx.createBiquadFilter(); passa.type = 'lowpass'; passa.frequency.value = p.corte; passa.Q.value = 0.4
  respira.connect(passa); passa.connect(mestre)
  p.base.forEach(([f, v, d]) => osc(f, ganho(v, respira), d))
  osc(0.06, ganho(0.05, respira.gain))
  // 2) Tons binaurais, um em cada ouvido (funcionam melhor com fones)
  p.binaural.forEach((f, i) => {
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain()
    if (pan.pan) pan.pan.value = i === 0 ? -1 : 1
    pan.connect(mestre)
    osc(f, ganho(0.07, pan))
  })
  // 3) Ondas: ruído filtrado que vai e volta
  const ruido = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
  const d = ruido.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const fonteRuido = ctx.createBufferSource(); fonteRuido.buffer = ruido; fonteRuido.loop = true
  const faixa = ctx.createBiquadFilter(); faixa.type = 'bandpass'; faixa.frequency.value = p.ruido[0]; faixa.Q.value = 0.6
  const onda = ctx.createGain(); onda.gain.value = p.ruido[1]
  fonteRuido.connect(faixa); faixa.connect(onda); onda.connect(mestre); fonteRuido.start(); fontes.push(fonteRuido)
  osc(0.07, ganho(p.ruido[1] * 0.8, onda.gain))
  osc(0.05, ganho(p.ruido[2], faixa.frequency))
  // 4) Brilhos muito suaves, para o clima de mistério
  p.brilhos.forEach(([f, lfo, v]) => {
    const g = ctx.createGain(); g.gain.value = v; g.connect(mestre)
    osc(f, g)
    osc(lfo, ganho(v * 0.85, g.gain))
  })
  // 5) Notas cristalinas ao acaso (só nos ambientes que pedem)
  let tPing = 0
  if (p.pings) {
    const soar = () => {
      const t = ctx.currentTime
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = p.pings[Math.floor(Math.random() * p.pings.length)]
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
      if (ctx.createStereoPanner) { const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 2 - 1; o.connect(g); g.connect(pan); pan.connect(mestre) } else { o.connect(g); g.connect(mestre) }
      o.start(t); o.stop(t + 3.4)
      tPing = setTimeout(soar, 2200 + Math.random() * 4500)
    }
    tPing = setTimeout(soar, 1500)
  }
  return { mestre, parar: () => { clearTimeout(tPing); fontes.forEach((o) => { try { o.stop() } catch (e) { /* já parado */ } }) } }
}

const SOM = { ctx: null, grafos: {}, timer: 0 }
if (typeof window !== 'undefined') window.__somEstado = () => ({ estado: SOM.ctx ? SOM.ctx.state : 'sem-contexto', ganhos: Object.fromEntries(Object.entries(SOM.grafos).map(([k, g]) => [k, +g.mestre.gain.value.toFixed(3)])) })

function somAtivar() {
  if (!SOM.ctx) {
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
    if (!AC) return Promise.resolve(false)
    try { SOM.ctx = new AC() } catch (e) { SOM.ctx = null; return Promise.resolve(false) }
  }
  return SOM.ctx.resume().then(() => SOM.ctx.state === 'running').catch(() => false)
}

// Troca o clima sonoro com transição suave. nome = null silencia tudo.
function somPerfil(nome) {
  const c = SOM.ctx
  if (!c) return
  clearTimeout(SOM.timer)
  if (nome) {
    if (!SOM.grafos[nome]) SOM.grafos[nome] = montarSom(c, c.destination, PERFIS[nome])
    if (c.state !== 'running') c.resume().catch(() => {})
  }
  const t = c.currentTime
  Object.keys(SOM.grafos).forEach((k) => {
    const g = SOM.grafos[k], ga = g.mestre.gain, entra = k === nome
    clearTimeout(g.fim)
    ga.cancelScheduledValues(t); ga.setValueAtTime(ga.value, t)
    ga.linearRampToValueAtTime(entra ? SOM_NIVEL : 0, t + (entra ? 4 : 2.5))
    if (!entra) g.fim = setTimeout(() => { if (SOM.grafos[k] === g) { g.parar(); delete SOM.grafos[k] } }, 2800)
  })
  if (!nome) SOM.timer = setTimeout(() => { if (!Object.keys(SOM.grafos).length) { try { c.suspend() } catch (e) { /* sem efeito */ } } }, 3000)
}

// Efeitos pontuais (sintetizados no aparelho): respeitam o botão de som. Só tocam depois de um toque da pessoa.
const NOTAS_TAB = [392, 440, 493.88, 523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5, 1174.66, 1318.5]
function efeitoLiberado() { try { return localStorage.getItem('codigos-avivar-som') !== 'off' } catch (e) { return true } }
function comSom(fazer) {
  if (!efeitoLiberado()) return
  somAtivar().then((ok) => { if (!ok || !SOM.ctx) return; try { fazer(SOM.ctx, SOM.ctx.currentTime) } catch (e) { /* sem som */ } })
}
function ruidoCurto(c, seg) {
  const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seg)), c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const f = c.createBufferSource(); f.buffer = b
  return f
}
// Cada porta que se recolhe soa uma nota mais alta: oito notas formam uma escada.
function tocarNotaPorta(i) {
  comSom((c, t) => {
    const f = NOTAS_TAB[i % NOTAS_TAB.length]
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9)
    g.connect(c.destination)
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 2)
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2
    const g2 = c.createGain(); g2.gain.value = 0.3; o2.connect(g2); g2.connect(g); o2.start(t); o2.stop(t + 2)
    // um sopro de luz que sobe junto com a nota
    const r = ruidoCurto(c, 0.6); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.5)
    const gr = c.createGain(); gr.gain.setValueAtTime(0.0001, t); gr.gain.linearRampToValueAtTime(0.07, t + 0.15); gr.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    r.connect(bp); bp.connect(gr); gr.connect(c.destination); r.start(t); r.stop(t + 0.6)
  })
}
// Quando a última porta se recolhe: estrondo grave, rajada de luz e um acorde que se abre.
function tocarExplosao() {
  comSom((c, t) => {
    const mestre = c.createGain(); mestre.gain.value = 0.9; mestre.connect(c.destination)
    const boom = c.createOscillator(); boom.type = 'sine'; boom.frequency.setValueAtTime(110, t); boom.frequency.exponentialRampToValueAtTime(28, t + 1.3)
    const gb = c.createGain(); gb.gain.setValueAtTime(0.0001, t); gb.gain.linearRampToValueAtTime(0.55, t + 0.02); gb.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
    boom.connect(gb); gb.connect(mestre); boom.start(t); boom.stop(t + 1.9)
    const r = ruidoCurto(c, 2.2); const lp = c.createBiquadFilter(); lp.type = 'lowpass'
    lp.frequency.setValueAtTime(6000, t); lp.frequency.exponentialRampToValueAtTime(180, t + 2)
    const gr = c.createGain(); gr.gain.setValueAtTime(0.0001, t); gr.gain.linearRampToValueAtTime(0.38, t + 0.03); gr.gain.exponentialRampToValueAtTime(0.0001, t + 2.1)
    r.connect(lp); lp.connect(gr); gr.connect(mestre); r.start(t); r.stop(t + 2.2)
    ;[261.63, 392, 523.25, 783.99, 1046.5, 1568].forEach((f, k) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f
      const g = c.createGain(); const t0 = t + 0.12 + k * 0.05
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.09, t0 + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4)
      o.connect(g); g.connect(mestre); o.start(t0); o.stop(t0 + 3.5)
    })
  })
}
// Quando as portas se abrem de novo: três notas que descem, bem suaves.
function tocarRetorno() {
  comSom((c, t) => {
    ;[1046.5, 783.99, 523.25].forEach((f, k) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f
      const g = c.createGain(); const t0 = t + k * 0.16
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.08, t0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2)
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 1.3)
    })
  })
}

const SOM_CHAVE = 'codigos-avivar-som'
function SomAmbiente({ perfil, canto }) {
  const [mudo, setMudo] = useState(() => { try { return localStorage.getItem(SOM_CHAVE) === 'off' } catch (e) { return false } })
  const [ligado, setLigado] = useState(false)
  const [videoSom, setVideoSom] = useState(false) // enquanto um vídeo toca com som, o ambiente fica em silêncio
  useEffect(() => { const f = (e) => setVideoSom(!!e.detail); window.addEventListener('avivar-video-som', f); return () => window.removeEventListener('avivar-video-som', f) }, [])
  const mudoRef = useRef(mudo)
  mudoRef.current = mudo
  const [slot, setSlot] = useState(null)
  useEffect(() => {
    const achar = () => setSlot(canto ? null : document.getElementById('slot-som'))
    achar()
    window.addEventListener('avivar-slot-som', achar)
    return () => window.removeEventListener('avivar-slot-som', achar)
  }, [canto, perfil])
  useEffect(() => {
    let vivo = true
    const iniciar = () => (mudoRef.current ? Promise.resolve(false) : somAtivar().then((ok) => { if (vivo && ok) setLigado(true); return ok }))
    iniciar() // funciona sozinho se o navegador já liberou o som
    const gestos = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click']
    const aoGesto = (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest('.btn-som')) return
      iniciar().then((ok) => { if (ok) soltar() })
    }
    const soltar = () => gestos.forEach((g) => window.removeEventListener(g, aoGesto, true))
    gestos.forEach((g) => window.addEventListener(g, aoGesto, true)) // navegadores só liberam som após um toque, clique ou tecla
    return () => { vivo = false; soltar(); somPerfil(null) }
  }, [])
  useEffect(() => { somPerfil(ligado && !mudo && !videoSom && perfil ? perfil : null) }, [perfil, ligado, mudo, videoSom])
  const guardar = (v) => { try { localStorage.setItem(SOM_CHAVE, v) } catch (e) { /* sem efeito */ } }
  const alternar = () => {
    if (mudo) {
      mudoRef.current = false; setMudo(false); guardar('on')
      somAtivar().then((ok) => setLigado(ok))
    } else if (!ligado) {
      somAtivar().then((ok) => setLigado(ok)) // som ainda não tinha começado: este toque inicia
    } else {
      mudoRef.current = true; setMudo(true); guardar('off')
    }
  }
  if (!perfil) return null
  const estado = mudo ? 'desligado' : ligado ? 'ligado' : 'aguardando'
  const texto = { desligado: 'Som desligado', ligado: 'Som ligado', aguardando: 'Ativar som' }[estado]
  const botao = (
    <button type="button" className={'btn-som ' + estado + (canto ? ' canto' : '')} onClick={alternar} aria-pressed={estado === 'ligado'} aria-label={estado === 'ligado' ? 'Som ligado. Toque para silenciar.' : estado === 'desligado' ? 'Som desligado. Toque para ligar.' : 'Ativar o som ambiente'}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        {estado === 'desligado' ? <path d="M17 9l5 6M22 9l-5 6" /> : <><path d="M16.5 8.5a5 5 0 010 7" /><path d="M19 6a8.5 8.5 0 010 12" /></>}
      </svg>
      <span>{texto}</span>
    </button>
  )
  return slot ? createPortal(botao, slot) : botao
}


// Em quais telas o ambiente sonoro toca: as imersivas. Leitura, loja e painéis ficam em silêncio.
function perfilDaRota(p) {
  if (p === '/') return 'entrada'
  if (p.startsWith('/sala-quantica/exercicio')) return 'silencio'
  if (p.startsWith('/sala-quantica')) return 'quantica'
  if (p.startsWith('/sala-profetica/')) { const k = 'c-' + p.split('/')[2]; return PERFIS[k] ? k : 'profetica' }
  if (p.startsWith('/sala-profetica')) return 'profetica'
  if (p.startsWith('/montanha-profetica')) return 'c-montanha'
  if (p.startsWith('/tabernaculo-de-oracao')) return 'tabernaculo'
  if (p.startsWith('/tabua-dos-apocrifos') || p.startsWith('/canon-e-reforma') || p.startsWith('/igrejas-protestantes')) return 'apocrifos'
  if (p.startsWith('/livraria') || p.startsWith('/comprar')) return 'loja'
  if (p.startsWith('/biblioteca')) return 'biblioteca'
  if (p.startsWith('/cursos')) return 'cursos'
  if (['/inicio', '/jornada', '/o-que-sao', '/entrar'].includes(p) || p.startsWith('/estudos-profeticos') || p.startsWith('/efode')) return 'entrada'
  return null
}
// Narrador Avivar: botão "Ouvir" que lê livros, cursos, salas e menus (pasta src/narrador).
function NarradorMontagem() {
  const { sessao } = useLoja()
  return <Suspense fallback={null}><NarradorAvivar sessao={sessao} /></Suspense>
}

function SomRota() {
  const { pathname } = useLocation()
  return <SomAmbiente perfil={perfilDaRota(pathname)} canto={pathname !== '/'} />
}


/* ───────────── CADASTRO E ACESSO ───────────── */
// Fase 0: o cadastro fica só neste aparelho e a senha é guardada embaralhada (hash), nunca em texto.
// Na Fase 1, e-mail, WhatsApp e senha passam para o servidor (Supabase), e só então os comunicados podem ser enviados a todos.
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
function zapNormal(t) {
  const d = String(t || '').replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return '55' + d
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return ''
}
function zapBonito(n) {
  const d = String(n || '').replace(/^55/, '')
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : n
}
async function hashSenha(email, senha) {
  const base = 'avivar-acesso-2026|' + String(email).toLowerCase() + '|' + senha
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base))
    return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('')
  } catch (e) {
    let h = 2166136261
    for (let i = 0; i < base.length; i++) { h ^= base.charCodeAt(i); h = Math.imul(h, 16777619) }
    return 'f' + (h >>> 0).toString(16)
  }
}

function FormAcesso({ compacto, destino }) {
  const { cadastros, cadastrar, entrarCadastro, definirSessao } = useLoja()
  const nav = useNavigate()
  const [modo, setModo] = useState('criar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [zap, setZap] = useState('')
  const [senha, setSenha] = useState('')
  const [ver, setVer] = useState(false)
  const [aceite, setAceite] = useState(false)
  const [msg, setMsg] = useState('')
  const [info, setInfo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const criar = modo === 'criar'
  const abrirSessao = async () => {
    const p = await SB.perfil()
    if (!p) throw new Error('Entramos, mas não achamos o seu cadastro. Fale com o ministério.')
    definirSessao(sessaoDe(p))
    nav(destino || '/inicio', { replace: true })
  }
  const enviar = async (e) => {
    e.preventDefault()
    setMsg(''); setInfo('')
    const em = email.trim().toLowerCase()
    if (!emailOk(em)) { setMsg('Digite um e-mail válido.'); return }
    if (criar) {
      if (!nome.trim()) { setMsg('Digite o seu nome.'); return }
      const z = zapNormal(zap)
      if (!z) { setMsg('Digite o WhatsApp com DDD, por exemplo (84) 99999-9999.'); return }
      if (senha.length < 8) { setMsg('Crie uma senha com pelo menos 8 caracteres.'); return }
      if (!aceite) { setMsg('Marque a caixa para aceitar receber os comunicados.'); return }
      if (SERVIDOR) {
        setOcupado(true)
        try {
          const r = await SB.cadastrar({ nome: nome.trim(), email: em, whatsapp: z, senha, aceite: true })
          if (r.entrou) await abrirSessao()
          else { setInfo('Quase lá! Enviamos uma mensagem para ' + em + '. Abra o e-mail (veja também o spam) e clique no link para confirmar o seu cadastro. Depois volte aqui e toque em "Já tenho acesso".'); setModo('entrar'); setSenha('') }
        } catch (err) { setMsg(err.message || 'Não foi possível criar o acesso.'); if (err.codigo === 'user_already_exists' || err.codigo === 'email_exists') setModo('entrar') }
        setOcupado(false)
        return
      }
      if ((cadastros || []).some((c) => c.email === em)) { setMsg('Este e-mail já tem cadastro. Toque em "Já tenho acesso".'); setModo('entrar'); return }
      setOcupado(true)
      const h = await hashSenha(em, senha)
      cadastrar({ id: 'cd-' + novoId(), nome: nome.trim(), email: em, whatsapp: z, senhaHash: h, aceite: true, plano: 'anjo', criado: new Date().toISOString() })
      setOcupado(false)
      nav(destino || '/inicio', { replace: true })
    } else {
      if (!senha) { setMsg('Digite a sua senha.'); return }
      setOcupado(true)
      if (SERVIDOR) {
        try { await SB.entrar(em, senha); await abrirSessao() } catch (err) { setMsg(err.message || 'Não foi possível entrar.') }
        setOcupado(false)
        return
      }
      const h = await hashSenha(em, senha)
      const c = (cadastros || []).find((x) => x.email === em && x.senhaHash === h)
      setOcupado(false)
      if (!c) { setMsg('E-mail ou senha não conferem neste aparelho.'); return }
      entrarCadastro(em)
      nav(destino || '/inicio', { replace: true })
    }
  }
  const esqueci = async () => {
    setMsg(''); setInfo('')
    const em = email.trim().toLowerCase()
    if (!emailOk(em)) { setMsg('Digite o seu e-mail acima e toque de novo em "Esqueci minha senha".'); return }
    setOcupado(true)
    try { await SB.recuperar(em); setInfo('Se esse e-mail tem cadastro, enviamos agora um link para criar uma nova senha. Veja também o spam.') } catch (err) { setMsg(err.message) }
    setOcupado(false)
  }
  return (
    <form className={'acesso' + (compacto ? ' acesso-compacto' : '')} id="acesso" onSubmit={enviar} noValidate>
      <div className="abas" role="group" aria-label="Criar acesso ou entrar">
        <button type="button" className={criar ? 'active' : ''} aria-pressed={criar} onClick={() => { setModo('criar'); setMsg(''); setInfo('') }}>Criar meu acesso</button>
        <button type="button" className={!criar ? 'active' : ''} aria-pressed={!criar} onClick={() => { setModo('entrar'); setMsg(''); setInfo('') }}>Já tenho acesso</button>
      </div>
      <div className="acesso-grade">
        {criar && <label className="cheia"><span>Seu nome <b aria-hidden="true">*</b></span><input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" placeholder="Como quer ser chamado" /></label>}
        <label className={criar ? '' : 'cheia'}><span>E-mail <b aria-hidden="true">*</b></span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" placeholder="seu@email.com" /></label>
        {criar && <label><span>WhatsApp com DDD <b aria-hidden="true">*</b></span><input type="tel" value={zap} onChange={(e) => setZap(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="(84) 99999-9999" /></label>}
        <label className="cheia"><span>{criar ? 'Crie uma senha (mínimo 8 caracteres)' : 'Senha'} <b aria-hidden="true">*</b></span>
          <span className="acesso-senha">
            <input type={ver ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete={criar ? 'new-password' : 'current-password'} />
            <button type="button" className="btn pequeno" onClick={() => setVer(!ver)} aria-pressed={ver}>{ver ? 'Ocultar' : 'Mostrar'}</button>
          </span>
        </label>
      </div>
      {criar && <label className="check acesso-aceite"><input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} /> Aceito receber comunicados do Ministério Avivar por e-mail e WhatsApp. Posso pedir para sair da lista quando quiser.</label>}
      {msg && <p className="assinar-erro" role="alert">{msg}</p>}
      {info && <p className="assinar-ok" role="status">{info}</p>}
      <button className="btn ouro grande acesso-ok" disabled={ocupado}>{ocupado ? 'Um instante…' : criar ? 'Criar meu acesso e entrar' : 'Entrar'}</button>
      {SERVIDOR && !criar && <button type="button" className="acesso-esqueci" onClick={esqueci} disabled={ocupado}>Esqueci minha senha</button>}
    </form>
  )
}

// Tela aberta pelo link "nova senha" do e-mail.
function NovaSenha() {
  const nav = useNavigate()
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const enviar = async (e) => {
    e.preventDefault()
    if (s1.length < 8) { setMsg('Crie uma senha com pelo menos 8 caracteres.'); return }
    if (s1 !== s2) { setMsg('As duas senhas não são iguais.'); return }
    setOcupado(true)
    try { await SB.novaSenha(s1); nav('/inicio', { replace: true }) } catch (err) { setMsg(err.message); setOcupado(false) }
  }
  return (
    <Shell titulo="Nova senha">
      <form className="cartao acesso acesso-cartao" onSubmit={enviar} noValidate>
        <h2>Crie a sua nova senha</h2>
        <label><span>Nova senha (mínimo 8 caracteres)</span><input type="password" value={s1} onChange={(e) => setS1(e.target.value)} autoComplete="new-password" /></label>
        <label><span>Repita a nova senha</span><input type="password" value={s2} onChange={(e) => setS2(e.target.value)} autoComplete="new-password" /></label>
        {msg && <p className="assinar-erro" role="alert">{msg}</p>}
        <button className="btn ouro grande acesso-ok" disabled={ocupado}>{ocupado ? 'Um instante…' : 'Salvar a nova senha'}</button>
      </form>
    </Shell>
  )
}

function Entrada() {
  const { sessao, restaurando, sair } = useLoja()
  // Enquanto o app confere no servidor se a pessoa já está logada, mostra só o fundo (sem piscar o formulário de acesso).
  if (restaurando) return <div className="entrada"><Paisagem className="fundo" /><FundoVivo nome="entrada" /></div>
  return (
    <div className="entrada">
      <Paisagem className="fundo" />
      <FundoVivo nome="entrada" />
      <div className="entrada-centro com-duo">
        <div className="entrada-nome">
          <h1>CÓDIGOS AVIVAR</h1>
        </div>
        <p className="sub">PROFETAS DOS ÚLTIMOS DIAS</p>
        <p className="frase">Uma jornada de conhecimento, oração, discernimento e formação cristã.</p>
        <div className="entrada-botoes">
          <span className="slot-som" id="slot-som" ref={(el) => { if (el) window.dispatchEvent(new Event('avivar-slot-som')) }} />
          <BotaoInstalar className="btn instalar-preto" />
          <BotaoMinisterio />
        </div>
        {sessao
          ? <Link className="btn ouro grande" to="/inicio">ENTRAR</Link>
          : <a className="btn ouro grande" href="#acesso" onClick={(e) => { e.preventDefault(); const f = document.getElementById('acesso'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = f.querySelector('input'); if (i) setTimeout(() => i.focus({ preventScroll: true }), 400) } }}>ENTRAR</a>}
        <div className="entrada-bloco duo">
          <div className="entrada-esq">
            {sessao && <p className="entrada-conectado">Você já está conectado como <b>{sessao.nome}</b>. Toque em ENTRAR para continuar ou use o formulário para entrar com outra conta. <button type="button" className="link-sair" onClick={() => sair()}>Sair desta conta</button></p>}
            <div className="caminhos">
              <Link to="/livros"><b>CONHECER</b><span>Livros e biblioteca</span></Link>
              <Link to="/cursos"><b>TREINAR</b><span>Cursos e desafios</span></Link>
              <Link to="/sala-profetica"><b>VIVER</b><span>Sala Profética e experiências</span></Link>
            </div>
          </div>
          <div className="entrada-acesso">
            <FormAcesso compacto />
          </div>
        </div>
      </div>
    </div>
  )
}

function Entrar() {
  const { entrar } = useLoja()
  const nav = useNavigate()
  const loc = useLocation()
  const [nome, setNome] = useState('')
  const [plano, setPlano] = useState('anjo')
  const [admin, setAdmin] = useState(false)
  const destino = (loc.state && loc.state.de) || '/inicio'
  const enviar = (e) => { e.preventDefault(); entrar(nome.trim() || 'Visitante', plano, admin); nav(destino, { replace: true }) }
  return (
    <Shell titulo="Entrar">
      <Aviso>{SERVIDOR ? 'O e-mail e o WhatsApp servem para enviarmos comunicados do Ministério Avivar. O seu acesso vale em qualquer aparelho.' : 'O e-mail e o WhatsApp servem para enviarmos comunicados do Ministério Avivar. Nesta fase de demonstração o cadastro fica salvo só neste aparelho; na Fase 1 ele passa a valer em qualquer aparelho.'}</Aviso>
      <div className="cartao acesso-cartao"><FormAcesso destino={destino} /></div>
      {!SERVIDOR && <details className="cartao demo-acesso">
        <summary>Modo demonstração (somente para testes do Pastor)</summary>
        <form className="form" onSubmit={enviar}>
          <label>Seu nome<input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como quer ser chamado" /></label>
          <label>Plano (demonstração)
            <select value={plano} onChange={(e) => setPlano(e.target.value)}>
              <option value="anjo">Anjo (gratuito)</option><option value="querubim">Querubim</option><option value="serafim">Serafim</option>
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} /> Entrar como administrador (demonstração)</label>
          <button className="btn ouro">Entrar sem cadastro</button>
        </form>
      </details>}
    </Shell>
  )
}

/* ───────────── INÍCIO, TV, TEXTO ───────────── */

function useProgresso() {
  const { db, tarefas } = useLoja()
  let total = 0, feitas = 0
  db.montanhas.forEach((m) => linhas(m.tarefas).forEach((_, i) => { total++; if (tarefas[m.id + ':' + i]) feitas++ }))
  const ex = db.exercicios.filter((e) => tarefas['ex:' + e.id]).length
  return { total, feitas, xp: (feitas + ex) * 10, pct: total ? Math.round((feitas / total) * 100) : 0 }
}

function Inicio() {
  const { sessao, db, entradasSala } = useLoja()
  const p = useProgresso()
  return (
    <Shell titulo="Início">
      <section className="bloco" data-livre>
        <div className="linha-titulo"><h2>ON LINE</h2></div>
        <PainelTv compacto />
      </section>
      <section className="painel">
        <div className="cartao saudacao">
          <FotoPerfil sessao={sessao} />
          <div>
            <h2>Olá, {sessao.nome}.</h2>
            <p className="mudo">O conhecimento conduz à fé, e a fé nos prepara para a missão.</p>
            <p>Plano <Selo tipo="ouro">{sessao.plano.toUpperCase()}</Selo>{sessao.admin && <Selo>ADMIN</Selo>}</p>
          </div>
        </div>
        <div className="cartao">
          <h3>Seu progresso</h3>
          <div className="barra" aria-label={'Progresso da jornada: ' + p.pct + '%'}><i style={{ width: p.pct + '%' }} /></div>
          <p>{p.pct}% da Montanha Profética · {p.feitas}/{p.total} tarefas · {p.xp} XP</p>
          <Link className="btn" to="/montanha-profetica">Continuar a subida</Link>
        </div>
      </section>
      <section className="bloco">
        <div className="linha-titulo"><h2>Estudos Avivar</h2><Link to="/reportagens">Ver todos →</Link></div>
        <GradeTres className="grade" tema="estudos">{db.reportagens.slice(0, 4).map((r) => <CartaoReportagem key={r.id} r={r} />)}</GradeTres>
      </section>
      <GradeTres className="grade atalhos" tag="section" tema="atalhos">
        {ATALHOS_INICIO.map((to) => MENU.find((m) => m[0] === to)).filter(Boolean).map(([to, t]) => <Link key={to} className="cartao atalho" to={to}>{t}</Link>)}
      </GradeTres>
    </Shell>
  )
}

// Foto da pessoa (upload do aparelho ou câmera do celular/notebook). Fica guardada neste aparelho, já recortada e reduzida.
const FOTO_CHAVE = 'codigos-avivar-foto:'
const chaveFoto = (s) => FOTO_CHAVE + String((s && (s.uid || s.email || s.nome)) || 'visitante').toLowerCase()
function useFotoPerfil(sessao) {
  const chave = chaveFoto(sessao)
  const ler = () => { try { return localStorage.getItem(chave) || '' } catch (e) { return '' } }
  const [foto, setFoto] = useState(ler)
  useEffect(() => {
    setFoto(ler())
    const f = (e) => { if (!e.detail || e.detail === chave) setFoto(ler()) }
    window.addEventListener('avivar-foto', f)
    return () => window.removeEventListener('avivar-foto', f)
  }, [chave])
  const salvar = (url) => {
    try { if (url) localStorage.setItem(chave, url); else localStorage.removeItem(chave) } catch (e) { return false }
    window.dispatchEvent(new CustomEvent('avivar-foto', { detail: chave }))
    setFoto(url || '')
    return true
  }
  return [foto, salvar]
}
function recortarFoto(fonte, largura, altura) {
  const T = 320
  const c = document.createElement('canvas'); c.width = T; c.height = T
  const ctx = c.getContext('2d')
  const lado = Math.min(largura, altura)
  ctx.drawImage(fonte, (largura - lado) / 2, (altura - lado) / 2, lado, lado, 0, 0, T, T)
  return c.toDataURL('image/jpeg', 0.86)
}
function lerArquivoImagem(arquivo) {
  return new Promise((ok, falha) => {
    const url = URL.createObjectURL(arquivo)
    const img = new Image()
    img.onload = () => { try { ok(recortarFoto(img, img.naturalWidth, img.naturalHeight)) } catch (e) { falha(e) } URL.revokeObjectURL(url) }
    img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('imagem')) }
    img.src = url
  })
}
function FotoPerfil({ sessao }) {
  const [foto, salvar] = useFotoPerfil(sessao)
  const [menu, setMenu] = useState(false)
  const [camera, setCamera] = useState(false)
  const [msg, setMsg] = useState('')
  const arq = useRef(null)
  const cap = useRef(null)
  const vid = useRef(null)
  const fluxo = useRef(null)
  const escolher = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\//.test(f.type)) { setMsg('Escolha um arquivo de imagem (JPG ou PNG).'); return }
    try { if (salvar(await lerArquivoImagem(f))) { setMsg(''); setMenu(false) } else setMsg('Não foi possível guardar a foto neste aparelho.') } catch (err) { setMsg('Não foi possível abrir essa imagem.') }
  }
  const fecharCamera = () => { if (fluxo.current) { fluxo.current.getTracks().forEach((t) => t.stop()); fluxo.current = null } setCamera(false) }
  const abrirCamera = async () => {
    setMsg('')
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { if (cap.current) cap.current.click(); return } // sem acesso direto: o celular abre a câmera pelo seletor
    try {
      fluxo.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      setCamera(true)
    } catch (err) { setMsg('Não foi possível abrir a câmera. Permita o acesso à câmera no navegador ou use "Enviar foto".') }
  }
  useEffect(() => { if (camera && vid.current && fluxo.current) { vid.current.srcObject = fluxo.current; const p = vid.current.play(); if (p && p.catch) p.catch(() => {}) } }, [camera])
  useEffect(() => () => { if (fluxo.current) fluxo.current.getTracks().forEach((t) => t.stop()) }, [])
  const tirar = () => {
    const v = vid.current
    if (!v || !v.videoWidth) return
    if (salvar(recortarFoto(v, v.videoWidth, v.videoHeight))) { fecharCamera(); setMenu(false) } else setMsg('Não foi possível guardar a foto neste aparelho.')
  }
  return (
    <div className="foto-perfil">
      {foto ? <img className="avatar" src={foto} alt="Sua foto" /> : <Avatar />}
      <button type="button" className="foto-botao" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>📷 {foto ? 'Trocar foto' : 'Minha foto'}</button>
      {menu && (
        <div className="foto-menu" role="group" aria-label="Escolher a foto">
          <button type="button" onClick={() => arq.current && arq.current.click()}>Enviar foto</button>
          <button type="button" onClick={abrirCamera}>Usar a câmera</button>
          {foto && <button type="button" onClick={() => { salvar(''); setMenu(false) }}>Remover</button>}
        </div>
      )}
      {msg && <p className="foto-msg" role="alert">{msg}</p>}
      <input ref={arq} type="file" accept="image/*" hidden onChange={escolher} />
      <input ref={cap} type="file" accept="image/*" capture="user" hidden onChange={escolher} />
      {camera && (
        <div className="foto-camera" role="dialog" aria-modal="true" aria-label="Tirar foto">
          <video ref={vid} playsInline muted autoPlay />
          <div className="foto-camera-botoes">
            <button type="button" className="btn ouro" onClick={tirar}>Tirar foto</button>
            <button type="button" className="btn" onClick={fecharCamera}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar() {
  return (
    <svg className="avatar" viewBox="0 0 64 64" role="img" aria-label="Avatar padrão">
      <circle cx="32" cy="32" r="32" fill="#3a1f7a" /><circle cx="32" cy="25" r="11" fill="#f3d98b" /><path d="M10 58c2-14 12-20 22-20s20 6 22 20Z" fill="#f3d98b" />
    </svg>
  )
}

// TV: histórico de vídeos já assistidos (no aparelho) e da sessão atual. Na Fase 1 passa para a conta da pessoa.
const TV_VISTOS = 'codigos-avivar-tv-vistos'
const TV_SESSAO = 'codigos-avivar-tv-sessao'
const armazem = (sessao) => { try { return sessao ? window.sessionStorage : window.localStorage } catch { return null } }
const lerJson = (k, sessao, padrao) => { try { const v = JSON.parse(armazem(sessao).getItem(k)); return v || padrao } catch { return padrao } }
const gravaJson = (k, v, sessao) => { try { armazem(sessao).setItem(k, JSON.stringify(v)) } catch { /* sem armazenamento: segue sem histórico */ } }
const semAcento = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const idYoutube = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|live\/)([\w-]{11})/); return m ? m[1] : '' }

function MiniaturaTv({ v }) {
  const [ok, setOk] = useState(true)
  const id = idYoutube(v.url)
  return (
    <span className="tv-mini" aria-hidden="true">
      {id && ok && <img src={'https://img.youtube.com/vi/' + id + '/mqdefault.jpg'} alt="" loading="lazy" onError={() => setOk(false)} />}
      <i className="tv-play" />
    </span>
  )
}

// Estado da transmissão: no protótipo o admin liga e desliga em "Textos e etiquetas". Na Fase 1 vem do servidor de vídeo.
function useAoVivo() {
  const { db } = useLoja()
  const c = db.config || {}
  return { ativo: c.aoVivoAtivo === 'sim', url: c.aoVivoUrl || '', titulo: c.aoVivoTitulo || 'Transmissão ao vivo' }
}

function OnLineBadge() {
  const { ativo } = useAoVivo()
  return (
    <Link to="/tv" className="badge-online" aria-label={'ON LINE: ' + (ativo ? 'transmissão ao vivo no ar' : 'fora do ar no momento')}>
      <span className={'ol-ponto ' + (ativo ? 'verde' : 'azul')} aria-hidden="true" />
      <b>ON LINE</b>
      <small>{ativo ? 'AO VIVO' : 'FORA DO AR'}</small>
    </Link>
  )
}

function PainelTv({ compacto }) {
  const { db, sessao } = useLoja()
  const { avisar } = useTrava()
  const vivo = useAoVivo()
  const assinante = ehAssinante(sessao)
  const livreV = (v) => assinante || (!!v && v.livre === 'sim')
  const vivoLivre = assinante || !db.config || db.config.aoVivoLivre !== 'não'
  const [modo, setModo] = useState(vivo.ativo ? 'vivo' : 'anteriores')
  const [sel, setSel] = useState(() => Math.max(0, db.tv.findIndex(livreV)))
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [vistos, setVistos] = useState(() => lerJson(TV_VISTOS, false, {}))
  const [sessaoIds, setSessaoIds] = useState(() => lerJson(TV_SESSAO, true, []))
  const atual = db.tv[sel] || db.tv[0]
  const marcar = (id) => {
    if (!id) return
    setVistos((o) => { const n = { ...o, [id]: Date.now() }; gravaJson(TV_VISTOS, n, false); return n })
    setSessaoIds((a) => { const n = a.includes(id) ? a : [...a, id]; gravaJson(TV_SESSAO, n, true); return n })
  }
  useEffect(() => { if (modo === 'anteriores' && atual && livreV(atual)) marcar(atual.id) }, [modo, atual && atual.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const q = semAcento(busca.trim())
  const lista = db.tv
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => !q || semAcento(v.titulo + ' ' + v.tipo + ' ' + v.descricao).includes(q))
    .filter(({ v }) => filtro === 'todos' || (filtro === 'vistos' && vistos[v.id]) || (filtro === 'sessao' && sessaoIds.includes(v.id)))
  const nVistos = db.tv.filter((v) => vistos[v.id]).length
  const nSessao = db.tv.filter((v) => sessaoIds.includes(v.id)).length
  return (
    <>
      <div className="tv-modos" role="group" aria-label="O que assistir">
        <button type="button" className={'modo-vivo' + (modo === 'vivo' ? ' on' : '')} aria-pressed={modo === 'vivo'} onClick={() => setModo('vivo')}>
          <span className={'ol-ponto ' + (vivo.ativo ? 'verde' : 'azul')} aria-hidden="true" /> AO VIVO
        </button>
        <button type="button" className={modo === 'anteriores' ? 'on' : ''} aria-pressed={modo === 'anteriores'} onClick={() => setModo('anteriores')}>MAIS CONTEÚDO</button>
      </div>
      <div className="tv-grade">
        <div className="tv-principal">
          {modo === 'vivo'
            ? (vivo.ativo && !vivoLivre
              ? <><TelaTrava /><div className="bloco"><h2>{vivo.titulo}</h2><p className="mudo">A transmissão ao vivo é para assinantes.</p><Link className="btn ouro" to="/planos">Ver os planos</Link></div></>
              : vivo.ativo
              ? <><Tela url={vivo.url} titulo={vivo.titulo} /><div className="bloco"><h2>{vivo.titulo}</h2><p className="mudo"><span className="ol-ponto verde" aria-hidden="true" /> Transmissão ao vivo no ar</p></div></>
              : <><div className="tela tela-vazia"><span>ON LINE</span><small><span className="ol-ponto azul" aria-hidden="true" /> Fora do ar no momento</small></div>
                <div className="bloco"><p>Não há transmissão no ar agora. Escolha um dos conteúdos abaixo para assistir.</p><button type="button" className="btn ouro" onClick={() => setModo('anteriores')}>Ver mais conteúdo</button></div></>)
            : <>{livreV(atual) ? <Tela url={atual && atual.url} titulo={atual && atual.titulo} /> : <TelaTrava />}
              {atual && <div className="bloco"><h2>{atual.titulo}</h2><p className="mudo">{atual.tipo}</p><p>{livreV(atual) ? atual.descricao : 'Este vídeo é para assinantes dos planos Querubim e Serafim.'}</p>{!livreV(atual) && <Link className="btn ouro" to="/planos">Ver os planos</Link>}</div>}</>}
          {!compacto && <p><Link to="/cursos">Ver os cursos com aulas →</Link></p>}
        </div>
        <aside className="tv-lateral" aria-label="Lista de vídeos">
          <label className="tv-busca">
            <span className="so-leitor">Buscar vídeos</span>
            <input type="search" placeholder="Buscar vídeo, tema ou tipo" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
          <div className="tv-filtros" role="group" aria-label="Filtrar a lista">
            <button type="button" className={filtro === 'todos' ? 'on' : ''} aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos ({db.tv.length})</button>
            <button type="button" className={filtro === 'sessao' ? 'on' : ''} aria-pressed={filtro === 'sessao'} onClick={() => setFiltro('sessao')}>Nesta sessão ({nSessao})</button>
            <button type="button" className={filtro === 'vistos' ? 'on' : ''} aria-pressed={filtro === 'vistos'} onClick={() => setFiltro('vistos')}>Já assistidos ({nVistos})</button>
          </div>
          {db.tv.length === 0
            ? <Aviso>Programação em breve. Aqui ficam os cursos em vídeo, as lives e as séries. O admin inclui cada vídeo pelo painel.</Aviso>
            : lista.length === 0
              ? <p className="mudo">Nenhum vídeo encontrado{busca ? ' para “' + busca + '”' : ' neste filtro'}.</p>
              : <ul className="tv-lista">{lista.map(({ v, i }) => (
                  <li key={v.id}>
                    <button type="button" className={'tv-item' + (modo === 'anteriores' && i === sel ? ' ativo' : '')} aria-current={modo === 'anteriores' && i === sel ? 'true' : undefined} onClick={() => { if (!livreV(v)) { avisar(); return } setSel(i); setModo('anteriores') }}>
                      <MiniaturaTv v={v} />
                      <span className="tv-info">
                        <b>{v.titulo}</b>
                        <small>{!livreV(v) && '🔒 '}{v.tipo}{vistos[v.id] ? ' · já assistido' : ''}{sessaoIds.includes(v.id) ? ' · nesta sessão' : ''}</small>
                      </span>
                    </button>
                  </li>))}
                </ul>}
        </aside>
      </div>
    </>
  )
}

function TelaTrava() {
  return <div className="tela tela-vazia"><span>🔒</span><small>Vídeo para assinantes</small></div>
}

function Tv() {
  return (
    <Shell titulo="ON LINE" editar="tv">
      <div className="tv-cabeca"><h2>ON LINE</h2></div>
      <PainelTv />
    </Shell>
  )
}

function Revela({ children }) {
  const ref = useRef(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setV(true); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); io.disconnect() } }, { threshold: 0.04 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={'revela' + (v ? ' visivel' : '')}>{children}</div>
}

// Imagem enigmática: public/img/enigma-N.webp. Sem o arquivo, aparece uma moldura estelar com um buraco de fechadura.
function Enigma({ n, legenda, foco, video }) {
  const [ok, setOk] = useState(true)
  const [vok, setVok] = useState(true)
  const vref = useRef(null)
  const reduz = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // O vídeo só roda enquanto está na tela (economiza bateria e dados).
  useEffect(() => {
    const v = vref.current
    if (!v || typeof IntersectionObserver === 'undefined') return undefined
    v.muted = true
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const r = v.play(); if (r && r.catch) r.catch(() => {}) } else v.pause()
    }, { threshold: 0.2 })
    io.observe(v)
    return () => io.disconnect()
  }, [video, vok])
  return (
    <Revela>
      <figure className="enigma">
        <div className="enigma-moldura">
          <svg className="enigma-fundo" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <radialGradient id={'eg' + n} cx="50%" cy="48%" r="62%">
                <stop offset="0" stopColor="#6a3fc4" stopOpacity="0.75" /><stop offset="1" stopColor="#04051a" />
              </radialGradient>
            </defs>
            <rect width="160" height="90" fill={'url(#eg' + n + ')'} />
            {ESTRELAS.slice(0, 34).map(([x, y, r], i) => <circle key={i} cx={x / 5} cy={y / 2.6} r={r / 2.4} fill="#f3d98b" opacity={0.3 + (i % 4) * 0.15} />)}
            <circle cx="80" cy="38" r="9" fill="#f3d98b" fillOpacity="0.18" stroke="#f3d98b" strokeWidth="1" />
            <path d="M75 44 L85 44 L88 64 L72 64 Z" fill="#f3d98b" fillOpacity="0.18" stroke="#f3d98b" strokeWidth="1" />
          </svg>
          {ok && <img className="enigma-img" src={'/img/enigma-' + n + '.webp'} alt={legenda} style={foco ? { objectPosition: foco } : undefined} onError={() => setOk(false)} />}
          {video && vok && !reduz && <video ref={vref} className="enigma-img" src={'/img/enigma-' + n + '.mp4'} muted loop playsInline preload="metadata" aria-hidden="true" onError={() => setVok(false)} />}
        </div>
        <figcaption>{legenda}</figcaption>
      </figure>
    </Revela>
  )
}

const ESPACOS = [
  ['/tv', 'ON LINE', 'Transmissão ao vivo, aulas, lives e mensagens para rever quando quiser.'],
  ['/cursos', 'Cursos Avivar', 'Aulas em vídeo, textos e livros de apoio, reunidos por tema.'],
  ['/montanha-profetica', 'Montanha Profética', 'Do Mar Vermelho ao Horebe: cada etapa se abre quando a anterior é concluída.'],
  ['/estudos-profeticos', 'Estudos Proféticos', 'A vida dos profetas da Bíblia, do chamado ao fim do ministério.'],
  ['/sala-profetica', 'Sala Profética', 'Encontros ao vivo, com a cadeira cativa do Pastor Marcos Fagner.'],
  ['/sala-quantica', 'Sala Quântica', 'Fé e ciência, cada uma no seu lugar, com exercícios espirituais e silêncio.'],
  ['/tabernaculo-de-oracao', 'Tabernáculo de Oração', 'Onde todas as salas se recolhem em uma só oração: o celestial, o místico, o angelical, o quântico e mais.'],
  ['/tabua-dos-apocrifos', 'Tábua dos Apócrifos', 'Os livros que ficaram fora da Bíblia: de onde vieram, o que dizem e por que não entraram no cânon. Com uma seção especial sobre o Livro de Enoque.'],
  ['/canon-e-reforma', 'Cânon e Reforma', 'Por que a Bíblia católica tem sete livros a mais, o que foi a Reforma e quem a começou. Com estante, túnel do tempo e comparador de cânones.'],
  ['/igrejas-protestantes', 'Igrejas Protestantes', 'Luterana, reformada, batista, metodista, pentecostal e outras: o que cada uma defende sobre batismo, salvação e dons do Espírito, em fichas curtas.'],
]

// Imagem viva: nunca fica parada (movimento lento, brilho, névoa ou tremor de luz). Clique: amplia em uma caixa de luz, ou leva ao estudo.
// Se o arquivo ainda não existe, só o admin vê o espaço reservado; o público vê só o texto.
function ImgViva({ arquivo, alt, lado = 'dir', fx = 'nevoa', legenda, titulo, to, onFalha, foco, alternativa, video }) {
  const { sessao } = useLoja()
  const [vok, setVok] = useState(true)
  const [arq, setArq] = useState(arquivo)
  const [ok, setOk] = useState(true)
  const [aberta, setAberta] = useState(false)
  useEffect(() => {
    if (!aberta) return undefined
    const k = (e) => { if (e.key === 'Escape') setAberta(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [aberta])
  if (!ok) {
    return sessao && sessao.admin
      ? <div className={'oq-img oq-img-vazia ' + lado} role="note">Imagem a gerar: <b>{arquivo}.webp</b><small>{alt}</small></div>
      : null
  }
  const miolo = (
    <>
      <img src={'/img/' + arq + '.webp'} alt={alt} loading="lazy" style={foco ? { objectPosition: foco } : undefined} onError={() => { if (alternativa && arq !== alternativa) { setArq(alternativa); return } setOk(false); if (onFalha) onFalha() }} />
      {video && vok && <video className="vivo-video" src={'/img/' + video + '.mp4'} muted loop playsInline autoPlay preload="metadata" aria-hidden="true" onError={() => setVok(false)} />}
      <span className="vivo-fx" aria-hidden="true" />
      {titulo && <span className="vivo-titulo">{titulo}</span>}
      <span className="vivo-dica" aria-hidden="true">{to ? 'Abrir o estudo' : 'Toque para ampliar'}</span>
    </>
  )
  return (
    <figure className={'vivo ' + lado + ' fx-' + fx}>
      {to
        ? <Link className="vivo-moldura" to={to} aria-label={(titulo ? titulo + ': ' : '') + 'abrir o estudo na sala de Estudos Proféticos'}>{miolo}</Link>
        : <button type="button" className="vivo-moldura" onClick={() => setAberta(true)} aria-label={'Ampliar a imagem: ' + alt}>{miolo}</button>}
      {video && vok && <ControlesSom nome={video} />}
      {legenda && <figcaption>{legenda}</figcaption>}
      {aberta && typeof document !== 'undefined' && createPortal(
        <div className="luz-caixa" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setAberta(false)}>
          <div className="luz-miolo">
            <img src={'/img/' + arq + '.webp'} alt={alt} />
            <span className="luz-nevoa" aria-hidden="true" />
          </div>
          {legenda && <p className="luz-legenda">{legenda}</p>}
          <button type="button" className="luz-fechar" autoFocus onClick={() => setAberta(false)}>Fechar</button>
        </div>,
        document.body
      )}
    </figure>
  )
}

const FX_ROTA = ['nevoa', 'brilho', 'tremula']

function CartaoProfeta({ p, i }) {
  const { sessao, db } = useLoja()
  const [semImg, setSemImg] = useState(false)
  const frases = String(p.sinal || '').match(/[^.!?]+[.!?]+(\s+|$)/g) || [String(p.sinal || '')]
  const inicio = frases.slice(0, 2).join('').trim()
  const resto = frases.slice(2).join('').trim()
  const esconde = semImg && !(sessao && sessao.admin)
  return (
    <article className={'cartao profeta2' + (esconde ? ' sem-img' : '')}>
      <ImgViva arquivo={'prof-' + p.id} alt={p.titulo + ': ' + p.papel} lado="cheia" fx={FX_ROTA[i % 3]} onFalha={() => setSemImg(true)} />
      <div className="prof-texto">
        <span className="num">{String(i + 1).padStart(2, '0')}</span>
        <h3>{p.titulo}</h3>
        <p className="papel">{p.papel}</p>
        <p>{inicio}</p>
        {resto && <details><summary>Ler mais</summary><p>{resto}</p></details>}
        <p className="ref">{p.ref}</p>
        <Link className="btn ouro" to={LIVROS_PROFETAS.some((x) => x.id === p.id) ? '/estudos-profeticos/livro/' + p.id : '/estudos-profeticos'}>MISTÉRIOS PROFÉTICOS</Link>
      </div>
    </article>
  )
}

const TEXTO_LUZ = `{{INTERPRETAÇÃO TEOLÓGICA}} Enquanto o mundo dorme, uma luz permanece acesa, e essa luz não nasce em nós. Jesus disse: "Eu sou a luz do mundo; quem me segue não andará em trevas, mas terá a luz da vida" (João 8:12; 9:5). João escreve que nele estava a vida, que a vida era a luz dos homens e que as trevas não prevaleceram contra ela (João 1:4-5).

{{INTERPRETAÇÃO TEOLÓGICA}} Foi esse mesmo Jesus quem disse aos seus discípulos: "Vós sois a luz do mundo… brilhe também a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai que está nos céus" (Mateus 5:14-16). A luz continua sendo dele. Nós a refletimos, e Paulo diz que os cristãos resplandecem como luzeiros no mundo, retendo a palavra da vida (Filipenses 2:15-16).

{{INTERPRETAÇÃO TEOLÓGICA}} Cremos que os Profetas dos Últimos Dias são chamados a exercer esse papel com toda a seriedade: ser a luz do mundo como embaixadores de Cristo, de modo que é como se Deus mesmo exortasse por meio deles (2 Coríntios 5:20). Um embaixador não fala o que quer; leva a mensagem de quem o enviou. E o Senhor confirma a sua palavra: "o Senhor cooperava com eles e confirmava a palavra por meio dos sinais que a acompanhavam" (Marcos 16:20). O autor de Hebreus fala de Deus dando testemunho com sinais, prodígios, milagres e dons do Espírito Santo, distribuídos segundo a sua vontade (Hebreus 2:3-4). Os sinais são do Senhor. O profeta é o portador.

{{INTERPRETAÇÃO TEOLÓGICA}} A Bíblia mostra essa luz em pessoas: Moisés desceu do monte com o rosto resplandecente, porque tinha falado com Deus (Êxodo 34:29-35). Em Daniel foram achadas luz, entendimento e excelente sabedoria (Daniel 5:14). Estêvão, cheio de graça e poder, fazia prodígios e grandes sinais entre o povo (Atos 6:8). Pedro e João disseram ao coxo, à porta do templo: "em nome de Jesus Cristo, o Nazareno, anda", e ele andou (Atos 3:1-10). E Paulo foi posto como luz para as nações (Atos 13:47; Isaías 49:6).

{{INTERPRETAÇÃO TEOLÓGICA}} Isso não coloca o profeta acima dos demais cristãos: a luz é de todos os que seguem a Cristo (Mateus 5:14), e o dom de profecia existe para edificar, exortar e consolar (1 Coríntios 14:3). Mas, quanto mais escura a noite, mais a luz se vê. Isaías já havia anunciado: "Levanta-te, resplandece, porque vem a tua luz, e a glória do Senhor nasce sobre ti. Porque eis que as trevas cobrirão a terra, mas sobre ti o Senhor resplandecerá" (Isaías 60:1-2). Por isso, em toda crise, Deus levantou alguém.`

const PENT_ESQ = `{{HISTÓRIA}} Na Antiga Aliança, Deus falava por meios que se podiam ver e tocar: o cajado de Moisés (Êxodo 4:2-5; 14:16), as trombetas que acompanharam a queda de Jericó (Josué 6:4-5), as tábuas da aliança (Êxodo 31:18), o rolo da Lei (Deuteronômio 31:9-11), o manto que passou de Elias a Eliseu (2 Reis 2:13-14) e o vaso de azeite da viúva (2 Reis 4:1-7). Eram sinais de que a palavra vinha de Deus, e não do homem.

{{HISTÓRIA}} O Espírito vinha sobre pessoas escolhidas, para uma tarefa e por um tempo (Juízes 3:10; 1 Samuel 10:10; Números 11:25), e o povo, em geral, ouvia Deus por meio do profeta (Êxodo 20:19). Moisés chegou a desejar: "Oxalá todo o povo do Senhor fosse profeta, e que o Senhor pusesse sobre ele o seu Espírito!" (Números 11:29).

{{INTERPRETAÇÃO TEOLÓGICA}} Coincidências com o Pentecostes: a fonte é a mesma, Deus fala e o homem transmite, pois "homens falaram da parte de Deus, movidos pelo Espírito Santo" (2 Pedro 1:21). A palavra continua sendo confirmada por sinais (Hebreus 2:3-4), e o fogo continua marcando a presença do Senhor: a sarça (Êxodo 3:2), a coluna de fogo (Êxodo 13:21), o Carmelo (1 Reis 18:38) e as línguas como de fogo em Atos 2:3.`

const PENT_DIR = `{{INTERPRETAÇÃO TEOLÓGICA}} No dia de Pentecostes, os discípulos estavam reunidos, cerca de cento e vinte, e foram todos cheios do Espírito Santo. Viram línguas como de fogo repartidas sobre cada um e começaram a falar em outras línguas, conforme o Espírito lhes concedia (Atos 1:15; 2:1-4). Pedro explicou que era o cumprimento de Joel: o Espírito seria derramado sobre toda carne, e filhos e filhas, jovens e velhos, servos e servas profetizariam (Atos 2:16-18; Joel 2:28-29).

{{INTERPRETAÇÃO TEOLÓGICA}} Diferenças: do exterior para o interior, pois Deus prometera escrever a lei no coração e pôr dentro do seu povo o seu Espírito (Jeremias 31:33; Ezequiel 36:26-27); de alguns para todos os que creem (Números 11:29; Atos 2:17-18); e do Espírito que vem sobre para o Espírito que habita no crente (João 14:17; 1 Coríntios 6:19). Mesmo assim, o Espírito reparte os dons como quer, e nem todos são profetas (1 Coríntios 12:11,29).

{{!TRADIÇÃO | Tradição judaica posterior ao Novo Testamento. O texto bíblico não afirma isso. | Festa das Semanas; Levítico 23:15-21; Êxodo 19}} Pentecostes é a Festa das Semanas, cinquenta dias depois da Páscoa (Levítico 23:15-21). Uma tradição rabínica liga essa festa à entrega da Lei no Sinai. Citamos para estudo: não é doutrina nem revelação.`

const TEXTO_PORTAIS = `{{INTERPRETAÇÃO TEOLÓGICA}} Os Portais Avivar são as portas por onde o aluno entra no estudo: as salas, a montanha, o tabernáculo. A porta verdadeira, porém, é uma só. Jesus disse: "Eu sou a porta; se alguém entrar por mim, será salvo" (João 10:9). Não existe caminho para o espiritual fora dele, e por isso cada portal desta página é um lugar de ensino, nunca um atalho místico.

{{INTERPRETAÇÃO TEOLÓGICA}} Aqui o Espírito do Senhor nos ensina a discernir o espiritual. Paulo escreve que as coisas de Deus são reveladas pelo Espírito e se discernem espiritualmente (1 Coríntios 2:10-14), e a Palavra manda provar os espíritos (1 João 4:1; Hebreus 5:14). Os segredos do Senhor não se tomam: são confiados aos que o temem (Salmos 25:14; Amós 3:7).

{{INTERPRETAÇÃO TEOLÓGICA}} Nos portais, o letrado aprende a humildade do Espírito e o simples é chamado às alturas. Jesus agradeceu ao Pai por ter ocultado estas coisas aos sábios e instruídos e as revelado aos pequeninos (Mateus 11:25). Nicodemos, mestre em Israel, precisou aprender que é preciso nascer do alto (João 3:1-10). O Senhor habita com o contrito e humilde (Isaías 57:15), dá graça aos humildes (Tiago 4:6) e faz andar nas alturas (Habacuque 3:19). Quem pode subir ao monte do Senhor? O de mãos limpas e coração puro (Salmos 24:3-4).`

const TEXTO_SELOS = `{{INTERPRETAÇÃO TEOLÓGICA}} Atenção: os Selos Avivar não são os selos de Deus. Os selos de Deus guardam o que só o Senhor revela, e só o Cordeiro os abre (Apocalipse 5:1-5; Daniel 12:4). Os Selos Avivar são marcas de estudo deste aplicativo: cada selo conquistado abre um leque de oportunidades para conhecer melhor as Escrituras, como cursos, estudos e desafios.

{{INTERPRETAÇÃO TEOLÓGICA}} Conquista-se um Selo Avivar com perseverança e dedicação, e com um cuidado que o profeta precisa aprender: abrir o texto sem quebrá-lo. Isto é, estudar sem forçar o sentido, sem tirar o versículo do contexto e sem acrescentar o que a Palavra não diz (2 Timóteo 2:15; 2 Pedro 3:16; Provérbios 30:5-6). A Palavra que o Senhor entregou é preciosa demais para ser danificada. Os bereanos examinavam as Escrituras todos os dias para ver se as coisas eram assim (Atos 17:11), e Esdras dispôs o coração a buscar a Lei do Senhor, a cumpri-la e a ensiná-la (Esdras 7:10).

{{INTERPRETAÇÃO TEOLÓGICA}} Quem abre o entendimento é o Senhor: Jesus abriu a mente dos discípulos para entenderem as Escrituras (Lucas 24:45), e o salmista ora: "Abre os meus olhos, para que eu contemple as maravilhas da tua lei" (Salmos 119:18). O selo do aplicativo reconhece o seu estudo. A revelação continua sendo dom de Deus.`

function OQueSao() {
  const { db, sessao } = useLoja()
  const c = db.config
  const ab = linhas(c.oQueSaoAbertura || ABERTURA)
  const fechoAb = ab.length > 1 && /^um povo\.\s*uma escolha\.?$/i.test(ab[ab.length - 1].trim())
  const abCorpo = fechoAb ? ab.slice(0, -1) : ab
  const abFecho = fechoAb ? ab[ab.length - 1] : ''
  const mundo = linhas(c.oQueSaoMundo || MUNDO)
  const comecar = sessao ? '/jornada' : '/entrar'
  return (
    <Shell titulo="Códigos Avivar" editar="profetas">
      <div className="oq">
        <Revela>
          <div className="oq-abertura">
            <ImgViva arquivo="codigos-santuario" alt="Um santuário visto por uma fechadura, com um caminho dourado de letras hebraicas que leva a uma arca. Códigos Avivar." lado="cheia" fx="brilho" />
            <section className="oq-hero">
              <p className="oq-sobre">CÓDIGOS AVIVAR · PROFETAS DOS ÚLTIMOS DIAS</p>
              <h2>Existe uma hora em que o céu levanta alguém.</h2>
              {abCorpo.map((l, i) => <p key={i}>{l}</p>)}
            </section>
          </div>
          <div className="oq-chamada">
            {abFecho && <p className="oq-grifo">{abFecho}</p>}
            <div className="botoes centro"><Link className="btn ouro grande" to={comecar}>{sessao ? 'CONTINUAR A JORNADA' : 'COMEÇAR A JORNADA'}</Link></div>
          </div>
        </Revela>

        <Revela>
          <section className="oq-texto">
            <h2 className="oq-titulo">O mundo dorme. O Senhor chama.</h2>
            <ImgViva arquivo="enigma-1" foco="center 75%" alt="Um chamado que começa em silêncio: uma pequena luz em forma de fechadura sobre uma planície escura" lado="dir" fx="nevoa" legenda="Alguns chamados começam em silêncio." />
            {mundo.map((l, i) => <p key={i}>{l}</p>)}
          </section>
        </Revela>

        <Revela>
          <section className="oq-luz">
            <h2 className="oq-titulo">Vós sois a luz do mundo</h2>
            <ImgViva arquivo="enigma-2" alt="Uma cidade adormecida à noite, com uma luz que permanece acesa" lado="esq" fx="brilho" legenda="Enquanto o mundo dorme, uma luz permanece acesa." />
            <TextoLongo texto={TEXTO_LUZ} />
            <h2 className="oq-titulo oq-continua">Em toda crise, Deus levantou alguém</h2>
            <ImgViva arquivo="oq-crise" alt="Um vulto de pé sobre uma rocha, com um raio de luz rompendo a tempestade" lado="dir" fx="tremula" />
            <p className="oq-intro">A Bíblia mostra um padrão: quando a crise chega, Deus não entrega o povo ao acaso. Ele levanta alguém para preparar o caminho. Cada um deles recebeu um chamado, enfrentou um tempo difícil e viu o Senhor agir com sinais, milagres e maravilhas.</p>
            <p className="oq-intro">Veja a sequência, de Adão aos apóstolos. Em cada vida, a luz era a mesma: a voz do Senhor chegando a um coração que ouviu.</p>
            <GradeTres className="oq-profetas" tema="profeta">
              {(db.profetas || []).map((p, i) => <CartaoProfeta key={p.id} p={p} i={i} />)}
            </GradeTres>
            <article className="cartao hoje oq-hoje">
              <Selo tipo="ouro">AGORA</Selo>
              <h3>E os Profetas dos Últimos Dias?</h3>
              <p>Joel anunciou, e Pedro repetiu no Pentecostes, que o Espírito seria derramado sobre filhos e filhas, jovens e idosos (Joel 2:28; Atos 2:17). Cremos que esta é a hora de uma geração que sabe ouvir, discernir e agir.</p>
              <p className="oq-grifo">Quem será o próximo?</p>
            </article>
            <p className="mudo oq-nota">Como lemos o dom profético: cremos que o profeta é chamado desde o ventre (Jeremias 1:5; Lucas 1:15-17) e que o dom de profecia é dado pelo Espírito Santo a quem Ele quer (1 Coríntios 12:11), e não a todos (1 Coríntios 12:29), para edificação, exortação e consolação do povo (1 Coríntios 14:3). Ao mesmo tempo, é vontade do Pai que todos os seus filhos tenham comunhão e intimidade com Ele.</p>
          </section>
        </Revela>

        <Revela>
          <section className="oq-pent">
            <h2 className="oq-titulo">A profecia antes e depois do Pentecostes</h2>
            <p className="oq-intro">Os profetas da Antiga Aliança e as pessoas que profetizam pelo dom do Espírito Santo têm a mesma fonte: Deus fala e o homem transmite. O que muda é o alcance. <Selo>INTERPRETAÇÃO TEOLÓGICA</Selo></p>
            <div className="oq-duas">
              <article className="oq-col">
                <ImgViva arquivo="enigma-3" alt="Sobre uma mesa de pedra: um cajado, uma trombeta, um rolo, um manto, um vaso e tábuas, sob um raio de luz" lado="cheia" fx="brilho" legenda="Os instrumentos mudam. O chamado é o mesmo." />
                <h3>Antes: Deus fala por instrumentos</h3>
                <TextoLongo texto={PENT_ESQ} />
              </article>
              <article className="oq-col">
                <ImgViva arquivo="oq-profecia" alt="Um pergaminho antigo e uma lamparina à esquerda, e pequenas chamas de luz sobre os discípulos reunidos, à direita" lado="cheia" fx="nevoa" legenda="O dia de Pentecostes." />
                <h3>Depois: o mesmo Espírito, derramado</h3>
                <TextoLongo texto={PENT_DIR} />
              </article>
            </div>
            <div className="botoes centro"><Link className="btn ouro" to="/estudos-profeticos/pentecostes">ESTUDAR NA SALA DE ESTUDOS PROFÉTICOS</Link></div>
            <GradeTres className="oq-grade" tema="dons">
              {(db.dom || []).map((x) => (
                <article key={x.id} className="cartao dom">
                  <h3>{x.titulo}</h3>
                  {x.lista !== false
                    ? <ul>{linhas(x.texto).map((t, k) => <li key={k}>{t}</li>)}</ul>
                    : linhas(x.texto).map((t, k) => <p key={k}>{t}</p>)}
                  {x.ref && <p className="ref">{x.ref}</p>}
                </article>
              ))}
            </GradeTres>
          </section>
        </Revela>

        <Revela>
          <section>
            <h2 className="oq-titulo">O que os Códigos Avivar treinam</h2>
            <ImgViva arquivo="oq-treinam" alt="Uma Bíblia aberta com seis luzes acesas em arco sobre ela" lado="esq" fx="tremula" />
            <p className="oq-intro">Poder sem preparo machuca. Por isso o treinamento se apoia em seis eixos, praticados na jornada, nas aulas e nas salas.</p>
            <GradeTres className="oq-grade" tema="dons">
              {(db.pilares || []).map((p, i) => (
                <article key={p.id} className="cartao pilar">
                  <span className="num">EIXO {i + 1}</span>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                  <p className="ref">{p.ref}</p>
                </article>
              ))}
            </GradeTres>
          </section>
        </Revela>

        <Revela>
          <section>
            <h2 className="oq-titulo">Há códigos que ainda estão selados</h2>
            <ImgViva arquivo="oq-selados" alt="Um pergaminho lacrado e uma chave de luz dourada diante de uma porta de pedra" lado="dir" fx="brilho" />
            <p className="oq-intro">O profeta Amós escreveu que o Senhor não faz coisa alguma sem revelar o seu segredo aos seus servos, os profetas (Amós 3:7). E o salmista diz que o Senhor confia os seus segredos aos que o temem (Salmos 25:14). Cremos que, nesta geração, há códigos espirituais valiosíssimos a serem revelados pelo Espírito Santo. Estes são os que o Senhor ainda guarda: só Ele os abre (Apocalipse 5:5). Não os confunda com os Selos Avivar, marcas de estudo do aplicativo, logo abaixo.</p>
            <GradeTres className="oq-grade" tema="selos">
              {(db.selos || []).map((x, i) => (
                <article key={x.id} className="cartao codigo">
                  <svg className="cadeado" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                  <Selo>CÓDIGO SELADO {i + 1}</Selo>
                  <h3>{x.titulo}</h3>
                  <p>{x.chamada}</p>
                  <p className="ref">{x.ref}</p>
                  {(db.estudosProf || []).some((y) => y.id === x.id) && <Link className="btn pequeno" to={'/estudos-profeticos/' + x.id}>Estudar →</Link>}
                </article>
              ))}
            </GradeTres>
          </section>
        </Revela>

        <Revela>
          <section>
            <h2 className="oq-titulo">Onde o treinamento acontece</h2>
            <div className="oq-duas">
              <article className="oq-col">
                <ImgViva arquivo="oq-espacos" alt="Um salão com portas em arco que se abrem para uma montanha, um rio, um deserto, o céu estrelado e uma tenda de luz" lado="cheia" fx="nevoa" titulo="PORTAIS AVIVAR" to="/estudos-profeticos/portais-avivar" />
                <h3>Portais Avivar</h3>
                <TextoLongo texto={TEXTO_PORTAIS} />
                <Link className="btn ouro" to="/estudos-profeticos/portais-avivar">ABRIR O ESTUDO</Link>
              </article>
              <article className="oq-col">
                <ImgViva arquivo="selos-avivar" alternativa="oq-selados" alt="Um pergaminho lacrado com cera lisa e uma chave de luz dourada, para os Selos Avivar" lado="cheia" fx="tremula" titulo="SELOS AVIVAR" to="/estudos-profeticos/selos-avivar" legenda="Nem todo código se abre de uma vez." />
                <h3>Selos Avivar</h3>
                <TextoLongo texto={TEXTO_SELOS} />
                <Link className="btn ouro" to="/estudos-profeticos/selos-avivar">ABRIR O ESTUDO</Link>
              </article>
            </div>
            <GradeTres className="oq-grade" tema="espacos">
              {ESPACOS.map(([to, t, d]) => (
                <Link key={to} to={to} className="cartao espaco"><h3>{t}</h3><p>{d}</p><span className="mudo">Entrar →</span></Link>
              ))}
            </GradeTres>
          </section>
        </Revela>

        <Revela>
          <section className="oq-final">
            <h2 className="oq-titulo">Um povo. Uma escolha.</h2>
            <ImgViva arquivo="oq-povo" alt="Silhuetas de costas, ao amanhecer, segurando pequenas lamparinas" lado="dir" fx="brilho" />

            <p>O Senhor sempre levantou alguém quando a crise chegou. Cremos que, desta vez, Ele levanta um povo: homens e mulheres que sabem identificar cada comando do Espírito Santo, discernir as armadilhas das trevas, equilibrar o poder que o Senhor derramou e glorificar o nome de Jesus, o Cristo amado.</p>
            <p>Os Códigos Avivar são o convite para estar entre os que acordam, aprendem e permanecem de pé.</p>
            <div className="botoes centro">
              <Link className="btn ouro grande" to={comecar}>{sessao ? 'CONTINUAR A JORNADA' : 'ENTRAR NA JORNADA'}</Link>
              <Link className="btn" to="/planos">Ver os planos</Link>
              <Link className="btn" to="/biblioteca">Biblioteca Avivar</Link>
            </div>
          </section>
        </Revela>

        <Enigma n={5} video legenda="Quem estará acordado quando amanhecer?" />

        {c.oQueSao && (
          <Revela>
            <section className="cartao palavra">
              <Selo tipo="ouro">PALAVRA DO PASTOR</Selo>
              {linhas(c.oQueSao).map((l, i) => <p key={i}>{l}</p>)}
              <p className="ref">Pastor Marcos Fagner</p>
            </section>
          </Revela>
        )}

        <p className="mudo oq-nota">Uma palavra de honestidade: os Códigos Avivar são uma ferramenta de estudo e de formação cristã. Não substituem a Bíblia, a igreja local nem o acompanhamento pastoral. Concluir um curso ou receber um certificado não confere ofício, unção ou ordenação: é Deus quem chama. As convicções desta página são as do Ministério Avivar do Espírito. Nos conteúdos, separamos sempre o que é texto bíblico, interpretação, história, tradição, testemunho e hipótese.</p>
      </div>
    </Shell>
  )
}

/* ───────────── LIVRARIA E COMPRA ───────────── */

// Cursos que o admin colocou à venda avulsa (Admin > Cursos > "Vender este curso avulso": Sim).
function CursosAvulsos() {
  const { db, atualizarEdicoes } = useLoja()
  const { ids, recarregar } = useCursosComprados()
  const lista = (db.cursos || []).filter(cursoAvulso)
  if (!SERVIDOR || lista.length === 0) return null
  return (
    <section id="cursos-avulsos" aria-label="Cursos avulsos">
      <h2>Cursos avulsos</h2>
      <p className="mudo">Compre só o curso que você quer: ele fica liberado para sempre, sem precisar assinar um plano. Quem já tem o plano que inclui o curso não precisa comprar.</p>
      <GradeTres className="grade" tema="cursos">
        {lista.map((c) => <CartaoCursoAvulso key={c.id} c={c} comprados={ids} aoLiberar={() => { recarregar(); atualizarEdicoes() }} />)}
      </GradeTres>
    </section>
  )
}

function PaginaLivros() {
  const { sessao, db } = useLoja()
  return (
    <Shell titulo="Livros Avivar">
      <Suspense fallback={<p className="mudo" role="status">Carregando…</p>}><LvEstante sessao={sessao} ministerio={MINISTERIO} /></Suspense>
      <CursosAvulsos />
    </Shell>
  )
}

function PaginaLivroAvivar() {
  const { sessao, db } = useLoja()
  return (
    <Shell titulo="Livros Avivar">
      <Suspense fallback={<p className="mudo" role="status">Carregando…</p>}><LvDetalhe sessao={sessao} db={db} ministerio={MINISTERIO} /></Suspense>
    </Shell>
  )
}

function ComprarLivroAvivar() {
  const { sessao } = useLoja()
  return (
    <Shell titulo="Comprar">
      <Suspense fallback={<p className="mudo" role="status">Carregando…</p>}><LvComprar sessao={sessao} /></Suspense>
    </Shell>
  )
}

// A antiga Loja Avivar foi unida aos Livros Avivar: os endereços antigos levam para o lugar novo.
function DaLoja() {
  const { id, formato } = useParams()
  return <Navigate to={id ? (formato ? '/livros/' + id + '/comprar/' + formato : '/livros/' + id) : '/livros'} replace />
}

function LeitorAvivar() {
  return <Suspense fallback={null}><LvLeitor /></Suspense>
}

const CAMPOS_END = [
  ['nome', 'Nome completo'], ['endereco', 'Rua ou avenida'], ['numero', 'Número'], ['complemento', 'Complemento', true], ['bairro', 'Bairro'],
  ['cidade', 'Cidade'], ['uf', 'Estado (UF)'], ['cep', 'CEP'], ['referencia', 'Ponto de referência'], ['whatsapp', 'WhatsApp'], ['email', 'E-mail'],
]
const nomeFormato = (f) => (f === 'fisico' ? 'Livro físico' : 'PDF')

function Pagamento() {
  const { id } = useParams()
  const { pedidos, pagarPedido } = useLoja()
  const nav = useNavigate()
  const p = pedidos.find((x) => x.id === id)
  if (!p) return <Shell titulo="Pagamento"><p>Pedido não encontrado.</p></Shell>
  return (
    <Shell titulo="Pagamento">
      <Aviso forte>SIMULAÇÃO. Nesta fase o Mercado Pago ainda não está ligado: nenhum valor é cobrado. Na versão real, esta tela é a página de pagamento do Mercado Pago.</Aviso>
      <div className="cartao">
        <h2>{p.titulo}</h2>
        <p>Modelo: <b>{nomeFormato(p.formato)}</b> · Valor: <b>{preco(p.preco)}</b></p>
        <button className="btn ouro" onClick={() => { pagarPedido(p.id); nav('/pedido/' + p.id, { replace: true }) }}>Simular pagamento aprovado</button>
      </div>
    </Shell>
  )
}

function Pedido() {
  const { id } = useParams()
  const { pedidos, db, sessao } = useLoja()
  const p = pedidos.find((x) => x.id === id)
  if (!p) return <Shell titulo="Pedido"><p>Pedido não encontrado.</p></Shell>
  if (p.status !== 'pago') return <Shell titulo="Pedido"><Aviso>Pagamento ainda não concluído.</Aviso><Link className="btn ouro" to={'/pagamento/' + p.id}>Ir para o pagamento</Link></Shell>
  const l = db.livros.find((x) => x.id === p.livroId)
  const d = p.dados
  const c = db.config
  if (p.formato === 'pdf') {
    return (
      <Shell titulo="Pagamento concluído">
        <div className="cartao centro">
          <h2>Pagamento concluído</h2>
          <p>{p.titulo} · PDF</p>
          {l && l.pdfUrl
            ? <a className="btn ouro grande" href={l.pdfUrl} download target="_blank" rel="noreferrer">Baixar PDF</a>
            : <><button className="btn ouro grande" disabled>Baixar PDF</button><p className="mudo">O arquivo deste livro ainda não foi anexado pelo admin.</p></>}
        </div>
      </Shell>
    )
  }
  return (
    <Shell titulo="Pedido confirmado">
      <div className="no-print botoes"><button className="btn ouro" onClick={() => window.print()}>Imprimir esta página</button></div>
      <section className="cartao ficha">
        <h2>Ficha do pedido nº {p.id.toUpperCase()}</h2>
        <p>Data: {p.data} · Pagamento: concluído</p>
        <p>Livro: <b>{p.titulo}</b> · Modelo: <b>Livro físico</b> · Valor: {preco(p.preco)}</p>
        <dl>
          {CAMPOS_END.map(([k, t]) => <div key={k}><dt>{t}</dt><dd>{d[k] || '—'}</dd></div>)}
        </dl>
      </section>
      {sessao.admin ? (
        <section className="etiquetas">
          <div className="etiqueta">
            <small>DESTINATÁRIO</small>
            <strong>{d.nome}</strong>
            <span>{d.endereco}, {d.numero}{d.complemento ? ' · ' + d.complemento : ''}</span>
            <span>{d.bairro} · {d.cidade}/{d.uf}</span>
            <span>CEP {d.cep}</span>
            <span>Ref.: {d.referencia}</span>
            <span>WhatsApp: {d.whatsapp}</span>
            <hr />
            <small>CONTEÚDO</small><span>{p.titulo} (livro físico) · pedido {p.id.toUpperCase()}</span>
            <hr />
            <small>REMETENTE</small><span>{c.remetenteNome}</span><span>{c.remetenteEndereco || 'Endereço do remetente em breve'}</span>
          </div>
          <div className="etiqueta agradecimento">
            <strong>CÓDIGOS AVIVAR</strong>
            <small>PROFETAS DOS ÚLTIMOS DIAS</small>
            <p>{d.nome}, {c.agradecimento}</p>
            <span>{c.remetenteNome}</span>
            <span>{c.remetenteEndereco || 'Endereço em breve'}</span>
          </div>
        </section>
      ) : <p className="mudo no-print">Guarde esta ficha. O envio será combinado pelo WhatsApp informado.</p>}
    </Shell>
  )
}

/* ───────────── BIBLIOTECA AVIVAR ───────────── */

function Biblioteca() {
  const { db, sessao, salvarItem } = useLoja()
  const admin = sessao && sessao.admin
  return (
    <Shell titulo="Biblioteca Avivar" editar="biblioteca">
      <Faixa src="/img/biblioteca.webp" titulo="Biblioteca Avivar" frase="Estante aberta a todos." vida="poeira" video="biblioteca">
        <p className="mudo">Estante aberta ao público. Os livros com o botão ativo podem ser baixados em PDF.</p>
        <div className="faixa-chips"><Selo tipo="ouro">{db.biblioteca.length} {db.biblioteca.length === 1 ? 'livro' : 'livros'} na estante</Selo><Selo>{db.biblioteca.filter((b) => b.pdfAtivo && b.pdfUrl).length} em PDF</Selo></div>
      </Faixa>
      <GradeTres className="grade livros" tema="biblioteca" colunas="livros">
        {db.biblioteca.map((b) => {
          const pronto = b.pdfAtivo && b.pdfUrl
          return (
            <article key={b.id} className="cartao livro">
              <Capa item={b} />
              <h3>{b.titulo}</h3>
              <p className="mudo">{b.autor}</p>
              {b.sinopse && <details className="sinopse-det"><summary>Sinopse</summary><p>{b.sinopse}</p></details>}
              {pronto
                ? <a className="btn ouro" href={b.pdfUrl} download target="_blank" rel="noreferrer">Baixar PDF</a>
                : <button className="btn" disabled>{b.pdfAtivo ? 'Arquivo ainda não anexado' : 'Baixar PDF (em breve)'}</button>}
              {admin && <button className="btn admin" onClick={() => salvarItem('biblioteca', { ...b, pdfAtivo: !b.pdfAtivo })}>{b.pdfAtivo ? 'Admin: desativar o botão de PDF' : 'Admin: ativar o botão de PDF'}</button>}
            </article>
          )
        })}
      </GradeTres>
    </Shell>
  )
}

/* ───────────── REPORTAGENS ───────────── */

function CartaoReportagem({ r }) {
  return (
    <article className="cartao reportagem">
      <Link to={'/reportagens/' + r.id} aria-label={'Acessar o conteúdo: ' + r.titulo} className={'reportagem-img rfx-' + (String(r.id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % 3)}>
        <Paisagem />
        <Foto src={r.imagemUrl || '/img/reportagem-' + r.id + '.webp'} veu={false} />
      </Link>
      <Selo>{r.etiqueta || 'ESTUDO'}</Selo>
      <h3><Link to={'/reportagens/' + r.id}>{r.titulo}</Link></h3>
      {r.autor && <p className="mudo">por {r.autor}</p>}
      <p>{r.resumo}</p>
      <Link className="btn ouro" to={'/reportagens/' + r.id}>ACESSAR CONTEÚDO</Link>
    </article>
  )
}

function Reportagens() {
  const { db } = useLoja()
  return (
    <Shell titulo="Estudos Avivar" editar="reportagens">
      <p className="mudo">Estudos da série Códigos Avivar — Profetas dos Últimos Dias. Cada texto traz uma etiqueta que diz a sua natureza.</p>
      <GradeTres className="grade reportagens" tema="estudos">{db.reportagens.map((r) => <CartaoReportagem key={r.id} r={r} />)}</GradeTres>
    </Shell>
  )
}

// Quebra o texto salvo em parágrafos, subtítulos, citações e listas.
function FiguraSlot({ arquivo, legenda }) {
  const [erro, setErro] = useState(false)
  return (
    <figure className="fig">
      {erro
        ? <div className="fig-vazio" role="img" aria-label={legenda}><span>Espaço reservado para imagem</span></div>
        : <img src={'/quantica/' + arquivo + '.webp'} alt={legenda} loading="lazy" onError={() => setErro(true)} />}
      <figcaption>{legenda}</figcaption>
    </figure>
  )
}

function TextoLongo({ texto }) {
  const blocos = String(texto || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  const saida = []
  blocos.forEach((b, bi) => {
    let lista = []
    const fecha = (k) => { if (lista.length) { saida.push(<ul key={`${bi}-ul-${k}`}>{lista.map((x, i) => <li key={i}><Inline t={x} /></li>)}</ul>); lista = [] } }
    b.split('\n').map((l) => l.trim()).filter(Boolean).forEach((l, li) => {
      if (l.startsWith('• ')) { lista.push(l.slice(2)); return }
      fecha(li)
      const fig = l.match(/^\[\[imagem:\s*([^|\]]+?)\s*\|\s*(.+?)\s*\]\]$/)
      const et = l.match(/^\{\{([^}!][^}]*)\}\}\s*(.*)$/)
      const nc = l.match(/^\{\{!([^}]+)\}\}\s*(.*)$/)
      if (nc) { const [tp, og, rl] = nc[1].split('|').map((x) => x.trim()); saida.push(<OrigemNC key={`${bi}-${li}`} tipo={tp} origem={og} relacionado={rl}><Inline t={nc[2]} /></OrigemNC>) }
      else if (fig) saida.push(<FiguraSlot key={`${bi}-${li}`} arquivo={fig[1]} legenda={fig[2]} />)
      else if (et) saida.push(<p key={`${bi}-${li}`}><Selo>{et[1]}</Selo> <Inline t={et[2]} /></p>)
      else if (/^["“].+["”]$/.test(l)) saida.push(<blockquote key={`${bi}-${li}`}>{l}</blockquote>)
      else if (l.length < 110 && !/[.!?:”"]$/.test(l)) saida.push(<h3 key={`${bi}-${li}`} className="sub">{l}</h3>)
      else saida.push(<p key={`${bi}-${li}`}><Inline t={l} /></p>)
    })
    fecha('fim')
  })
  return <div className="leitura">{saida}</div>
}

function Reportagem() {
  const { id } = useParams()
  const { db } = useLoja()
  const r = db.reportagens.find((x) => x.id === id)
  if (!r) return <Shell titulo="Estudo"><p>Estudo não encontrado.</p><Link className="btn" to="/reportagens">Ver os estudos</Link></Shell>
  return (
    <Shell titulo="Estudo" editar="reportagens">
      <article className="reportagem-pagina">
        <div className="reportagem-capa">
          <Paisagem />
          <Foto src={r.imagemUrl || '/img/reportagem-' + r.id + '.webp'} veu={false} />
        </div>
        <Selo>{r.etiqueta || 'ESTUDO'}</Selo>
        <h2>{r.titulo}</h2>
        {r.autor && <p className="mudo">por {r.autor}</p>}
        <PainelBiblia refs={refsDoTexto(r.texto)} titulo="Bíblia Avivar" dica="As passagens citadas neste estudo. Toque em uma para ler o texto aqui." />
        <TextoLongo texto={r.texto} />
        <Aviso>Este estudo reúne interpretação e reflexão do autor à luz da fé. Ela não substitui orientação médica nem o estudo direto das Escrituras.</Aviso>
        <Link className="btn" to="/reportagens">← Todos os estudos</Link>
      </article>
    </Shell>
  )
}

/* ───────────── CURSOS ───────────── */

function Cursos() {
  const { db } = useLoja()
  return (
    <Shell titulo="Cursos Avivar" editar="cursos">
      <Faixa src="/img/cursos.webp" titulo="Cursos Avivar" frase="Aprender para servir: aulas, textos e livros de apoio." vida={['estrelas', 'luz']} video="cursos">
        <p className="mudo">Cada curso reúne aulas em vídeo, textos e livros de apoio.</p>
        <div className="faixa-chips"><Selo tipo="ouro">{db.cursos.length} {db.cursos.length === 1 ? 'curso' : 'cursos'}</Selo><Selo>{db.aulas.length} {db.aulas.length === 1 ? 'aula' : 'aulas'}</Selo></div>
      </Faixa>
      {db.cursos.length === 0 && <Aviso>Cursos em breve.</Aviso>}
      {db.cursos.length >= 2 && db.cursos.length <= 9 ? (
        <Organograma
          chave="cursos"
          titulo="Os cursos Avivar"
          rotulo="Toque em um curso para abrir. Toque no centro para ouvir a Palavra."
          nos={db.cursos.map((c, i) => { const nA = db.aulas.filter((a) => a.cursoId === c.id).length; return { id: c.id, titulos: [c.titulo], titulo: c.titulo, desc: c.categoria || 'Curso', verso: ORG_CURSOS_VERSOS[i % ORG_CURSOS_VERSOS.length], to: '/cursos/' + c.id, extra: nA + (nA === 1 ? ' aula' : ' aulas') } })}
        />
      ) : (
      <GradeTres className="grade" tema="cursos">
        {db.cursos.map((c) => (
          <Link key={c.id} className="cartao curso" to={'/cursos/' + c.id} {...(SERVIDOR ? { 'data-livre': true } : {})}>
            <Selo tipo="ouro">{c.categoria || 'Curso'}</Selo>{c.area === 'Sala Quântica' && <Selo>SALA QUÂNTICA</Selo>}{c.demo && <Selo>DEMONSTRAÇÃO</Selo>}
            {SERVIDOR && cursoAvulso(c) && <Selo>CURSO AVULSO</Selo>}
            <h3>{c.titulo}</h3><p>{c.descricao}</p>
            <span className="mudo">{db.aulas.filter((a) => a.cursoId === c.id).length} aulas</span>
          </Link>
        ))}
      </GradeTres>
      )}
    </Shell>
  )
}

function Curso() {
  const { id } = useParams()
  const { db, sessao, atualizarEdicoes } = useLoja()
  const { ids, pronto, recarregar } = useCursosComprados()
  const [sel, setSel] = useState(0)
  const [tentou, setTentou] = useState(false)
  const c = db.cursos.find((x) => x.id === id)
  const aulas = c ? db.aulas.filter((a) => a.cursoId === c.id) : []
  const noPlano = !!c && cursoNoPlano(c, sessao)
  const acesso = !c ? true : SERVIDOR ? noPlano || ids.includes(c.id) : ehAssinante(sessao)
  const trancadas = aulas.some((a) => a.bloqueada)
  // quem tem direito mas ainda está com as aulas "trancadas" (acabou de comprar ou de assinar): busca de novo
  useEffect(() => {
    if (SERVIDOR && c && acesso && trancadas) { let vivo = true; Promise.resolve(atualizarEdicoes()).finally(() => { if (vivo) setTentou(true) }); return () => { vivo = false } }
    return undefined
  }, [acesso, trancadas, id])
  if (!c) return <Shell titulo="Curso"><p>Curso não encontrado.</p></Shell>
  if (SERVIDOR && !noPlano && !pronto) return <Shell titulo={c.titulo}><div className="carregando" role="status">Carregando…</div></Shell>
  if (!acesso) {
    if (!SERVIDOR) return <Shell titulo="Conteúdo para assinantes"><BloqueioAssinante /></Shell>
    const nomePlano = planoDoCurso(c) === 'serafim' ? 'Serafim' : 'Querubim ou Serafim'
    return (
      <Shell titulo={c.titulo}>
        <p>{c.descricao}</p>
        <div className="cartao bloqueio">
          <span className="trava-icone" aria-hidden="true">🔒</span>
          <h2>Curso fechado</h2>
          <p>Este curso abre para quem tem o plano <b>{nomePlano}</b>{cursoAvulso(c) ? ' ou compra só este curso, para sempre.' : '.'}</p>
          <div className="botoes centro"><Link className="btn ouro" to="/planos">Ver os planos</Link><Link className="btn" to="/cursos">Voltar aos cursos</Link></div>
        </div>
        {cursoAvulso(c) && <div className="curso-avulso-unico"><CartaoCursoAvulso c={c} comprados={ids} aoLiberar={() => { recarregar(); atualizarEdicoes() }} /></div>}
        {aulas.length > 0 && <>
          <h3>As aulas deste curso</h3>
          <ol className="lista">{aulas.map((x) => <li key={x.id} className="cartao item-linha"><span><Selo>{x.tipo}</Selo> {x.titulo}</span><span aria-label="fechada">🔒</span></li>)}</ol>
        </>}
      </Shell>
    )
  }
  if (trancadas) {
    return (
      <Shell titulo={c.titulo}>
        <p>{c.descricao}</p>
        {tentou
          ? <div className="cartao bloqueio"><p>Não foi possível abrir as aulas agora. Confira a internet e tente de novo.</p><div className="botoes centro"><button type="button" className="btn ouro" onClick={() => { setTentou(false); atualizarEdicoes() }}>Tentar de novo</button></div></div>
          : <div className="carregando" role="status">Abrindo as aulas…</div>}
      </Shell>
    )
  }
  const a = aulas[sel]
  return (
    <Shell titulo={c.titulo} editar="aulas">
      <p>{c.descricao}</p>
      {!a ? <Aviso>Aulas em breve.</Aviso> : (
        <div className="curso-pagina">
          <div>
            <h2>{a.titulo}</h2>
            {a.tipo === 'video' && <Tela url={a.url} titulo={a.titulo} />}
            {a.tipo === 'texto' && <div className="cartao texto">{linhas(a.texto).map((l, i) => <p key={i}>{l}</p>)}{!a.texto && <p>Texto em breve.</p>}</div>}
            {a.tipo === 'livro' && <div className="cartao">{a.url ? <a className="btn ouro" href={a.url} target="_blank" rel="noreferrer">Abrir o livro de apoio</a> : <p>Livro de apoio em breve.</p>}</div>}
          </div>
          <div className="lista">
            {aulas.map((x, i) => <button key={x.id} className={'cartao item-linha' + (i === sel ? ' ativo' : '')} onClick={() => setSel(i)}><Selo>{x.tipo}</Selo> {x.titulo}</button>)}
          </div>
        </div>
      )}
    </Shell>
  )
}

/* ───────────── JORNADA, MONTANHA, ESTUDOS ───────────── */

/* ───────────── ORGANOGRAMA DAS SALAS ─────────────
   Um card central pulsante (REINO DE DEUS) de onde saem pistas tracejadas até os cards da sala.
   As pistas têm setas de mão dupla (vão e voltam) e ligam também um card ao outro.
   Um card por vez gira e aponta o caminho; todos dão pequenos clarões.
   Tocar no centro: o botão explode, solta luz, relâmpagos e trovão, e mostra um texto bíblico ligado aos cards.
   Os títulos de cada card mudam a cada vez que a pessoa entra. */
function tocarTrovao() {
  comSom((c, t) => {
    const mestre = c.createGain(); mestre.gain.value = 0.9; mestre.connect(c.destination)
    // o estalo seco do raio
    const r1 = ruidoCurto(c, 0.4); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500
    const g1 = c.createGain(); g1.gain.setValueAtTime(0.0001, t); g1.gain.linearRampToValueAtTime(0.5, t + 0.006); g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    r1.connect(hp); hp.connect(g1); g1.connect(mestre); r1.start(t); r1.stop(t + 0.4)
    // o rumor que rola pelo céu
    const r2 = ruidoCurto(c, 3.4); const lp = c.createBiquadFilter(); lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1100, t + 0.05); lp.frequency.exponentialRampToValueAtTime(70, t + 3.2)
    const g2 = c.createGain(); g2.gain.setValueAtTime(0.0001, t + 0.05); g2.gain.linearRampToValueAtTime(0.7, t + 0.22)
    g2.gain.linearRampToValueAtTime(0.35, t + 0.6); g2.gain.linearRampToValueAtTime(0.6, t + 0.95); g2.gain.exponentialRampToValueAtTime(0.0001, t + 3.3)
    r2.connect(lp); lp.connect(g2); g2.connect(mestre); r2.start(t); r2.stop(t + 3.4)
    // o estrondo grave
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t + 0.05); o.frequency.exponentialRampToValueAtTime(32, t + 1.6)
    const g3 = c.createGain(); g3.gain.setValueAtTime(0.0001, t + 0.05); g3.gain.linearRampToValueAtTime(0.5, t + 0.12); g3.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
    o.connect(g3); g3.connect(mestre); o.start(t + 0.05); o.stop(t + 2.3)
    // um brilho suave que sobe logo depois, para a luz
    ;[523.25, 783.99, 1046.5].forEach((f, k) => {
      const oo = c.createOscillator(); oo.type = 'sine'; oo.frequency.value = f
      const gg = c.createGain(); const t0 = t + 0.5 + k * 0.08
      gg.gain.setValueAtTime(0.0001, t0); gg.gain.linearRampToValueAtTime(0.05, t0 + 0.2); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2)
      oo.connect(gg); gg.connect(mestre); oo.start(t0); oo.stop(t0 + 2.3)
    })
  })
}

// Pontos de um raio em zigue-zague, saindo de (x0,y0) em direção a (x1,y1), em % da tela.
function raioDe(x0, y0, x1, y1) {
  const pts = []
  const passos = 10
  for (let s = 0; s <= passos; s++) {
    const f = s / passos
    const dx = (s === 0 || s === passos) ? 0 : (Math.random() - 0.5) * 9
    const dy = (s === 0 || s === passos) ? 0 : (Math.random() - 0.5) * 9
    pts.push((x0 + (x1 - x0) * f + dx).toFixed(1) + ',' + (y0 + (y1 - y0) * f + dy).toFixed(1))
  }
  return pts.join(' ')
}

// Sorteia um dos títulos de cada card e lembra o último, para a pessoa ver um título diferente a cada entrada.
function sortearTitulos(chave, nos) {
  let ult = {}
  try { ult = JSON.parse(localStorage.getItem('ca-org-' + chave) || '{}') || {} } catch (e) { ult = {} }
  const novo = {}
  const esc = nos.map((n) => {
    const t = (n.titulos && n.titulos.length ? n.titulos : [n.titulo])
    let k = Math.floor(Math.random() * t.length)
    if (t.length > 1 && k === ult[n.id]) k = (k + 1) % t.length
    novo[n.id] = k
    return t[k]
  })
  try { localStorage.setItem('ca-org-' + chave, JSON.stringify(novo)) } catch (e) { /* sem memória */ }
  return esc
}

// Ponto onde a reta que sai do centro (cx,cy) em direção a (px,py) cruza a borda de um retângulo de meia largura hw e meia altura hh.
function bordaRet(cx, cy, hw, hh, px, py) {
  const dx = px - cx, dy = py - cy
  if (!dx && !dy) return [cx, cy]
  const t = Math.min(hw ? hw / Math.abs(dx || 1e-9) : Infinity, hh ? hh / Math.abs(dy || 1e-9) : Infinity)
  const k = Math.min(1, t)
  return [cx + dx * k, cy + dy * k]
}

function calcularOrg(N, W, modo) {
  const nos = [], juncoes = [], liga = []
  let H
  if (modo === 'arvore') {
    const cw = Math.max(116, Math.min(200, Math.floor((W - 76) / 2)))
    const ch = W < 460 ? 88 : 96
    const cenW = Math.min(250, W - 40), cenH = 74
    const passo = Math.round((ch + 18) / 2)
    const topo = cenH + 46
    const cx = W / 2
    const centro = { x: cx, y: cenH / 2 + 8, w: cenW, h: cenH }
    for (let i = 0; i < N; i++) {
      const y = topo + i * passo + ch / 2 - passo / 2 + 4
      const esq = i % 2 === 0
      const x = esq ? cx - 30 - cw / 2 : cx + 30 + cw / 2
      nos.push({ x, y, w: cw, h: ch })
      juncoes.push({ x: cx, y })
    }
    H = topo + (N - 1) * passo + ch + 24
    liga.push({ a: 'c', b: { x: cx, y: juncoes[N - 1].y + 10 }, ra: centro, rb: null })
    for (let i = 0; i < N; i++) liga.push({ a: { x: cx, y: juncoes[i].y }, b: 'n' + i, ra: null, rb: nos[i] })
    return { H, centro, nos, liga }
  }
  const cw = Math.max(128, Math.min(196, Math.floor(W * 0.19)))
  const ch = W < 900 ? 92 : 100
  H = N <= 3 ? 280 : Math.round(Math.min(660, Math.max(430, W * 0.54)))
  const centro = { x: W / 2, y: H / 2, w: Math.min(230, Math.round(W * 0.23)), h: 84 }
  const rx = W / 2 - cw / 2 - 14
  const ry = H / 2 - ch / 2 - 12
  const ini = N % 2 === 0 ? -90 + 180 / N : -90
  for (let i = 0; i < N; i++) {
    const a = ((ini + (360 / N) * i) * Math.PI) / 180
    nos.push({ x: W / 2 + rx * Math.cos(a), y: H / 2 + ry * Math.sin(a), w: cw, h: ch })
  }
  for (let i = 0; i < N; i++) liga.push({ a: 'c', b: 'n' + i, ra: centro, rb: nos[i] })
  if (N > 2) for (let i = 0; i < N; i++) liga.push({ a: 'n' + i, b: 'n' + ((i + 1) % N), ra: nos[i], rb: nos[(i + 1) % N], anel: true })
  return { H, centro, nos, liga }
}

// Rola suavemente até um ponto da página (depois que o conteúdo trocou).
function rolarAte(id) {
  setTimeout(() => { const el = document.getElementById(id); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: parouMovimento() ? 'auto' : 'smooth', block: 'start' }) }, 90)
}

// Cada sala tem o seu fundo: uma cor, um efeito de luz (no CSS) e um tipo de partículas.
const ORG_PARTICULAS = { jornada: 'brasas', estudos: 'rede-violeta', quantica: 'rede-ciano', reforma: 'poeira', igrejas: 'vaga-lume', cursos: 'rede-azul' }
const ORG_ESTRELAS = ['estudos', 'quantica']

let ORG_SEQ = 0
function Organograma({ chave, nos, centro = 'REINO DE DEUS', rotulo, titulo }) {
  const nav = useNavigate()
  const caixa = useRef(null)
  const botaoCentro = useRef(null)
  const [W, setW] = useState(0)
  const [ativo, setAtivo] = useState(0)
  const [fase, setFase] = useState(null) // null | 'boom' | 'verso'
  const [raios, setRaios] = useState([])
  const [origem, setOrigem] = useState([50, 50])
  const [sorteado, setSorteado] = useState(0)
  const idRef = useRef(null)
  if (idRef.current === null) idRef.current = 'org' + (++ORG_SEQ)
  const parado = useMemo(() => parouMovimento(), [])
  const N = nos.length
  const chaveNos = nos.map((n) => n.id).join('|')
  const titulosEscolhidos = useMemo(() => sortearTitulos(chave, nos), [chave, chaveNos]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = caixa.current
    if (!el) return undefined
    const med = () => setW(Math.round(el.clientWidth))
    med()
    let ro = null
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(med); ro.observe(el) } else window.addEventListener('resize', med)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', med) }
  }, [])
  useEffect(() => {
    if (parado || N < 2) return undefined
    const t = setInterval(() => setAtivo((a) => (a + 1) % N), 4200)
    return () => clearInterval(t)
  }, [parado, N])
  useEffect(() => {
    if (!fase) return undefined
    const f = (e) => { if (e.key === 'Escape') setFase(null) }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [fase])

  const modo = W && (W < 700 || N > 9) ? 'arvore' : 'radial'
  const g = useMemo(() => (W ? calcularOrg(N, W, modo) : null), [N, W, modo])
  const fs = g ? Math.max(12, Math.min(17, Math.round(g.nos[0].w / 11.5))) : 14

  const abrir = (n) => { if (n.to) nav(n.to); else if (n.onAbrir) n.onAbrir() }
  const explodir = () => {
    const r = botaoCentro.current && botaoCentro.current.getBoundingClientRect()
    const ox = r ? ((r.left + r.width / 2) / window.innerWidth) * 100 : 50
    const oy = r ? ((r.top + r.height / 2) / window.innerHeight) * 100 : 50
    setOrigem([ox, oy])
    setRaios([[-6, -6], [106, -4], [-8, 54], [108, 60], [30, 108], [76, 106], [50, -8]].map(([x, y]) => raioDe(ox, oy, x, y)))
    let k = Math.floor(Math.random() * N)
    if (N > 1 && k === sorteado) k = (k + 1) % N
    setSorteado(k)
    setFase('boom')
    tocarTrovao()
    if (!parado && navigator.vibrate) { try { navigator.vibrate([30, 40, 60]) } catch (e) { /* sem vibração */ } }
    setTimeout(() => setFase((f) => (f === 'boom' ? 'verso' : f)), parado ? 50 : 1000)
  }

  const idm = idRef.current
  const noSel = nos[sorteado] || nos[0]
  return (
    <section className={'org org-' + modo} aria-label={titulo || 'Mapa da sala'}>
      {rotulo && <p className="org-rotulo">{rotulo}</p>}
      <div className={'org-area t-' + chave} ref={caixa} style={{ height: g ? g.H : 420 }}>
        <span className="org-fundo" aria-hidden="true"><i /><i /><i /></span>
        {g && ORG_ESTRELAS.includes(chave) && <Estrelas key={'e' + modo + g.H} />}
        {g && <Particulas key={'p' + modo + g.H} tipo={ORG_PARTICULAS[chave] || 'brasas'} />}
        {g && (
          <>
            <svg className="org-svg" width={W} height={g.H} viewBox={'0 0 ' + W + ' ' + g.H} aria-hidden="true">
              <defs>
                <marker id={idm + 'm'} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" className="org-seta" /></marker>
              </defs>
              {g.liga.map((l, k) => {
                const Bn = typeof l.b === 'string' ? g.nos[Number(l.b.slice(1))] : l.b
                const An = typeof l.a === 'string' ? (l.a === 'c' ? g.centro : g.nos[Number(l.a.slice(1))]) : l.a
                if (!An || !Bn) return null
                const [x1, y1] = l.ra ? bordaRet(An.x, An.y, An.w / 2 + 3, An.h / 2 + 3, Bn.x, Bn.y) : [An.x, An.y]
                const [x2, y2] = l.rb ? bordaRet(Bn.x, Bn.y, Bn.w / 2 + 3, Bn.h / 2 + 3, An.x, An.y) : [Bn.x, Bn.y]
                const comp = Math.hypot(x2 - x1, y2 - y1)
                if (comp < 14) return null
                const d = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1)
                const dr = 'M' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1)
                const lig = !l.anel && (l.b === 'n' + ativo)
                const dur = (2.4 + (comp % 7) * 0.2).toFixed(1) + 's'
                return (
                  <g key={k} className={'org-pista' + (l.anel ? ' anel' : '') + (lig ? ' viva' : '')}>
                    <path d={d} className="org-fio" markerStart={`url(#${idm}m)`} markerEnd={`url(#${idm}m)`} />
                    {!parado && comp >= 56 && (
                      <>
                        <circle r="3.4" className="org-ponto"><animateMotion dur={dur} repeatCount="indefinite" path={d} /></circle>
                        <circle r="3.4" className="org-ponto volta"><animateMotion dur={dur} begin="-1.2s" repeatCount="indefinite" path={dr} /></circle>
                      </>
                    )}
                  </g>
                )
              })}
            </svg>
            <button type="button" ref={botaoCentro} className={'org-centro' + (fase === 'boom' ? ' explode' : '')} style={{ left: g.centro.x - g.centro.w / 2, top: g.centro.y - g.centro.h / 2, width: g.centro.w, height: g.centro.h }} onClick={explodir} aria-label={centro + ': toque para ver um texto bíblico'}>
              <span className="org-centro-t">{centro}</span>
              <small>toque aqui</small>
            </button>
            {nos.map((n, i) => {
              const p = g.nos[i]
              return (
                <button
                  key={n.id}
                  type="button"
                  className={'org-no' + (ativo === i ? ' ativo' : '') + (n.fechado ? ' fechado' : '') + (n.on ? ' on' : '')}
                  style={{ left: p.x - p.w / 2, top: p.y - p.h / 2, width: p.w, height: p.h, fontSize: fs, '--atraso': ((i * 1.15) % 7).toFixed(2) + 's' }}
                  onClick={() => abrir(n)}
                  aria-label={titulosEscolhidos[i] + (n.desc ? '. ' + n.desc : '')}
                >
                  <span className={'org-in' + (ativo === i && !parado ? ' gira' : '')} key={ativo === i ? 'g' + ativo : 'p'}>
                    <b className="org-n">{i + 1}</b>
                    <strong>{titulosEscolhidos[i]}</strong>
                    {n.desc && g.nos[0].h >= 92 && <small>{n.desc}</small>}
                    {n.extra && <em>{n.extra}</em>}
                  </span>
                </button>
              )
            })}
          </>
        )}
      </div>
      {fase && createPortal(
        <div className={'org-boom ' + fase} role="dialog" aria-modal="true" aria-label={'Texto bíblico: ' + centro} onClick={() => setFase(null)}>
          {!parado && <div className="org-clarao" />}
          {!parado && (
            <svg className="org-raios" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {raios.map((r, k) => <polyline key={k} points={r} className="org-raio" style={{ animationDelay: (k % 3) * 0.28 + 's' }} vectorEffect="non-scaling-stroke" />)}
            </svg>
          )}
          {!parado && <div className="org-onda" style={{ left: origem[0] + '%', top: origem[1] + '%' }} />}
          {fase === 'verso' && noSel && (
            <div className="org-verso" onClick={(e) => e.stopPropagation()}>
              <p className="org-verso-ref">{centro}</p>
              <blockquote>“{noSel.verso.t}”</blockquote>
              <cite>{noSel.verso.r}</cite>
              <p className="org-verso-liga">Ligado a: <b>{titulosEscolhidos[sorteado]}</b></p>
              <div className="botoes">
                {(noSel.to || noSel.onAbrir) && <button type="button" className="btn ouro" onClick={() => { setFase(null); abrir(noSel) }}>Abrir este card</button>}
                <button type="button" className="btn" onClick={explodir}>Outro texto</button>
                <button type="button" className="btn" onClick={() => setFase(null)}>Fechar</button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </section>
  )
}

// Vídeo de apresentação da sala: abre sozinho quando a pessoa entra, recolhe ao terminar e pode ser revisto com um toque.
// Se o arquivo ainda não existe em public/img, aparece o painel de boas-vindas no lugar.
function ApresentaVideo({ nome, titulo, texto, ajuda }) {
  const { sessao } = useLoja()
  const [existe, setExiste] = useState(true)
  const [aberto, setAberto] = useState(false)
  const [semSom, setSemSom] = useState(false)
  const vid = useRef(null)
  const vidPeq = useRef(null)
  const jaAbriu = useRef(false)
  // abre sozinho só depois que o navegador confirma que o arquivo é um vídeo de verdade (evita abrir e fechar)
  const aoPronto = () => { if (!jaAbriu.current) { jaAbriu.current = true; setAberto(true) } }
  const poupar = typeof navigator !== 'undefined' && !!navigator.connection && !!navigator.connection.saveData
  const src = '/img/' + nome + '.mp4'
  useEffect(() => {
    if (!aberto || !existe) return undefined
    const v = vid.current
    if (!v) return undefined
    v.muted = false
    const p = v.play()
    if (p && p.catch) p.catch(() => {
      // o navegador pediu um toque antes do som: toca sem som e oferece ligar o som
      v.muted = true; setSemSom(true)
      const q = v.play(); if (q && q.catch) q.catch(() => {})
    })
    return undefined
  }, [aberto, existe])
  useEffect(() => {
    if (!aberto) return undefined
    const f = (e) => { if (e.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [aberto])
  // com a apresentação aberta, pausa os vídeos de fundo da página (dois vídeos ao mesmo tempo é o que faz travar) e religa ao fechar
  useEffect(() => {
    if (!aberto) return undefined
    const pausados = []
    document.querySelectorAll('video').forEach((v) => { if (v !== vid.current && !v.paused && !v.closest('.apv-lightbox')) { pausados.push(v); v.pause() } })
    return () => { pausados.forEach((v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}) }) }
  }, [aberto])
  const reabrir = () => { setSemSom(false); setAberto(true) }
  return (
    <div className="apv">
      {existe && !poupar
        ? (
          <button type="button" className="apv-mini" onClick={reabrir} aria-label={'Assistir à apresentação: ' + titulo}>
            <video ref={vidPeq} src={src + '#t=0.6'} muted playsInline preload="metadata" onLoadedMetadata={aoPronto} onError={() => setExiste(false)} aria-hidden="true" />
            <span className="apv-play" aria-hidden="true">▶</span>
            <span className="apv-leg">Assistir à apresentação</span>
          </button>
        )
        : (
          <div className="apv-reserva">
            <h3>{titulo}</h3>
            <p>{texto}</p>
            {ajuda && sessao && sessao.admin && <p className="mudo">{ajuda}</p>}
          </div>
        )}
      {aberto && existe && !poupar && createPortal(
        <div className="apv-lightbox" role="dialog" aria-modal="true" aria-label={'Apresentação: ' + titulo} onClick={() => setAberto(false)}>
          <div className="apv-caixa" onClick={(e) => e.stopPropagation()}>
            <video ref={vid} src={src} poster={src.replace(/\.mp4$/, ".jpg")} playsInline preload="auto" controls controlsList="nodownload" onEnded={() => setAberto(false)} onError={() => { setExiste(false); setAberto(false) }} />
            <div className="apv-botoes">
              {semSom && <button type="button" className="btn ouro" onClick={() => { if (vid.current) { vid.current.muted = false; setSemSom(false) } }}>Ligar o som</button>}
              <button type="button" className="btn" onClick={() => setAberto(false)}>Pular e fechar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function Jornada() {
  const p = useProgresso()
  const nos = ETAPAS.map((e) => ({ id: slug(e.n), titulos: ORG_JORNADA[e.n].titulos, titulo: e.n, desc: e.d, verso: ORG_JORNADA[e.n].verso, to: e.to, fechado: !e.to, extra: e.to ? null : 'em breve' }))
  return (
    <Shell titulo="Minha Jornada">
      <Link className="btn ouro jor-efode" to="/efode">Túnica com Éfode: os meus selos</Link>
      <div className="jor-topo">
        <div className="mapa jor-img">
          <Paisagem className="fundo" />
          <FundoVivo nome="jornada" />
          <ControlesSom nome="jornada" />
        </div>
        <ApresentaVideo nome="apresenta-jornada" titulo="Bem-vindo à sua Jornada" texto="Sete lugares, do Vale às Portas Celestiais. Você avança no seu ritmo e se compara só com o seu próprio progresso." ajuda="O vídeo de apresentação abre aqui sozinho assim que o arquivo apresenta-jornada.mp4 estiver na pasta public/img." />
      </div>
      <div className="barra" aria-label={'Progresso: ' + p.pct + '%'}><i style={{ width: p.pct + '%' }} /></div>
      <p className="mudo">{p.pct}% concluído · {p.xp} XP. Você se compara só com o seu próprio progresso.</p>
      <Organograma chave="jornada" nos={nos} titulo="As sete etapas da Jornada" rotulo="Toque em um card para entrar. Toque no centro para ouvir a Palavra." />
    </Shell>
  )
}

function Montanha() {
  const { db, tarefas, marcarTarefa, sessao } = useLoja()
  let liberado = true
  const conquistadas = db.montanhas.filter((m) => { const ts = linhas(m.tarefas); return ts.length > 0 && ts.every((_, i) => tarefas[m.id + ':' + i]) }).length
  const total = db.montanhas.length
  return (
    <Shell titulo="Montanha Profética" editar="montanhas">
      <Faixa src="/img/montanha.webp" titulo="Montanha Profética" frase="Uma etapa de cada vez, até o cume." vida="neblina" video="montanha">
        <div className="altitude" role="img" aria-label={`Altitude: ${conquistadas} de ${total} etapas conquistadas`}>
          <span>Altitude · {conquistadas} de {total} etapas</span>
          <div className="altitude-barra"><i style={{ width: (total ? (conquistadas / total) * 100 : 0) + '%' }} /></div>
        </div>
        <Aviso>Você sobe uma etapa de cada vez. Ao concluir as tarefas de uma etapa, a próxima se abre. As tarefas abaixo são um rascunho para revisão do Pastor Marcos.</Aviso>
      </Faixa>
      <div className="lista">
        {db.montanhas.map((m, n) => {
          const ts = linhas(m.tarefas)
          const feitas = ts.filter((_, i) => tarefas[m.id + ':' + i]).length
          const aberto = liberado || sessao.admin
          const completo = ts.length > 0 && feitas === ts.length
          liberado = liberado && completo
          return (
            <article key={m.id} className={'cartao monte' + (aberto ? '' : ' trancado')}>
              <Paisagem className="miniatura" portal={completo} />
              <div>
                <h3>{n + 1}. {m.titulo} {completo && <Selo tipo="ouro">CONQUISTADO</Selo>}{!aberto && <Selo>BLOQUEADO</Selo>}</h3>
                <p className="mudo">{m.ref} · {m.descricao}</p>
                {aberto ? ts.map((t, i) => (
                  <label key={i} className="check"><input type="checkbox" checked={!!tarefas[m.id + ':' + i]} onChange={() => marcarTarefa(m.id + ':' + i)} /> {t} <small className="mudo">+10 XP</small></label>
                )) : <p>Conclua a etapa anterior para abrir esta.</p>}
              </div>
            </article>
          )
        })}
      </div>
    </Shell>
  )
}

// A ascensão do profeta: sete passos, mais João Batista e Jesus. Não é uma escada que o homem sobe para chegar a Deus; o chamado é de Deus.
// Cada cartão abre o seu estudo (ascensao_estudos.js, na mesma ordem).
const ASCENSAO = [
  ['Nasce', 'Antes de nascer, Deus já conhecia e separava o seu servo.', 'Jeremias 1:5; Lucas 1:15'],
  ['Cresce na presença de Deus', 'Cresce em estatura e em graça diante de Deus e dos homens.', '1 Samuel 2:26; Lucas 2:40, 52'],
  ['Estuda a Bíblia', 'Dedica o coração a buscar, praticar e ensinar a Lei do Senhor.', 'Esdras 7:10; 2 Timóteo 3:15-17; Atos 17:11'],
  ['Ora', 'Aprende a falar com Deus e a ficar diante dele.', 'Daniel 6:10; 9:2-3; Lucas 6:12'],
  ['Obedece', 'Obedecer é melhor do que sacrificar.', '1 Samuel 15:22; Tiago 1:22; João 14:15'],
  ['É chamado por Deus', 'Deus chama pelo nome, e o chamado é dele.', 'Êxodo 3:4; 1 Samuel 3:10; Isaías 6:8; Romanos 11:29'],
  ['Transmite a mensagem do Senhor', 'Fala o que recebeu de Deus, e a igreja examina tudo à luz da Palavra.', 'Jeremias 1:7; Ezequiel 3:4; 2 Pedro 1:21'],
  ['João Batista, o maior entre os nascidos de mulher', 'Jesus disse que, entre os nascidos de mulher, não surgiu ninguém maior do que João, o que preparou o caminho do Senhor.', 'Mateus 11:11; Lucas 7:28; Mateus 11:14'],
  ['Jesus, o Senhor de tudo', 'Todos os profetas apontam para ele. Ele não subiu até Deus: desceu, venceu e foi exaltado acima de todo nome.', 'Atos 10:36; Filipenses 2:9-11; Colossenses 1:16-17; Apocalipse 19:16'],
]

function Ascensao() {
  return (
    <section className="ascensao" id="ascensao">
      <h2 className="oq-titulo">A ascensão do profeta</h2>
      <p className="mudo">Sete passos que a Bíblia mostra na vida dos servos de Deus, e dois que os completam: João Batista, o maior entre os nascidos de mulher, e Jesus, o Senhor de tudo. Não é uma escada que o homem sobe para alcançar a Deus: o chamado é de Deus, e os dons e o chamamento de Deus são irrevogáveis (Romanos 11:29). Toque em cada cartão para abrir o estudo.</p>
      <ol className="asc-grade">
        {ASCENSAO.map(([t, d, r], k) => {
          const rota = '/estudos-profeticos/ascensao/' + ASCENSAO_ESTUDOS[k].id
          return (
            <li key={t} className={'asc-passo' + (k > 6 ? ' asc-destaque' : '')}>
              <ImgViva arquivo={'asc-' + (k + 1)} alt={'Passo ' + (k + 1) + ': ' + t} lado="cheia" fx="nevoa" to={rota} titulo={t} onFalha={() => {}} />
              <span className="asc-n">{k + 1}</span>
              <h3><Link className="asc-liga" to={rota}>{t}</Link></h3>
              <p>{d}</p>
              <p className="ref">{r}</p>
              <p className="asc-ler" aria-hidden="true">Abrir o estudo →</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const textoParaFala = (t) => limpaMarca(t).replace(/\{\{!?[^}]*\}\}\s*/g, '').replace(/^•\s*/gm, '').replace(/\s*\n+\s*/g, '. ').replace(/\.\s*\./g, '.')

function AscensaoEstudo() {
  const { id } = useParams()
  const voz = useVoz()
  const k = ASCENSAO_ESTUDOS.findIndex((x) => x.id === id)
  const e = ASCENSAO_ESTUDOS[k]
  if (!e) return <Shell titulo="Estudo"><p>Estudo não encontrado.</p><Link className="btn" to="/estudos-profeticos">Ver os estudos</Link></Shell>
  const ant = ASCENSAO_ESTUDOS[k - 1], prox = ASCENSAO_ESTUDOS[k + 1]
  return (
    <Shell titulo="Estudos Proféticos">
      <article className="reportagem-pagina estudo">
        <Selo tipo="ouro">{'Ascensão do profeta · passo ' + e.n + ' de ' + ASCENSAO_ESTUDOS.length}</Selo><Selo>INTERPRETAÇÃO TEOLÓGICA</Selo>
        <h2 className="reportagem-titulo">{e.titulo}</h2>
        <p className="reportagem-resumo">{e.resumo}</p>
        <p className="lp-liga"><BotaoOuvir voz={voz} id={'asc:' + e.id} texto={e.titulo + '. ' + textoParaFala(e.texto)} rotulo="Ouvir este estudo" /></p>
        <PainelBiblia refs={parseRefs(e.ref)} titulo="Bíblia Avivar" dica="As passagens deste estudo. Toque em uma para ler o texto aqui." />
        <ImgViva arquivo={'asc-' + e.n} alt={'Ilustração do passo ' + e.n + ': ' + e.titulo} lado="cheia" fx="nevoa" onFalha={() => {}} />
        <TextoLongo texto={limpaMarca(e.texto)} />
        <p className="ref"><b>Referências:</b> {e.ref}</p>
        <p className="mudo oq-nota">Este estudo reúne texto bíblico, história e interpretação, cada parte com a sua etiqueta. A revelação vem somente de Deus, pelo Espírito Santo, e tudo se examina pela Bíblia. Não substitui o estudo direto das Escrituras nem o acompanhamento pastoral.</p>
        <div className="botoes">
          {ant && <Link className="btn" to={'/estudos-profeticos/ascensao/' + ant.id}>← {ant.titulo}</Link>}
          <Link className="btn" to="/estudos-profeticos">Todos os estudos</Link>
          {prox && <Link className="btn" to={'/estudos-profeticos/ascensao/' + prox.id}>{prox.titulo} →</Link>}
        </div>
      </article>
    </Shell>
  )
}

function Estudos() {
  const { db, sessao } = useLoja()
  const [mod, setMod] = useState('')
  const admin = !!(sessao && sessao.admin)
  const todos = (db.estudosProf || []).filter((e) => admin || !e.rascunho)
  const lista = mod ? todos.filter((e) => e.modalidade === mod) : todos
  return (
    <Shell titulo="Estudos Proféticos" editar="estudosProf">
      <p className="mudo">Estudos sobre a vida dos profetas da Bíblia, do chamado ao fim do ministério. Cada estudo traz o texto bíblico, a etiqueta da sua natureza e as referências.</p>
      <Suspense fallback={null}><LvEntrada sessao={sessao} /></Suspense>
      <EstanteLivros />
      <div className="jor-topo ref-topo est-topo">
        <ImgViva arquivo="estudos-profeticos" alt="Um rolo antigo aberto sobre uma mesa de pedra, iluminado por uma lamparina, com uma colina ao amanhecer ao fundo" lado="cheia" fx="brilho" legenda="Do chamado ao fim do ministério, sempre à luz da Palavra." />
        <ApresentaVideo nome="apresenta-estudos-profeticos-v2" titulo="Estudos Proféticos" texto="Estudos sobre a vida dos profetas da Bíblia, do chamado ao fim do ministério, com o texto bíblico, a etiqueta de cada natureza e as referências." ajuda="O vídeo de apresentação abre aqui sozinho assim que o arquivo apresenta-estudos-profeticos.mp4 estiver na pasta public/img." />
      </div>
      <Ascensao />
      <section>
        <h2 className="oq-titulo">Modalidades de estudo</h2>
        <Organograma
          chave="estudos"
          titulo="Modalidades dos Estudos Proféticos"
          rotulo="Toque em uma modalidade para ver os estudos dela. Toque no centro para ouvir a Palavra."
          nos={db.estudos.map((m) => {
            const o = ORG_ESTUDOS[m.id]
            const n = todos.filter((e) => e.modalidade === m.titulo).length
            return { id: m.id, titulos: [m.titulo, ...(o ? o.titulos.filter((t) => t !== m.titulo) : [])], titulo: m.titulo, desc: m.descricao, verso: o ? o.verso : ORG_VERSO_PADRAO, extra: n + (n === 1 ? ' estudo' : ' estudos'), on: mod === m.titulo, onAbrir: () => { setMod(mod === m.titulo ? '' : m.titulo); rolarAte('est-lista') } }
          })}
        />
      </section>
      <section id="est-lista">
        <h2 className="oq-titulo">{mod ? mod : 'Todos os estudos'}</h2>
        {mod && <div className="botoes"><button className="btn" onClick={() => setMod('')}>Ver todos</button></div>}
        {lista.length === 0 && <Aviso>Nenhum estudo nesta modalidade ainda.</Aviso>}
        <GradeTres className="grade" tema="estudosProf">
          {lista.map((e, i) => (
            <article key={e.id} className="cartao curso estudo-cartao">
              <ImgViva arquivo={e.imagem || 'estudo-' + e.id} alt={'Ilustração do estudo ' + e.titulo} lado="cheia" fx={['nevoa', 'brilho', 'tremula'][i % 3]} to={'/estudos-profeticos/' + e.id} onFalha={() => {}} />
              <Selo tipo="ouro">{e.modalidade}</Selo>{e.rascunho && <Selo>RASCUNHO</Selo>}{!e.texto && <Selo>EM PREPARAÇÃO</Selo>}
              <h3><Link to={'/estudos-profeticos/' + e.id}>{e.titulo}</Link></h3>
              <p>{e.resumo}</p>
              <Link className="btn ouro" to={'/estudos-profeticos/' + e.id}>ACESSAR CONTEÚDO</Link>
            </article>
          ))}
        </GradeTres>
      </section>
    </Shell>
  )
}

function EstudoLeitura() {
  const { id } = useParams()
  const { db, sessao } = useLoja()
  const admin = !!(sessao && sessao.admin)
  const todos = (db.estudosProf || []).filter((e) => admin || !e.rascunho)
  const k = todos.findIndex((x) => x.id === id)
  const e = todos[k]
  if (!e) return <Shell titulo="Estudo"><p>Estudo não encontrado.</p><Link className="btn" to="/estudos-profeticos">Ver os estudos</Link></Shell>
  const ant = todos[k - 1], prox = todos[k + 1]
  return (
    <Shell titulo="Estudos Proféticos" editar="estudosProf">
      <article className="reportagem-pagina estudo">
        <Selo tipo="ouro">{e.modalidade}</Selo>{e.etiqueta && <Selo>{e.etiqueta}</Selo>}{e.rascunho && <Selo>RASCUNHO</Selo>}
        <h2 className="reportagem-titulo">{e.titulo}</h2>
        {e.resumo && <p className="reportagem-resumo">{e.resumo}</p>}
        <PainelBiblia refs={parseRefs(e.ref)} titulo="Bíblia Avivar" dica="As passagens deste estudo. Toque em uma para ler o texto aqui." />
        <ImgViva arquivo={e.imagem || 'estudo-' + e.id} alt={'Ilustração do estudo ' + e.titulo} lado="cheia" fx="nevoa" onFalha={() => {}} />
        {livroPorNome(e.titulo) && <p className="lp-liga"><Link className="btn pequeno" to={'/estudos-profeticos/livro/' + livroPorNome(e.titulo).id}>📖 Abrir o livro de {e.titulo} na estante</Link></p>}
        {e.texto
          ? <TextoLongo texto={e.texto} />
          : <Aviso>Este estudo está em preparação. Enquanto isso, leia as passagens bíblicas indicadas.</Aviso>}
        {e.ref && <p className="ref"><b>Referências:</b> {e.ref}</p>}
        <p className="mudo oq-nota">Este estudo reúne interpretação e reflexão à luz da fé. A revelação vem somente de Deus, pelo Espírito Santo, e tudo se examina pela Bíblia. Não substitui o estudo direto das Escrituras nem o acompanhamento pastoral.</p>
        <div className="botoes">
          {ant && <Link className="btn" to={'/estudos-profeticos/' + ant.id}>← {ant.titulo}</Link>}
          <Link className="btn" to="/estudos-profeticos">Todos os estudos</Link>
          {prox && <Link className="btn" to={'/estudos-profeticos/' + prox.id}>{prox.titulo} →</Link>}
        </div>
      </article>
    </Shell>
  )
}

/* ───────────── LIVROS DOS PROFETAS, MISTÉRIOS PROFÉTICOS E MESTRE AVIVAR ───────────── */

const CH_LP = 'ca-lp-prog'
const CH_VOZ = 'ca-lp-voz'
const CH_DUV = 'ca-duvidas-demo'
const URL_NVI = 'https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/nvi.json'
const URL_BIBLIA_AVIVAR = 'https://biblia-avivar.vercel.app'
const lerLP = () => { try { return JSON.parse(localStorage.getItem(CH_LP) || '{}') || {} } catch (e) { return {} } }
const gravarLP = (o) => { try { localStorage.setItem(CH_LP, JSON.stringify(o)) } catch (e) { /* sem armazenamento */ } }
const chaveOk = (l, m) => 'lp:ok:' + l + ':' + m
const livroPorNome = (nome) => LIVROS_PROFETAS.find((x) => x.id === slug(nome))
const sortearOrdem = (n) => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const falaRefs = (t) => String(t || '').replace(/(\d+):(\d+)-(\d+)/g, '$1, versículos $2 a $3').replace(/(\d+):(\d+)/g, '$1, versículo $2')
const limpaMarca = (t) => String(t || '').replace(/\u2063[0-9a-f]{14}[0-9a-z]{1,3}\u2063/g, '')
const paragrafos = (t) => limpaMarca(t).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)

// Progresso do aluno: o Mistério principal de cada livro abre o livro seguinte. O administrador vê todos abertos.
function useProgressoLP() {
  const { lidos, sessao } = useLoja()
  const admin = !!(sessao && sessao.admin)
  const ok = (l, m) => !!(lidos && lidos[chaveOk(l, m)])
  const resolvido = (l) => ok(l.id, l.misterios[0].id)
  const liberado = (i) => admin || i === 0 || resolvido(LIVROS_PROFETAS[i - 1])
  const totalOk = LIVROS_PROFETAS.reduce((s, l) => s + l.misterios.filter((m) => ok(l.id, m.id)).length, 0)
  const totalLib = LIVROS_PROFETAS.filter((_, i) => liberado(i)).length
  return { ok, resolvido, liberado, admin, totalOk, totalLib }
}

/* ── voz: ler em voz alta, ditar a dúvida e responder falando ── */
function useVoz() {
  const temFala = falaDisponivel()
  const [falando, setFalando] = useState('')
  const [ligada, setLigadaS] = useState(() => { try { return localStorage.getItem(CH_VOZ) === '1' } catch (e) { return false } })
  const atual = useRef('')
  const parar = () => { atual.current = ''; setFalando(''); try { window.speechSynthesis.cancel() } catch (e) { /* sem voz */ } }
  useEffect(() => () => { try { window.speechSynthesis.cancel() } catch (e) { /* sem voz */ } }, [])
  const setLigada = (v) => { setLigadaS(v); try { localStorage.setItem(CH_VOZ, v ? '1' : '0') } catch (e) { /* sem armazenamento */ } if (!v) parar() }
  const falar = (id, texto) => {
    if (!temFala || !texto) return
    if (atual.current === id) { parar(); return }
    try { window.speechSynthesis.cancel() } catch (e) { /* sem voz */ }
    atual.current = id; setFalando(id)
    const partes = falaRefs(texto).replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]*\s*/g) || [String(texto)]
    const blocos = []
    let b = ''
    partes.forEach((p) => { if (b && (b + p).length > 190) { blocos.push(b); b = p } else b += p })
    if (b) blocos.push(b)
    let voz = null
    try { voz = escolherVoz('f', window.speechSynthesis.getVoices() || []).voz } catch (e) { voz = null }
    blocos.forEach((t, i) => {
      const u = new window.SpeechSynthesisUtterance(t)
      u.lang = 'pt-BR'; u.rate = 0.9
      if (voz) u.voice = voz
      if (i === blocos.length - 1) { u.onend = () => { if (atual.current === id) { atual.current = ''; setFalando('') } }; u.onerror = u.onend }
      try { window.speechSynthesis.speak(u) } catch (e) { /* sem voz */ }
    })
  }
  return { temFala, falando, falar, parar, ligada, setLigada }
}

function BotaoOuvir({ voz, id, texto, rotulo = 'Ouvir' }) {
  if (!voz.temFala) return null
  const on = voz.falando === id
  return <button type="button" className={'btn pequeno lp-ouvir' + (on ? ' on' : '')} aria-pressed={on} onClick={() => voz.falar(id, texto)}>{on ? '⏹ Parar' : '🔊 ' + rotulo}</button>
}

function useReconhecimento(aoTexto) {
  const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
  const [ouvindo, setOuvindo] = useState(false)
  const rec = useRef(null)
  const cb = useRef(aoTexto)
  cb.current = aoTexto
  useEffect(() => () => { try { if (rec.current) rec.current.abort() } catch (e) { /* sem voz */ } }, [])
  const alternar = () => {
    if (!SR) return
    if (ouvindo) { try { rec.current.stop() } catch (e) { /* sem voz */ } return }
    const r = new SR()
    r.lang = 'pt-BR'; r.interimResults = false; r.maxAlternatives = 1
    r.onresult = (e) => { const t = e.results && e.results[0] && e.results[0][0] ? e.results[0][0].transcript : ''; if (t) cb.current(t) }
    r.onend = () => setOuvindo(false)
    r.onerror = () => setOuvindo(false)
    rec.current = r
    setOuvindo(true)
    try { r.start() } catch (e) { setOuvindo(false) }
  }
  return { suporta: !!SR, ouvindo, alternar }
}

/* ── Bíblia Avivar: o texto bíblico ao lado de cada estudo ── */
let _nvi = null
const carregarNVI = () => {
  if (!_nvi) _nvi = fetch(URL_NVI).then((r) => { if (!r.ok) throw new Error('falha'); return r.json() }).catch((e) => { _nvi = null; throw e })
  return _nvi
}
const normNome = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
const INDICE_LIVRO = (() => { const m = {}; NOMES_BIBLIA.forEach((n, i) => { m[normNome(n)] = i }); m.salmo = m.salmos; m['cantares de salomao'] = m.cantares; return m })()
const rotuloRef = (r) => NOMES_BIBLIA[r[0]] + ' ' + r[1] + (r[2] ? ':' + r[2] + (r[3] > r[2] ? '-' + r[3] : '') : '')

// "1 Samuel 3:1-21; 7:5-9; Salmos 16:10" → [[8, 3, 1, 21], [8, 7, 5, 9], [18, 16, 10, 10]]
function parseRefs(txt) {
  const out = []
  let atual = null
  String(txt || '').split(/;|\n/).forEach((p) => {
    const s = p.trim().replace(/\.$/, '')
    if (!s) return
    const m = s.match(/^((?:[1-3]\s)?[A-Za-zÀ-ÿ]+(?:\s[A-Za-zÀ-ÿ]+)*)\s+(\d.*)$/)
    let resto = s
    if (m && INDICE_LIVRO[normNome(m[1])] !== undefined) { atual = INDICE_LIVRO[normNome(m[1])]; resto = m[2] }
    else if (atual === null) return
    const r = resto.match(/^(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?/)
    if (!r) return
    const ref = [atual, +r[1], r[2] ? +r[2] : 0, r[3] ? +r[3] : (r[2] ? +r[2] : 0)]
    if (!out.some((x) => x.join() === ref.join())) out.push(ref)
  })
  return out
}
// Referências entre parênteses dentro de um texto: "(Gênesis 2:15; Êxodo 3)".
function refsDoTexto(txt) {
  const todas = []
  const re = /\(([^)]*\d[^)]*)\)/g
  let m
  while ((m = re.exec(String(txt || '')))) parseRefs(m[1]).forEach((r) => { if (!todas.some((x) => x.join() === r.join())) todas.push(r) })
  return todas
}
const refsDeLista = (l) => (l || []).map(([n, c, a, b]) => [INDICE_LIVRO[normNome(n)], c, a || 0, b || a || 0]).filter((r) => r[0] !== undefined)

function PainelBiblia({ refs, titulo = 'Bíblia Avivar', dica }) {
  const lista = (refs || []).slice(0, 8)
  const [sel, setSel] = useState(-1)
  const [estado, setEstado] = useState('ocioso')
  const [versos, setVersos] = useState([])
  const [todo, setTodo] = useState(false)
  const voz = useVoz()
  useEffect(() => {
    if (sel < 0 || !lista[sel]) return undefined
    let vivo = true
    setEstado('carregando'); setTodo(false)
    carregarNVI().then((d) => {
      if (!vivo) return
      const [li, cap] = lista[sel]
      const v = d && d[li] && d[li].chapters && d[li].chapters[cap - 1]
      if (!v) { setEstado('erro'); return }
      setVersos(v); setEstado('ok')
    }).catch(() => { if (vivo) setEstado('erro') })
    return () => { vivo = false }
  }, [sel, lista.map((r) => r.join('.')).join('|')])
  const r = sel >= 0 ? lista[sel] : null
  const [, cap, v1, v2] = r || [0, 0, 0, 0]
  const faixa = r && v1 && !todo ? versos.map((t, i) => [i + 1, t]).filter(([n]) => n >= Math.max(1, v1 - 1) && n <= v2 + 1) : versos.map((t, i) => [i + 1, t])
  const textoFala = r && estado === 'ok' ? rotuloRef(r) + '. ' + faixa.filter(([n]) => !v1 || todo || (n >= v1 && n <= v2)).map(([, t]) => t).join(' ') : ''
  return (
    <aside className="lp-biblia" aria-label="Bíblia Avivar" data-livre>
      <header>
        <b>📖 {titulo}</b>
        <a className="lp-biblia-link" href={URL_BIBLIA_AVIVAR} target="_blank" rel="noopener noreferrer">Abrir a Bíblia Avivar ↗</a>
      </header>
      {lista.length > 0
        ? <p className="mudo lp-biblia-dica">{dica || 'Toque em uma passagem para ler o texto aqui, ao lado do estudo.'}</p>
        : <p className="mudo lp-biblia-dica">Abra a Bíblia Avivar e leia a passagem indicada neste estudo.</p>}
      <div className="lp-biblia-chips" role="group" aria-label="Passagens deste estudo">
        {lista.map((x, i) => <button key={x.join('.')} type="button" className={'lp-chip' + (sel === i ? ' on' : '')} aria-pressed={sel === i} onClick={() => setSel(sel === i ? -1 : i)}>{rotuloRef(x)}</button>)}
      </div>
      {r && (
        <div className="lp-biblia-texto" role="region" aria-live="polite" aria-label={'Texto de ' + rotuloRef(r)}>
          {estado === 'carregando' && <p className="mudo">Carregando o texto…</p>}
          {estado === 'erro' && <p className="mudo">Não foi possível carregar o texto agora. <a href={URL_BIBLIA_AVIVAR} target="_blank" rel="noopener noreferrer">Abra a Bíblia Avivar</a> e leia {rotuloRef(r)}.</p>}
          {estado === 'ok' && (
            <>
              <h4>{NOMES_BIBLIA[r[0]]} {cap}</h4>
              {faixa.map(([n, t]) => <p key={n} className={'lp-verso' + (v1 && n >= v1 && n <= v2 ? ' marca' : '')}><sup>{n}</sup> {t}</p>)}
              <div className="botoes">
                {v1 > 0 && <button type="button" className="btn pequeno" onClick={() => setTodo(!todo)}>{todo ? 'Mostrar só a passagem' : 'Ver o capítulo todo'}</button>}
                <BotaoOuvir voz={voz} id="biblia" texto={textoFala} rotulo="Ouvir o texto" />
              </div>
              <small className="mudo">Nova Versão Internacional, a mesma fonte da Bíblia Avivar.</small>
            </>
          )}
        </div>
      )}
    </aside>
  )
}

/* ── A estante: cada livro abre como um livro ao passar o mouse ou tocar ── */
function LivroCapa({ l, i, estado, aberto, aoAlternar, anterior }) {
  const [semImg, setSemImg] = useState(false)
  const trancado = estado === 'trancado'
  return (
    <li className={'lp-livro ' + estado + (aberto ? ' aberto' : '')} data-livre>
      <div className="lp-corpo">
        <div className="lp-miolo">
          <b className="lp-m-nome">{l.nome}</b>
          <small className="lp-m-frase">{l.frase}</small>
          {trancado
            ? <p className="lp-m-msg">🔒 Revele antes o Mistério <b>{anterior.misterios[0].nome}</b>, no livro de {anterior.nome}.</p>
            : <p className="lp-m-msg">Mistério: <b>{l.misterios[0].nome}</b>{estado === 'resolvido' ? ' ✓' : ''}</p>}
          <ol className="lp-m-ciclo" aria-label={'Ciclo de vida de ' + l.nome}>{l.ciclo.map((c) => <li key={c.e}><span>{c.e}</span></li>)}</ol>
          {trancado
            ? <Link className="btn pequeno" to={'/estudos-profeticos/livro/' + anterior.id}>Ir ao livro de {anterior.nome}</Link>
            : <Link className="btn ouro pequeno" to={'/estudos-profeticos/livro/' + l.id}>Abrir o livro</Link>}
        </div>
        <button type="button" className="lp-capa" aria-expanded={aberto} aria-label={'Livro de ' + l.nome + (trancado ? ' (trancado)' : estado === 'resolvido' ? ' (mistério revelado)' : '') + ': ver o que há dentro'} onClick={aoAlternar}>
          {!semImg && <img src={'/img/' + l.capa + '.webp'} alt="" loading="lazy" onError={() => setSemImg(true)} />}
          <span className="lp-capa-fita"><i>{String(i + 1).padStart(2, '0')}</i><b>{l.nome}</b></span>
          {trancado && <span className="lp-cadeado" aria-hidden="true">🔒</span>}
          {estado === 'resolvido' && <span className="lp-selo-ok" aria-hidden="true">✓</span>}
        </button>
      </div>
    </li>
  )
}

function EstanteLivros() {
  const prog = useProgressoLP()
  const voz = useVoz()
  const [aberto, setAberto] = useState('')
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') setAberto('') }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  const pct = Math.round((prog.totalLib / LIVROS_PROFETAS.length) * 100)
  const instrucao = 'Estante dos livros dos profetas. Passe o mouse sobre um livro, ou toque nele, para abri-lo. Dentro dele estão a vida do profeta, a cultura, a alimentação, o comportamento e um estudo. Cada livro só abre depois que você revela o Mistério Profético do livro anterior. Se errar três vezes, o aplicativo leva você ao estudo que tem a resposta. Se ainda assim não conseguir, você pode perguntar ao Mestre Avivar.'
  return (
    <section className="lp-estante" aria-labelledby="lp-titulo">
      <h2 className="oq-titulo" id="lp-titulo">Os livros dos profetas</h2>
      <p className="mudo">Passe o mouse em um livro (ou toque nele) para abri-lo. Cada livro só abre depois que você revela o <b>Mistério Profético</b> do anterior.</p>
      <div className="lp-barra" data-livre>
        <div className="lp-prog" role="progressbar" aria-valuemin={0} aria-valuemax={LIVROS_PROFETAS.length} aria-valuenow={prog.totalLib} aria-label="Livros liberados"><i style={{ width: pct + '%' }} /></div>
        <span><b>{prog.totalLib}</b> de {LIVROS_PROFETAS.length} livros abertos · <b>{prog.totalOk}</b> Mistérios revelados</span>
        <BotaoOuvir voz={voz} id="estante" texto={instrucao} rotulo="Ouvir as instruções" />
        <Link className="btn pequeno" to="/jornada-das-estacoes">🗺 Jornada das Estações</Link>
        <Link className="btn pequeno" to="/mestre-avivar">Mestre Avivar</Link>
      </div>
      <ol className="lp-prateleira">
        {LIVROS_PROFETAS.map((l, i) => {
          const lib = prog.liberado(i)
          const estado = !lib ? 'trancado' : prog.resolvido(l) ? 'resolvido' : 'livre'
          return <LivroCapa key={l.id} l={l} i={i} estado={estado} aberto={aberto === l.id} anterior={i ? LIVROS_PROFETAS[i - 1] : null} aoAlternar={() => setAberto(aberto === l.id ? '' : l.id)} />
        })}
      </ol>
    </section>
  )
}

/* ── O Mistério Profético: pergunta com triangulação de profetas ── */
function MisterioJogo({ livro, m, indice, voz, prog, marcarLido, aoIrEstudo }) {
  const resolvido = prog.ok(livro.id, m.id)
  const chave = livro.id + ':' + m.id
  const [reg, setReg] = useState(() => { const r = lerLP()[chave]; return r && Array.isArray(r.e) ? r : { e: [], r: 0 } })
  const [ordem, setOrdem] = useState(() => sortearOrdem(m.o.length))
  const [fb, setFb] = useState(null)
  const salvar = (r) => { setReg(r); const t = lerLP(); t[chave] = r; gravarLP(t) }
  const pergunta = m.p + ' ' + ordem.map((k, n) => 'Opção ' + (n + 1) + ': ' + m.o[k].t).join('. ')
  const aviso = (tipo, texto, fala) => { setFb({ tipo, texto }); if (voz.ligada) voz.falar('fb-' + chave, fala || texto) }
  const responder = (k) => {
    if (resolvido || reg.e.includes(k) || reg.e.length >= 3) return
    const o = m.o[k]
    if (k === m.c) {
      somSelo(); marcarLido(chaveOk(livro.id, m.id))
      aviso('ok', 'Mistério revelado! Muito bem.', 'Mistério revelado! Muito bem. ' + m.exp)
      return
    }
    somQueda()
    const novo = { ...reg, e: [...reg.e, k] }
    salvar(novo)
    const resto = 3 - novo.e.length
    aviso('erro', 'Ainda não. Essa alternativa é de ' + o.de + ' (' + o.r + '). ' + (novo.e.length === 2 && m.dica ? 'Dica: ' + m.dica + ' ' : '') + (resto > 0 ? 'Você ainda pode tentar ' + (resto === 1 ? 'mais uma vez.' : resto + ' vezes.') : ''))
    setOrdem(sortearOrdem(m.o.length))
  }
  const por = useReconhecimento((t) => {
    const x = normNome(t)
    const mapa = [[/\b(1|um|uma|primeir[ao])\b/, 0], [/\b(2|dois|duas|segund[ao])\b/, 1], [/\b(3|tres|terceir[ao])\b/, 2], [/\b(4|quatro|quart[ao])\b/, 3]]
    const hit = mapa.find(([re]) => re.test(x))
    if (hit && ordem[hit[1]] !== undefined) responder(ordem[hit[1]])
    else aviso('erro', 'Não entendi. Diga: opção um, dois, três ou quatro.')
  })
  const bloqueado = !resolvido && reg.e.length >= 3
  const irAoEstudo = () => { salvar({ e: [], r: reg.r + 1 }); setOrdem(sortearOrdem(m.o.length)); setFb(null); aoIrEstudo(m.secao, m) }
  const tentarDeNovo = () => { salvar({ e: [], r: reg.r + 1 }); setOrdem(sortearOrdem(m.o.length)); setFb(null) }
  const secaoTitulo = m.secao === 'ficha' ? 'Quem foi' : m.secao === 'ciclo' ? 'Ciclo de vida' : (livro.secoes.find((s) => s.id === m.secao) || {}).t
  return (
    <article className={'lp-misterio' + (resolvido ? ' revelado' : '')} aria-labelledby={'mis-' + chave}>
      <header>
        <Selo tipo="ouro">{indice === 0 ? 'ABRE O PRÓXIMO LIVRO' : 'MISTÉRIO EXTRA'}</Selo>
        {resolvido && <Selo>REVELADO</Selo>}
        <h3 id={'mis-' + chave}>{m.nome}</h3>
        <p className="mudo lp-ref">{m.ref}</p>
      </header>
      <p className="lp-pergunta">{m.p}</p>
      <div className="botoes lp-voz-botoes">
        <BotaoOuvir voz={voz} id={'p-' + chave} texto={m.nome + '. ' + pergunta} rotulo="Ouvir a pergunta e as opções" />
        {por.suporta && !resolvido && !bloqueado && <button type="button" className={'btn pequeno' + (por.ouvindo ? ' on' : '')} aria-pressed={por.ouvindo} onClick={por.alternar}>{por.ouvindo ? '🎤 Ouvindo… toque para parar' : '🎤 Responder falando'}</button>}
      </div>
      <ol className="lp-opcoes">
        {ordem.map((k, n) => {
          const o = m.o[k]
          const errada = reg.e.includes(k)
          const certa = resolvido && k === m.c
          return (
            <li key={k}>
              <button type="button" className={'lp-opcao' + (errada ? ' errada' : '') + (certa ? ' certa' : '')} disabled={resolvido || errada || bloqueado} aria-label={'Opção ' + (n + 1) + ': ' + o.t + (errada ? '. Errada: é de ' + o.de : '') + (certa ? '. Resposta certa' : '')} onClick={() => responder(k)}>
                <i aria-hidden="true">{n + 1}</i>
                <span>{o.t}{(errada || resolvido) && <small>{certa ? '✓ Livro de ' + o.de + ' · ' : 'É de ' + o.de + ' · '}{o.r}</small>}</span>
              </button>
            </li>
          )
        })}
      </ol>
      <p className="lp-tentativas" aria-live="polite">{resolvido ? '' : 'Erros: ' + reg.e.length + ' de 3'}</p>
      {fb && <p className={'lp-fb ' + fb.tipo} role="status" aria-live="assertive">{fb.texto}</p>}
      {resolvido && (
        <div className="lp-revelado">
          <p>{m.exp}</p>
          <p className="mudo">Triangulação: {Array.from(new Set(m.o.map((x) => x.de))).map((nome, j) => { const lv = livroPorNome(nome); const idx = lv ? LIVROS_PROFETAS.indexOf(lv) : -1; return <span key={nome}>{j ? ' · ' : ''}{lv && prog.liberado(idx) ? <Link to={'/estudos-profeticos/livro/' + lv.id}>{nome}</Link> : nome}</span> })}</p>
        </div>
      )}
      {bloqueado && (
        <div className="lp-ajuda" role="alert">
          {reg.r === 0
            ? (
              <>
                <b>Você errou três vezes.</b>
                <p>A resposta está no estudo: página <b>{secaoTitulo}</b>, no livro de {livro.nome}. Leia com calma e volte ao Mistério.</p>
                <button type="button" className="btn ouro" onClick={irAoEstudo}>Ir ao estudo que tem a resposta</button>
              </>
            )
            : (
              <>
                <b>Ainda não foi desta vez.</b>
                <p>Você já releu o estudo. Se a dúvida continua, pergunte ao Mestre Avivar: ele responde sempre com a Bíblia.</p>
                <div className="botoes">
                  <Link className="btn ouro" to={'/mestre-avivar?livro=' + livro.id + '&misterio=' + m.id} onClick={tentarDeNovo}>Falar com o Mestre Avivar</Link>
                  <button type="button" className="btn" onClick={tentarDeNovo}>Tentar de novo</button>
                  <button type="button" className="btn" onClick={irAoEstudo}>Reler o estudo</button>
                </div>
              </>
            )}
        </div>
      )}
    </article>
  )
}

/* ── O livro aberto: uma página por vez ── */
function LivroProfeta() {
  const { id } = useParams()
  const [busca] = useSearchParams()
  const { marcarLido } = useLoja()
  const prog = useProgressoLP()
  const voz = useVoz()
  const idx = LIVROS_PROFETAS.findIndex((x) => x.id === id)
  const l = LIVROS_PROFETAS[idx]
  const [pag, setPag] = useState(0)
  const [destaque, setDestaque] = useState('')
  const [semImg, setSemImg] = useState(false)
  const topo = useRef(null)
  const paginas = l ? [{ id: 'ficha', t: 'Quem foi' }, { id: 'ciclo', t: 'Ciclo de vida' }, ...l.secoes.map((s) => ({ id: s.id, t: s.t })), { id: 'misterio', t: 'Mistério Profético' }] : []
  useEffect(() => {
    const p = paginas.findIndex((x) => x.id === busca.get('pagina'))
    setPag(p >= 0 ? p : 0); setDestaque(''); voz.parar()
  }, [id])
  useEffect(() => { if (l && prog.liberado(idx)) marcarLido('lp:ab:' + l.id) }, [id])
  if (!l) return <Shell titulo="Estudos Proféticos"><p>Livro não encontrado.</p><Link className="btn" to="/estudos-profeticos">Ver a estante</Link></Shell>
  if (!prog.liberado(idx)) {
    const ant = LIVROS_PROFETAS[idx - 1]
    return (
      <Shell titulo="Estudos Proféticos">
        <div className="cartao bloqueio lp-trancado">
          <span className="trava-icone" aria-hidden="true">🔒</span>
          <h2>O livro de {l.nome} ainda está fechado</h2>
          <p>Para abrir este livro, revele o Mistério Profético <b>{ant.misterios[0].nome}</b>, no livro de {ant.nome}.</p>
          <div className="botoes centro"><Link className="btn ouro" to={'/estudos-profeticos/livro/' + ant.id + '?pagina=misterio'}>Ir ao Mistério</Link><Link className="btn" to="/estudos-profeticos">Voltar à estante</Link></div>
        </div>
      </Shell>
    )
  }
  const prox = LIVROS_PROFETAS[idx + 1]
  const ultima = paginas.length - 1
  const ir = (n) => { setPag(Math.max(0, Math.min(ultima, n))); voz.parar(); if (topo.current) topo.current.scrollIntoView({ behavior: parouMovimento() ? 'auto' : 'smooth', block: 'start' }) }
  const p = paginas[pag]
  const sec = l.secoes.find((s) => s.id === p.id)
  const irEstudo = (secao) => { const n = paginas.findIndex((x) => x.id === secao); setDestaque(secao); ir(n >= 0 ? n : 0) }
  const textoPagina = () => {
    if (p.id === 'ficha') return l.nome + '. ' + l.frase + '. ' + l.ficha.map(([a, b]) => a + ': ' + b).join('. ')
    if (p.id === 'ciclo') return 'Ciclo de vida de ' + l.nome + '. ' + l.ciclo.map((c, n) => 'Etapa ' + (n + 1) + ', ' + c.e + '. ' + c.t + ' ' + c.r + '.').join(' ')
    if (sec) return sec.t + '. ' + limpaMarca(sec.x)
    return ''
  }
  const refsPagina = p.id === 'ficha' ? refsDeLista(l.biblia) : p.id === 'ciclo' ? parseRefs(l.ciclo.map((c) => c.r).join('; ')) : sec ? refsDoTexto(sec.x) : []
  const resolvidoUm = prog.resolvido(l)
  const dest = destaque && destaque === p.id
  return (
    <Shell titulo="Estudos Proféticos">
      <div ref={topo} className="lp-livro-aberto">
        <header className="lp-cabeca">
          {!semImg && <img className="lp-mini" src={'/img/' + l.capa + '.webp'} alt={'Capa do livro de ' + l.nome} onError={() => setSemImg(true)} />}
          <div>
            <Selo tipo="ouro">LIVRO {String(idx + 1).padStart(2, '0')} DE {LIVROS_PROFETAS.length}</Selo>{resolvidoUm && <Selo>MISTÉRIO REVELADO</Selo>}
            <h2>{l.nome}</h2>
            <p className="mudo">{l.frase}</p>
            <div className="botoes">
              <Link className="btn pequeno" to="/estudos-profeticos">← A estante</Link>
              <Link className="btn pequeno" to={'/jornada-das-estacoes/' + l.id}>🗺 A porta e o mapa</Link>
              {voz.temFala && <button type="button" className={'btn pequeno' + (voz.ligada ? ' on' : '')} aria-pressed={voz.ligada} onClick={() => voz.setLigada(!voz.ligada)}>{voz.ligada ? '🔊 Voz nas respostas: ligada' : '🔇 Voz nas respostas: desligada'}</button>}
              <Link className="btn pequeno" to="/mestre-avivar">Mestre Avivar</Link>
            </div>
          </div>
        </header>
        <nav className="lp-abas" aria-label="Páginas do livro">
          {paginas.map((x, n) => <button key={x.id} type="button" className={'lp-aba' + (n === pag ? ' on' : '') + (destaque === x.id ? ' pulsa' : '')} aria-current={n === pag ? 'page' : undefined} onClick={() => ir(n)}><i>{n + 1}</i><span>{x.t}</span></button>)}
        </nav>
        <article key={pag + ':' + id} className={'lp-pagina vira' + (dest ? ' destaque' : '')} aria-labelledby="lp-pag-titulo" aria-live="polite">
          {dest && (
            <p className="lp-achou" role="status">📍 A resposta do Mistério está nesta página. Leia com atenção e depois <button type="button" className="lp-link" onClick={() => ir(ultima)}>volte ao Mistério</button>.</p>
          )}
          <div className="lp-pag-topo">
            <h3 id="lp-pag-titulo">{p.id === 'misterio' ? 'Mistérios Proféticos' : p.t}</h3>
            {p.id !== 'misterio' && <BotaoOuvir voz={voz} id={'pag-' + p.id} texto={textoPagina()} rotulo="Ouvir esta página" />}
          </div>
          {p.id === 'ficha' && (
            <dl className="lp-ficha">
              {l.ficha.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}
            </dl>
          )}
          {p.id === 'ciclo' && (
            <ol className="lp-ciclo">
              {l.ciclo.map((c, n) => <li key={c.e} style={{ '--n': n }}><b>{c.e}</b><span>{c.t}</span><small>{c.r}</small></li>)}
            </ol>
          )}
          {sec && (
            <div className="lp-texto">
              <Selo>{sec.r}</Selo>
              {paragrafos(sec.x).map((t, n) => <p key={n}>{t}</p>)}
              {sec.id === 'mensagem' && (l.estudoId
                ? <Link className="btn pequeno" to={'/estudos-profeticos/' + l.estudoId}>Abrir o estudo completo</Link>
                : null)}
            </div>
          )}
          {p.id === 'misterio' && (
            <div className="lp-misterios">
              <p className="mudo">Escolha a alternativa certa. Cada pergunta traz fatos de outros profetas para você distinguir. Se errar três vezes, o aplicativo leva você ao estudo que tem a resposta.</p>
              {l.misterios.map((m, n) => <MisterioJogo key={m.id} livro={l} m={m} indice={n} voz={voz} prog={prog} marcarLido={marcarLido} aoIrEstudo={irEstudo} />)}
              {resolvidoUm && prox && (
                <div className="lp-proximo" role="status">
                  <b>O próximo livro está aberto.</b>
                  <Link className="btn ouro" to={'/estudos-profeticos/livro/' + prox.id}>Abrir o livro de {prox.nome}</Link>
                </div>
              )}
              {resolvidoUm && !prox && <div className="lp-proximo" role="status"><b>Você abriu todos os livros da estante.</b><Link className="btn ouro" to="/estudos-profeticos">Voltar à estante</Link></div>}
            </div>
          )}
          {p.id !== 'misterio' && <PainelBiblia refs={refsPagina} />}
        </article>
        <div className="lp-passar">
          <button type="button" className="btn" disabled={pag === 0} onClick={() => ir(pag - 1)}>← Página anterior</button>
          <span className="mudo">Página {pag + 1} de {paginas.length}</span>
          <button type="button" className="btn ouro" disabled={pag === ultima} onClick={() => ir(pag + 1)}>Próxima página →</button>
        </div>
      </div>
    </Shell>
  )
}

/* ───────────── A JORNADA DAS ESTAÇÕES: porta, mapa e paradas de cada livro ───────────── */

// Estados de uma estação: 'trancado' (falta revelar o Mistério do livro anterior), 'livre' ou 'resolvido'.
const estadoEstacao = (prog, i) => (!prog.liberado(i) ? 'trancado' : prog.resolvido(LIVROS_PROFETAS[i]) ? 'resolvido' : 'livre')
const TIPO_LUGAR = { aprox: 'Posição aproximada no mapa.', incerto: 'Localização incerta: a Bíblia não fecha a questão, e o ponto no mapa é só uma indicação.' }

// Mapa vetorial: mares, rios e lagos desenhados em código, com as paradas por cima. A largura acompanha a tela.
function MapaSvg({ caixa, mapaId, pontos, sel = -1, aoSel, ligar = true, rotuloPontos = true, rotulo = 'Mapa' }) {
  const uid = React.useId().replace(/:/g, '')
  const ref = useRef(null)
  const [W, setW] = useState(760)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const med = () => { const w = Math.round(el.clientWidth); if (w > 120) setW(w) }
    med()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(med)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const cx = useMemo(() => ajustarCaixa(caixa), [caixa.sul, caixa.norte, caixa.oeste, caixa.leste])
  const { H, xy } = useMemo(() => criarProjecao(cx, W), [cx, W])
  const geo = useMemo(() => ({
    mar: [MAR_MEDITERRANEO, MAR_NEGRO, MAR_CASPIO, GOLFO_PERSICO, MAR_VERMELHO].map((p) => caminhoPoligono(p, xy)),
    lagos: [MAR_MORTO, MAR_GALILEIA, LAGO_VAN, LAGO_URMIA].map((p) => caminhoPoligono(p, xy)),
    ilhas: ILHAS.map((i) => caminhoPoligono(i.p, xy)),
    rios: RIOS.map((r) => caminhoLinha(r.p, xy)),
  }), [xy])
  const base = useMemo(() => pontos.map((p) => xy(p.lon, p.lat)), [pontos, xy])
  // paradas no mesmo lugar são afastadas em volta, para todas ficarem visíveis e tocáveis
  const pos = useMemo(() => {
    const out = []
    base.forEach(([x, y]) => {
      let px = x, py = y, k = 0
      while (out.some(([ox, oy]) => Math.hypot(ox - px, oy - py) < 30) && k < 14) {
        const ang = 0.6 + k * 0.95, r = 30 + 9 * Math.floor(k / 6)
        px = x + Math.cos(ang) * r; py = y + Math.sin(ang) * r; k++
      }
      out.push([px, py])
    })
    return out
  }, [base])
  const nomes = useMemo(() => {
    const usados = pos.map(([x, y]) => ({ x1: x - 17, y1: y - 17, x2: x + 17, y2: y + 17 }))
    const lista = pontos.map(() => null)
    if (!rotuloPontos) return lista
    // a parada escolhida é nomeada primeiro; as outras só ganham nome se houver lugar sem encostar em nada
    const ordem = pontos.map((_, i) => i).sort((a2, b2) => (a2 === sel ? -1 : b2 === sel ? 1 : a2 - b2))
    ordem.forEach((i) => {
      const p = pontos[i]
      const t = String(p.rotulo || '')
      const w = Math.min(t.length, 28) * 6.9 + 10, h = 20
      const [x, y] = pos[i]
      const opcoes = [[x + 19, y - 10, 'start'], [x - 19 - w, y - 10, 'end'], [x - w / 2, y - 40, 'middle'], [x - w / 2, y + 20, 'middle']]
      const dentro = (o) => o[0] >= 2 && o[0] + w <= W - 2 && o[1] >= 2 && o[1] + h <= H - 2
      const livre = (o) => dentro(o) && !usados.some((u) => o[0] < u.x2 && o[0] + w > u.x1 && o[1] < u.y2 && o[1] + h > u.y1)
      let o = opcoes.find(livre)
      if (!o && i === sel) o = opcoes.find(dentro) || opcoes[0]
      if (!o) return
      usados.push({ x1: o[0], y1: o[1], x2: o[0] + w, y2: o[1] + h })
      const ancora = o[2]
      lista[i] = { x: ancora === 'start' ? o[0] + 5 : ancora === 'end' ? o[0] + w - 5 : o[0] + w / 2, y: o[1] + 14, ancora, t: t.length > 28 ? t.slice(0, 27) + '…' : t }
    })
    return lista
  }, [pontos, pos, W, H, rotuloPontos, sel])
  const trechos = useMemo(() => {
    if (!ligar) return []
    return pos.slice(1).map(([x, y], i) => {
      const [x0, y0] = pos[i]
      const dx = x - x0, dy = y - y0, len = Math.hypot(dx, dy) || 1
      const cxm = (x0 + x) / 2 - (dy / len) * len * 0.16, cym = (y0 + y) / 2 + (dx / len) * len * 0.16
      return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' Q' + cxm.toFixed(1) + ' ' + cym.toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1)
    })
  }, [pos, ligar])
  const letras = useMemo(() => ROTULOS.filter((r) => r.maps.split('').some((c) => mapaId.includes(c))).map((r) => ({ ...r, pt: xy(r.lon, r.lat) })).filter((r) => r.pt[0] > 30 && r.pt[0] < W - 30 && r.pt[1] > 14 && r.pt[1] < H - 8), [mapaId, xy, W, H])
  return (
    <div className="jn-svgcaixa" ref={ref}>
      <svg className="jn-svg" viewBox={'0 0 ' + W + ' ' + H} width={W} height={H} role="group" aria-label={rotulo}>
        <defs><clipPath id={'cp' + uid}><rect x="0" y="0" width={W} height={H} rx="14" /></clipPath></defs>
        <g clipPath={'url(#cp' + uid + ')'}>
          <rect x="0" y="0" width={W} height={H} fill="#ecdba4" />
          <image href="/img/mapa-pergaminho.webp" x={-0.06 * W} y={-0.06 * H} width={1.12 * W} height={1.12 * H} preserveAspectRatio="xMidYMid slice" />
          <g className="jn-agua">{geo.mar.map((d, i) => <path key={'m' + i} d={d} />)}{geo.lagos.map((d, i) => <path key={'l' + i} d={d} />)}</g>
          <g className="jn-ilhas">{geo.ilhas.map((d, i) => <path key={'i' + i} d={d} />)}</g>
          <g className="jn-rios">{geo.rios.map((d, i) => <path key={'r' + i} d={d} />)}</g>
          <g className="jn-letras">{letras.map((r, i) => <text key={i} x={r.pt[0]} y={r.pt[1]} className={'jn-l-' + r.tipo + (r.p === 'pequeno' ? ' peq' : '')} textAnchor="middle">{r.t}</text>)}</g>
          {ligar && (
            <g className="jn-trilha">
              {trechos.map((d, i) => <path key={'t' + i} d={d} className="jn-trecho" />)}
              {trechos.map((d, i) => <path key={'f' + i} d={d} pathLength="1" className={'jn-feito' + (i < sel ? ' on' : '')} />)}
            </g>
          )}
          {nomes.map((n, i) => (n ? <text key={'n' + i} x={n.x} y={n.y} textAnchor={n.ancora} className={'jn-nome' + (i === sel ? ' on' : '')}>{n.t}</text> : null))}
          {pontos.map((p, i) => {
            const [x, y] = pos[i]
            const est = p.estado || ''
            const cls = 'jn-pin' + (i === sel ? ' sel' : '') + (p.tipo ? ' ' + p.tipo : '') + (est ? ' ' + est : '')
            const agir = () => aoSel && aoSel(i)
            return (
              <g key={'p' + i} className={cls} transform={'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'} role="button" tabIndex={0} aria-label={(p.n || i + 1) + '. ' + p.rotulo + (p.tipo === 'incerto' ? ' (localização incerta)' : p.tipo === 'aprox' ? ' (posição aproximada)' : '')} onClick={agir} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); agir() } }}>
                <title>{p.rotulo}</title>
                {i === sel && <circle className="jn-onda" r="15" />}
                <circle className="jn-pin-c" r={i === sel ? 15 : 12} />
                <text className="jn-pin-n" textAnchor="middle" dy="4.5">{est === 'trancado' ? '🔒' : (p.n || i + 1)}</text>
                {p.tipo === 'incerto' && <text className="jn-pin-q" x="11" y="-8" textAnchor="middle">?</text>}
              </g>
            )
          })}
          <g className="jn-norte" transform={'translate(' + (W - 28) + ' 30)'}><path d="M0 -16 L6 6 L0 2 L-6 6 Z" /><text y="22" textAnchor="middle">N</text></g>
        </g>
      </svg>
    </div>
  )
}

function CartaoEstacao({ l, i, estado }) {
  const e = J_ESTACOES[l.id]
  const [semImg, setSemImg] = useState(false)
  const trancado = estado === 'trancado'
  return (
    <li className={'jn-cartao ' + estado}>
      <Link className="jn-cartao-liga" to={'/jornada-das-estacoes/' + l.id} aria-label={'Estação ' + (i + 1) + ': ' + l.nome + (trancado ? ' (fechada)' : '')}>
        <span className="jn-cartao-img">
          {!semImg && <img src={'/img/porta-' + l.id + '.webp'} alt="" loading="lazy" onError={() => setSemImg(true)} />}
          <b className="jn-num">{i + 1}</b>
          {trancado && <span className="jn-trava" aria-hidden="true">🔒</span>}
          {estado === 'resolvido' && <span className="jn-ok" aria-hidden="true">✓</span>}
        </span>
        <span className="jn-cartao-txt">
          <b>{l.nome}</b>
          <small>{e.lugar}</small>
          <small className="jn-epoca">{e.epoca}</small>
          <span className="jn-ler">{trancado ? 'Fechada: revele o Mistério anterior' : e.paradas.length + ' paradas · Abrir a porta →'}</span>
        </span>
      </Link>
    </li>
  )
}

function JornadaEstacoes() {
  const prog = useProgressoLP()
  const voz = useVoz()
  const nav = useNavigate()
  const total = LIVROS_PROFETAS.length
  const pct = Math.round((prog.totalLib / total) * 100)
  const pontos = useMemo(() => LIVROS_PROFETAS.map((l, i) => { const p0 = J_ESTACOES[l.id].paradas[0]; return { lat: p0.lat, lon: p0.lon, rotulo: l.nome, tipo: p0.tipo, n: i + 1, estado: estadoEstacao(prog, i) } }), [prog.admin, prog.totalLib, prog.totalOk])
  const intro = 'A Jornada das Estações. Doze livros dos profetas viram doze estações, em ordem de tempo, do jardim do Éden à Igreja nascente. Em cada estação, um personagem abre uma porta, e você segue o caminho dele no mapa, parada por parada. A porta seguinte só se abre quando você revela o Mistério Profético da estação anterior.'
  return (
    <Shell titulo="Jornada das Estações">
      <section className="jn-abertura">
        <div className="jn-abertura-txt">
          <Selo tipo="ouro">UMA VIAGEM PELA BÍBLIA, EM ORDEM DE TEMPO</Selo>
          <h2>A Jornada das Estações</h2>
          <p>Doze livros dos profetas viram doze estações. Em cada uma, um personagem abre uma porta e você segue o caminho dele no mapa: onde estava, para onde foi e o que Deus fez ali. A porta seguinte só se abre quando você revela o <b>Mistério Profético</b> da estação anterior.</p>
          <div className="lp-barra" data-livre>
            <div className="lp-prog" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={prog.totalLib} aria-label="Estações abertas"><i style={{ width: pct + '%' }} /></div>
            <span><b>{prog.totalLib}</b> de {total} estações abertas · <b>{prog.totalOk}</b> Mistérios revelados</span>
          </div>
          <div className="botoes">
            <BotaoOuvir voz={voz} id="jn-intro" texto={intro} rotulo="Ouvir a apresentação" />
            <Link className="btn pequeno" to="/estudos-profeticos">Estante dos livros</Link>
            <Link className="btn pequeno" to="/mestre-avivar">Mestre Avivar</Link>
          </div>
        </div>
        <div className="jn-abertura-mapa">
          <MapaSvg caixa={{ sul: 26, norte: 43, oeste: 10, leste: 50 }} mapaId="G" pontos={pontos} aoSel={(i) => nav('/jornada-das-estacoes/' + LIVROS_PROFETAS[i].id)} rotuloPontos={false} rotulo="Mapa geral das doze estações, do Éden a Roma" />
          <p className="mudo jn-legenda">Mapa geral: do primeiro ao último passo. Toque em uma estação para abrir a porta. Mapa esquemático de estudo.</p>
        </div>
      </section>
      {J_TEMPOS.map((t) => {
        const itens = t.livros.map((id) => LIVROS_PROFETAS.findIndex((x) => x.id === id)).filter((i) => i >= 0)
        return (
          <section key={t.n} className="jn-tempo" aria-labelledby={'jn-t' + t.n}>
            <header className="jn-tempo-cab">
              <span className="jn-tempo-n">TEMPO {t.n}</span>
              <div><h3 id={'jn-t' + t.n}>{t.nome}</h3><p className="mudo">{t.epoca}</p></div>
              <p className="jn-tempo-intro">{t.intro}</p>
            </header>
            <ol className="jn-grade" style={{ '--n': itens.length }}>
              {itens.map((i) => <CartaoEstacao key={LIVROS_PROFETAS[i].id} l={LIVROS_PROFETAS[i]} i={i} estado={estadoEstacao(prog, i)} />)}
            </ol>
          </section>
        )
      })}
      <p className="mudo oq-nota">Datas e lugares são aproximados: onde os estudiosos divergem, a estação avisa. Cada parada traz a etiqueta da sua natureza (texto bíblico, história, tradição ou interpretação teológica). A revelação vem somente de Deus, e tudo se examina pela Bíblia.</p>
    </Shell>
  )
}

function JornadaEstacao() {
  const { id } = useParams()
  const prog = useProgressoLP()
  const voz = useVoz()
  const { marcarLido } = useLoja()
  const idx = LIVROS_PROFETAS.findIndex((x) => x.id === id)
  const l = LIVROS_PROFETAS[idx]
  const est = J_ESTACOES[id]
  const [sel, setSel] = useState(0)
  const [tocando, setTocando] = useState(false)
  const topoMapa = useRef(null)
  useEffect(() => { setSel(0); setTocando(false); voz.parar() }, [id])
  useEffect(() => { if (l && prog.liberado(idx)) marcarLido('jn:' + id) }, [id])
  useEffect(() => {
    if (!tocando || !est) return undefined
    const t = setTimeout(() => {
      if (sel >= est.paradas.length - 1) { setTocando(false); return }
      setSel(sel + 1)
    }, 2600)
    return () => clearTimeout(t)
  }, [tocando, sel, id])
  if (!l || !est) return <Shell titulo="Jornada das Estações"><p>Estação não encontrada.</p><Link className="btn" to="/jornada-das-estacoes">Ver as estações</Link></Shell>
  if (!prog.liberado(idx)) {
    const ant = LIVROS_PROFETAS[idx - 1]
    return (
      <Shell titulo="Jornada das Estações">
        <div className="cartao bloqueio lp-trancado">
          <span className="trava-icone" aria-hidden="true">🔒</span>
          <h2>A porta de {l.nome} ainda está fechada</h2>
          <p>Para abrir esta porta, revele o Mistério Profético <b>{ant.misterios[0].nome}</b>, no livro de {ant.nome}.</p>
          <div className="botoes centro"><Link className="btn ouro" to={'/estudos-profeticos/livro/' + ant.id + '?pagina=misterio'}>Ir ao Mistério</Link><Link className="btn" to="/jornada-das-estacoes">Voltar às estações</Link></div>
        </div>
      </Shell>
    )
  }
  const mapa = J_MAPAS[est.mapa]
  const tempo = J_TEMPOS.find((t) => t.n === est.tempo)
  const ant = LIVROS_PROFETAS[idx - 1], prox = LIVROS_PROFETAS[idx + 1]
  const paradas = est.paradas
  const p = paradas[sel]
  const pontos = paradas.map((x, i) => ({ lat: x.lat, lon: x.lon, rotulo: x.local, tipo: x.tipo, n: i + 1 }))
  const irPara = (n) => { setTocando(false); voz.parar(); setSel(Math.max(0, Math.min(paradas.length - 1, n))) }
  const resolvido = prog.resolvido(l)
  const txtPorta = est.porta.titulo + '. ' + textoParaFala(est.porta.texto)
  const entrar = () => { if (topoMapa.current) topoMapa.current.scrollIntoView({ behavior: parouMovimento() ? 'auto' : 'smooth', block: 'start' }) }
  return (
    <Shell titulo="Jornada das Estações">
      <article className="jn-estacao">
        <header className="jn-cab">
          <Selo tipo="ouro">{'ESTAÇÃO ' + (idx + 1) + ' DE ' + LIVROS_PROFETAS.length}</Selo><Selo>{'TEMPO ' + est.tempo + ' · ' + (tempo ? tempo.nome : '')}</Selo>{resolvido && <Selo>MISTÉRIO REVELADO</Selo>}
          <h2>{l.nome}</h2>
          <p className="mudo">{l.frase} · {est.epoca}</p>
        </header>
        <section className="jn-porta" aria-labelledby="jn-porta-t">
          <ImgViva arquivo={'porta-' + id} alt={'A porta de ' + l.nome + ': ' + est.porta.titulo} lado="cheia" fx="brilho" legenda={est.porta.titulo + ' · ' + est.porta.ref} foco="50% 55%" />
          <div className="jn-porta-txt">
            <h3 id="jn-porta-t">{est.porta.titulo}</h3>
            <TextoLongo texto={limpaMarca(est.porta.texto)} />
            <p className="jn-lugar"><b>Onde:</b> {est.lugar}</p>
            <div className="botoes">
              <BotaoOuvir voz={voz} id={'jn-porta-' + id} texto={txtPorta} rotulo="Ouvir" />
              <button type="button" className="btn ouro" onClick={entrar}>Entrar pela porta ↓</button>
            </div>
            <PainelBiblia refs={parseRefs(est.porta.ref)} titulo="Bíblia Avivar" dica="A passagem da porta. Toque para ler o texto aqui." />
          </div>
        </section>
        <section className="jn-caminho" ref={topoMapa} aria-labelledby="jn-mapa-t">
          <div className="jn-caminho-cab">
            <div><h3 id="jn-mapa-t">O caminho no mapa</h3><p className="mudo">{mapa.nome}. {mapa.desc}</p></div>
            <div className="botoes jn-controles">
              <button type="button" className="btn pequeno" disabled={sel === 0} onClick={() => irPara(sel - 1)} aria-label="Parada anterior">← Anterior</button>
              <button type="button" className={'btn pequeno' + (tocando ? ' on' : '')} aria-pressed={tocando} onClick={() => { if (!tocando && sel >= paradas.length - 1) setSel(0); setTocando(!tocando) }}>{tocando ? '⏸ Pausar' : '▶ Percorrer o caminho'}</button>
              <button type="button" className="btn pequeno" disabled={sel >= paradas.length - 1} onClick={() => irPara(sel + 1)} aria-label="Próxima parada">Próxima →</button>
            </div>
          </div>
          <div className="jn-caminho-grade">
            <div className="jn-col-mapa">
              <MapaSvg caixa={caixaDaEstacao(mapa.caixa, paradas)} mapaId={est.mapa} pontos={pontos} sel={sel} aoSel={(i) => irPara(i)} rotulo={'Mapa do caminho de ' + l.nome} />
              <ul className="jn-fichas" aria-label="Paradas">
                {paradas.map((x, i) => <li key={i}><button type="button" className={'jn-ficha' + (i === sel ? ' on' : '') + (i < sel ? ' passou' : '')} aria-current={i === sel ? 'true' : undefined} onClick={() => irPara(i)}><i>{i + 1}</i><span>{x.titulo}</span></button></li>)}
              </ul>
              <div className="jn-extra">
                <div className="jn-ilus">
                  <ImgViva arquivo={'mapa-' + est.mapa} alt={'Mapa ilustrado: ' + mapa.nome} lado="cheia" fx="nevoa" legenda="Mapa ilustrado (toque para ampliar)" />
                </div>
                <p className="mudo jn-legenda"><span className="jn-k plena" /> lugar conhecido<br /><span className="jn-k aprox" /> posição aproximada<br /><span className="jn-k incerto">?</span> localização incerta<br />Mapa esquemático de estudo, sem precisão de escala. O mapa ilustrado é só apoio visual.</p>
              </div>
            </div>
            <article className="jn-parada" key={id + ':' + sel} aria-live="polite" aria-labelledby="jn-parada-t">
              <p className="jn-parada-n">PARADA {sel + 1} DE {paradas.length}</p>
              <h3 id="jn-parada-t">{p.titulo}</h3>
              <p className="jn-parada-local">📍 {p.local}{p.tipo && <span className={'jn-aviso ' + p.tipo}>{p.tipo === 'incerto' ? 'localização incerta' : 'posição aproximada'}</span>}</p>
              <TextoLongo texto={limpaMarca(p.texto)} />
              {p.tipo && <p className="mudo jn-nota-lugar">{TIPO_LUGAR[p.tipo]}</p>}
              <p className="ref"><b>Referências:</b> {p.ref}</p>
              <div className="botoes">
                <BotaoOuvir voz={voz} id={'jn-' + id + '-' + sel} texto={p.titulo + '. ' + textoParaFala(p.texto)} rotulo="Ouvir esta parada" />
              </div>
              <PainelBiblia refs={parseRefs(p.ref)} titulo="Bíblia Avivar" dica="As passagens desta parada. Toque em uma para ler o texto aqui." />
            </article>
          </div>
        </section>
        <section className="jn-fim" aria-label="Continuar a jornada">
          <p className="mudo">{sel >= paradas.length - 1 ? 'Você chegou ao fim do caminho de ' + l.nome + '.' : 'Siga as paradas até o fim do caminho.'} Em seguida, abra o livro de {l.nome} (ficha, ciclo de vida, cultura, alimentação, comportamento e estudo) e revele o Mistério Profético para abrir a próxima porta.</p>
          <div className="botoes">
            {ant && <Link className="btn" to={'/jornada-das-estacoes/' + ant.id}>← Estação anterior: {ant.nome}</Link>}
            <Link className="btn ouro" to={'/estudos-profeticos/livro/' + l.id}>Abrir o livro de {l.nome}</Link>
            <Link className="btn ouro" to={'/estudos-profeticos/livro/' + l.id + '?pagina=misterio'}>Ir ao Mistério</Link>
            <Link className="btn" to="/jornada-das-estacoes">Todas as estações</Link>
            {prox && (prog.liberado(idx + 1) ? <Link className="btn" to={'/jornada-das-estacoes/' + prox.id}>Próxima estação: {prox.nome} →</Link> : <span className="btn desativado" aria-disabled="true">🔒 {prox.nome}: revele o Mistério para abrir</span>)}
          </div>
        </section>
      </article>
    </Shell>
  )
}

/* ── Mestre Avivar: dúvidas dos alunos cadastrados, sempre respondidas com a Bíblia ── */
const lerDuv = () => { try { return JSON.parse(localStorage.getItem(CH_DUV) || '[]') || [] } catch (e) { return [] } }
const gravarDuv = (l) => { try { localStorage.setItem(CH_DUV, JSON.stringify(l)) } catch (e) { /* sem armazenamento */ } }
const DuvidasAPI = {
  async enviar(d) {
    if (SERVIDOR) { await SB.duvidasEnviar(d); return }
    const l = lerDuv()
    l.unshift({ ...d, id: 'dv-' + novoId(), status: 'aberta', criado: new Date().toISOString() })
    gravarDuv(l)
  },
  async listar() { return SERVIDOR ? SB.duvidasListar() : lerDuv() },
  async responder(id, resposta, refs) {
    if (SERVIDOR) { await SB.duvidasResponder(id, resposta, refs); return }
    gravarDuv(lerDuv().map((x) => (x.id === id ? { ...x, resposta, refs, status: 'respondida', respondido: new Date().toISOString() } : x)))
  },
}
const PALAVRAS_FRACAS = new Set('para como qual quais porque onde quando sobre mais menos muito pouco isso esse essa esses essas este esta estes estas aquele aquela uma uns umas dos das nos nas pelo pela entre ainda quem seria tinha foram sendo fazer disse falou'.split(' '))
// Procura, nos livros que o aluno já pode ler, as páginas que talvez já respondam a dúvida.
function sugerirEstudo(texto, livros) {
  const pal = normNome(texto).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !PALAVRAS_FRACAS.has(w))
  if (!pal.length) return []
  const achados = []
  livros.forEach((l) => {
    l.secoes.forEach((s) => {
      const alvo = normNome(s.x + ' ' + s.t)
      const pontos = pal.reduce((n, w) => n + (alvo.includes(w) ? 1 : 0), 0)
      if (pontos >= 2) achados.push({ pontos, livro: l, sec: s })
    })
    l.ciclo.forEach((c) => {
      const pontos = pal.reduce((n, w) => n + (normNome(c.t + ' ' + c.e).includes(w) ? 1 : 0), 0)
      if (pontos >= 2) achados.push({ pontos, livro: l, sec: { id: 'ciclo', t: 'Ciclo de vida' } })
    })
  })
  const vistos = new Set()
  return achados.sort((a, b) => b.pontos - a.pontos).filter((x) => { const k = x.livro.id + x.sec.id; if (vistos.has(k)) return false; vistos.add(k); return true }).slice(0, 3)
}

function CartaoDuvida({ d, voz, admin, aoResponder }) {
  const [resp, setResp] = useState('')
  const [refs, setRefs] = useState('')
  const [erro, setErro] = useState('')
  const [env, setEnv] = useState(false)
  const lv = LIVROS_PROFETAS.find((x) => x.id === d.livro)
  const ms = lv && lv.misterios.find((x) => x.id === d.misterio)
  const zap = zapNormal(d.whatsapp || '')
  const enviar = async () => {
    setErro('')
    if (resp.trim().length < 10) { setErro('Escreva a resposta (mínimo de 10 letras).'); return }
    if (!parseRefs(refs).length) { setErro('Informe a referência bíblica, por exemplo: Gênesis 3:9.'); return }
    setEnv(true)
    try { await aoResponder(d.id, resp.trim(), refs.trim()); setResp(''); setRefs('') } catch (e) { setErro(e.message || 'Não foi possível enviar.') }
    setEnv(false)
  }
  return (
    <article className={'cartao lp-duvida ' + d.status}>
      <header>
        <Selo tipo={d.status === 'respondida' ? 'ouro' : ''}>{d.status === 'respondida' ? 'RESPONDIDA' : 'AGUARDANDO O MESTRE'}</Selo>
        <small className="mudo">{new Date(d.criado).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}{lv ? ' · ' + lv.nome : ''}{ms ? ' · ' + ms.nome : ''}</small>
      </header>
      {admin && <p className="mudo lp-quem"><b>{d.nome}</b>{d.email ? ' · ' + d.email : ''}{zap ? ' · WhatsApp ' + zapBonito(zap) : ''}</p>}
      <p className="lp-pergunta-aluno">{d.pergunta}</p>
      {d.resposta && (
        <div className="lp-resposta">
          <b>Resposta do Mestre Avivar</b>
          <p>{d.resposta}</p>
          {d.refs && <PainelBiblia refs={parseRefs(d.refs)} titulo="Bíblia Avivar" dica="Passagens desta resposta. Toque para ler." />}
          <BotaoOuvir voz={voz} id={'r-' + d.id} texto={'Resposta do Mestre Avivar. ' + d.resposta + ' Referências: ' + d.refs} rotulo="Ouvir a resposta" />
        </div>
      )}
      {admin && d.status !== 'respondida' && (
        <div className="lp-admin-resp">
          <label><span>Resposta (sempre baseada na Bíblia)</span><textarea rows={4} value={resp} onChange={(e) => setResp(e.target.value)} maxLength={1500} /></label>
          <label><span>Referência bíblica (obrigatória)</span><input value={refs} onChange={(e) => setRefs(e.target.value)} placeholder="Ex.: Gênesis 3:9; Salmos 139:7-10" /></label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <div className="botoes">
            <button type="button" className="btn ouro" disabled={env} onClick={enviar}>{env ? 'Enviando…' : 'Responder'}</button>
            {zap && resp.trim() && <a className="btn" target="_blank" rel="noopener noreferrer" href={'https://wa.me/' + zap + '?text=' + encodeURIComponent('Paz do Senhor, ' + d.nome + '! Resposta do Mestre Avivar à sua dúvida: ' + resp.trim() + (refs.trim() ? ' (' + refs.trim() + ')' : ''))}>Enviar também pelo WhatsApp</a>}
          </div>
        </div>
      )}
    </article>
  )
}

function MestreAvivar() {
  const { sessao, cadastros } = useLoja()
  const [busca] = useSearchParams()
  const prog = useProgressoLP()
  const voz = useVoz()
  const admin = !!(sessao && sessao.admin)
  const meu = (cadastros || []).find((c) => sessao && c.email === sessao.email)
  const whats = (sessao && sessao.whatsapp) || (meu && meu.whatsapp) || ''
  const estudados = LIVROS_PROFETAS.filter((_, i) => prog.liberado(i))
  const livroIni = estudados.some((x) => x.id === busca.get('livro')) ? busca.get('livro') : estudados[0].id
  const [livroId, setLivroId] = useState(livroIni)
  const [misId, setMisId] = useState(busca.get('misterio') || '')
  const [texto, setTexto] = useState('')
  const [lista, setLista] = useState(null)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [env, setEnv] = useState(false)
  const [filtro, setFiltro] = useState('abertas')
  const lv = LIVROS_PROFETAS.find((x) => x.id === livroId) || estudados[0]
  const dit = useReconhecimento((t) => setTexto((x) => (x ? x + ' ' : '') + t))
  const carregar = () => DuvidasAPI.listar().then((l) => setLista(l)).catch(() => setLista([]))
  useEffect(() => { carregar() }, [])
  const sugestoes = useMemo(() => sugerirEstudo(texto, estudados), [texto, estudados.length])
  const enviar = async () => {
    setErro(''); setMsg('')
    if (texto.trim().length < 10) { setErro('Escreva a sua dúvida com pelo menos algumas palavras.'); return }
    setEnv(true)
    try {
      await DuvidasAPI.enviar({ nome: sessao.nome, email: sessao.email || '', whatsapp: whats, livro: lv.id, misterio: misId, pergunta: texto.trim() })
      setTexto(''); setMsg('Dúvida enviada ao Mestre Avivar. A resposta aparece aqui, com a Bíblia, assim que ele responder.')
      if (voz.ligada) voz.falar('msg', 'Dúvida enviada ao Mestre Avivar.')
      carregar()
    } catch (e) { setErro(e.message || 'Não foi possível enviar agora.') }
    setEnv(false)
  }
  const responder = async (id, resp, refs) => { await DuvidasAPI.responder(id, resp, refs); await carregar() }
  const minhas = (lista || []).filter((d) => SERVIDOR || ((d.email || '') === (sessao.email || '') && d.nome === sessao.nome))
  const caixa = (lista || []).filter((d) => (filtro === 'abertas' ? d.status !== 'respondida' : d.status === 'respondida'))
  const regras = 'Mestre Avivar. Aqui você deixa a sua dúvida sobre o que já estudou nos livros dos profetas. O Mestre responde somente dentro do conteúdo estudado e sempre com a Bíblia. A resposta chega aqui, e pode também chegar pelo seu WhatsApp.'
  return (
    <Shell titulo="Mestre Avivar">
      <div className="lp-mestre">
        <header className="cartao lp-mestre-topo">
          <h2>Mestre Avivar</h2>
          <p>Deixe a sua dúvida sobre o que você já estudou. O Mestre responde <b>somente dentro do conteúdo estudado</b> e <b>sempre à luz da Bíblia</b>.</p>
          <div className="botoes">
            <BotaoOuvir voz={voz} id="regras" texto={regras} rotulo="Ouvir como funciona" />
            <Link className="btn pequeno" to="/estudos-profeticos">← A estante</Link>
          </div>
        </header>

        {!admin && (
          <section className="cartao lp-form" aria-labelledby="lp-f-t">
            <h3 id="lp-f-t">Digite sua dúvida</h3>
            <p className="mudo">Identificação: <b>{sessao.nome}</b>{sessao.email ? ' · ' + sessao.email : ''}{whats ? ' · WhatsApp ' + zapBonito(zapNormal(whats)) : ''}</p>
            <div className="lp-form-linha">
              <label><span>Sobre qual livro?</span>
                <select value={lv.id} onChange={(e) => { setLivroId(e.target.value); setMisId('') }}>
                  {estudados.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
                </select>
              </label>
              <label><span>Sobre qual Mistério? (opcional)</span>
                <select value={misId} onChange={(e) => setMisId(e.target.value)}>
                  <option value="">Sem Mistério específico</option>
                  {lv.misterios.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
                </select>
              </label>
            </div>
            <label><span>A sua pergunta (objetiva, sobre o que você estudou)</span>
              <textarea rows={4} maxLength={800} value={texto} placeholder="Digite sua dúvida" onChange={(e) => setTexto(e.target.value)} />
            </label>
            <div className="lp-form-rodape">
              <small className="mudo">{texto.length} de 800 letras</small>
              {dit.suporta && <button type="button" className={'btn pequeno' + (dit.ouvindo ? ' on' : '')} aria-pressed={dit.ouvindo} onClick={dit.alternar}>{dit.ouvindo ? '🎤 Ouvindo… toque para parar' : '🎤 Falar a dúvida'}</button>}
            </div>
            {sugestoes.length > 0 && (
              <div className="lp-sugestao" role="status">
                <b>Talvez o estudo já responda:</b>
                <ul>{sugestoes.map((s) => <li key={s.livro.id + s.sec.id}><Link to={'/estudos-profeticos/livro/' + s.livro.id + '?pagina=' + s.sec.id}>{s.livro.nome}: {s.sec.t}</Link></li>)}</ul>
              </div>
            )}
            {erro && <p className="erro" role="alert">{erro}</p>}
            {msg && <p className="lp-fb ok" role="status">{msg}</p>}
            <button type="button" className="btn ouro" disabled={env} onClick={enviar}>{env ? 'Enviando…' : 'Enviar ao Mestre Avivar'}</button>
          </section>
        )}

        {admin && (
          <section aria-labelledby="lp-c-t">
            <h3 id="lp-c-t">Caixa do Mestre</h3>
            <div className="lp-abas-simples" role="group" aria-label="Filtro">
              <button type="button" className={'lp-chip' + (filtro === 'abertas' ? ' on' : '')} aria-pressed={filtro === 'abertas'} onClick={() => setFiltro('abertas')}>A responder ({(lista || []).filter((d) => d.status !== 'respondida').length})</button>
              <button type="button" className={'lp-chip' + (filtro === 'respondidas' ? ' on' : '')} aria-pressed={filtro === 'respondidas'} onClick={() => setFiltro('respondidas')}>Respondidas</button>
            </div>
            {lista === null && <p className="mudo">Carregando…</p>}
            {lista && caixa.length === 0 && <Aviso>Nenhuma dúvida {filtro === 'abertas' ? 'esperando resposta' : 'respondida'} por enquanto.</Aviso>}
            <div className="lp-lista">{caixa.map((d) => <CartaoDuvida key={d.id} d={d} voz={voz} admin aoResponder={responder} />)}</div>
          </section>
        )}

        {!admin && (
          <section aria-labelledby="lp-m-t">
            <h3 id="lp-m-t">Minhas dúvidas</h3>
            {lista === null && <p className="mudo">Carregando…</p>}
            {lista && minhas.length === 0 && <Aviso>Você ainda não enviou nenhuma dúvida.</Aviso>}
            <div className="lp-lista">{minhas.map((d) => <CartaoDuvida key={d.id} d={d} voz={voz} admin={false} aoResponder={responder} />)}</div>
          </section>
        )}
      </div>
    </Shell>
  )
}

/* ───────────── SALAS ───────────── */

const CADEIRA = { nome: 'Pastor Marcos Fagner', desc: 'Pastor Marcos Fagner, chamado a servir ao Senhor dos Exércitos, capacitado pelo homem, através de estudos teológicos firmados na verdade do Cristo Jesus. Coberto pelo poder do Espírito Santo de Deus, que o capacitou e gerou os Códigos Avivar, ativando aos profetas da geração do arrebatamento, que realizarão sinais, milagres e maravilhas. O PODER DE DEUS se aperfeiçoa na vida daqueles que o buscam, se preparam e tem um coração rendido ao Senhor.' }

function AvisoAnjo() {
  const { sessao, entradasSala } = useLoja()
  if (true) return null // o plano Anjo agora vê a vitrine; as entradas grátis da Sala Profética foram substituídas pela trava por plano
  const restam = Math.max(0, LIMITE_ANJO - entradasSala)
  return (
    <Aviso forte>
      <b>Plano Anjo:</b> você tem direito a {LIMITE_ANJO} entradas na Sala Profética. {restam > 0 ? `Restam ${restam} de ${LIMITE_ANJO}.` : 'Suas entradas acabaram.'}{' '}
      <Link to="/planos">Ver os planos</Link>
    </Aviso>
  )
}

function SalaProfetica() {
  const { db, sessao, entradasSala, usarEntrada } = useLoja()
  const nav = useNavigate()
  const limitado = sessao.plano === 'anjo' && !sessao.admin
  const restam = LIMITE_ANJO - entradasSala
  const entrar = (id) => {
    if (limitado) {
      if (restam <= 0) return
      if (!window.confirm(`Esta entrada será contada. Depois dela restarão ${restam - 1} de ${LIMITE_ANJO}. Entrar agora?`)) return
      usarEntrada()
    }
    nav('/sala-profetica/' + id)
  }
  return (
    <Shell titulo="Sala Profética" editar="salas">
      <Faixa src="/img/sala-profetica.webp" titulo="Sala Profética" frase="Encontros ao vivo de ensino e oração." vida="brasas" video="sala-profetica">
        <AvisoAnjo />
        <div className="cartao cadeira"><Avatar /><div><Selo tipo="ouro">CADEIRA CATIVA</Selo><h3>{CADEIRA.nome}</h3><p>{CADEIRA.desc}</p></div></div>
      </Faixa>
      <h2>Escolha o clima da sala</h2>
      <p className="passe-mouse" role="note"><span className="so-mouse">PASSE O MOUSE SOBRE A IMAGEM</span><span className="so-toque">TOQUE NA IMAGEM</span></p>
      <GradeTres className="grade" tema="salmos">
        {db.salas.map((s) => (
          <article key={s.id} className="cartao clima">
            <ClimaImg id={s.id} />
            <h3>{s.titulo}</h3><p>{s.descricao}</p>
            <button className="btn ouro" disabled={limitado && restam <= 0} onClick={() => entrar(s.id)}>{limitado && restam <= 0 ? 'Entradas esgotadas' : 'Entrar'}</button>
          </article>
        ))}
      </GradeTres>
    </Shell>
  )
}

function Sala() {
  const { id } = useParams()
  const { db, sessao } = useLoja()
  const [msgs, setMsgs] = useState([])
  const [txt, setTxt] = useState('')
  const s = db.salas.find((x) => x.id === id)
  if (!s) return <Shell titulo="Sala"><p>Sala não encontrada.</p></Shell>
  const enviar = (e) => { e.preventDefault(); if (txt.trim()) { setMsgs([...msgs, txt.trim()]); setTxt('') } }
  return (
    <Shell titulo={'Sala Profética · ' + s.titulo}>
      <AvisoAnjo />
      <div className="sala">
        <Paisagem className="fundo" {...(CLIMAS[s.id] || {})} />
        <Foto src={'/img/clima-' + s.id + '.webp'} />
        <VideoVivo nome={'clima-' + s.id} />
        <Particulas tipo={VIDA_CLIMA[s.id] || 'poeira'} />
        <div className="sala-palco"><b>Transmissão ao vivo</b><span>Em breve. O serviço de vídeo ainda será definido.</span></div>
      </div>
      <div className="curso-pagina">
        <div className="cartao">
          <h3>Conversa (demonstração)</h3>
          <div className="chat">{msgs.length === 0 ? <p className="mudo">Nenhuma mensagem ainda.</p> : msgs.map((m, i) => <p key={i}><b>{sessao.nome}:</b> {m}</p>)}</div>
          <form className="linha-form" onSubmit={enviar}><input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Escreva uma mensagem" aria-label="Mensagem" /><button className="btn">Enviar</button></form>
        </div>
        <div className="cartao"><h3>Na sala</h3><p><Selo tipo="ouro">CADEIRA CATIVA</Selo> {CADEIRA.nome}</p><p>{sessao.nome} (você)</p></div>
      </div>
    </Shell>
  )
}

function Respiracao() {
  const [fase, setFase] = useState('Inspire')
  useEffect(() => {
    const t = setTimeout(() => setFase(fase === 'Inspire' ? 'Expire' : 'Inspire'), fase === 'Inspire' ? 4000 : 6000)
    return () => clearTimeout(t)
  }, [fase])
  return <div className={'respiracao' + (fase === 'Inspire' ? ' cheia' : '')} aria-live="polite"><span>{fase}</span></div>
}

const relogio = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')

function Cronometro({ minutos, onInicio, onFim, onParar, desabilitado, motivo, rotuloParar = 'Parar' }) {
  const [resta, setResta] = useState(null)
  const cb = useRef({})
  cb.current = { onInicio, onFim, onParar }
  const total = minutos * 60
  useEffect(() => { setResta(null) }, [minutos])
  useEffect(() => {
    if (resta === null || resta <= 0) return
    const t = setTimeout(() => setResta(resta - 1), 1000)
    return () => clearTimeout(t)
  }, [resta])
  useEffect(() => { if (resta === 0 && cb.current.onFim) cb.current.onFim() }, [resta])
  const ativo = resta !== null && resta > 0
  const iniciar = () => { setResta(total); if (cb.current.onInicio) cb.current.onInicio() }
  const parar = () => { const feito = resta === null ? 0 : total - resta; setResta(null); if (cb.current.onParar) cb.current.onParar(feito) }
  return (
    <div className="cronometro">
      {ativo && <Respiracao />}
      <p className="relogio" role="timer">{resta === null ? relogio(total) : resta === 0 ? 'Tempo concluído' : relogio(resta)}</p>
      <div className="botoes centro">
        {ativo
          ? <button className="btn" onClick={parar}>{rotuloParar}</button>
          : <button className="btn ouro" disabled={!!desabilitado} onClick={iniciar}>{resta === 0 ? 'Recomeçar' : 'Iniciar'}</button>}
      </div>
      {desabilitado && motivo && !ativo && <p className="mudo cron-motivo">{motivo}</p>}
    </div>
  )
}

/* ───────────── TABERNÁCULO DE ORAÇÃO ───────────── */

// As oito portas: cada uma vem de uma sala do app. 'a' é o ângulo na órbita; 'cor' é a luz da porta.
const PORTAS_TAB = [
  { id: 'celestial', nome: 'Celestial', a: 0, cor: '#8fb4ff', sala: 'Sala Profética · clima Celestial', to: '/sala-profetica' },
  { id: 'angelical', nome: 'Angelical', a: 45, cor: '#fff0b8', sala: 'Sala Profética · clima Angelical', to: '/sala-profetica' },
  { id: 'quantico', nome: 'Quântico', a: 90, cor: '#7fe3ff', sala: 'Sala Quântica', to: '/sala-quantica' },
  { id: 'rio', nome: 'Rio', a: 135, cor: '#6fe0c8', sala: 'Sala Profética · clima Rio do Espírito', to: '/sala-profetica' },
  { id: 'presenca', nome: 'Presença', a: 180, cor: '#ffd977', sala: 'Sala Profética · clima Presença', to: '/sala-profetica' },
  { id: 'deserto', nome: 'Deserto', a: 225, cor: '#e0b878', sala: 'Sala Profética · clima Deserto', to: '/sala-profetica' },
  { id: 'montanha', nome: 'Montanha', a: 270, cor: '#c3cbe0', sala: 'Montanha Profética', to: '/montanha-profetica' },
  { id: 'mistico', nome: 'Místico', a: 315, cor: '#b08cff', sala: 'Sala Profética · clima Místico', to: '/sala-profetica' },
]

// Cada porta, uma ação de oração (lidas nas orações de Jesus em Lucas e João). Leitura nossa, não doutrina nova.
const ACOES_TAB = {
  celestial: ['Levantar os olhos', 'João 11:41; 17:1'],
  angelical: ['Ser fortalecido', 'Lucas 22:41-43'],
  quantico: ['Aquietar-se diante do Criador', 'Salmos 46:10; Colossenses 1:17'],
  rio: ['Orar e ver o céu se abrir', 'Lucas 3:21-22'],
  presenca: ['Interceder pelos seus', 'João 17:9-11, 20'],
  deserto: ['Retirar-se a sós', 'Marcos 1:35; Lucas 5:16'],
  montanha: ['Passar a noite e discernir', 'Lucas 6:12-13'],
  mistico: ['Contemplar a glória', 'Lucas 9:28-29'],
}

const TEXTO_ONDAS = `{{CIÊNCIA ESTABELECIDA}} Na imagem, o poder do Senhor aparece desenhado como ondas de luz que atravessam os doze portais. A linguagem vem da física: no mundo do muito pequeno, as partículas são descritas por ondas de probabilidade, e, quando se mede, obtém-se um resultado definido. É assim que a mecânica quântica descreve a matéria.

{{!ANALOGIA | Ilustração criada pelo Ministério Avivar para esta imagem. Não vem da Bíblia nem de revelação, e não prova nada sobre Deus. A ligação entre cada portal e cada mês é uma leitura de estudo, e não um ensino da Escritura. | Hebreus 1:3; Colossenses 1:17; Salmos 33:6-9; Apocalipse 21:12-25; Sala Quântica}} Por analogia, o desenho mostra aquilo que parece espalhado e invisível tomando forma em cada portal. Mas o poder de Deus não é uma onda, nem uma energia que se mede ou se manipula. É a ação do Criador, que sustenta todas as coisas pela palavra do seu poder (Hebreus 1:3) e em quem tudo subsiste (Colossenses 1:17). Os céus foram feitos pela palavra do Senhor (Salmos 33:6,9). A física descreve como o mundo criado se comporta, e não explica Deus.`

function partesTab(texto) {
  const L = String(texto || '').split('\n')
  const i1 = L.findIndex((l) => l.trim() === 'Por que um tabernáculo')
  const i2 = L.findIndex((l) => l.trim() === 'A oração de Jesus passou por todas as salas')
  const i3 = L.findIndex((l) => l.trim() === 'Os doze portais celestiais')
  if (i1 < 0 || i2 < i1) return null
  const fim = i3 > i2 ? i3 : L.length
  return {
    intro: L.slice(0, i1).join('\n').trim(),
    porque: L.slice(i1 + 1, i2).join('\n').trim(),
    oracao: L.slice(i2 + 1, fim).join('\n').trim(),
    portais: i3 > i2 ? L.slice(i3 + 1).join('\n').trim() : '',
  }
}

// ── Tabernáculo: as 12 esferas ──

// Nomes que o calendário do navegador devolve → id da esfera. Adar I e Adar II caem na mesma esfera.
const MES_INTL = { tishri: 'tishrei', tishrei: 'tishrei', heshvan: 'cheshvan', cheshvan: 'cheshvan', kislev: 'kislev', tevet: 'tevet', shevat: 'shevat', adar: 'adar', 'adar i': 'adar', 'adar ii': 'adar', nisan: 'nisan', iyar: 'iyar', sivan: 'sivan', tamuz: 'tamuz', av: 'av', elul: 'elul' }
function hojeHebraico() {
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
    const p = {}
    f.formatToParts(new Date()).forEach((x) => { p[x.type] = x.value })
    const id = MES_INTL[String(p.month || '').toLowerCase()]
    return id ? { id, dia: p.day, ano: p.year, nome: p.month } : null
  } catch (e) { return null }
}

const LIMITE_FLIP = 520
const semMarca = (t) => String(t || '').replace(/\{\{!?[^}]*\}\}/g, '').replace(/^• /gm, '').replace(/\s+/g, ' ').trim()
const partirCartoes = (t) => String(t || '').split(/^@@ /m).map((b) => b.trim()).filter(Boolean).map((b) => {
  const i = b.indexOf('\n')
  return i < 0 ? { titulo: b, texto: '' } : { titulo: b.slice(0, i).trim(), texto: b.slice(i + 1).trim() }
})

// Cartão de leitura. Texto curto abre no próprio lugar; texto longo vira um cartão que gira e ocupa a tela, sem rolar a página.
// Ao encerrar a leitura, o cartão se recolhe girando e fica marcado como lido.
function CartaoLeitura({ n, titulo, texto, cor, lido, onLido, destaque }) {
  const [aberto, setAberto] = useState(false)
  const [fecha, setFecha] = useState(false)
  const [flip, setFlip] = useState(null)
  const [gira, setGira] = useState(false)
  const tempos = useRef([])
  useEffect(() => () => tempos.current.forEach(clearTimeout), [])
  const longo = String(texto || '').length > LIMITE_FLIP
  const reduz = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const agenda = (f, ms) => tempos.current.push(setTimeout(f, reduz ? 20 : ms))
  const giraLido = () => { setGira(true); agenda(() => setGira(false), 1000) }
  const abrir = () => { if (longo) setFlip('entra'); else setAberto(true) }
  const encerrar = () => {
    onLido && onLido()
    if (flip) { setFlip('sai'); agenda(() => { setFlip(null); giraLido() }, 800) }
    else { setFecha(true); agenda(() => { setAberto(false); setFecha(false); giraLido() }, 520) }
  }
  useEffect(() => {
    if (!flip) return undefined
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tecla = (e) => { if (e.key === 'Escape') setFlip(null) }
    window.addEventListener('keydown', tecla)
    return () => { document.body.style.overflow = antes; window.removeEventListener('keydown', tecla) }
  }, [flip])
  const resumo = semMarca(texto).slice(0, 118)
  return (
    <article className={'leit-cartao' + (aberto ? ' aberto' : '') + (fecha ? ' fecha' : '') + (gira ? ' gira' : '') + (lido ? ' lido' : '') + (destaque ? ' destaque' : '')} style={{ '--cor': cor || '#f3d98b' }}>
      {!aberto && (
        <button type="button" className="leit-frente" onClick={abrir} aria-haspopup={longo ? 'dialog' : undefined}>
          <span className="leit-n">{n}</span>
          <b>{titulo}</b>
          <small>{resumo}{resumo.length >= 118 ? '…' : ''}</small>
          <span className="leit-status">{lido ? 'Lido ✓' : longo ? 'Toque para virar o cartão' : 'Toque para ler'}</span>
        </button>
      )}
      {aberto && (
        <div className="leit-aberto">
          <h4>{titulo}</h4>
          <TextoLongo texto={texto} />
          <div className="botoes centro"><button type="button" className="btn ouro" onClick={encerrar}>LEITURA ENCERRADA</button></div>
        </div>
      )}
      {flip && typeof document !== 'undefined' && createPortal(
        <div className="flip-fundo" role="dialog" aria-modal="true" aria-label={titulo} onClick={() => setFlip(null)}>
          <div className={'flip-cena ' + flip}>
            <div className="flip-cartao" style={{ '--cor': cor || '#f3d98b' }} onClick={(e) => e.stopPropagation()}>
              <div className="flip-frente" aria-hidden="true"><span className="leit-n">{n}</span><b>{titulo}</b></div>
              <div className="flip-verso">
                <header><h3>{titulo}</h3><button type="button" className="flip-x" onClick={() => setFlip(null)} aria-label="Fechar sem concluir">×</button></header>
                <div className="flip-corpo"><TextoLongo texto={texto} /></div>
                <footer><button type="button" className="btn ouro" autoFocus onClick={encerrar}>LEITURA ENCERRADA</button></footer>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  )
}

// O relógio redondo: cada "hora" é um mês, começando por Nisan no alto. Mostra a letra, o nome transliterado e a posição de hoje.
function RelogioMeses({ esferas, hoje, escolhida, onEscolher, parte }) {
  const R = 150
  const idxHoje = hoje ? esferas.findIndex((e) => e.id === hoje.id) : -1
  const legenda = (
    <div className="rel-legenda">
      <h3 className="rel-titulo">Relógio dos meses</h3>
      <p className="rel-hoje">{hoje ? <>Hoje, no calendário hebraico: <b>{hoje.dia} de {hoje.nome}</b> de {hoje.ano}.</> : 'O calendário hebraico não está disponível neste aparelho.'}</p>
      <p className="mudo rel-nota"><Selo>TRADIÇÃO · ORIGEM NÃO COMPROVADA</Selo> A letra de cada mês vem do Sefer Yetzirah, livro místico judaico posterior à Bíblia. Não é doutrina nem revelação. O ano sagrado começa em Nisan (Êxodo 12:2).</p>
    </div>
  )
  if (parte === 'legenda') return legenda
  const desenho = (
      <svg viewBox="0 0 400 400" role="group" aria-label="Relógio dos meses hebraicos: cada hora é um mês, a partir de Nisan">
        <circle cx="200" cy="200" r="192" className="rel-aro" />
        <circle cx="200" cy="200" r="116" className="rel-aro2" />
        {idxHoje >= 0 && (
          <g className="rel-ponteiro" style={{ transform: 'rotate(' + idxHoje * 30 + 'deg)', transformOrigin: '200px 200px' }}>
            <line x1="200" y1="200" x2="200" y2="140" />
            <polygon points="200,122 193,142 207,142" />
          </g>
        )}
        <circle cx="200" cy="200" r="9" className="rel-eixo" />
        {esferas.map((e, i) => {
          const a = (i * 30 - 90) * Math.PI / 180
          const x = 200 + R * Math.cos(a), y = 200 + R * Math.sin(a)
          const xn = 200 + 98 * Math.cos(a), yn = 200 + 98 * Math.sin(a)
          const on = escolhida === e.id
          const agora = hoje && hoje.id === e.id
          return (
            <g key={e.id} className={'rel-mes' + (on ? ' on' : '') + (agora ? ' agora' : '')} style={{ '--cor': e.cor }} role="button" tabIndex={0}
              aria-label={e.mes + ', mês ' + (i + 1) + ', letra ' + e.letraNome + (agora ? ', mês de hoje' : '')}
              onClick={() => onEscolher(e.id)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onEscolher(e.id) } }}>
              <circle cx={x} cy={y} r="29" className="rel-bolha" />
              <text x={x} y={y + 11} textAnchor="middle" className="rel-letra">{e.letra}</text>
              <text x={xn} y={yn + 4} textAnchor="middle" className="rel-nome">{e.mes}</text>
              <text x={xn} y={yn + 17} textAnchor="middle" className="rel-num">{i + 1}</text>
            </g>
          )
        })}
      </svg>
  )
  if (parte === 'desenho') return desenho
  return <div className="rel-meses">{desenho}{legenda}</div>
}

// Os doze meses com o significado de cada um: o mesmo símbolo do relógio (a letra), pulsando, com o nome do mês. Ao tocar, leva ao conteúdo do mês.
function MesesSignificado({ esferas, hoje, escolhida, onEscolher }) {
  return (
    <div className="mes-sig">
      <h3 className="rel-titulo">O significado de cada mês</h3>
      <p className="mudo mes-sig-sub">Toque em um mês para ir ao conteúdo dele.</p>
      <ul className="mes-sig-grade">
        {esferas.map((e, i) => {
          const agora = !!hoje && hoje.id === e.id
          return (
            <li key={e.id}>
              <button type="button" className={'mes-sig-item' + (escolhida === e.id ? ' on' : '') + (agora ? ' agora' : '')} style={{ '--cor': e.cor, '--atraso': (i * 0.27).toFixed(2) + 's' }}
                aria-label={'Mês ' + (i + 1) + ', ' + e.mes + ', ' + e.dimensao + (agora ? ', mês de hoje' : '') + '. Abrir o conteúdo.'} onClick={() => onEscolher(e.id)}>
                <span className="mes-sig-simbolo" aria-hidden="true">{e.letra}</span>
                <span className="mes-sig-texto"><b>{e.mes}{agora && <i>HOJE</i>}</b><small>{i + 1}º mês · {e.dimensao}</small></span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// No fim dos marcos, o espaço que sobra recebe uma leitura teológica dos números (cartão creme, texto justificado).
const EXTRA_MARCOS = (
  <CartaoCuriosidade sempre rotulo="INTERPRETAÇÃO TEOLÓGICA">
    <p>Doze lembra o governo de Deus; trinta, o início do ministério de Jesus (Lucas 3:23); quarenta, tempo de preparo (Êxodo 24:18; Mateus 4:2); setenta, os anciãos e os enviados (Números 11:16; Lucas 10:1); cento e vinte, os discípulos em oração antes do Pentecostes (Atos 1:15). É leitura da Igreja, não fórmula: o Pai sabe do que precisamos (Mateus 6:7-8).</p>
  </CartaoCuriosidade>
)

const fmtTempo = (seg) => {
  if (seg < 60) return 'menos de 1 minuto'
  const m = Math.floor(seg / 60), s = seg % 60
  return m + ' min' + (s ? ' ' + s + ' s' : '')
}
const TEMPOS_ORACAO = [5, 10, 12, 15, 30, 40, 70, 120]

function Tabernaculo() {
  const { db, lidos, marcarLido } = useLoja()
  const itens = db.tabernaculo || []
  const achar = (id) => itens.find((x) => x.id === id)
  const abertura = achar('abertura')
  const partes = abertura ? partesTab(abertura.texto) : null
  const comoOrar = achar('como-orar')
  const cuidados = achar('cuidados')
  const esferas = useMemo(() => (db.esferasTab || []).slice().sort((a, b) => Number(a.ordem) - Number(b.ordem)), [db.esferasTab])
  const marcos = useMemo(() => (db.marcosOracao || []).slice().sort((a, b) => Number(a.minutos) - Number(b.minutos)), [db.marcosOracao])
  const hoje = useMemo(hojeHebraico, [])
  // aberto → recolhendo (uma esfera por vez, cada uma com a sua nota) → explodiu → recolhido (hora de orar)
  // → orando (as esferas se abrem de novo) → recolhendo/explodiu (final) → concluido
  const [fase, setFase] = useState('aberto')
  const [final, setFinal] = useState(false)
  const [subiram, setSubiram] = useState(0)
  const [ciclo, setCiclo] = useState(0)
  const tempos = useRef([])
  const [aberta, setAberta] = useState(null)
  const [sel, setSel] = useState(hoje ? hoje.id : 'nisan')
  const [min, setMin] = useState(12)
  const [dim, setDim] = useState('')
  const [orado, setOrado] = useState(0)
  const limpar = () => { tempos.current.forEach(clearTimeout); tempos.current = [] }
  useEffect(() => limpar, [])
  const reduz = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const n = esferas.length || 12
  const unir = (aoFinal) => {
    limpar(); setSubiram(0); setFinal(aoFinal); setFase('recolhendo')
    const passo = reduz ? 60 : aoFinal ? 300 : 480
    esferas.forEach((_, i) => tempos.current.push(setTimeout(() => { setSubiram(i + 1); tocarNotaPorta(i) }, 250 + i * passo)))
    const fim = 250 + n * passo + (reduz ? 60 : 1200)
    tempos.current.push(setTimeout(() => { setFase('explodiu'); tocarExplosao() }, fim))
    tempos.current.push(setTimeout(() => setFase(aoFinal ? 'concluido' : 'recolhido'), fim + (reduz ? 60 : 2600)))
  }
  const reabrir = () => { limpar(); setSubiram(0); setFinal(false); setFase('aberto'); setCiclo((c) => c + 1); tocarRetorno() }
  const orarDeNovo = () => { limpar(); setFinal(false); setFase('recolhido'); setCiclo((c) => c + 1) }
  // Em telas estreitas, o relógio de oração abre logo abaixo das esferas: leva a pessoa até ele.
  useEffect(() => {
    if (fase !== 'recolhido' || typeof window === 'undefined' || window.innerWidth > 860) return
    const t = setTimeout(() => { const el = document.querySelector('.tab-ore'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 400)
    return () => clearTimeout(t)
  }, [fase])
  const dimAtual = esferas.find((e) => e.id === dim)
  const emUniao = fase === 'explodiu' || fase === 'recolhido' || fase === 'concluido'
  const painelAberto = fase === 'recolhido' || fase === 'orando' || fase === 'concluido' || (final && (fase === 'recolhendo' || fase === 'explodiu'))
  const escolher = (id) => {
    setSel(id)
    setTimeout(() => { const el = document.getElementById('esfera-painel'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 60)
  }
  const ir = (id) => {
    setAberta(id)
    setTimeout(() => { const el = document.getElementById('porta-' + id); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 60)
  }
  const atingidos = marcos.filter((m) => orado >= Number(m.minutos) * 60)
  const marcoMax = atingidos[atingidos.length - 1]
  const proximo = marcos.find((m) => orado < Number(m.minutos) * 60)
  const rotuloNucleo = fase === 'aberto' ? 'RECOLHER ORAÇÃO' : fase === 'orando' ? 'EM ORAÇÃO' : 'ORAÇÃO'
  const sair = esferas.find((e) => e.id === sel) || esferas[0]
  const cartoesSel = sair ? partirCartoes(sair.cartoes) : []
  const lidosSel = sair ? cartoesSel.filter((_, i) => lidos && lidos[sair.id + ':' + i]).length : 0
  return (
    <Shell titulo="Tabernáculo de Oração" editar="tabernaculo">
      <Faixa src="/img/tabernaculo.webp" titulo="Tabernáculo de Oração" frase="Onde todas as salas se encontram em oração." vida={['luz', 'brasas']} video="tabernaculo">
        <h2 className="tab-titulo">As doze esferas, uma só oração</h2>
        <p className="mudo tab-sub">Doze é o número do governo de Deus: doze tribos, doze apóstolos, doze meses. Toque na esfera central para recolher a oração, ou toque em uma esfera para ler sobre ela.</p>
      </Faixa>

      <section className="tab-topo" aria-label="As doze esferas se recolhendo em oração">
        <div className="tab-colunas">
          <div className="tab-palco">
            <div className={'convergencia ' + fase + (emUniao ? ' recolhido' : '')} style={{ '--n': subiram / n }}>
              {esferas.map((p, i) => (
                <button key={p.id} type="button" className={'orbe' + ((fase === 'recolhendo' && i < subiram) || emUniao ? ' foi' : '') + (fase === 'orando' || fase === 'recolhido' ? (dim === p.id ? ' escolhida' : dim && fase === 'orando' ? ' apagada' : '') : '')} style={{ '--a': i * 30 + 'deg', '--cor': p.cor }} onClick={() => escolher(p.id)} title={p.dimensao + ' · ' + p.mes} aria-label={'Esfera de ' + p.mes + ', dimensão ' + p.dimensao} tabIndex={fase !== 'aberto' && fase !== 'orando' ? -1 : 0}>
                  <span>{p.mes}</span>
                </button>
              ))}
              <button type="button" className="conv-nucleo" onClick={fase === 'aberto' ? () => unir(false) : undefined} disabled={fase !== 'aberto'} aria-label={fase === 'aberto' ? 'Recolher oração: unir as doze esferas' : rotuloNucleo}>
                <span>{rotuloNucleo}</span>
              </button>
              {fase === 'explodiu' && (
                <div className="conv-explosao" aria-hidden="true">
                  <span className="ex-flash" />
                  <span className="ex-onda" /><span className="ex-onda ex-onda2" />
                  {esferas.map((p, i) => <span key={'fx' + p.id} className="ex-feixe" style={{ '--a': (i * 30 - 90) + 'deg', '--cor': p.cor }} />)}
                  {Array.from({ length: 24 }).map((_, i) => <span key={'fa' + i} className="ex-faisca" style={{ '--ang': ((i * 360) / 24 + (i % 2 ? 8 : 0)) + 'deg', '--dist': 30 + ((i * 11) % 22) + '%', '--cor': (esferas[i % n] || {}).cor || '#f3d98b', '--dl': (i % 5) * 70 + 'ms' }} />)}
                  {Array.from({ length: 8 }).map((_, i) => <span key={'fu' + i} className="ex-fumaca" style={{ '--ang': ((i * 360) / 8 + 18) + 'deg', '--dl': i * 110 + 'ms' }} />)}
                </div>
              )}
            </div>
            <div className="botoes centro">
              {fase === 'aberto' && <p className="mudo tab-dica">Toque na esfera central que pulsa.</p>}
              {fase === 'recolhendo' && <button type="button" className="btn" disabled>As esferas se unem…</button>}
              {(fase === 'recolhido' || fase === 'concluido') && <button type="button" className="btn" onClick={reabrir}>Abrir as esferas</button>}
              {fase === 'orando' && <p className="mudo tab-dica">Em oração: a esfera da dimensão escolhida está acesa.</p>}
            </div>
          </div>
        <div className="tab-ore-linha">
            <section className={'cartao tab-ore ' + (painelAberto ? 'aberto' : 'trancado')} aria-label="Relógio de oração">
            <h3>Relógio de oração</h3>
            {!painelAberto && (
              <div className="tab-ore-trava">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="52" className="tot-aro" />
                  <circle cx="60" cy="60" r="40" className="tot-aro2" />
                  {Array.from({ length: 12 }).map((_, i) => <line key={i} x1="60" y1="14" x2="60" y2={i % 3 === 0 ? 24 : 20} className="tot-marca" style={{ transform: 'rotate(' + i * 30 + 'deg)', transformOrigin: '60px 60px' }} />)}
                  <line x1="60" y1="60" x2="60" y2="34" className="tot-ponteiro" />
                  <line x1="60" y1="60" x2="78" y2="60" className="tot-ponteiro tot-curto" />
                  <circle cx="60" cy="60" r="4" className="tot-eixo" />
                </svg>
                <p className="mudo">O relógio se abre quando as doze esferas se unirem. Toque na esfera central.</p>
              </div>
            )}
            {painelAberto && (
              <div className="tab-ore-corpo">
                <p className="mudo">Escolha a dimensão que você pretende buscar neste momento de oração e o tempo. Dimensão, aqui, é o foco do seu estudo e da sua oração, e não um lugar espiritual a conquistar. O caminho ao Pai é Cristo (João 14:6).</p>
                <h4 className="tab-h4">Dimensão</h4>
                <div className="tab-dims" role="group" aria-label="Dimensão da oração">
                  {esferas.map((e) => (
                    <button key={e.id} type="button" disabled={fase === 'orando' || final} className={'dim' + (dim === e.id ? ' on' : '')} style={{ '--cor': e.cor }} aria-pressed={dim === e.id} onClick={() => setDim(e.id)}>
                      <i aria-hidden="true" /><span>{e.dimensao}</span>
                    </button>
                  ))}
                </div>
                <h4 className="tab-h4">Tempo</h4>
                <div className="botoes centro tab-tempos">
                  {TEMPOS_ORACAO.map((m) => {
                    const prof = marcos.some((x) => Number(x.minutos) === m)
                    return <button key={m} type="button" disabled={fase === 'orando' || final} className={'btn' + (m === min ? ' ouro' : '')} onClick={() => setMin(m)}>{m} min{prof ? ' ★' : ''}</button>
                  })}
                </div>
                <p className="mudo tab-estrela">★ números proféticos da Bíblia: 12, 30, 40, 70 e 120.</p>
                <Cronometro key={ciclo} minutos={min} desabilitado={!dim || final || fase === 'concluido'} motivo={!dim ? 'Escolha a dimensão para iniciar.' : ''} rotuloParar="Encerrar oração"
                  onInicio={() => setFase('orando')} onFim={() => { setOrado(min * 60); unir(true) }} onParar={(seg) => { setOrado(seg); unir(true) }} />
              </div>
            )}
          </section>
        </div>
        </div>

        <div className="tab-cal" aria-label="O calendário judaico e o significado de cada mês">
          <div className="tab-cal-esq">
            <div className="tab-hebr-vis"><RelogioMeses esferas={esferas} hoje={hoje} escolhida={sel} onEscolher={escolher} parte="desenho" /></div>
            <div className="tab-hebr-leg"><RelogioMeses esferas={esferas} hoje={hoje} escolhida={sel} onEscolher={escolher} parte="legenda" /></div>
          </div>
          <div className="tab-cal-dir"><MesesSignificado esferas={esferas} hoje={hoje} escolhida={sel} onEscolher={escolher} /></div>
        </div>

        {fase === 'concluido' && (
          <section className="cartao tab-resultado" id="tab-resultado" aria-live="polite">
            <Selo tipo="ouro">ORAÇÃO CONCLUÍDA</Selo>
            <h3>Você orou {fmtTempo(orado)}{dimAtual ? ' na dimensão ' + dimAtual.dimensao + ' (' + dimAtual.mes + ')' : ''}</h3>
            {dimAtual && (
              <blockquote className="tab-versiculo" style={{ '--cor': dimAtual.cor }}>
                “{dimAtual.mensagem}”
                <cite>{dimAtual.mensagemRef}</cite>
              </blockquote>
            )}
            <p className="mudo">Esta é uma palavra da Bíblia para este momento. Não é revelação nova: Deus fala pelo Espírito Santo, e tudo se confirma na Escritura.</p>
            {marcoMax ? (
              <>
                <div className="tab-ciclo">
                  <h3>Você completou um ciclo de governo</h3>
                  <p>Você chegou a <b>{marcoMax.minutos} minutos</b>. {marcoMax.resumo} Abra o cartão para ver o porquê, segundo a Bíblia.</p>
                </div>
                <div className="leit-grade unico">
                  <CartaoLeitura destaque n="★" titulo={marcoMax.titulo} texto={marcoMax.texto} cor="#f3d98b" lido={!!(lidos && lidos[marcoMax.id])} onLido={() => marcarLido(marcoMax.id)} />
                </div>
                {proximo
                  ? <p className="mudo">O próximo marco é de {proximo.minutos} minutos. Faltam {fmtTempo(proximo.minutos * 60 - orado)}, sem pressa: o Pai não mede a oração pelo relógio (Mateus 6:7-8).</p>
                  : <p className="mudo">Você chegou ao último marco. Que a oração continue sendo a sua casa (Lucas 18:1).</p>}
              </>
            ) : (
              <div className="tab-ciclo">
                <h3>Que tal continuar?</h3>
                <p>{orado < 60 ? 'Você orou menos de um minuto, e isso já é um começo.' : 'Cada minuto diante de Deus conta.'} A Bíblia convida a perseverar: "orar sempre e nunca desfalecer" (Lucas 18:1). O primeiro marco é de 12 minutos, um minuto para cada esfera. Faltam {fmtTempo(12 * 60 - orado)}.</p>
                <p className="mudo">Os minutos ajudam a perseverar, mas o Pai sabe do que precisamos antes de pedirmos (Mateus 6:7-8). Volte quando puder.</p>
              </div>
            )}
            <div className="botoes centro">
              <button type="button" className="btn ouro" onClick={() => { if (!marcoMax && marcos[0]) setMin(Number(marcos[0].minutos)); else if (proximo) setMin(Number(proximo.minutos)); orarDeNovo() }}>{marcoMax && !proximo ? 'Orar de novo' : 'Continuar orando'}</button>
              <button type="button" className="btn" onClick={reabrir}>Abrir as esferas</button>
            </div>
          </section>
        )}
      </section>

      <Aviso>Esta sala reúne as outras. Cada texto leva a etiqueta da sua natureza (interpretação teológica, história, ciência, filosofia ou hipótese), para você saber o que é Bíblia, o que é leitura e o que é tradição. Aqui não usamos astrologia nem zodíaco, que a Bíblia condena (Deuteronômio 18:10-12; Isaías 47:13-14).</Aviso>

      {sair && (
        <section className="esfera-sec" id="esfera-painel" aria-label="Explicação das esferas">
          <h2 className="tab-titulo">As doze esferas, uma a uma</h2>
          <p className="mudo tab-sub">Cada esfera é um mês do ano sagrado e uma dimensão de oração. Escolha uma e abra os cartões. Quando terminar de ler, toque em "Leitura encerrada".</p>
          <div className="esf-seletor" role="tablist" aria-label="Escolha a esfera">
            {esferas.map((e) => (
              <button key={e.id} type="button" role="tab" aria-selected={sel === e.id} className={'esf-chip' + (sel === e.id ? ' on' : '') + (hoje && hoje.id === e.id ? ' hoje' : '')} style={{ '--cor': e.cor }} onClick={() => setSel(e.id)}>
                <i aria-hidden="true" /><span>{e.mes}</span>
              </button>
            ))}
          </div>
          <article className="esf-painel" style={{ '--cor': sair.cor }}>
            <header className="esf-cab">
              <div className="esf-letra" aria-hidden="true">{sair.letra}</div>
              <div>
                <p className="esf-mes"><span lang="he" dir="rtl">{sair.hebraico}</span> · {sair.mes}</p>
                <h3>{sair.dimensao}</h3>
                <p className="mudo">Mês {sair.ordem} do ano sagrado{sair.nomeBiblico ? ' · nome bíblico antigo: ' + sair.nomeBiblico : ''}{hoje && hoje.id === sair.id ? ' · mês de hoje' : ''}</p>
                <p>{sair.foco}</p>
                {sair.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}
                <Selo>{lidosSel} de {cartoesSel.length} cartões lidos</Selo>
              </div>
            </header>
            <GradeTres className="leit-grade" tema="meses">
              {cartoesSel.map((c, i) => (
                <CartaoLeitura key={sair.id + i} n={i + 1} titulo={c.titulo} texto={c.texto} cor={sair.cor} lido={!!(lidos && lidos[sair.id + ':' + i])} onLido={() => marcarLido(sair.id + ':' + i)} />
              ))}
            </GradeTres>
          </article>
        </section>
      )}

      {marcos.length > 0 && (
        <section className="esfera-sec" aria-label="Os marcos de oração">
          <h2 className="tab-titulo">Os marcos da oração</h2>
          <p className="mudo tab-sub">Doze, trinta, quarenta, setenta e cento e vinte: números que a Bíblia destaca. Eles ajudam a perseverar. Não são fórmula nem dão mérito: a oração é conversa com o Pai.</p>
          <GradeTres className="leit-grade" tema="meses" extras={[EXTRA_MARCOS]}>
            {marcos.map((m, i) => <CartaoLeitura key={m.id} n={m.minutos} titulo={m.titulo} texto={m.texto} cor="#f3d98b" lido={!!(lidos && lidos[m.id])} onLido={() => marcarLido(m.id)} />)}
          </GradeTres>
        </section>
      )}

      {abertura && partes && (
        <article className="tab-pagina">
          <TextoLongo texto={partes.intro} />
          <h2 className="tab-titulo esq">Por que um tabernáculo</h2>
          <ImgViva arquivo="tab-por-que" alt="A tenda do encontro no deserto, ao amanhecer, com uma coluna de nuvem de luz sobre a entrada" lado="dir" fx="nevoa" legenda="A tenda do encontro: Deus habitando no meio do povo." />
          <TextoLongo texto={partes.porque} />
          <h2 className="tab-titulo esq tab-limpa">A oração de Jesus passou por todas as salas</h2>
          <ImgViva arquivo="tab-oracao-salas" video="tab-oracao-salas" alt="Uma pessoa de costas, ajoelhada em oração diante da tenda do encontro, com oito arcos de cores diferentes em corredor levando a uma única luz dourada e ondas de luz atravessando todos os arcos" lado="esq" fx="brilho" legenda="Uma só oração atravessa as oito salas, até a presença de Deus." />
          <TextoLongo texto={partes.oracao} />
          {partes.portais && (
            <>
              <h2 className="tab-titulo esq tab-limpa">Os doze portais celestiais</h2>
              <ImgViva arquivo="tab-doze-portais" video="tab-doze-portais" alt="Doze portas de pérola em quatro grupos de três, cada uma iluminada pela luz de uma cor, com ondas de luz atravessando todas elas" lado="cheia" fx="brilho" legenda="Doze portas, três para cada lado: a promessa de Apocalipse 21, em desenho." />
              <TextoLongo texto={partes.portais} />
            </>
          )}
          <TextoLongo texto={TEXTO_ONDAS} />
          {abertura.ref && <p className="ref">{abertura.ref}</p>}
        </article>
      )}
      {abertura && !partes && <article className="tab-pagina"><TextoLongo texto={abertura.texto} />{abertura.ref && <p className="ref">{abertura.ref}</p>}</article>}

      <h2 className="tab-titulo">As oito salas e a oração de Jesus</h2>
      <aside className="cartao tab-intro-salas" aria-label="Antes de começar: o que são as oito salas">
        <Selo>INTERPRETAÇÃO TEOLÓGICA</Selo>
        <h3>Antes de começar: o que significam as oito salas?</h3>
        <p>As oito salas são Celestial, Angelical, Quântico, Rio, Presença, Deserto, Montanha e Místico. Cada uma é um ambiente do aplicativo e, aqui no Tabernáculo, também um jeito de orar: uma atitude de oração que Jesus viveu nos Evangelhos. Não são lugares espirituais a conquistar, nem degraus para chegar a Deus. O caminho ao Pai é Cristo (João 14:6), e esta é uma leitura de estudo, não doutrina nova.</p>
        <h3>Onde está a Oração de Jesus?</h3>
        <p>Em três lugares. Primeiro, na lista logo abaixo: cada ação mostra a passagem em que Jesus orou daquela maneira, como retirar-se a sós (Marcos 1:35; Lucas 5:16) ou interceder pelos seus (João 17). Segundo, no texto "A oração de Jesus passou por todas as salas", mais acima. Terceiro, a oração que Jesus ensinou aos discípulos, o Pai Nosso, está em Mateus 6:9-13 e Lucas 11:2-4.</p>
        <h3>Como usar</h3>
        <p>Toque em uma ação da lista. Ela abre o texto da sala correspondente. Leia primeiro a passagem da Bíblia e depois o texto, e então ore com as suas próprias palavras.</p>
      </aside>
      <aside className="cartao tab-acoes">
        <Selo>INTERPRETAÇÃO TEOLÓGICA</Selo>
        <h3>Cada sala, uma ação de oração</h3>
        <p className="mudo">Toque em uma ação para abrir o texto da sala.</p>
        <ol>
          {PORTAS_TAB.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => ir(p.id)} style={{ '--cor': p.cor }}>
                <span className="acao-luz" aria-hidden="true" />
                <span className="acao-txt"><b>{p.nome}</b><span>{ACOES_TAB[p.id][0]}</span><small>{ACOES_TAB[p.id][1]}</small></span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <div className="lista">
        {PORTAS_TAB.map((p) => {
          const d = achar(p.id)
          if (!d) return null
          const on = aberta === p.id
          return (
            <article key={p.id} id={'porta-' + p.id} className={'cartao porta' + (on ? ' on' : '')} style={{ '--cor': p.cor }}>
              <button type="button" className="porta-cab" aria-expanded={on} onClick={() => setAberta(on ? null : p.id)}>
                <span className="porta-luz" aria-hidden="true" />
                <span className="porta-nome"><Selo tipo="ouro">{d.etiqueta}</Selo><b>{d.titulo}</b><small>{d.resumo}</small></span>
                <span className="porta-seta" aria-hidden="true">{on ? '−' : '+'}</span>
              </button>
              {on && (
                <div className="porta-corpo">
                  <TextoLongo texto={d.texto} />
                  {d.ref && <p className="ref">{d.ref}</p>}
                  <div className="botoes"><Link className="btn" to={p.to}>Visitar: {p.sala}</Link></div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {comoOrar && (
        <article className="tab-pagina">
          <h2 className="tab-titulo esq">{comoOrar.titulo}</h2>
          <TextoLongo texto={comoOrar.texto} />
          {comoOrar.ref && <p className="ref">{comoOrar.ref}</p>}
        </article>
      )}
      {cuidados && (
        <article className="tab-pagina">
          <h2 className="tab-titulo esq">{cuidados.titulo}</h2>
          <TextoLongo texto={cuidados.texto} />
        </article>
      )}
    </Shell>
  )
}

const ABAS_Q = [
  ['silencio', 'Câmara do Silêncio', null], ['cursos', 'Cursos', 'cursos'], ['exercicios', 'Exercícios espirituais', 'exercicios'],
  ['temas', 'Temas de estudo', 'quantica'], ['glossario', 'Glossário', 'glossario'],
]

/* ───────────── MEDITAÇÃO GUIADA (Câmara do Silêncio) ─────────────
   Frases em paráfrase de salmos e de outros textos da Bíblia. Voz sintetizada pelo próprio aparelho (a pessoa escolhe: não ouvir, voz feminina ou masculina).
   A cada intervalo escolhido toca um sino, e a voz diz uma abertura calma, uma frase bíblica e a sua referência.
   Rascunho para revisão do Pastor Marcos. */
const FRASES_MED = [
  { t: 'O Senhor é o meu pastor; nada me faltará.', r: 'Salmo 23:1' },
  { t: 'Ele me faz repousar em pastos verdejantes e me conduz a águas tranquilas.', r: 'Salmo 23:2' },
  { t: 'Aquietem-se e saibam que eu sou Deus.', r: 'Salmo 46:10' },
  { t: 'Somente em Deus a minha alma encontra descanso.', r: 'Salmo 62:1' },
  { t: 'Em paz me deito e logo adormeço, pois só tu, Senhor, me fazes viver em segurança.', r: 'Salmo 4:8' },
  { t: 'Venham a mim todos os cansados e sobrecarregados, e eu darei descanso a vocês.', r: 'Mateus 11:28' },
  { t: 'Deixo a paz com vocês; a minha paz eu lhes dou. Não se perturbe o coração de vocês.', r: 'João 14:27' },
  { t: 'Não andem ansiosos por coisa alguma. Apresentem a Deus os seus pedidos, e a paz de Deus guardará o coração de vocês.', r: 'Filipenses 4:6-7' },
  { t: 'Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.', r: '1 Pedro 5:7' },
  { t: 'Tu manténs em perfeita paz aquele cuja mente está firme em ti, porque em ti confia.', r: 'Isaías 26:3' },
  { t: 'Levanto os meus olhos para os montes. O meu socorro vem do Senhor, que fez os céus e a terra.', r: 'Salmo 121:1-2' },
  { t: 'Quem habita no abrigo do Altíssimo descansa à sombra do Todo-Poderoso.', r: 'Salmo 91:1' },
  { t: 'O Senhor é a minha luz e a minha salvação; de quem terei medo?', r: 'Salmo 27:1' },
  { t: 'Não tema, pois estou com você. Não tenha medo, pois eu sou o seu Deus.', r: 'Isaías 41:10' },
  { t: 'Na tua presença há plenitude de alegria.', r: 'Salmo 16:11' },
  { t: 'O Senhor está perto dos que têm o coração quebrantado.', r: 'Salmo 34:18' },
  { t: 'Fiz calar e sossegar a minha alma, como uma criança no colo de sua mãe.', r: 'Salmo 131:2' },
  { t: 'Descanse no Senhor e espere nele.', r: 'Salmo 37:7' },
  { t: 'A tua palavra é lâmpada para os meus pés e luz para o meu caminho.', r: 'Salmo 119:105' },
  { t: 'As misericórdias do Senhor não têm fim; renovam-se a cada manhã.', r: 'Lamentações 3:22-23' },
  { t: 'Quando me deito, lembro de ti e medito em ti durante a noite.', r: 'Salmo 63:6' },
  { t: 'O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e te dê a paz.', r: 'Números 6:24-26' },
  { t: 'Volte, ó minha alma, ao seu descanso, pois o Senhor lhe fez bem.', r: 'Salmo 116:7' },
  { t: 'Quando as preocupações me dominavam, o teu consolo trazia alegria à minha alma.', r: 'Salmo 94:19' },
  { t: 'Que a paz de Cristo guie o coração de vocês.', r: 'Colossenses 3:15' },
  { t: 'O Senhor dá força ao seu povo; o Senhor abençoa o seu povo com a paz.', r: 'Salmo 29:11' },
]
const ABERTURAS_MED = [
  'Acalme-se.',
  'Respire fundo e solte o ar devagar.',
  'Pense no Senhor.',
  'Solte os ombros. O Senhor está perto.',
  'Entregue ao Senhor o que pesa no seu coração.',
  'Fique em silêncio diante do Senhor.',
]
const ABERTURA_INICIAL = 'Vamos começar. Sente-se com calma, feche os olhos se quiser, e respire devagar.'
const FECHAMENTO_MED = 'O tempo terminou. Agradeça ao Senhor por este momento, e leve esta paz com você. Amém.'
const INTERVALOS_MED = [[30, '30 s'], [60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']]
const DURACOES_MED = [3, 5, 10, 15]
const CHAVE_MED = 'codigos-avivar-meditacao'
const PREF_MED = { voz: 'nao', sino: true, intervalo: 60, duracao: 5 }
const lerPrefMed = () => { try { return { ...PREF_MED, ...JSON.parse(localStorage.getItem(CHAVE_MED) || '{}') } } catch (e) { return { ...PREF_MED } } }
// "Salmo 23:1" → "Salmo 23, versículo 1" (a voz lê melhor assim)
const falaRef = (r) => r.replace(/(\d+):(\d+)-(\d+)/, '$1, versículos $2 a $3').replace(/(\d+):(\d+)/, '$1, versículo $2')
const falaDisponivel = () => typeof window !== 'undefined' && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== 'undefined'

// Escolhe uma voz em português do aparelho. Se não houver voz masculina/feminina reconhecível, usa a primeira e muda o tom.
function escolherVoz(genero, vozes) {
  const pt = vozes.filter((v) => /^pt/i.test(v.lang || ''))
  const br = pt.filter((v) => /br/i.test(v.lang || ''))
  const base = br.length ? br : pt
  if (!base.length) return { voz: null, distinta: false }
  const F = /maria|luciana|francisca|helena|fernanda|vit[oó]ria|camila|raquel|joana|feminin|female|google portugu/i
  const M = /daniel|felipe|ant[oô]nio|jorge|ricardo|cristiano|duarte|fernando|masculin|\bmale\b/i
  const casa = genero === 'f' ? F : M
  const outra = genero === 'f' ? M : F
  const achada = base.find((v) => casa.test(v.name) && !outra.test(v.name))
  if (achada) return { voz: achada, distinta: true }
  return { voz: base.find((v) => !outra.test(v.name)) || base[0], distinta: false }
}

function MeditacaoGuiada() {
  const ini = useRef(null)
  if (ini.current === null) ini.current = lerPrefMed()
  const [voz, setVoz] = useState(ini.current.voz)
  const [sinoLigado, setSinoLigado] = useState(ini.current.sino)
  const [intervalo, setIntervalo] = useState(ini.current.intervalo)
  const [duracao, setDuracao] = useState(ini.current.duracao)
  const [vozes, setVozes] = useState([])
  const [resta, setResta] = useState(null)
  const [cue, setCue] = useState(null)
  const ordem = useRef([])
  const timers = useRef([])
  const total = duracao * 60
  const temFala = falaDisponivel()

  useEffect(() => {
    try { localStorage.setItem(CHAVE_MED, JSON.stringify({ voz, sino: sinoLigado, intervalo, duracao })) } catch (e) { /* sem armazenamento */ }
  }, [voz, sinoLigado, intervalo, duracao])

  useEffect(() => {
    if (!temFala) return undefined
    const ler = () => { try { setVozes(window.speechSynthesis.getVoices() || []) } catch (e) { setVozes([]) } }
    ler()
    try { window.speechSynthesis.addEventListener('voiceschanged', ler) } catch (e) { /* navegador antigo */ }
    return () => { try { window.speechSynthesis.removeEventListener('voiceschanged', ler) } catch (e) { /* sem efeito */ } }
  }, [temFala])

  const limpar = () => {
    timers.current.forEach(clearTimeout); timers.current = []
    if (temFala) { try { window.speechSynthesis.cancel() } catch (e) { /* sem efeito */ } }
  }
  useEffect(() => limpar, []) // eslint-disable-line react-hooks/exhaustive-deps

  const escolha = voz === 'nao' ? null : escolherVoz(voz, vozes)
  const falar = (frases) => {
    if (voz === 'nao' || !temFala) return
    const ss = window.speechSynthesis
    try { ss.cancel() } catch (e) { /* sem efeito */ }
    timers.current.push(setTimeout(() => {
      frases.forEach((tx) => {
        const u = new window.SpeechSynthesisUtterance(tx)
        u.lang = 'pt-BR'
        if (escolha && escolha.voz) { u.voice = escolha.voz; u.lang = escolha.voz.lang || 'pt-BR' }
        const distinta = escolha && escolha.distinta
        u.rate = 0.82
        u.pitch = voz === 'f' ? (distinta ? 1 : 1.12) : (distinta ? 0.95 : 0.7)
        try { ss.speak(u) } catch (e) { /* sem voz */ }
      })
    }, 80))
  }
  // O sino toca por escolha da própria pessoa, mesmo que o som ambiente do site esteja desligado.
  const tocarSino = (vezes = 1) => {
    if (!sinoLigado) return
    somAtivar().then((ok) => {
      if (!ok || !SOM.ctx) return
      const c = SOM.ctx, t = c.currentTime
      for (let i = 0; i < vezes; i++) sino(c, t + i * 1.7, 440, 0.16, 4.5)
    })
  }

  const fazerCue = (n, primeiro) => {
    const idx = ordem.current[n % ordem.current.length]
    const f = FRASES_MED[idx]
    const ab = ABERTURAS_MED[n % ABERTURAS_MED.length]
    setCue({ n: n + 1, ab, t: f.t, r: f.r })
    tocarSino(1)
    const fala = [ab, 'Pense nesta frase.', f.t, falaRef(f.r), 'Fique em silêncio por um momento.']
    timers.current.push(setTimeout(() => falar(primeiro ? [ABERTURA_INICIAL].concat(fala) : fala), sinoLigado ? 1900 : 50))
  }

  const iniciar = () => {
    limpar()
    const o = FRASES_MED.map((_, i) => i)
    for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = o[i]; o[i] = o[j]; o[j] = x }
    ordem.current = o
    setResta(total)
    fazerCue(0, true)
  }
  const parar = () => { limpar(); setResta(null); setCue(null) }

  useEffect(() => {
    if (resta === null || resta <= 0) return undefined
    const t = setTimeout(() => setResta((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resta])
  useEffect(() => {
    if (resta === null) return
    if (resta === 0) {
      tocarSino(3)
      setCue({ fim: true })
      timers.current.push(setTimeout(() => falar([FECHAMENTO_MED]), sinoLigado ? 5200 : 50))
      return
    }
    const dec = total - resta
    if (dec > 0 && dec % intervalo === 0) fazerCue(Math.floor(dec / intervalo), false)
  }, [resta]) // eslint-disable-line react-hooks/exhaustive-deps

  const ouvirAmostra = () => {
    tocarSino(1)
    timers.current.push(setTimeout(() => falar(['Que a paz do Senhor esteja com você.']), sinoLigado ? 1900 : 50))
  }

  const rodando = resta !== null && resta > 0
  const proxima = rodando ? intervalo - ((total - resta) % intervalo) : null
  const nota = !temFala
    ? 'Este aparelho não tem voz embutida. As frases aparecem na tela.'
    : voz === 'nao' ? ''
    : !escolha || !escolha.voz ? 'Não encontrei voz em português neste aparelho. As frases aparecem na tela.'
    : escolha.distinta ? 'Voz usada: ' + escolha.voz.name + '.'
    : 'Voz usada: ' + escolha.voz.name + '. Este aparelho só tem uma voz em português; a ' + (voz === 'f' ? 'feminina' : 'masculina') + ' é a mesma, com o tom ajustado.'

  return (
    <section className="cartao med" aria-label="Meditação guiada">
      <Selo tipo="ouro">MEDITAÇÃO GUIADA</Selo>
      <h3>Meditação guiada na Palavra</h3>
      <p className="mudo">Escolha se quer ouvir. A cada intervalo toca um sino, e vem uma frase da Bíblia para você pensar no Senhor.</p>

      <div className="med-bloco">
        <b className="med-rotulo">Voz</b>
        <div className="botoes" role="group" aria-label="Voz da meditação">
          {[['nao', 'Só ler'], ['f', 'Voz feminina'], ['m', 'Voz masculina']].map(([k, t]) => (
            <button key={k} type="button" className={'btn' + (voz === k ? ' ouro' : '')} aria-pressed={voz === k} onClick={() => setVoz(k)}>{t}</button>
          ))}
        </div>
        {nota && <p className="mudo med-nota">{nota}</p>}
      </div>

      <div className="med-bloco">
        <b className="med-rotulo">Sino e frase a cada</b>
        <div className="botoes" role="group" aria-label="Intervalo entre os sinos">
          {INTERVALOS_MED.map(([s, t]) => <button key={s} type="button" className={'btn' + (s === intervalo ? ' ouro' : '')} aria-pressed={s === intervalo} disabled={rodando} onClick={() => setIntervalo(s)}>{t}</button>)}
        </div>
      </div>

      <div className="med-bloco">
        <b className="med-rotulo">Duração</b>
        <div className="botoes" role="group" aria-label="Duração da meditação">
          {DURACOES_MED.map((m) => <button key={m} type="button" className={'btn' + (m === duracao ? ' ouro' : '')} aria-pressed={m === duracao} disabled={rodando} onClick={() => setDuracao(m)}>{m} min</button>)}
          <button type="button" className={'btn' + (sinoLigado ? ' ouro' : '')} aria-pressed={sinoLigado} onClick={() => setSinoLigado((v) => !v)}>{sinoLigado ? 'Sino: ligado' : 'Sino: desligado'}</button>
        </div>
      </div>

      <div className="med-palco" aria-live="polite">
        {!cue && <p className="med-vazio">A primeira frase aparece aqui quando você começar.</p>}
        {cue && cue.fim && <p className="med-frase">Tempo concluído. Agradeça ao Senhor. Amém.</p>}
        {cue && !cue.fim && (
          <blockquote className="med-frase">
            <small>{cue.ab}</small>
            <p>{cue.t}</p>
            <cite>{cue.r} · paráfrase</cite>
          </blockquote>
        )}
      </div>

      <div className="med-rodape">
        <span className="med-tempo" role="timer">{resta === null ? relogio(total) : resta === 0 ? 'Concluída' : relogio(resta)}</span>
        {rodando && <span className="mudo">Próximo sino em {proxima} s</span>}
        <div className="botoes">
          {rodando
            ? <button type="button" className="btn" onClick={parar}>Parar</button>
            : <button type="button" className="btn ouro" onClick={iniciar}>{resta === 0 ? 'Recomeçar' : 'Iniciar a meditação'}</button>}
          {!rodando && voz !== 'nao' && <button type="button" className="btn" onClick={ouvirAmostra}>Ouvir a voz</button>}
        </div>
      </div>
      <p className="mudo med-aviso">Meditar aqui é descansar nas palavras da Bíblia e falar com o Senhor. Não é esvaziar a mente nem buscar poderes. As frases são paráfrases, em rascunho para revisão do Pastor Marcos.</p>
    </section>
  )
}

function SalaQuantica() {
  const { db, tarefas, anotacoes } = useLoja()
  const [aba, setAba] = useState('silencio')
  const [min, setMin] = useState(5)
  const cursos = db.cursos.filter((c) => c.area === 'Sala Quântica')
  return (
    <Shell titulo="Sala Quântica" editar={ABAS_Q.find((a) => a[0] === aba)[2]}>
      <div className="jor-topo qua-topo">
        <div className="quantica">
          <FundoQuantico />
          <div className="quantica-texto">
            <h2>SALA QUÂNTICA</h2>
            <p>Um ambiente estelar para estudar espiritualidade, fé e ciência, e para praticar oração e silêncio.</p>
          </div>
        </div>
        <ApresentaVideo nome="apresenta-quantica" titulo="Onda de Avivamento" texto="Conheça a Sala Quântica: fé, ciência, oração e silêncio, tudo com a Palavra como medida." ajuda="O vídeo de apresentação abre aqui sozinho assim que o arquivo apresenta-quantica.mp4 estiver na pasta public/img." />
      </div>
      <Aviso>Nesta sala todo conteúdo leva uma etiqueta: ciência estabelecida, interpretação teológica, história, filosofia, hipótese ou testemunho. O objetivo é aprender a distinguir uma coisa da outra.</Aviso>
      <Organograma
        chave="quantica"
        titulo="As salas da Sala Quântica"
        rotulo="Toque em um card para abrir. Toque no centro para ouvir a Palavra."
        nos={ABAS_Q.map(([k, t]) => { const o = ORG_QUANTICA[k]; return { id: k, titulos: o.titulos, titulo: t, desc: o.desc, verso: o.verso, on: aba === k, onAbrir: () => { setAba(k); rolarAte('q-conteudo') } } })}
      />
      <div id="q-conteudo" className="ancora-org" />

      {aba === 'cursos' && <>
        <p className="mudo">Cursos sobre espiritualidade e energia quântica, com aulas em vídeo, textos e livros.</p>
        {cursos.length === 0 && <Aviso>Cursos em breve.</Aviso>}
        <GradeTres className="grade" tema="quantica">
          {cursos.map((c) => (
            <Link key={c.id} className="cartao curso" to={'/cursos/' + c.id} {...(SERVIDOR ? { 'data-livre': true } : {})}>
              <Selo tipo="ouro">{c.categoria || 'Curso'}</Selo>
              <h3>{c.titulo}</h3><p>{c.descricao || 'Descrição em breve.'}</p>
              <span className="mudo">{db.aulas.filter((a) => a.cursoId === c.id).length} aulas</span>
            </Link>
          ))}
        </GradeTres>
      </>}

      {aba === 'exercicios' && <>
        <p className="mudo">Práticas guiadas de oração, meditação bíblica, silêncio e contemplação. Cada exercício tem passos e um tempo sugerido.</p>
        <div className="botoes"><Link className="btn" to="/sala-quantica/anotacoes">Minhas Anotações Proféticas ({(anotacoes || []).length})</Link></div>
        {db.exercicios.length === 0 && <Aviso>Exercícios em breve.</Aviso>}
        <GradeTres className="grade" tema="silencio">
          {db.exercicios.map((e) => (
            <Link key={e.id} className="cartao curso" to={'/sala-quantica/exercicio/' + e.id}>
              <Selo tipo="ouro">{e.tipo}</Selo>{e.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}{tarefas['ex:' + e.id] && <Selo tipo="ouro">CONCLUÍDO</Selo>}
              <h3>{e.titulo}</h3>
              <p className="mudo">{e.ref} · {e.minutos} min · {linhas(e.passos).length} passos</p>
            </Link>
          ))}
        </GradeTres>
      </>}

      {aba === 'silencio' && (
        <div className="camara-par">
          <div className="quantica camara">
            <Estrelas />
            <div className="quantica-texto">
              <h3>Câmara do Silêncio</h3>
              <p>Escolha o tempo, inicie e acompanhe a respiração.</p>
              <div className="botoes centro">
                {[1, 3, 5, 10, 15].map((m) => <button key={m} className={'btn' + (m === min ? ' ouro' : '')} onClick={() => setMin(m)}>{m} min</button>)}
              </div>
              <Cronometro minutos={min} />
            </div>
          </div>
          <MeditacaoGuiada />
        </div>
      )}

      {aba === 'temas' && (
        <>
          {db.quantica.length === 0 && <Aviso>Temas em breve.</Aviso>}
        <GradeTres className="grade" tema="quantica">
          {db.quantica.map((q) => q.texto
            ? <Link key={q.id} className="cartao curso" to={'/sala-quantica/tema/' + q.id}><Selo tipo="ouro">{q.etiqueta}</Selo><h3>{q.titulo}</h3><p>{q.resumo}</p><span className="mudo">Ler o tema →</span></Link>
            : <article key={q.id} className="cartao"><Selo tipo="ouro">{q.etiqueta}</Selo><h3>{q.titulo}</h3><p>{q.resumo || 'Conteúdo em breve.'}</p></article>)}
        </GradeTres>
        </>
      )}

      {aba === 'glossario' && (
        <div className="lista">
          {db.glossario.map((g) => <article key={g.id} className="cartao"><Selo tipo="ouro">{g.etiqueta}</Selo><h3>{g.titulo}</h3><p>{g.definicao}</p></article>)}
        </div>
      )}
    </Shell>
  )
}

function TemaQuantico() {
  const { id } = useParams()
  const { db } = useLoja()
  const q = db.quantica.find((x) => x.id === id)
  if (!q || !q.texto) return <Shell titulo="Tema"><p>Tema não encontrado.</p><Link className="btn" to="/sala-quantica">Ir para a Sala Quântica</Link></Shell>
  return (
    <Shell titulo="Sala Quântica" editar="quantica">
      <article className="reportagem-pagina">
        <Selo tipo="ouro">{q.etiqueta}</Selo>
        <h2 className="reportagem-titulo">{q.titulo}</h2>
        {q.resumo && <p className="reportagem-resumo">{q.resumo}</p>}
        <TextoLongo texto={q.texto} />
        <p className="mudo oq-nota">Neste tema, cada parágrafo leva a etiqueta da sua natureza. Isso nos ajuda a separar o que a ciência estabeleceu do que é interpretação, história, filosofia ou hipótese. Nada aqui substitui a Bíblia, o acompanhamento pastoral ou o tratamento médico.</p>
        <div className="botoes"><Link className="btn" to="/sala-quantica">Voltar à Sala Quântica</Link></div>
      </article>
    </Shell>
  )
}

const CORES_PASSO = ['#3a1f7a', '#0f4c5c', '#5a1a3f', '#1b3a7a', '#145a3c', '#6b4410']

// Os passos chegam da direita para a esquerda, como uma onda. Cada passo tem uma cor diferente do fundo.
function PassosOnda({ passos, id }) {
  const [i, setI] = useState(0)
  const [ant, setAnt] = useState(null)
  const [tocando, setTocando] = useState(false)
  const [seg, setSeg] = useState(14)
  useEffect(() => { setI(0); setAnt(null); setTocando(false) }, [id])
  useEffect(() => {
    if (!tocando) return undefined
    if (i >= passos.length - 1) { setTocando(false); return undefined }
    const t = setTimeout(() => { setAnt(i); setI(i + 1) }, seg * 1000)
    return () => clearTimeout(t)
  }, [tocando, i, seg, passos.length])
  const ir = (n) => { if (n < 0 || n >= passos.length || n === i) return; setAnt(i); setI(n) }
  if (!passos.length) return <p>Passos em breve.</p>
  return (
    <div className="exq-passos">
      <div className="exq-passos-topo">
        <h3>Passo {i + 1} de {passos.length}</h3>
        <label className="exq-vel">Velocidade: {seg} s por passo
          <input type="range" min="4" max="40" step="1" value={seg} onChange={(e) => setSeg(Number(e.target.value))} aria-label="Segundos por passo" />
        </label>
      </div>
      <div className="exq-palco" aria-live="polite">
        <svg className="exq-onda" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 60 Q 50 10 100 60 T 200 60 T 300 60 T 400 60 T 500 60 T 600 60 T 700 60 T 800 60 T 900 60 T 1000 60 T 1100 60 T 1200 60 T 1300 60 T 1400 60 T 1500 60 T 1600 60 T 1700 60 T 1800 60 T 1900 60 T 2000 60 T 2100 60 T 2200 60 T 2300 60 T 2400 60" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        {passos.map((t, k) => {
          const classe = k === i ? ' entra' : k === ant ? ' sai' : ''
          if (!classe) return null
          return (
            <div key={k + '-' + (k === i ? 'a' : 'b')} className={'exq-passo' + classe} style={{ background: CORES_PASSO[k % CORES_PASSO.length] }}>
              <span className="exq-n">{k + 1}</span>
              <p>{t}</p>
            </div>
          )
        })}
      </div>
      <div className="botoes centro">
        <button className="btn" onClick={() => ir(i - 1)} disabled={i === 0} aria-label="Passo anterior">←</button>
        <button className={'btn' + (tocando ? '' : ' ouro')} onClick={() => { if (!tocando && i >= passos.length - 1) { setAnt(null); setI(0) } setTocando(!tocando) }}>{tocando ? 'Pausar' : i >= passos.length - 1 && i > 0 ? 'Recomeçar' : 'Iniciar passos'}</button>
        <button className="btn" onClick={() => ir(i + 1)} disabled={i >= passos.length - 1} aria-label="Próximo passo">→</button>
      </div>
      <div className="exq-pontos" role="tablist">
        {passos.map((_, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => ir(k)} aria-label={'Ir ao passo ' + (k + 1)} />)}
      </div>
    </div>
  )
}

// Ilustração do exercício: usa /img/ex-<id>.webp; sem ela, mostra um céu estrelado com uma luz que pulsa.
function CenaExercicio({ id, titulo }) {
  const [sem, setSem] = useState(false)
  useEffect(() => { setSem(false) }, [id])
  if (!sem) return <div className="exq-cena"><ImgViva arquivo={'ex-' + id} alt={'Ilustração do exercício ' + titulo} lado="cheia" fx="brilho" onFalha={() => setSem(true)} /></div>
  return <div className="exq-cena exq-cena-padrao" aria-hidden="true"><Estrelas /><span className="exq-orbe" /><span className="exq-orbe o2" /></div>
}

const SENTIMENTOS = ['Ansioso', 'Nervoso', 'Preocupado', 'Alegre', 'Senti a presença de Deus', 'Com esperança']
const NEGATIVOS = ['Ansioso', 'Nervoso', 'Preocupado']

function Anotacoes({ exercicio }) {
  const { anotacoes, salvarAnotacao, removerAnotacao } = useLoja()
  const [sent, setSent] = useState([])
  const [outros, setOutros] = useState('')
  const [alcancar, setAlcancar] = useState('')
  const [espiritual, setEspiritual] = useState('')
  const [salvo, setSalvo] = useState(null)
  const minhas = (anotacoes || []).filter((a) => a.exercicioId === exercicio.id).slice(0, 5)
  const alterna = (s) => setSent((x) => x.includes(s) ? x.filter((y) => y !== s) : [...x, s])
  const vazio = !sent.length && !outros.trim() && !alcancar.trim() && !espiritual.trim()
  const salvar = () => {
    if (vazio) return
    salvarAnotacao({ exercicioId: exercicio.id, exercicio: exercicio.titulo, sentimentos: sent, outros: outros.trim(), alcancar: alcancar.trim(), espiritual: espiritual.trim() })
    setSalvo(sent.some((s) => NEGATIVOS.includes(s)))
    setSent([]); setOutros(''); setAlcancar(''); setEspiritual('')
  }
  return (
    <section className="cartao anotacoes">
      <Selo tipo="ouro">ANOTAÇÕES PROFÉTICAS</Selo>
      <h3>Registre o que o Senhor falou ao seu coração</h3>
      <p className="mudo">Escreva com as suas palavras. O que você anota é registro seu, para olhar depois com oração. Quem fala é Deus, e tudo se confirma pela Bíblia.</p>
      <fieldset>
        <legend>Como eu estava</legend>
        <div className="chips">
          {SENTIMENTOS.map((s) => <button key={s} type="button" aria-pressed={sent.includes(s)} className={'chip' + (sent.includes(s) ? ' on' : '')} onClick={() => alterna(s)}>{s}</button>)}
        </div>
      </fieldset>
      <label>Outros sentimentos<input type="text" value={outros} onChange={(e) => setOutros(e.target.value)} placeholder="Ex.: cansado, grato, em paz" /></label>
      <label>O que desejo alcançar<textarea rows="3" value={alcancar} onChange={(e) => setAlcancar(e.target.value)} placeholder="O que quero pedir, entender ou entregar a Deus" /></label>
      <label>Como estou espiritualmente<textarea rows="3" value={espiritual} onChange={(e) => setEspiritual(e.target.value)} placeholder="Como está a minha vida com Deus hoje" /></label>
      <div className="botoes">
        <button className="btn ouro" onClick={salvar} disabled={vazio}>Salvar anotação</button>
        <Link className="btn" to="/sala-quantica/anotacoes">Ver todo o meu registro ({(anotacoes || []).length})</Link>
      </div>
      {salvo !== null && (
        <Aviso>
          {SERVIDOR ? 'Anotação salva na sua conta.' : 'Anotação salva neste aparelho.'}
          {salvo && <> “Lançai sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós” (1 Pedro 5:7). Se a ansiedade ou a angústia for constante, procure também apoio pastoral e de um profissional de saúde.</>}
        </Aviso>
      )}
      {minhas.length > 0 && (
        <div className="anot-lista">
          <h4>Últimas anotações deste exercício</h4>
          {minhas.map((a) => <AnotacaoItem key={a.id} a={a} onRemover={() => removerAnotacao(a.id)} />)}
        </div>
      )}
      <p className="mudo oq-nota">{SERVIDOR ? 'As anotações ficam guardadas na sua conta e só você as lê. ' : 'Nesta fase de demonstração, as anotações ficam somente neste aparelho. '}Elas não substituem o acompanhamento pastoral nem o cuidado profissional.</p>
    </section>
  )
}

function AnotacaoItem({ a, onRemover, mostrarExercicio }) {
  const quando = new Date(a.quando)
  return (
    <article className="anot-item">
      <p className="mudo">{quando.toLocaleDateString('pt-BR')} às {quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{mostrarExercicio && <> · {a.exercicio}</>}</p>
      {(a.sentimentos && a.sentimentos.length > 0) && <p>{a.sentimentos.map((s) => <Selo key={s}>{s}</Selo>)}</p>}
      {a.outros && <p><b>Outros sentimentos:</b> {a.outros}</p>}
      {a.alcancar && <p><b>O que desejo alcançar:</b> {a.alcancar}</p>}
      {a.espiritual && <p><b>Como estou espiritualmente:</b> {a.espiritual}</p>}
      <button className="btn pequeno" onClick={() => { if (window.confirm('Apagar esta anotação?')) onRemover() }}>Apagar</button>
    </article>
  )
}

function RegistroAnotacoes() {
  const { anotacoes, removerAnotacao } = useLoja()
  const lista = anotacoes || []
  return (
    <Shell titulo="Anotações Proféticas">
      <p className="mudo">O histórico de tudo o que você registrou depois dos exercícios, do mais novo ao mais antigo. {SERVIDOR ? 'Fica guardado na sua conta e só você lê.' : 'Fica somente neste aparelho.'}</p>
      {lista.length === 0 && <Aviso>Você ainda não fez nenhuma anotação. Ao terminar um exercício, registre como você estava.</Aviso>}
      <div className="lista">
        {lista.map((a) => <div key={a.id} className="cartao"><AnotacaoItem a={a} mostrarExercicio onRemover={() => removerAnotacao(a.id)} /></div>)}
      </div>
      <div className="botoes"><Link className="btn" to="/sala-quantica">Voltar à Sala Quântica</Link></div>
    </Shell>
  )
}

function Exercicio() {
  const { id } = useParams()
  const { db, tarefas, marcarTarefa } = useLoja()
  const e = db.exercicios.find((x) => x.id === id)
  if (!e) return <Shell titulo="Exercício"><p>Exercício não encontrado.</p><Link className="btn" to="/sala-quantica">Ir para a Sala Quântica</Link></Shell>
  const passos = linhas(e.passos)
  const feito = !!tarefas['ex:' + e.id]
  return (
    <Shell titulo={e.titulo} editar="exercicios">
      <div className="exq-grade">
        <div className="exq-esq">
          <div className="quantica camara exq-camara">
            <Estrelas />
            <div className="quantica-texto">
              <Selo tipo="ouro">{e.tipo}</Selo>{e.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}
              <h3>{e.titulo}</h3>
              <p>{e.ref}</p>
              <Cronometro minutos={Number(e.minutos) || 5} />
            </div>
          </div>
        </div>
        <div className="exq-dir">
          <CenaExercicio id={e.id} titulo={e.titulo} />
        </div>
      </div>

      <div className="cartao exq-info">
        {e.fundamento && <><h3>Fundamento</h3><TextoLongo texto={e.fundamento} /></>}
        {e.serve && <><h3>Para que serve</h3><TextoLongo texto={e.serve} /></>}
        {e.porque && <><h3>Por que ler este salmo</h3><TextoLongo texto={e.porque} /></>}
        {!e.fundamento && !e.serve && !e.porque && <p className="mudo">Fundamento e explicação em breve.</p>}
      </div>

      <div className="cartao">
        <PassosOnda passos={passos} id={e.id} />
      </div>

      <Anotacoes exercicio={e} />

      <div className="cartao">
        <button className={'btn' + (feito ? '' : ' ouro')} onClick={() => marcarTarefa('ex:' + e.id)}>{feito ? 'Concluído ✓ (desfazer)' : 'Concluir exercício · +10 XP'}</button>
      </div>
      <p className="mudo">Estes exercícios são práticas de oração e reflexão. Não substituem o acompanhamento pastoral nem tratamento médico.</p>
    </Shell>
  )
}


/* ───────────── IGREJAS PROTESTANTES ───────────── */
// Fichas curtas: o que é cada igreja, o que defende e os principais grupos. Cada igreja é apresentada como ela mesma se apresenta.

function IgrejasShell({ children }) {
  const { db } = useLoja()
  const [pilha, setPilha] = useState([])
  const termos = db.termosAp || []
  const ctx = useMemo(() => ({ abrir: (id) => setPilha((p) => (termos.some((x) => x.id === id) ? [...p, id] : p)) }), [termos])
  const atual = pilha.length ? termos.find((x) => x.id === pilha[pilha.length - 1]) : null
  return (
    <Shell titulo="Igrejas Protestantes" editar="igrejasProt">
      <TermoCtx.Provider value={ctx}>
        {children}
        {atual && <TermoCartao termo={atual} aoFechar={() => setPilha([])} aoVoltar={() => setPilha((p) => p.slice(0, -1))} podeVoltar={pilha.length > 1} />}
      </TermoCtx.Provider>
    </Shell>
  )
}

const TEXTO_IGR = `{{HISTÓRIA}} A palavra "[[termo:protestante|protestante]]" nasceu do protesto de príncipes alemães em 1529, mas hoje cobre muito mais do que os luteranos. Depois de 1517, a Reforma se dividiu em quatro grandes correntes: a luterana, a reformada, a anglicana e a anabatista. Delas vieram, com o tempo, os batistas, os metodistas, os adventistas e, no século XX, os pentecostais e os neopentecostais. No Brasil, a palavra mais usada para todo esse conjunto é "evangélico".

{{INTERPRETAÇÃO TEOLÓGICA}} O que une quase todas: a Escritura como autoridade final ([[termo:sola-scriptura|Sola Scriptura]]), a salvação pela graça mediante a fé em Cristo ([[termo:sola-fide|Sola Fide]]) e o [[termo:sacerdocio-universal|sacerdócio de todos os crentes]]. O que as separa: o batismo, a Ceia, o modo de entender a salvação, os dons do Espírito Santo e o governo da igreja. As fichas abaixo são resumos curtos, escritos para informar e não para convencer.`

function IgrejasPagina() {
  const { db, lidos, marcarLido } = useLoja()
  const lista = useMemo(() => [...(db.igrejasProt || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [db.igrejasProt])
  const [tema, setTema] = useState('batismo')
  useEffect(() => { marcarLido('igr:sala:panorama') }, [])
  const lida = (x) => !!(lidos && lidos['igr:' + x.id])
  const quantas = lista.filter(lida).length
  const nomeTema = (TEMAS_IGREJAS.find((t) => t.id === tema) || {}).nome
  return (
    <IgrejasShell>
      <h2 className="tab-titulo">Igrejas Protestantes</h2>
      <p className="mudo tab-sub">Quem são, o que defendem e quais são os principais grupos de cada uma.</p>
      <div className="jor-topo ref-topo">
        <ImgViva arquivo="igrejas-protestantes" alt="Sete caminhos de terra que atravessam colinas verdes ao amanhecer e chegam ao mesmo portão de madeira aberto" lado="cheia" fx="nevoa" legenda="Caminhos diferentes, o mesmo Cristo. Cada igreja é apresentada como ela mesma se apresenta." />
        <ApresentaVideo nome="apresenta-igrejas-protestantes" titulo="Igrejas Protestantes" texto="Quem são, o que defendem e quais são os principais grupos de cada igreja, apresentadas como elas mesmas se apresentam, sem caricatura." ajuda="O vídeo de apresentação abre aqui sozinho assim que o arquivo apresenta-igrejas-protestantes.mp4 estiver na pasta public/img." />
      </div>
      <Aviso forte>Cada igreja é apresentada como ela mesma se apresenta, sem caricatura. A Escritura é a medida, e a revelação vem somente de Deus, pelo Espírito Santo.</Aviso>
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_IGR} /></article>
      <h2 className="tab-titulo">As igrejas</h2>
      <p className="mudo tab-sub"><Selo tipo="ouro">{quantas} de {lista.length} fichas lidas</Selo> Toque em uma igreja para abrir a ficha.</p>
      <Organograma
        chave="igrejas"
        titulo="As igrejas protestantes"
        rotulo="Toque em uma igreja para abrir a ficha. Toque no centro para ouvir a Palavra."
        nos={lista.map((x) => ({ id: x.id, titulos: [x.titulo, ...((ORG_IGREJAS_TITULOS[x.id] || []).filter((t) => t !== x.titulo))], titulo: x.titulo, desc: x.familia, verso: ORG_IGREJAS[x.id] || ORG_VERSO_PADRAO, to: '/igrejas-protestantes/' + x.id, extra: lida(x) ? 'ficha lida ✓' : null }))}
      />
      <h2 className="tab-titulo">Compare por tema</h2>
      <p className="mudo tab-sub">Escolha um tema e veja o que cada igreja ensina. As palavras sublinhadas abrem cartões de estudo.</p>
      <div className="abas" role="group" aria-label="Escolher o tema">
        {TEMAS_IGREJAS.map((t) => <button key={t.id} type="button" className={tema === t.id ? 'active' : ''} onClick={() => { setTema(t.id); try { somTique(false) } catch (e) { /* som é opcional */ } }} aria-pressed={tema === t.id}>{t.nome}</button>)}
      </div>
      <GradeTres className="grade ref-mesa-grade" tema="igrejasTema" key={tema}>
        {lista.map((x) => (
          <article key={x.id} className="cartao ref-mesa-cartao">
            <Selo tipo="ouro">{x.titulo.toUpperCase()}</Selo>
            <p aria-label={nomeTema}><Inline t={autoTermos(x[tema])} /></p>
            <Link className="mesa-abrir" to={'/igrejas-protestantes/' + x.id}>Ficha completa →</Link>
          </article>
        ))}
      </GradeTres>
      <Aviso>Todas as fichas são rascunho para revisão. Datas, números de membros, nomes de igrejas e posições marcados "(a conferir)" devem ser conferidos nos documentos oficiais de cada igreja antes de ir ao ar. Cada igreja tem muitas ramificações, e os resumos não substituem a confissão de fé de cada uma.</Aviso>
    </IgrejasShell>
  )
}

function IgrejaDetalhe() {
  const { id } = useParams()
  const { db, marcarLido } = useLoja()
  const lista = useMemo(() => [...(db.igrejasProt || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [db.igrejasProt])
  const pos = lista.findIndex((x) => x.id === id)
  const x = lista[pos]
  useEffect(() => { if (x) marcarLido('igr:' + x.id) }, [id])
  if (!x) return <IgrejasShell><p>Igreja não encontrada.</p><Link className="btn" to="/igrejas-protestantes">Ver as igrejas</Link></IgrejasShell>
  const ant = lista[pos - 1]
  const prox = lista[pos + 1]
  return (
    <IgrejasShell>
      <article className="reportagem-pagina ap-leitura igreja-ficha">
        <div className="igreja-topo">
          <Selo tipo="ouro">{x.familia}</Selo>{x.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}
          <h2>{x.titulo}</h2>
          <p className="mudo">{x.origem}</p>
        </div>
        <FotoRef arquivo={'igreja-' + x.id} alt={'Cena: ' + x.titulo} legenda={x.titulo} />
        <h3 className="sub"><Selo>HISTÓRIA</Selo> O que é</h3>
        <p><Inline t={autoTermos(x.oque)} /></p>
        <h3 className="sub"><Selo>INTERPRETAÇÃO TEOLÓGICA</Selo> O que defende</h3>
        <ListaRef t={autoTermos(x.defende)} />
        <h3 className="sub">Em cinco temas</h3>
        <GradeTres className="grade ref-mesa-grade" tema="igrejasTema">
          {TEMAS_IGREJAS.map((t) => (
            <article key={t.id} className="cartao ref-mesa-cartao">
              <Selo tipo="ouro">{t.nome.toUpperCase()}</Selo>
              <p><Inline t={autoTermos(x[t.id])} /></p>
            </article>
          ))}
        </GradeTres>
        <h3 className="sub">Principais grupos e exemplos</h3>
        <ListaRef t={autoTermos(x.grupos)} />
        <p><b>Tamanho:</b> <Inline t={autoTermos(x.tamanho)} /></p>
        <h3 className="sub"><Selo>INTERPRETAÇÃO TEOLÓGICA</Selo> O que é debatido</h3>
        <p><Inline t={autoTermos(x.debate)} /></p>
        {x.ref && <p className="ref">{x.ref}</p>}
        <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
      </article>
      <div className="botoes igreja-nav">
        {ant ? <Link className="btn" to={'/igrejas-protestantes/' + ant.id}>← {ant.titulo}</Link> : <span />}
        <Link className="btn ouro" to="/igrejas-protestantes">Todas as igrejas</Link>
        {prox ? <Link className="btn" to={'/igrejas-protestantes/' + prox.id}>{prox.titulo} →</Link> : <span />}
      </div>
    </IgrejasShell>
  )
}

/* ───────────── PLANOS E PERFIL ───────────── */

// A figura que sai de cada plano: a imagem, e ao lado o que a Bíblia diz e o aviso de que é uma ilustração nossa.
const AVISO_FIG = 'Ilustração nossa, uma imaginação à luz do texto: a Bíblia não mostra o aspecto exato. Só Deus é adorado, nunca os anjos (Apocalipse 22:8-9).'
const PLANOS_FIG = {
  anjo: {
    img: 'plano-anjo', nome: 'Anjo', rotulo: 'O Anjo, o mensageiro',
    alt: 'Um mensageiro de luz, de vestes brancas resplandecentes e asas amplas, voando no céu azul-claro, com o rosto envolto em claridade',
    linhas: [
      '“Anjo” quer dizer mensageiro: serve a Deus em favor dos herdeiros da salvação (Hebreus 1:14).',
      'Traz boas novas, na glória do Senhor (Lucas 2:9-11).',
      'Aparece com vestes brilhantes (Lucas 24:4).',
    ],
  },
  querubim: {
    img: 'plano-querubim', nome: 'Querubim', rotulo: 'O Querubim, o guardião',
    alt: 'Dois querubins de ouro de asas abertas, voltados um para o outro, com rodas de luz e fogo ao fundo em tons de violeta, rosa e dourado',
    linhas: [
      'Guarda o caminho da árvore da vida (Gênesis 3:24).',
      'Dois querubins de ouro cobrem a arca, e dali Deus fala (Êxodo 25:18-22).',
      'Têm asas e rodas de luz (Ezequiel 1:5-16). Não são bebês alados.',
    ],
  },
  serafim: {
    img: 'plano-serafim', nome: 'Serafim', rotulo: 'O Serafim, o ardente',
    alt: 'Um ser de seis asas de fogo branco e dourado: duas cobrem o rosto, duas cobrem os pés e duas estão abertas, diante de um trono de luz vazio',
    linhas: [
      '“Serafim” quer dizer ardentes: seis asas, acima do trono (Isaías 6:1-2).',
      'Duas asas cobrem o rosto, duas os pés, duas voam (Isaías 6:2).',
      'Clamam: “Santo, Santo, Santo” (Isaías 6:3).',
    ],
  },
}
function PlanoFigura({ id }) {
  const { sessao } = useLoja()
  const f = PLANOS_FIG[id]
  const [ok, setOk] = useState(true)
  if (!f) return null
  const admin = !!(sessao && sessao.admin)
  if (!ok && !admin) return null
  return (
    <div className="plano-fig">
      <div className="pf-linha">
        <figure className="pf-img">
          {ok
            ? <img src={'/img/' + f.img + '.webp'} alt={f.alt} loading="lazy" onError={() => setOk(false)} />
            : <div className="pf-falta" role="note">Imagem a gerar: <b>{f.img}.webp</b></div>}
        </figure>
        <aside className="pf-texto" aria-label={'O que a Bíblia diz sobre o ' + f.nome}>
          <h3>{f.rotulo}</h3>
          <ul>{f.linhas.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </aside>
      </div>
      <p className="pf-aviso" role="note"><b>Aviso:</b> {AVISO_FIG}</p>
    </div>
  )
}

function Planos() {
  const { db, sessao } = useLoja()
  const [liberado, setLiberado] = useState(null)
  return (
    <Shell titulo="Planos" editar="planos">
      {liberado && (
        <div className="assinar assinar-feito" role="status">
          <p><b>Plano {liberado.t} liberado.</b> {liberado.m || '(Pagamento simulado nesta fase.)'}</p>
          <Link className="btn ouro" to="/inicio">Ir para o Início</Link>
        </div>
      )}
      <p className="mudo">Os planos são apenas níveis de acesso ao conteúdo. Nenhum plano torna alguém mais espiritual do que outro.</p>
      <GradeTres className="grade planos" tema="planos">
        {db.planos.map((p) => (
          <article key={p.id} className={'cartao plano plano-' + p.id + (sessao && sessao.plano === p.id ? ' atual' : '')}>
            <PlanoFigura id={p.id} />
            <h2>{p.titulo}</h2>
            <p className="mudo">{p.frase}</p>
            <div className="plano-precos" role="group" aria-label={'Valores do plano ' + p.titulo}>
              <div className="preco preco-sem"><small>Semestral</small><b>{p.precoSemestral || 'em breve'}</b></div>
              <div className="preco preco-anu"><small>Anual</small><b>{p.precoAnual || 'em breve'}</b></div>
            </div>
            {SERVIDOR && ciclosRec(p).length > 0 && <p className="plano-rec">Com renovação automática no cartão: {ciclosRec(p).map((c) => c.nome.toLowerCase() + ' ' + c.preco).join(' · ')}</p>}
            <ul>{linhas(p.recursos).map((r, i) => <li key={i}>✓ {r}</li>)}</ul>
            {sessao && sessao.plano === p.id ? <Selo tipo="ouro">SEU PLANO</Selo> : p.id === 'anjo' ? <Selo>GRATUITO</Selo> : <AssinarCartao p={p} aoLiberar={(t, m) => setLiberado({ t, m })} />}
          </article>
        ))}
      </GradeTres>
    </Shell>
  )
}

function Perfil() {
  const { sessao, mudarPlano, reiniciar, sair, pedidos, entradasSala, cadastros, removerCadastro, definirSessao } = useLoja()
  const nav = useNavigate()
  const p = useProgresso()
  const meu = sessao.email ? (SERVIDOR ? { email: sessao.email, whatsapp: sessao.whatsapp } : (cadastros || []).find((c) => c.email === sessao.email)) : null
  const [pagamentos, setPagamentos] = useState(null)
  const [assin, setAssin] = useState(null)
  const [cancelando, setCancelando] = useState('')
  const [msgAss, setMsgAss] = useState('')
  const carregarAss = () => SB.minhasAssinaturas().then(setAssin).catch(() => setAssin([]))
  useEffect(() => { if (SERVIDOR) { SB.meusPagamentos().then(setPagamentos).catch(() => setPagamentos([])); carregarAss() } }, [])
  const vivas = (assin || []).filter((a) => a.status === 'ativa' || a.status === 'pausada' || (a.status === 'pendente' && Date.now() - new Date(a.criado_em).getTime() < 3 * 3600 * 1000))
  const cancelarAss = async (a) => {
    if (!window.confirm('Cancelar a renovação automática do plano? Você continua com o acesso até o fim do período já pago' + (sessao.planoAte ? ' (' + dataBR(sessao.planoAte) + ')' : '') + ' e não será cobrado de novo.')) return
    setCancelando(a.id); setMsgAss('')
    try { await SB.cancelarAssinatura(a.id); setMsgAss('Renovação automática cancelada. Você não será cobrado de novo.'); await carregarAss() } catch (e) { setMsgAss(e.message) } finally { setCancelando('') }
  }
  const excluir = async () => {
    if (!window.confirm('Excluir o meu cadastro e sair? Esta ação não pode ser desfeita.')) return
    if (SERVIDOR) { try { await SB.excluirConta() } catch (e) { window.alert(e.message); return } nav('/'); definirSessao(null); return }
    removerCadastro(meu.email)
    nav('/')
  }
  return (
    <Shell titulo="Meu Perfil">
      <div className="cartao saudacao"><Avatar /><div><h2>{sessao.nome}</h2><p>Plano <Selo tipo="ouro">{sessao.plano.toUpperCase()}</Selo>{sessao.planoAte && sessao.plano !== 'anjo' ? ' válido até ' + dataBR(sessao.planoAte) : ''}</p><p>{p.xp} XP · {p.feitas}/{p.total} tarefas · {p.pct}% da Montanha Profética</p>
      </div></div>
      {SERVIDOR && (vivas.length > 0 || msgAss) && (
        <div className="cartao">
          <h3>Renovação automática</h3>
          {msgAss && <p className="assinar-ok" role="status">{msgAss}</p>}
          {vivas.map((a) => (
            <div key={a.id} className="assinatura-linha">
              <p>Plano {a.plano === 'serafim' ? 'Serafim' : 'Querubim'} · {reaisCent(a.valor_centavos)} {a.ciclo === 'mensal' ? 'por mês' : a.ciclo === 'semestral' ? 'a cada 6 meses' : 'a cada 12 meses'} · <b>{a.status === 'ativa' ? 'ativa' : a.status === 'pausada' ? 'pausada' : 'aguardando a sua autorização no Mercado Pago'}</b>{a.status === 'ativa' && a.proxima_cobranca ? ' · próxima cobrança por volta de ' + dataBR(a.proxima_cobranca) : ''}</p>
              <button type="button" className="btn" disabled={cancelando === a.id} onClick={() => cancelarAss(a)}>{cancelando === a.id ? 'Cancelando…' : 'Cancelar renovação automática'}</button>
            </div>
          ))}
        </div>
      )}
      {SERVIDOR && <MeuFinanciamento />}
      {SERVIDOR && <MeusCursos />}
      {SERVIDOR && (
        <div className="cartao">
          <h3>Meus pagamentos</h3>
          {pagamentos === null ? <p className="mudo">Carregando…</p> : pagamentos.length === 0 ? <p className="mudo">Nenhum pagamento ainda.</p> : pagamentos.map((x) => (
            <p key={x.id}>{dataBR(String(x.criado_em).slice(0, 10))} · {x.origem === 'curso' ? 'Curso: ' + (x.curso_titulo || x.curso_id) : x.origem === 'livro' ? (x.livro_formato === 'fisico' ? 'Livro físico: ' : 'PDF: ') + (x.livro_titulo || x.livro_id) : <>Plano {x.plano === 'serafim' ? 'Serafim' : 'Querubim'} ({x.periodo}{x.origem === 'recorrente' ? ', renovação automática' : x.origem === 'parcela' ? ', financiamento' : ''})</>} · {reaisCent(x.valor_centavos)} · {NOME_STATUS_PG[x.status] || x.status}{x.plano_ate && (x.status === 'aprovado' || x.status === 'gratis') ? ' · até ' + dataBR(x.plano_ate) : ''}{x.status === 'pendente' ? <> · <Link to={'/pagamento-retorno?pg=' + x.id}>conferir</Link></> : null}</p>
          ))}
        </div>
      )}
      <div className="cartao">
        <h3>Meus pedidos</h3>
        {pedidos.length === 0 ? <p className="mudo">Nenhum pedido ainda.</p> : pedidos.map((x) => <p key={x.id}><Link to={'/pedido/' + x.id}>{x.titulo} · {nomeFormato(x.formato)} · {x.status}</Link></p>)}
      </div>
      {meu && (
        <div className="cartao">
          <h3>Meu cadastro</h3>
          <p>{meu.email} · {zapBonito(meu.whatsapp)}</p>
          <p className="mudo">Usamos o e-mail e o WhatsApp só para enviar comunicados do Ministério Avivar.</p>
          <button className="btn" onClick={excluir}>Excluir meu cadastro</button>
        </div>
      )}
      <div className="cartao form">
        <h3>{SERVIDOR ? 'Conta' : 'Demonstração'}</h3>
        {!SERVIDOR && <label>Trocar de plano para testar
          <select value={sessao.plano} onChange={(e) => mudarPlano(e.target.value)}><option value="anjo">Anjo</option><option value="querubim">Querubim</option><option value="serafim">Serafim</option></select>
        </label>}
        <div className="botoes">
          {!SERVIDOR && <button className="btn" onClick={() => { if (window.confirm('Apagar todos os dados de demonstração deste aparelho?')) { reiniciar(); nav('/') } }}>Reiniciar a demonstração</button>}
          <button className="btn" onClick={() => { sair(); nav('/') }}>Sair</button>
        </div>
      </div>
    </Shell>
  )
}

/* ───────────── ADMIN ───────────── */

function Formulario({ campos, valor, onSalvar, onCancelar, cursos }) {
  const [v, setV] = useState(valor)
  const mudar = (k, x) => setV({ ...v, [k]: x })
  return (
    <form className="cartao form" onSubmit={(e) => { e.preventDefault(); onSalvar(v) }}>
      {campos.map(([k, t, tipo, ops]) => {
        if (tipo === 'bool') return <label key={k} className="check"><input type="checkbox" checked={!!v[k]} onChange={(e) => mudar(k, e.target.checked)} /> {t}</label>
        if (tipo === 'area') return <label key={k}>{t}<textarea rows="4" value={v[k] || ''} onChange={(e) => mudar(k, e.target.value)} /></label>
        if (tipo === 'longo') return <label key={k}>{t}<textarea rows="18" value={v[k] || ''} onChange={(e) => mudar(k, e.target.value)} /></label>
        if (tipo === 'sel') return <label key={k}>{t}<select value={v[k] || ops[0]} onChange={(e) => mudar(k, e.target.value)}>{ops.map((o) => <option key={o}>{o}</option>)}</select></label>
        if (tipo === 'curso') return <label key={k}>{t}<select value={v[k] || ''} onChange={(e) => mudar(k, e.target.value)}><option value="">Escolha o curso</option>{cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}</select></label>
        return <label key={k}>{t}<input value={v[k] || ''} onChange={(e) => mudar(k, e.target.value)} /></label>
      })}
      <div className="botoes"><button className="btn ouro">Salvar</button>{onCancelar && <button type="button" className="btn" onClick={onCancelar}>Cancelar</button>}</div>
    </form>
  )
}

function Admin() {
  const { col = SERVIDOR ? 'acesso-livros' : 'livros' } = useParams()
  const { db, pedidos, cadastros, salvarItem, removerItem, salvarConfig } = useLoja()
  const [ed, setEd] = useState(null)
  const [salvo, setSalvo] = useState(false)
  useEffect(() => { setEd(null); setSalvo(false) }, [col])
  const esq = ESQUEMAS[col]
  const novo = () => {
    const base = {}
    esq.campos.forEach(([k, , tipo, ops]) => { base[k] = tipo === 'bool' ? false : tipo === 'sel' ? ops[0] : '' })
    setEd(base)
  }
  const salvar = (item) => {
    const primeiro = esq.campos.find(([, , tipo]) => !tipo)
    salvarItem(col, { ...item, id: item.id || (slug(primeiro ? item[primeiro[0]] : '') || 'item') + '-' + novoId() })
    setEd(null)
  }
  return (
    <Shell titulo="Painel do admin">
      {SERVIDOR
        ? <Aviso>O que você editar aqui é salvo no servidor e vale para todos. Exceção por enquanto: os pedidos de livros (passam para o servidor na etapa 4B). Cupons, pagamentos, renovações automáticas e financiamentos já ficam no servidor. Veja o estado em "Edições no servidor".</Aviso>
        : <Aviso>Demonstração: o que você editar aqui fica salvo só neste aparelho. Na Fase 1 passa a valer para todos os usuários.</Aviso>}
      <div className="abas">
        {SERVIDOR && <NavLink to="/admin/acesso-livros">Livros Avivar</NavLink>}
        {Object.keys(ESQUEMAS).filter((k) => k !== 'livros').map((k) => <NavLink key={k} to={'/admin/' + k}>{ESQUEMAS[k].nome}</NavLink>)}
        <NavLink to="/admin/cadastros">Cadastros ({(cadastros || []).length})</NavLink>
        <NavLink to="/admin/cupons">Cupons e assinaturas</NavLink>
        {SERVIDOR && <NavLink to="/admin/contrato">Contrato</NavLink>}
        {SERVIDOR && <NavLink to="/admin/financiamentos">Financiamentos</NavLink>}
        <NavLink to="/admin/espirito">Códigos do Espírito</NavLink>
        <NavLink to="/admin/protegido">Conteúdo protegido</NavLink>
        {SERVIDOR && <NavLink to="/admin/edicoes">Edições no servidor</NavLink>}
        <NavLink to="/admin/config">Textos e etiquetas</NavLink>
        <NavLink to="/admin/pedidos">Pedidos ({pedidos.length})</NavLink>
      </div>
      {col === 'cupons' && (SERVIDOR ? <CuponsServidor /> : <CuponsAdmin />)}
      {col === 'contrato' && SERVIDOR && <ContratoAdmin />}
      {col === 'financiamentos' && SERVIDOR && <FinanciamentosAdmin />}
      {col === 'cadastros' && <CadastrosAdmin />}
      {col === 'acesso-livros' && SERVIDOR && <Suspense fallback={<p className="mudo">Carregando…</p>}><LvAdmin cursos={db.cursos} /></Suspense>}
      {col === 'espirito' && <EspiritoAdmin />}
      {col === 'protegido' && <ProtegidoAdmin />}
      {col === 'edicoes' && <EdicoesAdmin />}
      {col === 'config' && <><Formulario key="config" campos={CAMPOS_CONFIG} valor={db.config} onSalvar={(c) => { salvarConfig(c); setSalvo(true) }} />{salvo && <Aviso>Salvo.</Aviso>}</>}
      {col === 'pedidos' && (
        <div className="lista">
          {pedidos.length === 0 && <p className="mudo">Nenhum pedido ainda.</p>}
          {pedidos.map((p) => <Link key={p.id} className="cartao item-linha" to={'/pedido/' + p.id}>{p.data} · {p.titulo} · {nomeFormato(p.formato)} · {p.status} · {p.dados.nome} {p.formato === 'fisico' && p.status === 'pago' && <Selo tipo="ouro">VER FICHA E ETIQUETAS</Selo>}</Link>)}
        </div>
      )}
      {esq && (ed
        ? <Formulario key={ed.id || 'novo'} campos={esq.campos} valor={ed} cursos={db.cursos} onSalvar={salvar} onCancelar={() => setEd(null)} />
        : <>
            <button className="btn ouro" onClick={novo}>+ Incluir em {esq.nome}</button>
            <div className="lista">
              {db[col].map((i) => (
                <div key={i.id} className="cartao item-linha">
                  <span>{i.titulo || i.id}</span>
                  <span className="botoes">
                    <button className="btn" onClick={() => setEd(i)}>Editar</button>
                    <button className="btn" onClick={() => { if (window.confirm('Remover "' + (i.titulo || i.id) + '"?')) removerItem(col, i.id) }}>Remover</button>
                  </span>
                </div>
              ))}
            </div>
          </>)}
      {!esq && !['config', 'pedidos', 'cupons', 'cadastros', 'espirito', 'protegido', 'edicoes', 'contrato', 'financiamentos', 'acesso-livros'].includes(col) && <p>Seção não encontrada.</p>}
    </Shell>
  )
}

/* ───────────── CÓDIGOS DO ESPÍRITO: quem tem acesso (admin) ───────────── */
function EspiritoAdmin() {
  const { db, salvarConfig } = useLoja()
  const c = db.config || {}
  const linhas = [
    ['serafim', 'Serafim', null],
    ['querubim', 'Querubim', 'espiritoQuerubim'],
    ['anjo', 'Anjo (grátis)', 'espiritoAnjo'],
  ]
  const mudar = (chave, valor) => salvarConfig({ ...c, [chave]: valor })
  return (
    <div className="cartao">
      <h3>Códigos do Espírito: quem pode entrar</h3>
      <p className="mudo">O plano Serafim e o admin sempre têm acesso. Para os outros planos, clique em <b>Liberar acesso</b> e a área abre para todos os assinantes daquele plano; clique em <b>Bloquear</b> para fechar de novo. Vale na hora, para todos os aparelhos.</p>
      <div className="lista">
        {linhas.map(([plano, nome, chave]) => {
          const livre = chave ? c[chave] === 'sim' : true
          return (
            <div key={plano} className="cartao item-linha">
              <span><b>{nome}</b> · {livre ? 'com acesso' : 'sem acesso (vê o cadeado)'}</span>
              <span className="botoes">
                {!chave
                  ? <span className="mudo">sempre liberado</span>
                  : livre
                    ? <button type="button" className="btn" onClick={() => mudar(chave, 'não')}>Bloquear plano {nome.split(' ')[0]}</button>
                    : <button type="button" className="btn ouro" onClick={() => mudar(chave, 'sim')}>Liberar acesso ao plano {nome.split(' ')[0]}</button>}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mudo">Atenção: isto controla a entrada pelo app. O conteúdo desta área ainda é o mesmo para todos no código do app (diferente dos textos protegidos pelo servidor).</p>
    </div>
  )
}

/* ───────────── EDIÇÕES NO SERVIDOR (admin) ───────────── */
// Mostra o estado do envio das edições e permite levar para o servidor o que o admin já tinha editado neste aparelho.
const NOME_TIPO = { alterado: 'Alterado', novo: 'Novo', removido: 'Removido' }
function EdicoesAdmin() {
  const { db } = useLoja()
  const [sync, setSync] = useState({ pendentes: 0, erro: '', enviando: false })
  const [rows, setRows] = useState(null)
  const [lista, setLista] = useState(null)
  const [marc, setMarc] = useState({})
  const [msg, setMsg] = useState('')
  useEffect(() => ouvir(setSync), [])
  useEffect(() => { if (SERVIDOR) SB.edicoesBaixar().then(setRows).catch(() => setRows(null)) }, [sync.pendentes])
  const procurar = () => { setLista(diffLocal(db, SEED, rows || [])); setMarc({}); setMsg('') }
  const chave = (x) => x.col + '/' + x.id
  const n = lista ? lista.filter((x) => marc[chave(x)]).length : 0
  const enviar = () => {
    const f = lista.filter((x) => marc[chave(x)])
    enviarLote(f)
    setMsg(f.length + ' alterações enviadas. O estado do envio aparece acima.')
    setLista(null); setMarc({})
  }
  if (!SERVIDOR) return <Aviso>Esta área só funciona com o servidor ligado (Supabase).</Aviso>
  return (
    <div className="cartao protegido-admin">
      <h3>Edições no servidor</h3>
      <p className="mudo">Tudo o que você cria, muda ou remove nas abas do Admin é enviado ao servidor na hora e passa a valer para todos os usuários. Os pedidos de livros ainda ficam só neste aparelho (etapa 4B). Os cupons já ficam no servidor.</p>
      <ul className="protegido-lista">
        <li>Edições guardadas no servidor: <b>{rows === null ? '…' : rows.length}</b></li>
        <li>Envio agora: {sync.erro ? <b className="falta">com problema: {sync.erro} Vou tentar de novo sozinho.</b> : sync.pendentes ? <b>enviando {sync.pendentes}…</b> : <b className="ok">tudo salvo</b>}</li>
      </ul>
      <h4>Levar para o servidor o que eu editei antes</h4>
      <p className="mudo">Se você já editou vídeos, preços, livros ou textos neste navegador antes da etapa 3, procure as diferenças e escolha o que enviar. Marque só o que foi você que mudou.</p>
      <button type="button" className="btn" onClick={procurar}>Procurar diferenças neste aparelho</button>
      {lista && (lista.length === 0
        ? <p role="status">Nada diferente do conteúdo original. Não há o que enviar.</p>
        : <>
            <p>{lista.length} {lista.length === 1 ? 'item diferente' : 'itens diferentes'} do conteúdo original:</p>
            <div className="botoes">
              <button type="button" className="btn pequeno" onClick={() => setMarc(Object.fromEntries(lista.map((x) => [chave(x), true])))}>Marcar todos</button>
              <button type="button" className="btn pequeno" onClick={() => setMarc({})}>Desmarcar todos</button>
            </div>
            <ul className="edicoes-lista">
              {lista.map((x) => (
                <li key={chave(x)}><label className="check"><input type="checkbox" checked={!!marc[chave(x)]} onChange={(e) => setMarc({ ...marc, [chave(x)]: e.target.checked })} /> <b>{NOME_TIPO[x.tipo]}</b> · {(ESQUEMAS[x.col] && ESQUEMAS[x.col].nome) || x.col} · {x.titulo}</label></li>
              ))}
            </ul>
            <button type="button" className="btn ouro" disabled={!n} onClick={enviar}>Enviar {n} {n === 1 ? 'marcado' : 'marcados'} para o servidor</button>
          </>)}
      {msg && <p role="status" className="protegido-msg">{msg}</p>}
    </div>
  )
}

// Aviso discreto, só para o admin: mostra se as edições foram salvas no servidor.
function AvisoSincronia() {
  const { sessao } = useLoja()
  const [sync, setSync] = useState({ pendentes: 0, erro: '', enviando: false })
  const [ok, setOk] = useState(false)
  const antes = useRef(0)
  useEffect(() => ouvir(setSync), [])
  useEffect(() => {
    if (antes.current > 0 && sync.pendentes === 0 && !sync.erro) { setOk(true); const t = setTimeout(() => setOk(false), 2800); antes.current = 0; return () => clearTimeout(t) }
    antes.current = sync.pendentes
    return undefined
  }, [sync.pendentes, sync.erro])
  if (!SERVIDOR || !sessao || !sessao.admin) return null
  if (sync.erro) return <div className="sync-pill erro" role="alert">Não consegui salvar no servidor ({sync.pendentes} pendente{sync.pendentes === 1 ? '' : 's'}). Tentando de novo…</div>
  if (sync.pendentes) return <div className="sync-pill" role="status">Salvando no servidor…</div>
  return ok ? <div className="sync-pill ok" role="status">Salvo no servidor ✓</div> : null
}

/* ───────────── CONTEÚDO PROTEGIDO (admin) ───────────── */
// Os textos completos ficam no servidor. Aqui o admin envia o arquivo de conteúdo (.json) que acompanha cada entrega.
function ProtegidoAdmin() {
  const [noServidor, setNoServidor] = useState(null)
  const [msg, setMsg] = useState('')
  const [arq, setArq] = useState(null)
  const [prog, setProg] = useState(null)
  const conferir = async () => {
    try { setNoServidor(new Set(await SB.conteudoIds())); setMsg('') } catch (e) { setMsg('Não foi possível consultar o servidor: ' + e.message) }
  }
  useEffect(() => { if (SERVIDOR) conferir() }, [])
  const faltam = noServidor ? IDS.filter((i) => !noServidor.has(i)).length : null
  const escolher = async (e) => {
    const f = e.target.files && e.target.files[0]
    setArq(null); setMsg('')
    if (!f) return
    try {
      const j = JSON.parse(await f.text())
      const itens = j && j.itens
      if (!itens || typeof itens !== 'object') throw new Error('formato')
      const ids = Object.keys(itens)
      if (!ids.length) throw new Error('vazio')
      if (ids.some((id) => idDe(String(itens[id])) !== id)) throw new Error('integridade')
      setArq({ itens, total: ids.length, nome: f.name })
    } catch (x) {
      setMsg(x.message === 'integridade' ? 'Este arquivo está alterado ou corrompido. Baixe de novo o arquivo de conteúdo e tente outra vez.' : 'Este não parece ser o arquivo de conteúdo (.json) que acompanha a entrega.')
    }
  }
  const publicar = async () => {
    if (!arq) return
    const ids = Object.keys(arq.itens)
    setMsg('')
    try {
      for (let i = 0; i < ids.length; i += 40) {
        setProg(Math.round((i / ids.length) * 100))
        await SB.conteudoPublicar(ids.slice(i, i + 40).map((id) => ({ id, texto: arq.itens[id] })))
      }
      setProg(null); setArq(null)
      setMsg('Pronto: ' + ids.length + ' trechos publicados no servidor.')
      await conferir()
    } catch (x) { setProg(null); setMsg('A publicação parou: ' + x.message + ' Pode tentar de novo; o que já foi enviado não se perde.') }
  }
  if (!SERVIDOR) return <Aviso>Esta área só funciona com o servidor ligado (Supabase).</Aviso>
  return (
    <div className="cartao protegido-admin">
      <h3>Conteúdo protegido no servidor</h3>
      <p className="mudo">Os estudos completos ficam guardados no servidor e só chegam a quem tem plano Querubim ou Serafim (e ao admin). Sem o plano, aparece só o começo de cada texto.</p>
      <ul className="protegido-lista">
        <li>Proteção nesta versão do site: <b>{PROT_ATIVO ? 'ligada' : 'desligada (versão completa, para testes)'}</b></li>
        <li>Trechos que o site precisa: <b>{IDS.length}</b></li>
        <li>Trechos no servidor: <b>{noServidor ? noServidor.size : '…'}</b></li>
        {PROT_ATIVO && faltam !== null && <li>{faltam === 0 ? <b className="ok">Tudo publicado: os assinantes recebem os textos completos.</b> : <b className="falta">Faltam {faltam} trechos no servidor. Envie o arquivo de conteúdo abaixo.</b>}</li>}
      </ul>
      <label className="protegido-arq">Arquivo de conteúdo (.json) desta entrega
        <input type="file" accept=".json,application/json" onChange={escolher} disabled={prog !== null} />
      </label>
      {arq && <p>Arquivo <b>{arq.nome}</b>: {arq.total} trechos prontos. <button type="button" className="btn ouro" onClick={publicar} disabled={prog !== null}>Publicar no servidor</button></p>}
      {prog !== null && <p role="status">Enviando… {prog}%</p>}
      {msg && <p role="status" className="protegido-msg">{msg}</p>}
      <p><button type="button" className="btn" onClick={conferir}>Conferir de novo</button></p>
    </div>
  )
}

/* ───────────── TÁBUA DOS APÓCRIFOS ───────────── */
// Etapa 1: Câmara dos Rolos, Balança do Cânone, Enoque, Mitos e Fatos, Glossário e painel de demonstrações (admin).
// Todo som é sintetizado no aparelho (Web Audio): vento, gotas, papiro, cera, sinos, pesos. Sem vozes e sem cantos.

const NOTAS_BADALADA = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5, 1174.66]
function sino(c, t, f, vol = 0.12, dur = 2.2) {
  ;[[1, 1], [2.76, 0.4], [5.4, 0.18]].forEach(([m, v]) => {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * m
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / Math.pow(m, 0.3))
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.1)
  })
}
const somBadalada = (i = 0) => comSom((c, t) => sino(c, t, NOTAS_BADALADA[i % NOTAS_BADALADA.length]))
const somPeso = (i = 0) => comSom((c, t) => {
  ;[820 + i * 70, 1230 + i * 90].forEach((f, k) => {
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11 / (k + 1), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.55)
  })
})
function somSelo() {
  comSom((c, t) => {
    const r = ruidoCurto(c, 0.12); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    r.connect(hp); hp.connect(g); g.connect(c.destination); r.start(t); r.stop(t + 0.13)
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.2)
    const go = c.createGain(); go.gain.setValueAtTime(0.0001, t); go.gain.linearRampToValueAtTime(0.35, t + 0.01); go.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    o.connect(go); go.connect(c.destination); o.start(t); o.stop(t + 0.32)
  })
  try { if (navigator.vibrate) navigator.vibrate(25) } catch (e) { /* sem vibração */ }
}
const somPapiro = () => comSom((c, t) => {
  const r = ruidoCurto(c, 0.7); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9
  bp.frequency.setValueAtTime(900, t); bp.frequency.linearRampToValueAtTime(2400, t + 0.6)
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1, t + 0.12); g.gain.linearRampToValueAtTime(0.03, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
  r.connect(bp); bp.connect(g); g.connect(c.destination); r.start(t); r.stop(t + 0.7)
})
const somQueda = () => comSom((c, t) => {
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.22)
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.35)
})
const somPasso = () => comSom((c, t) => {
  const r = ruidoCurto(c, 0.1); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
  r.connect(lp); lp.connect(g); g.connect(c.destination); r.start(t); r.stop(t + 0.11)
})
const somTique = (acento = false) => comSom((c, t) => {
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = acento ? 1900 : 1450
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.06)
})
const somTrovao = () => comSom((c, t) => {
  const r = ruidoCurto(c, 2.6); const lp = c.createBiquadFilter(); lp.type = 'lowpass'
  lp.frequency.setValueAtTime(420, t); lp.frequency.exponentialRampToValueAtTime(60, t + 2.4)
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.28, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5)
  r.connect(lp); lp.connect(g); g.connect(c.destination); r.start(t); r.stop(t + 2.6)
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 46
  const go = c.createGain(); go.gain.setValueAtTime(0.0001, t); go.gain.linearRampToValueAtTime(0.18, t + 0.4); go.gain.exponentialRampToValueAtTime(0.0001, t + 2.6)
  o.connect(go); go.connect(c.destination); o.start(t); o.stop(t + 2.7)
})
const ACORDES_ALVORADA = [[196, 293.66, 392], [220, 329.63, 440], [246.94, 369.99, 493.88], [261.63, 392, 523.25]]
const somAlvorada = (k = 0) => comSom((c, t) => {
  ACORDES_ALVORADA[k % 4].forEach((f, i) => {
    ;['sine', 'triangle'].forEach((tp, j) => {
      const o = c.createOscillator(); o.type = tp; o.frequency.value = f * (j ? 2 : 1)
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime((j ? 0.025 : 0.07) / (i + 1), t + 2.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 6.2)
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 6.3)
    })
  })
})

// Cartões de termo: toda palavra sublinhada abre um cartão com o que é, os fundamentos e como a fé cristã a avalia.
const TermoCtx = createContext(null)
function Inline({ t }) {
  const ctx = useContext(TermoCtx)
  const s = String(t == null ? '' : t)
  if (!s.includes('[[termo:')) return s
  return (
    <>
      {s.split(/(\[\[termo:[a-z0-9-]+\|[^\]]+\]\])/g).map((p, i) => {
        const m = p.match(/^\[\[termo:([a-z0-9-]+)\|([^\]]+)\]\]$/)
        if (!m) return p ? <React.Fragment key={i}>{p}</React.Fragment> : null
        return ctx
          ? <button key={i} type="button" className="ap-termo" onClick={() => ctx.abrir(m[1])} aria-haspopup="dialog">{m[2]}</button>
          : <React.Fragment key={i}>{m[2]}</React.Fragment>
      })}
    </>
  )
}

function TermoCartao({ termo, aoFechar, aoVoltar, podeVoltar }) {
  const linhasF = String(termo.fundamentos || '').split('\n').map((l) => l.trim()).filter(Boolean)
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') aoFechar() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [aoFechar])
  return createPortal(
    <div className="ap-termo-fundo" role="dialog" aria-modal="true" aria-label={'Termo: ' + termo.titulo} onClick={aoFechar}>
      <article className="ap-termo-cartao" onClick={(e) => e.stopPropagation()}>
        <header>
          <Selo tipo="ouro">{termo.etiqueta || 'HISTÓRIA'}</Selo>{termo.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}
          <h3>{termo.titulo}</h3>
        </header>
        <div className="ap-termo-corpo">
          <h4>O que é</h4>
          <p><Inline t={termo.oque} /></p>
          {linhasF.length > 0 && <>
            <h4>Fundamentos</h4>
            <ul>{linhasF.map((l, i) => <li key={i}><Inline t={l.replace(/^•\s*/, '')} /></li>)}</ul>
          </>}
          {termo.avaliacao && <>
            <h4><Selo>INTERPRETAÇÃO TEOLÓGICA</Selo> Como a fé cristã avalia</h4>
            <p><Inline t={termo.avaliacao} /></p>
          </>}
          {termo.ref && <p className="ref">{termo.ref}</p>}
          <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
        </div>
        <footer className="botoes">
          {podeVoltar && <button type="button" className="btn" onClick={aoVoltar}>← Voltar</button>}
          <button type="button" className="btn ouro" autoFocus onClick={aoFechar}>Fechar</button>
        </footer>
      </article>
    </div>,
    document.body
  )
}

const SALAS_AP = [
  ['/tabua-dos-apocrifos', 'Câmara dos Rolos'], ['/tabua-dos-apocrifos/balanca', 'Balança do Cânone'], ['/tabua-dos-apocrifos/enoque', 'Livro de Enoque'],
  ['/tabua-dos-apocrifos/evangelhos', 'Evangelhos fora do cânon'], ['/tabua-dos-apocrifos/biblia-etiope', 'Bíblia Etíope'],
  ['/tabua-dos-apocrifos/mitos', 'Mitos e Fatos'], ['/tabua-dos-apocrifos/glossario', 'Glossário'],
]
function TabuaShell({ editar = 'termosAp', children }) {
  const { db, sessao } = useLoja()
  const loc = useLocation()
  const [pilha, setPilha] = useState([])
  const termos = db.termosAp || []
  const ctx = useMemo(() => ({ abrir: (id) => setPilha((p) => (termos.some((x) => x.id === id) ? [...p, id] : p)) }), [termos])
  const atual = pilha.length ? termos.find((x) => x.id === pilha[pilha.length - 1]) : null
  return (
    <Shell titulo="Tábua dos Apócrifos" editar={editar}>
      <TermoCtx.Provider value={ctx}>
        <nav className="abas ap-abas" aria-label="Salas da Tábua dos Apócrifos">
          {SALAS_AP.map(([to, t]) => <Link key={to} to={to} className={loc.pathname === to ? 'active' : ''} aria-current={loc.pathname === to ? 'page' : undefined}>{t}</Link>)}
          {sessao && sessao.admin && <Link to="/tabua-dos-apocrifos/painel" className={loc.pathname.endsWith('/painel') ? 'active' : ''}>Painel de demonstrações</Link>}
        </nav>
        {children}
        {atual && <TermoCartao termo={atual} aoFechar={() => setPilha([])} aoVoltar={() => setPilha((p) => p.slice(0, -1))} podeVoltar={pilha.length > 1} />}
      </TermoCtx.Provider>
    </Shell>
  )
}
function useVisita(id) {
  const { marcarLido } = useLoja()
  useEffect(() => { marcarLido('ap:sala:' + id) }, [id])
}

// ícones dos rolos (traço simples; sem símbolos ocultistas)
function IconeAp({ tipo }) {
  const d = {
    rolo: <><rect x="14" y="16" width="36" height="32" rx="3" /><ellipse cx="14" cy="32" rx="5" ry="16" /><ellipse cx="50" cy="32" rx="5" ry="16" /><path d="M22 26h20M22 32h20M22 38h14" /></>,
    jarro: <><path d="M24 10h16v7c9 4 13 12 13 21 0 9-7 15-21 15S11 47 11 38c0-9 4-17 13-21z" /><path d="M20 10h24M13 36h38" /></>,
    balanca: <><path d="M32 8v42M16 50h32M10 20h44" /><path d="M10 20l-6 16h24zM54 20l-6 16h24z" transform="translate(0 0)" /></>,
    tabua: <><rect x="16" y="8" width="32" height="46" rx="9" /><path d="M24 22h16M24 30h16M24 38h10" /></>,
    codice: <><rect x="14" y="10" width="36" height="44" rx="3" /><path d="M22 10v44M30 22h14M30 30h14" /></>,
    selo: <><path d="M22 28v-6a10 10 0 0120 0v6" /><rect x="16" y="28" width="32" height="24" rx="3" /></>,
  }
  return <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d[tipo] || d.rolo}</svg>
}

const ROLOS_AP = [
  { id: 'glossario', to: '/tabua-dos-apocrifos/glossario', titulo: 'Glossário', sub: 'O que é cada termo, com fundamentos', icone: 'tabua', x: 16, y: 24 },
  { id: 'balanca', to: '/tabua-dos-apocrifos/balanca', titulo: 'Balança do Cânone', sub: 'Como um livro entra na Bíblia', icone: 'balanca', x: 22, y: 55 },
  { id: 'enoque', to: '/tabua-dos-apocrifos/enoque', titulo: 'O Livro de Enoque', sub: 'Cinco livros, cinco instrumentos', icone: 'jarro', x: 50, y: 40, grande: true },
  { id: 'mitos', to: '/tabua-dos-apocrifos/mitos', titulo: 'Mitos e Fatos', sub: 'O que se diz e o que a História mostra', icone: 'rolo', x: 78, y: 55 },
  { id: 'etiope', to: '/tabua-dos-apocrifos/biblia-etiope', titulo: 'A Bíblia Etíope', sub: 'Os livros da estante da Etiópia', icone: 'selo', x: 84, y: 22 },
  { id: 'evangelhos', to: '/tabua-dos-apocrifos/evangelhos', titulo: 'Os Evangelhos fora do cânon', sub: 'Onze livros na mesa de exame', icone: 'codice', x: 22, y: 81 },
  { id: 'emblemas', titulo: 'Sala dos Emblemas', sub: 'etapa 3', icone: 'selo', x: 78, y: 81, trava: true },
]
const TEXTO_ENTRADA_AP = `{{HISTÓRIA}} Esta Tábua é um arquivo de estudo sobre os livros que ficaram fora da Bíblia. Muitos são chamados de [[termo:apocrifo|apócrifos]]. Cada sala mostra de onde o livro veio, o que diz, onde concorda com a Bíblia, onde difere, e por que não entrou no [[termo:canone|cânon]].

{{INTERPRETAÇÃO TEOLÓGICA}} Muitos desses livros levam o nome de um grande personagem do passado, o que se chama [[termo:pseudepigrafia|pseudepigrafia]]. Alguns são [[termo:gnosticismo|gnósticos]] e ensinam coisas contrárias à fé cristã. Em cada termo sublinhado, toque para abrir um cartão que explica o que é, quais são os seus fundamentos e como a fé cristã o avalia.`

function TabuaEntrada() {
  const { lidos, sessao } = useLoja()
  const nav = useNavigate()
  const cena = useRef(null)
  const itens = useRef({})
  const lant = useRef({ x: 0, y: 0, mexeu: false })
  const [rompendo, setRompendo] = useState(null)
  const [tremer, setTremer] = useState(null)
  const parado = parouMovimento()
  const raio = () => (typeof window !== 'undefined' && window.innerWidth < 700 ? 150 : 210)
  const pintar = () => {
    const c = cena.current
    if (!c) return
    const { x, y } = lant.current
    const R = raio(), w = c.clientWidth, h = c.clientHeight
    c.style.setProperty('--lx', x + 'px'); c.style.setProperty('--ly', y + 'px'); c.style.setProperty('--raio', R + 'px')
    ROLOS_AP.forEach((r) => {
      const el = itens.current[r.id]
      if (!el) return
      const k = Math.max(0, 1 - Math.hypot((r.x / 100) * w - x, (r.y / 100) * h - y) / (R * 1.1))
      el.style.opacity = String(parado ? 0.95 : 0.3 + 0.7 * k)
    })
  }
  useEffect(() => {
    const c = cena.current
    lant.current = { x: c.clientWidth * 0.5, y: c.clientHeight * 0.52, mexeu: false }
    pintar()
    const rz = () => pintar()
    window.addEventListener('resize', rz)
    let raf = 0
    if (!parado) {
      const ini = performance.now()
      const f = (n) => {
        if (!lant.current.mexeu) {
          const w = c.clientWidth, h = c.clientHeight, t = n - ini
          lant.current.x = w * (0.5 + 0.36 * Math.sin(t * 0.00042)); lant.current.y = h * (0.52 + 0.3 * Math.sin(t * 0.00031 + 1))
          pintar()
        }
        raf = requestAnimationFrame(f)
      }
      raf = requestAnimationFrame(f)
    }
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', rz) }
  }, [])
  const mover = (e) => {
    const r = cena.current.getBoundingClientRect()
    lant.current = { x: e.clientX - r.left, y: e.clientY - r.top, mexeu: true }
    pintar()
  }
  const abrir = (r) => {
    if (r.trava) { setTremer(r.id); somQueda(); setTimeout(() => setTremer(null), 500); return }
    setRompendo(r.id); somSelo(); somPapiro()
    setTimeout(() => nav(r.to), parado ? 60 : 850)
  }
  const salas = ROLOS_AP.filter((r) => !r.trava)
  const rompidos = salas.filter((r) => lidos && lidos['ap:sala:' + r.id]).length
  return (
    <TabuaShell>
      <div className="ap-camara" ref={cena} onPointerMove={mover} onPointerDown={mover}>
        <img className="ap-fundo" src="/img/ap-camara-dos-rolos.webp" alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <VideoVivo nome="ap-camara-dos-rolos" />
        <div className="ap-parede" aria-hidden="true" />
        <Particulas tipo="poeira" />
        <div className="ap-escuro" aria-hidden="true" />
        {ROLOS_AP.map((r) => (
          <button
            key={r.id} type="button" ref={(el) => { itens.current[r.id] = el }}
            className={'ap-rolo' + (r.grande ? ' grande' : '') + (r.trava ? ' trava' : '') + (rompendo === r.id ? ' rompe' : '') + (tremer === r.id ? ' treme' : '') + (lidos && lidos['ap:sala:' + r.id] ? ' aberto' : '')}
            style={{ left: r.x + '%', top: r.y + '%' }} onClick={() => abrir(r)} onFocus={(e) => { e.currentTarget.style.opacity = '1' }} onBlur={pintar}
            aria-label={r.trava ? r.titulo + ' (selado, ' + r.sub + ')' : r.titulo + ': ' + r.sub} aria-disabled={r.trava ? 'true' : undefined}
          >
            <span className="ap-rolo-icone"><IconeAp tipo={r.icone} /><i className="ap-lacre" /></span>
            <b>{r.titulo}</b><small>{r.trava ? 'Selado · ' + r.sub : r.sub}</small>
          </button>
        ))}
        <div className="ap-camara-titulo">
          <h2>TÁBUA DOS APÓCRIFOS</h2>
          <p>Mova a luz. Toque num rolo para romper o selo.</p>
        </div>
      </div>
      <Aviso forte>São documentos históricos, não revelação. A Escritura é a medida; estes livros são estudados à luz dela.</Aviso>
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_ENTRADA_AP} /></article>
      <p className="mudo"><Selo tipo="ouro">{rompidos} de {salas.length} selos rompidos</Selo> As salas seladas chegam nas próximas etapas.</p>
      <GradeTres className="grade" tema="apocrifos">
        {ROLOS_AP.map((r) => r.trava
          ? <article key={r.id} className="cartao ap-fechado"><Selo>SELADO · {r.sub.toUpperCase()}</Selo><h3>{r.titulo}</h3></article>
          : <Link key={r.id} className="cartao curso" to={r.to}><Selo tipo="ouro">{lidos && lidos['ap:sala:' + r.id] ? 'SELO ROMPIDO' : 'SELADO'}</Selo><h3>{r.titulo}</h3><p>{r.sub}</p></Link>)}
      </GradeTres>
      {sessao && sessao.admin && <p><Link className="btn admin" to="/tabua-dos-apocrifos/painel">Painel de demonstrações (admin)</Link></p>}
    </TabuaShell>
  )
}

// ───── Balança do Cânone ─────
function useSuave(alvo, vel = 0.09) {
  const [v, setV] = useState(alvo)
  const ref = useRef(alvo)
  useEffect(() => {
    if (parouMovimento()) { ref.current = alvo; setV(alvo); return undefined }
    let raf = 0
    const f = () => {
      ref.current += (alvo - ref.current) * vel
      if (Math.abs(alvo - ref.current) < 0.02) ref.current = alvo
      setV(ref.current)
      if (ref.current !== alvo) raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => cancelAnimationFrame(raf)
  }, [alvo, vel])
  return v
}
function Cubos({ n, x, y, cor }) {
  return Array.from({ length: n }, (_, i) => <rect key={i} x={x + (i % 5) * 11} y={y - Math.floor(i / 5) * 11} width="9" height="9" rx="1.5" fill={cor} />)
}
function DesenhoBalanca({ livro, ref_ }) {
  const ang = useSuave(((ref_ - livro) / 15) * 13)
  const rad = (ang * Math.PI) / 180
  const L = 150, cx = 210, cy = 54
  const ex = [cx - L * Math.cos(rad), cy - L * Math.sin(rad)]
  const dx = [cx + L * Math.cos(rad), cy + L * Math.sin(rad)]
  const pan = (p, nome, n, cor) => (
    <g>
      <path d={`M${p[0]} ${p[1]} L${p[0] - 38} ${p[1] + 74} M${p[0]} ${p[1]} L${p[0] + 38} ${p[1] + 74}`} stroke="#c9a85a" strokeWidth="1.4" />
      <path d={`M${p[0] - 46} ${p[1] + 74} h92 a46 14 0 0 1 -92 0z`} fill="#6a4a1f" stroke="#e9c77a" strokeWidth="1.5" />
      <Cubos n={n} x={p[0] - 27} y={p[1] + 62} cor={cor} />
      <text x={p[0]} y={p[1] + 112} textAnchor="middle" fill="#e9d9b5" fontSize="12">{nome}</text>
    </g>
  )
  return (
    <svg className="ap-balanca-svg" viewBox="0 0 420 270" role="img" aria-label={`Balança: o livro pesa ${livro} e o padrão pesa ${ref_}.`}>
      <path d="M210 54v150M170 214h80M182 204h56" stroke="#e9c77a" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${ex[0]} ${ex[1]} L${dx[0]} ${dx[1]}`} stroke="#f3d98b" strokeWidth="7" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="7" fill="#f3d98b" />
      {pan(ex, 'o livro', livro, '#f3d98b')}
      {pan(dx, 'a Escritura reconhecida', ref_, '#f6f0e0')}
    </svg>
  )
}

function TabuaBalanca() {
  useVisita('balanca')
  const loc = useLocation()
  const qs = new URLSearchParams(loc.search).get('livro')
  const [id, setId] = useState(CANON_LIVROS.some((l) => l.id === qs) ? qs : 'joao')
  const [passo, setPasso] = useState(0)
  const [pesando, setPesando] = useState(false)
  const tm = useRef(null)
  const livro = CANON_LIVROS.find((l) => l.id === id)
  useEffect(() => () => clearTimeout(tm.current), [])
  useEffect(() => { clearTimeout(tm.current); setPasso(0); setPesando(false) }, [id])
  const pesar = () => {
    clearTimeout(tm.current); setPasso(0); setPesando(true); somPapiro()
    const k = (n) => { setPasso(n); somPeso(n); if (n < 5) tm.current = setTimeout(() => k(n + 1), parouMovimento() ? 120 : 1200); else setPesando(false) }
    tm.current = setTimeout(() => k(1), 500)
  }
  const parcial = livro.notas.slice(0, passo).reduce((s, n) => s + n[0], 0)
  const grupos = [...new Set(CANON_LIVROS.map((l) => l.grupo))]
  return (
    <TabuaShell>
      <h2 className="tab-titulo">A Balança do Cânone</h2>
      <p className="mudo tab-sub">Escolha um livro e veja como os cinco testes usados pela Igreja o pesam. A balança é um recurso de estudo.</p>
      <ImgViva arquivo="ap-balanca" alt="Uma balança de bronze antiga sobre uma mesa de pedra, com um rolo em um prato e uma pedra no outro" lado="cheia" fx="brilho" legenda="Pesar um livro à luz da Escritura." />
      <Aviso>Esta pontuação é uma leitura didática do Ministério, em rascunho para revisão. A Igreja nunca somou notas: ela reconheceu os livros que já estavam em uso nas igrejas. Os valores são de 0 a 3 em cada teste, no máximo de 15.</Aviso>
      <div className="ap-livros" role="group" aria-label="Escolha o livro a pesar">
        {grupos.map((g) => (
          <div key={g} className="ap-livros-grupo">
            <b>{g}</b>
            <div className="ap-chips">
              {CANON_LIVROS.filter((l) => l.grupo === g).map((l) => <button key={l.id} type="button" className={'ap-chip' + (l.id === id ? ' on' : '')} onClick={() => setId(l.id)}>{l.titulo}</button>)}
            </div>
          </div>
        ))}
      </div>
      <section className="cartao ap-balanca-cena">
        <DesenhoBalanca livro={parcial} ref_={passo * 3} />
        <div className="botoes centro">
          <button type="button" className="btn ouro" onClick={pesar} disabled={pesando}>{passo === 5 ? 'Pesar de novo' : pesando ? 'Pesando…' : 'Pesar este livro'}</button>
        </div>
        <p className="ap-peso" aria-live="polite">{passo === 0 ? 'A balança aguarda.' : `Peso do livro: ${parcial} de ${passo * 3} possíveis até agora.`}</p>
      </section>
      <GradeTres className="ap-criterios" tema="canon">
        {CRITERIOS.map((c, i) => {
          const nota = livro.notas[i]
          const rev = i < passo
          return (
            <article key={c.id} className={'cartao ap-criterio' + (rev ? ' rev' : '')}>
              <header>
                <h3>{i + 1}. {c.nome}</h3>
                <span className="ap-pontos" aria-label={rev ? `${nota[0]} de 3` : 'ainda não pesado'}>
                  {[0, 1, 2].map((k) => <i key={k} className={rev && k < nota[0] ? 'on' : ''} />)}
                </span>
              </header>
              <p className="mudo">{c.pergunta}</p>
              {rev ? <p className="ap-nota"><Selo tipo="ouro">{nota[0]} de 3</Selo> <Inline t={nota[1]} /></p> : <p className="ap-nota mudo">Aguardando o peso…</p>}
              <details><summary>Fundamento bíblico e histórico</summary><p>{c.base}</p></details>
            </article>
          )
        })}
      </GradeTres>
      {passo === 5 && (
        <section className="cartao ap-veredito">
          <Selo tipo="ouro">LEITURA DIDÁTICA</Selo> <Selo>RASCUNHO PARA REVISÃO</Selo>
          <h3>{livro.titulo}: {parcial} de 15</h3>
          <p>{livro.veredito}</p>
          <p className="mudo">O peso diz o quanto o livro cumpre os testes, e não decide sozinho. A Escritura é a medida, e a Igreja a recebeu como dom de Deus (2 Timóteo 3:16; 1 Tessalonicenses 2:13).</p>
          {livro.id === 'enoque' && <p><Link className="btn" to="/tabua-dos-apocrifos/enoque">Ver a seção de Enoque</Link></p>}
        </section>
      )}
      <h2 className="tab-titulo">As tradições e o cânon</h2>
      <p className="mudo tab-sub">Quantos livros cada tradição reconhece como Escritura. Os números variam um pouco conforme a fonte, e por isso estão em rascunho para conferência.</p>
      <div className="ap-barras" role="list">
        {COMPARATIVO.map((c) => (
          <div key={c.tradicao} className="ap-barra" role="listitem">
            <b>{c.tradicao}</b>
            <span className="ap-barra-trilho"><i style={{ width: (c.livros / 81) * 100 + '%', background: c.cor }} /></span>
            <span className="ap-barra-num">{c.livros}</span>
            <small>{c.nota}</small>
          </div>
        ))}
      </div>
      <h2 className="tab-titulo">Como se fixou o Novo Testamento</h2>
      <ol className="ap-linha-canon">
        <li><b>Por volta de 180.</b> <Inline t="[[termo:irineu|Irineu]] defende os quatro Evangelhos." /></li>
        <li><b>Entre 170 e 200 (data debatida).</b> <Inline t="O [[termo:fragmento-muratoriano|Fragmento Muratoriano]] lista livros apostólicos." /></li>
        <li><b>Por volta de 325.</b> Eusébio de Cesareia classifica os livros em reconhecidos, contestados e falsos (História Eclesiástica 3.25).</li>
        <li><b>367.</b> <Inline t="[[termo:atanasio-367|Atanásio]] lista os 27 livros." /></li>
        <li><b>393 e 397.</b> Os sínodos de Hipona e de Cartago confirmam a lista no Ocidente.</li>
      </ol>
      <p className="mudo">A Igreja não criou o cânon: reconheceu o que já era lido. O Concílio de Niceia (325) não decidiu a lista; veja Mitos e Fatos.</p>
    </TabuaShell>
  )
}

// ───── Mitos e Fatos ─────
function CartaoMito({ m }) {
  const [virado, setVirado] = useState(false)
  const [gira, setGira] = useState(false)
  const virar = () => {
    if (gira) return
    somPapiro()
    if (parouMovimento()) { setVirado(!virado); return }
    setGira(true)
    setTimeout(() => { setVirado((v) => !v); setGira(false) }, 220)
  }
  return (
    <article className={'cartao ap-mito' + (virado ? ' fato' : '') + (gira ? ' gira' : '')}>
      <Selo tipo="ouro">{virado ? 'FATO' : 'MITO'}</Selo>
      <p className="ap-mito-frase">{virado ? m.fato : (m.titulo || m.mito)}</p>
      <button type="button" className="btn pequeno" onClick={virar}>{virado ? 'Voltar ao mito' : 'Virar o cartão'}</button>
      {virado && (
        <details>
          <summary>Entender melhor</summary>
          <TextoLongo texto={m.texto} />
          {m.ref && <p className="ref">{m.ref}</p>}
        </details>
      )}
    </article>
  )
}
function TabuaMitos() {
  useVisita('mitos')
  const { db } = useLoja()
  return (
    <TabuaShell editar="mitosAp">
      <h2 className="tab-titulo">Mitos e Fatos</h2>
      <p className="mudo tab-sub">Frases que se ouvem por aí sobre estes livros. Vire cada cartão e confira o que os documentos mostram.</p>
      <ImgViva arquivo="ap-mitos" alt="Uma mesa antiga com códices abertos, uma lupa e uma lâmpada de bronze" lado="cheia" fx="nevoa" legenda="Conferir antes de repetir." />
      <GradeTres className="grade ap-mitos" tema="apocrifos">{(db.mitosAp || []).map((m) => <CartaoMito key={m.id} m={m} />)}</GradeTres>
      <Aviso>Estes cartões são um rascunho para revisão. Datas e citações devem ser conferidas em fontes acadêmicas antes de publicar.</Aviso>
    </TabuaShell>
  )
}

// ───── Glossário ─────
function TabuaGlossario() {
  useVisita('glossario')
  const { db } = useLoja()
  return (
    <TabuaShell>
      <GlossarioMiolo termos={db.termosAp || []} />
    </TabuaShell>
  )
}
function GlossarioMiolo({ termos }) {
  const ctx = useContext(TermoCtx)
  const [q, setQ] = useState('')
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const lista = [...termos].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR')).filter((t) => !q || norm(t.titulo + ' ' + t.oque).includes(norm(q)))
  return (
    <>
      <h2 className="tab-titulo">Glossário da Tábua</h2>
      <p className="mudo tab-sub">Cada termo citado nas salas tem um cartão: o que é, os fundamentos e como a fé cristã o avalia. {termos.length} termos.</p>
      <ImgViva arquivo="ap-glossario" alt="Prateleiras de pedra com jarros de barro e tabuinhas de madeira em um arquivo silencioso" lado="cheia" fx="nevoa" legenda="Primeiro entender as palavras." />
      <label className="ap-busca"><span className="mudo">Buscar um termo</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: gnosticismo, cânon, Qumran" /></label>
      <GradeTres className="grade" tema="apocrifos2">
        {lista.map((t) => (
          <button key={t.id} type="button" className="cartao ap-termo-item" onClick={() => ctx && ctx.abrir(t.id)}>
            <Selo tipo="ouro">{t.etiqueta}</Selo>
            <h3>{t.titulo}</h3>
            <p><Inline t={String(t.oque).replace(/\[\[termo:[a-z0-9-]+\|([^\]]+)\]\]/g, '$1').slice(0, 150) + (String(t.oque).length > 150 ? '…' : '')} /></p>
            <span className="mudo">Abrir o cartão →</span>
          </button>
        ))}
        {lista.length === 0 && <Aviso>Nenhum termo encontrado.</Aviso>}
      </GradeTres>
    </>
  )
}


// ───── Enoque: os cinco instrumentos ─────

// 1. Vigilantes: o céu da noite. Pontos de luz descem, apagam-se na terra, são presos; uma luz solitária percorre o horizonte.
function EfeitoVigilantes({ cenas }) {
  const [cena, setCena] = useState(0)
  const [auto, setAuto] = useState(false)
  const cv = useRef(null)
  const S = useRef({ luzes: [], estrelas: [], cena: 0, ult: 0, enoque: 0, rastro: [], marcos: 0 })
  const parado = parouMovimento()
  useEffect(() => {
    const c = cv.current
    const s = S.current
    const tam = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    tam()
    const N = 54
    s.luzes = Array.from({ length: N }, (_, i) => ({ x0: 0.06 + Math.random() * 0.88, y0: 0.06 + Math.random() * 0.4, x: 0, y: 0, est: 'ceu', atraso: 0, f: Math.random() * 6, i }))
    s.estrelas = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random() * 0.7, r: Math.random() * 1.1 + 0.3, f: Math.random() * 6 }))
    s.luzes.forEach((l) => { l.x = l.x0 * c.width; l.y = l.y0 * c.height })
    window.addEventListener('resize', tam)
    const cume = (x, w, h) => h * (0.8 - 0.06 * Math.sin((x / w) * 7) - 0.045 * Math.sin((x / w) * 17 + 1))
    const x2 = c.getContext('2d')
    const desenhar = (now) => {
      const w = c.width, h = c.height
      const g = x2.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#05071c'); g.addColorStop(0.7, '#0e1638'); g.addColorStop(1, '#1a1f40')
      x2.fillStyle = g; x2.fillRect(0, 0, w, h)
      s.estrelas.forEach((e) => { x2.globalAlpha = 0.25 + 0.2 * Math.sin(now * 0.001 + e.f); x2.fillStyle = '#dfe6ff'; x2.fillRect(e.x * w, e.y * h, e.r, e.r) })
      x2.globalAlpha = 1
      if (s.cena === 0) { const gl = x2.createRadialGradient(w / 2, h * 0.82, 4, w / 2, h * 0.82, w * 0.5); gl.addColorStop(0, 'rgba(243,217,139,0.28)'); gl.addColorStop(1, 'rgba(243,217,139,0)'); x2.fillStyle = gl; x2.fillRect(0, 0, w, h) }
      // cume (a cordilheira é desenhada antes das luzes, para que as presas apareçam)
      x2.fillStyle = '#04050f'; x2.beginPath(); x2.moveTo(0, h)
      for (let x = 0; x <= w; x += 8) x2.lineTo(x, cume(x, w, h))
      x2.lineTo(w, h); x2.closePath(); x2.fill()
      // luzes
      s.luzes.forEach((l) => {
        if (!parado) {
          if (l.est === 'cai') {
            if (l.atraso > 0) l.atraso -= 1
            else {
              l.y += 0.9 + (l.i % 5) * 0.12; l.x += Math.sin(now * 0.002 + l.f) * 0.15
              if (l.y >= cume(l.x, w, h) - 4) { l.est = 'terra'; if (now - s.ult > 260) { somQueda(); s.ult = now } }
            }
          } else if (l.est === 'preso') {
            const tx = w * (0.07 + (0.86 * l.i) / (s.luzes.length - 1)), ty = h * 0.92
            l.x += (tx - l.x) * 0.04; l.y += (ty - l.y) * 0.04
          }
        }
        const apagada = l.est === 'terra' || l.est === 'preso'
        x2.globalAlpha = apagada ? 0.4 : 0.55 + 0.35 * Math.sin(now * 0.003 + l.f)
        x2.shadowColor = '#f3d98b'; x2.shadowBlur = apagada ? 3 : 12
        x2.fillStyle = apagada ? '#a98f5a' : '#fff1c2'
        x2.beginPath(); x2.arc(l.x, l.y, 2.4, 0, 7); x2.fill()
      })
      x2.shadowBlur = 0; x2.globalAlpha = 1
      if (s.cena >= 2) {
        x2.strokeStyle = 'rgba(169,143,90,0.35)'; x2.lineWidth = 1; x2.beginPath()
        s.luzes.forEach((l, i) => { if (i === 0) x2.moveTo(l.x, l.y); else x2.lineTo(l.x, l.y) }); x2.stroke()
      }
      // a luz solitária de Enoque
      if (s.cena === 3) {
        if (!parado) s.enoque = Math.min(1, s.enoque + 0.0016)
        const p = s.enoque
        const ex = w * (0.05 + 0.9 * p), ey = h * (0.3 + 0.07 * Math.sin(p * 9))
        s.rastro.push([ex, ey]); if (s.rastro.length > 60) s.rastro.shift()
        s.rastro.forEach(([rx, ry], i) => { x2.globalAlpha = (i / s.rastro.length) * 0.5; x2.fillStyle = '#f3d98b'; x2.beginPath(); x2.arc(rx, ry, 1.6, 0, 7); x2.fill() })
        x2.globalAlpha = 1; x2.shadowColor = '#f3d98b'; x2.shadowBlur = 22; x2.fillStyle = '#fff6d6'; x2.beginPath(); x2.arc(ex, ey, 4.2, 0, 7); x2.fill(); x2.shadowBlur = 0
        const m = Math.floor(p * 4)
        if (m > s.marcos) { s.marcos = m; somBadalada(m * 2) }
      }
    }
    let raf = 0
    const f = (now) => { desenhar(now); raf = requestAnimationFrame(f) }
    if (parado) desenhar(0); else raf = requestAnimationFrame(f)
    s.redesenhar = () => { if (parado) desenhar(performance.now()) }
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', tam) }
  }, [])
  useEffect(() => {
    const s = S.current
    const c = cv.current
    if (!c) return
    s.cena = cena
    if (cena === 0 || cena === 1) {
      s.luzes.forEach((l) => { l.x = l.x0 * c.width; l.y = l.y0 * c.height; l.est = cena === 1 ? 'cai' : 'ceu'; l.atraso = Math.random() * 240 })
      if (parado && cena === 1) s.luzes.forEach((l) => { l.est = 'terra'; l.y = c.height * 0.78 })
    } else {
      s.luzes.forEach((l) => { l.est = 'preso' })
      if (parado) s.luzes.forEach((l) => { l.x = c.width * (0.07 + (0.86 * l.i) / (s.luzes.length - 1)); l.y = c.height * 0.92 })
    }
    if (cena === 3) { s.enoque = parado ? 0.5 : 0; s.rastro = []; s.marcos = 0 }
    if (s.redesenhar) s.redesenhar()
  }, [cena])
  const ir = (i) => { setCena(i); if (i === 1) somTrovao(); else if (i === 2) somQueda(); else if (i === 3) somBadalada(2); else somPapiro() }
  useEffect(() => {
    if (!auto) return undefined
    if (cena >= cenas.length - 1) { setAuto(false); return undefined }
    const t = setTimeout(() => ir(cena + 1), 8000)
    return () => clearTimeout(t)
  }, [auto, cena])
  return (
    <div className="ap-efeito">
      <canvas ref={cv} className="ap-canvas" role="img" aria-label={'Céu noturno. Cena: ' + cenas[cena].t + '.'} />
      <div className="ap-etapas" role="group" aria-label="Cenas do Livro dos Vigilantes">
        {cenas.map((c, i) => <button key={c.t} type="button" className={'ap-chip' + (i === cena ? ' on' : '')} onClick={() => ir(i)}>{i + 1}. {c.t} <small>cap. {c.caps}</small></button>)}
        <button type="button" className="btn pequeno" onClick={() => { setAuto(!auto); if (!auto && cena === cenas.length - 1) ir(0) }}>{auto ? 'Parar' : 'Percorrer as cenas'}</button>
      </div>
      <p className="ap-legenda-efeito" aria-live="polite">{cenas[cena].txt}</p>
    </div>
  )
}

// 2. Parábolas: a alvorada que clareia, uma parábola de cada vez.
function EfeitoAlvorada({ cenas }) {
  const [p, setP] = useState(0)
  const niveis = [0, 0.4, 0.72, 1]
  const nome = ['Antes da primeira parábola: a noite', ...cenas.map((c) => c.t)]
  const ir = (i) => { setP(i); somAlvorada(i) }
  const n = niveis[p]
  return (
    <div className="ap-efeito">
      <div className="ap-alvorada" style={{ '--p': n }} role="img" aria-label={nome[p]}>
        <div className="ap-alv-dia" style={{ opacity: n }} />
        <div className="ap-alv-estrelas" style={{ opacity: 1 - n }}><Estrelas /></div>
        <div className="ap-alv-sol" />
        <div className="ap-alv-nuvem a" />
        <div className="ap-alv-nuvem b" />
        <div className="ap-alv-colinas" />
      </div>
      <div className="ap-etapas" role="group" aria-label="Parábolas">
        <button type="button" className={'ap-chip' + (p === 0 ? ' on' : '')} onClick={() => ir(0)}>Noite</button>
        {cenas.map((c, i) => <button key={c.t} type="button" className={'ap-chip' + (p === i + 1 ? ' on' : '')} onClick={() => ir(i + 1)}>{c.t} <small>cap. {c.caps}</small></button>)}
      </div>
      <p className="ap-legenda-efeito" aria-live="polite">{p === 0 ? 'Antes das Parábolas, a noite. Toque numa parábola e veja o dia clarear.' : cenas[p - 1].txt}</p>
    </div>
  )
}

// 3. Astronômico: o ano de 364 dias, e quanto ele se afasta do Sol.
const SOL = 365.2422, LUA12 = 354.3671
function GraficoDeriva() {
  const W = 520, H = 250, ml = 50, mr = 96, mt = 14, mb = 38
  const X = (a) => ml + (a / 40) * (W - ml - mr)
  const Y = (d) => H - mb - (d / 450) * (H - mt - mb)
  const linha = (dif) => Array.from({ length: 41 }, (_, a) => `${a ? 'L' : 'M'}${X(a).toFixed(1)} ${Y(dif * a).toFixed(1)}`).join(' ')
  const d364 = SOL - 364, dl = SOL - LUA12
  return (
    <figure className="ap-grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico: em 40 anos, o calendário de 364 dias se afasta ${(d364 * 40).toFixed(0)} dias das estações, e um ano lunar sem ajuste se afasta ${(dl * 40).toFixed(0)} dias.`}>
        {[0, 100, 200, 300, 400].map((d) => <g key={d}><line x1={ml} x2={W - mr} y1={Y(d)} y2={Y(d)} stroke="rgba(255,255,255,0.12)" /><text x={ml - 6} y={Y(d) + 4} textAnchor="end" fill="#aaa3c6" fontSize="11">{d}</text></g>)}
        {[0, 10, 20, 30, 40].map((a) => <text key={a} x={X(a)} y={H - mb + 16} textAnchor="middle" fill="#aaa3c6" fontSize="11">{a}</text>)}
        <line x1={ml} x2={W - mr} y1={Y(30)} y2={Y(30)} stroke="#f3d98b" strokeDasharray="2 4" opacity="0.7" />
        <text x={W - mr + 6} y={Y(30) + 16} fill="#f3d98b" fontSize="11" opacity="0.85">um mês</text>
        <path d={linha(dl)} fill="none" stroke="#7fe3ff" strokeWidth="2.4" strokeDasharray="7 4" />
        <path d={linha(d364)} fill="none" stroke="#f3d98b" strokeWidth="2.6" />
        <text x={X(40) + 6} y={Y(dl * 40) + 4} fill="#7fe3ff" fontSize="11">ano lunar</text>
        <text x={X(40) + 6} y={Y(dl * 40) + 17} fill="#7fe3ff" fontSize="11">sem ajuste</text>
        <text x={X(40) + 6} y={Y(d364 * 40) - 4} fill="#f3d98b" fontSize="11">364 dias</text>
        <text x={(ml + W - mr) / 2} y={H - 4} textAnchor="middle" fill="#aaa3c6" fontSize="11">anos</text>
        <text x={12} y={(mt + H - mb) / 2} fill="#aaa3c6" fontSize="11" transform={`rotate(-90 12 ${(mt + H - mb) / 2})`} textAnchor="middle">dias de desvio</text>
      </svg>
      <figcaption>Quantos dias cada calendário se afasta das estações do Sol, ano após ano, se ninguém o ajustar. Números calculados a partir do ano tropical de {SOL.toString().replace('.', ',')} dias.</figcaption>
      <details><summary>Ver os números</summary>
        <table className="ap-tabela"><thead><tr><th>Anos</th><th>364 dias</th><th>Ano lunar (12 meses)</th></tr></thead>
          <tbody>{[1, 10, 25, 40].map((a) => <tr key={a}><td>{a}</td><td>{(d364 * a).toFixed(1).replace('.', ',')} dias</td><td>{(dl * a).toFixed(1).replace('.', ',')} dias</td></tr>)}</tbody></table>
      </details>
    </figure>
  )
}
const ESTACOES = ['Primeira estação', 'Segunda estação', 'Terceira estação', 'Quarta estação']
function EfeitoAno() {
  const [dia, setDia] = useState(0)
  const [roda, setRoda] = useState(false)
  useEffect(() => {
    if (!roda) return undefined
    const id = setInterval(() => setDia((d) => Math.min(364, d + 1)), 22)
    return () => clearInterval(id)
  }, [roda])
  useEffect(() => {
    if (!roda || dia === 0) return
    if (dia % 91 === 0) somBadalada((dia / 91) * 2)
    else if (dia % 7 === 0) somTique(dia % 28 === 0)
    if (dia >= 364) setRoda(false)
  }, [dia])
  const iniciar = () => { setDia(0); setRoda(true); somPapiro() }
  const sem = Math.floor(dia / 7), est = Math.min(3, Math.floor(Math.max(0, dia - 1) / 91))
  return (
    <div className="ap-efeito">
      <div className="ap-ano" role="img" aria-label={`Ano de 364 dias, em quatro estações de 91 dias. Dia ${dia}.`}>
        {ESTACOES.map((e, k) => (
          <div key={e} className={'ap-estacao' + (dia > 0 && est === k ? ' agora' : '')}>
            <div className="ap-estacao-grade">{Array.from({ length: 91 }, (_, i) => <i key={i} className={k * 91 + i < dia ? 'on' : ''} />)}</div>
            <small>{e}: 13 semanas</small>
          </div>
        ))}
      </div>
      <div className="ap-etapas">
        <button type="button" className="btn ouro" onClick={iniciar} disabled={roda}>{roda ? 'Percorrendo…' : dia >= 364 ? 'Percorrer de novo' : 'Percorrer o ano'}</button>
        <span className="ap-peso" aria-live="polite">Dia {dia} de 364 · semana {Math.min(52, sem + (dia % 7 ? 1 : 0))} de 52</span>
      </div>
      <div className="ap-numeros">
        <div><b>354,37</b><span>dias: ano lunar de doze meses</span></div>
        <div><b>364</b><span>dias: o ano de Enoque (52 semanas)</span></div>
        <div><b>365,24</b><span>dias: o ano do Sol</span></div>
      </div>
      <GraficoDeriva />
    </div>
  )
}

// 4. Sonhos: o rebanho que caminha pela História de Israel.
function Ovelha() {
  return (
    <svg viewBox="0 0 64 40" width="64" height="40" aria-hidden="true" fill="currentColor">
      <ellipse cx="28" cy="19" rx="19" ry="11" /><circle cx="18" cy="12" r="6" /><circle cx="30" cy="10" r="7" /><circle cx="40" cy="13" r="6" />
      <ellipse cx="50" cy="18" rx="6" ry="5" /><path d="M14 28v9M24 30v9M34 30v9M42 27v9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
function EfeitoRebanho() {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(false)
  const ir = (k) => { setI(k); somPasso(); setTimeout(somPasso, 160); setTimeout(somPasso, 340) }
  useEffect(() => {
    if (!auto) return undefined
    if (i >= ANIMAIS.length - 1) { setAuto(false); return undefined }
    const t = setTimeout(() => ir(i + 1), 6500)
    return () => clearTimeout(t)
  }, [auto, i])
  const a = ANIMAIS[i]
  return (
    <div className="ap-efeito">
      <div className="ap-rebanho" aria-hidden="true"><div className="ap-rebanho-pista">{Array.from({ length: 20 }, (_, k) => <span key={k} style={{ opacity: 0.35 + (k % 4) * 0.12 }}><Ovelha /></span>)}</div></div>
      <div className="ap-etapas" role="group" aria-label="Etapas do Apocalipse dos Animais">
        {ANIMAIS.map((x, k) => <button key={x.id} type="button" className={'ap-chip' + (k === i ? ' on' : '')} onClick={() => ir(k)} aria-label={`${k + 1}. ${x.t}`}>{k + 1}</button>)}
        <button type="button" className="btn pequeno" onClick={() => { setAuto(!auto); if (!auto && i === ANIMAIS.length - 1) ir(0) }}>{auto ? 'Parar' : 'Seguir o rebanho'}</button>
      </div>
      <article className="cartao ap-decod" aria-live="polite">
        <h4>{i + 1}. {a.t} <small className="mudo">1 Enoque {a.ref}</small></h4>
        <dl>
          <dt>O que se vê</dt><dd>{a.simbolo}</dd>
          <dt>Leitura dos estudiosos</dt><dd>{a.leitura}</dd>
          <dt>Certeza da leitura</dt><dd><Selo tipo={a.certeza === 'alta' ? 'ouro' : ''}>{a.certeza.toUpperCase()}</Selo></dd>
          <dt>Texto bíblico relacionado</dt><dd>{a.biblia}</dd>
        </dl>
      </article>
    </div>
  )
}

// 5. Epístola: dez lajes que se acendem, uma por semana, ao som de um sino.
function EfeitoSemanas() {
  const [n, setN] = useState(0)
  const [sel, setSel] = useState(null)
  const [roda, setRoda] = useState(false)
  useEffect(() => {
    if (!roda) return undefined
    if (n >= 10) { setRoda(false); return undefined }
    const t = setTimeout(() => { setN(n + 1); setSel(n); somBadalada(n) }, n === 0 ? 400 : 1800)
    return () => clearTimeout(t)
  }, [roda, n])
  const iniciar = () => { setN(0); setSel(null); setRoda(true); somPapiro() }
  const tocar = (k) => { setSel(k); if (k >= n) setN(k + 1); somBadalada(k) }
  const s = sel != null ? SEMANAS[sel] : null
  return (
    <div className="ap-efeito">
      <div className="ap-lajes" role="group" aria-label="As dez semanas">
        {SEMANAS.map((w, k) => <button key={w.n} type="button" className={'ap-laje' + (k < n ? ' acesa' : '') + (sel === k ? ' sel' : '')} onClick={() => tocar(k)}><b>{w.n}</b><span>{w.t}</span></button>)}
      </div>
      <div className="ap-etapas"><button type="button" className="btn ouro" onClick={iniciar} disabled={roda}>{roda ? 'Percorrendo…' : 'Percorrer as dez semanas'}</button></div>
      <article className="cartao ap-decod" aria-live="polite">
        {s ? <><h4>Semana {s.n}: {s.t} <small className="mudo">1 Enoque {s.ref}</small></h4><p>{s.txt}</p><p className="mudo">Identificação segundo a leitura dos estudiosos (a conferir).</p></> : <p className="mudo">Toque numa laje para ouvir o sino e ler o que aquela semana diz.</p>}
      </article>
      <table className="ap-tabela">
        <caption>Duas maneiras de dividir o tempo</caption>
        <thead><tr><th></th><th>Daniel 9:24-27 (Escritura)</th><th>1 Enoque 93 e 91 (documento judaico)</th></tr></thead>
        <tbody>
          <tr><th scope="row">Divisão</th><td>Setenta semanas (7 + 62 + 1)</td><td>Dez semanas</td></tr>
          <tr><th scope="row">Fim</th><td>A plenitude da promessa</td><td>O juízo e o novo céu</td></tr>
          <tr><th scope="row">Contas</th><td>Semanas de anos, debatidas</td><td>Sem número de anos claro</td></tr>
        </tbody>
      </table>
    </div>
  )
}

// Tabela de correlações com a Bíblia (filtrável)
const TIPOS_CORREL = { 'CITAÇÃO DIRETA': '■', 'ECO': '◆', 'TEMA PARALELO': '▲', 'CONTRASTE': '●' }
function TabelaCorrel({ itens, filtrar = true }) {
  const [tipo, setTipo] = useState('')
  const lista = itens.filter((c) => !tipo || c.tipo === tipo)
  return (
    <div className="ap-correl">
      {filtrar && (
        <div className="ap-chips" role="group" aria-label="Filtrar por tipo de relação">
          <button type="button" className={'ap-chip' + (!tipo ? ' on' : '')} onClick={() => setTipo('')}>Todas ({itens.length})</button>
          {Object.keys(TIPOS_CORREL).map((t) => <button key={t} type="button" className={'ap-chip' + (tipo === t ? ' on' : '')} onClick={() => setTipo(t)}>{TIPOS_CORREL[t]} {t}</button>)}
        </div>
      )}
      <GradeTres className="ap-correl-lista" tema="enoque">
        {lista.map((c) => (
          <article key={c.id} className={'cartao ap-correl-item tp-' + slug(c.tipo)}>
            <header><Selo tipo="ouro">{TIPOS_CORREL[c.tipo]} {c.tipo}</Selo><b>{c.titulo || c.tema}</b></header>
            <div className="ap-correl-par"><span><small>Enoque</small>{c.enoque}</span><span><small>Bíblia</small>{c.biblia}</span></div>
            <p className="mudo">{c.nota}</p>
          </article>
        ))}
      </GradeTres>
      <p className="mudo ap-legenda-tipos">■ citação direta: palavras muito próximas · ◆ eco: tema ou imagem parecida · ▲ tema paralelo: ideias do mesmo mundo judaico · ● contraste: ponto em que diferem. Parentesco de temas não prova que um dependa do outro.</p>
    </div>
  )
}

const COR_LIVRO = { vigilantes: '#7fb6ff', parabolas: '#f3d98b', astronomico: '#7fe3ff', sonhos: '#b9e08a', epistola: '#e9a6ff' }
function GraficoCaps() {
  const total = ENOQUE_LIVROS.reduce((s, l) => s + l.numCaps, 0)
  return (
    <figure className="ap-grafico">
      <div className="ap-barras" role="list">
        {ENOQUE_LIVROS.map((l) => (
          <div key={l.id} className="ap-barra" role="listitem">
            <b>{l.ordem}. {l.nome.replace(/^(O |A |As )/, '')}</b>
            <span className="ap-barra-trilho"><i style={{ width: (l.numCaps / 36) * 100 + '%', background: COR_LIVRO[l.id] }} /></span>
            <span className="ap-barra-num">{l.numCaps}</span>
            <small>capítulos {l.caps} · {l.datacao}</small>
          </div>
        ))}
      </div>
      <figcaption>Os cinco livros de 1 Enoque, pelo número de capítulos ({total} no total, na divisão de R. H. Charles).</figcaption>
    </figure>
  )
}

const PORQUES_CRISTAO = [
  ['Não está na Bíblia de Jesus', 'O Tanakh, que Jesus e os apóstolos usavam, não inclui Enoque. Jesus falou da Lei, dos Profetas e dos Salmos (Lucas 24:44), e nenhum autor do Novo Testamento diz "está escrito" sobre o Livro de Enoque.'],
  ['Chegou às igrejas em tradução, e a linha de transmissão se perdeu', 'O original era hebraico ou aramaico. Na Antiguidade cristã o livro circulou em grego, e quase todas as cópias se perderam. Agostinho disse que não entrou no cânon porque a linha de transmissão não era segura (A Cidade de Deus 15.23).'],
  ['Traz coisas que a Bíblia não confirma, e algumas em que difere', 'O ano de 364 dias, o peso dado aos anjos na origem do mal, os detalhes sobre os vigilantes e a identificação de Enoque com o Filho do Homem no capítulo 71 (debatida) não têm apoio na Escritura.'],
  ['A citação de Judas não canoniza o livro', 'Paulo cita poetas pagãos (Atos 17:28; Tito 1:12) sem os tornar Escritura. Judas pode ter reconhecido como verdadeira uma profecia preservada ali, ou usado uma obra conhecida como ilustração. Veja Mitos e Fatos.'],
  ['É pseudepígrafo: escrito sob o nome de Enoque, muito depois dele', 'O patriarca viveu no começo da História, e o livro é do século III a.C. em diante. Uma obra com um nome emprestado não tem, só por isso, a autoridade de quem a escreveu. Veja o cartão de pseudepigrafia.'],
]
const PORQUES_JUDAICO = [
  ['O Espírito de profecia teria cessado', 'A tradição rabínica diz que depois de Ageu, Zacarias e Malaquias o Espírito se retirou de Israel. Livros escritos depois ficaram fora das Escrituras. É um dos argumentos que os historiadores citam.'],
  ['Os rabinos trataram estes livros como "externos"', 'A Mishná (Sanhedrin 10:1) fala em "livros externos". A expressão é debatida, mas mostra que os rabinos separavam o que lia o povo do que era Escritura.'],
  ['Depois de 70 e de 135 d.C., o judaísmo se voltou para a Lei', 'Com o Templo destruído e a revolta de Bar Kochba derrotada, os rabinos desencorajaram a literatura apocalíptica e a especulação sobre anjos.'],
  ['O uso cristão aumentou a distância', 'Alguns desses livros eram lidos pelos cristãos. Isso reforçou, entre os rabinos, a decisão de os deixar fora.'],
]

function TabuaEnoque() {
  useVisita('enoque')
  const { db, lidos, marcarLido } = useLoja()
  const livros = [...(db.enoqueLivros || [])].sort((a, b) => a.ordem - b.ordem)
  const [aberto, setAberto] = useState(null)
  const [trava, setTrava] = useState(null)
  const [fTempo, setFTempo] = useState('')
  const painel = useRef(null)
  const pode = (i) => i === 0 || !!(lidos && lidos['ap:en:' + livros[i - 1].id])
  const abrir = (i) => {
    if (!pode(i)) { setTrava(livros[i].id); somQueda(); setTimeout(() => setTrava(null), 700); return }
    somSelo(); marcarLido('ap:en:' + livros[i].id); setAberto(livros[i].id)
    setTimeout(() => { if (painel.current) painel.current.scrollIntoView({ behavior: parouMovimento() ? 'auto' : 'smooth', block: 'start' }) }, 80)
  }
  const livro = livros.find((l) => l.id === aberto)
  const idx = livro ? livros.indexOf(livro) : -1
  const fixo = ENOQUE_LIVROS.find((l) => l.id === aberto)
  const correl = (db.correlacoesEn || []).filter((c) => livro && c.livro === livro.id)
  const tempo = TEMPO_ENOQUE.filter((e) => !fTempo || e.tipo === fTempo)
  const quantos = livros.filter((l) => lidos && lidos['ap:en:' + l.id]).length
  return (
    <TabuaShell editar="enoqueLivros">
      <h2 className="tab-titulo">O Livro de Enoque</h2>
      <ImgViva arquivo="ap-enoque-capa" alt="Uma estrada antiga no deserto em direção a uma montanha, sob um céu cheio de estrelas, com uma luz suave no horizonte" lado="cheia" fx="brilho" legenda="Enoque andou com Deus. (Gênesis 5:24)" />
      <Aviso forte>1 Enoque é um documento histórico judaico, e não revelação para a Igreja. O que está aqui serve para entender o mundo em que a Bíblia foi escrita, nunca para acrescentar doutrina.</Aviso>
      <article className="reportagem-pagina ap-leitura">
        <TextoLongo texto={`{{HISTÓRIA}} A Bíblia fala de [[termo:enoque-patriarca|Enoque]] em poucas linhas: andou com Deus e foi tomado (Gênesis 5:21-24), foi trasladado pela fé (Hebreus 11:5) e é lembrado por Judas como "o sétimo depois de Adão" (Judas 14-15).

{{HISTÓRIA}} Séculos depois, entre o século III a.C. e o século I d.C. (as datas são debatidas), judeus escreveram livros em nome dele. Eles formam o que hoje se chama 1 Enoque: uma coleção de cinco livros, escrita em hebraico ou aramaico e conservada por inteiro só em [[termo:ge-ez|ge'ez]], a língua litúrgica da Etiópia. É um exemplo de [[termo:literatura-apocaliptica|literatura apocalíptica]] e de [[termo:pseudepigrafia|pseudepigrafia]].

{{HISTÓRIA}} Fragmentos em aramaico foram achados entre os [[termo:manuscritos-do-mar-morto|Manuscritos do Mar Morto]], a partir de 1947. A [[termo:igreja-etiope|Igreja etíope]] o recebe no seu cânon. Judeus, católicos, ortodoxos e protestantes não o recebem. Não se deve confundi-lo com 2 Enoque e 3 Enoque, que são outros textos, bem mais tardios.`} />
      </article>

      <h2 className="tab-titulo">Do século III a.C. até hoje</h2>
      <div className="ap-chips" role="group" aria-label="Filtrar a linha do tempo">
        {[['', 'Tudo'], ['texto', 'Como o livro foi escrito'], ['uso', 'Uso na Igreja'], ['achado', 'Redescoberta']].map(([k, t]) => <button key={k} type="button" className={'ap-chip' + (fTempo === k ? ' on' : '')} onClick={() => setFTempo(k)}>{t}</button>)}
      </div>
      <ol className="ap-tempo">
        {tempo.map((e) => <li key={e.a + e.t} className={'tp-' + e.tipo}><b>{e.a < 0 ? Math.abs(e.a) + ' a.C.' : e.a}</b><span><strong>{e.t}.</strong> {e.d}</span></li>)}
      </ol>

      <h2 className="tab-titulo">Os cinco livros, cinco instrumentos</h2>
      <p className="mudo tab-sub">Cada livro é um selo. Rompa-os em ordem: cada instrumento tem o seu efeito, o seu som e a sua análise. Selos rompidos: {quantos} de {livros.length}.</p>
      <GraficoCaps />
      <div className="ap-selos" role="group" aria-label="Selos dos cinco livros">
        {livros.map((l, i) => {
          const rompido = !!(lidos && lidos['ap:en:' + l.id])
          return (
            <button key={l.id} type="button" className={'ap-selo' + (rompido ? ' rompido' : '') + (trava === l.id ? ' treme' : '') + (!pode(i) ? ' trancado' : '') + (aberto === l.id ? ' on' : '')} onClick={() => abrir(i)} style={{ '--cor': COR_LIVRO[l.id] }} aria-label={`Livro ${l.ordem}: ${l.titulo}. ${rompido ? 'Selo rompido.' : pode(i) ? 'Selo fechado. Toque para romper.' : 'Selo trancado: rompa antes o anterior.'}`}>
              <i className="ap-lacre" /><b>{l.ordem}</b><span>{l.titulo}</span><small>{rompido ? 'cap. ' + l.caps : pode(i) ? 'romper o selo' : 'trancado'}</small>
            </button>
          )
        })}
      </div>
      {trava && <p className="aviso" role="status">Rompa antes o selo anterior.</p>}

      <div ref={painel} className="ap-painel-livro">
        {livro && fixo && (
          <section key={livro.id} className="ap-instrumento" style={{ '--cor': COR_LIVRO[livro.id] }}>
            <header>
              <Selo tipo="ouro">LIVRO {livro.ordem} · CAPÍTULOS {livro.caps}</Selo><Selo>{livro.efeito}</Selo>{livro.rascunho !== false && <Selo>RASCUNHO PARA REVISÃO</Selo>}
              <h3>{livro.titulo}</h3>
              <p className="mudo">Datação: {livro.datacao}</p>
            </header>
            <ImgViva arquivo={'ap-enoque-' + livro.id} video={'ap-enoque-' + livro.id} alt={'Cena do ' + livro.titulo} lado="cheia" fx="nevoa" legenda={livro.titulo} />
            {livro.id === 'vigilantes' && <EfeitoVigilantes cenas={fixo.cenas} />}
            {livro.id === 'parabolas' && <EfeitoAlvorada cenas={fixo.cenas} />}
            {livro.id === 'astronomico' && <EfeitoAno />}
            {livro.id === 'sonhos' && <EfeitoRebanho />}
            {livro.id === 'epistola' && <EfeitoSemanas />}
            <h4>O que o livro diz</h4>
            <TextoLongo texto={livro.resumo} />
            <h4>Correlações com a Bíblia</h4>
            <TabelaCorrel itens={correl} filtrar={false} />
            <OrigemNC tipo="TRADIÇÃO" origem="1 Enoque, escrito judaico antigo, fora da Bíblia." relacionado={correl.map((c) => c.biblia).slice(0, 3).join(' · ')}>{livro.cuidado}</OrigemNC>
            <aside className="cartao ap-veredito">
              <Selo tipo="ouro">VEREDITO DO LIVRO</Selo>
              <p>{livro.veredito}</p>
            </aside>
            <div className="botoes">
              {idx < livros.length - 1 && <button type="button" className="btn ouro" onClick={() => abrir(idx + 1)}>Romper o próximo selo: {livros[idx + 1].titulo}</button>}
              {idx === livros.length - 1 && <a className="btn ouro" href="#ap-conclusao">Ir à conclusão</a>}
            </div>
          </section>
        )}
      </div>

      <h2 className="tab-titulo">Quadro de correlações com a Bíblia</h2>
      <p className="mudo tab-sub">Todos os pontos em comum, em um só quadro. Veja onde há citação, eco, tema parecido ou diferença.</p>
      <TabelaCorrel itens={db.correlacoesEn || []} />

      <h2 className="tab-titulo">Quem usou Enoque na Antiguidade</h2>
      <ul className="ap-uso">
        {USO_ENOQUE.map((u) => <li key={u.quem} style={{ '--cor': u.cor }}><span className="ap-uso-pos">{u.pos.toUpperCase()}</span><div><b>{u.quem}</b><p className="mudo">{u.txt}</p></div></li>)}
      </ul>
      <p className="mudo">Citações a conferir nas fontes originais antes de publicar.</p>

      <h2 className="tab-titulo" id="ap-conclusao">Por que não é Escritura</h2>
      <div className="ap-duas">
        <div>
          <h3>Para os cristãos</h3>
          {PORQUES_CRISTAO.map(([t, x]) => <details key={t} className="cartao ap-porque"><summary>{t}</summary><p>{x}</p></details>)}
        </div>
        <div>
          <h3>Para a tradição judaica</h3>
          {PORQUES_JUDAICO.map(([t, x]) => <details key={t} className="cartao ap-porque"><summary>{t}</summary><p>{x}</p></details>)}
          <p className="mudo">São os motivos que os historiadores costumam apontar. Os rabinos não deixaram uma lista de razões só sobre Enoque.</p>
        </div>
      </div>

      <h2 className="tab-titulo">Judas 14-15: duas leituras</h2>
      <div className="ap-duas">
        <article className="cartao"><Selo tipo="ouro">LEITURA 1</Selo><h3>Uma profecia verdadeira, preservada</h3><p>Judas reconhece que Enoque, o sétimo depois de Adão, de fato profetizou o juízo, e que essa palavra foi guardada naquele escrito. A verdade vale pelo que Judas, inspirado, afirma, e não por ser parte de um livro inteiro.</p></article>
        <article className="cartao"><Selo tipo="ouro">LEITURA 2</Selo><h3>Uma obra conhecida, usada como ilustração</h3><p>Judas usa uma obra que seus leitores conheciam, como Paulo usou poetas gregos (Atos 17:28), para dar peso ao aviso sobre o juízo. Isso não torna o livro Escritura.</p></article>
      </div>
      <p className="mudo">Nas duas, o que importa é o que Judas escreveu, e a Igreja o recebeu como Escritura.</p>

      <section className="cartao ap-veredito ap-final">
        <Selo tipo="ouro">VEREDITO DA SEÇÃO</Selo> <Selo>RASCUNHO PARA REVISÃO</Selo>
        <h3>1 Enoque: um documento antigo, e não Escritura</h3>
        <p>É importante para a História: mostra como judeus do século III a.C. ao I d.C. pensavam o juízo, os anjos, o calendário e o fim. Ajuda a entender Daniel, Judas e o mundo do Novo Testamento. Não foi recebido como Escritura pelos judeus nem pela maior parte da Igreja, e a Bíblia continua sendo a medida de tudo o que ele diz.</p>
        <div className="botoes">
          <Link className="btn ouro" to="/tabua-dos-apocrifos/balanca?livro=enoque">Pesar Enoque na Balança do Cânone</Link>
          <Link className="btn" to="/tabua-dos-apocrifos/mitos">Mitos e Fatos</Link>
          <Link className="btn" to="/tabua-dos-apocrifos/glossario">Glossário</Link>
        </div>
      </section>
    </TabuaShell>
  )
}

// ───── Painel de demonstrações (admin): prompts de imagem e vídeo ─────
function CartaoPrompt({ p }) {
  const [copiado, setCopiado] = useState(false)
  const ehVideo = p.tipo !== 'imagem'
  // null = verificando, true = o arquivo está no ar, false = o arquivo não foi enviado
  const [no, setNo] = useState(null)
  const copiar = () => {
    const fim = () => { setCopiado(true); setTimeout(() => setCopiado(false), 1800) }
    try { navigator.clipboard.writeText(p.prompt).then(fim, fim) } catch (e) { fim() }
  }
  return (
    <article className="cartao ap-prompt">
      <Selo tipo="ouro">{String(p.tipo).toUpperCase()}</Selo>{no === true && <Selo>NO AR</Selo>}{no === false && <Selo>FALTA O ARQUIVO</Selo>}
      <h3>{p.titulo}</h3>
      {no === false
        ? <div className="ap-prev ap-prev-falta" role="img" aria-label={'Ainda não enviado: ' + p.arquivo}><span>{ehVideo ? 'Vídeo ainda não enviado' : 'Imagem ainda não enviada'}</span></div>
        : ehVideo
          ? <video className="ap-prev" src={'/img/' + p.arquivo} controls muted loop playsInline preload="metadata" onLoadedMetadata={() => setNo(true)} onError={() => setNo(false)} aria-label={'Prévia: ' + p.titulo} />
          : <img className="ap-prev" src={'/img/' + p.arquivo} alt={'Prévia: ' + p.titulo} loading="lazy" onLoad={() => setNo(true)} onError={() => setNo(false)} />}
      <p className="mudo">Arquivo: <b>{p.arquivo}</b> (pasta public/img) · {p.onde}</p>
      <textarea readOnly rows={5} value={p.prompt} aria-label={'Prompt: ' + p.titulo} />
      <div className="botoes"><button type="button" className="btn ouro pequeno" onClick={copiar}>{copiado ? 'Copiado!' : 'Copiar o prompt'}</button></div>
    </article>
  )
}
function TabuaPainel() {
  const { db } = useLoja()
  return (
    <TabuaShell editar="promptsTabua">
      <h2 className="tab-titulo">Painel de demonstrações</h2>
      <p className="mudo tab-sub">Prompts para gerar as imagens e os vídeos da Tábua. Copie, gere, e suba o arquivo em public/img com o nome indicado.</p>
      <Aviso>Todos os prompts pedem imagens sem texto, rostos, anjos desenhados, figuras de Jesus ou de Deus, e sem símbolos ocultistas. Se o gerador desenhar algum desses, descarte e gere de novo.</Aviso>
      <GradeTres className="grade ap-prompts" tema="prompts">{(db.promptsTabua || []).map((p) => <CartaoPrompt key={p.id} p={p} />)}</GradeTres>
    </TabuaShell>
  )
}

// ───── Etapa 2: ficha em janela, Evangelhos fora do cânon e Bíblia Etíope ─────
function FichaAp({ selos, titulo, sub, aoFechar, rodape, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape' && document.querySelectorAll('.ap-termo-fundo').length <= 1) aoFechar() }
    window.addEventListener('keydown', k)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = antes }
  }, [aoFechar])
  return createPortal(
    <div className="ap-termo-fundo" role="dialog" aria-modal="true" aria-label={titulo} onClick={aoFechar}>
      <article className="ap-termo-cartao ap-ficha" onClick={(e) => e.stopPropagation()}>
        <header>
          {selos}
          <h3>{titulo}</h3>
          {sub && <p className="mudo">{sub}</p>}
        </header>
        <div className="ap-termo-corpo">{children}</div>
        <footer className="botoes">{rodape}</footer>
      </article>
    </div>,
    document.body
  )
}

// O teste da Escritura: o que o livro diz, e o que a Bíblia responde. O leitor "pesa" cada afirmação.
function TesteEscritura({ testes }) {
  const [vistos, setVistos] = useState({})
  return (
    <div className="ap-testes">
      {testes.map(([diz, resp, ref], i) => (
        <div key={i} className={'ap-teste' + (vistos[i] ? ' pesado' : '')}>
          <p className="ap-diz"><b>O livro diz</b> <Inline t={diz} /></p>
          {vistos[i]
            ? <p className="ap-resp"><b>A Bíblia responde</b> <Inline t={resp} /> <span className="ref">{ref}</span></p>
            : <button type="button" className="btn pequeno" onClick={() => { somPeso(i); setVistos((v) => ({ ...v, [i]: true })) }}>Pesar na Escritura</button>}
        </div>
      ))}
    </div>
  )
}

// ───── Os Evangelhos fora do cânon ─────
const TEXTO_EVANGELHOS = `{{HISTÓRIA}} A palavra [[termo:evangelho|evangelho]] quer dizer "boa notícia". Nos primeiros séculos, além de Mateus, Marcos, Lucas e João, circularam muitos outros livros que levavam esse nome. Esta sala examina onze deles, um por um: de onde vieram, o que dizem, onde diferem da Bíblia e por que não entraram no [[termo:canone|cânon]].

{{HISTÓRIA}} Já por volta do ano 180, [[termo:irineu|Irineu]] de Lyon defendia que a Igreja recebia quatro Evangelhos, e nem mais nem menos. Pouco antes, Tatiano reunira os quatro em um só texto, o [[termo:diatessaro|Diatessarão]]. Isso mostra que os quatro já eram os recebidos antes de se escrever a lista completa.

{{INTERPRETAÇÃO TEOLÓGICA}} Vários desses livros são [[termo:gnosticismo|gnósticos]] e ensinam coisas contrárias à fé cristã: que o mundo foi feito por um deus inferior, que a salvação vem de um saber secreto, que Jesus só "parecia" ter corpo. Eles aparecem aqui como documento histórico, em resumo, e cada ficha traz a resposta da Bíblia. Nunca como caminho espiritual.`

function ReguaEvangelhos({ lista }) {
  const [ok, setOk] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOk(true), parouMovimento() ? 0 : 300); return () => clearTimeout(t) }, [])
  const A = 50, B = 450, pos = (x) => ((Math.min(Math.max(x, A), B) - A) / (B - A)) * 100
  const linhas = [...REGUA_CANONICOS.map((c) => ({ ...c, canon: true })), ...lista.filter((e) => e.de && e.ate).sort((a, b) => a.de - b.de).map((e) => ({ id: e.id, nome: e.curto || e.titulo.replace(/^Evangelhos? (de |da |dos )?/, ''), de: e.de, ate: e.ate, fora: e.de > B }))]
  return (
    <figure className="ap-regua" aria-label="Régua do tempo: os quatro Evangelhos e os evangelhos fora do cânon">
      <div className="ap-regua-eixo" aria-hidden="true">{[100, 200, 300, 400].map((a) => <span key={a} style={{ left: pos(a) + '%' }}>{a}</span>)}</div>
      {linhas.map((l) => (
        <div key={l.id} className={'ap-regua-linha' + (l.canon ? ' canon' : '')}>
          <span className="ap-regua-nome">{l.nome}</span>
          <span className="ap-regua-trilho">
            <i style={{ left: pos(l.de) + '%', width: ok ? Math.max(pos(l.ate) - pos(l.de), 1.5) + '%' : '0%' }} />
            {l.fora && <em>século XVI →</em>}
          </span>
        </div>
      ))}
      <figcaption className="mudo">Anos aproximados, depois de Cristo. Os estudiosos divergem, e os mais conservadores situam os Evangelhos canônicos mais cedo. Em dourado, os quatro Evangelhos. Em verde, os outros: quase todos são do século II em diante.</figcaption>
    </figure>
  )
}

function TabuaEvangelhos() {
  useVisita('evangelhos')
  const { db, lidos, marcarLido } = useLoja()
  const lista = useMemo(() => [...(db.evangelhosAp || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [db.evangelhosAp])
  const [abertoId, setAbertoId] = useState(null)
  const aberto = lista.find((e) => e.id === abertoId)
  const lido = (e) => !!(lidos && lidos['ap:ev:' + e.id])
  const quantos = lista.filter(lido).length
  const fim = lista.length > 0 && quantos === lista.length
  const jaTocou = useRef(fim)
  useEffect(() => { if (fim && !jaTocou.current) { jaTocou.current = true; somSelo() } }, [fim])
  const abrir = (e) => { somPapiro(); setAbertoId(e.id) }
  const encerrar = () => { if (aberto) { marcarLido('ap:ev:' + aberto.id); somBadalada(1) } setAbertoId(null) }
  return (
    <TabuaShell editar="evangelhosAp">
      <h2 className="tab-titulo">Os Evangelhos fora do cânon</h2>
      <p className="mudo tab-sub">Onze livros, um por um, postos na mesa de exame: de onde vieram, o que dizem e o que a Bíblia responde.</p>
      <ImgViva arquivo="ap-evangelhos" video="ap-evangelhos" alt="Uma mesa de exame com fragmentos de papiro, uma lupa de bronze e uma balança pequena, sob a luz de uma lâmpada de óleo" lado="cheia" fx="nevoa" legenda="Examinar tudo e reter o bem (1 Tessalonicenses 5:21)." />
      <Aviso forte>Vários destes livros são gnósticos e contradizem a fé cristã. Estão aqui como documento histórico, e não como caminho espiritual. A Escritura é a medida.</Aviso>
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_EVANGELHOS} /></article>
      <h2 className="tab-titulo">A régua do tempo</h2>
      <ReguaEvangelhos lista={lista} />
      <h2 className="tab-titulo">A mesa de exame</h2>
      <p className="mudo tab-sub"><Selo tipo="ouro">{quantos} de {lista.length} fichas lidas</Selo> Abra cada ficha, pese as afirmações na Escritura e encerre a leitura.</p>
      <GradeTres className="grade ap-mesa" tema="apocrifos">
        {lista.map((e) => (
          <button key={e.id} type="button" className={'cartao ap-ev-item' + (lido(e) ? ' lido' : '')} onClick={() => abrir(e)} aria-haspopup="dialog">
            <span className="ap-ev-n" aria-hidden="true">{e.ordem}</span>
            <Selo tipo="ouro">{e.tipo}</Selo>
            <h3>{e.titulo}</h3>
            <p className="mudo">{e.data}</p>
            <span className="mudo">{lido(e) ? 'Leitura encerrada ✓' : 'Abrir a ficha →'}</span>
          </button>
        ))}
      </GradeTres>
      <h3 className="tab-titulo esq">Outros textos que aparecem nos livros</h3>
      <ul className="ap-outros">{OUTROS_EVANGELHOS.map(([n, d]) => <li key={n}><b>{n}.</b> {d}</li>)}</ul>
      {fim
        ? <section className="cartao ap-conclusao" aria-live="polite">
            <Selo tipo="ouro">SALA CONCLUÍDA</Selo>
            <h3>O que a mesa mostrou</h3>
            <p>Os Evangelhos fora do cânon são, em geral, mais tardios, de séculos depois dos quatro. Alguns são lendas devotas, outros são gnósticos e ensinam o contrário da Bíblia, e um é medieval. Nenhum tem origem apostólica nem uso amplo desde o começo. A Igreja não "escolheu" os quatro por decreto: reconheceu neles a voz do Pastor (João 10:27).</p>
            <p className="mudo">O estudo desses livros ajuda a entender a história, e a fé se firma na Escritura, no testemunho de Cristo e do Espírito Santo.</p>
          </section>
        : <p className="mudo">Quando as {lista.length} fichas forem lidas, o selo da sala se rompe.</p>}
      <Aviso>Estas fichas são rascunho para revisão. Datas, nomes e citações devem ser conferidos em fontes acadêmicas antes de publicar.</Aviso>
      {aberto && (
        <FichaAp
          titulo={aberto.titulo} sub={aberto.data} aoFechar={() => setAbertoId(null)}
          selos={<><Selo tipo="ouro">{aberto.tipo}</Selo>{aberto.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}</>}
          rodape={<><button type="button" className="btn" onClick={() => setAbertoId(null)}>Fechar</button><button type="button" className="btn ouro" onClick={encerrar}>Encerrar leitura</button></>}
        >
          <h4>O que é</h4><p><Inline t={aberto.resumo} /></p>
          <h4>De onde veio</h4><p><Inline t={aberto.achado} /></p>
          <h4>O que contém</h4>
          <ul>{(Array.isArray(aberto.contem) ? aberto.contem : String(aberto.contem || '').split('\n').filter(Boolean)).map((c, i) => <li key={i}><Inline t={c} /></li>)}</ul>
          <h4><Selo>INTERPRETAÇÃO TEOLÓGICA</Selo> O teste da Escritura</h4>
          <TesteEscritura testes={aberto.testes || []} />
          <h4>Veredito</h4>
          <p className="ap-veredito">{aberto.veredito}</p>
          <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
        </FichaAp>
      )}
    </TabuaShell>
  )
}

// ───── A Bíblia Etíope ─────
const TEXTO_ETIOPE = `{{HISTÓRIA}} O cristianismo chegou cedo à Etiópia: o eunuco de Atos 8 já voltava de Jerusalém para casa. No século IV, o reino de [[termo:axum|Axum]] se tornou cristão, e a Bíblia foi traduzida para o [[termo:ge-ez|ge'ez]]. A [[termo:tewahedo|Igreja Ortodoxa Etíope Tewahedo]] guarda até hoje um cânon mais amplo que o da maioria das igrejas.

{{HISTÓRIA}} As contagens variam, e o número de 81 livros é o mais citado (a conferir). Entre eles estão livros que a Bíblia comum não tem, como [[termo:jubileus|Jubileus]], 1 Enoque e os Meqabyan. Alguns existem inteiros só em ge'ez, e por isso a Etiópia guardou textos que se perderam em outros lugares.

{{INTERPRETAÇÃO TEOLÓGICA}} Para a maioria das igrejas, esses livros não são Escritura: não estavam na Bíblia que Jesus e os apóstolos usaram, não tiveram uso amplo e antigo nas igrejas do mundo mediterrâneo, e vários foram escritos tarde, com nome de um grande personagem. O Ministério respeita a tradição etíope, e segue a regra: a Bíblia é a medida, e cada livro é lido à luz dela.`

function NotasBalanca({ notas }) {
  const [ok, setOk] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOk(true), parouMovimento() ? 0 : 200); return () => clearTimeout(t) }, [])
  const soma = notas.reduce((a, b) => a + b, 0)
  return (
    <div className="ap-notas">
      {CRITERIOS.map((c, i) => (
        <div key={c.id} className="ap-nota">
          <span>{c.curto}</span>
          <span className="ap-nota-trilho"><i style={{ width: ok ? (notas[i] / 3) * 100 + '%' : '0%' }} /></span>
          <b>{notas[i]}/3</b>
        </div>
      ))}
      <p className="mudo">Peso: {soma} de 15. É uma leitura didática do Ministério, e não uma nota oficial: a Igreja nunca somou pontos.</p>
    </div>
  )
}

function TabuaEtiope() {
  useVisita('etiope')
  const { db, lidos, marcarLido } = useLoja()
  const nav = useNavigate()
  const lista = useMemo(() => [...(db.etiopeAp || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [db.etiopeAp])
  const [abertoId, setAbertoId] = useState(null)
  const aberto = lista.find((e) => e.id === abertoId)
  const lido = (e) => !!(lidos && lidos['ap:et:' + e.id])
  const quantos = lista.filter(lido).length
  const fim = lista.length > 0 && quantos === lista.length
  const jaTocou = useRef(fim)
  useEffect(() => { if (fim && !jaTocou.current) { jaTocou.current = true; somSelo() } }, [fim])
  const abrir = (e) => { somPapiro(); setAbertoId(e.id) }
  const encerrar = () => { if (aberto) { marcarLido('ap:et:' + aberto.id); somBadalada(2) } setAbertoId(null) }
  const cor = (i) => ['#7a4a2a', '#5a3b52', '#2f5a52', '#6b5a2a', '#4a4a6b', '#6b3a3a', '#3a5a3a', '#5a4a2f', '#2f4a6b'][i % 9]
  return (
    <TabuaShell editar="etiopeAp">
      <h2 className="tab-titulo">A Bíblia Etíope</h2>
      <p className="mudo tab-sub">A estante dos livros que a Igreja Etíope guarda e a Bíblia comum não tem.</p>
      <ImgViva arquivo="ap-etiope" video="ap-etiope" alt="Uma estante de madeira com códices de pergaminho em capas de madeira, em uma igreja de pedra, sob a luz de uma janela alta" lado="cheia" fx="nevoa" legenda="Um cânon mais amplo, guardado por mais de mil e quinhentos anos." />
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_ETIOPE} /></article>
      <h2 className="tab-titulo">De Axum até nós</h2>
      <ol className="ap-tempo">{LINHA_AXUM.map(([a, t]) => <li key={a + t}><b>{a}</b><span><Inline t={t} /></span></li>)}</ol>
      <h2 className="tab-titulo">A estante</h2>
      <p className="mudo tab-sub"><Selo tipo="ouro">{quantos} de {lista.length} livros lidos</Selo> Toque num livro para abrir a ficha e ver como ele se sai na balança.</p>
      <div className="ap-estante" role="group" aria-label="Estante dos livros etíopes">
        {lista.map((e, i) => (
          <button key={e.id} type="button" className={'ap-lombada' + (lido(e) ? ' lido' : '')} style={{ '--c': cor(i), '--h': 150 + ((i * 37) % 5) * 12 + 'px' }} onClick={() => abrir(e)} aria-label={'Abrir a ficha: ' + e.titulo}>
            <span>{e.curto || e.titulo}</span>
          </button>
        ))}
      </div>
      <GradeTres className="grade ap-mesa" tema="apocrifos">
        {lista.map((e) => (
          <button key={e.id} type="button" className={'cartao ap-ev-item' + (lido(e) ? ' lido' : '')} onClick={() => abrir(e)} aria-haspopup="dialog">
            <span className="ap-ev-n" aria-hidden="true">{e.ordem}</span>
            <Selo tipo="ouro">{e.tipo}</Selo>{e.nc && <Selo>ORIGEM NÃO COMPROVADA</Selo>}{e.pendente && <Selo>A CONFERIR</Selo>}
            <h3>{e.titulo}</h3>
            <p className="mudo">{e.data}</p>
            <span className="mudo">{lido(e) ? 'Leitura encerrada ✓' : 'Abrir a ficha →'}</span>
          </button>
        ))}
      </GradeTres>
      {fim
        ? <section className="cartao ap-conclusao" aria-live="polite">
            <Selo tipo="ouro">SALA CONCLUÍDA</Selo>
            <h3>O que a estante mostrou</h3>
            <p>A Igreja Etíope guarda uma tradição cristã antiga e preciosa, e livros que ajudam a conhecer o mundo judaico e cristão dos primeiros séculos. Mas, pelos cinco testes da Balança, nenhum dos livros desta estante tem o conjunto que marca a Escritura: origem apostólica, fé recebida, uso amplo, antiguidade e reconhecimento. A Bíblia continua sendo a medida (2 Timóteo 3:16-17).</p>
          </section>
        : <p className="mudo">Quando os {lista.length} livros forem lidos, o selo da sala se rompe.</p>}
      <Aviso>Estas fichas são rascunho para revisão. Os nomes e as contagens do cânon etíope variam conforme a fonte e devem ser conferidos antes de publicar.</Aviso>
      {aberto && (
        <FichaAp
          titulo={aberto.titulo} sub={aberto.data} aoFechar={() => setAbertoId(null)}
          selos={<><Selo tipo="ouro">{aberto.tipo}</Selo>{aberto.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}{aberto.pendente && <Selo>A CONFERIR</Selo>}</>}
          rodape={<>
            {aberto.link && <button type="button" className="btn" onClick={() => { setAbertoId(null); nav(aberto.link) }}>Abrir a sala de Enoque</button>}
            <button type="button" className="btn" onClick={() => setAbertoId(null)}>Fechar</button>
            <button type="button" className="btn ouro" onClick={encerrar}>Encerrar leitura</button>
          </>}
        >
          <h4>O que é</h4><p><Inline t={aberto.resumo} /></p>
          <h4>Onde está</h4><p><Inline t={aberto.onde} /></p>
          <h4><Selo>INTERPRETAÇÃO TEOLÓGICA</Selo> Como a fé cristã avalia</h4><p><Inline t={aberto.avaliacao} /></p>
          {aberto.nc && <OrigemNC tipo="TRADIÇÃO" origem="Obra nacional etíope, reunida na Idade Média (a conferir), que diz traduzir textos mais antigos." relacionado="1 Reis 10; 2 Crônicas 35:3; Jeremias 3:16">Uma tradição amada e antiga, mas sem prova bíblica nem histórica do que afirma sobre a Arca.</OrigemNC>}
          {Array.isArray(aberto.notas) && <><h4>Na balança do cânone</h4><NotasBalanca notas={aberto.notas} /></>}
          <h4>Veredito</h4>
          <p className="ap-veredito">{aberto.veredito}</p>
          <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
        </FichaAp>
      )}
    </TabuaShell>
  )
}

/* ───────────── CÂNON E REFORMA ───────────── */
// Módulo à parte: a Estante dos 7 livros, o debate em três tempos, o Túnel do Tempo e os reformadores.
// Regra: católicos e evangélicos são ouvidos como cada lado se apresenta. A Escritura é a medida.

const SALAS_REF = [
  ['/canon-e-reforma', 'Portão'], ['/canon-e-reforma/estante', 'A Estante dos 7 livros'], ['/canon-e-reforma/debate', 'Por que não aceitam?'],
  ['/canon-e-reforma/tunel', 'Túnel do Tempo'], ['/canon-e-reforma/reformadores', 'Reformadores'],
]
function ReformaShell({ editar = 'livrosRef', children }) {
  const { db, sessao } = useLoja()
  const loc = useLocation()
  const [pilha, setPilha] = useState([])
  const termos = db.termosAp || []
  const ctx = useMemo(() => ({ abrir: (id) => setPilha((p) => (termos.some((x) => x.id === id) ? [...p, id] : p)) }), [termos])
  const atual = pilha.length ? termos.find((x) => x.id === pilha[pilha.length - 1]) : null
  return (
    <Shell titulo="Cânon e Reforma" editar={editar}>
      <TermoCtx.Provider value={ctx}>
        <nav className="abas ap-abas" aria-label="Salas de Cânon e Reforma">
          {SALAS_REF.map(([to, t]) => <Link key={to} to={to} className={loc.pathname === to ? 'active' : ''} aria-current={loc.pathname === to ? 'page' : undefined}>{t}</Link>)}
          {sessao && sessao.admin && <Link to="/canon-e-reforma/painel" className={loc.pathname.endsWith('/painel') ? 'active' : ''}>Painel de demonstrações</Link>}
        </nav>
        {children}
        {atual && <TermoCartao termo={atual} aoFechar={() => setPilha([])} aoVoltar={() => setPilha((p) => p.slice(0, -1))} podeVoltar={pilha.length > 1} />}
      </TermoCtx.Provider>
    </Shell>
  )
}
function useVisitaRef(id) {
  const { marcarLido } = useLoja()
  useEffect(() => { marcarLido('ref:sala:' + id) }, [id])
}
function ListaRef({ t }) {
  const itens = String(t || '').split('\n').map((l) => l.trim()).filter(Boolean)
  return <ul>{itens.map((l, i) => <li key={i}><Inline t={l.replace(/^•\s*/, '')} /></li>)}</ul>
}
// Imagem que flutua e deixa o texto contornar. Se o arquivo ainda não existe, só o admin vê o espaço reservado.
function FotoRef({ arquivo, alt, legenda, video, lado = 'dir' }) {
  return <ImgViva arquivo={arquivo} video={video} alt={alt} lado={lado + ' contorno'} fx="nevoa" legenda={legenda} />
}
function ContaAte({ valor, ms = 1100 }) {
  const [n, setN] = useState(parouMovimento() ? valor : 0)
  useEffect(() => {
    if (parouMovimento()) { setN(valor); return undefined }
    let id = 0
    const ini = performance.now()
    const f = (t) => {
      const k = Math.min(1, (t - ini) / ms)
      setN(Math.round(valor * (1 - Math.pow(1 - k, 3))))
      if (k < 1) id = requestAnimationFrame(f)
    }
    id = requestAnimationFrame(f)
    return () => cancelAnimationFrame(id)
  }, [valor])
  return <>{n}</>
}

// ───── Portão ─────
const TEXTO_REF_PORTAL = `{{HISTÓRIA}} A Bíblia que a maioria dos católicos lê tem 73 livros. A que a maioria dos evangélicos lê tem 66. A diferença está no Antigo Testamento: sete livros inteiros (Tobias, Judite, 1 e 2 Macabeus, Sabedoria, Eclesiástico e Baruque) e partes de Ester e de Daniel. O Novo Testamento é igual nas duas, com 27 livros.

{{HISTÓRIA}} Os católicos chamam esses livros de [[termo:deuterocanonicos|deuterocanônicos]], "do segundo cânon". Os evangélicos costumam chamá-los de apócrifos, palavra que também nomeia outros livros. Por isso este módulo usa, quase sempre, o nome neutro "os sete livros". A pergunta sobre eles atravessa mais de mil anos e passa pela [[termo:protestante|Reforma]] do século XVI.

{{INTERPRETAÇÃO TEOLÓGICA}} Aqui cada lado é apresentado do jeito que ele mesmo se apresentaria, com as suas razões, e a Escritura fica como medida. Onde há desacordo real, o texto diz que há, sem declarar vencedor onde a Bíblia não decide. A pergunta "por que os evangélicos não aceitam?" é respondida com cuidado, e a resposta católica é ouvida por inteiro.`

const ROLOS_REF = [
  { id: 'estante', to: '/canon-e-reforma/estante', titulo: 'A Estante dos 7 livros', sub: 'Cada livro, o comparador de cânones e a evolução da estante' },
  { id: 'debate', to: '/canon-e-reforma/debate', titulo: 'Por que não aceitam?', sub: 'Sete debates em três tempos: afirmação, resposta e réplica' },
  { id: 'tunel', to: '/canon-e-reforma/tunel', titulo: 'O Túnel do Tempo', sub: 'De Alexandria a hoje, com as correlações de tempos' },
  { id: 'reformadores', to: '/canon-e-reforma/reformadores', titulo: 'Precursores e reformadores', sub: 'Valdo, Wycliffe, Hus, Lutero, Calvino e os outros' },
]
function RefPortal() {
  useVisitaRef('portal')
  const { lidos } = useLoja()
  const vistas = ROLOS_REF.filter((r) => lidos && lidos['ref:sala:' + r.id]).length
  return (
    <ReformaShell>
      <h2 className="tab-titulo">Cânon e Reforma</h2>
      <p className="mudo tab-sub">Por que a Bíblia católica tem sete livros a mais, e o que foi a Reforma que separou os caminhos.</p>
      <div className="jor-topo ref-topo">
  <ImgViva arquivo="ref-portal" video="ref-portal" alt="Uma estante de madeira em um salão de pedra, com dois lados de volumes e uma lamparina no meio, sob a luz da manhã" lado="cheia" fx="nevoa" legenda="Duas estantes, um mesmo Cristo. Vamos entender de onde veio a diferença." />
        <ApresentaVideo nome="apresenta-canon-reforma" titulo="Cânon e Reforma" texto="Como os livros da Bíblia foram reunidos, os sete livros em disputa, o Túnel do Tempo e os reformadores, sempre com as fontes e com respeito a cada tradição." ajuda="O vídeo de apresentação abre aqui sozinho assim que o arquivo apresenta-canon-reforma.mp4 estiver na pasta public/img." />
      </div>
      <div className="ref-contagem" role="group" aria-label="Contagem dos livros: 73, 7 e 66">
        <div><b><ContaAte valor={73} /></b><span>Bíblia católica<small>46 + 27 livros</small></span></div>
        <div className="meio"><b>+<ContaAte valor={7} /></b><span>livros a mais<small>e partes de Ester e Daniel</small></span></div>
        <div><b><ContaAte valor={66} /></b><span>Bíblia evangélica<small>39 + 27 livros</small></span></div>
      </div>
      <Aviso forte>Católicos e evangélicos são apresentados como cada lado se apresenta, sem caricatura. A Escritura é a medida, e a revelação vem somente de Deus, pelo Espírito Santo.</Aviso>
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_REF_PORTAL} /></article>
      <h2 className="tab-titulo">As salas</h2>
      <p className="mudo tab-sub"><Selo tipo="ouro">{vistas} de {ROLOS_REF.length} salas visitadas</Selo></p>
      <Organograma
        chave="reforma"
        titulo="As salas do Cânon e Reforma"
        rotulo="Toque em um card para entrar na sala. Toque no centro para ouvir a Palavra."
        nos={ROLOS_REF.map((r) => ({ id: r.id, titulos: ORG_REFORMA[r.id].titulos, titulo: r.titulo, desc: r.sub, verso: ORG_REFORMA[r.id].verso, to: r.to, extra: lidos && lidos['ref:sala:' + r.id] ? 'visitada' : 'nova' }))}
      />
      <Aviso>Todos os textos deste módulo são rascunho para revisão. Datas, nomes e números marcados "(a conferir)" devem ser conferidos em fontes acadêmicas antes de ir ao ar.</Aviso>
    </ReformaShell>
  )
}

// ───── Estante dos 7 livros ─────
const TEXTO_REF_ESTANTE = `{{HISTÓRIA}} Estes são os livros em disputa. Cada lombada abre uma ficha com a história do livro, o que ele ensina, onde está na Bíblia católica e como cada tradição o trata. A ficha é um resumo de estudo: o melhor é ler o livro inteiro, de preferência numa Bíblia católica, e comparar com a Escritura que todos aceitam.

{{INTERPRETAÇÃO TEOLÓGICA}} Para os católicos, os sete livros são Escritura inspirada, parte do Antigo Testamento desde os primeiros séculos. Para os evangélicos, são escritos antigos e úteis, mas sem autoridade de Escritura. O debate, com os seus argumentos, está na sala "Por que não aceitam?".`

function ComparadorCanones() {
  const [sel, setSel] = useState('todas')
  const trad = TRADICOES.find((t) => t.id === sel)
  const rotulo = { sim: 'Sim', ap: 'Apêndice', nao: 'Não' }
  return (
    <section className="ref-comp" aria-label="Comparador de cânones">
      <div className="abas" role="group" aria-label="Escolher a tradição">
        <button type="button" className={sel === 'todas' ? 'active' : ''} onClick={() => setSel('todas')} aria-pressed={sel === 'todas'}>Todas</button>
        {TRADICOES.map((t) => <button key={t.id} type="button" className={sel === t.id ? 'active' : ''} onClick={() => { setSel(t.id); try { somTique(false) } catch (e) { /* som é opcional */ } }} aria-pressed={sel === t.id}>{t.nome}</button>)}
      </div>
      <div className="ref-tab-envolve">
        <table className="ref-tab">
          <thead>
            <tr><th scope="col">Livro</th>{TRADICOES.map((t) => <th key={t.id} scope="col" className={sel === t.id ? 'foco' : sel !== 'todas' ? 'apagado' : ''}>{t.nome}</th>)}</tr>
          </thead>
          <tbody>
            {COMPARADOR.map((l) => (
              <tr key={l.id} className={'grupo-' + slug(l.grupo)}>
                <th scope="row">{l.nome}</th>
                {TRADICOES.map((t) => (
                  <td key={t.id} className={'v-' + l[t.id] + (sel === t.id ? ' foco' : sel !== 'todas' ? ' apagado' : '')}>{rotulo[l[t.id]]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {trad
        ? <div className="aviso" role="status"><b>{trad.nome}:</b> {trad.total}. {trad.nota}</div>
        : <p className="mudo">Toque numa tradição para destacá-la e ver o total e uma nota. Os números marcados "(a conferir)" dependem da fonte.</p>}
    </section>
  )
}

const LINHAS_EVOL = [
  ['cristao', 'Igreja cristã', 'a Bíblia grega e latina'],
  ['sinagoga', 'Sinagoga', 'a Bíblia hebraica'],
  ['reforma', 'Igrejas da Reforma', 'a Bíblia evangélica'],
]
const ROT_ESTADO = { dentro: 'na estante', meio: 'à parte', fora: 'fora da estante', nao: 'ainda não existia' }
function EvolucaoCanone({ inicial = 0 }) {
  const n = ESTAGIOS_CANON.length
  const [i, setI] = useState(Math.min(Math.max(inicial, 0), n - 1))
  const [toca, setToca] = useState(false)
  const primeira = useRef(true)
  const e = ESTAGIOS_CANON[i]
  const sete = LIVROS_DEUTERO.slice(0, 7)
  useEffect(() => { if (primeira.current) { primeira.current = false; return } try { somPapiro() } catch (err) { /* som é opcional */ } }, [i])
  useEffect(() => {
    if (!toca) return undefined
    const t = setInterval(() => setI((x) => Math.min(n - 1, x + 1)), 4800)
    return () => clearInterval(t)
  }, [toca])
  useEffect(() => { if (toca && i >= n - 1) setToca(false) }, [toca, i])
  return (
    <section className="ref-evol" id="evolucao" aria-label="A evolução do cânon">
      <div className="ref-evol-linhas">
        {LINHAS_EVOL.map(([k, nome, sub]) => (
          <div key={k} className={'ref-linha estado-' + e[k]}>
            <div className="ref-linha-nome"><b>{nome}</b><small>{sub}</small><em>{ROT_ESTADO[e[k]]}</em></div>
            <div className="ref-prateleira" aria-hidden="true">
              {sete.map((l, j) => <span key={l.id} className={'ref-chip est-' + e[k]} style={{ transitionDelay: (parouMovimento() ? 0 : j * 60) + 'ms' }}>{l.curto}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div className="ref-evol-texto" aria-live="polite">
        <Selo tipo="ouro">{e.ano}</Selo>
        <h3>{e.titulo}</h3>
        <TextoLongo texto={e.texto} />
      </div>
      <div className="ref-evol-ctrl">
        <button type="button" className="btn" disabled={i === 0} onClick={() => { setToca(false); setI(i - 1) }}>← Antes</button>
        <input type="range" min="0" max={n - 1} value={i} onChange={(ev) => { setToca(false); setI(Number(ev.target.value)) }} aria-label="Deslizador do tempo da estante" aria-valuetext={e.ano + ': ' + e.titulo} />
        <button type="button" className="btn" disabled={i === n - 1} onClick={() => { setToca(false); setI(i + 1) }}>Depois →</button>
        <button type="button" className="btn ouro pequeno" onClick={() => { if (!toca && i >= n - 1) setI(0); setToca((t) => !t) }} aria-pressed={toca}>{toca ? 'Parar' : 'Reproduzir'}</button>
      </div>
      <ol className="ref-evol-marcas" aria-label="Etapas">
        {ESTAGIOS_CANON.map((s, k) => <li key={s.id}><button type="button" className={k === i ? 'ativo' : k < i ? 'passou' : ''} onClick={() => { setToca(false); setI(k) }} aria-label={s.ano + ': ' + s.titulo} aria-current={k === i ? 'step' : undefined}><span>{s.ano}</span></button></li>)}
      </ol>
    </section>
  )
}

function RefEstante() {
  useVisitaRef('estante')
  const { db, lidos, marcarLido } = useLoja()
  const [busca] = useSearchParams()
  const etapaIni = Number(busca.get('etapa')) || 0
  const lista = useMemo(() => [...(db.livrosRef || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [db.livrosRef])
  const [abertoId, setAbertoId] = useState(null)
  const aberto = lista.find((x) => x.id === abertoId)
  const lido = (x) => !!(lidos && lidos['ref:l:' + x.id])
  const quantos = lista.filter(lido).length
  const fim = lista.length > 0 && quantos === lista.length
  const jaTocou = useRef(fim)
  useEffect(() => { if (fim && !jaTocou.current) { jaTocou.current = true; somSelo() } }, [fim])
  useEffect(() => { if (etapaIni && typeof document !== 'undefined') { const el = document.getElementById('evolucao'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' }) } }, [etapaIni])
  const abrir = (x) => { somPapiro(); setAbertoId(x.id) }
  const encerrar = () => { if (aberto) { marcarLido('ref:l:' + aberto.id); somBadalada(2) } setAbertoId(null) }
  const cor = (i) => ['#7a4a2a', '#5a3b52', '#2f5a52', '#6b5a2a', '#4a4a6b', '#6b4a3a', '#3a5a3a', '#5a4a2f'][i % 8]
  return (
    <ReformaShell editar="livrosRef">
      <h2 className="tab-titulo">A Estante dos 7 livros</h2>
      <p className="mudo tab-sub">Os livros que a Bíblia católica tem a mais, um a um.</p>
      <ImgViva arquivo="ref-estante" video="ref-estante" alt="Uma estante escura com sete volumes de pergaminho um pouco afastados de uma longa fileira de outros volumes, sob a luz de uma lamparina" lado="cheia" fx="nevoa" legenda="Sete volumes, uma pergunta antiga." />
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_REF_ESTANTE} /></article>
      <h2 className="tab-titulo">A estante</h2>
      <p className="mudo tab-sub"><Selo tipo="ouro">{quantos} de {lista.length} fichas lidas</Selo> Toque numa lombada para abrir a ficha.</p>
      <div className="ap-estante" role="group" aria-label="Estante dos sete livros e dos acréscimos">
        {lista.map((x, i) => (
          <button key={x.id} type="button" className={'ap-lombada' + (lido(x) ? ' lido' : '')} style={{ '--c': cor(i), '--h': 150 + ((i * 37) % 5) * 12 + 'px' }} onClick={() => abrir(x)} aria-label={'Abrir a ficha: ' + x.titulo}>
            <span>{x.curto || x.titulo}</span>
          </button>
        ))}
      </div>
      <GradeTres className="grade ap-mesa" tema="refEstante">
        {lista.map((x) => (
          <button key={x.id} type="button" className={'cartao ap-ev-item' + (lido(x) ? ' lido' : '')} onClick={() => abrir(x)} aria-haspopup="dialog">
            <span className="ap-ev-n" aria-hidden="true">{x.ordem}</span>
            <Selo tipo="ouro">{x.tipo}</Selo>
            <h3>{x.titulo}</h3>
            <p className="mudo">{x.data}</p>
            <span className="mudo">{lido(x) ? 'Leitura encerrada ✓' : 'Abrir a ficha →'}</span>
          </button>
        ))}
      </GradeTres>
      {fim && (
        <section className="cartao ap-conclusao" aria-live="polite">
          <Selo tipo="ouro">ESTANTE CONCLUÍDA</Selo>
          <h3>O que a estante mostrou</h3>
          <p>Os sete livros não são todos iguais: há histórias, sabedoria, oração e narrativas de ensino. Católicos os recebem como Escritura; evangélicos os respeitam como escritos antigos, sem autoridade de Escritura. Para decidir com consciência, o caminho é ler os livros, ouvir os dois lados na sala "Por que não aceitam?" e medir tudo pela Bíblia (2 Timóteo 3:16-17).</p>
          <div className="botoes"><Link className="btn ouro" to="/canon-e-reforma/debate">Ir ao debate</Link></div>
        </section>
      )}
      <h2 className="tab-titulo">O que cada tradição recebe</h2>
      <p className="mudo tab-sub">Compare a Bíblia católica, a ortodoxa, a evangélica e a judaica.</p>
      <ComparadorCanones />
      <h2 className="tab-titulo">Como a estante mudou ao longo do tempo</h2>
      <p className="mudo tab-sub">Mova o deslizador e veja três estantes que começam juntas e depois se afastam.</p>
      <EvolucaoCanone inicial={etapaIni} />
      <Aviso>Estas fichas são rascunho para revisão. Datas e contagens marcadas "(a conferir)" dependem das fontes.</Aviso>
      {aberto && (
        <FichaAp
          titulo={aberto.titulo} sub={aberto.data} aoFechar={() => setAbertoId(null)}
          selos={<><Selo tipo="ouro">{aberto.tipo}</Selo>{aberto.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}</>}
          rodape={<>
            <Link className="btn" to="/canon-e-reforma/debate" onClick={() => setAbertoId(null)}>Ver o debate</Link>
            <button type="button" className="btn" onClick={() => setAbertoId(null)}>Fechar</button>
            <button type="button" className="btn ouro" onClick={encerrar}>Encerrar leitura</button>
          </>}
        >
          <FotoRef arquivo={'ref-l-' + aberto.id} alt={'Cena de estudo: ' + aberto.titulo} legenda={aberto.curto || aberto.titulo} />
          <h4>O que é</h4><p><Inline t={aberto.resumo} /></p>
          <h4>O que ensina</h4><ListaRef t={aberto.ensina} />
          <h4>Onde está</h4><p><Inline t={aberto.onde} /></p>
          <h4><Selo>HISTÓRIA</Selo> Ecos apontados</h4><p><Inline t={aberto.ecos} /></p>
          <h4>Cuidado ao ler</h4><p><Inline t={aberto.cuidado} /></p>
          <div className="ref-lados">
            <section className="ref-lado cat"><b>Os católicos</b><p><Inline t={aberto.catolico} /></p></section>
            <section className="ref-lado ev"><b>Os evangélicos</b><p><Inline t={aberto.evangelico} /></p></section>
          </div>
          <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
        </FichaAp>
      )}
    </ReformaShell>
  )
}

// ───── Por que não aceitam? ─────
const TEXTO_REF_DEBATE = `{{INTERPRETAÇÃO TEOLÓGICA}} Aqui estão os sete argumentos que mais pesam. Cada um é um debate em três tempos: primeiro, o que dizem os evangélicos; depois, a resposta dos católicos; por fim, a réplica evangélica e o ponto que fica em aberto. Os argumentos são apresentados no melhor formato de cada lado, sem escolher vencedor onde a Bíblia não decide.

{{HISTÓRIA}} Antes de tudo, vale lembrar um fato que os dois lados reconhecem: durante mais de mil anos a Igreja do Ocidente usou a [[termo:vulgata|Vulgata]], que traz os sete livros. A separação em cânones diferentes só se firmou depois da [[termo:protestante|Reforma]].`

function DebateFicha({ a, aoFechar, aoLer }) {
  const [passo, setPasso] = useState(0)
  useEffect(() => { if (passo >= 3) aoLer() }, [passo])
  const rotulos = ['Ouvir a resposta católica', 'Ver a réplica evangélica', 'Ver onde o debate fica em aberto']
  const avancar = () => { somPeso(passo); setPasso((p) => Math.min(3, p + 1)) }
  return (
    <FichaAp
      titulo={a.titulo} sub={'Debate ' + a.ordem + ' de 7'} aoFechar={aoFechar}
      selos={<>{a.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}<Selo tipo="ouro">DEBATE EM TRÊS TEMPOS</Selo></>}
      rodape={<>
        <button type="button" className="btn" onClick={aoFechar}>Fechar</button>
        {passo < 3 && <button type="button" className="btn ouro" onClick={avancar}>{rotulos[passo]}</button>}
      </>}
    >
      <ol className="ref-passos" aria-label="Etapas do debate">
        {['Afirmação', 'Resposta', 'Réplica', 'Em aberto'].map((t, k) => <li key={t} className={k <= passo ? 'ligado' : ''}>{t}</li>)}
      </ol>
      <section className="ref-voz ev"><b>Os evangélicos dizem</b><p><Inline t={a.evangelico} /></p></section>
      {passo >= 1 && <section className="ref-voz cat"><b>Os católicos respondem</b><p><Inline t={a.catolico} /></p></section>}
      {passo >= 2 && <section className="ref-voz ev"><b>Réplica evangélica</b><p><Inline t={a.replica} /></p></section>}
      {passo >= 3 && <section className="ref-voz aberto"><b>Em aberto</b><p className="ap-veredito"><Inline t={a.aberto} /></p></section>}
      {a.ref && <p className="ref">{a.ref}</p>}
      <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
    </FichaAp>
  )
}

function RefDebate() {
  useVisitaRef('debate')
  const { db, lidos, marcarLido } = useLoja()
  const lista = useMemo(() => [...(db.argumentosRef || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [db.argumentosRef])
  const [abertoId, setAbertoId] = useState(null)
  const aberto = lista.find((x) => x.id === abertoId)
  const lido = (x) => !!(lidos && lidos['ref:a:' + x.id])
  const quantos = lista.filter(lido).length
  const fim = lista.length > 0 && quantos === lista.length
  const jaTocou = useRef(fim)
  useEffect(() => { if (fim && !jaTocou.current) { jaTocou.current = true; somSelo() } }, [fim])
  return (
    <ReformaShell editar="argumentosRef">
      <h2 className="tab-titulo">Por que os evangélicos não aceitam?</h2>
      <p className="mudo tab-sub">Sete argumentos, cada um em três tempos.</p>
      <ImgViva arquivo="ref-debate" alt="Uma balança de madeira sobre uma mesa de pedra, com sete pequenos rolos em um prato e um livro aberto no outro, sob a luz de uma janela" lado="cheia" fx="brilho" legenda="Peso e contrapeso: cada lado ouvido por inteiro." />
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_REF_DEBATE} /></article>
      <p className="mudo tab-sub"><Selo tipo="ouro">{quantos} de {lista.length} debates ouvidos</Selo> Abra cada um e avance passo a passo.</p>
      <GradeTres className="grade ap-mesa" tema="refDebate">
        {lista.map((x) => (
          <button key={x.id} type="button" className={'cartao ap-ev-item' + (lido(x) ? ' lido' : '')} onClick={() => { somPapiro(); setAbertoId(x.id) }} aria-haspopup="dialog">
            <span className="ap-ev-n" aria-hidden="true">{x.ordem}</span>
            <Selo tipo="ouro">DEBATE</Selo>
            <h3>{x.titulo}</h3>
            <span className="mudo">{lido(x) ? 'Debate ouvido ✓' : 'Abrir o debate →'}</span>
          </button>
        ))}
      </GradeTres>
      {fim && (
        <section className="cartao ap-conclusao" aria-live="polite">
          <Selo tipo="ouro">SALA CONCLUÍDA</Selo>
          <h3>O ponto de fundo</h3>
          <p>No fim, os sete debates levam à mesma pergunta: quem tem a última palavra sobre o que é Escritura. Os evangélicos respondem que é a própria Escritura, reconhecida pela Igreja. Os católicos respondem que é a Igreja, guiada pelo Espírito, que a reconhece e interpreta. A pergunta é grande, e merece estudo, oração e humildade (Atos 17:11).</p>
        </section>
      )}
      <h2 className="tab-titulo">Para conversar com respeito</h2>
      <GradeTres className="grade" tema="refDebate" extras={[]}>
        <article className="cartao ref-comum"><Selo tipo="ouro">O QUE TODOS RECEBEM</Selo><h3>Terreno comum</h3><p>Os 27 livros do Novo Testamento. Os 39 livros do Antigo que estão nas duas Bíblias. A fé em Cristo, morto e ressuscitado. A Escritura como Palavra de Deus.</p></article>
        <article className="cartao ref-comum"><Selo tipo="ouro">ONDE DIVERGEM</Selo><h3>Diferenças reais</h3><p>Os sete livros e os acréscimos. O peso da Tradição e do Magistério. Pontos de doutrina, como o purgatório e a oração pelos mortos. Essas diferenças não se resolvem com uma frase.</p></article>
        <article className="cartao ref-comum"><Selo tipo="ouro">COMO CONVERSAR</Selo><h3>Ouvir antes de responder</h3><p>Citar o outro lado com as palavras dele, e não com as de um adversário. Voltar sempre à Bíblia. Lembrar que "o servo do Senhor deve ser brando para com todos" (2 Timóteo 2:24).</p></article>
      </GradeTres>
      <Aviso>Os argumentos acima são um resumo de estudo, em rascunho. Os textos citados e as datas devem ser conferidos em obras de referência dos dois lados antes de ir ao ar.</Aviso>
      {aberto && <DebateFicha a={aberto} aoFechar={() => setAbertoId(null)} aoLer={() => marcarLido('ref:a:' + aberto.id)} />}
    </ReformaShell>
  )
}

// ───── Túnel do Tempo ─────
const COR_TIPO = { 'CÂNON': '#d4af37', PRECURSOR: '#3fb7ad', RUPTURA: '#e59a3c', 'CONSOLIDAÇÃO': '#6fa8ff', CONTRARREFORMA: '#b79cff', CONTEXTO: '#c9c3dd' }
const TEXTO_REF_TUNEL = `{{HISTÓRIA}} Este é o túnel do tempo da questão. Avance pelos séculos: cada marco vem ao seu encontro, e a cor mostra a natureza dele (cânon, precursor, ruptura, consolidação, contrarreforma ou contexto). Abra a ficha de cada um para ver a causa, o que aconteceu e o que veio depois.

{{HISTÓRIA}} Repare que a história dos sete livros corre junto com a história da Reforma. Por isso, no fim da sala, as correlações de tempos mostram o que acontecia ao mesmo tempo em cada frente.`

function TunelTempo({ lista, lido, aoAbrir }) {
  const parado = parouMovimento()
  const n = lista.length
  const [alvo, setAlvo] = useState(0)
  const [pos, setPos] = useState(0)
  const [toca, setToca] = useState(false)
  const posRef = useRef(0)
  const primeira = useRef(true)
  const toque = useRef(null)
  const atual = lista[alvo] || lista[0]
  const ir = (k) => setAlvo(Math.max(0, Math.min(n - 1, k)))
  useEffect(() => {
    if (parado) { posRef.current = alvo; setPos(alvo); return undefined }
    let id = 0
    const f = () => {
      const d = alvo - posRef.current
      if (Math.abs(d) < 0.004) { posRef.current = alvo; setPos(alvo); return }
      posRef.current += d * 0.11
      setPos(posRef.current)
      id = requestAnimationFrame(f)
    }
    id = requestAnimationFrame(f)
    return () => cancelAnimationFrame(id)
  }, [alvo, parado])
  useEffect(() => { if (primeira.current) { primeira.current = false; return } try { somTique(false) } catch (e) { /* som é opcional */ } }, [alvo])
  useEffect(() => {
    if (!toca) return undefined
    const t = setInterval(() => setAlvo((a) => Math.min(n - 1, a + 1)), 3600)
    return () => clearInterval(t)
  }, [toca, n])
  useEffect(() => { if (toca && alvo >= n - 1) setToca(false) }, [toca, alvo, n])
  const tecla = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setToca(false); ir(alvo + 1) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setToca(false); ir(alvo - 1) }
    else if (e.key === 'Home') { e.preventDefault(); ir(0) }
    else if (e.key === 'End') { e.preventDefault(); ir(n - 1) }
  }
  const aoTocar = (e) => { toque.current = e.clientX }
  const aoSoltar = (e) => {
    if (toque.current == null) return
    const dx = e.clientX - toque.current
    toque.current = null
    if (Math.abs(dx) > 50) { setToca(false); ir(alvo + (dx < 0 ? 1 : -1)) }
  }
  return (
    <section className="tunel-envolve" aria-label="Túnel do Tempo">
      <div className="tunel" style={{ '--era': COR_TIPO[atual.tipo] || '#d4af37' }} tabIndex={0} onKeyDown={tecla} onPointerDown={aoTocar} onPointerUp={aoSoltar} onPointerCancel={() => { toque.current = null }} aria-roledescription="túnel do tempo" aria-label={'Marco ' + (alvo + 1) + ' de ' + n + ': ' + atual.rotulo + ', ' + atual.titulo + '. Use as setas para avançar e voltar.'}>
        <div className="tunel-fundo" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((k) => <i key={k} className="tunel-anel" style={{ animationDelay: -k * 1.15 + 's' }} />)}
          <i className="tunel-luz" />
          <Particulas tipo="poeira" />
        </div>
        <div className="tunel-palco">
          {lista.map((e, i) => {
            const d = i - pos
            if (d < -1.3 || d > 3.6) return null
            const frente = d >= 0
            const z = frente ? -d * 400 : -d * 520
            const op = frente ? Math.max(0, 1 - d * 0.3) : Math.max(0, 1 + d * 1.5)
            const x = frente ? (i % 2 ? 1 : -1) * Math.min(d, 3) * 34 : 0
            const ativo = Math.abs(d) < 0.5
            return (
              <button
                key={e.id} type="button" tabIndex={ativo ? 0 : -1} aria-hidden={ativo ? undefined : 'true'}
                className={'tunel-cartao' + (ativo ? ' ativo' : '') + (lido(e) ? ' lido' : '')}
                style={{ transform: 'translate3d(' + x + 'px, 0, ' + z + 'px)', opacity: op, zIndex: 100 - Math.round(d * 10), pointerEvents: ativo ? 'auto' : 'none', filter: frente && d > 0.4 ? 'blur(' + Math.min(3, d * 0.9) + 'px)' : 'none', '--cor': COR_TIPO[e.tipo] || '#d4af37' }}
                onClick={() => aoAbrir(e)} aria-label={'Abrir a ficha: ' + e.rotulo + ', ' + e.titulo}
              >
                <span className="tunel-tipo">{e.tipo}</span>
                <b className="tunel-ano">{e.rotulo}</b>
                <strong>{e.titulo}</strong>
                <span className="tunel-resumo">{e.resumo}</span>
                <em>{lido(e) ? 'Ficha lida ✓' : 'Abrir a ficha →'}</em>
              </button>
            )
          })}
        </div>
        <span className="tunel-contador" aria-hidden="true">{alvo + 1} / {n}</span>
      </div>
      <p className="tunel-agora" aria-live="polite"><b>{atual.rotulo}</b> · {atual.titulo}</p>
      <div className="tunel-ctrl">
        <button type="button" className="btn" disabled={alvo === 0} onClick={() => { setToca(false); ir(alvo - 1) }}>← Voltar no tempo</button>
        <button type="button" className="btn ouro" onClick={() => aoAbrir(atual)}>Abrir a ficha</button>
        <button type="button" className="btn" disabled={alvo === n - 1} onClick={() => { setToca(false); ir(alvo + 1) }}>Avançar no tempo →</button>
        <button type="button" className="btn pequeno" onClick={() => { if (!toca && alvo >= n - 1) ir(0); setToca((t) => !t) }} aria-pressed={toca}>{toca ? 'Parar a viagem' : 'Viajar sozinho'}</button>
      </div>
      <input className="tunel-faixa" type="range" min="0" max={n - 1} value={alvo} onChange={(e) => { setToca(false); ir(Number(e.target.value)) }} aria-label="Deslizador do tempo" aria-valuetext={atual.rotulo + ': ' + atual.titulo} />
      <ol className="tunel-trilha" aria-label="Marcos do túnel">
        {lista.map((e, i) => (
          <li key={e.id}><button type="button" className={(i === alvo ? 'ativo ' : '') + (lido(e) ? 'lido' : '')} style={{ '--cor': COR_TIPO[e.tipo] || '#d4af37' }} onClick={() => { setToca(false); ir(i) }} aria-label={e.rotulo + ': ' + e.titulo} aria-current={i === alvo ? 'step' : undefined} title={e.rotulo} /></li>
        ))}
      </ol>
      <ul className="tunel-legenda" aria-label="Cores dos marcos">
        {Object.keys(COR_TIPO).map((t) => <li key={t}><i style={{ background: COR_TIPO[t] }} aria-hidden="true" />{t}</li>)}
      </ul>
    </section>
  )
}

function RefTunel() {
  useVisitaRef('tunel')
  const { db, lidos, marcarLido } = useLoja()
  const nav = useNavigate()
  const lista = useMemo(() => [...(db.eventosRef || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [db.eventosRef])
  const correl = useMemo(() => [...(db.correlacoesRef || [])].sort((a, b) => String(a.id).localeCompare(String(b.id))), [db.correlacoesRef])
  const [abertoId, setAbertoId] = useState(null)
  const aberto = lista.find((x) => x.id === abertoId)
  const lido = (x) => !!(lidos && lidos['ref:t:' + x.id])
  const quantos = lista.filter(lido).length
  const fim = lista.length > 0 && quantos === lista.length
  const jaTocou = useRef(fim)
  useEffect(() => { if (fim && !jaTocou.current) { jaTocou.current = true; somSelo() } }, [fim])
  const abrir = (x) => { somPapiro(); setAbertoId(x.id) }
  const encerrar = () => { if (aberto) { marcarLido('ref:t:' + aberto.id); somBadalada(2) } setAbertoId(null) }
  return (
    <ReformaShell editar="eventosRef">
      <h2 className="tab-titulo">O Túnel do Tempo</h2>
      <p className="mudo tab-sub">De Alexandria a hoje: os marcos do cânon e da Reforma.</p>
      <ImgViva arquivo="ref-tunel" video="ref-tunel" alt="Um longo corredor abobadado de arcos de pedra que se estende para uma luz dourada, com faixas de pergaminho sem marcas" lado="cheia" fx="nevoa" legenda="Cada arco é uma época. Avance, e ela vem ao seu encontro." />
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_REF_TUNEL} /></article>
      <p className="mudo tab-sub"><Selo tipo="ouro">{quantos} de {lista.length} marcos visitados</Selo></p>
      {lista.length > 0 && <TunelTempo lista={lista} lido={lido} aoAbrir={abrir} />}
      {fim && (
        <section className="cartao ap-conclusao" aria-live="polite">
          <Selo tipo="ouro">TÚNEL ATRAVESSADO</Selo>
          <h3>O que o túnel mostrou</h3>
          <p>Em mil e quinhentos anos, a pergunta sobre os sete livros foi tratada de modos diferentes, e cada resposta nasceu num tempo e num lugar. Entender o tempo ajuda a ouvir o outro lado com justiça. A Escritura continua sendo a medida, e o Senhor da Igreja é Cristo.</p>
        </section>
      )}
      <h2 className="tab-titulo">Correlações de tempos</h2>
      <p className="mudo tab-sub">O que acontecia ao mesmo tempo, ou um fato levando ao outro.</p>
      <GradeTres className="ap-correl-lista" tema="refCorrel">
        {correl.map((c) => (
          <article key={c.id} className={'cartao ap-correl-item ref-correl tp-' + slug(c.tipo)}>
            <header><Selo tipo="ouro">{c.tipo}</Selo><h3>{c.titulo}</h3><b className="ref-correl-ano">{c.ano}</b></header>
            <div className="ap-correl-par"><span><small>Livros e cânon</small><Inline t={c.livros} /></span><span><small>Mundo e Reforma</small><Inline t={c.mundo} /></span></div>
            <p className="mudo">{c.nota}</p>
          </article>
        ))}
      </GradeTres>
      <Aviso>Os marcos são rascunho para revisão. Datas e nomes marcados "(a conferir)" devem ser conferidos em fontes acadêmicas antes de ir ao ar.</Aviso>
      {aberto && (
        <FichaAp
          titulo={aberto.titulo} sub={aberto.rotulo} aoFechar={() => setAbertoId(null)}
          selos={<><Selo tipo="ouro">{aberto.tipo}</Selo>{aberto.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}</>}
          rodape={<>
            {aberto.etapa != null && <button type="button" className="btn" onClick={() => { setAbertoId(null); nav('/canon-e-reforma/estante?etapa=' + aberto.etapa + '#evolucao') }}>Ver na estante</button>}
            <button type="button" className="btn" onClick={() => setAbertoId(null)}>Fechar</button>
            <button type="button" className="btn ouro" onClick={encerrar}>Encerrar leitura</button>
          </>}
        >
          <FotoRef arquivo={'ref-e-' + aberto.id} alt={'Cena: ' + aberto.titulo} legenda={aberto.rotulo} />
          <h4>O que aconteceu</h4><p><Inline t={aberto.aconteceu} /></p>
          <h4>Por que aconteceu</h4><p><Inline t={aberto.causa} /></p>
          <h4>O que veio depois</h4><p><Inline t={aberto.depois} /></p>
          <h4>Os sete livros neste momento</h4><p><Inline t={aberto.canon} /></p>
          <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
        </FichaAp>
      )}
    </ReformaShell>
  )
}


// Palavras que viram cartão de termo sozinhas (a primeira vez que aparecem em cada texto), sem repetir o que já está marcado.
const AUTO_TERMOS = [
  [/transubstancia[çc][ãa]o/i, 'transubstanciacao'], [/consubstancia[çc][ãa]o/i, 'consubstanciacao'], [/predestina[çc][ãa]o/i, 'predestinacao'],
  [/presen[çc]a real/i, 'presenca-real'], [/\bmemorial\b/i, 'memorialismo'], [/Sola Scriptura/i, 'sola-scriptura'],
  [/Justifica[çc][ãa]o (somente )?pela f[ée]/i, 'sola-fide'], [/dois reinos/i, 'dois-reinos'], [/arminian(ismo|as?|os?)\b/i, 'arminianismo'], [/calvinis(mo|tas?)\b/i, 'calvinismo'],
  [/sacerd[óo]cio universal/i, 'sacerdocio-universal'], [/cessacionis(mo|tas?)\b/i, 'cessacionismo'], [/continu[ií]s(mo|tas?)\b/i, 'continuismo'],
]
function autoTermos(texto) {
  const tag = /(\[\[termo:[^\]]+\]\])/g
  let partes = String(texto == null ? '' : texto).split(tag)
  const usados = new Set()
  partes.forEach((x) => { const m = x.match(/^\[\[termo:([a-z0-9-]+)\|/); if (m) usados.add(m[1]) })
  AUTO_TERMOS.forEach(([re, id]) => {
    if (usados.has(id)) return
    for (let i = 0; i < partes.length; i++) {
      if (partes[i].startsWith('[[termo:')) continue
      const m = partes[i].match(re)
      if (m) { partes[i] = partes[i].replace(re, '[[termo:' + id + '|' + m[0] + ']]'); usados.add(id); break }
    }
    partes = partes.join('').split(tag)
  })
  return partes.join('')
}
const semTermos = (t) => String(t == null ? '' : t).replace(/\[\[termo:[a-z0-9-]+\|([^\]]+)\]\]/g, '$1')
// Parágrafos de um campo: a linha "Quem o segue: ..." ganha destaque.
function ParagrafosQuem({ t }) {
  return <>{String(t || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => {
    const m = l.match(/^(Quem (?:o|os) segue:)\s*(.*)$/)
    return m ? <p key={i} className="quem-segue"><b>{m[1]}</b> <Inline t={autoTermos(m[2])} /></p> : <p key={i}><Inline t={autoTermos(l)} /></p>
  })}</>
}

// ───── Precursores e reformadores ─────
const TEXTO_REF_PERS = `{{HISTÓRIA}} A Reforma não começou em 1517. Antes de Lutero, vários homens pediram a volta à Escritura e pagaram caro: Pedro Valdo, John Wycliffe e Jan Hus, entre outros. Depois de 1517, o movimento se dividiu em várias correntes, e os reformadores nem sempre concordaram entre si. A resposta católica veio no Concílio de [[termo:trento|Trento]] e na [[termo:contrarreforma|Contrarreforma]].

{{INTERPRETAÇÃO TEOLÓGICA}} Cada ficha traz o que a pessoa ensinou e, com honestidade, os seus limites e sombras. A história da Igreja tem heróis, mas não tem santos infalíveis: só a Escritura é a medida.`

function MesaReformadores({ aoAbrir, lidoDe }) {
  const [modo, setModo] = useState('tema')
  const [tema, setTema] = useState('ceia')
  const [a, setA] = useState('lutero')
  const [b, setB] = useState('calvino')
  const nomeDe = (id) => (MESA_COLUNAS.find((c) => c.id === id) || {}).nome
  const temaNome = (id) => (MESA_TEMAS.find((t) => t.id === id) || {}).nome
  const clicar = (e, id, t) => { if (e.target.closest && e.target.closest('.ap-termo')) return; aoAbrir(id, t) }
  const teclar = (e, id, t) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); aoAbrir(id, t) } }
  return (
    <section className="ref-mesa" aria-label="Mesa dos reformadores">
      <div className="abas" role="group" aria-label="Modo da mesa">
        <button type="button" className={modo === 'tema' ? 'active' : ''} onClick={() => setModo('tema')} aria-pressed={modo === 'tema'}>Por tema</button>
        <button type="button" className={modo === 'par' ? 'active' : ''} onClick={() => setModo('par')} aria-pressed={modo === 'par'}>Dois lado a lado</button>
      </div>
      <p className="mudo tab-sub">Cada cartão abre o estudo completo de quem ensinou. As palavras sublinhadas explicam o termo e dizem quem o defende.</p>
      {modo === 'tema' ? (
        <>
          <div className="abas" role="group" aria-label="Escolher o tema">
            {MESA_TEMAS.map((t) => <button key={t.id} type="button" className={tema === t.id ? 'active' : ''} onClick={() => { setTema(t.id); try { somTique(false) } catch (e) { /* som é opcional */ } }} aria-pressed={tema === t.id}>{t.nome}</button>)}
          </div>
          <GradeTres className="grade ref-mesa-grade" tema="refMesa" key={tema}>
            {MESA_COLUNAS.map((c) => (
              <article key={c.id} className="cartao ref-mesa-cartao clicavel" tabIndex={0} role="group" aria-label={c.nome + ': ' + temaNome(tema) + '. Abrir o estudo'} onClick={(e) => clicar(e, c.id, tema)} onKeyDown={(e) => teclar(e, c.id, tema)}>
                <Selo tipo="ouro">{c.nome.toUpperCase()}</Selo>
                <p><Inline t={autoTermos(MESA[tema][c.id])} /></p>
                <span className="mesa-abrir">{lidoDe(c.id) ? 'Estudo lido ✓ · abrir de novo →' : 'Abrir o estudo de ' + c.nome + ' →'}</span>
              </article>
            ))}
          </GradeTres>
        </>
      ) : (
        <>
          <div className="ref-par-escolha">
            <label>Primeiro <select value={a} onChange={(e) => setA(e.target.value)}>{MESA_COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
            <span aria-hidden="true">×</span>
            <label>Segundo <select value={b} onChange={(e) => setB(e.target.value)}>{MESA_COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          </div>
          {a === b && <Aviso>Escolha duas correntes diferentes para comparar.</Aviso>}
          <div className="ref-par" role="table" aria-label={'Comparação entre ' + nomeDe(a) + ' e ' + nomeDe(b)}>
            <div className="ref-par-linha cab" role="row"><span role="columnheader">Tema</span>
              <span role="columnheader"><button type="button" className="mesa-nome" onClick={() => aoAbrir(a, '')}>{nomeDe(a)} →</button></span>
              <span role="columnheader"><button type="button" className="mesa-nome" onClick={() => aoAbrir(b, '')}>{nomeDe(b)} →</button></span></div>
            {MESA_TEMAS.map((t) => (
              <div key={t.id} className="ref-par-linha" role="row">
                <b role="rowheader">{t.nome}</b>
                <span role="cell"><Inline t={autoTermos(MESA[t.id][a])} /></span>
                <span role="cell"><Inline t={autoTermos(MESA[t.id][b])} /></span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// Estudo de cada corrente da Mesa: abre ao tocar em um cartão e vai direto ao tema escolhido.
function EstudoMesa({ e, tema, aoFechar, aoEncerrar }) {
  const alvo = useRef(null)
  useEffect(() => {
    const t = setTimeout(() => { try { if (alvo.current) alvo.current.scrollIntoView({ block: 'start' }) } catch (x) { /* sem efeito */ } }, 80)
    return () => clearTimeout(t)
  }, [e.id, tema])
  return (
    <FichaAp
      titulo={e.titulo} sub={e.anos + ' · ' + e.onde} aoFechar={aoFechar}
      selos={<><Selo tipo="ouro">REFORMADOR</Selo>{e.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}</>}
      rodape={<>
        <button type="button" className="btn" onClick={aoFechar}>Fechar</button>
        <button type="button" className="btn ouro" onClick={aoEncerrar}>Encerrar leitura</button>
      </>}
    >
      <FotoRef arquivo={'ref-p-' + e.id} alt={'Cena: ' + e.titulo} legenda={e.titulo} />
      <h4><Selo>HISTÓRIA</Selo> Quem foi</h4><p><Inline t={autoTermos(e.quem)} /></p>
      <h4>Principais escritos</h4><ListaRef t={e.obras} />
      {CAMPOS_ESTUDO.map(([k, nome]) => (
        <section key={k} ref={tema === k ? alvo : null} className={'estudo-tema' + (tema === k ? ' foco' : '')}>
          <h4><Selo>INTERPRETAÇÃO TEOLÓGICA</Selo> {nome}</h4>
          <ParagrafosQuem t={e[k]} />
        </section>
      ))}
      <h4>Com quem discordou</h4><ListaRef t={e.discordou} />
      <h4>Quem veio depois</h4><p><Inline t={autoTermos(e.legado)} /></p>
      <h4><Selo>HISTÓRIA</Selo> Luz e sombra</h4><p><Inline t={autoTermos(e.sombras)} /></p>
      {e.ref && <p className="ref">{e.ref}</p>}
      <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
    </FichaAp>
  )
}

function RefReformadores() {
  useVisitaRef('reformadores')
  const { db, lidos, marcarLido } = useLoja()
  const lista = useMemo(() => [...(db.personagensRef || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [db.personagensRef])
  const [abertoId, setAbertoId] = useState(null)
  const [estudoId, setEstudoId] = useState(null)
  const [estudoTema, setEstudoTema] = useState('')
  const estudos = db.estudosMesa || []
  const estudo = estudos.find((x) => x.id === estudoId)
  const lidoEstudo = (id) => !!(lidos && lidos['ref:m:' + id])
  const aberto = lista.find((x) => x.id === abertoId)
  const lido = (x) => !!(lidos && lidos['ref:p:' + x.id])
  const quantos = lista.filter(lido).length
  const fim = lista.length > 0 && quantos === lista.length
  const jaTocou = useRef(fim)
  useEffect(() => { if (fim && !jaTocou.current) { jaTocou.current = true; somSelo() } }, [fim])
  const abrir = (x) => { somPapiro(); setAbertoId(x.id) }
  const encerrar = () => { if (aberto) { marcarLido('ref:p:' + aberto.id); somBadalada(2) } setAbertoId(null) }
  return (
    <ReformaShell editar="personagensRef">
      <h2 className="tab-titulo">Precursores e reformadores</h2>
      <p className="mudo tab-sub">Quem abriu o caminho, quem o seguiu e como a Igreja Católica respondeu.</p>
      <ImgViva arquivo="ref-reformadores" alt="Cinco púlpitos vazios de madeira em um salão de pedra, cada um com um livro aberto diferente, sob a luz das janelas altas" lado="cheia" fx="brilho" legenda="Cada um falou do seu púlpito. A Palavra ficou acima de todos." />
      <article className="reportagem-pagina ap-leitura"><TextoLongo texto={TEXTO_REF_PERS} /></article>
      <p className="mudo tab-sub"><Selo tipo="ouro">{quantos} de {lista.length} fichas lidas</Selo> Abra a ficha de cada um.</p>
      <GradeTres className="grade ap-mesa" tema="refPers">
        {lista.map((x) => (
          <button key={x.id} type="button" className={'cartao ap-ev-item' + (lido(x) ? ' lido' : '')} onClick={() => abrir(x)} aria-haspopup="dialog">
            <span className="ap-ev-n" aria-hidden="true">{x.ordem}</span>
            <Selo tipo="ouro">{x.grupo}</Selo>
            <h3>{x.titulo}</h3>
            <p className="mudo">{x.anos}</p>
            <p>{x.resumo}</p>
            <span className="mudo">{lido(x) ? 'Leitura encerrada ✓' : 'Abrir a ficha →'}</span>
          </button>
        ))}
      </GradeTres>
      {fim && (
        <section className="cartao ap-conclusao" aria-live="polite">
          <Selo tipo="ouro">SALA CONCLUÍDA</Selo>
          <h3>O que as fichas mostram</h3>
          <p>Os precursores pediram a volta à Escritura. Os reformadores concordaram nisso e discordaram em muito mais. A Contrarreforma corrigiu abusos e firmou a doutrina católica. Em todos há luz e sombra, e é por isso que a Escritura, e não uma pessoa, é a medida (Atos 17:11).</p>
        </section>
      )}
      <h2 className="tab-titulo">Mesa dos reformadores: quem ensinou o quê</h2>
      <p className="mudo tab-sub">Compare Lutero, Zuínglio, Calvino, os anabatistas e os anglicanos. Toque em um cartão para abrir o estudo de cada um.</p>
      <MesaReformadores aoAbrir={(id, t) => { somPapiro(); setEstudoTema(t); setEstudoId(id) }} lidoDe={lidoEstudo} />
      <Aviso>As fichas e a mesa são rascunho para revisão. Datas, nomes e posições marcadas "(a conferir)" devem ser conferidas em obras de referência antes de ir ao ar.</Aviso>
      {estudo && <EstudoMesa e={estudo} tema={estudoTema} aoFechar={() => setEstudoId(null)} aoEncerrar={() => { marcarLido('ref:m:' + estudo.id); somBadalada(2); setEstudoId(null) }} />}
      {aberto && (
        <FichaAp
          titulo={aberto.titulo} sub={aberto.anos + ' · ' + aberto.onde} aoFechar={() => setAbertoId(null)}
          selos={<><Selo tipo="ouro">{aberto.grupo}</Selo>{aberto.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}</>}
          rodape={<>
            <button type="button" className="btn" onClick={() => setAbertoId(null)}>Fechar</button>
            <button type="button" className="btn ouro" onClick={encerrar}>Encerrar leitura</button>
          </>}
        >
          <FotoRef arquivo={'ref-p-' + aberto.id} alt={'Cena: ' + aberto.titulo} legenda={aberto.titulo} />
          <h4>Quem foi</h4><p><Inline t={aberto.resumo} /></p>
          <h4>O que ensinou</h4><ListaRef t={aberto.ensinou} />
          <h4><Selo>HISTÓRIA</Selo> Limites e sombras</h4><p><Inline t={aberto.limites} /></p>
          <h4>Os sete livros</h4><p><Inline t={aberto.canon} /></p>
          <p className="mudo ap-termo-nota">Cartão de estudo. Não é doutrina nem revelação: a revelação vem somente de Deus, pelo Espírito Santo, e tudo se prova pela Escritura.</p>
        </FichaAp>
      )}
    </ReformaShell>
  )
}

function RefPainel() {
  const { db } = useLoja()
  return (
    <ReformaShell editar="promptsRef">
      <h2 className="tab-titulo">Painel de demonstrações</h2>
      <p className="mudo tab-sub">Prompts para gerar as imagens e os vídeos de Cânon e Reforma. Copie, gere, e suba o arquivo em public/img com o nome indicado.</p>
      <Aviso>Todos os prompts pedem imagens sem texto, rostos, anjos desenhados, figuras de Jesus ou de Deus, e sem símbolos ocultistas. Se o gerador desenhar algum desses, descarte e gere de novo.</Aviso>
      <GradeTres className="grade ap-prompts" tema="prompts">{(db.promptsRef || []).map((p) => <CartaoPrompt key={p.id} p={p} />)}</GradeTres>
    </ReformaShell>
  )
}

/* ───────────── MEU ÉFODE: OS 24 SELOS ───────────── */
// Marca de caminho, nunca mérito nem poder. Sem ranking e sem comparação entre alunos (decisão do Pastor).
// Na versão de prova tudo fica neste aparelho. Na Fase 1 a conferência passa para o servidor.

const EFODE_INICIAL = { ganhos: {}, portas: {}, foto: '', mostrarFoto: false, genero: '' }
const AVISO_VESTE = 'A veste é símbolo. Quem veste e conduz é o Senhor. Os selos não salvam: a salvação é pela graça (Efésios 2:8-9).'

function useEfode() {
  const { sessao, db, efodes, salvarEfode } = useLoja()
  const nome = sessao ? sessao.nome : ''
  const efode = { ...EFODE_INICIAL, ...((efodes || {})[nome] || {}) }
  const selos = useMemo(() => [...(db.selosEfode && db.selosEfode.length ? db.selosEfode : SELOS_EFODE)].sort((a, b) => a.ordem - b.ordem), [db.selosEfode])
  // usa a veste guardada só se for da mesma versão do mapa; senão, vale o mapa novo (das imagens novas)
  const vestes = useMemo(() => {
    const guard = db.vestes || []
    const base = VESTES_PADRAO.map((d) => { const g = guard.find((x) => x.id === d.id); return g && g.versao === d.versao ? g : d })
    const extras = guard.filter((x) => !VESTES_PADRAO.some((d) => d.id === x.id))
    return [...base, ...extras].sort((a, b) => a.ordem - b.ordem)
  }, [db.vestes])
  const mudar = (fn) => salvarEfode(nome, fn)
  return { efode, selos, vestes, mudar, nome }
}

const dadosMes = (selos, s) => (s.mesDe ? selos.find((x) => String(x.ordem) === String(s.mesDe)) || s : s)
const proximoSelo = (efode) => { for (let i = 1; i <= 24; i++) if (!efode.ganhos['selo-' + i]) return i; return 24 }
const totalGanhos = (efode) => Object.keys(efode.ganhos || {}).length
function tituloDoAluno(n, genero) {
  if (n >= 24) return genero === 'a' ? 'Anciã Avivar' : genero === 'o' ? 'Ancião Avivar' : 'Ancião ou Anciã Avivar'
  if (n >= 13) return 'Porção Dobrada'
  if (n >= 12) return 'Primeira Porção'
  return 'Aluno Avivar'
}
function diasParaLiberar(efode, n) {
  if (n <= 1) return 0
  const ant = efode.ganhos['selo-' + (n - 1)]
  if (!ant) return 0
  const precisa = INTERVALO_DIAS[n <= 12 ? 1 : 2]
  const passou = (Date.now() - new Date(ant).getTime()) / 86400000
  return Math.max(0, Math.ceil(precisa - passou))
}
function camadasDe(s, selos) {
  const m = dadosMes(selos, s)
  const base = [['a', 'Antiga Aliança', m.antiga], ['j', 'Tempo de Jesus', m.jesus], ['n', 'Nova Aliança', m.nova]]
  return s.fase === '2' ? [['p', 'Aprofundamento', s.aprofundamento + (s.base ? ' (' + s.base + ')' : '')], ...base] : base
}
function portasDoSelo(efode, s) {
  const p = (efode.portas || {})[s.id] || {}
  const ouvir = !!p.ouvir
  const guardar = String(p.guardar || '').trim().length >= 20
  const praticar = String(p.praticar || '').trim().length >= 20 && (s.fase !== '2' || !!p.servico)
  const entender = !!(p.quiz && p.quiz.ok)
  return { ouvir, guardar, praticar, entender, todas: ouvir && guardar && praticar && entender, dados: p }
}

// Perguntas geradas a partir da ficha de cada selo (rascunho). Embaralhadas sempre do mesmo jeito para o mesmo selo.
function embaralhar(arr, semente) {
  const a = [...arr]
  let x = semente * 9301 + 49297
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 9301 + 49297) % 233280
    const j = Math.floor((x / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function perguntasDoSelo(s, selos) {
  const m = dadosMes(selos, s)
  const meses = selos.filter((x) => x.fase === '1' && x.id !== m.id)
  const duplos = selos.filter((x) => x.fase === '2' && x.id !== s.id)
  const monta = (k, p, certa, errados) => {
    const ruins = embaralhar([...new Set(errados.filter((e) => e && e !== certa))], s.ordem * 7 + k).slice(0, 3)
    return { p, certa, ops: embaralhar([certa, ...ruins], s.ordem * 13 + k) }
  }
  const q = [
    monta(1, 'Qual é a dimensão do mês ' + m.mes + ' (' + m.hebraico + ')?', m.dimensao, meses.map((x) => x.dimensao)),
    monta(2, 'O versículo-chave ' + m.refChave + ' está ligado a qual mês?', m.mes, meses.map((x) => x.mes)),
    monta(3, 'O que a Bíblia registra no mês ' + m.mes + ', na Antiga Aliança?', m.antiga, meses.map((x) => x.antiga)),
    monta(4, 'Na Nova Aliança, qual texto se liga ao mês ' + m.mes + '?', m.nova, meses.map((x) => x.nova)),
    monta(5, 'Qual é o desafio próprio do mês ' + m.mes + '?', m.desafio, meses.map((x) => x.desafio)),
  ]
  if (s.fase === '2') {
    q.push(
      monta(6, 'Qual é o aprofundamento do selo duplo de ' + m.mes + '?', s.aprofundamento, duplos.map((x) => x.aprofundamento)),
      monta(7, 'Qual base bíblica acompanha o aprofundamento "' + s.aprofundamento + '"?', s.base, duplos.map((x) => x.base)),
      monta(8, 'Qual é o desafio mais profundo do selo duplo de ' + m.mes + '?', s.desafio, duplos.map((x) => x.desafio)),
    )
  }
  return q.filter((x) => x.ops.length >= 2)
}

/* ── o medalhão do selo ── */
function SeloMedalha({ s, selos, tam = 80, apagado = false, brilho = false }) {
  const m = dadosMes(selos, s)
  const [ok, setOk] = useState(true)
  const id = useMemo(() => 'sm' + novoId(), [])
  const duplo = s.fase === '2'
  const arq = '/img/selos/selo-' + String(s.ordem).padStart(2, '0') + '.webp'
  const cor = m.cor || '#d4af37'
  return (
    <span className={'sm' + (duplo ? ' duplo' : '') + (apagado ? ' apagado' : '') + (brilho ? ' brilho' : '')} style={{ width: tam, height: tam, '--cor': cor }} role="img" aria-label={'Selo ' + s.ordem + (duplo ? ' (duplo)' : '') + ': ' + m.mes + ', ' + m.dimensao}>
      {ok && <img src={arq} alt="" draggable="false" onError={() => setOk(false)} />}
      {!ok && (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <radialGradient id={id} cx="50%" cy="38%" r="65%"><stop offset="0" stopColor={cor} stopOpacity="0.95" /><stop offset="1" stopColor="#1a1040" /></radialGradient>
            <linearGradient id={id + 'o'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3d98b" /><stop offset="1" stopColor="#a8821f" /></linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill={'url(#' + id + 'o)'} />
          <circle cx="50" cy="50" r="43" fill="#1a1040" />
          {duplo && <circle cx="50" cy="50" r="40" fill="none" stroke={'url(#' + id + 'o)'} strokeWidth="2" />}
          <circle cx="50" cy="50" r={duplo ? 36 : 40} fill={'url(#' + id + ')'} />
          {tam >= 64 && <text x="50" y="58" textAnchor="middle" fontSize="22" fill="#fff6d8" fontFamily="serif">{m.hebraico}</text>}
        </svg>
      )}
    </span>
  )
}

/* ── a veste ── */
function Lampada() {
  return (
    <svg viewBox="0 0 100 100" className="vs-lampada" aria-hidden="true">
      <defs><radialGradient id="lamp-luz" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#fff3c4" /><stop offset="1" stopColor="#d4af37" stopOpacity="0" /></radialGradient></defs>
      <circle cx="50" cy="38" r="30" fill="url(#lamp-luz)" />
      <path d="M50 14 Q60 30 50 44 Q40 30 50 14Z" fill="#ffe9a8" />
      <path d="M22 64 Q36 80 62 74 Q74 70 84 58 Q72 62 62 58 L40 56 Q28 58 22 64Z" fill="#d4af37" />
      <path d="M40 56 Q50 50 60 56" fill="none" stroke="#a8821f" strokeWidth="3" />
    </svg>
  )
}
function VesteSvg({ ordem }) {
  const tunica = ordem === 3 ? '#f7f4ea' : '#e8dcc0'
  return (
    <svg viewBox="0 0 1024 1536" className="vs-svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="vs-ouro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3d98b" /><stop offset="1" stopColor="#a8821f" /></linearGradient>
        <linearGradient id="vs-luz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d4af37" stopOpacity="0.28" /><stop offset="1" stopColor="#d4af37" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="1024" height="1536" fill="url(#vs-luz)" />
      {ordem >= 2 && <path d="M200 260 L824 260 L900 1470 L124 1470Z" fill={ordem === 3 ? '#fbfaf4' : '#1d3a8f'} stroke="url(#vs-ouro)" strokeWidth="6" />}
      {ordem >= 2 && <rect x="132" y="1120" width="760" height="350" fill="none" stroke="url(#vs-ouro)" strokeWidth="8" opacity="0.8" />}
      <path d={ordem >= 2 ? 'M300 150 L724 150 L770 300 L790 1130 L234 1130 L254 300Z' : 'M300 150 L724 150 L770 300 L810 1450 L214 1450 L254 300Z'} fill={tunica} stroke="url(#vs-ouro)" strokeWidth="5" opacity={ordem >= 2 ? 0.96 : 1} />
      <rect x="270" y="150" width="70" height="140" rx="10" fill="url(#vs-ouro)" />
      <rect x="684" y="150" width="70" height="140" rx="10" fill="url(#vs-ouro)" />
      <circle cx="300" cy="230" r="40" fill="#1b1b2a" stroke="url(#vs-ouro)" strokeWidth="6" />
      <circle cx="724" cy="230" r="40" fill="#1b1b2a" stroke="url(#vs-ouro)" strokeWidth="6" />
      <rect x="292" y="440" width="440" height="560" rx="18" fill="#2a1d56" stroke="url(#vs-ouro)" strokeWidth="10" />
      <circle cx="512" cy="300" r="120" fill="#14183a" stroke="url(#vs-ouro)" strokeWidth="12" />
    </svg>
  )
}
function VesteView({ veste, selos, ganhos = {}, foto = '', mostrarFoto = false, slots, imagemSrc, atelie = false, simular = false, selecionado = '', aoClicar, aoPressionar, destaque = 0 }) {
  const [okImg, setOkImg] = useState(true)
  const src = imagemSrc || veste.imagem
  useEffect(() => { setOkImg(true) }, [src])
  const sl = slots || veste.slots || SLOTS_PADRAO
  const ate = veste.ordem === 1 ? 12 : 24
  // Os selos ficam sobre a veste. Só quando a veste não tem lugar (círculo) para um selo é que ele vai para um painel ao lado, metade de cada lado.
  const semLugar = atelie ? [] : selos.filter((x) => x.ordem <= ate && x.ordem > 12 * (veste.ordem === 1 ? 0 : 1) && !(sl['s' + x.ordem] || SLOTS_PADRAO['s' + x.ordem]) && veste.ordem > 1)
  const lateral = semLugar.length > 0
  const caixa = (k) => { const p = sl[k] || SLOTS_PADRAO[k]; return { left: p.x + '%', top: p.y + '%', width: p.d + '%' } }
  const botao = (s, noLado) => {
    const k = 's' + s.ordem
    const ganho = simular || !!ganhos[s.id]
    const sel = selecionado === k
    const cls = 'vs-slot' + (ganho ? ' aceso' : ' vazio') + (sel ? ' sel' : '') + (destaque === s.ordem ? ' pousa' : '') + (noLado ? ' vs-slot-lado' : '')
    const conteudo = ganho ? <SeloMedalha s={s} selos={selos} tam={999} brilho /> : <i>{s.ordem}</i>
    const estilo = noLado ? undefined : caixa(k)
    return atelie
      ? <span key={s.id} className={cls} style={estilo} onPointerDown={(e) => aoPressionar && aoPressionar(e, k)}>{conteudo}<b className="vs-rot">{s.ordem}</b></span>
      : <button key={s.id} type="button" className={cls} style={estilo} data-selo={s.ordem} onClick={() => aoClicar && aoClicar(s.ordem)} aria-label={'Selo ' + s.ordem + (ganho ? ' ganho' : ' ainda não ganho')}>{conteudo}</button>
  }
  const metade = Math.ceil(semLugar.length / 2)
  const ladoE = semLugar.slice(0, metade), ladoD = semLugar.slice(metade)
  const corpo = (
    <div className={'vs' + (atelie ? ' atelie' : '')} data-veste={veste.id}>
      {okImg && src ? <img className="vs-img" src={src} alt={'Veste: ' + veste.nome} draggable="false" onError={() => setOkImg(false)} /> : <VesteSvg ordem={veste.ordem} />}
      {atelie && ['ombroE', 'ombroD'].map((k) => (
        <span key={k} className={'vs-pt vs-ombro' + (selecionado === k ? ' sel' : '')} style={caixa(k)} onPointerDown={aoPressionar ? (e) => aoPressionar(e, k) : undefined}><b>ombro</b></span>
      ))}
      <div className={'vs-foto' + (atelie && selecionado === 'foto' ? ' sel' : '')} style={caixa('foto')} onPointerDown={atelie && aoPressionar ? (e) => aoPressionar(e, 'foto') : undefined} role={foto && mostrarFoto ? 'img' : undefined} aria-label={foto && mostrarFoto ? 'Foto do aluno' : undefined}>
        {foto && mostrarFoto ? <img src={foto} alt="" draggable="false" /> : <Lampada />}
        {atelie && <b className="vs-rot">foto</b>}
      </div>
      {selos.filter((s) => s.ordem <= ate && !semLugar.includes(s)).map((s) => botao(s, false))}
    </div>
  )
  if (!lateral) return corpo
  return (
    <div className="vs-conj">
      <div className="vs-lado" role="group" aria-label="Selos ao lado da veste, à esquerda">{ladoE.map((s) => botao(s, true))}</div>
      {corpo}
      <div className="vs-lado" role="group" aria-label="Selos ao lado da veste, à direita">{ladoD.map((s) => botao(s, true))}</div>
    </div>
  )
}

/* ── a foto do aluno (opcional) ── */
function FotoModal({ aoFechar, aoSalvar }) {
  const [img, setImg] = useState(null)
  const [msg, setMsg] = useState('')
  const [zoom, setZoom] = useState(1)
  const [off, setOff] = useState({ x: 0, y: 0 })
  const cv = useRef(null)
  const arrasto = useRef(null)
  const T = 280
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') aoFechar() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  const pintar = (c, tam) => {
    if (!img) return
    const ctx = c.getContext('2d')
    const f = tam / T
    const base = Math.max(T / img.width, T / img.height)
    const esc = base * zoom * f
    const w = img.width * esc, h = img.height * esc
    ctx.fillStyle = '#14183a'; ctx.fillRect(0, 0, tam, tam)
    ctx.drawImage(img, tam / 2 - w / 2 + off.x * f, tam / 2 - h / 2 + off.y * f, w, h)
  }
  useEffect(() => { if (cv.current) pintar(cv.current, T) }, [img, zoom, off])
  const limitar = (o, z) => {
    if (!img) return o
    const base = Math.max(T / img.width, T / img.height)
    const w = img.width * base * z, h = img.height * base * z
    const mx = Math.max(0, (w - T) / 2), my = Math.max(0, (h - T) / 2)
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) }
  }
  const escolher = (e) => {
    const f = e.target.files && e.target.files[0]
    setMsg('')
    if (!f) return
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setMsg('Use um arquivo JPG, PNG ou WebP.'); return }
    if (f.size > 5 * 1024 * 1024) { setMsg('A foto tem mais de 5 MB. Escolha uma menor.'); return }
    const url = URL.createObjectURL(f)
    const im = new Image()
    im.onload = () => {
      URL.revokeObjectURL(url)
      if (Math.min(im.width, im.height) < 400) { setMsg('A foto é pequena demais (' + im.width + ' × ' + im.height + '). O mínimo é 400 × 400 pixels.'); return }
      setZoom(1); setOff({ x: 0, y: 0 }); setImg(im)
    }
    im.onerror = () => { URL.revokeObjectURL(url); setMsg('Não consegui abrir esse arquivo. Tente outra foto.') }
    im.src = url
  }
  const salvar = () => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 400
    pintar(c, 400)
    let q = 0.85, d = c.toDataURL('image/jpeg', q)
    while (d.length > 150000 && q > 0.4) { q -= 0.1; d = c.toDataURL('image/jpeg', q) }
    aoSalvar(d)
  }
  const baixo = (e) => { arrasto.current = { x: e.clientX, y: e.clientY, o: off }; try { e.currentTarget.setPointerCapture(e.pointerId) } catch (er) { /* sem captura */ } }
  const move = (e) => { const a = arrasto.current; if (!a) return; setOff(limitar({ x: a.o.x + (e.clientX - a.x), y: a.o.y + (e.clientY - a.y) }, zoom)) }
  const solta = () => { arrasto.current = null }
  return createPortal(
    <div className="luz-caixa foto-modal" role="dialog" aria-modal="true" aria-label="Minha foto" onClick={aoFechar}>
      <div className="foto-caixa cartao" onClick={(e) => e.stopPropagation()}>
        <h2>Minha foto no Éfode</h2>
        <div className="foto-corpo">
          <div className="foto-edit">
            {img
              ? <div className="foto-prev" onPointerDown={baixo} onPointerMove={move} onPointerUp={solta} onPointerCancel={solta}><canvas ref={cv} width={T} height={T} aria-label="Pré-visualização da foto: arraste para enquadrar" /><span className="foto-guia" aria-hidden="true" /></div>
              : <div className="foto-prev vazio"><Lampada /></div>}
            <label className="btn ouro">Escolher uma foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={escolher} hidden /></label>
            {img && (
              <>
                <label className="foto-zoom">Aproximar<input type="range" min="1" max="3" step="0.02" value={zoom} onChange={(e) => { const z = Number(e.target.value); setZoom(z); setOff((o) => limitar(o, z)) }} /></label>
                <p className="mudo">Arraste a foto para enquadrar o rosto dentro do círculo.</p>
              </>
            )}
            {msg && <div className="aviso" role="alert">{msg}</div>}
            <div className="botoes">
              <button type="button" className="btn ouro" disabled={!img} onClick={salvar}>Usar esta foto</button>
              <button type="button" className="btn" onClick={aoFechar}>Cancelar</button>
            </div>
          </div>
          <div className="foto-regras">
            <h3>Como preparar a foto</h3>
            <table className="ref-tab"><tbody>
              <tr><th>Formato</th><td>JPG, PNG ou WebP.</td></tr>
              <tr><th>Arquivo</th><td>Até 5 MB. O aplicativo reduz sozinho a imagem para 400 × 400 pixels.</td></tr>
              <tr><th>Imagem</th><td>No mínimo 400 × 400 pixels. O ideal é 800 × 800 ou mais, em formato quadrado.</td></tr>
              <tr><th>Enquadramento</th><td>O rosto no centro, ocupando uns 60% do círculo, com um pouco de espaço acima da cabeça.</td></tr>
              <tr><th>Fundo e luz</th><td>Fundo simples e boa luz de frente. Evite contraluz.</td></tr>
              <tr><th>Conteúdo</th><td>Só o seu rosto, sem outras pessoas, sem óculos escuros, sem imagens religiosas ou símbolos ocultos e sem conteúdo impróprio.</td></tr>
              <tr><th>Menores de idade</th><td>A foto precisa da autorização do responsável.</td></tr>
              <tr><th>Privacidade</th><td>A foto é opcional e só aparece na sua veste. Nesta versão de prova ela fica somente neste aparelho. Você pode removê-la quando quiser.</td></tr>
            </tbody></table>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── o questionário da porta "Entender" ── */
function Questionario({ s, selos, aoConcluir }) {
  const perguntas = useMemo(() => perguntasDoSelo(s, selos), [s.id, selos])
  const [resp, setResp] = useState({})
  const [fim, setFim] = useState(null)
  const minimo = Math.min(perguntas.length, MIN_ACERTOS[s.fase === '2' ? 2 : 1])
  const acertos = perguntas.filter((q, i) => resp[i] === q.certa).length
  const todas = perguntas.length > 0 && Object.keys(resp).length === perguntas.length
  const conferir = () => { const ok = acertos >= minimo; setFim({ ok, acertos }); aoConcluir({ ok, acertos, total: perguntas.length, quando: new Date().toISOString() }) }
  const refazer = () => { setResp({}); setFim(null) }
  return (
    <div className="ef-quiz">
      <p className="mudo">Responda com calma. Você pode refazer quantas vezes quiser. Para passar são necessários {minimo} acertos de {perguntas.length}.</p>
      {perguntas.map((q, i) => (
        <fieldset key={i} className="ef-perg" disabled={!!fim}>
          <legend>{i + 1}. {q.p}</legend>
          {q.ops.map((o) => {
            const marca = fim ? (o === q.certa ? ' certa' : resp[i] === o ? ' errada' : '') : ''
            return <label key={o} className={'ef-op' + marca}><input type="radio" name={'q' + s.id + i} checked={resp[i] === o} onChange={() => setResp((r) => ({ ...r, [i]: o }))} /> <span>{o}</span></label>
          })}
        </fieldset>
      ))}
      {!fim && <button type="button" className="btn ouro" disabled={!todas} onClick={conferir}>Conferir as respostas</button>}
      {fim && (
        <div className={'aviso' + (fim.ok ? ' aviso-forte' : '')} role="status">
          {fim.ok ? 'Muito bem! Você acertou ' + fim.acertos + ' de ' + perguntas.length + '. Esta porta está aberta.' : 'Você acertou ' + fim.acertos + ' de ' + perguntas.length + '. Releia as camadas do mês e tente de novo.'}
          {!fim.ok && <div className="botoes"><button type="button" className="btn" onClick={refazer}>Tentar de novo</button></div>}
        </div>
      )}
    </div>
  )
}

/* ── a ficha do selo: camadas, quatro portas e a entrega ── */
function SeloFicha({ s, selos, efode, mudar, admin, aoReceber }) {
  const m = dadosMes(selos, s)
  const ganho = efode.ganhos[s.id]
  const anteriorOk = s.ordem === 1 || !!efode.ganhos['selo-' + (s.ordem - 1)]
  const dias = diasParaLiberar(efode, s.ordem)
  const por = portasDoSelo(efode, s)
  const camadas = camadasDe(s, selos)
  const vistas = por.dados.vistas || {}
  const todasVistas = camadas.every(([k]) => vistas[k])
  const [quizAberto, setQuizAberto] = useState(false)
  const [guardarTxt, setGuardarTxt] = useState('')
  const [praticarTxt, setPraticarTxt] = useState('')
  useEffect(() => { setQuizAberto(false); setGuardarTxt(por.dados.guardar || ''); setPraticarTxt(por.dados.praticar || '') }, [s.id])
  const grava = (patch) => mudar((e) => ({ ...e, portas: { ...e.portas, [s.id]: { ...(e.portas[s.id] || {}), ...patch } } }))
  const ver = (k) => grava({ vistas: { ...vistas, [k]: true } })
  const liberar = anteriorOk && dias === 0 && por.todas && !ganho
  const trancado = !anteriorOk && !ganho
  const estado = ganho ? 'GANHO' : trancado ? 'BLOQUEADO' : 'EM CURSO'
  return (
    <article className="ef-ficha cartao">
      <header className="ef-cab">
        <SeloMedalha s={s} selos={selos} tam={104} apagado={!ganho} brilho={!!ganho} />
        <div>
          <p className="mudo ef-fase">{s.fase === '2' ? 'Selo duplo · Porção Dobrada' : 'Primeira Porção'} · selo {s.ordem} de 24</p>
          <h2>{m.mes}{s.fase === '2' ? ' dobrado' : ''} <span className="ef-heb" lang="he" dir="rtl">{m.hebraico}</span></h2>
          <p className="ef-dim">{m.dimensao}</p>
          <Selo tipo={ganho ? 'ouro' : ''}>{estado}</Selo>{s.rascunho && <Selo>RASCUNHO PARA REVISÃO</Selo>}
          {ganho && <span className="mudo"> Recebido em {new Date(ganho).toLocaleDateString('pt-BR')}</span>}
        </div>
      </header>
      {s.fase === '1' && <p className="ef-pedra mudo">Pedra do peitoral: <b>{PEDRAS[s.ordem - 1]}</b>. Essa ligação entre mês e pedra é didática, nossa, e não vem da Bíblia (a lista das pedras está em Êxodo 28:17-20).</p>}
      {trancado && <Aviso>Este selo se abre depois do selo {s.ordem - 1}. Uma etapa de cada vez.</Aviso>}
      {!trancado && (
        <>
          <section className="ef-sec">
            <h3>Porta 1: Ouvir</h3>
            <p className="mudo">Abra cada camada e leia com a Bíblia ao lado. Versículo-chave do mês: <b>{m.refChave}</b>.</p>
            <div className="ef-camadas">
              {camadas.map(([k, rot, txt]) => (
                <details key={s.id + k} onToggle={(e) => { if (e.currentTarget.open && !vistas[k] && !ganho) ver(k) }}>
                  <summary>{rot}{vistas[k] ? ' ✓' : ''}</summary>
                  <p>{txt}</p>
                </details>
              ))}
            </div>
            {(m.nota || s.nota) && <Aviso><b>Observação:</b> {s.nota || m.nota}</Aviso>}
            {!ganho && (por.ouvir
              ? <p className="ef-ok">✓ Porta aberta</p>
              : <button type="button" className="btn" disabled={!todasVistas} onClick={() => grava({ ouvir: true })}>Li com atenção</button>)}
          </section>
          {!ganho && (
            <>
              <section className="ef-sec">
                <h3>Porta 2: Guardar</h3>
                <p className="mudo">Escreva o versículo-chave ({m.refChave}) de memória ou copiando da sua Bíblia (mínimo de 20 letras). O aplicativo não confere palavra por palavra nesta versão.</p>
                <textarea rows={2} value={guardarTxt} onChange={(e) => setGuardarTxt(e.target.value)} aria-label="Versículo-chave" />
                <div className="botoes"><button type="button" className="btn" onClick={() => grava({ guardar: guardarTxt })} disabled={guardarTxt.trim().length < 20}>Guardar no coração</button>{por.guardar && <span className="ef-ok">✓ Porta aberta</span>}</div>
              </section>
              <section className="ef-sec">
                <h3>Porta 3: Praticar</h3>
                <p><b>Desafio do mês:</b> {m.desafio}</p>
                {s.fase === '2' && <p><b>Desafio mais profundo:</b> {s.desafio}</p>}
                <p className="mudo">Escreva uma linha no Diário (mínimo de 20 letras). O Diário é só seu: o aplicativo apenas registra que você escreveu.</p>
                <textarea rows={3} value={praticarTxt} onChange={(e) => setPraticarTxt(e.target.value)} aria-label="Diário da jornada" />
                {s.fase === '2' && (
                  <label className="check"><input type="checkbox" checked={!!por.dados.servico} onChange={(e) => grava({ servico: e.target.checked })} /> Servi a alguém, ou tenho a confirmação de um líder da minha igreja (Tiago 2:26).</label>
                )}
                <div className="botoes"><button type="button" className="btn" onClick={() => grava({ praticar: praticarTxt })} disabled={praticarTxt.trim().length < 20}>Guardar no Diário</button>{por.praticar && <span className="ef-ok">✓ Porta aberta</span>}</div>
              </section>
              <section className="ef-sec">
                <h3>Porta 4: Entender</h3>
                {!por.ouvir && <p className="mudo">Abra a Porta 1 primeiro.</p>}
                {por.ouvir && !quizAberto && !por.entender && <button type="button" className="btn" onClick={() => setQuizAberto(true)}>Fazer as perguntas</button>}
                {por.ouvir && quizAberto && <Questionario s={s} selos={selos} aoConcluir={(r) => grava({ quiz: r })} />}
                {por.entender && <p className="ef-ok">✓ Porta aberta ({por.dados.quiz.acertos} de {por.dados.quiz.total} acertos)</p>}
              </section>
              <section className="ef-sec ef-entrega">
                {dias > 0 && anteriorOk && <Aviso>Sem pressa: este selo se abre em {dias} {dias === 1 ? 'dia' : 'dias'} (intervalo de {INTERVALO_DIAS[s.ordem <= 12 ? 1 : 2]} dias desde o selo anterior). &ldquo;Há tempo para todo propósito debaixo do céu&rdquo; (Eclesiastes 3:1).</Aviso>}
                <button type="button" className="btn ouro grande" disabled={!liberar} onClick={() => aoReceber(s)}>Receber o selo</button>
                {!liberar && <p className="mudo">Abra as quatro portas para receber este selo.</p>}
              </section>
            </>
          )}
          {ganho && (
            <section className="ef-sec">
              <p>Este selo já está na sua veste. Os selos nunca são retirados: a graça não funciona por saldo (Romanos 5:20).</p>
            </section>
          )}
        </>
      )}
      {admin && (
        <section className="ef-sec ef-admin">
          <h3>Painel do Pastor (teste)</h3>
          <div className="botoes">
            {!ganho && <button type="button" className="btn admin" onClick={() => aoReceber(s, true)}>Liberar este selo agora</button>}
            {ganho && <button type="button" className="btn admin" onClick={() => mudar((e) => { const g = { ...e.ganhos }; delete g[s.id]; return { ...e, ganhos: g } })}>Remover este selo</button>}
          </div>
        </section>
      )}
    </article>
  )
}

/* ── a mensagem ao receber um selo (a cerimônia animada entra na Etapa B) ── */
function SeloRecebido({ s, selos, efode, mudar, aoFechar }) {
  const m = dadosMes(selos, s)
  const ultimo = s.ordem === 24
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') aoFechar() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  return createPortal(
    <div className="luz-caixa ef-recebido" role="dialog" aria-modal="true" aria-label="Selo desbloqueado">
      <div className="ef-recebido-miolo">
        <SeloMedalha s={s} selos={selos} tam={170} brilho />
        <h2>{ultimo ? 'Concluí a jornada dos 24 selos' : s.fase === '2' ? 'Desbloqueei o Selo da Porção Dobrada' : 'Desbloqueei o Selo Profético'}</h2>
        <p className="ef-dim">{m.mes} <span lang="he" dir="rtl">{m.hebraico}</span> · {m.dimensao}</p>
        <p className="mudo">{m.refChave}</p>
        {ultimo && (
          <div className="ef-titulo-final">
            <p>Você chegou a Ancião ou Anciã Avivar: quem estuda, se dedica e se prepara para a obra de Deus, e permanece firme. O galardão e o poder pertencem ao Senhor, que os dá como quer (1 Coríntios 12:11). Este é um título de estudo e não um cargo na igreja.</p>
            <div className="botoes">
              <button type="button" className={'btn' + (efode.genero === 'o' ? ' ouro' : '')} onClick={() => mudar((e) => ({ ...e, genero: 'o' }))}>Ancião Avivar</button>
              <button type="button" className={'btn' + (efode.genero === 'a' ? ' ouro' : '')} onClick={() => mudar((e) => ({ ...e, genero: 'a' }))}>Anciã Avivar</button>
            </div>
          </div>
        )}
        <p className="mudo ef-nota">{AVISO_VESTE}</p>
        <button type="button" className="btn ouro grande" autoFocus onClick={aoFechar}>Guardar no Éfode</button>
      </div>
    </div>,
    document.body,
  )
}

/* ── a página do aluno ── */
function EfodePagina() {
  const { sessao } = useLoja()
  const { efode, selos, vestes, mudar } = useEfode()
  const admin = !!(sessao && sessao.admin)
  const n = totalGanhos(efode)
  const [vid, setVid] = useState(() => (n >= 24 ? 'veste-3' : n >= 12 ? 'veste-2' : 'veste-1'))
  const [selN, setSelN] = useState(() => proximoSelo(efode))
  const [recebido, setRecebido] = useState(0)
  const [fotoAberta, setFotoAberta] = useState(false)
  const [pousa, setPousa] = useState(0)
  const fichaRef = useRef(null)
  const veste = vestes.find((v) => v.id === vid) || vestes[0]
  const s = selos.find((x) => x.ordem === selN) || selos[0]
  const fichaAlvo = useRef(null)
  // ao tocar num selo (na túnica ou na tabela de 6 x 4), ele aparece embaixo, no lugar da explicação, e a tela desce até lá se preciso
  const abrirSelo = (o) => {
    setSelN(o)
    setTimeout(() => {
      const el = fichaAlvo.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.top > window.innerHeight * 0.55 || r.top < 0) el.scrollIntoView({ behavior: parouMovimento() ? 'auto' : 'smooth', block: 'start' })
    }, 60)
  }
  const receber = (sel, forcar) => {
    if (!forcar && !(portasDoSelo(efode, sel).todas)) return
    mudar((e) => ({ ...e, ganhos: { ...e.ganhos, [sel.id]: new Date().toISOString() } }))
    somSelo()
    setVid(sel.ordem >= 24 ? 'veste-3' : sel.ordem <= 12 ? 'veste-1' : 'veste-2')
    setRecebido(sel.ordem)
  }
  const fecharRecebido = () => { const o = recebido; setRecebido(0); setPousa(o); setSelN(Math.min(24, o + 1)); setTimeout(() => setPousa(0), 2400) }
  const salvarFoto = (d) => { mudar((e) => ({ ...e, foto: d, mostrarFoto: true })); setFotoAberta(false) }
  const nome = sessao ? sessao.nome : ''
  const rec = selos.find((x) => x.ordem === recebido)
  return (
    <Shell titulo="Túnica com Éfode" editar="selosEfode">
      <Aviso forte>{AVISO_VESTE}</Aviso>
      <header className="ef-topo">
        <div>
          <h2>{nome ? nome + ', este é o seu caminho' : 'O seu caminho'}</h2>
          <p className="mudo">{tituloDoAluno(n, efode.genero)} · {n} de 24 selos. Você se compara só com o seu próprio caminho.</p>
        </div>
        <div className="barra" aria-label={'Selos: ' + n + ' de 24'}><i style={{ width: (n / 24) * 100 + '%' }} /></div>
      </header>
      <div className="ef-grade">
        <section className="ef-esq" aria-label="A veste">
          <div className="abas ef-abas" role="tablist">
            {vestes.map((v) => <button key={v.id} type="button" role="tab" aria-selected={v.id === vid} className={v.id === vid ? 'active' : ''} onClick={() => setVid(v.id)}>{v.nome}</button>)}
          </div>
          <VesteView veste={veste} selos={selos} ganhos={efode.ganhos} foto={efode.foto} mostrarFoto={efode.mostrarFoto} aoClicar={abrirSelo} destaque={pousa} />
          <p className="mudo ef-leg">{veste.descricao}</p>
          <div className="ef-fotobtn">
            <button type="button" className="btn" onClick={() => setFotoAberta(true)}>{efode.foto ? 'Trocar a minha foto' : 'Minha foto (opcional)'}</button>
            {efode.foto && (
              <>
                <label className="check"><input type="checkbox" checked={!!efode.mostrarFoto} onChange={(e) => mudar((x) => ({ ...x, mostrarFoto: e.target.checked }))} /> Mostrar minha foto na veste</label>
                <button type="button" className="btn" onClick={() => mudar((x) => ({ ...x, foto: '', mostrarFoto: false }))}>Remover minha foto</button>
              </>
            )}
          </div>
        </section>
        <section className="ef-dir" aria-label="O seu caminho" ref={fichaRef}>
          <div className="ef-trilha" role="list" aria-label="Os 24 selos">
            {selos.map((x, ix) => (
              <button key={x.id} type="button" role="listitem" style={{ '--i': ix }} className={'ef-mini' + (x.ordem === selN ? ' on' : '') + (x.fase === '2' ? ' duplo' : '')} onClick={() => abrirSelo(x.ordem)} aria-label={'Selo ' + x.ordem + (efode.ganhos[x.id] ? ' ganho' : '')} aria-current={x.ordem === selN ? 'true' : undefined}>
                <SeloMedalha s={x} selos={selos} tam={44} apagado={!efode.ganhos[x.id]} />
              </button>
            ))}
          </div>
          <div ref={fichaAlvo} className="ef-ficha-alvo" key={'f' + s.ordem}><SeloFicha s={s} selos={selos} efode={efode} mudar={mudar} admin={admin} aoReceber={receber} /></div>
          {admin && <div className="botoes"><Link className="btn admin" to="/efode/atelie">Ateliê das Vestes</Link><button type="button" className="btn admin" onClick={() => { if (window.confirm('Zerar todos os selos deste aluno de teste?')) mudar(() => ({ ...EFODE_INICIAL })) }}>Zerar o Éfode (teste)</button></div>}
        </section>
      </div>
      {fotoAberta && <FotoModal aoFechar={() => setFotoAberta(false)} aoSalvar={salvarFoto} />}
      {rec && <SeloRecebido s={rec} selos={selos} efode={efode} mudar={mudar} aoFechar={fecharRecebido} />}
    </Shell>
  )
}

/* ── o Ateliê das Vestes (só do administrador) ── */
const NOMES_SLOT = (k) => (k === 'foto' ? 'Medalhão da foto' : k === 'ombroE' ? 'Pedra do ombro esquerdo' : k === 'ombroD' ? 'Pedra do ombro direito' : 'Selo ' + k.slice(1))
function Atelie() {
  const { db, salvarItem } = useLoja()
  const { selos, vestes } = useEfode()
  const [vid, setVid] = useState('veste-1')
  const v = vestes.find((x) => x.id === vid) || vestes[0]
  const [slots, setSlots] = useState(() => JSON.parse(JSON.stringify(v.slots || SLOTS_PADRAO)))
  const [imagem, setImagem] = useState(v.imagem)
  const [previa, setPrevia] = useState('')
  const [sel, setSel] = useState('s1')
  const [simular, setSimular] = useState(true)
  const [msg, setMsg] = useState('')
  const [achou, setAchou] = useState(null)
  const caixa = useRef(null)
  const arr = useRef(null)
  useEffect(() => { setSlots(JSON.parse(JSON.stringify(v.slots || SLOTS_PADRAO))); setImagem(v.imagem); setPrevia(''); setMsg('') }, [vid])
  useEffect(() => { const im = new Image(); setAchou(null); im.onload = () => setAchou(true); im.onerror = () => setAchou(false); im.src = imagem }, [imagem])
  const atual = slots[sel] || SLOTS_PADRAO[sel]
  const mexe = (k, patch) => setSlots((s) => ({ ...s, [k]: { ...(s[k] || SLOTS_PADRAO[k]), ...patch } }))
  const baixo = (e, k) => {
    e.preventDefault(); setSel(k)
    const r = e.currentTarget.closest('.vs').getBoundingClientRect()
    arr.current = { k, r }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (er) { /* sem captura */ }
    const move = (ev) => {
      const a = arr.current; if (!a) return
      const x = Math.round(((ev.clientX - a.r.left) / a.r.width) * 1000) / 10
      const y = Math.round(((ev.clientY - a.r.top) / a.r.height) * 1000) / 10
      mexe(a.k, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
    }
    const fim = () => { arr.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', fim); window.removeEventListener('pointercancel', fim) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', fim); window.addEventListener('pointercancel', fim)
  }
  const salvar = (todas) => {
    const alvo = todas ? vestes : [v]
    alvo.forEach((x) => salvarItem('vestes', { ...x, slots: JSON.parse(JSON.stringify(slots)), ...(x.id === v.id ? { imagem } : {}) }))
    setMsg(todas ? 'Salvo nas três vestes.' : 'Salvo.')
  }
  const arquivo = (e) => { const f = e.target.files && e.target.files[0]; if (f) setPrevia(URL.createObjectURL(f)) }
  const chaves = ['foto', 'ombroE', 'ombroD', ...Array.from({ length: 24 }, (_, i) => 's' + (i + 1))]
  return (
    <Shell titulo="Ateliê das Vestes" editar="vestes">
      <p className="mudo">Aqui o Pastor cuida das três vestes. Arraste os círculos para o lugar certo sobre a imagem, ajuste o tamanho e salve. As posições valem para todos os alunos. As medidas ficam em % da largura e da altura da imagem.</p>
      <div className="abas ef-abas">{vestes.map((x) => <button key={x.id} type="button" className={x.id === vid ? 'active' : ''} onClick={() => setVid(x.id)}>{x.nome}</button>)}<Link to="/efode">Voltar à Túnica com Éfode</Link></div>
      <div className="ef-grade at-grade">
        <section className="ef-esq" ref={caixa}>
          <VesteView veste={{ ...v, slots }} selos={selos} ganhos={{}} slots={slots} imagemSrc={previa || imagem} atelie simular={simular} selecionado={sel} aoPressionar={baixo} />
        </section>
        <section className="ef-dir">
          <article className="cartao ef-sec">
            <h3>Imagem da veste</h3>
            <label className="campo">Caminho do arquivo<input value={imagem} onChange={(e) => setImagem(e.target.value)} /></label>
            <p className="mudo">{achou === null ? 'Procurando o arquivo...' : achou ? 'Arquivo encontrado em public/img.' : 'Arquivo ainda não está em public/img/vestes. Enquanto isso o aplicativo mostra um desenho de reserva.'}</p>
            <label className="btn">Testar uma imagem do meu computador<input type="file" accept="image/*" hidden onChange={arquivo} /></label>
            <p className="mudo">A prévia não é publicada. Para publicar, suba o arquivo em public/img/vestes, com o nome acima.</p>
          </article>
          <article className="cartao ef-sec">
            <h3>{NOMES_SLOT(sel)}</h3>
            <label className="campo">Centro, horizontal (x %)<input type="number" step="0.1" value={atual.x} onChange={(e) => mexe(sel, { x: Number(e.target.value) })} /></label>
            <label className="campo">Centro, vertical (y %)<input type="number" step="0.1" value={atual.y} onChange={(e) => mexe(sel, { y: Number(e.target.value) })} /></label>
            <label className="campo">Diâmetro (% da largura): {atual.d}<input type="range" min="3" max="30" step="0.1" value={atual.d} onChange={(e) => mexe(sel, { d: Number(e.target.value) })} /></label>
            <div className="ef-lugares">{chaves.map((k) => <button key={k} type="button" className={'ef-mini' + (sel === k ? ' on' : '')} onClick={() => setSel(k)} title={NOMES_SLOT(k)}>{k === 'foto' ? 'F' : k === 'ombroE' ? 'OE' : k === 'ombroD' ? 'OD' : k.slice(1)}</button>)}</div>
          </article>
          <div className="botoes">
            <button type="button" className="btn ouro" onClick={() => salvar(false)}>Salvar esta veste</button>
            <button type="button" className="btn" onClick={() => salvar(true)}>Salvar o mesmo mapa nas três</button>
            <button type="button" className="btn" onClick={() => setSlots(JSON.parse(JSON.stringify((VESTES_PADRAO.find((x) => x.id === v.id) || {}).slots || SLOTS_PADRAO)))}>Restaurar posições calculadas</button>
            <label className="check"><input type="checkbox" checked={simular} onChange={(e) => setSimular(e.target.checked)} /> Simular os 24 selos acesos</label>
          </div>
          {msg && <Aviso>{msg}</Aviso>}
          <Aviso>O mapa foi medido nas vestes entregues em 13/10/2026, imagens de 1086 × 1448 pixels (3:4). Os prompts das três vestes e dos 24 selos estão no painel abaixo.</Aviso>
        </section>
      </div>
      <h2 className="tab-titulo">Prompts das vestes e dos selos</h2>
      <p className="mudo tab-sub">Gere a Veste 1 primeiro e use cada veste como base da seguinte. Suba os arquivos em public/img com os nomes indicados (vestes/ e selos/).</p>
      <Aviso>Todos os prompts pedem imagens sem texto, rostos, figuras de Jesus ou de Deus e símbolos ocultistas. Se o gerador desenhar algum desses, descarte e gere de novo.</Aviso>
      <GradeTres className="grade ap-prompts" tema="prompts">{(db.promptsSelos || []).map((p) => <CartaoPrompt key={p.id} p={p} />)}</GradeTres>
    </Shell>
  )
}

/* ───────────── ACESSO POR PLANO · TRAVAS · TELA ESCURA · CUPONS ─────────────
   Plano Anjo (grátis) e visitantes veem a "vitrine": podem rolar e olhar, mas qualquer clique em conteúdo
   mostra o aviso para assinar o Querubim ou o Serafim. Querubim, Serafim e admin abrem tudo.
   ATENÇÃO (Fase 0): tudo isto roda no aparelho da pessoa e serve para mostrar o funcionamento.
   A trava de verdade (que ninguém consegue contornar) e a validação de cupons chegam na Fase 1, no servidor. */

const VitrineCtx = createContext(false)
const TravaCtx = createContext({ avisar: () => {} })
const useTrava = () => useContext(TravaCtx)
const ehAssinante = (s) => !!s && (!!s.admin || s.plano === 'querubim' || s.plano === 'serafim')
// Códigos do Espírito: o admin e o plano Serafim sempre entram; Querubim e Anjo só se o admin liberar (Painel do admin → Códigos do Espírito).
const temEspirito = (s, cfg) => !!s && (!!s.admin || s.plano === 'serafim' || (s.plano === 'querubim' && (cfg || {}).espiritoQuerubim === 'sim') || (s.plano === 'anjo' && (cfg || {}).espiritoAnjo === 'sim'))

// Menus em que o plano Anjo só vê a vitrine (cadeado ao lado do nome).
const MENUS_TRAVADOS = ['/inicio', '/o-que-sao', '/reportagens', '/jornada', '/efode', '/cursos', '/estudos-profeticos', '/jornada-das-estacoes', '/montanha-profetica', '/sala-profetica', '/sala-quantica', '/tabernaculo-de-oracao', '/tabua-dos-apocrifos', '/canon-e-reforma', '/igrejas-protestantes']

function TravaProvider({ children }) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const loc = useLocation()
  const api = useMemo(() => ({ avisar: (m) => { setMotivo(typeof m === 'string' ? m : ''); setAberto(true) } }), [])
  useEffect(() => { setAberto(false) }, [loc.pathname])
  useEffect(() => {
    if (!aberto) return undefined
    const k = (e) => { if (e.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [aberto])
  return (
    <TravaCtx.Provider value={api}>
      {children}
      {aberto && typeof document !== 'undefined' && createPortal(
        <div className="trava-caixa" role="dialog" aria-modal="true" aria-labelledby="trava-titulo" onClick={() => setAberto(false)}>
          <div className="trava-miolo" onClick={(e) => e.stopPropagation()}>
            <span className="trava-icone" aria-hidden="true">🔒</span>
            <h2 id="trava-titulo">Conteúdo para assinantes</h2>
            <p>Assine o plano <b>Querubim</b> ou <b>Serafim</b> para liberar o acesso ao conteúdo.</p>
            {motivo && <p className="mudo">{motivo}</p>}
            <div className="botoes centro">
              <Link className="btn ouro" to="/planos" onClick={() => setAberto(false)}>Ver os planos</Link>
              <button type="button" className="btn" autoFocus onClick={() => setAberto(false)}>Fechar</button>
            </div>
          </div>
        </div>, document.body)}
    </TravaCtx.Provider>
  )
}

// Captura os cliques da área de conteúdo quando a página está em modo vitrine.
function useCapturaVitrine() {
  const { avisar } = useTrava()
  const interativo = (el) => {
    const tag = el.tagName
    if (tag === 'A') return !!el.getAttribute('href')
    if (['BUTTON', 'SUMMARY', 'SELECT', 'INPUT', 'TEXTAREA', 'LABEL'].includes(tag)) return true
    const papel = el.getAttribute('role')
    if (papel === 'button' || papel === 'link' || papel === 'tab') return true
    try { return window.getComputedStyle(el).cursor === 'pointer' } catch (e) { return false }
  }
  const barra = (e) => {
    const alvo = e.target
    if (!alvo || !alvo.closest) return false
    if (alvo.closest('[data-livre]')) return false
    let el = alvo
    while (el && el !== e.currentTarget) {
      if (el.tagName === 'A' && /^\/planos(\/|\?|#|$)/.test(el.getAttribute('href') || '')) return false
      if (interativo(el)) return true
      el = el.parentElement
    }
    return false
  }
  return {
    onClickCapture: (e) => { if (barra(e)) { e.preventDefault(); e.stopPropagation(); avisar() } },
    onFocusCapture: (e) => {
      const t = e.target
      if (t && ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName) && !t.closest('[data-livre]')) { e.stopPropagation(); try { t.blur() } catch (x) { /* sem efeito */ } avisar() }
    },
    onSubmitCapture: (e) => { if (!e.target.closest('[data-livre]')) { e.preventDefault(); e.stopPropagation(); avisar() } },
  }
}

function BloqueioAssinante() {
  return (
    <div className="cartao bloqueio">
      <span className="trava-icone" aria-hidden="true">🔒</span>
      <h2>Conteúdo para assinantes</h2>
      <p>Assine o plano <b>Querubim</b> ou <b>Serafim</b> para liberar o acesso ao conteúdo.</p>
      <div className="botoes centro"><Link className="btn ouro" to="/planos">Ver os planos</Link><Link className="btn" to="/inicio">Voltar ao Início</Link></div>
    </div>
  )
}

// Códigos do Espírito: página interna com acesso por plano (o admin libera Querubim e Anjo no painel).
function EspiritoRota() {
  const { sessao, db } = useLoja()
  if (!temEspirito(sessao, db.config)) {
    return (
      <Shell titulo="Códigos do Espírito">
        <div className="cartao bloqueio">
          <span className="trava-icone" aria-hidden="true">🔒</span>
          <h2>Códigos do Espírito</h2>
          <p>Estudo bíblico por tema, alfabeto hebraico e grego e a soma das letras (Gematria). Esta área está liberada para o plano <b>Serafim</b>.</p>
          <div className="botoes centro"><Link className="btn ouro" to="/planos">Ver os planos</Link><Link className="btn" to="/inicio">Voltar ao Início</Link></div>
        </div>
      </Shell>
    )
  }
  return (
    <Shell titulo="Códigos do Espírito">
      <Suspense fallback={<p className="mudo" role="status">Carregando…</p>}><EspiritoApp /></Suspense>
    </Shell>
  )
}

// nivel: 'vitrine' (rola e olha; clique pede assinatura) · 'assinante' (página interna só para assinantes) · vazio (livre)
function PorPlano({ nivel, children }) {
  const { sessao } = useLoja()
  if (!nivel || ehAssinante(sessao)) return children
  if (nivel === 'assinante') return <Shell titulo="Conteúdo para assinantes"><BloqueioAssinante /></Shell>
  return <VitrineCtx.Provider value={true}>{children}</VitrineCtx.Provider>
}

/* ───── Tela escura para quem fica parado (plano grátis e visitantes) ───── */
const TEMPO_OCIOSO = 180000

function RaiosLuz() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const x = c.getContext('2d')
    const parado = parouMovimento()
    let w = 0, h = 0, raf = 0, proximo = 1200, raio = null, t0 = performance.now()
    const pts = Array.from({ length: 100 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + 0.4, v: Math.random() * 0.00006 + 0.00002, f: Math.random() * 6 }))
    const novoRaio = () => {
      const seg = []
      let px = (0.12 + Math.random() * 0.76) * w, py = 0
      const fim = h * (0.45 + Math.random() * 0.4)
      seg.push([px, py])
      while (py < fim) { py += 16 + Math.random() * 30; px += (Math.random() - 0.5) * 56; seg.push([px, py]) }
      const ramo = seg.slice(Math.floor(seg.length / 3)).map(([a, b], i) => [a + i * (Math.random() < 0.5 ? -12 : 12), b + i * 8]).slice(0, 5)
      return { seg, ramo, nasc: performance.now(), dur: 1100 }
    }
    const traco = (seg, a, larg) => {
      x.beginPath(); seg.forEach(([a1, b1], i) => (i ? x.lineTo(a1, b1) : x.moveTo(a1, b1)))
      x.strokeStyle = 'rgba(255, 244, 205,' + a + ')'; x.lineWidth = larg; x.shadowColor = 'rgba(243, 217, 139, 0.9)'; x.shadowBlur = 22; x.stroke(); x.shadowBlur = 0
    }
    const des = (now) => {
      x.clearRect(0, 0, w, h)
      pts.forEach((p) => {
        if (!parado) { p.y -= p.v * 16; if (p.y < 0) { p.y = 1; p.x = Math.random() } }
        const a = parado ? 0.5 : 0.25 + 0.75 * Math.abs(Math.sin(now / 900 + p.f))
        x.globalAlpha = a; x.fillStyle = p.r > 1.6 ? '#f3d98b' : '#ffffff'
        x.beginPath(); x.arc(p.x * w, p.y * h, p.r, 0, 7); x.fill()
      })
      x.globalAlpha = 1
      if (!parado) {
        if (!raio && now - t0 > proximo) { raio = novoRaio(); t0 = now; proximo = 2800 + Math.random() * 3200 }
        if (raio) {
          const idade = (now - raio.nasc) / raio.dur
          if (idade >= 1) raio = null
          else {
            const a = Math.pow(1 - idade, 2)
            const g = x.createRadialGradient(raio.seg[0][0], 0, 0, raio.seg[0][0], 0, h * 0.7)
            g.addColorStop(0, 'rgba(243, 217, 139,' + (0.22 * a) + ')'); g.addColorStop(1, 'rgba(243, 217, 139, 0)')
            x.fillStyle = g; x.fillRect(0, 0, w, h)
            traco(raio.seg, a, 2.4); traco(raio.ramo, a * 0.7, 1.4)
          }
        }
        raf = requestAnimationFrame(des)
      }
    }
    const tam = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; if (parado) des(0) }
    tam()
    window.addEventListener('resize', tam)
    if (!parado) raf = requestAnimationFrame(des)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', tam) }
  }, [])
  return <canvas ref={ref} className="ocioso-tela" aria-hidden="true" />
}

function OciosoFree() {
  const { sessao } = useLoja()
  const loc = useLocation()
  const [ativo, setAtivo] = useState(false)
  const alvo = !ehAssinante(sessao) && !['/', '/entrar', '/planos'].includes(loc.pathname)
  useEffect(() => {
    if (!alvo) { setAtivo(false); return undefined }
    let t = 0
    const zerar = () => { clearTimeout(t); t = setTimeout(() => setAtivo(true), TEMPO_OCIOSO) }
    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel', 'click']
    eventos.forEach((n) => window.addEventListener(n, zerar, { passive: true, capture: true }))
    zerar()
    return () => { clearTimeout(t); eventos.forEach((n) => window.removeEventListener(n, zerar, { capture: true })) }
  }, [alvo, loc.pathname])
  useEffect(() => { setAtivo(false) }, [loc.pathname])
  if (!ativo || !alvo) return null
  return createPortal(
    <div className="ocioso" role="dialog" aria-modal="true" aria-labelledby="ocioso-titulo">
      <RaiosLuz />
      <div className="ocioso-texto">
        <h2 id="ocioso-titulo"><span>LIBERE O</span> CONHECIMENTO.</h2>
        <p className="ocioso-assine">ASSINE.</p>
        <p className="mudo">Planos Querubim e Serafim.</p>
        <div className="botoes centro">
          <Link className="btn ouro grande" to="/planos" onClick={() => setAtivo(false)}>Ver os planos</Link>
          <button type="button" className="btn" onClick={() => setAtivo(false)}>Continuar olhando</button>
        </div>
      </div>
    </div>, document.body)
}

/* ───── Cupons de desconto ─────
   Código: AV + plano (Q Querubim, S Serafim, A ambos) + desconto (A 25%, B 50%, C 70%, D 100%) - validade(3) + série(3) - verificação(4).
   O código carrega o plano, o desconto e a validade e uma verificação; por isso dá para conferi-lo em qualquer aparelho no protótipo.
   Na Fase 1 a conferência passa para o servidor, que também controla quantas vezes cada cupom foi usado. */
const CUPOM_SAL = 'avivar-cupom-2026'
const CUPOM_PCT = { A: 25, B: 50, C: 70, D: 100 }
const CUPOM_PCT_LETRA = { 25: 'A', 50: 'B', 70: 'C', 100: 'D' }
const CUPOM_PLANO = { Q: 'querubim', S: 'serafim', A: 'ambos' }
const CUPOM_PLANO_LETRA = { querubim: 'Q', serafim: 'S', ambos: 'A' }
const CUPOM_DIA0 = Date.UTC(2026, 0, 1)
const CUPOM_ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const hashCupom = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4)
}
function gerarCupom(plano, pct, validadeDias) {
  const dias = validadeDias ? Math.max(1, Math.floor((Date.now() - CUPOM_DIA0) / 86400000) + Number(validadeDias)) : 0
  const exp = dias.toString(36).toUpperCase().padStart(3, '0').slice(-3)
  let serie = ''
  for (let i = 0; i < 3; i++) serie += CUPOM_ALFA[Math.floor(Math.random() * CUPOM_ALFA.length)]
  const corpo = 'AV' + CUPOM_PLANO_LETRA[plano] + CUPOM_PCT_LETRA[pct] + exp + serie
  return corpo.slice(0, 4) + '-' + exp + serie + '-' + hashCupom(corpo + CUPOM_SAL)
}
function lerCupom(texto) {
  const c = String(texto || '').trim().toUpperCase().replace(/\s+/g, '')
  const m = c.match(/^AV([QSA])([ABCD])-([0-9A-Z]{3})([A-Z]{3})-([0-9A-Z]{4})$/)
  if (!m) return { ok: false, motivo: 'Cupom não reconhecido. Confira o código.' }
  const corpo = 'AV' + m[1] + m[2] + m[3] + m[4]
  if (hashCupom(corpo + CUPOM_SAL) !== m[5]) return { ok: false, motivo: 'Cupom não reconhecido. Confira o código.' }
  const dias = parseInt(m[3], 36)
  const fim = dias ? CUPOM_DIA0 + (dias + 1) * 86400000 : 0
  return { ok: true, codigo: c, plano: CUPOM_PLANO[m[1]], pct: CUPOM_PCT[m[2]], validade: fim ? new Date(fim - 86400000).toISOString().slice(0, 10) : '', vencido: !!fim && Date.now() >= fim }
}
function validarCupom(texto, plano, db, usos) {
  const c = lerCupom(texto)
  if (!c.ok) return c
  if (c.vencido) return { ok: false, motivo: 'Este cupom venceu em ' + dataBR(c.validade) + '.' }
  if (c.plano !== 'ambos' && c.plano !== plano) return { ok: false, motivo: 'Este cupom vale só para o plano ' + (c.plano === 'querubim' ? 'Querubim' : 'Serafim') + '.' }
  const reg = (db.cupons || []).find((x) => x.codigo === c.codigo)
  if (reg && reg.ativo === false) return { ok: false, motivo: 'Este cupom foi desativado.' }
  const usado = (usos || {})[c.codigo] || 0
  if (usado >= ((reg && Number(reg.max)) || 1)) return { ok: false, motivo: 'Este cupom já foi usado.' }
  return c
}
const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '')
const valorNum = (s) => {
  const m = String(s || '').replace(/\./g, '').match(/(\d+)(?:,(\d{1,2}))?/)
  return m ? parseFloat(m[1] + '.' + (m[2] || '0')) : null
}
const reais = (n) => 'R$ ' + n.toFixed(2).replace('.', ',')
// Ciclos de renovação automática (cartão) que o admin deixou com preço neste plano.
const CICLOS_REC = [['mensal', 'Mensal', 'precoRecMensal', 'por mês'], ['semestral', 'Semestral', 'precoRecSemestral', 'a cada 6 meses'], ['anual', 'Anual', 'precoRecAnual', 'a cada 12 meses']]
const ciclosRec = (plano) => CICLOS_REC.map(([id, nome, campo, cada]) => ({ id, nome, cada, preco: String((plano && plano[campo]) || '').trim() })).filter((c) => valorNum(c.preco) !== null && valorNum(c.preco) > 0)

// Painel de assinatura dentro do cartão do plano (pagamento simulado na Fase 0).
function AssinarPlano({ plano, aoFechar, aoLiberar }) {
  const { db, sessao, cuponsUsos, assinar, definirSessao } = useLoja()
  const nav = useNavigate()
  const [carregando, setCarregando] = useState(false)
  const [periodo, setPeriodo] = useState('semestral')
  const [codigo, setCodigo] = useState('')
  const [cupom, setCupom] = useState(null)
  const [msg, setMsg] = useState('')
  const [feito, setFeito] = useState(false)
  const rec = SERVIDOR ? ciclosRec(plano) : []
  const [modo, setModo] = useState('periodo')
  const [ciclo, setCiclo] = useState(rec.length ? rec[0].id : '')
  const cicloAtual = rec.find((c) => c.id === ciclo) || rec[0] || null
  const base = valorNum(periodo === 'semestral' ? plano.precoSemestral : plano.precoAnual)
  const [finDisp, setFinDisp] = useState(false)
  useEffect(() => { if (SERVIDOR) SB.financiamentoOpcoes(Math.round((valorNum(plano.precoSemestral) || valorNum(plano.precoAnual) || 0) * 100)).then((r) => setFinDisp(!!(r && r.disponivel))).catch(() => setFinDisp(false)) }, [plano.id])
  const pct = cupom ? cupom.pct : 0
  const final = base === null ? null : base * (1 - pct / 100)
  const aplicar = async () => {
    if (SERVIDOR) {
      if (!sessao) { setCupom(null); setMsg('Entre na sua conta para aplicar o cupom.'); return }
      if (!codigo.trim()) { setCupom(null); setMsg('Digite o código do cupom.'); return }
      setCarregando(true)
      try {
        const r = await SB.cupomValidar(codigo, plano.id)
        if (r && r.ok && r.pct) { setCupom({ codigo: r.codigo, pct: r.pct }); setMsg('') } else { setCupom(null); setMsg((r && r.motivo) || 'Cupom inválido.') }
      } catch (e) { setCupom(null); setMsg(e.message) } finally { setCarregando(false) }
      return
    }
    const r = validarCupom(codigo, plano.id, db, cuponsUsos)
    if (r.ok) { setCupom(r); setMsg('') } else { setCupom(null); setMsg(r.motivo) }
  }
  const confirmar = async () => {
    if (!sessao) { nav('/entrar', { state: { de: '/planos' } }); return }
    if (SERVIDOR && modo === 'recorrente' && cicloAtual) {
      setCarregando(true); setMsg('')
      try {
        const r = await SB.criarAssinatura({ plano: plano.id, ciclo: cicloAtual.id })
        window.location.href = r.url
      } catch (e) { setMsg(e.message); setCarregando(false) }
      return
    }
    if (SERVIDOR) {
      setCarregando(true); setMsg('')
      try {
        const r = await SB.criarPagamento({ plano: plano.id, periodo, cupom: cupom ? cupom.codigo : '' })
        if (r.gratis) { try { const perf = await SB.perfil(); if (perf) definirSessao(sessaoDe(perf)) } catch (e) { /* o plano já foi liberado no servidor */ } setFeito('gratis'); setCarregando(false); if (aoLiberar) aoLiberar(plano.titulo, 'O cupom cobriu todo o valor. Que o Senhor abençoe os seus estudos.'); return }
        window.location.href = r.url
      } catch (e) { setMsg(e.message); setCarregando(false) }
      return
    }
    assinar({ plano: plano.id, periodo, pct, cupom: cupom ? cupom.codigo : '', valor: final === null ? '' : reais(final) })
    setFeito(true)
    if (aoLiberar) aoLiberar(plano.titulo)
  }
  if (feito === 'gratis') {
    return (
      <div className="assinar" role="status">
        <p><b>Plano {plano.titulo} liberado.</b> O cupom cobriu todo o valor. Que o Senhor abençoe os seus estudos.</p>
        <Link className="btn ouro" to="/inicio">Ir para o Início</Link>
      </div>
    )
  }
  if (feito) {
    return (
      <div className="assinar" role="status">
        <p><b>Plano {plano.titulo} liberado.</b> (Pagamento simulado nesta fase.)</p>
        <Link className="btn ouro" to="/inicio">Ir para o Início</Link>
      </div>
    )
  }
  if (modo === 'recorrente' && cicloAtual) {
    return (
      <div className="assinar">
        {rec.length > 0 && <div className="botoes" role="group" aria-label="Forma de assinar">
          <button type="button" className="btn" aria-pressed="false" onClick={() => setModo('periodo')}>Pagar por período</button>
          <button type="button" className="btn ouro" aria-pressed="true">Renovação automática</button>
        </div>}
        <div className="botoes" role="group" aria-label="Ciclo da renovação automática">
          {rec.map((c) => <button key={c.id} type="button" className={'btn' + (cicloAtual.id === c.id ? ' ouro' : '')} aria-pressed={cicloAtual.id === c.id} onClick={() => setCiclo(c.id)}>{c.nome}</button>)}
        </div>
        <p className="assinar-total"><b>{cicloAtual.preco}</b> <span className="mudo">{cicloAtual.cada}</span></p>
        {msg && <p className="assinar-erro" role="alert">{msg}</p>}
        <p className="mudo assinar-nota">Você será levado ao Mercado Pago para autorizar a cobrança no cartão de crédito. O valor de {cicloAtual.preco} será cobrado {cicloAtual.cada} e a assinatura renova sozinha até você cancelar. Para cancelar, é só entrar em Perfil e tocar em "Cancelar renovação automática": o acesso continua até o fim do período que já foi pago. Cupons de desconto valem apenas no pagamento por período.</p>
        <div className="botoes">
          <button type="button" className="btn ouro" disabled={carregando || (SERVIDOR && sessao && !cicloAtual)} onClick={confirmar}>{!sessao ? 'Entrar para assinar' : carregando ? 'Um instante…' : 'Assinar com renovação automática'}</button>
          <button type="button" className="btn" onClick={aoFechar}>Cancelar</button>
        </div>
        {finDisp && <Link className="assinar-outros" to={'/financiamento/' + plano.id}>Outros Financiamento</Link>}
      </div>
    )
  }
  return (
    <div className="assinar">
      {rec.length > 0 && <div className="botoes" role="group" aria-label="Forma de assinar">
        <button type="button" className="btn ouro" aria-pressed="true">Pagar por período</button>
        <button type="button" className="btn" aria-pressed="false" onClick={() => setModo('recorrente')}>Renovação automática</button>
      </div>}
      <div className="botoes" role="group" aria-label="Período da assinatura">
        <button type="button" className={'btn' + (periodo === 'semestral' ? ' ouro' : '')} aria-pressed={periodo === 'semestral'} onClick={() => setPeriodo('semestral')}>Semestral</button>
        <button type="button" className={'btn' + (periodo === 'anual' ? ' ouro' : '')} aria-pressed={periodo === 'anual'} onClick={() => setPeriodo('anual')}>Anual</button>
      </div>
      <label className="assinar-cupom">Tem um cupom de desconto?
        <span className="assinar-linha">
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="AVQB-XXXX-XXXX" autoCapitalize="characters" />
          <button type="button" className="btn" disabled={carregando} onClick={aplicar}>Aplicar</button>
        </span>
      </label>
      {msg && <p className="assinar-erro" role="alert">{msg}</p>}
      {cupom && <p className="assinar-ok" role="status">Cupom aplicado: <b>{cupom.pct}% de desconto</b>.</p>}
      <p className="assinar-total">
        {base === null
          ? <>Valor a definir pelo ministério{pct ? ' · desconto de ' + pct + '%' : ''}</>
          : <>{pct > 0 && <s>{reais(base)}</s>} <b>{final === 0 ? 'Gratuito' : reais(final)}</b></>}
      </p>
      {SERVIDOR && <p className="mudo assinar-nota">Você será levado ao Mercado Pago para pagar com Pix, cartão ou boleto. O plano é liberado sozinho quando o pagamento é confirmado. A assinatura vale por {periodo === 'semestral' ? '6 meses' : '12 meses'} e não renova sozinha: quando quiser renovar, os meses se somam.</p>}
      <div className="botoes">
        <button type="button" className="btn ouro" disabled={carregando || (SERVIDOR && sessao && base === null)} onClick={confirmar}>{!sessao ? 'Entrar para assinar' : SERVIDOR ? (carregando ? 'Um instante…' : final === 0 ? 'Ativar o plano grátis' : 'Ir para o pagamento') : 'Confirmar assinatura (simulação)'}</button>
        <button type="button" className="btn" onClick={aoFechar}>Cancelar</button>
      </div>
      {finDisp && <Link className="assinar-outros" to={'/financiamento/' + plano.id}>Outros Financiamento</Link>}
    </div>
  )
}


// Painel do admin: lista de quem se cadastrou, para os comunicados.
function CadastrosAdmin() {
  const { cadastros, removerCadastro } = useLoja()
  const [remoto, setRemoto] = useState(null)
  const [erroSrv, setErroSrv] = useState('')
  const [edicao, setEdicao] = useState({})
  const carregarSrv = () => { SB.listarPerfis().then((l) => { setRemoto(l); setErroSrv('') }).catch((e) => setErroSrv(e.message)) }
  useEffect(() => { if (SERVIDOR) carregarSrv() }, [])
  const base = SERVIDOR ? (remoto || []).map((c) => ({ id: c.id, nome: c.nome, email: c.email, whatsapp: c.whatsapp, plano: c.plano, planoAte: c.plano_ate || '', papel: c.papel, aceite: !!c.aceite_comunicados, criado: c.criado_em })) : (cadastros || [])
  const lista = [...base].sort((a, b) => String(b.criado).localeCompare(String(a.criado)))
  const [aviso, setAviso] = useState('')
  const copiar = (txt, o) => { try { navigator.clipboard.writeText(txt); setAviso(o + ' copiados.') } catch (e) { setAviso('Não foi possível copiar neste aparelho.') } }
  const baixar = () => {
    const aspas = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'
    const csv = ['nome;email;whatsapp;plano;plano até;aceitou comunicados;cadastro'].concat(lista.map((c) => [c.nome, c.email, c.whatsapp, c.plano, c.planoAte || '', c.aceite ? 'sim' : 'não', c.criado].map(aspas).join(';'))).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'cadastros-codigos-avivar.csv'
    a.click()
  }
  const salvarPlano = async (c) => {
    const e = edicao[c.id] || {}
    const plano = e.plano || c.plano
    const ate = plano === 'anjo' ? '' : (e.ate !== undefined ? e.ate : c.planoAte)
    if (plano !== 'anjo' && !ate) { setAviso('Escolha até que dia o plano vale.'); return }
    try { await SB.definirPlano(c.id, plano, ate); setAviso('Plano de ' + c.nome + ' salvo.'); setEdicao((x) => ({ ...x, [c.id]: undefined })); carregarSrv() } catch (err) { setAviso(err.message) }
  }
  return (
    <section className="cupons">
      {SERVIDOR
        ? <Aviso>Lista real de todos os cadastros do servidor. Só envie comunicados a quem marcou que aceita recebê-los. Para ativar um plano depois de receber o pagamento, escolha o plano, a data final e toque em Salvar plano.</Aviso>
        : <Aviso forte>Nesta fase os cadastros ficam salvos só neste aparelho e navegador. Quem se cadastra pelo site no aparelho dele NÃO aparece aqui. A lista real, de todos os usuários, chega com o servidor da Fase 1. Só envie comunicados a quem marcou que aceita recebê-los.</Aviso>}
      {erroSrv && <p className="assinar-erro" role="alert">{erroSrv}</p>}
      <div className="botoes">
        <button type="button" className="btn ouro" onClick={baixar} disabled={!lista.length}>Baixar lista (CSV)</button>
        <button type="button" className="btn" onClick={() => copiar(lista.filter((c) => c.aceite).map((c) => c.email).join(', '), 'E-mails')} disabled={!lista.length}>Copiar e-mails</button>
        <button type="button" className="btn" onClick={() => copiar(lista.filter((c) => c.aceite).map((c) => c.whatsapp).join('\n'), 'WhatsApps')} disabled={!lista.length}>Copiar WhatsApps</button>
      </div>
      {aviso && <p className="assinar-ok" role="status">{aviso}</p>}
      {!lista.length && <p className="mudo">{SERVIDOR && remoto === null && !erroSrv ? 'Carregando…' : 'Nenhum cadastro ainda.'}</p>}
      <div className="lista">
        {lista.map((c) => (
          <div key={c.id} className="cartao item-linha cupom-linha">
            <span><b>{c.nome}</b> · {c.email} · {zapBonito(c.whatsapp)} · <Selo tipo="ouro">{String(c.plano || 'anjo').toUpperCase()}</Selo>{c.planoAte ? ' até ' + dataBR(c.planoAte) : ''}{c.papel === 'admin' ? ' · ADMIN' : ''} · {c.aceite ? 'aceitou comunicados' : 'sem aceite'} · {new Date(c.criado).toLocaleDateString('pt-BR')}</span>
            {SERVIDOR
              ? <span className="cad-plano">
                <select aria-label={'Plano de ' + c.nome} value={(edicao[c.id] || {}).plano || c.plano} onChange={(e) => setEdicao((x) => ({ ...x, [c.id]: { ...(x[c.id] || {}), plano: e.target.value } }))}><option value="anjo">Anjo</option><option value="querubim">Querubim</option><option value="serafim">Serafim</option></select>
                <input type="date" aria-label={'Plano de ' + c.nome + ' vale até'} value={(edicao[c.id] || {}).ate !== undefined ? edicao[c.id].ate : c.planoAte} onChange={(e) => setEdicao((x) => ({ ...x, [c.id]: { ...(x[c.id] || {}), ate: e.target.value } }))} />
                <button type="button" className="btn pequeno" onClick={() => salvarPlano(c)}>Salvar plano</button>
              </span>
              : <button type="button" className="btn pequeno" onClick={() => { if (window.confirm('Excluir o cadastro de ' + c.email + '?')) removerCadastro(c.email) }}>Excluir</button>}
          </div>
        ))}
      </div>
    </section>
  )
}

// Painel do admin: gerador de cupons e lista de assinaturas.
function CuponsServidor() {
  const [lista, setLista] = useState(null)
  const [pags, setPags] = useState(null)
  const [asss, setAsss] = useState(null)
  const [msg, setMsg] = useState('')
  const [plano, setPlano] = useState('ambos')
  const [pct, setPct] = useState(50)
  const [qtd, setQtd] = useState(1)
  const [dias, setDias] = useState('')
  const [max, setMax] = useState(1)
  const [novos, setNovos] = useState([])
  const [copiado, setCopiado] = useState('')
  const [gerando, setGerando] = useState(false)
  const carregar = async () => {
    try { const [c, p, as] = await Promise.all([SB.cuponsListar(), SB.pagamentosListar(), SB.assinaturasListar()]); setLista(c || []); setPags(p || []); setAsss(as || []); setMsg('') } catch (e) { setMsg('Não foi possível ler do servidor: ' + e.message) }
  }
  useEffect(() => { carregar() }, [])
  const gerar = async () => {
    const n = Math.min(50, Math.max(1, Number(qtd) || 1))
    setGerando(true)
    try { setNovos(await SB.cuponsCriar({ plano, pct, dias: dias ? Math.max(1, Number(dias)) : null, max: Math.max(1, Number(max) || 1), qtd: n })); await carregar() } catch (e) { setMsg('Não foi possível gerar: ' + e.message) } finally { setGerando(false) }
  }
  const copiar = (t) => { try { navigator.clipboard.writeText(t) } catch (e) { /* sem área de transferência */ } setCopiado(t); setTimeout(() => setCopiado(''), 1500) }
  const nomePlano = (p) => (p === 'ambos' ? 'Querubim e Serafim' : p === 'querubim' ? 'Querubim' : 'Serafim')
  const hoje = new Date().toISOString().slice(0, 10)
  const mudar = async (c, campos) => { try { await SB.cupomMudar(c.codigo, campos); await carregar() } catch (e) { setMsg(e.message) } }
  const cancelarCompraCurso = async (x) => { if (!window.confirm('Cancelar a compra do curso "' + (x.curso_titulo || x.curso_id) + '" de ' + (x.nome || x.email) + '? A pessoa perde o acesso a este curso e, se foi paga, a devolução do dinheiro é feita por você no Mercado Pago.')) return; try { await SB.cursoCancelarCompra(x.id); await carregar() } catch (e) { setMsg('Não foi possível cancelar: ' + e.message) } }
  const excluir = async (c) => { if (!window.confirm('Excluir o cupom ' + c.codigo + '?')) return; try { await SB.cupomExcluir(c.codigo); await carregar() } catch (e) { setMsg(e.message) } }
  const baixarCsv = () => {
    const linhasCsv = ['codigo;plano;desconto;validade;usos;usos_maximos;ativo'].concat((lista || []).map((c) => [c.codigo, nomePlano(c.plano), c.pct + '%', c.validade || 'sem validade', c.usos, c.max_usos, c.ativo ? 'sim' : 'nao'].join(';')))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([linhasCsv.join('\n')], { type: 'text/csv;charset=utf-8' }))
    a.download = 'cupons-codigos-avivar.csv'
    a.click()
  }
  const pagos = (pags || []).filter((x) => x.status === 'aprovado')
  const totalPago = pagos.reduce((t, x) => t + (x.valor_centavos || 0), 0)
  return (
    <section className="cupons">
      <Aviso>Os cupons e os pagamentos ficam guardados no servidor. Cada cupom é conferido lá, com contagem de usos e validade, e o valor é sempre calculado pelo servidor.</Aviso>
      {msg && <Aviso forte>{msg}</Aviso>}
      <div className="cartao form">
        <h3>Gerar cupons</h3>
        <label>Vale para
          <select value={plano} onChange={(e) => setPlano(e.target.value)}><option value="ambos">Querubim e Serafim</option><option value="querubim">Só Querubim</option><option value="serafim">Só Serafim</option></select>
        </label>
        <div className="botoes" role="group" aria-label="Desconto">
          {[25, 50, 70, 100].map((p) => <button key={p} type="button" className={'btn' + (pct === p ? ' ouro' : '')} aria-pressed={pct === p} onClick={() => setPct(p)}>{p}%</button>)}
        </div>
        <label>Quantos cupons (1 a 50)<input type="number" min="1" max="50" value={qtd} onChange={(e) => setQtd(e.target.value)} /></label>
        <label>Validade, em dias (vazio = sem validade)<input type="number" min="1" value={dias} onChange={(e) => setDias(e.target.value)} placeholder="Ex.: 30" /></label>
        <label>Usos por cupom<input type="number" min="1" value={max} onChange={(e) => setMax(e.target.value)} /></label>
        <button type="button" className="btn ouro" disabled={gerando} onClick={gerar}>{gerando ? 'Gerando…' : 'Gerar ' + Math.min(50, Math.max(1, Number(qtd) || 1)) + (Number(qtd) > 1 ? ' cupons' : ' cupom') + ' de ' + pct + '%'}</button>
        {novos.length > 0 && (
          <div className="cupons-novos" role="status">
            <b>Cupons novos (copie e guarde):</b>
            <ul>{novos.map((c) => <li key={c}><span className="cupom-cod">{c}</span> <button type="button" className="btn pequeno" onClick={() => copiar(c)}>{copiado === c ? 'Copiado' : 'Copiar'}</button></li>)}</ul>
          </div>
        )}
      </div>
      <div className="linha-titulo"><h3>Cupons ({lista ? lista.length : '…'})</h3>{lista && lista.length > 0 && <button type="button" className="btn" onClick={baixarCsv}>Baixar lista (CSV)</button>}</div>
      {lista && lista.length === 0 && <p className="mudo">Nenhum cupom ainda.</p>}
      <div className="lista">
        {(lista || []).map((c) => (
          <div key={c.codigo} className="cartao item-linha cupom-linha">
            <b className="cupom-cod">{c.codigo}</b>
            <span>{c.pct}% · {nomePlano(c.plano)}</span>
            <span className="mudo">{c.validade ? 'até ' + dataBR(c.validade) : 'sem validade'} · usos: {c.usos}/{c.max_usos}</span>
            {c.validade && c.validade < hoje && <Selo>VENCIDO</Selo>}{!c.ativo && <Selo>DESATIVADO</Selo>}
            <span className="botoes">
              <button type="button" className="btn pequeno" onClick={() => copiar(c.codigo)}>{copiado === c.codigo ? 'Copiado' : 'Copiar'}</button>
              <button type="button" className="btn pequeno" onClick={() => mudar(c, { ativo: !c.ativo })}>{c.ativo ? 'Desativar' : 'Reativar'}</button>
              <button type="button" className="btn pequeno" onClick={() => excluir(c)}>Excluir</button>
            </span>
          </div>
        ))}
      </div>
      <div className="linha-titulo"><h3>Renovações automáticas ({asss ? asss.filter((x) => x.status === 'ativa' || x.status === 'pausada').length : '…'} ativas)</h3></div>
      {asss && asss.length === 0 && <p className="mudo">Nenhuma renovação automática ainda. Para oferecer, preencha os preços de "Renovação automática" em Admin &gt; Planos.</p>}
      <div className="lista">
        {(asss || []).map((x) => <p key={x.id} className="cartao item-linha">{dataBR(String(x.criado_em).slice(0, 10))} · {x.nome || '—'} · {x.email} · {x.plano === 'serafim' ? 'Serafim' : 'Querubim'} ({x.ciclo}) · {reaisCent(x.valor_centavos)} · <b>{x.status}</b>{x.status === 'ativa' && x.proxima_cobranca ? ' · próxima por volta de ' + dataBR(x.proxima_cobranca) : ''}</p>)}
      </div>
      <div className="linha-titulo"><h3>Pagamentos das assinaturas e dos cursos ({pags ? pags.length : '…'})</h3><button type="button" className="btn" onClick={carregar}>Atualizar</button></div>
      {pags && <p>Pagos até agora: <b>{pagos.length}</b> · Total recebido: <b>{reaisCent(totalPago)}</b></p>}
      {pags && pags.length === 0 && <p className="mudo">Nenhum pagamento ainda.</p>}
      <div className="lista">
        {(pags || []).map((x) => <p key={x.id} className="cartao item-linha">{dataBR(String(x.criado_em).slice(0, 10))} · {x.nome || '—'} · {x.email} · {x.origem === 'curso' ? 'Curso: ' + (x.curso_titulo || x.curso_id) : <>{x.plano === 'serafim' ? 'Serafim' : 'Querubim'} ({x.periodo}{x.origem === 'recorrente' ? ', renovação automática' : x.origem === 'parcela' ? ', financiamento' : ''})</>} · {reaisCent(x.valor_centavos)}{x.cupom ? ' · cupom ' + x.cupom + ' (' + x.pct + '%)' : ''} · <b>{NOME_STATUS_PG[x.status] || x.status}</b>{x.origem === 'curso' && (x.status === 'aprovado' || x.status === 'gratis') && <> <button type="button" className="btn pequeno" onClick={() => cancelarCompraCurso(x)}>Cancelar compra do curso</button></>}</p>)}
      </div>
    </section>
  )
}

function CuponsAdmin() {
  const { db, assinaturas, cuponsUsos, salvarItem, removerItem } = useLoja()
  const [plano, setPlano] = useState('ambos')
  const [pct, setPct] = useState(50)
  const [qtd, setQtd] = useState(1)
  const [dias, setDias] = useState('')
  const [max, setMax] = useState(1)
  const [copiado, setCopiado] = useState('')
  const lista = [...(db.cupons || [])].reverse()
  const gerar = () => {
    const n = Math.min(50, Math.max(1, Number(qtd) || 1))
    const feitos = new Set((db.cupons || []).map((c) => c.codigo))
    for (let i = 0; i < n; i++) {
      let cod = gerarCupom(plano, pct, dias)
      while (feitos.has(cod)) cod = gerarCupom(plano, pct, dias)
      feitos.add(cod)
      const l = lerCupom(cod)
      salvarItem('cupons', { id: cod, titulo: cod, codigo: cod, plano, pct, validade: l.validade, max: Math.max(1, Number(max) || 1), criado: new Date().toISOString().slice(0, 10), ativo: true })
    }
  }
  const copiar = (t) => { try { navigator.clipboard.writeText(t) } catch (e) { /* sem área de transferência */ } setCopiado(t); setTimeout(() => setCopiado(''), 1500) }
  const nomePlano = (p) => (p === 'ambos' ? 'Querubim e Serafim' : p === 'querubim' ? 'Querubim' : 'Serafim')
  const baixarCsv = () => {
    const linhasCsv = ['codigo;plano;desconto;validade;usos_maximos;criado'].concat(lista.map((c) => [c.codigo, nomePlano(c.plano), c.pct + '%', c.validade || 'sem validade', c.max, c.criado].join(';')))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([linhasCsv.join('\n')], { type: 'text/csv;charset=utf-8' }))
    a.download = 'cupons-codigos-avivar.csv'
    a.click()
  }
  return (
    <section className="cupons">
      <Aviso forte>Protótipo: o cupom vale em qualquer aparelho (o código carrega plano, desconto e validade), mas o controle de quantas vezes foi usado só existe neste aparelho. Na Fase 1, o servidor confere e conta os usos de verdade.</Aviso>
      <div className="cartao form">
        <h3>Gerar cupons</h3>
        <label>Vale para
          <select value={plano} onChange={(e) => setPlano(e.target.value)}><option value="ambos">Querubim e Serafim</option><option value="querubim">Só Querubim</option><option value="serafim">Só Serafim</option></select>
        </label>
        <div className="botoes" role="group" aria-label="Desconto">
          {[25, 50, 70, 100].map((p) => <button key={p} type="button" className={'btn' + (pct === p ? ' ouro' : '')} aria-pressed={pct === p} onClick={() => setPct(p)}>{p}%</button>)}
        </div>
        <label>Quantos cupons (1 a 50)<input type="number" min="1" max="50" value={qtd} onChange={(e) => setQtd(e.target.value)} /></label>
        <label>Validade, em dias (vazio = sem validade)<input type="number" min="1" value={dias} onChange={(e) => setDias(e.target.value)} placeholder="Ex.: 30" /></label>
        <label>Usos por cupom<input type="number" min="1" value={max} onChange={(e) => setMax(e.target.value)} /></label>
        <button type="button" className="btn ouro" onClick={gerar}>Gerar {Math.min(50, Math.max(1, Number(qtd) || 1))} {Number(qtd) > 1 ? 'cupons' : 'cupom'} de {pct}%</button>
      </div>
      <div className="linha-titulo"><h3>Cupons gerados ({lista.length})</h3>{lista.length > 0 && <button type="button" className="btn" onClick={baixarCsv}>Baixar lista (CSV)</button>}</div>
      {lista.length === 0 && <p className="mudo">Nenhum cupom ainda.</p>}
      <div className="lista">
        {lista.map((c) => {
          const usos = (cuponsUsos || {})[c.codigo] || 0
          const vencido = !!lerCupom(c.codigo).vencido
          return (
            <div key={c.id} className="cartao item-linha cupom-linha">
              <b className="cupom-cod">{c.codigo}</b>
              <span>{c.pct}% · {nomePlano(c.plano)}</span>
              <span className="mudo">{c.validade ? 'até ' + dataBR(c.validade) : 'sem validade'} · usos neste aparelho: {usos}/{c.max}</span>
              {vencido && <Selo>VENCIDO</Selo>}{c.ativo === false && <Selo>DESATIVADO</Selo>}
              <span className="botoes">
                <button type="button" className="btn pequeno" onClick={() => copiar(c.codigo)}>{copiado === c.codigo ? 'Copiado' : 'Copiar'}</button>
                <button type="button" className="btn pequeno" onClick={() => salvarItem('cupons', { ...c, ativo: c.ativo === false })}>{c.ativo === false ? 'Reativar' : 'Desativar'}</button>
                <button type="button" className="btn pequeno" onClick={() => removerItem('cupons', c.id)}>Excluir</button>
              </span>
            </div>
          )
        })}
      </div>
      <h3>Assinaturas registradas neste aparelho ({(assinaturas || []).length})</h3>
      {(assinaturas || []).length === 0 && <p className="mudo">Nenhuma assinatura ainda.</p>}
      <div className="lista">
        {[...(assinaturas || [])].reverse().map((a) => <p key={a.id} className="cartao item-linha">{a.data} · {a.nome} · {a.plano} ({a.periodo}) · {a.valor || 'valor a definir'}{a.cupom ? ' · cupom ' + a.cupom + ' (' + a.pct + '%)' : ''}</p>)}
      </div>
    </section>
  )
}

// Botão "Assinar" no cartão de cada plano pago.
function AssinarCartao({ p, aoLiberar }) {
  const [aberto, setAberto] = useState(false)
  return aberto
    ? <AssinarPlano plano={p} aoFechar={() => setAberto(false)} aoLiberar={aoLiberar} />
    : <button type="button" className="btn ouro" onClick={() => setAberto(true)}>Assinar o plano {p.titulo}</button>
}

/* ───────────── RETORNO DO PAGAMENTO (Mercado Pago) ───────────── */
const NOME_STATUS_PG = { agendada: 'parcela a gerar', pendente: 'aguardando pagamento', aprovado: 'pago', gratis: 'liberado com cupom', recusado: 'recusado', cancelado: 'cancelado' }
const reaisCent = (c) => reais((Number(c) || 0) / 100)

/* ───────────── VENDA AVULSA DE CURSOS (etapa 4B-1) ───────────── */
const ORDEM_PLANO = { anjo: 0, querubim: 1, serafim: 2 }
// Plano que dá acesso ao curso. Se o admin não escolheu, o curso fica no Serafim (o mais fechado).
const planoDoCurso = (c) => { const p = String((c && c.plano) || '').toLowerCase(); return ORDEM_PLANO[p] !== undefined ? p : 'serafim' }
const cursoAvulso = (c) => String((c && c.avulso) || '').toLowerCase() === 'sim'
const cursoNoPlano = (c, sessao) => !!sessao && (!!sessao.admin || (ORDEM_PLANO[sessao.plano] || 0) >= ORDEM_PLANO[planoDoCurso(c)])
const NOME_PLANO_CURSO = { anjo: 'Anjo', querubim: 'Querubim', serafim: 'Serafim' }

// Cursos que a pessoa comprou. Vazio se não estiver logada.
function useCursosComprados() {
  const { sessao } = useLoja()
  const [ids, setIds] = useState([])
  const [pronto, setPronto] = useState(!SERVIDOR || !sessao)
  const [rodada, setRodada] = useState(0)
  const uid = sessao ? sessao.uid || sessao.email || 'x' : ''
  useEffect(() => {
    if (!SERVIDOR || !sessao) { setIds([]); setPronto(true); return undefined }
    let vivo = true
    SB.meusCursos().then((l) => { if (vivo) { setIds(l.map((x) => x.curso_id)); setPronto(true) } }).catch(() => { if (vivo) { setIds([]); setPronto(true) } })
    return () => { vivo = false }
  }, [uid, rodada])
  return { ids, pronto, recarregar: () => setRodada((x) => x + 1) }
}

// Perfil: os cursos comprados avulso.
function MeusCursos() {
  const { db } = useLoja()
  const { ids } = useCursosComprados()
  return (
    <div className="cartao">
      <h3>Meus cursos comprados</h3>
      {ids.length === 0
        ? <p className="mudo">Você ainda não comprou nenhum curso avulso. <Link to="/livros">Ver os cursos avulsos em Livros Avivar</Link></p>
        : ids.map((id) => { const c = (db.cursos || []).find((x) => x.id === id); return <p key={id}>{c ? <Link to={'/cursos/' + id}>{c.titulo}</Link> : 'Curso retirado do catálogo'} · liberado para sempre</p> })}
    </div>
  )
}

function ComprarCurso({ c, preco, aoFechar, aoLiberar }) {
  const { sessao } = useLoja()
  const nav = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [cupom, setCupom] = useState(null)
  const [msg, setMsg] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [feito, setFeito] = useState(false)
  const pct = cupom ? cupom.pct : 0
  const final = preco === null ? null : Math.round(preco * (100 - pct)) / 100
  const aplicar = async () => {
    if (!sessao) { setCupom(null); setMsg('Entre na sua conta para aplicar o cupom.'); return }
    if (!codigo.trim()) { setCupom(null); setMsg('Digite o código do cupom.'); return }
    setCarregando(true)
    try {
      const r = await SB.cupomValidar(codigo, 'curso')
      if (r && r.ok && r.pct) { setCupom({ codigo: r.codigo, pct: r.pct }); setMsg('') } else { setCupom(null); setMsg((r && r.motivo) || 'Cupom inválido.') }
    } catch (e) { setCupom(null); setMsg(e.message) } finally { setCarregando(false) }
  }
  const confirmar = async () => {
    if (!sessao) { nav('/entrar', { state: { de: '/livros' } }); return }
    setCarregando(true); setMsg('')
    try {
      const r = await SB.criarPagamentoCurso({ curso: c.id, cupom: cupom ? cupom.codigo : '' })
      if (r.gratis) { setFeito(true); setCarregando(false); if (aoLiberar) aoLiberar(); return }
      window.location.href = r.url
    } catch (e) { setMsg(e.message); setCarregando(false) }
  }
  if (feito) {
    return (
      <div className="assinar" role="status">
        <p><b>Curso liberado.</b> O cupom cobriu todo o valor. Que o Senhor abençoe os seus estudos.</p>
        <Link className="btn ouro" to={'/cursos/' + c.id}>Abrir o curso</Link>
      </div>
    )
  }
  return (
    <div className="assinar">
      <label className="assinar-cupom">Tem um cupom de desconto?
        <span className="assinar-linha">
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="AVQB-XXXX-XXXX" autoCapitalize="characters" />
          <button type="button" className="btn" disabled={carregando} onClick={aplicar}>Aplicar</button>
        </span>
      </label>
      {msg && <p className="assinar-erro" role="alert">{msg}</p>}
      {cupom && <p className="assinar-ok" role="status">Cupom aplicado: <b>{cupom.pct}% de desconto</b>.</p>}
      <p className="assinar-total">{pct > 0 && <s>{reais(preco)}</s>} <b>{final === 0 ? 'Gratuito' : reais(final)}</b></p>
      <p className="mudo assinar-nota">Você será levado ao Mercado Pago para pagar com Pix, cartão ou boleto. O curso é liberado sozinho quando o pagamento for confirmado e fica com você para sempre. Esta compra não dá acesso ao plano, só a este curso.</p>
      <div className="botoes">
        <button type="button" className="btn ouro" disabled={carregando} onClick={confirmar}>{!sessao ? 'Entrar para comprar' : carregando ? 'Um instante…' : final === 0 ? 'Liberar o curso grátis' : 'Ir para o pagamento'}</button>
        <button type="button" className="btn" onClick={aoFechar}>Cancelar</button>
      </div>
    </div>
  )
}

function CartaoCursoAvulso({ c, comprados, aoLiberar }) {
  const { sessao, db } = useLoja()
  const [aberto, setAberto] = useState(false)
  const preco = valorNum(c.precoAvulso)
  const tem = comprados.includes(c.id)
  const noPlano = cursoNoPlano(c, sessao)
  const aulas = (db.aulas || []).filter((a) => a.cursoId === c.id).length
  return (
    <article className="cartao curso-avulso">
      <div className="curso-avulso-chips"><Selo tipo="ouro">{c.categoria || 'Curso'}</Selo>{c.area === 'Sala Quântica' && <Selo>SALA QUÂNTICA</Selo>}</div>
      <h3>{c.titulo}</h3>
      <p>{c.descricao || 'Descrição em breve.'}</p>
      <span className="mudo">{aulas} {aulas === 1 ? 'aula' : 'aulas'}{c.cargaHoraria ? ' · ' + c.cargaHoraria + ' h' : ''}</span>
      {tem ? (
        <div className="curso-avulso-acao"><p className="assinar-ok" role="status">Você já tem este curso.</p><Link className="btn ouro" to={'/cursos/' + c.id}>Abrir o curso</Link></div>
      ) : noPlano ? (
        <div className="curso-avulso-acao"><p className="mudo">Já incluído no seu plano.</p><Link className="btn ouro" to={'/cursos/' + c.id}>Abrir o curso</Link></div>
      ) : aberto ? (
        <ComprarCurso c={c} preco={preco} aoFechar={() => setAberto(false)} aoLiberar={aoLiberar} />
      ) : (
        <div className="curso-avulso-acao">
          <p className="curso-preco"><b>{preco === null ? 'Valor em breve' : reais(preco)}</b> <span className="mudo">· pagamento único · acesso para sempre</span></p>
          <button type="button" className="btn ouro" disabled={preco === null} onClick={() => setAberto(true)}>Comprar este curso</button>
        </div>
      )}
    </article>
  )
}

function PagamentoRetorno() {
  const [sp] = useSearchParams()
  const id = sp.get('pg') || ''
  const { definirSessao, atualizarEdicoes } = useLoja()
  const [pg, setPg] = useState(null)
  const [pronto, setPronto] = useState(false)
  const [rodada, setRodada] = useState(0)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!SERVIDOR || !id) { setPronto(true); return undefined }
    let vivo = true, t = 0, n = 0
    const ver = async () => {
      try {
        const p = await SB.pagamento(id)
        if (!vivo) return
        setPg(p); setPronto(true); setMsg('')
        if (p && (p.status === 'aprovado' || p.status === 'gratis')) {
          const perf = await SB.perfil()
          if (perf && vivo) definirSessao(sessaoDe(perf))
          if (vivo) atualizarEdicoes() // traz as aulas do curso recém-liberado
          return
        }
        if (!p || p.status === 'recusado' || p.status === 'cancelado' || p.status === 'agendada') return
        if (++n < 20) t = setTimeout(ver, 3000) // a confirmação do Mercado Pago pode levar alguns segundos
      } catch (e) { if (vivo) { setPronto(true); setMsg(e.message) } }
    }
    ver()
    return () => { vivo = false; clearTimeout(t) }
  }, [id, rodada])
  const ehCurso = !!pg && pg.origem === 'curso'
  const ehLivro = !!pg && pg.origem === 'livro'
  const livroFisico = ehLivro && pg.livro_formato === 'fisico'
  const nome = pg ? (ehCurso ? '“' + (pg.curso_titulo || 'curso') + '”' : ehLivro ? '“' + (pg.livro_titulo || 'livro') + '”' : pg.plano === 'serafim' ? 'Serafim' : 'Querubim') : ''
  const alvo = ehCurso ? 'curso ' + nome : ehLivro ? (livroFisico ? 'livro físico ' : 'PDF do livro ') + nome : 'plano ' + nome
  const voltar = ehCurso || ehLivro ? '/livros' : '/planos'
  return (
    <Shell titulo="Pagamento">
      <div className="cartao assinar-retorno" role="status">
        {!pronto && <p>Conferindo o seu pagamento…</p>}
        {pronto && msg && <><p className="assinar-erro" role="alert">{msg}</p><button type="button" className="btn" onClick={() => setRodada((x) => x + 1)}>Tentar de novo</button></>}
        {pronto && !msg && !pg && <><p>Não encontrei este pagamento na sua conta.</p><Link className="btn" to="/planos">Ver os planos</Link></>}
        {pg && (pg.status === 'aprovado' || pg.status === 'gratis') && (
          <>
            <h2>Pagamento confirmado</h2>
            {ehLivro
              ? (livroFisico
                ? <><p>O pedido do livro físico <b>{nome}</b> foi confirmado. O Ministério recebeu o seu endereço de entrega e vai combinar o envio com você. Que o Senhor abençoe a sua leitura.</p><div className="botoes"><Link className="btn ouro" to="/livros">Voltar aos Livros Avivar</Link></div></>
                : <><p>O PDF do livro <b>{nome}</b> está liberado na sua conta, para ler e baixar. Que o Senhor abençoe a sua leitura.</p><div className="botoes"><Link className="btn ouro" to={'/livros/' + pg.livro_id}>Abrir o livro</Link><Link className="btn" to="/livros">Todos os livros</Link></div></>)
              : ehCurso
              ? <><p>O curso <b>{nome}</b> está liberado para você, para sempre. Que o Senhor abençoe os seus estudos.</p><div className="botoes"><Link className="btn ouro" to={'/cursos/' + pg.curso_id}>Abrir o curso</Link><Link className="btn" to="/inicio">Ir para o Início</Link></div></>
              : <><p>O plano <b>{nome}</b> está liberado{pg.plano_ate ? ' até ' + dataBR(pg.plano_ate) : ''}. Que o Senhor abençoe os seus estudos.</p><Link className="btn ouro" to="/inicio">Ir para o Início</Link></>}
          </>
        )}
        {pg && pg.status === 'pendente' && (
          <>
            <h2>Aguardando a confirmação</h2>
            <p>O Mercado Pago ainda não confirmou o pagamento do {alvo} ({reaisCent(pg.valor_centavos)}). O Pix costuma confirmar em segundos; o boleto pode levar até 3 dias úteis.</p>
            <p className="mudo">Você não precisa ficar nesta página: {ehCurso ? 'o curso é liberado' : ehLivro ? (livroFisico ? 'o pedido é confirmado' : 'o PDF é liberado') : 'o plano é liberado'} sozinho assim que o pagamento for confirmado.</p>
            <div className="botoes"><button type="button" className="btn" onClick={() => setRodada((x) => x + 1)}>Verificar de novo</button><Link className="btn" to="/inicio">Ir para o Início</Link></div>
          </>
        )}
        {pg && pg.status === 'agendada' && (
          <>
            <h2>Boleto não pago</h2>
            <p>O boleto desta parcela do plano {nome} não foi pago ou venceu. Nada foi cobrado de você. Você pode gerar outro boleto em Perfil, em "Meu financiamento".</p>
            <Link className="btn ouro" to="/perfil">Ir para o Perfil</Link>
          </>
        )}
        {pg && (pg.status === 'recusado' || pg.status === 'cancelado') && (
          <>
            <h2>Pagamento não concluído</h2>
            <p>O pagamento do {alvo} {pg.status === 'recusado' ? 'não foi aprovado' : 'foi cancelado'}. Nada foi cobrado de você por este pedido. Você pode tentar de novo, com outra forma de pagamento.</p>
            <Link className="btn ouro" to={voltar}>{ehCurso || ehLivro ? 'Voltar aos Livros Avivar' : 'Voltar aos planos'}</Link>
          </>
        )}
      </div>
    </Shell>
  )
}

// Retorno do Mercado Pago depois de autorizar a renovação automática.
function AssinaturaRetorno({ id }) {
  const { definirSessao } = useLoja()
  const [ass, setAss] = useState(null)
  const [perf, setPerf] = useState(null)
  const [pronto, setPronto] = useState(false)
  const [rodada, setRodada] = useState(0)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!SERVIDOR || !id) { setPronto(true); return undefined }
    let vivo = true, t = 0, n = 0
    const ver = async () => {
      try {
        const [a, pf] = await Promise.all([SB.assinatura(id), SB.perfil()])
        if (!vivo) return
        setAss(a); setPerf(pf); setPronto(true); setMsg('')
        const liberado = a && pf && sessaoDe(pf).plano === a.plano && pf.plano_ate
        if (liberado) { definirSessao(sessaoDe(pf)); return }
        if (!a || a.status === 'cancelada') return
        if (++n < 20) t = setTimeout(ver, 3000)
      } catch (e) { if (vivo) { setPronto(true); setMsg(e.message) } }
    }
    ver()
    return () => { vivo = false; clearTimeout(t) }
  }, [id, rodada])
  const nome = ass ? (ass.plano === 'serafim' ? 'Serafim' : 'Querubim') : ''
  const liberado = !!(ass && perf && sessaoDe(perf).plano === ass.plano && perf.plano_ate)
  const cada = ass ? (ass.ciclo === 'mensal' ? 'por mês' : ass.ciclo === 'semestral' ? 'a cada 6 meses' : 'a cada 12 meses') : ''
  return (
    <Shell titulo="Assinatura">
      <div className="cartao assinar-retorno" role="status">
        {!pronto && <p>Conferindo a sua assinatura…</p>}
        {pronto && msg && <><p className="assinar-erro" role="alert">{msg}</p><button type="button" className="btn" onClick={() => setRodada((x) => x + 1)}>Tentar de novo</button></>}
        {pronto && !msg && !ass && <><p>Não encontrei esta assinatura na sua conta.</p><Link className="btn" to="/planos">Ver os planos</Link></>}
        {ass && liberado && (
          <>
            <h2>Assinatura ativa</h2>
            <p>O plano <b>{nome}</b> está liberado até {dataBR(perf.plano_ate)}. A renovação automática cobra {reaisCent(ass.valor_centavos)} {cada} no seu cartão. Que o Senhor abençoe os seus estudos.</p>
            <p className="mudo">Para cancelar a renovação, entre em Perfil e toque em "Cancelar renovação automática".</p>
            <Link className="btn ouro" to="/inicio">Ir para o Início</Link>
          </>
        )}
        {ass && !liberado && ass.status !== 'cancelada' && (
          <>
            <h2>{ass.status === 'pendente' ? 'Aguardando a autorização' : 'Aguardando a primeira cobrança'}</h2>
            <p>{ass.status === 'pendente'
              ? 'O Mercado Pago ainda não avisou que você autorizou a assinatura do plano ' + nome + '. Se você já concluiu lá, aguarde um instante.'
              : 'Você autorizou a assinatura do plano ' + nome + '. A primeira cobrança no cartão pode levar de alguns minutos até cerca de 1 hora para ser confirmada.'}</p>
            <p className="mudo">Você não precisa ficar nesta página: o plano é liberado sozinho assim que a cobrança for confirmada.</p>
            <div className="botoes"><button type="button" className="btn" onClick={() => setRodada((x) => x + 1)}>Verificar de novo</button><Link className="btn" to="/inicio">Ir para o Início</Link></div>
          </>
        )}
        {ass && !liberado && ass.status === 'cancelada' && (
          <>
            <h2>Assinatura não concluída</h2>
            <p>Esta assinatura do plano {nome} não foi concluída ou foi cancelada. Nada foi cobrado de você por ela. Você pode tentar de novo.</p>
            <Link className="btn ouro" to="/planos">Voltar aos planos</Link>
          </>
        )}
      </div>
    </Shell>
  )
}

function RetornoPagamento() {
  const [sp] = useSearchParams()
  return sp.get('as') ? <AssinaturaRetorno id={sp.get('as')} /> : <PagamentoRetorno />
}

/* ───────────── FINANCIAMENTO (Outros Financiamento), CONTRATO E ASSINATURA ───────────── */
const hojeISO = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10)
const NOME_STATUS_FIN = { ativo: 'em andamento', quitado: 'quitado', cancelado: 'cancelado' }
const NOME_STATUS_PARCELA = { agendada: 'a pagar', pendente: 'boleto gerado', aprovado: 'paga', cancelado: 'cancelada', recusado: 'recusada' }

// Reduz a foto do documento antes de enviar (fica leve e nítida). PDF vai como está.
async function prepararDocumento(arquivo) {
  if (arquivo.type === 'application/pdf') {
    if (arquivo.size > 5 * 1024 * 1024) throw new Error('O PDF é grande demais (máximo 5 MB).')
    return arquivo
  }
  if (!/^image\/(jpeg|png|webp)$/.test(arquivo.type)) throw new Error('Envie uma foto (JPG ou PNG) ou um PDF.')
  let bmp
  try { bmp = await createImageBitmap(arquivo) } catch (e) { throw new Error('Não consegui abrir esta imagem. Tente outra foto.') }
  const maxLado = 1800
  const esc = Math.min(1, maxLado / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * esc)); c.height = Math.max(1, Math.round(bmp.height * esc))
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85))
  if (!blob) throw new Error('Não consegui preparar esta imagem. Tente outra foto.')
  if (blob.size > 5 * 1024 * 1024) throw new Error('A imagem é grande demais (máximo 5 MB).')
  return blob
}

// Quadro para desenhar a assinatura com o dedo ou o mouse.
function AssinaturaPad({ valor, onChange, rotulo }) {
  const ref = useRef(null)
  const desenhando = useRef(false)
  const ultimo = useRef(null)
  const [vazio, setVazio] = useState(!valor)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#10213f'; ctx.fillStyle = '#10213f'
    if (valor) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height); img.src = valor }
  }, [])
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) * ref.current.width) / r.width, y: ((e.clientY - r.top) * ref.current.height) / r.height } }
  const ini = (e) => {
    e.preventDefault()
    try { ref.current.setPointerCapture(e.pointerId) } catch (er) { /* sem captura */ }
    desenhando.current = true; ultimo.current = pos(e)
    const ctx = ref.current.getContext('2d'); ctx.beginPath(); ctx.arc(ultimo.current.x, ultimo.current.y, 1.4, 0, 7); ctx.fill()
  }
  const mov = (e) => {
    if (!desenhando.current) return
    e.preventDefault()
    const p = pos(e), ctx = ref.current.getContext('2d')
    ctx.beginPath(); ctx.moveTo(ultimo.current.x, ultimo.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ultimo.current = p
  }
  const fim = () => { if (!desenhando.current) return; desenhando.current = false; setVazio(false); onChange(ref.current.toDataURL('image/png')) }
  const limpar = () => { const c = ref.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setVazio(true); onChange('') }
  return (
    <div className="pad-assinatura">
      <canvas ref={ref} width="600" height="200" aria-label={rotulo || 'Quadro para desenhar a assinatura'} onPointerDown={ini} onPointerMove={mov} onPointerUp={fim} onPointerCancel={fim} onPointerLeave={fim} />
      <div className="pad-linha"><span className="mudo">{vazio ? 'Desenhe a assinatura no quadro com o dedo ou o mouse.' : 'Assinatura registrada neste quadro.'}</span><button type="button" className="btn pequeno" onClick={limpar}>Limpar</button></div>
    </div>
  )
}

const DADOS_VAZIOS = { modo: 'proprio', nome: '', estado_civil: '', nascimento: '', naturalidade: '', cpf: '', whatsapp: '', email: '', end: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' }, benef: { nome: '', nascimento: '' } }

function Financiamento() {
  const { plano: idPlano } = useParams()
  const { db, sessao } = useLoja()
  const nav = useNavigate()
  const plano = db.planos.find((p) => p.id === idPlano && p.id !== 'anjo')
  const [passo, setPasso] = useState(1)
  const [periodo, setPeriodo] = useState('semestral')
  const [nParc, setNParc] = useState(0)
  const [opcoes, setOpcoes] = useState(null)
  const [modelo, setModelo] = useState(null)
  const [dados, setDados] = useState(() => ({ ...DADOS_VAZIOS, nome: sessao ? sessao.nome || '' : '', email: sessao ? sessao.email || '' : '', whatsapp: sessao ? zapBonito(sessao.whatsapp || '') : '' }))
  const [docs, setDocs] = useState([])
  const [enviandoDoc, setEnviandoDoc] = useState(false)
  const [assinatura, setAssinatura] = useState('')
  const [aceite, setAceite] = useState(false)
  const [erros, setErros] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  const precoTxt = plano ? (periodo === 'semestral' ? plano.precoSemestral : plano.precoAnual) : ''
  const baseCent = Math.round((valorNum(precoTxt) || 0) * 100)
  useEffect(() => {
    setOpcoes(null); setNParc(0)
    if (!SERVIDOR || !plano) return
    SB.financiamentoOpcoes(baseCent).then(setOpcoes).catch(() => setOpcoes({ disponivel: false, opcoes: [] }))
  }, [baseCent])
  useEffect(() => { if (SERVIDOR && passo === 4 && !modelo) SB.contratoModelo().then(setModelo).catch((e) => setErros([e.message])) }, [passo])
  if (!plano || !SERVIDOR) return <Navigate to="/planos" replace />
  const opc = opcoes && opcoes.opcoes ? opcoes.opcoes.find((o) => o.n === nParc) : null
  const mudar = (k, v) => setDados((d) => ({ ...d, [k]: v }))
  const mudarEnd = (k, v) => setDados((d) => ({ ...d, end: { ...d.end, [k]: v } }))
  const mudarBenef = (k, v) => setDados((d) => ({ ...d, benef: { ...d.benef, [k]: v } }))
  const dadosLimpos = () => ({ ...dados, cpf: dados.cpf.replace(/\D/g, ''), whatsapp: dados.whatsapp.replace(/\D/g, ''), end: { ...dados.end, cep: dados.end.cep.replace(/\D/g, '') }, ...(dados.modo === 'responsavel' ? {} : { benef: undefined }) })
  const irDados = () => { setErros([]); setPasso(2) }
  const irDoc = () => { const e = validarDados(dadosLimpos(), hojeISO()); if (e.length) { setErros(e); return } setErros([]); setPasso(3) }
  const enviarDocs = async (lista) => {
    setErros([]); setEnviandoDoc(true)
    try {
      for (const a of Array.from(lista)) {
        if (docs.length >= 2) { setErros(['Envie no máximo 2 arquivos (frente e verso).']); break }
        const pronto = await prepararDocumento(a)
        const caminho = await SB.documentoEnviar(pronto.type ? pronto : new File([pronto], a.name, { type: 'image/jpeg' }))
        setDocs((l) => [...l, { caminho, nome: a.name }])
      }
    } catch (e) { setErros([e.message]) } finally { setEnviandoDoc(false) }
  }
  const irContrato = () => { if (!docs.length) { setErros(['Envie uma foto do documento de identificação para continuar.']); return } setErros([]); setPasso(4) }
  const hoje = hojeISO()
  const texto = modelo && modelo.pronto && opc
    ? montarContrato({ texto: modelo.texto, contratado: modelo.contratado }, { dados: dadosLimpos(), plano_nome: plano.titulo, meses: periodo === 'anual' ? 12 : 6, base_centavos: baseCent, parcelas: opc.n, parcela_centavos: opc.parcela_centavos, total_centavos: opc.total_centavos, primeiro_vencimento: somarDias(hoje, 3), data: hoje })
    : ''
  const assinar = async () => {
    if (!assinatura) { setErros(['Desenhe a sua assinatura no quadro.']); return }
    if (!aceite) { setErros(['Marque que leu o contrato e concorda.']); return }
    setErros([]); setEnviando(true)
    try {
      const r = await SB.criarFinanciamento({ plano: plano.id, periodo, parcelas: opc.n, aceite: true, dados: dadosLimpos(), assinatura, documentos: docs.map((d) => d.caminho) })
      if (r.url) { window.location.href = r.url; return }
      setAviso(r.aviso || 'Contrato assinado. Gere o boleto da 1ª parcela em Perfil.')
    } catch (e) { setErros([e.message]) } finally { setEnviando(false) }
  }
  const nomes = ['Condições', 'Seus dados', 'Documento', 'Contrato']
  const caixaErros = erros.length > 0 && <div className="assinar-erro" role="alert">{erros.map((e, i) => <p key={i}>{e}</p>)}</div>
  if (aviso) return (
    <Shell titulo="Financiamento">
      <div className="cartao assinar-retorno" role="status"><h2>Contrato assinado</h2><p>{aviso}</p><Link className="btn ouro" to="/perfil">Ir para o Perfil</Link></div>
    </Shell>
  )
  return (
    <Shell titulo={'Financiamento · Plano ' + plano.titulo}>
      <ol className="fin-passos" aria-label="Etapas">{nomes.map((n, i) => <li key={n} className={passo === i + 1 ? 'atual' : passo > i + 1 ? 'feito' : ''}><span>{i + 1}</span> {n}</li>)}</ol>
      {opcoes && !opcoes.disponivel && <div className="cartao"><p>Esta opção não está disponível agora. Fale com o ministério ou escolha outra forma de pagamento.</p><Link className="btn" to="/planos">Voltar aos planos</Link></div>}
      {passo === 1 && (!opcoes || opcoes.disponivel) && (
        <div className="cartao fin-bloco">
          <h2>Escolha como pagar</h2>
          <div className="botoes" role="group" aria-label="Período do plano">
            <button type="button" className={'btn' + (periodo === 'semestral' ? ' ouro' : '')} aria-pressed={periodo === 'semestral'} onClick={() => setPeriodo('semestral')}>Semestral · {plano.precoSemestral || 'em breve'}</button>
            <button type="button" className={'btn' + (periodo === 'anual' ? ' ouro' : '')} aria-pressed={periodo === 'anual'} onClick={() => setPeriodo('anual')}>Anual · {plano.precoAnual || 'em breve'}</button>
          </div>
          {!baseCent && <p className="mudo">O valor deste período ainda não foi definido pelo ministério.</p>}
          {opcoes && opcoes.opcoes && opcoes.opcoes.length > 0 && (
            <div className="fin-opcoes" role="radiogroup" aria-label="Número de parcelas">
              {opcoes.opcoes.map((o) => (
                <label key={o.n} className={'fin-opcao' + (nParc === o.n ? ' marcada' : '')}>
                  <input type="radio" name="parcelas" checked={nParc === o.n} onChange={() => setNParc(o.n)} />
                  <span><b>{o.n} × {reaisC(o.parcela_centavos)}</b><br /><span className="mudo">total {reaisC(o.total_centavos)}</span></span>
                </label>
              ))}
            </div>
          )}
          <p className="mudo">Pagamento à vista do mesmo período: <b>{precoTxt || '—'}</b> (Pix, cartão ou boleto). No financiamento, as parcelas são pagas por boleto bancário, um por mês. O boleto de cada parcela é gerado por você em Perfil, perto do vencimento. O acesso ao plano é liberado mês a mês, conforme cada parcela é paga.</p>
          <div className="botoes"><button type="button" className="btn ouro" disabled={!opc} onClick={irDados}>Continuar</button><Link className="btn" to="/planos">Voltar aos planos</Link></div>
        </div>
      )}
      {passo === 2 && (
        <div className="cartao fin-bloco">
          <h2>Seus dados para o contrato</h2>
          <div className="botoes" role="radiogroup" aria-label="Quem assina o contrato">
            <label className="fin-opcao"><input type="radio" name="modo" checked={dados.modo === 'proprio'} onChange={() => mudar('modo', 'proprio')} /><span>O contrato é para mim (tenho 18 anos ou mais)</span></label>
            <label className="fin-opcao"><input type="radio" name="modo" checked={dados.modo === 'responsavel'} onChange={() => mudar('modo', 'responsavel')} /><span>O aluno é menor de 18 anos: assina um responsável</span></label>
          </div>
          {dados.modo === 'responsavel' && (
            <div className="fin-grade">
              <p className="fin-titulo">Aluno menor de idade</p>
              <label>Nome completo do aluno<input value={dados.benef.nome} onChange={(e) => mudarBenef('nome', e.target.value)} autoComplete="off" /></label>
              <label>Data de nascimento do aluno<input type="date" value={dados.benef.nascimento} onChange={(e) => mudarBenef('nascimento', e.target.value)} /></label>
            </div>
          )}
          <p className="fin-titulo">{dados.modo === 'responsavel' ? 'Responsável que assina o contrato' : 'Contratante'}</p>
          <div className="fin-grade">
            <label>Nome completo<input value={dados.nome} onChange={(e) => mudar('nome', e.target.value)} autoComplete="name" /></label>
            <label>Estado civil<select value={dados.estado_civil} onChange={(e) => mudar('estado_civil', e.target.value)}><option value="">Escolha…</option>{ESTADOS_CIVIS.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label>Data de nascimento<input type="date" value={dados.nascimento} onChange={(e) => mudar('nascimento', e.target.value)} /></label>
            <label>Local de nascimento (cidade/UF)<input value={dados.naturalidade} onChange={(e) => mudar('naturalidade', e.target.value)} placeholder="Ex.: Natal/RN" /></label>
            <label>CPF<input value={dados.cpf} onChange={(e) => mudar('cpf', e.target.value)} inputMode="numeric" placeholder="000.000.000-00" autoComplete="off" /></label>
            <label>WhatsApp (com DDD)<input value={dados.whatsapp} onChange={(e) => mudar('whatsapp', e.target.value)} inputMode="tel" autoComplete="tel" /></label>
            <label>E-mail<input type="email" value={dados.email} onChange={(e) => mudar('email', e.target.value)} autoComplete="email" /></label>
          </div>
          <p className="fin-titulo">Endereço completo</p>
          <div className="fin-grade">
            <label>CEP<input value={dados.end.cep} onChange={(e) => mudarEnd('cep', e.target.value)} inputMode="numeric" placeholder="00000-000" autoComplete="postal-code" /></label>
            <label>Rua ou avenida<input value={dados.end.logradouro} onChange={(e) => mudarEnd('logradouro', e.target.value)} autoComplete="address-line1" /></label>
            <label>Número<input value={dados.end.numero} onChange={(e) => mudarEnd('numero', e.target.value)} /></label>
            <label>Complemento (opcional)<input value={dados.end.complemento} onChange={(e) => mudarEnd('complemento', e.target.value)} /></label>
            <label>Bairro<input value={dados.end.bairro} onChange={(e) => mudarEnd('bairro', e.target.value)} /></label>
            <label>Cidade<input value={dados.end.cidade} onChange={(e) => mudarEnd('cidade', e.target.value)} autoComplete="address-level2" /></label>
            <label>Estado (UF)<select value={dados.end.uf} onChange={(e) => mudarEnd('uf', e.target.value)}><option value="">Escolha…</option>{UFS.map((x) => <option key={x}>{x}</option>)}</select></label>
          </div>
          {caixaErros}
          <div className="botoes"><button type="button" className="btn ouro" onClick={irDoc}>Continuar</button><button type="button" className="btn" onClick={() => { setErros([]); setPasso(1) }}>Voltar</button></div>
        </div>
      )}
      {passo === 3 && (
        <div className="cartao fin-bloco">
          <h2>Documento de identificação</h2>
          <p>Envie uma foto nítida do seu RG, CNH ou passaporte{dados.modo === 'responsavel' ? ' (do responsável que assina)' : ''}. Pode enviar frente e verso (até 2 arquivos, JPG, PNG ou PDF).</p>
          <p className="mudo">O documento vai para um cofre privado: só o ministério consegue abrir. Ele serve para identificar quem assina o contrato e evitar fraudes, nos termos da Lei Geral de Proteção de Dados.</p>
          <label className="fin-arquivo">Escolher arquivo
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple disabled={enviandoDoc || docs.length >= 2} onChange={(e) => { enviarDocs(e.target.files); e.target.value = '' }} />
          </label>
          {enviandoDoc && <p role="status">Enviando…</p>}
          {docs.length > 0 && <ul className="fin-docs">{docs.map((d, i) => <li key={d.caminho}>✓ {d.nome} <button type="button" className="btn pequeno" onClick={() => setDocs((l) => l.filter((_, j) => j !== i))}>Remover</button></li>)}</ul>}
          {caixaErros}
          <div className="botoes"><button type="button" className="btn ouro" disabled={enviandoDoc} onClick={irContrato}>Continuar</button><button type="button" className="btn" onClick={() => { setErros([]); setPasso(2) }}>Voltar</button></div>
        </div>
      )}
      {passo === 4 && (
        <div className="cartao fin-bloco">
          <h2>Leia e assine o contrato</h2>
          {!modelo && !erros.length && <p>Carregando o contrato…</p>}
          {modelo && !modelo.pronto && <p className="assinar-erro">O contrato ainda não está disponível. Fale com o ministério.</p>}
          {texto && (
            <>
              <div className="contrato-papel" tabIndex={0} aria-label="Texto do contrato">{texto}</div>
              <div className="contrato-assinaturas">
                <div>
                  <p className="fin-titulo">Contratante: {dados.nome}</p>
                  <AssinaturaPad valor={assinatura} onChange={setAssinatura} rotulo="Assinatura do contratante" />
                </div>
                <div>
                  <p className="fin-titulo">Contratado(a): Ministério Avivar do Espírito</p>
                  <div className="contrato-assinatura-fixa">{modelo.assinatura_png && <img src={modelo.assinatura_png} alt="Assinatura digital do contratado" />}</div>
                  <p className="mudo">{modelo.contratado.nome}</p>
                </div>
              </div>
              <label className="fin-aceite"><input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} /> <span>Li o contrato, confirmo que os dados estão corretos e concordo com todas as cláusulas. {dados.modo === 'responsavel' ? 'Declaro que sou o responsável legal do aluno menor de idade e tenho 18 anos ou mais.' : 'Declaro que tenho 18 anos ou mais.'}</span></label>
              <p className="mudo">A data do contrato será a do momento em que você assinar. Ao assinar, o sistema registra a data, a hora e o endereço de acesso, e você recebe uma cópia em Perfil.</p>
            </>
          )}
          {caixaErros}
          <div className="botoes"><button type="button" className="btn ouro" disabled={enviando || !texto} onClick={assinar}>{enviando ? 'Assinando…' : 'Assinar e gerar o boleto da 1ª parcela'}</button><button type="button" className="btn" disabled={enviando} onClick={() => { setErros([]); setPasso(3) }}>Voltar</button></div>
        </div>
      )}
    </Shell>
  )
}

// O contrato assinado (para ler, imprimir ou salvar em PDF).
function ContratoPagina() {
  const { id } = useParams()
  const [f, setF] = useState(undefined)
  const [msg, setMsg] = useState('')
  useEffect(() => { if (SERVIDOR) SB.financiamento(id).then(setF).catch((e) => { setMsg(e.message); setF(null) }) }, [id])
  const quando = (iso) => { const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000); return dataBR(d.toISOString().slice(0, 10)) + ' às ' + d.toISOString().slice(11, 16) + ' (horário de Brasília)' }
  return (
    <Shell titulo="Contrato">
      {f === undefined && <p>Carregando…</p>}
      {f === null && <div className="cartao"><p>{msg || 'Não encontrei este contrato.'}</p><Link className="btn" to="/perfil">Voltar ao Perfil</Link></div>}
      {f && (
        <>
          <div className="botoes nao-imprimir"><button type="button" className="btn ouro" onClick={() => window.print()}>Imprimir ou salvar em PDF</button><Link className="btn" to="/perfil">Voltar</Link></div>
          <article className="contrato-doc">
            <div className="contrato-papel">{f.contrato_texto}</div>
            <div className="contrato-assinaturas">
              <div><div className="contrato-assinatura-fixa"><img src={f.assinatura_png} alt="Assinatura do contratante" /></div><p className="fin-titulo">Contratante: {f.dados && f.dados.nome}</p></div>
              <div><div className="contrato-assinatura-fixa">{f.assinatura_contratado_png && <img src={f.assinatura_contratado_png} alt="Assinatura digital do contratado" />}</div><p className="fin-titulo">Contratado(a): Ministério Avivar do Espírito</p></div>
            </div>
            <p className="contrato-registro">Assinado eletronicamente em {quando(f.assinado_em)}{f.assinado_ip ? ', a partir do endereço de acesso ' + f.assinado_ip : ''}. Código de verificação (SHA-256): {f.contrato_hash}.</p>
          </article>
        </>
      )}
    </Shell>
  )
}

// Perfil: parcelas do financiamento, com o botão de gerar o boleto de cada mês.
function MeuFinanciamento() {
  const [fins, setFins] = useState(null)
  const [msg, setMsg] = useState('')
  const [gerando, setGerando] = useState('')
  const carregar = () => SB.meusFinanciamentos().then(setFins).catch(() => setFins([]))
  useEffect(() => { carregar() }, [])
  if (!fins || fins.length === 0) return null
  const hoje = hojeISO()
  const gerar = async (p) => {
    setGerando(p.id); setMsg('')
    try { const r = await SB.gerarBoleto(p.id); window.location.href = r.url } catch (e) { setMsg(e.message); setGerando('') }
  }
  return (
    <div className="cartao">
      <h3>Meu financiamento</h3>
      {msg && <p className="assinar-erro" role="alert">{msg}</p>}
      {fins.map((f) => (
        <div key={f.id} className="fin-resumo">
          <p><b>Plano {f.plano === 'serafim' ? 'Serafim' : 'Querubim'}</b> ({f.periodo}) · {f.parcelas} × {reaisC(f.parcela_centavos)} · total {reaisC(f.total_centavos)} · <b>{NOME_STATUS_FIN[f.status] || f.status}</b> · <Link to={'/contrato/' + f.id}>Ver contrato</Link></p>
          <div className="fin-parcelas">
            {f.lista.map((p, i) => {
              const anteriorOk = f.lista.slice(0, i).every((x) => x.status === 'aprovado')
              const boletoVale = p.status === 'pendente' && p.mp_url && p.boleto_vence && p.boleto_vence >= somarDias(hoje, 1)
              const cedo = p.vencimento > somarDias(hoje, 25)
              let acao = null
              if (p.status === 'aprovado') acao = <span>paga ✓</span>
              else if (f.status !== 'ativo') acao = <span className="mudo">{NOME_STATUS_PARCELA[p.status] || p.status}</span>
              else if (boletoVale) acao = <><a className="btn pequeno ouro" href={p.mp_url} target="_blank" rel="noreferrer">Abrir boleto</a><span className="mudo"> vence {dataBR(p.boleto_vence)}</span></>
              else if (!anteriorOk) acao = <span className="mudo">libera quando a parcela anterior for paga</span>
              else if (cedo) acao = <span className="mudo">boleto disponível a partir de {dataBR(somarDias(p.vencimento, -25))}</span>
              else acao = <button type="button" className="btn pequeno ouro" disabled={gerando === p.id} onClick={() => gerar(p)}>{gerando === p.id ? 'Gerando…' : p.status === 'pendente' ? 'Gerar novo boleto' : 'Gerar boleto'}</button>
              return <p key={p.id}>{p.parcela_num}ª parcela · {reaisC(p.valor_centavos)} · vence {dataBR(p.vencimento)} · {acao}</p>
            })}
          </div>
        </div>
      ))}
      <p className="mudo">O acesso ao plano é liberado mês a mês: cada parcela paga libera até o vencimento da seguinte. O pagamento do boleto pode levar até 3 dias úteis para ser confirmado.</p>
    </div>
  )
}

// Admin > Contrato: quem presta o serviço, assinatura, texto do contrato e regras do parcelamento.
function ContratoAdmin() {
  const [m, setM] = useState(undefined)
  const [c, setC] = useState({ nome: '', nacionalidade: 'brasileiro', estado_civil: '', profissao: 'pastor', cpf: '', endereco: '', email: '', whatsapp: '' })
  const [ass, setAss] = useState('')
  const [texto, setTexto] = useState(MODELO_PADRAO)
  const [pct, setPct] = useState(0)
  const [passo, setPasso] = useState(5)
  const [max, setMax] = useState(6)
  const [msg, setMsg] = useState('')
  const [salvando, setSalvando] = useState(false)
  useEffect(() => {
    SB.modeloLer().then((x) => {
      setM(x || null)
      if (x) { setC((o) => ({ ...o, ...(x.contratado || {}) })); setAss(x.assinatura_png || ''); setTexto(x.texto && x.texto.trim() ? x.texto : MODELO_PADRAO); setPct(x.acrescimo_pct); setPasso(x.acrescimo_passo_pct == null ? 0 : x.acrescimo_passo_pct); setMax(x.max_parcelas) }
    }).catch((e) => { setM(null); setMsg(e.message) })
  }, [])
  const mud = (k, v) => setC((o) => ({ ...o, [k]: v }))
  const faltas = []
  if (!c.nome.trim()) faltas.push('nome')
  if (!cpfValido(c.cpf)) faltas.push('CPF válido')
  if (!c.endereco.trim()) faltas.push('endereço')
  if (!ass) faltas.push('assinatura')
  const desconhecidos = marcadoresDesconhecidos(texto)
  const salvar = async () => {
    if (faltas.length) { setMsg('Falta preencher: ' + faltas.join(', ') + '.'); return }
    setSalvando(true); setMsg('')
    try { await SB.modeloSalvar({ contratado: { ...c, cpf: c.cpf.replace(/\D/g, '') }, assinatura_png: ass, texto: texto.trim() === MODELO_PADRAO.trim() ? '' : texto, acrescimo_pct: Math.max(0, Math.min(100, Math.round(Number(pct)) || 0)), acrescimo_passo_pct: Math.max(0, Math.min(50, Math.round(Number(passo)) || 0)), max_parcelas: Math.max(2, Math.min(6, Number(max) || 6)) }); setMsg('Salvo. A opção "Outros Financiamento" já aparece para os alunos.') } catch (e) { setMsg('Não foi possível salvar: ' + e.message) } finally { setSalvando(false) }
  }
  const simulacao = opcoesParcelas(36000, Math.max(0, Math.min(100, Math.round(Number(pct)) || 0)), Math.max(0, Math.min(50, Math.round(Number(passo)) || 0)), Math.max(2, Math.min(6, Number(max) || 6)))
  const simSeis = simulacao[simulacao.length - 1]
  const previa = montarContrato({ texto, contratado: c }, { dados: { modo: 'proprio', nome: 'Maria da Silva (exemplo)', estado_civil: 'Solteiro(a)', nascimento: '1990-05-20', naturalidade: 'Natal/RN', cpf: '52998224725', whatsapp: '(84) 99999-1111', email: 'maria@exemplo.com', end: { cep: '59000000', logradouro: 'Rua das Flores', numero: '10', complemento: '', bairro: 'Centro', cidade: 'Natal', uf: 'RN' } }, plano_nome: 'Querubim', meses: 6, base_centavos: 36000, parcelas: simSeis.n, parcela_centavos: simSeis.parcela_centavos, total_centavos: simSeis.total_centavos, primeiro_vencimento: somarDias(hojeISO(), 3), data: hojeISO() })
  if (m === undefined) return <p>Carregando…</p>
  return (
    <section className="cupons">
      <Aviso forte>O texto do contrato é um MODELO (rascunho, a conferir). Peça a um advogado de sua confiança para revisá-lo antes de usar com os alunos. Este painel guarda os dados de quem presta o serviço, a sua assinatura digital, o texto e as regras do parcelamento.</Aviso>
      <div className="cartao form">
        <h3>Contratado(a): quem presta o serviço</h3>
        <p className="mudo">Estes dados aparecem no contrato que o aluno assina (nome, CPF e endereço). Use o endereço que você aceita tornar conhecido dos alunos.</p>
        <label>Nome completo<input value={c.nome} onChange={(e) => mud('nome', e.target.value)} /></label>
        <label>Nacionalidade<input value={c.nacionalidade} onChange={(e) => mud('nacionalidade', e.target.value)} /></label>
        <label>Estado civil<input value={c.estado_civil} onChange={(e) => mud('estado_civil', e.target.value)} placeholder="Ex.: casado" /></label>
        <label>Profissão<input value={c.profissao} onChange={(e) => mud('profissao', e.target.value)} /></label>
        <label>CPF<input value={c.cpf} onChange={(e) => mud('cpf', e.target.value)} inputMode="numeric" /></label>
        <label>Endereço completo (rua, número, bairro, cidade/UF, CEP)<input value={c.endereco} onChange={(e) => mud('endereco', e.target.value)} /></label>
        <label>E-mail<input value={c.email} onChange={(e) => mud('email', e.target.value)} /></label>
        <label>WhatsApp<input value={c.whatsapp} onChange={(e) => mud('whatsapp', e.target.value)} /></label>
      </div>
      <div className="cartao form">
        <h3>Assinatura digital do contratado</h3>
        <AssinaturaPad valor={ass} onChange={setAss} rotulo="Assinatura do contratado" />
      </div>
      <div className="cartao form">
        <h3>Regras do parcelamento</h3>
        <label>Acréscimo do parcelamento em 2x (%) <span className="mudo">(o aluno não vê a porcentagem; ele vê o valor de cada parcela, o total e o acréscimo em reais)</span><input type="number" min="0" max="100" value={pct} onChange={(e) => setPct(e.target.value)} /></label>
        <label>Acréscimo a mais a cada parcela extra (%) <span className="mudo">(em cadeia: o total do 3x é o do 2x mais esse percentual; o do 4x é o do 3x mais esse percentual, e assim por diante)</span><input type="number" min="0" max="50" value={passo} onChange={(e) => setPasso(e.target.value)} /></label>
        <label>Número máximo de parcelas<select value={max} onChange={(e) => setMax(e.target.value)}>{[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <p className="mudo">Exemplo com plano de R$ 360,00: {simulacao.map((o) => o.n + '× ' + reaisC(o.parcela_centavos) + ' (total ' + reaisC(o.total_centavos) + ')').join(' · ')}.</p>
      </div>
      <div className="cartao form">
        <h3>Texto do contrato</h3>
        <p className="mudo">Os marcadores entre chaves são preenchidos sozinhos. Não apague os que trazem valores e dados das partes:</p>
        <ul className="fin-marcadores">{MARCADORES.map(([k, d]) => <li key={k}><code>{k}</code> {d}</li>)}</ul>
        <textarea rows="26" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Texto do contrato" />
        {desconhecidos.length > 0 && <p className="assinar-erro" role="alert">Marcador desconhecido: {desconhecidos.map((x) => '{{' + x + '}}').join(', ')}. Confira a grafia.</p>}
        <div className="botoes"><button type="button" className="btn" onClick={() => setTexto(MODELO_PADRAO)}>Voltar ao texto padrão</button></div>
      </div>
      <div className="cartao">
        <h3>Prévia (com dados de exemplo)</h3>
        <div className="contrato-papel">{previa}</div>
      </div>
      <p>{faltas.length ? <b>Para a opção "Outros Financiamento" aparecer, falta: {faltas.join(', ')}.</b> : <b>Tudo pronto: ao salvar, a opção aparece para os alunos.</b>}</p>
      {msg && <p className={msg.startsWith('Salvo') ? 'assinar-ok' : 'assinar-erro'} role="status">{msg}</p>}
      <div className="botoes"><button type="button" className="btn ouro" disabled={salvando} onClick={salvar}>{salvando ? 'Salvando…' : 'Salvar contrato'}</button></div>
    </section>
  )
}

// Admin > Financiamentos: contratos assinados, parcelas, documentos.
function FinanciamentosAdmin() {
  const [lista, setLista] = useState(null)
  const [msg, setMsg] = useState('')
  const carregar = async () => { try { setLista(await SB.financiamentosListar()); setMsg('') } catch (e) { setMsg('Não foi possível ler do servidor: ' + e.message) } }
  useEffect(() => { carregar() }, [])
  const baixar = async (p) => { if (!window.confirm('Dar baixa nesta parcela como paga? Use só se você conferiu o pagamento no Mercado Pago ou no extrato.')) return; try { await SB.baixarParcela(p.id); await carregar() } catch (e) { setMsg(e.message) } }
  const cancelar = async (f) => { if (!window.confirm('Cancelar este financiamento? As parcelas que faltam deixam de existir. O acesso já pago continua até a data paga.')) return; try { await SB.cancelarFinanciamento(f.id); await carregar() } catch (e) { setMsg(e.message) } }
  const abrir = async (caminho) => { try { const u = await SB.documentoAbrir(caminho); window.open(u, '_blank', 'noopener') } catch (e) { setMsg(e.message) } }
  const apagar = async (f, caminho) => { if (!window.confirm('Apagar este documento do cofre? O contrato continua guardado. Faça isso só quando o prazo de guarda terminar ou a pessoa pedir.')) return; try { await SB.documentoApagar(caminho); setMsg('Documento apagado do cofre.') } catch (e) { setMsg(e.message) } }
  const ativos = (lista || []).filter((f) => f.status === 'ativo').length
  return (
    <section className="cupons">
      <Aviso>Contratos assinados no financiamento. O documento de identificação fica em cofre privado: só o administrador abre. Dê baixa manual numa parcela só depois de conferir o pagamento.</Aviso>
      {msg && <Aviso forte>{msg}</Aviso>}
      <div className="linha-titulo"><h3>Financiamentos ({lista ? lista.length : '…'}) · em andamento: {lista ? ativos : '…'}</h3><button type="button" className="btn" onClick={carregar}>Atualizar</button></div>
      {lista && lista.length === 0 && <p className="mudo">Nenhum financiamento ainda.</p>}
      <div className="lista">
        {(lista || []).map((f) => {
          const d = f.dados || {}
          const pagas = f.lista.filter((p) => p.status === 'aprovado').length
          return (
            <div key={f.id} className="cartao fin-admin">
              <p><b>{d.nome}</b> · {d.email} · WhatsApp {d.whatsapp} · CPF {formatarCpf(d.cpf)}{d.modo === 'responsavel' ? ' · responsável de ' + (d.benef && d.benef.nome) : ''}</p>
              <p>Plano {f.plano === 'serafim' ? 'Serafim' : 'Querubim'} ({f.periodo}) · {f.parcelas} × {reaisC(f.parcela_centavos)} = {reaisC(f.total_centavos)} · {pagas}/{f.parcelas} pagas · <b>{NOME_STATUS_FIN[f.status] || f.status}</b> · assinado em {dataBR(String(f.assinado_em).slice(0, 10))}</p>
              <div className="fin-parcelas">
                {f.lista.map((p) => <p key={p.id}>{p.parcela_num}ª · {reaisC(p.valor_centavos)} · vence {dataBR(p.vencimento)} · {NOME_STATUS_PARCELA[p.status] || p.status} {p.status !== 'aprovado' && f.status === 'ativo' && <button type="button" className="btn pequeno" onClick={() => baixar(p)}>Dar baixa</button>}</p>)}
              </div>
              <span className="botoes">
                <Link className="btn pequeno" to={'/contrato/' + f.id}>Ver contrato</Link>
                {(f.documentos || []).map((c, i) => <span key={c} className="botoes"><button type="button" className="btn pequeno" onClick={() => abrir(c)}>Ver documento {i + 1}</button><button type="button" className="btn pequeno" onClick={() => apagar(f, c)}>Apagar documento {i + 1}</button></span>)}
                {f.status === 'ativo' && <button type="button" className="btn pequeno" onClick={() => cancelar(f)}>Cancelar financiamento</button>}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}


/* ───────────── ROTAS ───────────── */

export default function App() {
  const P = (el, admin, nivel) => <Privado admin={admin} nivel={nivel}>{el}</Privado>
  const V = (el) => P(el, false, 'vitrine')
  const A = (el) => P(el, false, 'assinante')
  return (
    <Provedor>
      <TravaProvider>
      <SomRota />
      <OciosoFree />
      <NarradorMontagem />
      <InstalarModal />
      <Routes>
        <Route path="/" element={<Entrada />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/nova-senha" element={P(<NovaSenha />)} />
        <Route path="/o-que-sao" element={<PorPlano nivel="vitrine"><OQueSao /></PorPlano>} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/pagamento-retorno" element={P(<RetornoPagamento />)} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="/livraria" element={<DaLoja />} />
        <Route path="/livraria/:id" element={<DaLoja />} />
        <Route path="/livros" element={<PaginaLivros />} />
        <Route path="/livros/:id" element={<PaginaLivroAvivar />} />
        <Route path="/livros/:id/ler" element={<LeitorAvivar />} />
        <Route path="/livros/:id/pdf" element={<Suspense fallback={null}><LvLeitorPdf /></Suspense>} />
        <Route path="/livros/:id/comprar/:formato" element={P(<ComprarLivroAvivar />)} />
        <Route path="/inicio" element={V(<Inicio />)} />
        <Route path="/tv" element={P(<Tv />)} />
        <Route path="/comprar/:id/:formato" element={<DaLoja />} />
        <Route path="/pagamento/:id" element={P(<Pagamento />)} />
        <Route path="/pedido/:id" element={P(<Pedido />)} />
        <Route path="/cursos" element={V(<Cursos />)} />
        <Route path="/cursos/:id" element={P(<Curso />)} />
        <Route path="/jornada" element={V(<Jornada />)} />
        <Route path="/efode" element={V(<EfodePagina />)} />
        <Route path="/efode/atelie" element={P(<Atelie />, true)} />
        <Route path="/montanha-profetica" element={V(<Montanha />)} />
        <Route path="/reportagens" element={V(<Reportagens />)} />
        <Route path="/reportagens/:id" element={A(<Reportagem />)} />
        <Route path="/estudos-profeticos" element={V(<Estudos />)} />
        <Route path="/estudos-profeticos/livro/:id" element={A(<LivroProfeta />)} />
        <Route path="/estudos-profeticos/ascensao/:id" element={A(<AscensaoEstudo />)} />
        <Route path="/jornada-das-estacoes" element={V(<JornadaEstacoes />)} />
        <Route path="/jornada-das-estacoes/:id" element={A(<JornadaEstacao />)} />
        <Route path="/estudos-profeticos/:id" element={A(<EstudoLeitura />)} />
        <Route path="/mestre-avivar" element={P(<MestreAvivar />)} />
        <Route path="/sala-profetica" element={V(<SalaProfetica />)} />
        <Route path="/sala-profetica/:id" element={A(<Sala />)} />
        <Route path="/sala-quantica" element={V(<SalaQuantica />)} />
        <Route path="/tabernaculo-de-oracao" element={V(<Tabernaculo />)} />
        <Route path="/tabua-dos-apocrifos" element={V(<TabuaEntrada />)} />
        <Route path="/tabua-dos-apocrifos/balanca" element={A(<TabuaBalanca />)} />
        <Route path="/tabua-dos-apocrifos/enoque" element={A(<TabuaEnoque />)} />
        <Route path="/tabua-dos-apocrifos/evangelhos" element={A(<TabuaEvangelhos />)} />
        <Route path="/tabua-dos-apocrifos/biblia-etiope" element={A(<TabuaEtiope />)} />
        <Route path="/tabua-dos-apocrifos/mitos" element={A(<TabuaMitos />)} />
        <Route path="/tabua-dos-apocrifos/glossario" element={A(<TabuaGlossario />)} />
        <Route path="/tabua-dos-apocrifos/painel" element={P(<TabuaPainel />, true)} />
        <Route path="/canon-e-reforma" element={V(<RefPortal />)} />
        <Route path="/canon-e-reforma/estante" element={A(<RefEstante />)} />
        <Route path="/canon-e-reforma/debate" element={A(<RefDebate />)} />
        <Route path="/canon-e-reforma/tunel" element={A(<RefTunel />)} />
        <Route path="/canon-e-reforma/reformadores" element={A(<RefReformadores />)} />
        <Route path="/canon-e-reforma/painel" element={P(<RefPainel />, true)} />
        <Route path="/igrejas-protestantes" element={V(<IgrejasPagina />)} />
        <Route path="/igrejas-protestantes/:id" element={A(<IgrejaDetalhe />)} />
        <Route path="/sala-quantica/anotacoes" element={A(<RegistroAnotacoes />)} />
        <Route path="/sala-quantica/exercicio/:id" element={A(<Exercicio />)} />
        <Route path="/sala-quantica/tema/:id" element={A(<TemaQuantico />)} />
        <Route path="/financiamento/:plano" element={P(<Financiamento />)} />
        <Route path="/contrato/:id" element={P(<ContratoPagina />)} />
        <Route path="/espirito/*" element={P(<EspiritoRota />)} />
        <Route path="/perfil" element={P(<Perfil />)} />
        <Route path="/admin" element={P(<Admin />, true)} />
        <Route path="/admin/:col" element={P(<Admin />, true)} />
        <Route path="*" element={<Shell titulo="Página não encontrada"><p>Esta página não existe.</p><Link className="btn ouro" to="/">Ir para a entrada</Link></Shell>} />
      </Routes>
      </TravaProvider>
    </Provedor>
  )
}

// Dados fixos que as telas leem direto (sem passar pelo banco local): recebem os textos completos no lugar da vitrine.
const DADOS_FIXOS = [TEXTOS_EX, PORQUES_CRISTAO, PORQUES_JUDAICO, NS_conteudo, NS_quantica, NS_meses, NS_selos, NS_reforma, NS_mesa, NS_refTermos, NS_igrejas, NS_livrosProf, NS_ascEst, NS_jornada, NS_igrTermos, NS_apo, NS_apo2, NS_apoT, NS_apoT2]
