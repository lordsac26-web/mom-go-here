import { Link } from "react-router-dom";
import { Award, BookHeart, ChevronRight, Settings, Users } from "lucide-react";

const sections = [
  { title: "Memory Book & Family", description: "Memories, loved ones, birthdays, and special events", icon: BookHeart, links: [{ to: "/memories", label: "Open Memory Book", icon: BookHeart }, { to: "/contacts", label: "Family & Contacts", icon: Users }] },
  { title: "My Accomplishments", description: "Progress, streaks, levels, and achievements", icon: Award, links: [{ to: "/progress", label: "View My Progress", icon: Award }, { to: "/achievements", label: "My Achievements", icon: Award }] },
];

export default function Profile() {
  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <h1 className="text-center text-4xl font-black text-primary">👤 My Profile</h1>
      <p className="mb-6 mt-1 text-center text-xl text-muted-foreground">Your memories, family, and accomplishments</p>
      <div className="mx-auto max-w-xl space-y-5">
        {sections.map(section => <section key={section.title} className="rounded-3xl border-2 border-border bg-card p-5 shadow-lg"><div className="mb-4 flex gap-3"><section.icon className="mt-1 text-primary" size={30} /><div><h2 className="text-2xl font-black text-foreground">{section.title}</h2><p className="text-base text-muted-foreground">{section.description}</p></div></div><div className="space-y-3">{section.links.map(link => <Link key={link.to} to={link.to} className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-secondary px-4 text-lg font-black text-foreground"><link.icon size={24} className="text-primary" /><span className="flex-1">{link.label}</span><ChevronRight size={24} /></Link>)}</div></section>)}
        <Link to="/settings" className="flex min-h-[64px] items-center gap-3 rounded-2xl border-2 border-border bg-card px-5 text-lg font-black text-foreground"><Settings size={26} className="text-primary" /><span className="flex-1">Settings</span><ChevronRight size={24} /></Link>
      </div>
    </div>
  );
}