import type { Metadata } from "next";
import { ExperimentGrid } from "@/components/playground/experiments";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-page px-2 pt-8 pb-12 md:px-4">
      <header className="mb-6 max-w-prose">
        <h1 className="mb-1 text-xl font-normal tracking-tight">Playground</h1>
        <p className="text-base text-muted">Small interaction experiments. Each one works right in its card.</p>
      </header>
      <ExperimentGrid />
    </div>
  );
}
