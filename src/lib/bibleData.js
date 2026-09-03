// Metadados estruturais dos 66 livros — nomes, ordem e número de capítulos
// são fatos objetivos e uniformes em qualquer Bíblia protestante, não dependem
// de tradução. As abreviações seguem o padrão comum de APIs bíblicas em
// português (ex: abibliadigital.com.br) — confira e ajuste se a API que você
// escolher usar tiver abreviações diferentes.

export const OLD_TESTAMENT = [
  { abbr: "gn", name: "Gênesis", chapters: 50 },
  { abbr: "ex", name: "Êxodo", chapters: 40 },
  { abbr: "lv", name: "Levítico", chapters: 27 },
  { abbr: "nm", name: "Números", chapters: 36 },
  { abbr: "dt", name: "Deuteronômio", chapters: 34 },
  { abbr: "js", name: "Josué", chapters: 24 },
  { abbr: "jz", name: "Juízes", chapters: 21 },
  { abbr: "rt", name: "Rute", chapters: 4 },
  { abbr: "1sm", name: "1 Samuel", chapters: 31 },
  { abbr: "2sm", name: "2 Samuel", chapters: 24 },
  { abbr: "1rs", name: "1 Reis", chapters: 22 },
  { abbr: "2rs", name: "2 Reis", chapters: 25 },
  { abbr: "1cr", name: "1 Crônicas", chapters: 29 },
  { abbr: "2cr", name: "2 Crônicas", chapters: 36 },
  { abbr: "ed", name: "Esdras", chapters: 10 },
  { abbr: "ne", name: "Neemias", chapters: 13 },
  { abbr: "et", name: "Ester", chapters: 10 },
  { abbr: "job", name: "Jó", chapters: 42 },
  { abbr: "sl", name: "Salmos", chapters: 150 },
  { abbr: "pv", name: "Provérbios", chapters: 31 },
  { abbr: "ec", name: "Eclesiastes", chapters: 12 },
  { abbr: "ct", name: "Cantares de Salomão", chapters: 8 },
  { abbr: "is", name: "Isaías", chapters: 66 },
  { abbr: "jr", name: "Jeremias", chapters: 52 },
  { abbr: "lm", name: "Lamentações", chapters: 5 },
  { abbr: "ez", name: "Ezequiel", chapters: 48 },
  { abbr: "dn", name: "Daniel", chapters: 12 },
  { abbr: "os", name: "Oséias", chapters: 14 },
  { abbr: "jl", name: "Joel", chapters: 3 },
  { abbr: "am", name: "Amós", chapters: 9 },
  { abbr: "ob", name: "Obadias", chapters: 1 },
  { abbr: "jn", name: "Jonas", chapters: 4 },
  { abbr: "mq", name: "Miquéias", chapters: 7 },
  { abbr: "na", name: "Naum", chapters: 3 },
  { abbr: "hc", name: "Habacuque", chapters: 3 },
  { abbr: "sf", name: "Sofonias", chapters: 3 },
  { abbr: "ag", name: "Ageu", chapters: 2 },
  { abbr: "zc", name: "Zacarias", chapters: 14 },
  { abbr: "ml", name: "Malaquias", chapters: 4 },
];

export const NEW_TESTAMENT = [
  { abbr: "mt", name: "Mateus", chapters: 28 },
  { abbr: "mc", name: "Marcos", chapters: 16 },
  { abbr: "lc", name: "Lucas", chapters: 24 },
  { abbr: "jo", name: "João", chapters: 21 },
  { abbr: "at", name: "Atos", chapters: 28 },
  { abbr: "rm", name: "Romanos", chapters: 16 },
  { abbr: "1co", name: "1 Coríntios", chapters: 16 },
  { abbr: "2co", name: "2 Coríntios", chapters: 13 },
  { abbr: "gl", name: "Gálatas", chapters: 6 },
  { abbr: "ef", name: "Efésios", chapters: 6 },
  { abbr: "fp", name: "Filipenses", chapters: 4 },
  { abbr: "cl", name: "Colossenses", chapters: 4 },
  { abbr: "1ts", name: "1 Tessalonicenses", chapters: 5 },
  { abbr: "2ts", name: "2 Tessalonicenses", chapters: 3 },
  { abbr: "1tm", name: "1 Timóteo", chapters: 6 },
  { abbr: "2tm", name: "2 Timóteo", chapters: 4 },
  { abbr: "tt", name: "Tito", chapters: 3 },
  { abbr: "fm", name: "Filemom", chapters: 1 },
  { abbr: "hb", name: "Hebreus", chapters: 13 },
  { abbr: "tg", name: "Tiago", chapters: 5 },
  { abbr: "1pe", name: "1 Pedro", chapters: 5 },
  { abbr: "2pe", name: "2 Pedro", chapters: 3 },
  { abbr: "1jo", name: "1 João", chapters: 5 },
  { abbr: "2jo", name: "2 João", chapters: 1 },
  { abbr: "3jo", name: "3 João", chapters: 1 },
  { abbr: "jd", name: "Judas", chapters: 1 },
  { abbr: "ap", name: "Apocalipse", chapters: 22 },
];

export const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];

export function findBook(abbr) {
  return ALL_BOOKS.find((b) => b.abbr === abbr);
}
