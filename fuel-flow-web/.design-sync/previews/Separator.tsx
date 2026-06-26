import { Separator } from 'fuel-flow-web';

export const Horizontal = () => (
  <div className="max-w-sm p-4">
    <div className="space-y-1">
      <h4 className="text-sm font-medium">Shift summary</h4>
      <p className="text-sm text-muted-foreground">Karachi - North · 06:00–14:00</p>
    </div>
    <Separator className="my-4" />
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Sales</span>
      <Separator orientation="vertical" />
      <span>Inventory</span>
      <Separator orientation="vertical" />
      <span>Credit</span>
    </div>
  </div>
);
