Field from fuel-flow-web. Use via `window.FuelFlowDS.Field` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <div style={{ padding: 16, maxWidth: 360 }}>
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" type="email" placeholder="owner@example.com" />
        <FieldDescription>We'll send a verification link.</FieldDescription>
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <Input id="phone" type="tel" placeholder="+92 3xx xxxxxxx" aria-invalid />
        <FieldError errors={[{ message: 'Phone is required.' }]} />
      </Field>
    </FieldGroup>
  </div>
)
```
