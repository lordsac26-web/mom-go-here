import { useState, useEffect, useCallback, useReducer } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import AudioSettings from "@/components/AudioSettings";
import WarmLoader from "../components/WarmLoader";
import { useUIStore } from "@/stores/uiStore";
import PermissionsPanel from "@/components/PermissionsPanel";
import SettingsGameManager from "@/components/SettingsGameManager";

import CardBackPicker from "@/components/solitaire/CardBackPicker";

const RELIGIONS = [
  { value: "None",         label: "No Preference", emoji: "🌍", sub: "Motivational quotes only" },
  { value: "Christianity", label: "Christianity",  emoji: "✝️", sub: "Bible & Scripture" },
  { value: "Catholicism",  label: "Catholicism",   emoji: "⛪", sub: "Catholic Scripture" },
  { value: "Judaism",      label: "Judaism",        emoji: "✡️", sub: "Torah Readings" },
  { value: "Islam",        label: "Islam",          emoji: "☪️", sub: "Quranic Verses" },
  { value: "Hinduism",     label: "Hinduism",       emoji: "🕉️", sub: "Gita Teachings" },
  { value: "Buddhism",     label: "Buddhism",       emoji: "☸️", sub: "Dharma Teachings" },
  { value: "Sikhism",      label: "Sikhism",        emoji: "🪯", sub: "Hukamnama" },
];

// FIX (security): cap display name to match Onboarding validation
const MAX_NAME_LENGTH = 50;

function ChatBubbleSettings() {
  const [chatBubbleEnabled, setChatBubbleEnabled] = useState(
    () => useUIStore.getState().chatBubbleEnabled
  );

  useEffect(() => {
    const unsub = useUIStore.subscribe(
      (s) => s.chatBubbleEnabled,
      (val) => setChatBubbleEnabled(val)
    );
    return unsub;
  }, []);

  const toggleChatBubble = () => useUIStore.getState().toggleChatBubble();

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
      <h2 className="text-3xl font-black text-primary flex items-center gap-2">
        💬 Chat Bubble
      </h2>
      <p className="text-muted-foreground text-lg">Customize your AI assistant</p>

      <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-4">
        <div>
          <p className="text-lg font-bold text-foreground">Enable Chat Bubble</p>
          <p className="text-sm text-muted-foreground">Show/hide the AI helper button</p>
        </div>
        <button
          onClick={toggleChatBubble}
          className={`px-6 py-3 rounded-lg font-black text-lg transition-all ${
            chatBubbleEnabled
              ? "bg-primary text-primary-foreground"
              : "bg-red-600 text-white"
          }`}
        >
          {chatBubbleEnabled ? "✅ ON" : "🔇 OFF"}
        </button>
      </div>

      {chatBubbleEnabled && (
        <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">
          <p>
            💡 <span className="font-bold">Tip:</span> Drag the chat bubble to move it around the screen.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [religion, setReligion] = useState("None");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [location, setLocation] = useState(null);
  const [cardBackDesign, setCardBackDesign] = useState("classic_blue");
  const [chatbotName, setChatbotName] = useState("Rosie");

  // FIX (bug): useCallback + AbortController prevents stale closure and race conditions
  // (same pattern fixed in Memories.jsx — loadProfile was defined outside the effect
  // and had no error handling, so a failed fetch would freeze the spinner permanently)
  const loadProfile = useCallback(async (signal) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    // FIX (bug): try/catch so a network error doesn't freeze the loading spinner
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (signal?.aborted) return;
      if (profiles[0]) {
        setProfile(profiles[0]);
        setDisplayName(profiles[0].display_name || "");
        setBirthday(profiles[0].birthday || "");
        setReligion(profiles[0].religion || "None");
        setCardBackDesign(profiles[0].card_back_design || "classic_blue");
        setChatbotName(profiles[0].chatbot_name || "Rosie");
      }
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Failed to load profile:", err);
      setLoadError("Could not load your settings. Please try again.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    // FIX (bug): abort any in-flight request when user changes
    const controller = new AbortController();
    loadProfile(controller.signal);
    return () => controller.abort();
  }, [loadProfile]);

  async function saveProfile() {
    setSaveError(null);
    setSaved(false);

    // FIX (security): trim and cap display name before saving, matching Onboarding
    const safeName = displayName.trim().slice(0, MAX_NAME_LENGTH);

    // FIX (bug): try/catch so a failed save shows an error instead of failing silently
    try {
      const data = {
        display_name: safeName,
        birthday,
        religion,
        card_back_design: cardBackDesign,
        chatbot_name: chatbotName.trim() || "Rosie",
        ...(location && {
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
        }),
      };
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, data);
      } else {
        const p = await base44.entities.UserProfile.create({ user_email: user.email, ...data });
        setProfile(p);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSaveError("Could not save your changes. Please try again.");
    }
  }

  function handleLocationChange(loc) {
    setLocation(loc);
  }

  if (loading) return <WarmLoader message="Loading your settings..." />;

  // FIX (bug): surface load errors rather than showing an empty/broken settings form
  if (loadError) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <p className="text-xl text-destructive font-bold">{loadError}</p>
      <button
        onClick={() => { setLoading(true); loadProfile(); }}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-lg"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <h1 className="text-4xl font-black text-primary text-center mb-2">⚙️ Settings</h1>
      <p className="text-center text-muted-foreground text-xl mb-6">Update your preferences</p>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Name & Birthday */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-black text-foreground mb-4">👤 Your Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-black text-foreground mb-2">What should we call you?</label>
              <input
                type="text"
                value={displayName}
                // FIX (security): enforce max length on every keystroke, matching Onboarding
                onChange={e => setDisplayName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                placeholder="Your name or nickname"
                maxLength={MAX_NAME_LENGTH}
                className="w-full bg-secondary border-2 border-border rounded-2xl px-5 py-4 text-xl font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-lg font-black text-foreground mb-2">🌸 AI Assistant Name</label>
              <input
                type="text"
                value={chatbotName}
                onChange={e => setChatbotName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                placeholder="Rosie"
                maxLength={MAX_NAME_LENGTH}
                className="w-full bg-secondary border-2 border-border rounded-2xl px-5 py-4 text-xl font-bold text-foreground focus:outline-none focus:border-primary"
              />
              <p className="text-sm text-muted-foreground mt-1 ml-1">Your AI helper's name (default: Rosie)</p>
            </div>
            <div>
              <label className="block text-lg font-black text-foreground mb-2">🎂 Birthday</label>
              <input
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                className="w-full bg-secondary border-2 border-border rounded-2xl px-5 py-4 text-xl font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <AudioSettings />



        {/* Game Selection */}
        <SettingsGameManager />

        {/* Card Back Design */}
        <CardBackPicker selected={cardBackDesign} onChange={setCardBackDesign} />

        {/* Chat Bubble Settings */}
        <ChatBubbleSettings />

        {/* Permissions Panel */}
        <PermissionsPanel
          onLocationChange={handleLocationChange}
          savedLocation={profile ? {
            latitude: profile.latitude,
            longitude: profile.longitude,
            city: profile.city,
          } : null}
        />

        {/* Religion */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-black text-foreground mb-2">📖 Daily Reading</h2>
          <p className="text-muted-foreground text-lg mb-4">Choose your faith for daily inspiration</p>
          <div className="space-y-3">
            {RELIGIONS.map(r => (
              <button
                key={r.value}
                onClick={() => setReligion(r.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl border-2 transition-all text-left ${
                  religion === r.value ? "border-primary bg-primary/10" : "border-border bg-secondary"
                }`}
              >
                <span className="text-2xl sm:text-3xl flex-shrink-0">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl font-black text-foreground truncate">{r.label}</p>
                  <p className="text-muted-foreground text-xs sm:text-sm truncate">{r.sub}</p>
                </div>
                {religion === r.value && <span className="ml-auto text-xl sm:text-2xl flex-shrink-0">✅</span>}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={saveProfile}
          className="w-full bg-primary text-primary-foreground text-2xl font-black py-5 rounded-2xl shadow-xl"
        >
          💾 Save Changes
        </button>

        {/* FIX (bug): show save error if the update call fails */}
        {saveError && (
          <div className="bg-red-700 text-white text-center text-xl font-bold py-4 rounded-2xl">
            ❌ {saveError}
          </div>
        )}

        {saved && (
          <div className="bg-green-700 text-white text-center text-xl font-bold py-4 rounded-2xl">
            ✅ Saved successfully!
          </div>
        )}

        {/* Legal */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl mt-4 space-y-3">
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">📋 Legal</h2>
          <Link to="/privacy" className="w-full flex items-center justify-between bg-secondary text-foreground text-lg font-bold py-4 px-5 rounded-2xl border-2 border-border">
            <span>🔒 Privacy Policy</span>
            <span className="text-muted-foreground">→</span>
          </Link>
          <Link to="/terms" className="w-full flex items-center justify-between bg-secondary text-foreground text-lg font-bold py-4 px-5 rounded-2xl border-2 border-border">
            <span>📜 Terms of Service</span>
            <span className="text-muted-foreground">→</span>
          </Link>
        </div>

        {/* Account Management */}
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl mt-4 space-y-4">
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">🔒 Account Management</h2>
          <p className="text-muted-foreground text-lg">
            Manage your account and sign-in.
          </p>
          <button
            onClick={() => base44.auth.logout("/")}
            className="w-full bg-secondary text-foreground text-xl font-black py-4 rounded-2xl border-2 border-border"
          >
            🚪 Log Out
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full bg-destructive text-destructive-foreground text-xl font-black py-4 rounded-2xl">
                🗑️ Delete My Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-auto">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black">Delete your account?</AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  This will <span className="font-black text-destructive">permanently delete</span> all your data — scores, achievements, journal entries, contacts, and settings. This action <span className="font-black">cannot be undone</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-lg font-bold">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    // Delete all user-owned entity records then log out
                    const email = user?.email;
                    if (!email) return;
                    const entities = [
                      base44.entities.UserProfile,
                      base44.entities.GameScore,
                      base44.entities.PlayerXP,
                      base44.entities.Achievement,
                      base44.entities.DailyLoginBonus,
                      base44.entities.SolitaireStats,
                      base44.entities.ZenPoints,
                      base44.entities.EngagementStreak,
                      base44.entities.JournalEntry,
                      base44.entities.Contact,
                      base44.entities.PersonalEvent,
                      base44.entities.DailyProgress,
                      base44.entities.SavedGame,
                      base44.entities.DartPopBlitzScore,
                    ];
                    for (const entity of entities) {
                      const records = await entity.filter({ user_email: email });
                      for (const r of records) await entity.delete(r.id);
                    }
                    base44.auth.logout("/");
                  }}
                  className="bg-destructive text-destructive-foreground text-lg font-black"
                >
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}