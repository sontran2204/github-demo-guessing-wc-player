/**
 * Corrections for mangled player names in the fallback GitHub dataset.
 * Pattern: duplicated or concatenated surnames (e.g. "RAMOSGonçalo Goncalo" → "Gonçalo Ramos").
 * Key: incorrect name in DB → value: correct searchable/display name.
 */
export const PLAYER_NAME_ALIASES: Record<string, string> = {
  // Egypt / Saudi
  "Mohamed Abdelsalam Omar": "Omar Marmoush",

  // Portugal
  "João Joao Felix": "João Félix",
  "Ronaldo Cristiano Ronaldo": "Cristiano Ronaldo",
  "Pedro Joao Neves": "João Neves",
  "Pedro Joao Cancelo": "João Cancelo",
  "RAMOSGonçalo Goncalo": "Gonçalo Ramos",
  "Gonçalo Goncalo Inacio": "Gonçalo Inácio",
  "SEMEDONélson Nelson": "Nélson Semedo",
  "Manuel Goncalo": "Gonçalo Guedes",

  // Brazil
  "MARQUINHOSMarcos": "Marquinhos",
  "GUIMARAESBruno Bruno": "Bruno Guimarães",
  "PEREIRALeonardo Leo": "Leonardo",
  "MARTINELLIGabriel Gabriel": "Gabriel Martinelli",
  "IBANEZRoger Roger": "Roger Ibañez",

  // Qatar
  "KHOUKHIBoualem Boualem": "Boualem Khoukhi",

  // Cabo Verde
  "Paulo Joao Paulo": "João Paulo",
  "BENCHIMOLGilson Gilson": "Gilson Benchimol",
  "RODRIGUESGarry Garry": "Garry Rodrigues",
  "CABRALSidny Sidny Lopes": "Sidny Cabral",
  "SEMEDOJair Yannick": "Yannick Semedo",
  "MOREIRASteven Steven": "Steven Moreira",
  // New Zealand
  "Marko Seufatu Nikola Stamenic": "Marko Stamenić",
};

export function resolvePlayerSearchNames(
  playerName: string,
  _countryName: string,
  club?: string | null
): string[] {
  const names = new Set<string>();

  const alias = PLAYER_NAME_ALIASES[playerName];
  if (alias) {
    names.add(alias);
    names.add(alias.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  }

  names.add(playerName);

  const parts = playerName.split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    const last = parts[parts.length - 1];
    const first = parts[0];
    if (last.length >= 4 && first.length >= 3) {
      names.add(`${first} ${last}`);
    }
  }

  if (club) {
    const clubShort = club.replace(/\s+(FC|CF|SC|AC|SK)$/i, "").trim();
    const aliasName = alias ?? playerName;
    if (clubShort.length >= 3) {
      names.add(`${aliasName} ${clubShort}`);
    }
  }

  return [...names];
}

export function getDisplayName(playerName: string): string {
  return PLAYER_NAME_ALIASES[playerName] ?? playerName;
}
