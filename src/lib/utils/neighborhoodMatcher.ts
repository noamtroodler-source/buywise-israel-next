/**
 * Fuzzy Neighborhood Matching Utility
 * Handles common Hebrew-to-English transliteration variants and typos
 */

// Canonical neighborhood name → array of alternate spellings
const neighborhoodAliases: Record<string, string[]> = {
  // === Jerusalem ===
  "Rehavia": ["rechavia", "rechavya", "rekhavia", "rehavia", "rechaviah"],
  "Nachlaot": ["nahlaot", "nachalot", "nachlaoth", "nahla'ot", "nahalot", "nakhlot"],
  "Talpiot": ["talpiyot", "talpiyoth", "talpioth", "talpiyyot"],
  "East Talpiot": ["east talpiyot", "mizrach talpiot", "talpiot mizrach", "armon hanatziv"],
  "Baka": ["baq'a", "baqaa", "bakaa", "baq'ah", "bka"],
  "Arnona": ["arnonna", "arnonah"],
  "Katamon": ["katamonim", "katammon", "qatamon", "qatamonim", "san simon", "old katamon", "gonenim"],
  "German Colony": ["moshava germanit", "german-colony", "germancolony", "german koloni"],
  "Meah Shearim": ["mea shearim", "meashearim", "mea-shearim", "me'a she'arim", "100 gates", "meah shaarim"],
  "Ein Kerem": ["ein karem", "ein-kerem", "einkarem", "einkerem", "ein-karem"],
  "Bayit Vegan": ["beit vegan", "bayit-vegan", "bayitvegan", "bait vegan", "beit-vegan"],
  "Har Nof": ["harnof", "har-nof", "har noff"],
  "Ramot": ["ramot alon", "ramott", "ramot allon"],
  "Pisgat Ze'ev": ["pisgat zeev", "pisgatzeev", "pisgat-zeev", "pisgat zev"],
  "Neve Ya'akov": ["neve yaakov", "neveyaakov", "neve-yaakov", "neve yakov", "neveyakov"],
  "Givat Shaul": ["givat-shaul", "givatshaul", "givat shawl"],
  "Kiryat Moshe": ["kiryat-moshe", "kiryatmoshe", "kiryat mosha", "qiryat moshe"],
  "Sanhedria": ["sanhedriya", "sanhedria murhevet", "sanhedriyya"],
  "Ma'alot Dafna": ["maalot dafna", "maalotdafna", "maalot-dafna", "ma'alot daphna"],
  "French Hill": ["givat hatzarfatit", "frenchhill", "french-hill", "har hatzofim"],
  "Mamilla": ["mamila", "mamillah"],
  "Musrara": ["musrarra", "morasha"],
  "Geula": ["geulah", "ge'ula"],
  "Abu Tor": ["abu-tor", "abutor", "abu torr"],
  "Gilo": ["gillo", "giloh"],
  "Malha": ["malkha", "malcha", "malhah"],
  "Ramat Eshkol": ["ramat-eshkol", "ramateshkol", "ramat eshcol"],
  "Givat HaMivtar": ["givat hamivtar", "givathamivtar", "givat-hamivtar", "ammunition hill"],
  "Old City": ["ir atika", "old-city", "oldcity", "walled city"],
  "Nayot": ["nayoth", "nayos"],
  "Ir Gannim": ["ir-gannim", "irgannim", "ir ganim"],
  "Kiryat Menachem": ["kiryat-menachem", "kiryatmenachem", "kiryat menahem"],
  "Kiryat HaYovel": ["kiryat hayovel", "kiryathayovel", "kiryat-hayovel"],
  "Ramat Shlomo": ["ramat-shlomo", "ramatshlomo", "ramat shelomo"],
  "Givat Mordechai": ["givat-mordechai", "givatmordechai", "givat mordekhai"],
  "Holyland": ["holy land", "holy-land"],
  "Mevasseret Tzion": ["mevasseret zion", "mevasseret-tzion", "mevasseretzion"],
  "Ramat Beit HaKerem": ["ramat beit hakerem", "ramat bet hakerem", "ramatbeithakerem"],
  "Beit HaKerem": ["beit-hakerem", "beithakerem", "bet hakerem", "beth hakerem"],
  "Pat": ["patt"],
  "Talbiya": ["talbieh", "talbiye", "talbiyeh", "komemiyut"],
  "Kiryat Shmuel": ["kiryat-shmuel", "kiryatshmuel", "kiryat shemuel"],
  "Sheikh Jarrah": ["shimon hatzadik", "sheikh-jarrah", "sheikhjarrah"],

  // === Tel Aviv ===
  "Neve Tzedek": ["neve tsedek", "neve zedek", "nevetzedek", "neve-tzedek", "neve cedek", "neve sedek"],
  "Florentin": ["florantin", "florentine", "floranten"],
  "Kerem HaTeimanim": ["kerem hateimanim", "keremhateimanim", "kerem-hateimanim", "kerem teimanim", "yemenite quarter"],
  "Jaffa": ["yafo", "yaffo", "jafa", "jafo", "old jaffa"],
  "Ramat Aviv": ["ramat-aviv", "ramataviv", "ramat avive"],
  "Ramat Aviv Gimel": ["ramat aviv gimmel", "ramat-aviv-gimel", "ramatavivgimel"],
  "Bavli": ["bavly", "bavlli"],
  "Sarona": ["sharona", "saronah"],
  "Shapira": ["shappira", "shapirah"],
  "HaTikva": ["hatikva", "ha-tikva", "hatiqva", "hatikvah"],
  "Nahalat Binyamin": ["nahalatbinyamin", "nahalat-binyamin", "nachlat binyamin", "nahlat binyamin"],
  "Neve Sha'anan": ["neve shaanan", "neveshaanan", "neve-shaanan", "neve shanan"],
  "Yad Eliyahu": ["yad-eliyahu", "yadeliyahu", "yad eliyau"],
  "Ramat HaHayal": ["ramat hahayal", "ramathahayal", "ramat-hahayal", "ramat hachayal"],
  "Kiryat Shalom": ["kiryat-shalom", "kiryatshalom"],
  "Lev HaIr": ["lev hair", "levhair", "lev-hair", "city center"],
  "HaYarkon": ["hayarkon", "ha-yarkon"],
  "Montefiore": ["montefiyore", "montifiore", "montefiori"],
  "Old North": ["old-north", "oldnorth", "tzafon yashan"],
  "New North": ["new-north", "newnorth", "tzafon hadash"],

  // === Beit Shemesh ===
  "Ramat Beit Shemesh Aleph": ["rbs a", "rbsa", "rbs alef", "ramat beit shemesh a", "rbs-a", "ramat beit shemesh 1"],
  "Ramat Beit Shemesh Bet": ["rbs b", "rbsb", "rbs bet", "ramat beit shemesh b", "rbs-b", "ramat beit shemesh 2"],
  "Ramat Beit Shemesh Gimmel": ["rbs g", "rbsg", "rbs gimel", "ramat beit shemesh g", "rbs-g", "ramat beit shemesh 3", "rbs gimmel"],
  "Ramat Beit Shemesh Dalet": ["rbs d", "rbsd", "rbs daled", "ramat beit shemesh d", "rbs-d", "ramat beit shemesh 4"],
  "Sheinfeld": ["sheinfield", "shinefeld", "sheinfield"],
  "Nofei HaShemesh": ["nofei hashemesh", "nofeihashemesh", "nofei-hashemesh"],

  // === Ra'anana ===
  "Neve Zemer": ["neve-zemer", "nevezemer"],
  "Kiryat Ganim": ["kiryat-ganim", "kiryatganim"],

  // === Herzliya ===
  "Herzliya Pituach": ["herzliya pituah", "herzelia pituach", "herzliya-pituach", "pituach", "herzeliya pituach"],
  "Nof Yam": ["nof-yam", "nofyam"],

  // === Haifa ===
  "Carmel Center": ["merkaz hacarmel", "carmel-center", "carmelcenter", "merkaz karmel"],
  "Hadar": ["hadar hacarmel"],
  "Bat Galim": ["bat-galim", "batgalim"],
  "Neve Sha'anan (Haifa)": ["neve shaanan haifa"],
  "Ahuza": ["ahuzza", "ahuzah"],
  "Denia": ["denya", "deniya"],

  // === Netanya ===
  "Ir Yamim": ["ir-yamim", "iryamim"],
  "Kiryat Hasharon": ["kiryat-hasharon", "kiryathasharon"],

  // === Modi'in ===
  "Buchman": ["buhman", "bukhman"],
  "Moriah": ["moria", "moriyah"],

  // === Kfar Saba ===
  "Green Kfar Saba": ["green kfarsaba", "green-kfar-saba"],

  // === General patterns ===
  "Kiryat Ono": ["kiryat-ono", "kiryatono", "qiryat ono"],
};

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/['-]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Simple Levenshtein distance for typo tolerance
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Check if a neighborhood name matches a search query using fuzzy matching
 */
export function neighborhoodMatchesQuery(neighborhoodName: string, searchQuery: string): boolean {
  const normalizedQuery = normalizeString(searchQuery);
  const normalizedName = normalizeString(neighborhoodName);

  if (!normalizedQuery) return true;

  // 1. Direct normalized substring match
  if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
    return true;
  }

  // 2. Check aliases
  const aliases = neighborhoodAliases[neighborhoodName] || [];
  for (const alias of aliases) {
    const normalizedAlias = normalizeString(alias);
    if (normalizedAlias.includes(normalizedQuery) || normalizedQuery.includes(normalizedAlias)) {
      return true;
    }
  }

  // 3. Levenshtein distance for close typos
  const threshold = normalizedQuery.length <= 5 ? 1 : 2;
  if (levenshteinDistance(normalizedName, normalizedQuery) <= threshold) {
    return true;
  }

  // 4. Word-start matching
  const words = neighborhoodName.toLowerCase().split(/[\s'-]+/);
  for (const word of words) {
    if (word.startsWith(normalizedQuery) || normalizedQuery.startsWith(word)) {
      return true;
    }
  }

  return false;
}
