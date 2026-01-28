export interface SoldTransaction {
  id: string;
  sold_price: number;
  sold_date: string;
  property_type: string | null;
  rooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  year_built: number | null;
  asset_condition: string | null;
  is_new_construction: boolean;
  address: string;
  city: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  gush_helka: string | null;
  price_per_sqm: number | null;
  source: string;
  raw_data: Record<string, unknown> | null;
  geocoded_at: string | null;
  geocode_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface SoldDataImport {
  id: string;
  city: string;
  source: string;
  records_imported: number;
  records_geocoded: number;
  records_failed: number;
  date_range_start: string | null;
  date_range_end: string | null;
  imported_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface NearbySoldComp {
  id: string;
  sold_price: number;
  sold_date: string;
  rooms: number | null;
  size_sqm: number | null;
  property_type: string | null;
  price_per_sqm: number | null;
  distance_meters: number;
  is_same_building: boolean;
}

export interface SoldDataAggregate {
  city: string;
  avgPriceSqm: number;
  medianPrice: number;
  transactionCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}
