import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Link as LinkIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Code,
    title: "Code Snippets",
    description: "Save reusable code with syntax highlighting for any language. Never rewrite the same utility twice.",
    accent: "#3b82f6",
  },
  {
    icon: Sparkles,
    title: "AI Prompts",
    description: "Store your best system prompts and reusable AI workflows. Build a library that gets smarter over time.",
    accent: "#f59e0b",
  },
  {
    icon: Terminal,
    title: "Commands",
    description: "One place for all your CLI commands, scripts, and shell one-liners. No more trawling bash history.",
    accent: "#06b6d4",
  },
  {
    icon: StickyNote,
    title: "Notes",
    description: "Markdown-powered notes for architecture decisions, meeting outcomes, and anything worth keeping.",
    accent: "#22c55e",
  },
  {
    icon: File,
    title: "Files & Docs",
    description: "Upload context files, templates, and documentation directly. Access them from anywhere.",
    accent: "#64748b",
    pro: true,
  },
  {
    icon: LinkIcon,
    title: "Collections",
    description: "Group related items into collections — React Patterns, Interview Prep, Project Boilerplates.",
    accent: "#6366f1",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-card border-y border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 fade-in">
          <h2 className="text-3xl font-bold mb-3">
            Everything a developer needs, in one place
          </h2>
          <p className="text-muted-foreground text-lg">
            Seven item types cover every piece of knowledge you reach for daily.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="fade-in rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-shadow duration-300 hover:shadow-[0_0_24px_var(--card-accent)]"
                style={{ "--card-accent": `${f.accent}40` } as React.CSSProperties}
              >
                <div className="mb-4" style={{ color: f.accent }}>
                  <Icon className="size-6" />
                </div>
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  {f.title}
                  {f.pro && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase tracking-wide">
                      Pro
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
