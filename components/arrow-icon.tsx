// A drawn arrow for buttons and tables, in place of the "→" text character.
export function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="arrow-icon" width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
