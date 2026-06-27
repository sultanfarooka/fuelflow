import { Badge } from 'fuel-flow-web';

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2 p-4">
    <Badge>Default</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="destructive">Destructive</Badge>
    <Badge variant="outline">Outline</Badge>
  </div>
);

export const StatusLabels = () => (
  <div className="flex flex-wrap items-center gap-2 p-4">
    <Badge>Shift open</Badge>
    <Badge variant="secondary">Shift closed</Badge>
    <Badge variant="destructive">Stock low</Badge>
    <Badge variant="outline">Trial</Badge>
  </div>
);
