Tooltip from fuel-flow-web. Use via `window.FuelFlowDS.Tooltip` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
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
)
```
