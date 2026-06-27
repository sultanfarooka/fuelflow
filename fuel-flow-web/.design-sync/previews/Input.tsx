import { Input, Label } from 'fuel-flow-web';

export const Default = () => (
  <div className="flex max-w-xs flex-col gap-2 p-4">
    <Label htmlFor="station">Station name</Label>
    <Input id="station" placeholder="Karachi - North" />
  </div>
);

export const Types = () => (
  <div className="flex max-w-xs flex-col gap-3 p-4">
    <Input type="email" placeholder="owner@example.com" />
    <Input type="tel" placeholder="+92 3xx xxxxxxx" />
    <Input type="number" placeholder="Litres dispensed" />
  </div>
);

export const States = () => (
  <div className="flex max-w-xs flex-col gap-3 p-4">
    <Input defaultValue="Rs. 272.50" />
    <Input placeholder="Disabled field" disabled />
    <Input defaultValue="not-an-email" aria-invalid />
  </div>
);
