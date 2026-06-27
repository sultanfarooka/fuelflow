import { Alert, AlertTitle, AlertDescription } from 'fuel-flow-web';

export const Info = () => (
  <div className="max-w-md p-4">
    <Alert>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <AlertTitle>Morning shift still open</AlertTitle>
      <AlertDescription>
        Karachi - North has an open shift from 06:00. Close it before starting a new one.
      </AlertDescription>
    </Alert>
  </div>
);

export const Destructive = () => (
  <div className="max-w-md p-4">
    <Alert variant="destructive">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      <AlertTitle>Credit limit reached</AlertTitle>
      <AlertDescription>
        This udhaar customer is at Rs. 50,000 of a Rs. 50,000 limit. New credit sales are blocked.
      </AlertDescription>
    </Alert>
  </div>
);
