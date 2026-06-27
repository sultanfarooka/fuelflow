import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from 'fuel-flow-web';

export const StationSummary = () => (
  <div className="max-w-sm p-4">
    <Card>
      <CardHeader>
        <CardTitle>Karachi - North</CardTitle>
        <CardDescription>PSO · 3 nozzles · 2 tanks</CardDescription>
        <CardAction>
          <Badge>Open</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground">Today's sales</div>
          <div className="font-medium">Rs. 1,25,000</div>
        </div>
        <div>
          <div className="text-muted-foreground">Litres sold</div>
          <div className="font-medium">472 L</div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">Details</Button>
        <Button>Open shift</Button>
      </CardFooter>
    </Card>
  </div>
);

export const Compact = () => (
  <div className="max-w-xs p-4">
    <Card size="sm">
      <CardHeader>
        <CardTitle>Tank A1 — Petrol</CardTitle>
        <CardDescription>8,400 L of 12,000 L</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">70% capacity remaining</CardContent>
    </Card>
  </div>
);
