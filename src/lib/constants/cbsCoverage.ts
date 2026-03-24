/**
 * Cities where CBS does not publish city-level price statistics.
 * All price data for these cities comes from aggregated market transaction records.
 */
export const NON_CBS_CITIES = [
  'Eilat',
  'Givat Shmuel',
  'Hod HaSharon',
  'Pardes Hanna',
  'Zichron Yaakov',
  "Ma'ale Adumim",
  'Efrat',
  'Caesarea',
  "Ra'anana",
] as const;

export function isNonCbsCity(cityName: string): boolean {
  return NON_CBS_CITIES.some(
    c => c.toLowerCase() === cityName.toLowerCase()
  );
}
