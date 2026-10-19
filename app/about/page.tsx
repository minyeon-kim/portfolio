import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-prose px-2 pt-8 pb-12">
      <h1 className="mb-2 text-xl font-medium tracking-tight">About</h1>
      {/* TODO: bio, background, and experience. Content goes in /content. */}
    </div>
  );
}
