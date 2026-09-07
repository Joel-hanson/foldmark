type FoldmarkLogoProps = {
  className?: string;
  title?: string;
};

/** Folded-bookmark mark used in the header and share/OG surfaces. */
export function FoldmarkLogo({ className, title }: FoldmarkLogoProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width="40"
      height="40"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="40" height="40" rx="8" fill="#eef0ec" />
      <g transform="translate(20 21)">
        <path d="M-9.5 -10.5 L0 -7.8 L0 10.5 L-9.5 7.8 Z" fill="#243f35" />
        <path d="M9.5 -10.5 L0 -7.8 L0 10.5 L9.5 7.8 Z" fill="#2c4a3e" />
        <path
          d="M-9.5 -10.5 L0 -7.8 L9.5 -10.5"
          stroke="#f7f8f5"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <line
          x1="0"
          y1="-7.8"
          x2="0"
          y2="10.5"
          stroke="#1c1f1c"
          strokeWidth="0.7"
          opacity="0.28"
        />
      </g>
    </svg>
  );
}
