import { useState } from "react";
import { BookmarkPlus, Check, Volume2 } from "lucide-react";
import syncQueue from "@/lib/syncQueue";

export default function HomeInspirationCard({ quote, userEmail, onComplete }) {
  const [saved, setSaved] = useState(false);

  function readAloud() {
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(`${quote.quote} By ${quote.author}`));
    onComplete(0);
  }

  async function save() {
    if (saved) return;
    await syncQueue.safeCreate("JournalEntry", {
      user_email: userEmail,
      entry_date: new Date().toISOString().slice(0, 10),
      memory_text: `“${quote.quote}”\n\n— ${quote.author}`,
      prompt: "Daily Inspiration",
    });
    setSaved(true);
    onComplete(0);
    onComplete(2);
  }

  return (
    <section className="rounded-3xl border-2 border-primary bg-card p-5 shadow-xl">
      <p className="mb-2 text-lg font-black text-primary">💛 Daily Inspiration</p>
      <blockquote className="text-pretty text-2xl font-bold leading-relaxed text-foreground">“{quote.quote}”</blockquote>
      <p className="mt-2 text-lg text-muted-foreground">— {quote.author}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={readAloud} className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-secondary px-3 font-black text-foreground"><Volume2 size={22} /> Read Aloud</button>
        <button onClick={save} disabled={saved} className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-primary px-3 font-black text-primary-foreground disabled:opacity-70">{saved ? <Check size={22} /> : <BookmarkPlus size={22} />}{saved ? "Saved" : "Save to Memories"}</button>
      </div>
    </section>
  );
}