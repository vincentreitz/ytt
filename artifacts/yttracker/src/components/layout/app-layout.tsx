import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Lightbulb,
  ListVideo,
  MonitorPlay,
  Menu,
  X,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { cn, formatDurationText } from "@/lib/utils";
import { useGetDailyStats } from "@workspace/api-client-react";
import { useAuth, useSync, useLogout } from "@/hooks/use-auth";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: user } = useAuth();
  const { data: stats } = useGetDailyStats({ days: 30 });
  const syncMutation = useSync();
  const logoutMutation = useLogout();

  const navItems = [
    { href: "/", label: "Feed", icon: LayoutDashboard },
    { href: "/stats", label: "Statistics", icon: BarChart3 },
    { href: "/insights", label: "Insights", icon: Lightbulb },
    { href: "/playlist", label: "Smart Playlist", icon: ListVideo },
  ];

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <MonitorPlay className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">YTTracker</span>
      </div>

      {/* Nav */}
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

        {/* Sync */}
        <div className="pt-6 pb-2 px-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            YouTube
          </p>
          <button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5", syncMutation.isPending && "animate-spin")} />
            {syncMutation.isPending ? "Syncing…" : "Sync subscriptions"}
          </button>
          {syncMutation.isSuccess && (
            <p className="text-xs text-green-500 px-4 mt-1">
              ✓ {syncMutation.data?.subscriptions} chaînes · {syncMutation.data?.newVideos} nouvelles vidéos
            </p>
          )}
          {syncMutation.isError && (
            <p className="text-xs text-destructive px-4 mt-1">Sync échoué. Réessaye.</p>
          )}
        </div>
      </nav>

      {/* User + Stats footer */}
      <div className="p-4 mt-auto space-y-3">
        {/* Backlog stat */}
        <div className="bg-secondary/50 rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Backlog</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-foreground">
              {stats?.totalPendingCount ?? 0}
            </span>
            <span className="text-sm font-medium text-primary mb-1">
              {formatDurationText(stats?.totalPendingSeconds)}
            </span>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-2">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{user.name[0]}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
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
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="relative w-72 max-w-[80%] h-full z-50 bg-card shadow-2xl"
          >
            <button
              className="absolute top-6 right-4 p-2 bg-secondary rounded-full"
              onClick={() => setIsMobileOpen(false)}
            >
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
            <span className="font-bold text-lg">YTTracker</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -mr-2 text-foreground"
          >
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
    </div>
  );
}
