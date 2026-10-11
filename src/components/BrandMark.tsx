/** A single hand-drawn stroke, the app's mark. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 16.5c2.2-5.6 4.6-8.4 6.4-8.1 2.5.4.4 7.6 2.9 8 2.1.3 3.6-6.3 7.7-9.9"
        stroke="var(--accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
