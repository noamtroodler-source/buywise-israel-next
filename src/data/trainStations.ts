/**
 * Israel Railways train station data
 * Data source: Israel Railways official stations
 */

export interface TrainStation {
  id: string;
  name: string;
  nameHe: string;
  latitude: number;
  longitude: number;
  lines: string[];
}

export const TRAIN_STATIONS: TrainStation[] = [
  // Tel Aviv Area
  {
    id: 'tlv-hashalom',
    name: 'Tel Aviv HaShalom',
    nameHe: 'תל אביב השלום',
    latitude: 32.0723,
    longitude: 34.7925,
    lines: ['Coastal Line', 'Ayalon Line'],
  },
  {
    id: 'tlv-savidor',
    name: 'Tel Aviv Savidor Center',
    nameHe: 'תל אביב סבידור מרכז',
    latitude: 32.0867,
    longitude: 34.7981,
    lines: ['Coastal Line', 'Ayalon Line'],
  },
  {
    id: 'tlv-university',
    name: 'Tel Aviv University',
    nameHe: 'אוניברסיטת תל אביב',
    latitude: 32.1133,
    longitude: 34.8044,
    lines: ['Coastal Line'],
  },
  {
    id: 'tlv-hahagana',
    name: 'Tel Aviv HaHagana',
    nameHe: 'תל אביב ההגנה',
    latitude: 32.0561,
    longitude: 34.7817,
    lines: ['Ayalon Line'],
  },
  // Ben Gurion Airport
  {
    id: 'ben-gurion',
    name: 'Ben Gurion Airport',
    nameHe: 'נמל התעופה בן גוריון',
    latitude: 32.0012,
    longitude: 34.8697,
    lines: ['Airport Line'],
  },
  // Jerusalem
  {
    id: 'jerusalem-navon',
    name: 'Jerusalem Yitzhak Navon',
    nameHe: 'ירושלים יצחק נבון',
    latitude: 31.7878,
    longitude: 35.2033,
    lines: ['Jerusalem Line'],
  },
  {
    id: 'jerusalem-malha',
    name: 'Jerusalem Malha',
    nameHe: 'ירושלים מלחה',
    latitude: 31.7517,
    longitude: 35.1847,
    lines: ['South Line'],
  },
  // Haifa Area
  {
    id: 'haifa-merkaz',
    name: 'Haifa Merkaz HaShmona',
    nameHe: 'חיפה מרכז השמונה',
    latitude: 32.7922,
    longitude: 35.0033,
    lines: ['Coastal Line', 'Jezreel Valley Line'],
  },
  {
    id: 'haifa-bat-galim',
    name: 'Haifa Bat Galim',
    nameHe: 'חיפה בת גלים',
    latitude: 32.8317,
    longitude: 34.9633,
    lines: ['Coastal Line'],
  },
  {
    id: 'haifa-hof-hacarmel',
    name: 'Haifa Hof HaCarmel',
    nameHe: 'חיפה חוף הכרמל',
    latitude: 32.7944,
    longitude: 34.9586,
    lines: ['Coastal Line'],
  },
  // Central Coastal
  {
    id: 'herzliya',
    name: 'Herzliya',
    nameHe: 'הרצליה',
    latitude: 32.1603,
    longitude: 34.8217,
    lines: ['Coastal Line'],
  },
  {
    id: 'netanya',
    name: 'Netanya',
    nameHe: 'נתניה',
    latitude: 32.3233,
    longitude: 34.8483,
    lines: ['Coastal Line'],
  },
  {
    id: 'hadera-west',
    name: 'Hadera West',
    nameHe: 'חדרה מערב',
    latitude: 32.4489,
    longitude: 34.8831,
    lines: ['Coastal Line'],
  },
  {
    id: 'binyamina',
    name: 'Binyamina',
    nameHe: 'בנימינה',
    latitude: 32.5175,
    longitude: 34.9464,
    lines: ['Coastal Line'],
  },
  // Sharon Area
  {
    id: 'kfar-saba-nordau',
    name: 'Kfar Saba Nordau',
    nameHe: 'כפר סבא נורדאו',
    latitude: 32.1858,
    longitude: 34.9125,
    lines: ['Eastern Line'],
  },
  {
    id: 'raanana-west',
    name: "Ra'anana West",
    nameHe: 'רעננה מערב',
    latitude: 32.1811,
    longitude: 34.8567,
    lines: ['Eastern Line'],
  },
  {
    id: 'raanana-south',
    name: "Ra'anana South",
    nameHe: 'רעננה דרום',
    latitude: 32.1667,
    longitude: 34.8667,
    lines: ['Eastern Line'],
  },
  {
    id: 'hod-hasharon-sokolov',
    name: 'Hod HaSharon Sokolov',
    nameHe: 'הוד השרון סוקולוב',
    latitude: 32.1517,
    longitude: 34.8917,
    lines: ['Eastern Line'],
  },
  // Dan Region
  {
    id: 'petah-tikva-sgula',
    name: 'Petah Tikva Sgula',
    nameHe: 'פתח תקווה סגולה',
    latitude: 32.0914,
    longitude: 34.8772,
    lines: ['Ayalon Line'],
  },
  {
    id: 'petah-tikva-kiryat-arie',
    name: 'Petah Tikva Kiryat Arie',
    nameHe: 'פתח תקווה קריית אריה',
    latitude: 32.1000,
    longitude: 34.8583,
    lines: ['Eastern Line'],
  },
  {
    id: 'bnei-brak',
    name: 'Bnei Brak',
    nameHe: 'בני ברק',
    latitude: 32.0789,
    longitude: 34.8381,
    lines: ['Ayalon Line'],
  },
  {
    id: 'ramat-gan',
    name: 'Ramat Gan',
    nameHe: 'רמת גן',
    latitude: 32.0844,
    longitude: 34.8125,
    lines: ['Ayalon Line'],
  },
  // South Tel Aviv Area
  {
    id: 'holon-junction',
    name: 'Holon Junction',
    nameHe: 'צומת חולון',
    latitude: 32.0233,
    longitude: 34.7778,
    lines: ['Ayalon Line'],
  },
  {
    id: 'bat-yam-yoseftal',
    name: 'Bat Yam Yoseftal',
    nameHe: 'בת ים יוספטל',
    latitude: 32.0183,
    longitude: 34.7517,
    lines: ['Ayalon Line'],
  },
  {
    id: 'bat-yam-komemiyut',
    name: 'Bat Yam Komemiyut',
    nameHe: 'בת ים קוממיות',
    latitude: 32.0100,
    longitude: 34.7500,
    lines: ['Ayalon Line'],
  },
  // Modi'in Area
  {
    id: 'modiin-merkaz',
    name: "Modi'in Center",
    nameHe: 'מודיעין מרכז',
    latitude: 31.8922,
    longitude: 35.0111,
    lines: ['Modi\'in Line'],
  },
  {
    id: 'modiin-outskirts',
    name: "Modi'in Outskirts",
    nameHe: 'מודיעין שבילי',
    latitude: 31.8833,
    longitude: 35.0333,
    lines: ['Modi\'in Line'],
  },
  // Lod/Ramle Area
  {
    id: 'lod',
    name: 'Lod',
    nameHe: 'לוד',
    latitude: 31.9506,
    longitude: 34.8756,
    lines: ['South Line', 'Modi\'in Line'],
  },
  {
    id: 'ramla',
    name: 'Ramla',
    nameHe: 'רמלה',
    latitude: 31.9317,
    longitude: 34.8633,
    lines: ['South Line'],
  },
  // Rehovot Area
  {
    id: 'rehovot-e',
    name: 'Rehovot',
    nameHe: 'רחובות',
    latitude: 31.8939,
    longitude: 34.8097,
    lines: ['South Line'],
  },
  // Southern Coastal
  {
    id: 'ashdod-ad-halom',
    name: 'Ashdod Ad Halom',
    nameHe: 'אשדוד עד הלום',
    latitude: 31.7839,
    longitude: 34.6567,
    lines: ['South Line'],
  },
  {
    id: 'ashkelon',
    name: 'Ashkelon',
    nameHe: 'אשקלון',
    latitude: 31.6786,
    longitude: 34.5694,
    lines: ['South Line'],
  },
  {
    id: 'yavne-east',
    name: 'Yavne East',
    nameHe: 'יבנה מזרח',
    latitude: 31.8706,
    longitude: 34.7494,
    lines: ['South Line'],
  },
  {
    id: 'yavne-west',
    name: 'Yavne West',
    nameHe: 'יבנה מערב',
    latitude: 31.8606,
    longitude: 34.7294,
    lines: ['South Line'],
  },
  // Beer Sheva
  {
    id: 'beer-sheva-merkaz',
    name: 'Beer Sheva Center',
    nameHe: 'באר שבע מרכז',
    latitude: 31.2431,
    longitude: 34.7992,
    lines: ['South Line'],
  },
  {
    id: 'beer-sheva-north',
    name: 'Beer Sheva North/University',
    nameHe: 'באר שבע צפון/אוניברסיטה',
    latitude: 31.2622,
    longitude: 34.8000,
    lines: ['South Line'],
  },
  // Northern
  {
    id: 'acre',
    name: 'Acre (Akko)',
    nameHe: 'עכו',
    latitude: 32.9281,
    longitude: 35.0778,
    lines: ['Coastal Line'],
  },
  {
    id: 'nahariya',
    name: 'Nahariya',
    nameHe: 'נהריה',
    latitude: 33.0069,
    longitude: 35.0914,
    lines: ['Coastal Line'],
  },
  // Jezreel Valley
  {
    id: 'afula',
    name: 'Afula R. Eitan',
    nameHe: 'עפולה ר. איתן',
    latitude: 32.6069,
    longitude: 35.2869,
    lines: ['Jezreel Valley Line'],
  },
  {
    id: 'beit-shean',
    name: 'Beit She\'an',
    nameHe: 'בית שאן',
    latitude: 32.4992,
    longitude: 35.4992,
    lines: ['Jezreel Valley Line'],
  },
];
