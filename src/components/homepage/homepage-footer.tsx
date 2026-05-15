import Link from "next/link";

const LINKS = [
  {
    heading: "Product",
    items: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { label: "Documentation", href: "#" },
      { label: "Blog", href: "#" },
      { label: "GitHub", href: "#" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function HomepageFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <span className="text-2xl text-blue-400">⬡</span>
              DevStash
            </Link>
            <p className="text-sm text-muted-foreground">Your developer knowledge hub.</p>
          </div>

          {/* Link columns */}
          {LINKS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold mb-3">{col.heading}</h4>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-6 text-sm text-muted-foreground">
          &copy; {year} DevStash. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
