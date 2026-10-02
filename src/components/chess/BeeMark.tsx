import { cn } from "@/lib/utils";

export function BeeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      aria-hidden="true"
    >
      <ellipse cx="16" cy="18" rx="8.5" ry="9.5" fill="currentColor" opacity="0.95" />
      <ellipse cx="16" cy="13" rx="6" ry="5.5" fill="currentColor" />
      <rect x="9" y="16" width="14" height="2.2" rx="1" fill="var(--bg)" opacity="0.55" />
      <rect x="9.5" y="20.5" width="13" height="2.2" rx="1" fill="var(--bg)" opacity="0.55" />
      <path
        d="M8.5 14c-3-4-6-3.2-5.2.6 1.2 5 4.8 6.4 5.2 3.2z"
        fill="var(--fg)"
        opacity="0.35"
      />
      <path
        d="M23.5 14c3-4 6-3.2 5.2.6-1.2 5-4.8 6.4-5.2 3.2z"
        fill="var(--fg)"
        opacity="0.35"
      />
      <circle cx="13.6" cy="12.2" r="1.15" fill="var(--bg)" />
      <circle cx="18.4" cy="12.2" r="1.15" fill="var(--bg)" />
      <path
        d="M13.2 8.2c-1.4-3.2.2-4.6 1.4-2.2M18.8 8.2c1.4-3.2-.2-4.6-1.4-2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
