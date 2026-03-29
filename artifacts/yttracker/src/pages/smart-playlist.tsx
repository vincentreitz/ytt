import { useState } from "react";
import { useGenerateSmartPlaylist } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/video-card";
import { PlayCircle, Clock } from "lucide-react";
import { formatDurationText } from "@/lib/utils";

export default function SmartPlaylist() {
  const [minutes, setMinutes] = useState("60");
  const generatePlaylist = useGenerateSmartPlaylist();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseInt(minutes, 10);
    if (isNaN(min) || min <= 0) return;

    generatePlaylist.mutate({
      data: {
        sessionMinutes: min,
        prioritizeTopChannels: true
      }
    });
  };

  const playlist = generatePlaylist.data;

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-8 md:p-12">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/playlist-hero.png`} 
            alt="Playlist generator background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <PlayCircle className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-display font-bold text-foreground">Smart Playlist</h1>
          </div>
          <p className="text-lg text-foreground/80 mb-8">
            Tell us how much time you have, and we'll craft the perfect queue of videos from your backlog based on your habits.
          </p>

          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="number"
                min="10"
                step="5"
                placeholder="Available time (minutes)"
                className="pl-12 h-14 text-lg bg-card/50 backdrop-blur-md"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 text-lg" disabled={generatePlaylist.isPending}>
              {generatePlaylist.isPending ? "Curating..." : "Generate"}
            </Button>
          </form>
        </div>
      </div>

      {/* Results Section */}
      {playlist && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div>
              <h2 className="text-2xl font-display font-bold">Your Curated Session</h2>
              <p className="text-muted-foreground mt-1">
                {playlist.videos.length} videos • Total duration: {formatDurationText(playlist.totalDurationSeconds)}
              </p>
            </div>
          </div>

          {playlist.videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlist.videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-card rounded-2xl border border-white/5">
              <p className="text-lg text-muted-foreground">
                We couldn't find any pending videos that fit into this time slot.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
