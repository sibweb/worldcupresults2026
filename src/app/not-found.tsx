import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function NotFound() {
  return (
    <SiteShell
      title="That team page does not exist."
      intro="Use the navigation to jump back to the tournament dashboard, fixtures board, or sweepstakes admin area."
    >
      <section className="card stack" style={{ marginTop: "1.25rem" }}>
        <p className="muted">The route you requested is not part of the current seeded tournament dataset.</p>
        <Link className="button" href="/">
          Return to overview
        </Link>
      </section>
    </SiteShell>
  );
}