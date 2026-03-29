import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MonitorPlay } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
        <MonitorPlay className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-6xl font-display font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Page not found</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg">Return to Feed</Button>
      </Link>
    </div>
  );
}
