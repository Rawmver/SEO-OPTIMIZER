import React from "react";
import { useGetSeoStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target, TrendingUp, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Stats() {
  const { data: stats, isLoading } = useGetSeoStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-muted-foreground">Aggregate metrics from all your optimization tasks.</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-28 bg-muted/20" />
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
              title="Total Optimizations" 
              value={stats.totalOptimizations.toString()} 
              icon={BarChart3} 
              trend="+12% this week"
            />
            <StatCard 
              title="Avg Title Score" 
              value={stats.avgTitleScore.toFixed(1)} 
              icon={TrendingUp} 
              scoreColor={getScoreColor(stats.avgTitleScore)}
            />
            <StatCard 
              title="Avg Description Score" 
              value={stats.avgDescriptionScore.toFixed(1)} 
              icon={Target} 
              scoreColor={getScoreColor(stats.avgDescriptionScore)}
            />
          </div>

          <Card className="border-muted shadow-sm">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                Top Performing Keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {stats.topKeywords?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topKeywords.map((kw, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="px-4 py-2 text-sm font-medium border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not enough data to determine top keywords yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-yellow-500";
  return "text-destructive";
}

function StatCard({ title, value, icon: Icon, trend, scoreColor }: { title: string, value: string, icon: any, trend?: string, scoreColor?: string }) {
  return (
    <Card className="border-muted shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground tracking-tight">{title}</p>
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <div className={`text-4xl font-bold tracking-tighter ${scoreColor || "text-foreground"}`}>
            {value}
          </div>
          {trend && (
            <span className="text-xs text-muted-foreground font-medium">{trend}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
