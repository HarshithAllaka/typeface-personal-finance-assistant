import { Link } from "react-router-dom";

export default function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      {/* Logo */}
      <svg
        width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="fsGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#fsGrad)" />
        {/* stylized F + S */}
        <path d="M10 11h8v3h-5v2h4v3h-4v3h-3V11z" fill="#0b1220" opacity="0.95" />
        <path d="M17 18c0-2 1.7-3 3.5-3c1.7 0 3.5 1 3.5 3c0 1.7-1.5 2.6-3 3.1c-1.4.5-1.7.7-1.7 1.1c0 .3.3.6 1.3.6c.8 0 1.7-.2 2.6-.6l.6 2.3c-1 .4-2.2.7-3.6.7c-2.1 0-3.7-.9-3.7-2.8c0-1.5 1-2.4 2.8-3.1c.9-.3 1.9-.6 1.9-1.1c0-.4-.5-.7-1.3-.7c-.8 0-1.7.3-2.4.7L17 18z" fill="#0b1220" opacity="0.95" />
      </svg>
      {/* Name */}
      <span className="font-semibold tracking-tight text-zinc-100 group-hover:text-white">
        FinSight
      </span>
    </Link>
  );
}
