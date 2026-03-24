/**
 * Anglo community neighborhood tags.
 * Maps city slugs to neighborhood name fragments that indicate Anglo community presence.
 * Uses substring matching: "Ahuza" will match "Ahuza / Ramat Golda", etc.
 */

const angloTagsRaw: Record<string, string[]> = {
  jerusalem: [
    'German Colony', 'Baka', 'Rehavia', 'Katamon', 'Katamonim', 'Talbiyeh',
    'Arnona', 'Har Nof', 'Ramot', 'Sanhedria', 'Maalot Dafna', 'Ramat Eshkol',
    "Sha'arei Chesed", 'French Hill', 'Talpiot', 'Armon HaNatziv',
  ],
  'tel-aviv': ['Old North'],
  raanana: ['Neve Zemer', 'Kikar HaSharon', "Old Ra'anana", 'Central', 'West Ra\'anana'],
  herzliya: ['Herzliya Pituach', 'Nof Yam'],
  modiin: ['Buchman', 'Shikun Bet', 'Shikun Gimmel', 'Shikun Vav', 'Shikun Zayin'],
  netanya: ['Ir Yamim', 'Ramat Poleg', 'North Netanya', 'Ramat Shikma'],
  'beit-shemesh': ['RBS Alef', 'RBS Gimmel', 'RBS Dalet', 'Sheinfeld', 'RBS Bet', 'RBS Hey', 'Neve Shamir'],
  haifa: ['Ahuza', 'Denia', 'Merkaz HaCarmel'],
  efrat: ['Zayit', 'Rimon', 'Tamar', 'Dagan', 'Gefen', 'Dekel', "Te'ena"],
  'gush-etzion': ['Neve Daniel', 'Elazar', 'Alon Shvut', 'Bat Ayin', 'Tekoa'],
  'maale-adumim': ['Mitzpe Nevo'],
  caesarea: ['Caesarea'],
  'givat-shmuel': ['Central Givat Shmuel'],
  'zichron-yaakov': ['Derech Sarah', 'Hazon Ish', 'Ramat Tzvi', 'HaMoshava'],
};

/**
 * Check if a neighborhood name matches any anglo tag for a given city slug.
 * Uses case-insensitive substring matching to handle name variants like
 * "Ahuza / Ramat Golda" matching the tag "Ahuza".
 */
export function isAngloNeighborhood(citySlug: string, neighborhoodName: string): boolean {
  const tags = angloTagsRaw[citySlug];
  if (!tags) return false;
  const nameLower = neighborhoodName.toLowerCase();
  return tags.some(tag => nameLower.includes(tag.toLowerCase()));
}

/**
 * Check if a city has any anglo-tagged neighborhoods.
 */
export function cityHasAngloTags(citySlug: string): boolean {
  return citySlug in angloTagsRaw;
}
