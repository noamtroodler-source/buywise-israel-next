import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle, AlertTriangle, FileText, Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RawRow {
  cityNameEng: string;
  streetNameEng: string;
  houseNum: string;
  gushNum: string;
  parcelNum: string;
  dealDateClean: string;
  dealAmount: string;
  assetArea: string;
  assetRoomNum: string;
  floorNo: string;
  propertyTypeDescription: string;
  dealNatureDescription: string;
  neighborhood: string;
  dealId: string;
  [key: string]: string;
}

interface CleanedTransaction {
  sold_price: number;
  sold_date: string;
  property_type: string | null;
  rooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  address: string;
  city: string;
  neighborhood: string | null;
  gush_helka: string | null;
  deal_id: string | null;
  raw_data: Record<string, unknown>;
}

interface FilterStats {
  total: number;
  nonResidential: number;
  newConstruction: number;
  priceOutlier: number;
  sizeOutlier: number;
  priceSqmOutlier: number;
  zeroRooms: number;
  unknownCity: number;
  duplicateDealId: number;
  valid: number;
}

const HEBREW_FLOOR_MAP: Record<string, number> = {
  "קרקע": 0, "ראשונה": 1, "שניה": 2, "שנייה": 2, "שלישית": 3,
  "רביעית": 4, "חמישית": 5, "שישית": 6, "שביעית": 7, "שמינית": 8,
  "תשיעית": 9, "עשירית": 10, "אחת עשרה": 11, "שתים עשרה": 12,
  "שלוש עשרה": 13, "ארבע עשרה": 14, "חמש עשרה": 15, "שש עשרה": 16,
  "שבע עשרה": 17, "שמונה עשרה": 18, "תשע עשרה": 19, "עשרים": 20,
};

const PROPERTY_TYPE_MAP: Record<string, string> = {
  "דירה": "apartment", "דירה בבית קומות": "apartment",
  "דירת גן": "garden_apartment", "פנטהאוז": "penthouse",
  "דופלקס": "duplex", "בית פרטי": "house", "וילה": "villa",
  "קוטג'": "cottage", "דירת גג": "rooftop_apartment",
  "בית בודד": "house", "דו משפחתי": "duplex",
  "דירה בבית בודד": "house",
};

const NON_RESIDENTIAL_KEYWORDS = [
  "חניה", "מחסן", "מחסנים", "קרקע", "ללא תיכנון", "משרד", "חנות", "מגרש", "תעשיה",
  "קרקע למגורים", "מסחרי", "תעשייתי",
];
const NON_RESIDENTIAL_PROP_TYPES = ["קרקע", "בנין"]; // "בנין" = commercial building
const NEW_CONSTRUCTION_KEYWORDS = ["מכירה ראשונה", "קבלן", "חברה קבלנית"];

function parseFloor(floorStr: string): number | null {
  if (!floorStr) return null;
  const cleaned = floorStr.replace(/[^\u0590-\u05FF\w\s]/g, "").trim();
  if (HEBREW_FLOOR_MAP[cleaned] !== undefined) return HEBREW_FLOOR_MAP[cleaned];
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function normalizePropertyType(desc: string): string | null {
  if (!desc) return null;
  return PROPERTY_TYPE_MAP[desc] || PROPERTY_TYPE_MAP[desc.trim()] || desc.toLowerCase();
}

export default function ImportGovMapData() {
  const [file, setFile] = useState<File | null>(null);
  const [validCities, setValidCities] = useState<string[]>([]);
  const [filterStats, setFilterStats] = useState<FilterStats | null>(null);
  const [cleanedRows, setCleanedRows] = useState<CleanedTransaction[]>([]);
  const [stage, setStage] = useState<"idle" | "parsing" | "parsed" | "uploading" | "done" | "geocoding">("idle");
  const [uploadProgress, setUploadProgress] = useState({ batch: 0, total: 0, imported: 0, failed: 0, skipped: 0 });
  const [geocodeProgress, setGeocodeProgress] = useState({ city: "", done: 0, total: 0 });
  const abortRef = useRef(false);
  const { toast } = useToast();

  // Load valid cities from DB
  const loadCities = useCallback(async () => {
    const { data } = await supabase.from("cities").select("name");
    if (data) {
      const names = data.map((c) => c.name.replace(/['']/g, "").toLowerCase());
      setValidCities(names);
      return data.map((c) => c.name);
    }
    return [];
  }, []);

  const parseCSV = useCallback((text: string): RawRow[] => {
    const lines = text.split("\n");
    const headers = lines[0].replace(/^\uFEFF/, "").split(",").map((h) => h.trim());
    const rows: RawRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(",");
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = (values[idx] || "").trim(); });
      rows.push(row as unknown as RawRow);
    }
    return rows;
  }, []);

  const cleanAndFilter = useCallback(async () => {
    if (!file) return;
    setStage("parsing");

    const cityNames = await loadCities();
    const cityLookup = new Map<string, string>();
    cityNames.forEach((name) => {
      cityLookup.set(name.replace(/['']/g, "").toLowerCase(), name);
    });

    const text = await file.text();
    const rawRows = parseCSV(text);

    const stats: FilterStats = {
      total: rawRows.length,
      nonResidential: 0,
      newConstruction: 0,
      priceOutlier: 0,
      sizeOutlier: 0,
      priceSqmOutlier: 0,
      zeroRooms: 0,
      unknownCity: 0,
      duplicateDealId: 0,
      valid: 0,
    };

    const seenDealIds = new Set<string>();
    const cleaned: CleanedTransaction[] = [];

    for (const row of rawRows) {
      const dealNature = row.dealNatureDescription || "";
      const propType = row.propertyTypeDescription || "";

      // 1. Non-residential filter (check both dealNature AND propertyType)
      if (
        NON_RESIDENTIAL_KEYWORDS.some((kw) => dealNature.includes(kw) || propType.includes(kw)) ||
        NON_RESIDENTIAL_PROP_TYPES.some((kw) => propType === kw)
      ) {
        stats.nonResidential++;
        continue;
      }

      // 2. New construction filter — keyword match OR heuristic (both fields empty = unclassified bulk developer sale)
      if (
        NEW_CONSTRUCTION_KEYWORDS.some((kw) => dealNature.includes(kw)) ||
        (!dealNature && !propType) // Both empty = likely developer/new construction batch
      ) {
        stats.newConstruction++;
        continue;
      }

      // 3. Price outlier — raised floor to ₪200k
      const price = parseFloat(row.dealAmount);
      if (isNaN(price) || price < 400000) {
        stats.priceOutlier++;
        continue;
      }

      // 4. Size outlier
      const size = parseFloat(row.assetArea);
      if (!isNaN(size) && (size < 30 || size > 400)) {
        stats.sizeOutlier++;
        continue;
      }

      // 5. Price per sqm outlier (catch misclassified parking/storage/land)
      if (!isNaN(size) && size > 0) {
        const priceSqm = price / size;
        if (priceSqm < 3000 || priceSqm > 85000) {
          stats.priceSqmOutlier++;
          continue;
        }
      }

      // 6. Rooms = 0 → commercial unit
      const rooms = row.assetRoomNum ? parseFloat(row.assetRoomNum) : null;
      if (rooms !== null && rooms === 0) {
        stats.zeroRooms++;
        continue;
      }

      // 7. City validation
      const cityKey = (row.cityNameEng || "").replace(/['']/g, "").toLowerCase();
      const canonicalCity = cityLookup.get(cityKey);
      if (!canonicalCity) {
        stats.unknownCity++;
        continue;
      }

      // 8. Deduplicate by dealId
      const dealId = row.dealId || "";
      if (dealId && seenDealIds.has(dealId)) {
        stats.duplicateDealId++;
        continue;
      }
      if (dealId) seenDealIds.add(dealId);

      // 9. Build address
      const street = row.streetNameEng || "";
      const houseNum = row.houseNum || "";
      let address = street ? `${street}${houseNum ? " " + houseNum : ""}` : "";
      if (!address && row.gushNum) {
        address = `${row.gushNum}-${row.parcelNum || "0"}`;
      }
      if (!address) address = "Unknown";

      // Parse floor with quality handling
      let floor = parseFloor(row.floorNo);
      if (floor === 0 && (!size || size === 0)) floor = null; // Known flaw

      cleaned.push({
        sold_price: price,
        sold_date: row.dealDateClean,
        property_type: normalizePropertyType(propType || dealNature),
        rooms: rooms,
        size_sqm: !isNaN(size) ? size : null,
        floor,
        address,
        city: canonicalCity,
        neighborhood: row.neighborhood || null,
        gush_helka: row.gushNum ? `${row.gushNum}-${row.parcelNum || "0"}` : null,
        deal_id: dealId || null,
        raw_data: { ...row },
      });
    }

    stats.valid = cleaned.length;
    setFilterStats(stats);
    setCleanedRows(cleaned);
    setStage("parsed");
  }, [file, loadCities, parseCSV]);

  const uploadBatches = useCallback(async () => {
    if (cleanedRows.length === 0) return;
    setStage("uploading");
    abortRef.current = false;

    const BATCH_SIZE = 500;
    const totalBatches = Math.ceil(cleanedRows.length / BATCH_SIZE);
    let totalImported = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (let i = 0; i < cleanedRows.length; i += BATCH_SIZE) {
      if (abortRef.current) break;
      const batch = cleanedRows.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      setUploadProgress({ batch: batchNum, total: totalBatches, imported: totalImported, failed: totalFailed, skipped: totalSkipped });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke("import-govmap-data", {
          body: { transactions: batch, batch_index: batchNum, total_batches: totalBatches },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });

        if (res.error) {
          totalFailed += batch.length;
        } else {
          totalImported += res.data.imported || 0;
          totalFailed += res.data.failed || 0;
          totalSkipped += res.data.skipped || 0;
        }
      } catch {
        totalFailed += batch.length;
      }
    }

    setUploadProgress({ batch: totalBatches, total: totalBatches, imported: totalImported, failed: totalFailed, skipped: totalSkipped });

    // Log import summary
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const dates = cleanedRows.map((r) => r.sold_date).sort();
      await supabase.from("sold_data_imports" as any).insert({
        city: "All Cities",
        source: "govmap_gov_il",
        records_imported: totalImported,
        records_geocoded: 0,
        records_failed: totalFailed,
        date_range_start: dates[0],
        date_range_end: dates[dates.length - 1],
        imported_by: session?.user?.id,
        notes: `GovMap bulk import: ${totalImported} imported, ${totalSkipped} skipped (duplicates), ${totalFailed} failed`,
      });
    } catch {}

    setStage("done");
    toast({
      title: "Import Complete",
      description: `${totalImported} imported, ${totalSkipped} skipped, ${totalFailed} failed`,
    });
  }, [cleanedRows, toast]);

  const startGeocoding = useCallback(async () => {
    setStage("geocoding");
    const cities = [...new Set(cleanedRows.map((r) => r.city))];
    const total = cities.length;

    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      setGeocodeProgress({ city, done: i, total });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.functions.invoke("geocode-sold-transaction", {
          body: { city, limit: 100 },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
      } catch (e) {
        console.error(`Geocoding failed for ${city}:`, e);
      }
    }

    setGeocodeProgress({ city: "Done", done: total, total });
    toast({ title: "Geocoding Complete", description: `Processed ${total} cities` });
  }, [cleanedRows, toast]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Import GovMap Transaction Data</h1>
      <p className="text-muted-foreground">
        Upload the govmap_transactions_final.csv file. The system will clean, validate, and import residential resale transactions.
      </p>

      {/* Step 1: File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Step 1: Select CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setStage("idle"); setFilterStats(null); }}
          />
          {file && stage === "idle" && (
            <Button onClick={cleanAndFilter}>
              <Upload className="mr-2 h-4 w-4" /> Parse & Clean
            </Button>
          )}
          {stage === "parsing" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Parsing and cleaning...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Filter Results */}
      {filterStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Step 2: Cleaning Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <Stat label="Total Rows" value={filterStats.total} />
              <Stat label="Non-Residential" value={filterStats.nonResidential} negative />
              <Stat label="New Construction" value={filterStats.newConstruction} negative />
              <Stat label="Price < ₪200k" value={filterStats.priceOutlier} negative />
              <Stat label="Size Outlier" value={filterStats.sizeOutlier} negative />
              <Stat label="₪/sqm Outlier" value={filterStats.priceSqmOutlier} negative />
              <Stat label="Zero Rooms" value={filterStats.zeroRooms} negative />
              <Stat label="Unknown City" value={filterStats.unknownCity} negative />
              <Stat label="Duplicate dealId" value={filterStats.duplicateDealId} negative />
              <Stat label="Valid to Import" value={filterStats.valid} highlight />
            </div>
            {stage === "parsed" && (
              <Button className="mt-4" onClick={uploadBatches}>
                Upload {filterStats.valid.toLocaleString()} Transactions
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Upload Progress */}
      {(stage === "uploading" || stage === "done") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {stage === "uploading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5 text-primary" />}
              Step 3: Upload Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(uploadProgress.batch / uploadProgress.total) * 100} />
            <div className="text-sm text-muted-foreground">
              Batch {uploadProgress.batch} / {uploadProgress.total}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Stat label="Imported" value={uploadProgress.imported} highlight />
              <Stat label="Skipped (dups)" value={uploadProgress.skipped} />
              <Stat label="Failed" value={uploadProgress.failed} negative />
            </div>
            {stage === "done" && (
              <Button variant="outline" className="mt-2" onClick={startGeocoding}>
                <MapPin className="mr-2 h-4 w-4" /> Start Geocoding
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Geocoding */}
      {stage === "geocoding" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Step 4: Geocoding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={geocodeProgress.total > 0 ? (geocodeProgress.done / geocodeProgress.total) * 100 : 0} />
            <p className="text-sm text-muted-foreground">
              Processing: {geocodeProgress.city} ({geocodeProgress.done}/{geocodeProgress.total} cities)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, negative, highlight }: { label: string; value: number; negative?: boolean; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${negative && value > 0 ? "text-destructive" : ""} ${highlight ? "text-primary" : ""}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
