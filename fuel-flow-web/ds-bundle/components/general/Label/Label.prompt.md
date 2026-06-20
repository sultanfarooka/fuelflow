Label from fuel-flow-web. Use via `window.FuelFlowDS.Label` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
    <Label htmlFor="station-name">Station name</Label>
    <Input id="station-name" placeholder="Karachi - North" />
  </div>
)
```
