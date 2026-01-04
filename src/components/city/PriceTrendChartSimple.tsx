import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MarketData } from "@/types/projects";

interface PriceTrendChartSimpleProps {
  marketData: MarketData[];
  cityName: string;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PriceTrendChartSimple({ marketData, cityName }: PriceTrendChartSimpleProps) {
  const [period, setPeriod] = useState<"6m" | "1y" | "all">("6m");
  const normalizedCityName = cityName.trim();

  const monthly = useMemo(() => {
    return marketData
      .filter((d) => d.data_type === "monthly" && d.month != null)
      .sort((a, b) => {
        const ak = `${a.year}-${String(a.month).padStart(2, "0")}`;
        const bk = `${b.year}-${String(b.month).padStart(2, "0")}`;
        return ak.localeCompare(bk);
      });
  }, [marketData]);

  const chartData = useMemo(() => {
    return monthly.map((d) => ({
      name: `${months[(d.month || 1) - 1]} ${d.year}`,
      sortKey: `${d.year}-${String(d.month || 1).padStart(2, "0")}`,
      value: d.average_price_sqm || 0,
    }));
  }, [monthly]);

  const filteredData = useMemo(() => {
    if (period === "6m") return chartData.slice(-6);
    if (period === "1y") return chartData.slice(-12);
    return chartData;
  }, [chartData, period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const v = payload?.[0]?.value;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
        <p className="font-medium text-foreground mb-2 text-sm border-b border-border pb-1">{label}</p>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{normalizedCityName}</span>
          <span className="font-medium text-foreground">₪{typeof v === "number" ? v.toLocaleString() : v}</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
      <Card className="border-border/50 h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              {`Price Trend in ${cityName}`}
            </CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList className="bg-muted">
                <TabsTrigger value="6m" className="text-xs">
                  6M
                </TabsTrigger>
                <TabsTrigger value="1y" className="text-xs">
                  1Y
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="h-[300px] w-full">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={{ className: "stroke-border" }}
                    tickLine={{ className: "stroke-border" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(value) => `₪${(value / 1000).toFixed(0)}K`}
                    axisLine={{ className: "stroke-border" }}
                    tickLine={{ className: "stroke-border" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={normalizedCityName}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No price trend data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
