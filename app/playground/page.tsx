import type { Metadata } from "next";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-page px-2 pt-8 pb-12 md:px-4">
      <h1 className="mb-2 text-xl font-medium tracking-tight">Playground</h1>
      {/* TODO: small experiments and demos. Content goes in /content. */}
    </div>
  );
}
