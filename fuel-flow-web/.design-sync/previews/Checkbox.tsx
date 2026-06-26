import { Checkbox, Label } from 'fuel-flow-web';

export const States = () => (
  <div className="flex flex-col gap-4 p-4">
    <div className="flex items-center gap-2">
      <Checkbox id="cb-unchecked" />
      <Label htmlFor="cb-unchecked">Send SMS receipt</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="cb-checked" defaultChecked />
      <Label htmlFor="cb-checked">Track as credit (udhaar)</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="cb-disabled" disabled />
      <Label htmlFor="cb-disabled">Auto-close shift (Pro)</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="cb-disabled-checked" defaultChecked disabled />
      <Label htmlFor="cb-disabled-checked">Require manager approval</Label>
    </div>
  </div>
);
