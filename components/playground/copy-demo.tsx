import { CopyButton } from "@/components/copy-button";

// Sample values only; none of these are real secrets.
const CODES = ["4F7K-9QX2-MB3T", "R8DN-2WVL-6PZC", "J5HY-T3KQ-8XAE"];

export function CopyDemo() {
  return (
    <div>
      <p className="mb-1 font-mono text-xs text-muted">Recovery codes (sample)</p>
      <ul className="space-y-0.5">
        {CODES.map((code) => (
          <li
            key={code}
            className="flex items-center justify-between gap-1 rounded-full bg-fill py-0.5 pr-0.5 pl-2"
          >
            <code className="font-mono text-sm">{code}</code>
            <CopyButton value={code} />
          </li>
        ))}
      </ul>
    </div>
  );
}
