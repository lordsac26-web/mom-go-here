import DailyLoginBonus from "@/components/DailyLoginBonus";
import DailyWheel from "@/components/DailyWheel";
import DailyMissionsWidget from "@/components/missions/DailyMissionsWidget";
import HistoryFact from "@/components/HistoryFact";

export default function DailyHubExtras({ userEmail, profile }) {
  return (
    <section className="mt-6 space-y-4" aria-label="Daily activities">
      <DailyLoginBonus userEmail={userEmail} />
      <DailyMissionsWidget userEmail={userEmail} />
      <DailyWheel userEmail={userEmail} />
      <HistoryFact birthday={profile?.birthday} location={{ city: profile?.city, latitude: profile?.latitude, longitude: profile?.longitude }} />
    </section>
  );
}