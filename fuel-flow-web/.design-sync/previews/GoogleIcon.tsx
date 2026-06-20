import { GoogleIcon, Button } from 'fuel-flow-web';

export const Default = () => (
  <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
    <GoogleIcon className="size-8" />
    <Button variant="outline">
      <GoogleIcon className="size-4" />
      Continue with Google
    </Button>
  </div>
);
