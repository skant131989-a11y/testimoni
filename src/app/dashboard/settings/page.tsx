import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlan } from "@/lib/plan";
import { TrackedLink } from "@/components/tracked-link";
import { ChangePasswordCard } from "@/components/change-password-card";
import { UpgradeProButton } from "@/components/upgrade-pro-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: { subscription: true },
          },
        },
        take: 1,
      },
    },
  });

  if (!dbUser || !dbUser.workspaceMembers[0]) {
    redirect("/login");
  }

  const workspace = dbUser.workspaceMembers[0].workspace;
  const plan = getEffectivePlan(workspace.slug, workspace.subscription?.plan);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your workspace settings and preferences.
        </p>
      </div>

      {/* Workspace settings */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Update your workspace name and URL slug.
          </CardDescription>
        </CardHeader>
        <form action="/api/workspace/update" method="POST">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                name="name"
                defaultValue={workspace.name}
                placeholder="My Workspace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-slug">URL Slug</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  testimoni.io/
                </span>
                <Input
                  id="workspace-slug"
                  name="slug"
                  defaultValue={workspace.slug}
                  placeholder="my-workspace"
                  className="max-w-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This is used in your public collection form URLs.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>

      {/* Public founder directory opt-in — gates the workspace's
          appearance on /founders, /founders/[slug], /wall, and the
          trending badge endpoint. Nothing goes public until the
          owner explicitly toggles this on. */}
      <Card>
        <CardHeader>
          <CardTitle>Public listing</CardTitle>
          <CardDescription>
            Show your workspace on the public{" "}
            <Link
              href="/founders"
              target="_blank"
              className="font-medium text-primary underline underline-offset-4"
            >
              Founders directory
            </Link>{" "}
            and get a public profile at{" "}
            <span className="font-mono">/founders/{workspace.slug}</span>. Your
            approved testimonials also become eligible for the{" "}
            <Link
              href="/wall"
              target="_blank"
              className="font-medium text-primary underline underline-offset-4"
            >
              Wall of Walls
            </Link>{" "}
            rotation.
          </CardDescription>
        </CardHeader>
        <form action="/api/workspace/update" method="POST">
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
              <input
                type="checkbox"
                id="publicListing"
                name="publicListing"
                value="on"
                defaultChecked={workspace.publicListing}
                className="mt-1 h-4 w-4"
              />
              <label htmlFor="publicListing" className="cursor-pointer">
                <span className="text-sm font-medium">
                  Show my workspace publicly
                </span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Nothing about your workspace appears on public pages until
                  you enable this. Only your approved testimonials, name,
                  logo, pitch, and links show up — no emails, no counts you
                  didn&apos;t approve.
                </p>
              </label>
            </div>
            <div>
              <Label htmlFor="pitch" className="text-sm">
                One-line pitch{" "}
                <span className="font-normal text-muted-foreground">
                  (optional, 240 chars)
                </span>
              </Label>
              <Input
                id="pitch"
                name="pitch"
                maxLength={240}
                defaultValue={workspace.pitch ?? ""}
                placeholder="e.g. Testimoni turns a customer tweet into a live wall in 30 seconds."
                className="mt-1"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="websiteUrl" className="text-sm">
                  Website{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  maxLength={400}
                  defaultValue={workspace.websiteUrl ?? ""}
                  placeholder="https://yoursite.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="xHandle" className="text-sm">
                  X (Twitter) handle{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="xHandle"
                  name="xHandle"
                  maxLength={60}
                  defaultValue={workspace.xHandle ?? ""}
                  placeholder="usetestimoni"
                  className="mt-1"
                />
              </div>
            </div>
            {workspace.publicListing && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs">
                <p className="font-semibold text-primary">
                  ✓ Your profile is live
                </p>
                <p className="mt-1 text-muted-foreground">
                  View it at{" "}
                  <Link
                    href={`/founders/${workspace.slug}`}
                    target="_blank"
                    className="font-mono text-primary hover:underline"
                  >
                    /founders/{workspace.slug}
                  </Link>
                  . Embeddable trending badge:{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                    /api/badges/trending/{workspace.slug}.svg
                  </code>
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>

      {/* Logo upload */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Upload your workspace logo. This appears on your collection forms and
            widgets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {workspace.logoUrl ? (
              <img
                src={workspace.logoUrl}
                alt="Workspace logo"
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                <span className="text-xs text-muted-foreground">No logo</span>
              </div>
            )}
            <div>
              <Button variant="outline" type="button">
                Upload Logo
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG, or SVG. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan info */}
      <Card id="billing">
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Your current plan and subscription details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">
                {plan === "FREE" ? "Free Plan" : "Pro Plan"}
              </p>
              <p className="text-sm text-muted-foreground">
                {plan === "FREE"
                  ? "10 testimonials, 1 widget, basic features"
                  : "Unlimited testimonials, widgets, and premium features"}
              </p>
            </div>
            {plan === "FREE" ? (
              <UpgradeProButton surface="settings" />
            ) : (
              <Button variant="outline" asChild>
                <TrackedLink cta="settings_manage_subscription" surface="settings" href="/dashboard/settings/billing">Manage Subscription</TrackedLink>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <ChangePasswordCard />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Delete Workspace</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this workspace and all its data. This action
                cannot be undone.
              </p>
            </div>
            <form action="/api/workspace/delete" method="POST">
              <Button type="submit" variant="destructive">
                Delete Workspace
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
