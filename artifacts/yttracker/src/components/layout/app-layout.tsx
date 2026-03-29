import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BarChart3, 
  Lightbulb, 
  ListVideo, 
  Plus,
  MonitorPlay,
  Menu,
  X
} from "lucide-react";
import { cn, formatDurationText } from "@/lib/utils";
import { useGetDailyStats } from "@workspace/api-client-react";
import { Button } from "../ui/button";
import { AddChannelModal } from "../forms/add-channel-modal";
import { AddVideoModal } from "../forms/add-video-modal";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { data: stats } = useGetDailyStats({ days: 1 });

  const navItems = [
    { href: "/", label: "Feed", icon: LayoutDashboard },
    { href: "/stats", label: "Statistics", icon: BarChart3 },
    { href: "/insights", label: "Insights", icon: Lightbulb },
    { href: "/playlist", label: "Smart Playlist", icon: ListVideo },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <MonitorPlay className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight">YTTracker</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-12 mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </div>
        <div className="space-y-2">
          <button 
            onClick={() => setIsChannelModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Add Channel
          </button>
          <button 
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Add Video
          </button>
        </div>
      </nav>

      {/* Global Stat Footer */}
      <div className="p-6 mt-auto">
        <div className="bg-secondary/50 rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Backlog</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold font-display text-foreground">
              {stats?.totalPendingCount || 0}
            </span>
            <span className="text-sm font-medium text-primary mb-1">
              {formatDurationText(stats?.totalPendingSeconds)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="relative w-72 max-w-[80%] h-full z-50 bg-card shadow-2xl"
          >
            <button className="absolute top-6 right-4 p-2 bg-secondary rounded-full" onClick={() => setIsMobileOpen(false)}>
              <X className="w-5 h-5 text-foreground" />
            </button>
            <SidebarContent />
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Mobile */}
        <header className="md:hidden h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <MonitorPlay className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">YTTracker</span>
          </div>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 -mr-2 text-foreground">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>

      <AddChannelModal isOpen={isChannelModalOpen} onClose={() => setIsChannelModalOpen(false)} />
      <AddVideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />
    </div>
  );
}
