import { MonitorPlay } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function SignIn() {
  const queryClient = useQueryClient();
  const popupRef = useRef<Window | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data === "auth_complete") {
        setWaiting(false);
        queryClient.invalidateQueries({ queryKey: ["auth/me"] });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [queryClient]);

  const handleSignIn = () => {
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/api/auth/google",
      "oauth",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );
    popupRef.current = popup;
    setWaiting(true);

    const poll = setInterval(() => {
      if (popup?.closed) {
        clearInterval(poll);
        setWaiting(false);
        queryClient.invalidateQueries({ queryKey: ["auth/me"] });
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
            <MonitorPlay className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">YTTracker</h1>
            <p className="text-muted-foreground mt-2">Reprends le contrôle de tes abonnements YouTube</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Connecte-toi avec Google</h2>
            <p className="text-sm text-muted-foreground">
              Tes abonnements YouTube sont importés automatiquement. Aucune configuration manuelle.
            </p>
          </div>

          <div className="space-y-3 text-left text-sm text-muted-foreground">
            {[
              "📺 Suivi de tous tes abonnements",
              "✅ Marquer les vidéos comme vues ou passées",
              "📊 Stats de visionnage par jour",
              "💡 Conseils de désabonnement",
              "🎯 Smart Playlist par durée de session",
            ].map((feature) => (
              <div key={feature}>{feature}</div>
            ))}
          </div>

          <button
            onClick={handleSignIn}
            disabled={waiting}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {waiting ? (
              <>
                <span className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                En attente de Google…
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Se connecter avec Google
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground">
            Seul l'accès en lecture à YouTube est demandé. Aucune vidéo ne sera publiée en ton nom.
          </p>
        </div>
      </div>
    </div>
  );
}
