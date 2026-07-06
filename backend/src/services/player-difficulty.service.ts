import { getDisplayName } from "./player-name-aliases";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const BIG_CLUB_KEYWORDS = [
  "real madrid",
  "fc barcelona",
  "barcelona",
  "manchester city",
  "manchester united",
  "liverpool",
  "chelsea",
  "arsenal",
  "tottenham",
  "bayern",
  "borussia dortmund",
  "paris saint-germain",
  "juventus",
  "inter",
  "ac milan",
  "napoli",
  "atletico",
  "atlético",
  "benfica",
  "porto",
  "ajax",
  "psv",
  "sporting",
  "flamengo",
  "palmeiras",
  "river plate",
  "boca juniors",
];

const MID_CLUB_KEYWORDS = [
  "fulham",
  "genoa",
  "fenerbah",
  "real betis",
  "sevilla",
  "valencia",
  "lyon",
  "marseille",
  "lille",
  "wolfsburg",
  "leverkusen",
  "roma",
  "lazio",
  "fiorentina",
  "celtic",
  "rangers",
  "galatasaray",
  "besiktas",
  "trabzonspor",
  "eindhoven",
  "monaco",
  "nice",
  "lens",
  "west ham",
  "aston villa",
  "newcastle",
  "brighton",
  "wolverhampton",
  "crystal palace",
  "everton",
  "nottingham",
  "brentford",
  "bournemouth",
  "milan",
  "lazio",
  "sassuolo",
  "torino",
  "udinese",
  "feyenoord",
  "brugge",
  "anderlecht",
  "salzburg",
  "praha",
  "slavia",
  "sparta",
  "cruz azul",
  "america",
  "guadalajara",
  "toluca",
  "monterrey",
  "santos",
  "corinthians",
  "sao paulo",
  "internacional",
  "al hilal",
  "al nassr",
  "al ahli",
  "al ittihad",
];

const FAMOUS_PLAYER_KEYWORDS = [
  "cristiano ronaldo",
  "lionel messi",
  "kylian mbapp",
  "neymar",
  "erling haaland",
  "jude bellingham",
  "vinicius",
  "luka modric",
  "harry kane",
  "mohamed salah",
  "kevin de bruyne",
  "robert lewandowski",
  "antoine griezmann",
  "lamine yamal",
  "pedri",
  "gavi",
  "jamal musiala",
  "virgil van dijk",
  "rodri",
  "lautaro martinez",
  "julian alvarez",
  "bukayo saka",
  "declan rice",
  "cole palmer",
  "phil foden",
  "bruno guimar",
  "marquinhos",
  "raphinha",
  "casemiro",
  "alisson",
  "ederson",
  "thibaut courtois",
  "manuel neuer",
  "gianluigi donnarumma",
  "kylian",
  "kilian mbapp",
  "son heung",
  "harry kane",
  "christian pulisic",
  "weston mckennie",
  "guillermo ochoa",
  "hirving lozano",
  "omar marmoush",
  "joao felix",
  "joão felix",
  "goncalo ramos",
  "gonçalo ramos",
  "bernardo silva",
  "bruno fernandes",
  "diogo jota",
  "rafael leao",
  "rafael leão",
  "victor osimhen",
  "khvicha kvaratskhelia",
  "kvaratskhelia",
  "florian wirtz",
  "jude bellingham",
  "federico valverde",
  "aurélien tchouam",
  "tchouameni",
  "william saliba",
  "gabriel martinelli",
  "gabriel jesus",
  "endrick",
  "vini jr",
  "vinícius",
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesKeyword(text: string, keywords: string[]): boolean {
  const norm = normalize(text);
  return keywords.some((keyword) => norm.includes(normalize(keyword)));
}

export function isValidDifficulty(value: string): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty);
}

export function classifyPlayer(name: string, club: string | null): Difficulty {
  const displayName = getDisplayName(name);
  const clubText = club ?? "";

  if (matchesKeyword(displayName, FAMOUS_PLAYER_KEYWORDS) || matchesKeyword(clubText, BIG_CLUB_KEYWORDS)) {
    return "easy";
  }

  if (matchesKeyword(clubText, MID_CLUB_KEYWORDS)) {
    return "medium";
  }

  return "hard";
}
