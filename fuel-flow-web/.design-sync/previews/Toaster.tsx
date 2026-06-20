import { Toaster } from 'fuel-flow-web';

export const Default = () => (
  <div style={{ position: 'relative', minHeight: 140, padding: 16 }}>
    <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
      Sonner toast container — mount once at app root. <code>toast.success("Tank created")</code> dispatches a notification.
    </p>
    <Toaster position="top-right" theme="light" />
  </div>
);
