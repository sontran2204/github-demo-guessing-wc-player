const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_REST = "https://en.wikipedia.org/api/rest_v1/page/summary";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";
const USER_AGENT = "WorldCupPlayerGuess/1.0 (https://github.com/world-cup-player-guess)";

import { resolvePlayerSearchNames } from "./player-name-aliases";

const COUNTRY_ALIASES: Record<string, string[]> = {
  "IR Iran": ["iran"],
  Türkiye: ["turkey", "türkiye"],
  "Côte d'Ivoire": ["ivory coast", "cote d'ivoire"],
  Czechia: ["czech republic", "czechia"],
  "Congo DR": ["dr congo", "democratic republic of the congo", "congo"],
  "South Korea": ["south korea", "korea republic", "korea"],
  "Saudi Arabia": ["saudi arabia"],
  "New Zealand": ["new zealand"],
  "Bosnia and Herzegovina": ["bosnia", "bosnia and herzegovina"],
  "Cabo Verde": ["cape verde", "cabo verde"],
  USA: ["united states", "usa", "american"],
  England: ["england", "english"],
  Scotland: ["scotland", "scottish"],
  Portugal: ["portugal", "portuguese"],
};

interface WikidataSearchResult {
  id: string;
  label?: string;
  description?: string;
}

interface SportsDbPlayer {
  strPlayer: string;
  strThumb: string | null;
  strCutout: string | null;
  strNationality: string | null;
  strTeam?: string | null;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function descriptionMatchesCountry(description: string | undefined, countryName: string): boolean {
  if (!description) return false;
  const desc = normalize(description);
  const aliases = [normalize(countryName), ...(COUNTRY_ALIASES[countryName] ?? [])];
  return aliases.some((alias) => desc.includes(alias));
}

function nationalityMatches(countryName: string, sportsDbNationality: string | null): boolean {
  if (!sportsDbNationality) return false;
  const nationalityNorm = normalize(sportsDbNationality);
  const aliases = [normalize(countryName), ...(COUNTRY_ALIASES[countryName] ?? [])];
  return aliases.some(
    (alias) => nationalityNorm.includes(alias) || alias.includes(nationalityNorm)
  );
}

function isFootballerDescription(description: string | undefined): boolean {
  if (!description) return false;
  const desc = normalize(description);
  return (
    desc.includes("football") ||
    desc.includes("soccer") ||
    desc.includes("footballer") ||
    desc.includes("association football")
  );
}

function isFootballerWikiSummary(summary: {
  description?: string;
  extract?: string;
  title?: string;
}): boolean {
  const text = normalize(`${summary.description ?? ""} ${summary.extract ?? ""} ${summary.title ?? ""}`);
  if (text.includes("name list") || text.includes("given name") || text.includes("family name")) {
    return false;
  }
  return isFootballerDescription(text) || text.includes("player");
}

async function wikidataFetch(params: Record<string, string>): Promise<unknown> {
  const url = `${WIKIDATA_API}?${new URLSearchParams({ ...params, format: "json" })}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;
  return response.json();
}

async function wikipediaFetch(params: Record<string, string>): Promise<unknown> {
  const url = `${WIKIPEDIA_API}?${new URLSearchParams({ ...params, format: "json" })}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;
  return response.json();
}

function wikimediaImageUrl(filename: string): string {
  const encoded = encodeURIComponent(filename.replace(/ /g, "_"));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=320`;
}

async function fetchWikidataImage(entityId: string): Promise<string | null> {
  const data = (await wikidataFetch({
    action: "wbgetclaims",
    entity: entityId,
    property: "P18",
  })) as { claims?: { P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }> } } | null;

  const filename = data?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return filename ? wikimediaImageUrl(filename) : null;
}

async function searchWikidata(playerName: string, countryName: string): Promise<string | null> {
  const data = (await wikidataFetch({
    action: "wbsearchentities",
    search: playerName,
    language: "en",
    type: "item",
    limit: "8",
  })) as { search?: WikidataSearchResult[] } | null;

  const results = data?.search ?? [];
  if (results.length === 0) return null;

  const ranked = results
    .filter((r) => isFootballerDescription(r.description))
    .sort((a, b) => {
      const aCountry = descriptionMatchesCountry(a.description, countryName) ? 1 : 0;
      const bCountry = descriptionMatchesCountry(b.description, countryName) ? 1 : 0;
      if (aCountry !== bCountry) return bCountry - aCountry;
      const aName = normalize(a.label ?? "") === normalize(playerName) ? 1 : 0;
      const bName = normalize(b.label ?? "") === normalize(playerName) ? 1 : 0;
      return bName - aName;
    });

  for (const result of ranked) {
    const imageUrl = await fetchWikidataImage(result.id);
    if (imageUrl) return imageUrl;
  }

  for (const result of ranked) {
    if (result.label && descriptionMatchesCountry(result.description, countryName)) {
      const wikiImage = await fetchWikipediaSummaryImage(result.label, countryName);
      if (wikiImage) return wikiImage;
    }
  }

  return null;
}

async function fetchWikipediaSummaryImage(
  title: string,
  countryName?: string
): Promise<string | null> {
  const summaryUrl = `${WIKIPEDIA_REST}/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const response = await fetch(summaryUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;

  const summary = (await response.json()) as {
    thumbnail?: { source?: string };
    description?: string;
    extract?: string;
    title?: string;
  };

  if (!isFootballerWikiSummary(summary)) return null;
  if (countryName && summary.description && !descriptionMatchesCountry(summary.description, countryName)) {
    const text = normalize(summary.description);
    const hasCountry = [normalize(countryName), ...(COUNTRY_ALIASES[countryName] ?? [])].some((a) =>
      text.includes(a)
    );
    if (!hasCountry && !text.includes("footballer") && !text.includes("football player")) {
      return null;
    }
  }

  return summary.thumbnail?.source ?? null;
}

async function searchWikipedia(playerName: string, countryName: string): Promise<string | null> {
  const queries = [`${playerName} footballer`, `${playerName} football`, playerName];

  for (const query of queries) {
    const data = (await wikipediaFetch({
      action: "opensearch",
      search: query,
      limit: "5",
      namespace: "0",
    })) as [string, string[], string[], string[]] | null;

    const titles = data?.[1] ?? [];
    for (const title of titles) {
      const image = await fetchWikipediaSummaryImage(title, countryName);
      if (image) return image;
    }
  }

  return null;
}

async function searchSportsDb(
  playerName: string,
  countryName: string,
  club?: string | null
): Promise<string | null> {
  const searchTerm = playerName.replace(/ /g, "_");
  const url = `${SPORTSDB_BASE}/searchplayers.php?p=${encodeURIComponent(searchTerm)}`;

  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;

    const text = await response.text();
    if (text.includes("error code: 1015")) return null;

    const data = JSON.parse(text) as { player?: SportsDbPlayer[] | null };
    const players = data.player ?? [];
    if (players.length === 0) return null;

    const clubNorm = club ? normalize(club) : "";
    const match =
      players.find(
        (p) =>
          nationalityMatches(countryName, p.strNationality) &&
          clubNorm &&
          p.strTeam &&
          normalize(p.strTeam).includes(clubNorm.split(" ")[0])
      ) ??
      players.find((p) => nationalityMatches(countryName, p.strNationality)) ??
      players.find((p) => normalize(p.strPlayer) === normalize(playerName)) ??
      players[0];

    return match?.strCutout || match?.strThumb || null;
  } catch {
    return null;
  }
}

export async function fetchPlayerImageUrl(
  playerName: string,
  countryName: string,
  club?: string | null
): Promise<string | null> {
  const searchNames = resolvePlayerSearchNames(playerName, countryName, club);

  for (const name of searchNames) {
    const wikidataImage = await searchWikidata(name, countryName);
    if (wikidataImage) return wikidataImage;

    const wikipediaImage = await searchWikipedia(name, countryName);
    if (wikipediaImage) return wikipediaImage;
  }

  for (const name of searchNames) {
    const sportsDbImage = await searchSportsDb(name, countryName, club);
    if (sportsDbImage) return sportsDbImage;
  }

  return null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
