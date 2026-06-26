import { Button } from 'fuel-flow-web';

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2 p-4">
    <Button>Open shift</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="outline">Filter</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="destructive">Delete tank</Button>
    <Button variant="link">View report</Button>
  </div>
);

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-2 p-4">
    <Button size="xs">Extra small</Button>
    <Button size="sm">Small</Button>
    <Button>Default</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const States = () => (
  <div className="flex flex-wrap items-center gap-2 p-4">
    <Button>Enabled</Button>
    <Button disabled>Disabled</Button>
    <Button variant="outline" disabled>Disabled outline</Button>
  </div>
);
