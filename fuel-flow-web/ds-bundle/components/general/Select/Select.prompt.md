Select from fuel-flow-web. Use via `window.FuelFlowDS.Select` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <div style={{ padding: 24, maxWidth: 280 }}>
    <Select defaultValue="petrol" open>
      <SelectTrigger>
        <SelectValue placeholder="Choose fuel type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="petrol">Petrol</SelectItem>
        <SelectItem value="diesel">Diesel</SelectItem>
        <SelectItem value="hi-octane">Hi-Octane</SelectItem>
        <SelectItem value="cng">CNG</SelectItem>
      </SelectContent>
    </Select>
  </div>
)
```

### Closed

```jsx
() => (
  <div style={{ padding: 24, maxWidth: 280 }}>
    <Select defaultValue="diesel">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="petrol">Petrol</SelectItem>
        <SelectItem value="diesel">Diesel</SelectItem>
        <SelectItem value="hi-octane">Hi-Octane</SelectItem>
      </SelectContent>
    </Select>
  </div>
)
```
