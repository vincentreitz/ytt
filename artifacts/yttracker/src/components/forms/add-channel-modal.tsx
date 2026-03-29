import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateChannel, getListChannelsQueryKey } from "@workspace/api-client-react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { extractYoutubeChannelId } from "@/lib/utils";

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddChannelModal({ isOpen, onClose }: AddChannelModalProps) {
  const [name, setName] = useState("");
  const [channelInput, setChannelInput] = useState("");
  
  const queryClient = useQueryClient();
  const createChannel = useCreateChannel({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChannelsQueryKey() });
        setName("");
        setChannelInput("");
        onClose();
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !channelInput) return;
    
    const ytId = extractYoutubeChannelId(channelInput);
    createChannel.mutate({
      data: {
        name,
        youtubeChannelId: ytId,
        thumbnailUrl: null, // Let backend or later process handle it, or we leave null
      }
    });
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Add Subscription" 
      description="Track a new YouTube channel."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Channel Name</label>
          <Input 
            placeholder="e.g. Marques Brownlee" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">YouTube Handle or ID</label>
          <Input 
            placeholder="e.g. @MKBHD or UCx..." 
            value={channelInput} 
            onChange={(e) => setChannelInput(e.target.value)}
            required
          />
        </div>
        <div className="pt-4 flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={createChannel.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createChannel.isPending || !name || !channelInput}>
            {createChannel.isPending ? "Adding..." : "Add Channel"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
