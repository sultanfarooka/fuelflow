Sheet from fuel-flow-web. Use via `window.FuelFlowDS.Sheet` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <Sheet defaultOpen modal={false}>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>Edit station</SheetTitle>
        <SheetDescription>
          Update the station details and fuel prices. Changes apply on the next shift.
        </SheetDescription>
      </SheetHeader>
      <div style={{ padding: '0 16px', flex: 1 }}>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          Station name, address, OMC, and contact information go here.
        </p>
      </div>
      <SheetFooter>
        <Button variant="ghost">Cancel</Button>
        <Button>Save changes</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
)
```
