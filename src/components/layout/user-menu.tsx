"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronUp, LogOut, Settings, UserRound } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

type Props = {
  user: { name?: string | null; email?: string | null; image?: string | null };
  collapsed: boolean;
};

export function UserMenu({ user, collapsed }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative border-t border-border shrink-0",
        collapsed ? "px-2 py-3" : "px-3 py-3"
      )}
    >
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 rounded-md border border-border bg-popover text-popover-foreground shadow-md py-1 text-sm">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors"
          >
            <UserRound className="size-4" />
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors"
          >
            <Settings className="size-4" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent transition-colors text-left"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}

      <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
        <Link
          href="/profile"
          aria-label="View profile"
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar
            name={user.name}
            email={user.email}
            image={user.image}
            className="size-7"
            size="sm"
          />
        </Link>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">
                {user.name ?? "Account"}
              </p>
              {user.email && (
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {user.email}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open user menu"
              aria-expanded={open}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ChevronUp
                className={cn("size-4 transition-transform", open ? "" : "rotate-180")}
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
