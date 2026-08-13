import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function DeleteAccountSection() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState(false);

  async function deleteAccount() {
    setDeleting(true);
    setError("");
    try {
      const response = await base44.functions.invoke("deleteAccount", { confirm: true });
      if (!response.data?.success) throw new Error(response.data?.error || "Deletion failed");
      setDeleted(true);
      setTimeout(() => base44.auth.logout("/?account_deleted=1"), 1400);
    } catch (err) {
      setError(err?.response?.data?.details || "We could not delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return <div className="rounded-2xl border-2 border-destructive/50 bg-card p-6 shadow-xl">
    <h2 className="text-2xl font-black text-foreground">🔒 Privacy & Data</h2>
    <p className="mt-2 text-lg text-muted-foreground">Permanently remove your account and all saved information.</p>
    {deleted ? <p role="status" className="mt-4 rounded-xl bg-green-700 p-4 text-center text-xl font-black text-white">Your account has been deleted.</p> : <AlertDialog>
      <AlertDialogTrigger asChild><button className="mt-4 min-h-14 w-full rounded-2xl bg-destructive px-5 text-xl font-black text-destructive-foreground">🗑️ Delete My Account</button></AlertDialogTrigger>
      <AlertDialogContent className="max-w-md rounded-3xl p-6">
        <AlertDialogHeader><AlertDialogTitle className="text-3xl font-black">Delete your account?</AlertDialogTitle><AlertDialogDescription className="text-lg leading-relaxed">This permanently deletes your profile, scores, achievements, memories, contacts, events, coins, and settings. <strong className="text-destructive">This cannot be undone.</strong></AlertDialogDescription></AlertDialogHeader>
        {error && <p className="rounded-xl bg-destructive/15 p-3 text-lg font-bold text-destructive">{error}</p>}
        <AlertDialogFooter className="gap-3"><AlertDialogCancel disabled={deleting} className="min-h-14 text-xl font-black">Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteAccount} disabled={deleting} className="min-h-14 bg-destructive text-xl font-black text-destructive-foreground">{deleting ? "Deleting…" : "Yes, Delete Forever"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>}
  </div>;
}