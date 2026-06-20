GoogleIcon from fuel-flow-web. Use via `window.FuelFlowDS.GoogleIcon` (bundle loaded from the root `_ds_bundle.js`).

Google "G" logo for sign-in/sign-up buttons.

## Examples

### Default

```jsx
() => (
  <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
    <GoogleIcon className="size-8" />
    <Button variant="outline">
      <GoogleIcon className="size-4" />
      Continue with Google
    </Button>
  </div>
)
```
