"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Link as LinkIcon, Copy, Check, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CollectionForm {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  headline: string;
  createdAt: string;
  _count: { submissions: number };
}

export default function CollectPage() {
  const [forms, setForms] = useState<CollectionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/submissions?listForms=true")
      .then((r) => r.json())
      .then((data) => {
        setForms(data.forms || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createForm", name: newName }),
      });
      if (res.ok) {
        const data = await res.json();
        setForms((prev) => [data.form, ...prev]);
        setNewName("");
        setShowCreate(false);
      }
    } finally {
      setCreating(false);
    }
  }

  function getFormUrl(form: CollectionForm) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/collect/${form.slug}`;
  }

  function copyLink(form: CollectionForm) {
    navigator.clipboard.writeText(getFormUrl(form));
    setCopied(form.id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Collection Forms</h1>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collection Forms</h1>
          <p className="text-muted-foreground">
            Create forms to collect testimonials from your customers
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Form
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="form-name">Form Name</Label>
                <Input
                  id="form-name"
                  placeholder="e.g., Customer Feedback"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {forms.length === 0 && !showCreate ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No collection forms</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a form and share the link with customers to collect testimonials.
            </p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{form.name}</h3>
                    <Badge variant={form.isActive ? "default" : "secondary"}>
                      {form.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {form._count?.submissions || 0} submissions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(form)}
                  >
                    {copied === form.id ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <Copy className="mr-1 h-3 w-3" />
                    )}
                    Copy Link
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={getFormUrl(form)} target="_blank">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Open
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
