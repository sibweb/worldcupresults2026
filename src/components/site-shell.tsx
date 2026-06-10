import type { Route } from "next";
import Link from "next/link";
import { ReactNode } from "react";

const navItems: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Overview" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/progress", label: "Progress" },
  { href: "/awards", label: "Awards" },
  { href: "/sweepstakes", label: "Sweepstakes" },
];

export function SiteShell({
  children,
  title,
  intro,
  heroAside,
}: {
  children: ReactNode;
  title: string;
  intro: string;
  heroAside?: ReactNode;
}) {
  return (
    <main className="shell">
      <nav className="nav" aria-label="Primary">
        {navItems.map((item) => (
          <Link className="nav-link" key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="hero">
        <div>
          <span className="eyebrow">World Cup 2026 Tracker</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        {heroAside ? <div className="grid">{heroAside}</div> : null}
      </section>

      {children}
    </main>
  );
}