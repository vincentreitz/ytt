import { useGetDailyStats } from "@workspace/api-client-react";
import { formatDurationText } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Activity, Clock, Layers } from "lucide-react";

export default function Stats() {
  const { data, isLoading } = useGetDailyStats({ days: 30 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.days.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    minutes: Math.round(d.watchedSeconds / 60)
  }));

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Statistics</h1>
        <p className="text-muted-foreground mt-1">Analyze your YouTube viewing habits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-card hover:to-secondary transition-colors duration-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <Activity className="w-4 h-4 text-primary" /> 
              Avg Daily Watch Time
            </CardDescription>
            <CardTitle className="text-3xl text-foreground">
              {formatDurationText(data.averageDailyWatchSeconds)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card hover:to-secondary transition-colors duration-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-blue-500" /> 
              Total Backlog Time
            </CardDescription>
            <CardTitle className="text-3xl text-foreground">
              {formatDurationText(data.totalPendingSeconds)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card hover:to-secondary transition-colors duration-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <Layers className="w-4 h-4 text-purple-500" /> 
              Pending Videos
            </CardDescription>
            <CardTitle className="text-3xl text-foreground">
              {data.totalPendingCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="pt-6 border border-white/5">
        <CardHeader>
          <CardTitle>Daily Watch Time (Minutes)</CardTitle>
          <CardDescription>Your viewing history over the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}m`}
                />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--secondary))'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="minutes" 
                  fill="url(#colorMinutes)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={maxBarSize => 40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
