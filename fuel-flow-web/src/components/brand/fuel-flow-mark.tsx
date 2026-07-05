export const FuelFlowMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Fuel Flow"
    className={className}
  >
    <defs>
      <mask id="ff-cuts" maskUnits="userSpaceOnUse">
        <rect width="64" height="64" fill="white" />
        <path d="M14 22 L26 18 L34 20 L34 25 L17 26 Z" fill="black" />
        <path d="M14 26 L21 26 L21 35 L17 35 L17 31 L14 31 Z" fill="black" />
        <path d="M40 26 Q37 30 37 33 Q37 36 40 36 Q43 36 43 33 Q43 30 40 26 Z" fill="black" />
        <path
          d="M14 50 L24 42 L32 46 L46 36"
          stroke="black"
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42 34 L46 36 L44 40"
          stroke="black"
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>
    </defs>
    <path
      d="M32 4 L10 11 V32 C10 49 20 58 32 60 C44 58 54 49 54 32 V11 L32 4 Z"
      fill="currentColor"
      mask="url(#ff-cuts)"
    />
  </svg>
);
