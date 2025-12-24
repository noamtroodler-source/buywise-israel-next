import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, FileDown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCities } from '@/hooks/useCities';
import { useAllCanonicalMetrics, CanonicalMetrics } from '@/hooks/useCanonicalMetrics';

interface CityAuditRow {
  slug: string;
  name: string;
  canonical: CanonicalMetrics | null;
  dbAvgPriceSqm: number | null;
  dbMedianPrice: number | null;
  dbYoyChange: number | null;
  dbArnonaRate: number | null;
  discrepancies: string[];
}

export default function AdminAccuracyAudit() {
  const { data: cities = [], isLoading: citiesLoading, refetch: refetchCities } = useCities();
  const { data: canonicalMetrics = [], isLoading: metricsLoading, refetch: refetchMetrics } = useAllCanonicalMetrics();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const auditData = useMemo<CityAuditRow[]>(() => {
    if (!cities.length) return [];

    return cities.map(city => {
      const canonical = canonicalMetrics.find(cm => cm.city_slug === city.slug) || null;
      const discrepancies: string[] = [];

      // Check for discrepancies between canonical and DB
      if (canonical) {
        if (canonical.average_price_sqm !== null && city.average_price_sqm !== null) {
          const diff = Math.abs((canonical.average_price_sqm - city.average_price_sqm) / canonical.average_price_sqm * 100);
          if (diff > 5) discrepancies.push(`Avg Price/sqm: Canonical ₪${canonical.average_price_sqm.toLocaleString()} vs DB ₪${city.average_price_sqm.toLocaleString()}`);
        } else if (canonical.average_price_sqm !== null && city.average_price_sqm === null) {
          discrepancies.push(`Avg Price/sqm: Missing in DB (Canonical: ₪${canonical.average_price_sqm.toLocaleString()})`);
        }

        if (canonical.median_apartment_price !== null && city.median_apartment_price !== null) {
          const diff = Math.abs((canonical.median_apartment_price - city.median_apartment_price) / canonical.median_apartment_price * 100);
          if (diff > 5) discrepancies.push(`Median Price: Canonical ₪${canonical.median_apartment_price.toLocaleString()} vs DB ₪${city.median_apartment_price.toLocaleString()}`);
        } else if (canonical.median_apartment_price !== null && city.median_apartment_price === null) {
          discrepancies.push(`Median Price: Missing in DB (Canonical: ₪${canonical.median_apartment_price.toLocaleString()})`);
        }

        if (canonical.yoy_price_change !== null && city.yoy_price_change !== null) {
          const diff = Math.abs(canonical.yoy_price_change - city.yoy_price_change);
          if (diff > 1) discrepancies.push(`YoY Change: Canonical ${canonical.yoy_price_change}% vs DB ${city.yoy_price_change}%`);
        } else if (canonical.yoy_price_change !== null && city.yoy_price_change === null) {
          discrepancies.push(`YoY Change: Missing in DB (Canonical: ${canonical.yoy_price_change}%)`);
        }

        if (canonical.arnona_rate_sqm !== null && city.arnona_rate_sqm !== null) {
          const diff = Math.abs(canonical.arnona_rate_sqm - city.arnona_rate_sqm);
          if (diff > 5) discrepancies.push(`Arnona Rate: Canonical ₪${canonical.arnona_rate_sqm} vs DB ₪${city.arnona_rate_sqm}`);
        } else if (canonical.arnona_rate_sqm !== null && city.arnona_rate_sqm === null) {
          discrepancies.push(`Arnona Rate: Missing in DB (Canonical: ₪${canonical.arnona_rate_sqm})`);
        }
      } else {
        discrepancies.push('No canonical metrics found for this city');
      }

      return {
        slug: city.slug,
        name: city.name,
        canonical,
        dbAvgPriceSqm: city.average_price_sqm,
        dbMedianPrice: city.median_apartment_price,
        dbYoyChange: city.yoy_price_change,
        dbArnonaRate: city.arnona_rate_sqm,
        discrepancies,
      };
    }).sort((a, b) => b.discrepancies.length - a.discrepancies.length);
  }, [cities, canonicalMetrics]);

  const summary = useMemo(() => {
    const total = auditData.length;
    const withIssues = auditData.filter(r => r.discrepancies.length > 0).length;
    const perfect = total - withIssues;
    return { total, withIssues, perfect };
  }, [auditData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchCities(), refetchMetrics()]);
    setIsRefreshing(false);
  };

  const exportToCSV = () => {
    const headers = ['City', 'Slug', 'Canonical Avg/sqm', 'DB Avg/sqm', 'Canonical Median', 'DB Median', 'Canonical YoY', 'DB YoY', 'Discrepancies'];
    const rows = auditData.map(row => [
      row.name,
      row.slug,
      row.canonical?.average_price_sqm ?? 'N/A',
      row.dbAvgPriceSqm ?? 'N/A',
      row.canonical?.median_apartment_price ?? 'N/A',
      row.dbMedianPrice ?? 'N/A',
      row.canonical?.yoy_price_change ?? 'N/A',
      row.dbYoyChange ?? 'N/A',
      row.discrepancies.join('; ') || 'None',
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accuracy-audit-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const isLoading = citiesLoading || metricsLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Accuracy Audit</h2>
          <p className="text-muted-foreground">Compare canonical research data vs database values for all 34 cities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Total Cities</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{summary.perfect}</div>
              <div className="text-sm text-muted-foreground">No Issues</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{summary.withIssues}</div>
              <div className="text-sm text-muted-foreground">With Discrepancies</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>City-by-City Audit</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Avg Price/sqm</TableHead>
                    <TableHead>Median Price</TableHead>
                    <TableHead>YoY Change</TableHead>
                    <TableHead>Discrepancies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData.map(row => (
                    <TableRow key={row.slug} className={row.discrepancies.length > 0 ? 'bg-red-50/50' : ''}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        {row.discrepancies.length === 0 ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {row.discrepancies.length} issue{row.discrepancies.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="text-foreground">Canonical: {row.canonical?.average_price_sqm ? `₪${row.canonical.average_price_sqm.toLocaleString()}` : 'N/A'}</div>
                          <div className="text-muted-foreground">DB: {row.dbAvgPriceSqm ? `₪${row.dbAvgPriceSqm.toLocaleString()}` : 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="text-foreground">Canonical: {row.canonical?.median_apartment_price ? `₪${(row.canonical.median_apartment_price / 1000000).toFixed(2)}M` : 'N/A'}</div>
                          <div className="text-muted-foreground">DB: {row.dbMedianPrice ? `₪${(row.dbMedianPrice / 1000000).toFixed(2)}M` : 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div className="text-foreground">Canonical: {row.canonical?.yoy_price_change !== null ? `${row.canonical.yoy_price_change}%` : 'N/A'}</div>
                          <div className="text-muted-foreground">DB: {row.dbYoyChange !== null ? `${row.dbYoyChange}%` : 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {row.discrepancies.length > 0 ? (
                          <ul className="text-xs text-red-600 space-y-1">
                            {row.discrepancies.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
