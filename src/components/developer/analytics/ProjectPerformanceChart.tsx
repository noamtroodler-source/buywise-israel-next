import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Building2 } from 'lucide-react';

interface ProjectData {
  projectId: string;
  name: string;
  views: number;
  inquiries: number;
}

interface ProjectPerformanceChartProps {
  data: ProjectData[];
}

export function ProjectPerformanceChart({ data }: ProjectPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-all h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Project Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">Views and inquiries by project</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <p className="text-muted-foreground font-medium">No projects to compare</p>
              <p className="text-sm text-muted-foreground mt-1">Add projects to see performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 6).map(project => ({
    ...project,
    name: project.name.length > 15 ? project.name.substring(0, 12) + '...' : project.name,
  }));

  return (
    <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-all h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Project Comparison</CardTitle>
            <p className="text-sm text-muted-foreground">Top {chartData.length} projects by activity</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={90}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              />
              <Legend 
                wrapperStyle={{
                  paddingTop: '12px',
                }}
              />
              <Bar 
                dataKey="views" 
                fill="hsl(var(--primary))" 
                name="Views" 
                radius={[0, 6, 6, 0]} 
              />
              <Bar 
                dataKey="inquiries" 
                fill="hsl(var(--primary)/0.5)" 
                name="Inquiries" 
                radius={[0, 6, 6, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
