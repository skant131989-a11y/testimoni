"use client";

import { useState } from "react";
import { Check, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";

export interface EditableForm {
  id: string;
  headline: string;
  description?: string | null;
  thankYouMessage?: string;
  thankYouReward?: string | null;
}

/**
 * What people see on your form, in your words: the headline, an intro line,
 * the thank-you message, and an optional gift. A gift (a discount code or a
 * link) is the cheapest way to get more people to actually finish a review.
 */
export function FormCustomizer({
  form,
  onSaved,
}: {
  form: EditableForm;
  onSaved: (patch: Partial<EditableForm>) => void;
}) {
  const [headline, setHeadline] = useState(form.headline || "Share your experience");
  const [description, setDescription] = useState(form.description ?? "");
  const [thanks, setThanks] = useState(form.thankYouMessage || "Thank you for your feedback!");
  const [reward, setReward] = useState(form.thankYouReward ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          description: description.trim() || null,
          thankYouMessage: thanks,
          thankYouReward: reward.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Couldn't save. Try again.");
        return;
      }
      onSaved(body.form);
      setSaved(true);
      track("form_customized", { has_reward: !!reward.trim() });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network hiccup. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These are the words your customers see. Changes go live as soon as you save.
      </p>
      <div>
        <Label htmlFor={`headline-${form.id}`}>Headline</Label>
        <Input id={`headline-${form.id}`} value={headline} maxLength={120} onChange={(e) => setHeadline(e.target.value)} />
      </div>
      <div>
        <Label htmlFor={`intro-${form.id}`}>Intro line (optional)</Label>
        <Input
          id={`intro-${form.id}`}
          value={description}
          maxLength={300}
          placeholder="e.g. It takes 20 seconds and means a lot to a small team."
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`thanks-${form.id}`}>Thank-you message</Label>
        <Textarea id={`thanks-${form.id}`} rows={2} value={thanks} maxLength={300} onChange={(e) => setThanks(e.target.value)} />
      </div>
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
        <Label htmlFor={`reward-${form.id}`} className="flex items-center gap-1.5">
          <Gift className="h-4 w-4 text-primary" /> A thank-you gift (optional)
        </Label>
        <Input
          id={`reward-${form.id}`}
          className="mt-1.5 bg-white"
          value={reward}
          maxLength={240}
          placeholder="e.g. Use code THANKS10 for 10% off your next order"
          onChange={(e) => setReward(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Shown right after someone submits. A small gift is the easiest way to get more people to finish a review.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={save} disabled={saving || !headline.trim() || !thanks.trim()}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : null}
        {saved ? "Saved" : "Save changes"}
      </Button>
    </div>
  );
}
