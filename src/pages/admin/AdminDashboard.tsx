import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Home, Building2, Building, FileText, MapPin, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [
        { count: usersCount },
        { count: propertiesCount },
        { count: agentsCount },
        { count: projectsCount },
        { count: developersCount },
        { count: blogPostsCount },
        { count: citiesCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('developers').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('cities').select('*', { count: 'exact', head: true }),
      ]);

      return {
        users: usersCount || 0,
        properties: propertiesCount || 0,
        agents: agentsCount || 0,
        projects: projectsCount || 0,
        developers: developersCount || 0,
        blogPosts: blogPostsCount || 0,
        cities: citiesCount || 0,
      };
    },
  });

  const statCards = [
    { label: 'Users', value: stats?.users || 0, icon: Users, href: '/admin/users', color: 'text-blue-600' },
    { label: 'Properties', value: stats?.properties || 0, icon: Home, href: '/admin/properties', color: 'text-green-600' },
    { label: 'Agents', value: stats?.agents || 0, icon: Building2, href: '/admin/agents', color: 'text-purple-600' },
    { label: 'Projects', value: stats?.projects || 0, icon: Building, href: '/admin/projects', color: 'text-orange-600' },
    { label: 'Developers', value: stats?.developers || 0, icon: Building, href: '/admin/developers', color: 'text-pink-600' },
    { label: 'Blog Posts', value: stats?.blogPosts || 0, icon: FileText, href: '/admin/blog', color: 'text-cyan-600' },
    { label: 'Cities', value: stats?.cities || 0, icon: MapPin, href: '/admin/cities', color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Overview</h2>
        <p className="text-muted-foreground">Welcome to the admin dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              to="/admin/properties" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Home className="h-5 w-5 text-primary" />
              <span>Manage Properties</span>
            </Link>
            <Link 
              to="/admin/blog" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <FileText className="h-5 w-5 text-primary" />
              <span>Manage Blog Posts</span>
            </Link>
            <Link 
              to="/admin/cities" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <MapPin className="h-5 w-5 text-primary" />
              <span>Manage Cities</span>
            </Link>
            <Link 
              to="/admin/market-data" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Update Market Data</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <span className="text-green-700 dark:text-green-400">Database</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <span className="text-green-700 dark:text-green-400">Storage</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <span className="text-green-700 dark:text-green-400">Authentication</span>
              <span className="text-green-600 font-medium">Enabled</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
