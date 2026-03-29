import { useGetInsights, useDeleteChannel, getGetInsightsQueryKey, getListChannelsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDurationText } from "@/lib/utils";
import { Loader2, AlertTriangle, TrendingUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Insights() {
  const { data, isLoading } = useGetInsights();
  const queryClient = useQueryClient();
  
  const deleteChannel = useDeleteChannel({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInsightsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListChannelsQueryKey() });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Channel Insights</h1>
        <p className="text-muted-foreground mt-1">Discover your true viewing preferences.</p>
      </div>

      {data.unsubscribeRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertTriangle className="w-5 h-5" />
            <h2>Consider Unsubscribing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.unsubscribeRecommendations.map(c => (
              <Card key={c.channelId} className="border-destructive/30 bg-destructive/5 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">{c.channelName}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/20 -mt-2 -mr-2"
                      onClick={() => {
                        if (confirm(`Remove ${c.channelName} from tracker?`)) {
                          deleteChannel.mutate({ channelId: c.channelId });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-destructive/80">
                    Watch ratio: {(c.watchRatio * 100).toFixed(1)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You often skip this channel's content. Removing it will clean up your feed.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h2>All Channel Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.channels.map(c => (
            <Card key={c.channelId} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1" title={c.channelName}>{c.channelName}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                    onClick={() => {
                      if (confirm(`Remove ${c.channelName} from tracker?`)) {
                        deleteChannel.mutate({ channelId: c.channelId });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Watch Ratio</span>
                    <span className="font-semibold">{(c.watchRatio * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full" 
                      style={{ width: `${Math.min(c.watchRatio * 100, 100)}%` }} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Total Watched</p>
                    <p className="font-medium">{formatDurationText(c.totalWatchedSeconds)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Avg Delay</p>
                    <p className="font-medium">
                      {c.avgDaysToWatch !== null && c.avgDaysToWatch !== undefined 
                        ? `${c.avgDaysToWatch.toFixed(1)} days` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Pending</p>
                    <p className="font-medium">{c.pendingVideos}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Skipped</p>
                    <p className="font-medium">{c.skippedVideos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
