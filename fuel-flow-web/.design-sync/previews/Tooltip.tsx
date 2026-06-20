import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from 'fuel-flow-web';

export const Default = () => (
  <TooltipProvider>
    <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent side="top">Add a new fuel type</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);
