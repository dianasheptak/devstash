"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function HomepageNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled && "navbar-scrolled"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl text-blue-400">⬡</span>
          <span>DevStash</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <li>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          </li>
          <li>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </li>
        </ul>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "ghost", size: "default" }))}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "bg-blue-600 hover:bg-blue-700 text-white border-0"
            )}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-sm px-6 py-4 flex flex-col gap-3">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            onClick={() => setMobileOpen(false)}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            onClick={() => setMobileOpen(false)}
          >
            Pricing
          </a>
          <hr className="border-white/10" />
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-blue-600 hover:bg-blue-700 text-white border-0 justify-center"
            )}
            onClick={() => setMobileOpen(false)}
          >
            Get Started Free
          </Link>
        </div>
      )}
    </nav>
  );
}
