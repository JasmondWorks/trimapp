"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyProfile, useUpdateMyProfile } from "@/models/profile/profile.hooks";
import { toast } from "sonner";

export default Account;

function Account() {
  const { profile, email } = useMyProfile();
  const { updateProfile, isSaving } = useUpdateMyProfile();
  const [form, setForm] = useState({ full_name: "", username: "", phone: "" });

  // Seed the form once the profile arrives. Adjusting state during render
  // (rather than in an effect) is React's documented pattern for "reset local
  // state when the data it mirrors changes" — it re-renders before painting
  // instead of flashing the empty form first.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (profile && seededFor !== profile.id) {
    setSeededFor(profile.id);
    setForm({
      full_name: profile.full_name ?? "",
      username: profile.username ?? "",
      phone: profile.phone ?? "",
    });
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(form);
      toast.success("Profile saved");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl mb-6">Your account</h1>
        <form onSubmit={save} className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div><Label>Email</Label><Input value={email} disabled /></div>
          <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080…" /></div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
