import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No projects to compare
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 6).map(project => ({
    ...project,
    name: project.name.length > 20 ? project.name.substring(0, 17) + '...' : project.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Project Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" radius={[0, 4, 4, 0]} />
              <Bar dataKey="inquiries" fill="hsl(var(--chart-2))" name="Inquiries" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
