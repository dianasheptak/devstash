import { PricingToggle } from "./pricing-toggle";

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 fade-in">
          <h2 className="text-3xl font-bold mb-3">Simple, honest pricing</h2>
          <p className="text-muted-foreground text-lg">
            Start free, upgrade when you need more.
          </p>
        </div>
        <div className="fade-in">
          <PricingToggle />
        </div>
      </div>
    </section>
  );
}
