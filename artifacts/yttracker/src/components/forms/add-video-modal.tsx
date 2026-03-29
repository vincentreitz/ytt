import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateVideo, 
  getListVideosQueryKey, 
  useListChannels 
} from "@workspace/api-client-react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { extractYoutubeVideoId } from "@/lib/utils";

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddVideoModal({ isOpen, onClose }: AddVideoModalProps) {
  const [title, setTitle] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [channelId, setChannelId] = useState("");
  const [durationStr, setDurationStr] = useState("");
  
  const { data: channels } = useListChannels();
  const queryClient = useQueryClient();
  
  const createVideo = useCreateVideo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
        setTitle("");
        setVideoInput("");
        setChannelId("");
        setDurationStr("");
        onClose();
      }
    }
  });

  const parseDurationToSeconds = (dur: string) => {
    const parts = dur.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] * 60; // assume minutes if single number
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoInput || !channelId || !durationStr) return;
    
    const ytId = extractYoutubeVideoId(videoInput);
    const durationSeconds = parseDurationToSeconds(durationStr);
    
    createVideo.mutate({
      data: {
        title,
        youtubeVideoId: ytId,
        channelId: Number(channelId),
        durationSeconds,
        publishedAt: new Date().toISOString(),
        thumbnailUrl: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
      }
    });
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Add Video Manually" 
      description="Add a video to your tracker."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Video Title</label>
          <Input 
            placeholder="Awesome Tech Review" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">YouTube URL or ID</label>
          <Input 
            placeholder="https://youtube.com/watch?v=..." 
            value={videoInput} 
            onChange={(e) => setVideoInput(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Channel</label>
            <select
              className="flex h-11 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              required
            >
              <option value="" disabled>Select Channel</option>
              {channels?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Duration</label>
            <Input 
              placeholder="MM:SS or HH:MM:SS" 
              value={durationStr} 
              onChange={(e) => setDurationStr(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={createVideo.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createVideo.isPending || !title || !videoInput || !channelId || !durationStr}>
            {createVideo.isPending ? "Adding..." : "Save Video"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
