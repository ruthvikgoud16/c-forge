export function Logo() {
  return (
    <span className="em-logo">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="6" className="em-logo-mark" />
        <path d="M20.5 10.5a7 7 0 1 0 0 11" className="em-logo-arc" />
        <rect x="19" y="14.5" width="6" height="3" rx="1" className="em-logo-bit" />
      </svg>
      <span>
        C<span className="em-copper">Forge</span>
      </span>
    </span>
  );
}
