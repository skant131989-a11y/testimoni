import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
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
    redirect("/onboarding");
  }

  const workspace = dbUser.workspaceMembers[0].workspace;
  const plan = workspace.subscription?.plan ?? "FREE";

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
              <Button>Upgrade to Pro</Button>
            ) : (
              <Button variant="outline">Manage Subscription</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
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
