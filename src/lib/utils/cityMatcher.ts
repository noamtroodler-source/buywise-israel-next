/**
 * Fuzzy City Matching Utility
 * Handles common Israeli transliteration variations and typos
 */

// City name → array of alternate spellings/common typos
const cityAliases: Record<string, string[]> = {
  "Ra'anana": ["raanana", "ranana", "rananan", "rannana", "raanan", "ra anana", "raannana"],
  "Modi'in": ["modiin", "modin", "modein", "modi in", "modien"],
  "Ma'ale Adumim": ["maale adumim", "maaleh adumim", "maale-adumim", "maaleh", "male adumim", "maaleadumim"],
  "Givat Ze'ev": ["givat zeev", "givatzeev", "givat-zeev", "givat zev", "givatzeev"],
  "Hod HaSharon": ["hod hasharon", "hodhasharon", "hod-hasharon", "hodasharon", "hod sharon"],
  "Rosh HaAyin": ["rosh haayin", "roshhaayin", "rosh-haayin", "rosh ayin", "roshayin", "rosh ha ayin"],
  "Petah Tikva": ["petach tikva", "petachtikva", "petah-tikva", "petach-tikva", "petah tikwa", "petachtikwa", "petahtikva"],
  "Zichron Yaakov": ["zichron yaakov", "zichronyaakov", "zichron-yaakov", "zichron jacob", "zichron yakov", "zichronyakov"],
  "Tel Aviv": ["telaviv", "tel-aviv", "tlv", "tel avive", "telavive"],
  "Jerusalem": ["yerushalayim", "jeruslaem", "jerusalm", "jeruslam", "yerusalem"],
  "Beer Sheva": ["beersheva", "beer-sheva", "beersheba", "be'er sheva", "beer sheba", "bersheva", "bersheba"],
  "Herzliya": ["herzeliya", "herzelia", "herzlia", "hertzeliya", "hertzelia", "herzlya"],
  "Kfar Saba": ["kfarsaba", "kfar-saba", "kfar sabba", "kfarsabba", "kfar sava", "kfarsava"],
  "Netanya": ["natanya", "netaniya", "netanyah", "nathanya"],
  "Haifa": ["haipha", "hafia", "hefa", "heifa"],
  "Ashdod": ["ashdode", "asdod", "ashod"],
  "Ashkelon": ["ashqelon", "ashkalon", "ashklon", "askelon"],
  "Beit Shemesh": ["beit-shemesh", "beitschemesh", "bet shemesh", "beitshemesh", "bet-shemesh", "beth shemesh"],
  "Mevaseret Zion": ["mevaseret-zion", "mevasseret", "mevasseret zion", "mevaseret", "mevaseretzion"],
  "Givatayim": ["givatayim", "givataim", "givat-ayim", "givataiym", "givat ayim"],
  "Ramat Gan": ["ramatgan", "ramat-gan", "ramat gann", "ramatgann"],
  "Givat Shmuel": ["givatshmuel", "givat-shmuel", "givat shmuel", "givatshemuel", "givat shemuel"],
  "Hadera": ["hadeira", "hadera", "hedera"],
  "Caesarea": ["kesaria", "cesaria", "qesaria", "qaisaria", "kaisaria", "cesarea"],
  "Efrat": ["ephrat", "efrata", "ephrata"],
  "Gush Etzion": ["gush-etzion", "gushetzion", "gush ezion", "gushezion"],
  "Nahariya": ["nahariyya", "naharia", "naharya"],
  "Eilat": ["elat", "eylat", "eilatt"],
  "Holon": ["cholon"],
  "Bat Yam": ["bat-yam", "batyam"],
  "Shoham": ["shocham"],
  "Yokneam": ["yokneam", "yoqneam", "yokne'am"],
  "Kiryat Tivon": ["kiryat-tivon", "kiryattivon", "qiryat tivon"],
  "Pardes Hanna": ["pardes hanna", "pardes-hanna", "pardeshanna", "pardes hana", "pardeshana", "pardes hanna-karkur", "pardes hanna karkur"],
};

/**
 * Normalize string for comparison:
 * - Convert to lowercase
 * - Remove apostrophes, hyphens, and extra spaces
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/['-]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Simple Levenshtein distance implementation for catching single-letter typos
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if a city name matches the search query using fuzzy matching
 */
export function cityMatchesQuery(cityName: string, searchQuery: string): boolean {
  const normalizedQuery = normalizeString(searchQuery);
  const normalizedName = normalizeString(cityName);

  if (!normalizedQuery) return true;

  // 1. Direct normalized match (includes partial)
  if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
    return true;
  }

  // 2. Check aliases
  const aliases = cityAliases[cityName] || [];
  for (const alias of aliases) {
    const normalizedAlias = normalizeString(alias);
    if (normalizedAlias.includes(normalizedQuery) || normalizedQuery.includes(normalizedAlias)) {
      return true;
    }
  }

  // 3. Levenshtein distance for close typos (threshold of 2 for short queries, 3 for longer)
  const threshold = normalizedQuery.length <= 5 ? 2 : 3;
  if (levenshteinDistance(normalizedName, normalizedQuery) <= threshold) {
    return true;
  }

  // 4. Check if any word in the city name starts with the query
  const cityWords = cityName.toLowerCase().split(/[\s'-]+/);
  for (const word of cityWords) {
    if (word.startsWith(normalizedQuery) || normalizedQuery.startsWith(word)) {
      return true;
    }
  }

  return false;
}

/**
 * Filter an array of city objects using fuzzy matching
 * Works with any object that has a 'name' property
 */
export function matchCities<T extends { name: string }>(
  searchQuery: string,
  cities: T[]
): T[] {
  if (!searchQuery.trim()) return cities;

  return cities.filter(city => cityMatchesQuery(city.name, searchQuery));
}

/**
 * Get alternate spellings/keywords for a city (useful for cmdk)
 */
export function getCityKeywords(cityName: string): string[] {
  return cityAliases[cityName] || [];
}
