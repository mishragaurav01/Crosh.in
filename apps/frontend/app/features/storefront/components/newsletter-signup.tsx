"use client";

import { useState } from "react";

/**
 * Newsletter section — responsive layout:
 * - Mobile: Stacked vertical form with full-width input and button
 * - Desktop: Editorial card with inline form (input + button side-by-side)
 *
 * No subscriber backend exists this pass — submit is a visible no-op.
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Thanks for your interest! Subscriptions are coming soon.");
    setEmail("");
  }

  return (
    <section id="contact" aria-label="Newsletter">
      {/* ─── Mobile Layout ─── */}
      <div className="md:hidden mx-container-margin">
        <div className="bg-secondary-container rounded-3xl px-xl py-[33px] text-center">
          <h2 className="font-headline-sm text-headline-sm text-on-secondary-container mb-sm">
            Join the Club
          </h2>
          <p className="font-body-md text-body-md text-on-secondary-container/80 mb-lg">
            Receive exclusive launches and floral inspiration directly in your
            inbox.
          </p>

          <form onSubmit={handleSubmit} className="space-y-sm">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="w-full bg-surface-bright border-none rounded-xl px-lg py-md text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-md rounded-xl font-label-md text-label-md shadow-sm active:scale-[0.98] transition-transform"
            >
              Join the Club
            </button>
          </form>

          {notice && (
            <p
              role="status"
              aria-live="polite"
              className="mt-md text-center font-body-md text-body-md text-on-secondary-container"
            >
              {notice}
            </p>
          )}
        </div>
      </div>

      {/* ─── Desktop Layout ─── */}
      <div className="hidden md:block max-w-[1280px] mx-auto px-lg py-xxl">
        <div className="bg-secondary-container/30 rounded-[40px] p-xxl text-center">
          <h2 className="font-display-lg text-headline-md text-on-secondary-container mb-md">
            Join our garden
          </h2>
          <p className="text-body-lg font-body-lg text-on-secondary-container/80 mb-xl max-w-[32rem] mx-auto">
            Subscribe for exclusive early access to new collections and a 10%
            discount on your first order.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-md max-w-[36rem] mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="flex-1 bg-surface border-none rounded-full px-lg py-md text-on-surface focus:ring-2 focus:ring-primary/20 transition-all focus:outline-none"
            />
            <button
              type="submit"
              className="bg-primary text-on-primary px-xxl py-md rounded-full font-label-md text-label-md hover:shadow-lg transition-all"
            >
              Subscribe
            </button>
          </form>

          {notice && (
            <p
              role="status"
              aria-live="polite"
              className="mt-md text-center font-body-md text-body-md text-on-secondary-container"
            >
              {notice}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
