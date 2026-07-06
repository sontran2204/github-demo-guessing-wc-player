import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { classifyPlayer } from "../src/services/player-difficulty.service";

const ZAFRONIX_BASE = "https://api.zafronix.com/fifa/worldcup/v1";
const FALLBACK_TEAMS_URL =
  "https://raw.githubusercontent.com/mominullptr/FIFA-World-Cup-2026-Dataset/main/teams.csv";
const FALLBACK_PLAYERS_URL =
  "https://raw.githubusercontent.com/mominullptr/FIFA-World-Cup-2026-Dataset/main/squads_and_players.csv";

const FIFA_TO_ISO2: Record<string, string> = {
  MEX: "mx",
  RSA: "za",
  KOR: "kr",
  CZE: "cz",
  CAN: "ca",
  BIH: "ba",
  QAT: "qa",
  SUI: "ch",
  BRA: "br",
  MAR: "ma",
  HAI: "ht",
  SCO: "gb-sct",
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRN: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  SEN: "sn",
  IRQ: "iq",
  NOR: "no",
  ARG: "ar",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa",
};

interface ZafronixClub {
  name?: string;
  country?: string;
}

interface ZafronixPlayer {
  jersey?: number;
  name: string;
  fullName?: string;
  position?: string;
  club?: ZafronixClub | string;
}

interface ZafronixTeam {
  name: string;
  code?: string;
  flag?: {
    flagUrl?: string;
    fifaCode?: string;
  };
  roster?: ZafronixPlayer[];
  squad?: ZafronixPlayer[];
}

interface ZafronixTournamentResponse {
  tournament?: {
    year: number;
    teams?: ZafronixTeam[];
  };
  teams?: ZafronixTeam[];
}

function getClubName(club: ZafronixClub | string | undefined): string | null {
  if (!club) return null;
  if (typeof club === "string") return club;
  return club.name ?? null;
}

function flagUrlFromFifaCode(fifaCode: string): string | null {
  const iso2 = FIFA_TO_ISO2[fifaCode];
  return iso2 ? `https://flagcdn.com/w160/${iso2}.png` : null;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });
    return row;
  });
}

async function fetchTournament2026(): Promise<ZafronixTeam[]> {
  const apiKey = process.env.ZAFRONIX_API_KEY;

  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error("NO_API_KEY");
  }

  const response = await fetch(`${ZAFRONIX_BASE}/tournaments/2026`, {
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zafronix API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as ZafronixTournamentResponse;
  const teams = data.tournament?.teams ?? data.teams ?? [];

  if (teams.length === 0) {
    throw new Error("No teams returned from Zafronix API.");
  }

  return teams;
}

async function importFromZafronix() {
  console.log("Fetching 2026 World Cup data from Zafronix API...");
  const teams = await fetchTournament2026();

  let countryCount = 0;
  let playerCount = 0;
  let skipped = 0;

  for (const team of teams) {
    const country = await prisma.country.upsert({
      where: { name: team.name },
      update: {
        code: team.code ?? team.flag?.fifaCode ?? null,
        flagUrl: team.flag?.flagUrl ?? null,
      },
      create: {
        name: team.name,
        code: team.code ?? team.flag?.fifaCode ?? null,
        flagUrl: team.flag?.flagUrl ?? null,
      },
    });
    countryCount++;

    const roster = team.roster ?? team.squad ?? [];

    for (const p of roster) {
      const playerName = p.fullName ?? p.name;
      if (!playerName) {
        skipped++;
        continue;
      }

      const externalId = `${team.name}-${p.jersey ?? ""}-${playerName}`;

      const club = getClubName(p.club);
      const difficulty = classifyPlayer(playerName, club);

      await prisma.player.upsert({
        where: {
          name_countryId: {
            name: playerName,
            countryId: country.id,
          },
        },
        update: {
          position: p.position ?? null,
          club,
          jersey: p.jersey ?? null,
          externalId,
          difficulty,
        },
        create: {
          name: playerName,
          position: p.position ?? null,
          club,
          jersey: p.jersey ?? null,
          countryId: country.id,
          externalId,
          difficulty,
        },
      });
      playerCount++;
    }
  }

  console.log(`Import complete: ${countryCount} countries, ${playerCount} players (${skipped} skipped).`);
}

async function importFromFallbackDataset() {
  console.log("Using fallback dataset from GitHub (mominullptr/FIFA-World-Cup-2026-Dataset)...");

  const [teamsRes, playersRes] = await Promise.all([
    fetch(FALLBACK_TEAMS_URL),
    fetch(FALLBACK_PLAYERS_URL),
  ]);

  if (!teamsRes.ok || !playersRes.ok) {
    throw new Error("Failed to fetch fallback dataset from GitHub.");
  }

  const teamsCsv = parseCsv(await teamsRes.text());
  const playersCsv = parseCsv(await playersRes.text());

  const teamIdToCountry = new Map<number, { id: number; name: string }>();

  for (const row of teamsCsv) {
    const teamId = parseInt(row.team_id, 10);
    const teamName = row.team_name;
    const fifaCode = row.fifa_code;

    const country = await prisma.country.upsert({
      where: { name: teamName },
      update: {
        code: fifaCode || null,
        flagUrl: fifaCode ? flagUrlFromFifaCode(fifaCode) : null,
      },
      create: {
        name: teamName,
        code: fifaCode || null,
        flagUrl: fifaCode ? flagUrlFromFifaCode(fifaCode) : null,
      },
    });

    teamIdToCountry.set(teamId, { id: country.id, name: teamName });
  }

  let playerCount = 0;
  let skipped = 0;

  for (const row of playersCsv) {
    const teamId = parseInt(row.team_id, 10);
    const country = teamIdToCountry.get(teamId);

    if (!country || !row.player_name) {
      skipped++;
      continue;
    }

    const externalId = `fallback-${row.player_id}`;

    const club = row.club_team || null;
    const difficulty = classifyPlayer(row.player_name, club);

    await prisma.player.upsert({
      where: {
        name_countryId: {
          name: row.player_name,
          countryId: country.id,
        },
      },
      update: {
        position: row.position || null,
        club,
        externalId,
        difficulty,
      },
      create: {
        name: row.player_name,
        position: row.position || null,
        club,
        countryId: country.id,
        externalId,
        difficulty,
      },
    });
    playerCount++;
  }

  console.log(
    `Import complete: ${teamIdToCountry.size} countries, ${playerCount} players (${skipped} skipped).`
  );
}

async function main() {
  const forceFallback = process.env.USE_FALLBACK_DATA === "1";

  if (forceFallback) {
    await importFromFallbackDataset();
    return;
  }

  try {
    await importFromZafronix();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "NO_API_KEY") {
      console.log("No Zafronix API key configured — falling back to public GitHub dataset.");
      await importFromFallbackDataset();
    } else {
      throw err;
    }
  }
}

main()
  .catch((err) => {
    console.error("Import failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
