import { useState } from "react";
import { 
  useListVideos, 
  useListChannels, 
  ListVideosStatus 
} from "@workspace/api-client-react";
import { VideoCard } from "@/components/video-card";
import { cn } from "@/lib/utils";
import { Loader2, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Feed() {
  const [statusFilter, setStatusFilter] = useState<ListVideosStatus | undefined>('pending');
  const [channelFilter, setChannelFilter] = useState<number | undefined>(undefined);

  const { data: videos, isLoading: loadingVideos } = useListVideos({ 
    status: statusFilter, 
    channelId: channelFilter 
  });
  
  const { data: channels, isLoading: loadingChannels } = useListChannels();

  const tabs = [
    { label: 'Pending', value: 'pending' },
    { label: 'Watched', value: 'watched' },
    { label: 'Skipped', value: 'skipped' },
    { label: 'All Videos', value: undefined }
  ];

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Your Feed</h1>
        <p className="text-muted-foreground mt-1">Track and manage your subscription backlog.</p>
      </div>

      {/* Filters */}
      <div className="space-y-6">
        {/* Status Tabs */}
        <div className="flex gap-4 border-b border-border/50">
          {tabs.map(tab => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value as any)}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-all duration-200",
                statusFilter === tab.value 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Channel Pills */}
        {!loadingChannels && channels && channels.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setChannelFilter(undefined)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                channelFilter === undefined 
                  ? "bg-foreground text-background" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              All Channels
            </button>
            {channels.map(c => (
              <button
                key={c.id}
                onClick={() => setChannelFilter(c.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  channelFilter === c.id 
                    ? "bg-foreground text-background" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loadingVideos ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden bg-card border border-white/5 p-12 text-center shadow-2xl flex flex-col items-center justify-center">
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <img src={`${import.meta.env.BASE_URL}images/empty-feed.png`} alt="Empty background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
              <MonitorPlay className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">You're all caught up!</h3>
            <p className="text-muted-foreground mb-8">
              There are no videos matching your current filters. Time to relax or add more channels.
            </p>
            <Button onClick={() => { setStatusFilter(undefined); setChannelFilter(undefined); }}>
              View All Videos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
