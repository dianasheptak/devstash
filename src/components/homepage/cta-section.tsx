import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="fade-in text-center rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/10 to-violet-600/10 px-8 py-16">
          <h2 className="text-3xl font-bold mb-3">
            Ready to organize your knowledge?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join developers who stopped losing their best work.
          </p>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-blue-600 hover:bg-blue-700 text-white border-0 px-8 h-12 text-base font-semibold"
            )}
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </section>
  );
}
