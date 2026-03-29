import { useQueryClient } from "@tanstack/react-query";
import { 
  useUpdateVideoStatus, 
  getListVideosQueryKey,
  getGetDailyStatsQueryKey,
  getGetInsightsQueryKey,
  Video 
} from "@workspace/api-client-react";
import { Play, CheckCircle2, FastForward, Clock } from "lucide-react";
import { formatDurationText } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "./ui/button";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const queryClient = useQueryClient();
  const updateStatus = useUpdateVideoStatus();

  const handleStatusChange = (status: 'watched' | 'skipped', e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateStatus.mutate({ 
      videoId: video.id, 
      data: { status } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailyStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInsightsQueryKey() });
      }
    });
  };

  const handleWatch = () => {
    window.open(`https://youtube.com/watch?v=${video.youtubeVideoId}`, '_blank');
    if (video.status !== 'watched') {
      handleStatusChange('watched');
    }
  };

  const thumbUrl = video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
  
  const isPending = video.status === 'pending';

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-white/5 shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 flex flex-col">
      {/* Thumbnail Container */}
      <div 
        className="relative aspect-video bg-muted overflow-hidden cursor-pointer"
        onClick={handleWatch}
      >
        <img 
          src={thumbUrl} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Overlay Play Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/50 transform scale-75 group-hover:scale-100 transition-transform duration-300 delay-75">
            <Play className="w-6 h-6 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-sm text-xs font-semibold text-white">
          {formatDurationText(video.durationSeconds)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 
          className="font-semibold text-foreground line-clamp-2 leading-snug cursor-pointer group-hover:text-primary transition-colors"
          onClick={handleWatch}
          title={video.title}
        >
          {video.title}
        </h3>
        
        <div className="mt-2 flex items-center text-sm text-muted-foreground justify-between">
          <span className="truncate pr-2 hover:text-foreground transition-colors cursor-pointer">{video.channelName}</span>
          <span className="flex-shrink-0 flex items-center gap-1 text-xs">
            <Clock className="w-3 h-3" />
            {format(new Date(video.publishedAt), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-4 flex items-center gap-2">
          {isPending ? (
            <>
              <Button 
                variant="default" 
                className="flex-1 text-sm h-9" 
                onClick={handleWatch}
              >
                Watch
              </Button>
              <Button 
                variant="secondary" 
                className="h-9 px-3" 
                onClick={(e) => handleStatusChange('watched', e)}
                disabled={updateStatus.isPending}
                title="Mark as Watched"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </Button>
              <Button 
                variant="secondary" 
                className="h-9 px-3" 
                onClick={(e) => handleStatusChange('skipped', e)}
                disabled={updateStatus.isPending}
                title="Skip Video"
              >
                <FastForward className="w-4 h-4 text-muted-foreground hover:text-white" />
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-between items-center bg-secondary/50 rounded-lg px-3 py-2">
              <span className="text-sm font-medium capitalize text-muted-foreground flex items-center gap-2">
                {video.status === 'watched' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <FastForward className="w-4 h-4 text-muted-foreground" />}
                {video.status}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs" 
                onClick={(e) => handleStatusChange('pending', e)}
              >
                Undo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
