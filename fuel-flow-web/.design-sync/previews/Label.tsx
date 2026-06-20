import { Label, Input } from 'fuel-flow-web';

export const Default = () => (
  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
    <Label htmlFor="station-name">Station name</Label>
    <Input id="station-name" placeholder="Karachi - North" />
  </div>
);
