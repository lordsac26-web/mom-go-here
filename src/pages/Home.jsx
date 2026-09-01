import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import WarmLoader from "@/components/WarmLoader";
import WeatherWidget from "@/components/WeatherWidget";
import HomeProgressPill from "@/components/home/HomeProgressPill";
import HomeInspirationCard from "@/components/home/HomeInspirationCard";
import HomeQuickPlayCard from "@/components/home/HomeQuickPlayCard";
import HomeRoutineChecklist from "@/components/home/HomeRoutineChecklist";
import useHomeDashboard from "@/hooks/useHomeDashboard";

function greeting(name) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 17) return `Good afternoon, ${name}!`;
  return `Good evening, ${name}!`;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, profile, quote, quickGame, checks, complete } = useHomeDashboard(user);

  useEffect(() => {
    if (!loading && !profile?.display_name && navigator.onLine) navigate("/onboarding");
  }, [loading, profile, navigate]);

  if (loading) return <WarmLoader message="Getting your day ready…" />;
  if (!profile || !quote) return null;

  return (
    <div className="min-h-screen px-4 py-5 pb-24">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="text-center">
          <h1 className="text-balance text-3xl font-black text-primary">{greeting(profile.display_name || "Friend")}</h1>
          <div className="my-3"><HomeProgressPill userEmail={user?.email} /></div>
          <WeatherWidget latitude={profile.latitude} longitude={profile.longitude} city={profile.city} />
        </header>
        <HomeInspirationCard quote={quote} userEmail={user?.email} onComplete={complete} />
        <HomeQuickPlayCard game={quickGame} />
        <HomeRoutineChecklist checks={checks} />
      </div>
    </div>
  );
}