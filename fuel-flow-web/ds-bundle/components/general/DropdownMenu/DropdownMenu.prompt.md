DropdownMenu from fuel-flow-web. Use via `window.FuelFlowDS.DropdownMenu` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
    <DropdownMenu defaultOpen modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Station</DropdownMenuLabel>
        <DropdownMenuItem>View dashboard</DropdownMenuItem>
        <DropdownMenuItem>Open shift</DropdownMenuItem>
        <DropdownMenuItem>Set prices</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Deactivate station</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)
```
