type FoldmarkLogoProps = {
  className?: string;
  title?: string;
};

/** Foldmark F mark — from public/logo.svg, framed for the header badge. */
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
      <rect width="40" height="40" rx="8" fill="#f9f8f3" />
      <g transform="translate(20 20) scale(0.155) translate(-109.5 -115)">
        <path fill="#20252B" d="M50 78 L169 27 L169 61 L50 113 Z" />
        <path fill="#20252B" d="M50 126 L135 89 L135 123 L50 161 Z" />
        <path fill="#FF5A36" d="M50 177 L94 156 L94 203 Z" />
      </g>
    </svg>
  );
}
