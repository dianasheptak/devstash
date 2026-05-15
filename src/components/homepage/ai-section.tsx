import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CHECKLIST = [
  {
    title: "Auto-tagging",
    desc: "AI analyzes content and suggests the most relevant tags automatically.",
  },
  {
    title: "Smart summaries",
    desc: "Get a plain-English description of any snippet or command in one click.",
  },
  {
    title: "Explain This Code",
    desc: "Paste any snippet and get a detailed line-by-line breakdown.",
  },
  {
    title: "Prompt optimizer",
    desc: "Refine your AI prompts for better, more consistent results.",
  },
];

const AI_TAGS = [
  { label: "#react", color: "#3b82f6" },
  { label: "#hooks", color: "#f59e0b" },
  { label: "#typescript", color: "#06b6d4" },
  { label: "#performance", color: "#22c55e" },
  { label: "#debounce", color: "#6366f1" },
];

export function AiSection() {
  return (
    <section id="ai" className="py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center fade-in">
          {/* Left */}
          <div>
            <Badge variant="secondary" className="mb-4 uppercase tracking-wide text-xs">
              Pro Feature
            </Badge>
            <h2 className="text-3xl font-bold mb-8">
              Your knowledge base, supercharged by AI
            </h2>
            <ul className="space-y-5 mb-8">
              {CHECKLIST.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 size-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs shrink-0">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 h-11 text-base font-semibold"
              )}
            >
              Upgrade to Pro
            </Link>
          </div>

          {/* Right — code mockup */}
          <div className="rounded-xl border border-white/10 bg-[#1e1e1e] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-[#2d2d2d]">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
              <span className="text-xs text-muted-foreground ml-3">useDebounce.ts</span>
            </div>

            {/* Code */}
            <pre className="p-5 text-[0.75rem] leading-relaxed overflow-x-auto font-mono">
              <code>
                <span className="text-[#569cd6]">import </span>
                <span className="text-[#d4d4d4]">{"{ "}</span>
                <span className="text-[#9cdcfe]">useState, useEffect</span>
                <span className="text-[#d4d4d4]">{" } "}</span>
                <span className="text-[#569cd6]">from </span>
                <span className="text-[#ce9178]">&apos;react&apos;</span>
                {"\n\n"}
                <span className="text-[#569cd6]">export function </span>
                <span className="text-[#dcdcaa]">useDebounce</span>
                <span className="text-[#d4d4d4]">{"<T>("}</span>
                {"\n  "}
                <span className="text-[#9cdcfe]">value</span>
                <span className="text-[#d4d4d4]">: T,</span>
                {"\n  "}
                <span className="text-[#9cdcfe]">delay</span>
                <span className="text-[#d4d4d4]">: </span>
                <span className="text-[#4ec9b0]">number</span>
                {"\n"}
                <span className="text-[#d4d4d4]">): T {"{"}</span>
                {"\n  "}
                <span className="text-[#569cd6]">const </span>
                <span className="text-[#d4d4d4]">[debouncedValue, setDebouncedValue] =</span>
                {"\n    "}
                <span className="text-[#dcdcaa]">useState</span>
                <span className="text-[#d4d4d4]">{"<T>"}</span>
                <span className="text-[#d4d4d4]">(value)</span>
                {"\n\n  "}
                <span className="text-[#dcdcaa]">useEffect</span>
                <span className="text-[#d4d4d4]">{"(() => {"}</span>
                {"\n    "}
                <span className="text-[#569cd6]">const </span>
                <span className="text-[#d4d4d4]">timer = </span>
                <span className="text-[#dcdcaa]">setTimeout</span>
                <span className="text-[#d4d4d4]">{"(() => {"}</span>
                {"\n      "}
                <span className="text-[#dcdcaa]">setDebouncedValue</span>
                <span className="text-[#d4d4d4]">(value)</span>
                {"\n    "}
                <span className="text-[#d4d4d4]">{"}"}</span>
                <span className="text-[#d4d4d4]">, delay)</span>
                {"\n    "}
                <span className="text-[#569cd6]">return </span>
                <span className="text-[#d4d4d4]">{"() => "}</span>
                <span className="text-[#dcdcaa]">clearTimeout</span>
                <span className="text-[#d4d4d4]">(timer)</span>
                {"\n  "}
                <span className="text-[#d4d4d4]">{"}"}</span>
                <span className="text-[#d4d4d4]">, [value, delay])</span>
                {"\n\n  "}
                <span className="text-[#569cd6]">return </span>
                <span className="text-[#d4d4d4]">debouncedValue</span>
                {"\n"}
                <span className="text-[#d4d4d4]">{"}"}</span>
              </code>
            </pre>

            {/* AI tags */}
            <div className="px-5 pb-5 border-t border-white/10 pt-4">
              <p className="text-xs text-muted-foreground mb-2">✦ AI Generated Tags</p>
              <div className="flex flex-wrap gap-2">
                {AI_TAGS.map((tag) => (
                  <span
                    key={tag.label}
                    className="text-xs px-2 py-0.5 rounded-full border font-mono"
                    style={{
                      color: tag.color,
                      borderColor: `${tag.color}60`,
                      background: `${tag.color}15`,
                    }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
