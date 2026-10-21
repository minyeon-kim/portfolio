// End-of-case CTA content, shared by the home stage and direct case pages: a
// preview of the next project's opener (its serif title in the project colour)
// with the one-line problem, so the handoff into that opener reads as one move.
export function NextProjectContent({ slug, name, description }: { slug: string; name: string; description?: string }) {
  const variant = slug === "workflow-app" ? "devsign" : slug === "gemini-privacy" ? "gemini" : undefined;
  return (
    <>
      <span className="next-project-label">Next project</span>
      <span className="next-project-title" data-variant={variant}>
        <span className="next-project-name">{name}</span>
        <svg className="next-project-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {description && <span className="next-project-description">{description}</span>}
    </>
  );
}
