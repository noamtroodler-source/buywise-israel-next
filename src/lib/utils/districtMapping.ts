/**
 * CBS District Mapping for Israeli Cities
 * 
 * Maps individual cities to their CBS (Central Bureau of Statistics) district.
 * Quarterly price indices are published at the district level, not city level.
 * 
 * Districts:
 * - Tel Aviv District: Greater Tel Aviv metropolitan area
 * - Central District: Sharon region and central cities
 * - Haifa District: Northern coastal and Carmel region
 * - Jerusalem District: Jerusalem and surrounding communities
 * - Southern District: Negev and southern coastal cities
 */

export const CITY_TO_DISTRICT: Record<string, string> = {
  // Tel Aviv District - Greater Tel Aviv metropolitan area
  'Tel Aviv': 'Tel Aviv District',
  'Ramat Gan': 'Tel Aviv District',
  'Givatayim': 'Tel Aviv District',
  'Bat Yam': 'Tel Aviv District',
  'Holon': 'Tel Aviv District',
  'Petah Tikva': 'Tel Aviv District',
  'Hod HaSharon': 'Tel Aviv District',
  'Kfar Saba': 'Tel Aviv District',
  "Ra'anana": 'Tel Aviv District',
  'Herzliya': 'Tel Aviv District',
  'Givat Shmuel': 'Tel Aviv District',
  'Rosh HaAyin': 'Tel Aviv District',
  
  // Central District - Sharon region and central cities
  "Modi'in": 'Central District',
  'Netanya': 'Central District',
  'Hadera': 'Central District',
  'Pardes Hanna': 'Central District',
  'Zichron Yaakov': 'Central District',
  'Caesarea': 'Central District',
  'Shoham': 'Central District',
  
  // Haifa District - Haifa metro and Carmel region
  'Haifa': 'Haifa District',
  'Kiryat Tivon': 'Haifa District',
  
  // Northern District - Galilee and northern coastal cities
  'Nahariya': 'Northern District',
  'Yokneam': 'Northern District',
  
  // Jerusalem District - Jerusalem and surrounding communities
  'Jerusalem': 'Jerusalem District',
  'Mevaseret Zion': 'Jerusalem District',
  'Givat Zeev': 'Jerusalem District',
  'Beit Shemesh': 'Jerusalem District',
  "Ma'ale Adumim": 'Jerusalem District',
  'Efrat': 'Jerusalem District',
  'Gush Etzion': 'Jerusalem District',
  
  // Southern District - Negev and southern coastal cities
  'Beer Sheva': 'Southern District',
  'Ashkelon': 'Southern District',
  'Ashdod': 'Southern District',
  'Eilat': 'Southern District',
};

export const DISTRICTS = [
  'Tel Aviv District',
  'Central District',
  'Haifa District',
  'Northern District',
  'Jerusalem District',
  'Southern District',
] as const;

export type CBSDistrict = typeof DISTRICTS[number];

/**
 * Get the CBS district for a given city name
 */
export function getDistrictForCity(cityName: string): string | null {
  return CITY_TO_DISTRICT[cityName] || null;
}

/**
 * Get all cities in a given district
 */
export function getCitiesInDistrict(district: string): string[] {
  return Object.entries(CITY_TO_DISTRICT)
    .filter(([_, d]) => d === district)
    .map(([city]) => city);
}
