"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
  workspaceName: string;
}

const pathLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/testimonials": "Testimonials",
  "/dashboard/widgets": "Widgets",
  "/dashboard/collect": "Collect",
  "/dashboard/import": "Import",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

export function Header({
  userName,
  userEmail,
  userAvatarUrl,
  workspaceName,
}: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLabel = pathLabels[pathname] || "Dashboard";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Breadcrumb area */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{workspaceName}</span>
        <span className="text-sm text-muted-foreground">/</span>
        <h1 className="text-sm font-medium">{currentLabel}</h1>
      </div>

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userName || "User avatar"}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {(userName || userEmail).charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden text-sm font-medium sm:inline-block">
            {userName || userEmail}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border bg-background shadow-lg">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">{userName || "User"}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <div className="p-1">
              <Link
                href="/dashboard/settings"
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Settings
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
