import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChaosCanvas } from "./chaos-canvas";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 py-24 w-full flex flex-col items-center gap-16">
        {/* Text — centered */}
        <div className="fade-in text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            Stop Losing Your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Snippets in GitHub Gists. Prompts buried in chat history. Commands in a
            .txt file somewhere. DevStash puts everything in one fast, searchable hub.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 h-11 text-base font-semibold"
              )}
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "px-6 h-11 text-base"
              )}
            >
              See Features
            </a>
          </div>
        </div>

        {/* Visual — full width below */}
        <div className="fade-in w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Chaos box */}
              <div className="w-full sm:flex-1 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground text-center">Your knowledge today…</p>
                <div className="h-52 sm:h-64">
                  <ChaosCanvas />
                </div>
              </div>

              {/* Arrow */}
              <div className="text-blue-400 sm:rotate-0 rotate-90 shrink-0">
                <svg
                  viewBox="0 0 60 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-10 sm:size-12"
                >
                  <path
                    d="M10 30 H46 M34 18 L46 30 L34 42"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Dashboard preview */}
              <div className="w-full sm:flex-1 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground text-center">…with DevStash</p>
                <div className="h-52 sm:h-64 rounded-xl border border-white/10 bg-white/[0.03] p-3 flex gap-2 overflow-hidden">
                  {/* Sidebar */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {[
                      { label: "Snippets", color: "#3b82f6" },
                      { label: "Prompts", color: "#f59e0b" },
                      { label: "Commands", color: "#06b6d4" },
                      { label: "Notes", color: "#22c55e" },
                      { label: "Links", color: "#6366f1" },
                    ].map((t) => (
                      <div key={t.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ background: t.color }}
                        />
                        {t.label}
                      </div>
                    ))}
                  </div>

                  {/* Cards */}
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    {[
                      { title: "useDebounce hook", meta: "TypeScript · #react", color: "#3b82f6" },
                      { title: "Code review prompt", meta: "Prompt · #ai", color: "#f59e0b" },
                      { title: "git reset --hard HEAD~1", meta: "Command · #git", color: "#06b6d4" },
                      { title: "API design notes", meta: "Note · #backend", color: "#22c55e" },
                    ].map((c) => (
                      <div
                        key={c.title}
                        className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5"
                        style={{ borderTopColor: c.color, borderTopWidth: 2 }}
                      >
                        <div className="text-[10px] font-medium truncate">{c.title}</div>
                        <div className="text-[9px] text-muted-foreground truncate">{c.meta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}
