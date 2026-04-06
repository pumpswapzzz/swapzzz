import { useGetLeaderboard, useGetActivityFeed } from "@workspace/api-client-react";
import { Trophy, Activity, Users } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function Leaderboard() {
  const { data: leaderboardData, isLoading: leaderboardLoading } = useGetLeaderboard({ limit: 50 });
  const { data: activityData, isLoading: activityLoading } = useGetActivityFeed();

  return (
    <div className="container max-w-screen-xl px-4 md:px-8 py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-mono uppercase tracking-tighter flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Top traders ranked by total volume. Follow the best to copy their trades.
        </p>
      </div>

      {activityData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">24h Volume</p>
                  <p className="text-2xl font-bold font-mono">{activityData.platform_summary.total_volume_sol.toFixed(2)} SOL</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Traders</p>
                  <p className="text-2xl font-bold font-mono">{activityData.platform_summary.active_traders_24h}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Broadcasts</p>
                  <p className="text-2xl font-bold font-mono">{activityData.platform_summary.total_broadcasts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activityData?.hourly_stats && activityData.hourly_stats.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-mono uppercase tracking-wider text-sm">Hourly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData.hourly_stats}>
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(val) => new Date(val).getHours() + ':00'} 
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
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelFormatter={(val) => new Date(val).toLocaleString()}
                  />
                  <Bar dataKey="trade_count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-16 text-center font-mono">#</TableHead>
                <TableHead>Trader</TableHead>
                <TableHead className="text-right">Volume (SOL)</TableHead>
                <TableHead className="text-right">Broadcasts</TableHead>
                <TableHead className="text-right">Followers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">Loading...</TableCell>
                </TableRow>
              ) : leaderboardData?.traders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">No data available</TableCell>
                </TableRow>
              ) : (
                leaderboardData?.traders.map((trader, index) => (
                  <TableRow key={trader.wallet_address} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="text-center font-mono font-bold text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <Link href={`/u/${trader.wallet_address}`} className="font-bold hover:text-primary transition-colors flex items-center gap-2">
                        {trader.username || `${trader.wallet_address.substring(0, 4)}...${trader.wallet_address.substring(trader.wallet_address.length - 4)}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">{trader.total_volume_sol.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{trader.broadcast_count}</TableCell>
                    <TableCell className="text-right font-mono">{trader.followers_count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
