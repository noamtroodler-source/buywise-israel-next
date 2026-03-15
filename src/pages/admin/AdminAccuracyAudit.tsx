import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCities } from '@/hooks/useCities';

interface CityAuditRow {
  slug: string;
  name: string;
  avgPriceSqm: number | null;
  medianPrice: number | null;
  yoyChange: number | null;
  arnonaRate: number | null;
  issues: string[];
}

export default function AdminAccuracyAudit() {
  const { data: cities = [], isLoading } = useCities();

  const auditData = useMemo<CityAuditRow[]>(() => {
    if (!cities.length) return [];

    return cities.map(city => {
      const issues: string[] = [];

      // Check for missing critical data
      if (!city.average_price_sqm) issues.push('Missing avg price/sqm');
      if (!city.median_apartment_price) issues.push('Missing median price');
      if (!city.yoy_price_change && city.yoy_price_change !== 0) issues.push('Missing YoY change');
      if (!city.arnona_rate_sqm) issues.push('Missing arnona rate');
      if (!city.rental_3_room_min) issues.push('Missing rental data');

      return {
        slug: city.slug,
        name: city.name,
        avgPriceSqm: city.average_price_sqm,
        medianPrice: city.median_apartment_price,
        yoyChange: city.yoy_price_change,
        arnonaRate: city.arnona_rate_sqm,
        issues,
      };
    }).sort((a, b) => b.issues.length - a.issues.length);
  }, [cities]);

  const summary = useMemo(() => {
    const total = auditData.length;
    const withIssues = auditData.filter(r => r.issues.length > 0).length;
    const perfect = total - withIssues;
    return { total, withIssues, perfect };
  }, [auditData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Data Completeness Audit</h2>
        <p className="text-muted-foreground">Check cities table data completeness across all cities</p>
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
              <div className="text-3xl font-bold text-primary">{summary.perfect}</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{summary.withIssues}</div>
              <div className="text-sm text-muted-foreground">Missing Data</div>
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
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData.map(row => (
                    <TableRow key={row.slug} className={row.issues.length > 0 ? 'bg-red-50/50' : ''}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        {row.issues.length === 0 ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {row.issues.length} issue{row.issues.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.avgPriceSqm ? `₪${row.avgPriceSqm.toLocaleString()}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {row.medianPrice ? `₪${(row.medianPrice / 1000000).toFixed(2)}M` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {row.yoyChange !== null ? `${row.yoyChange}%` : 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {row.issues.length > 0 ? (
                          <ul className="text-xs text-red-600 space-y-1">
                            {row.issues.map((d, i) => (
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
