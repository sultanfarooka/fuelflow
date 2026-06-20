Dialog from fuel-flow-web. Use via `window.FuelFlowDS.Dialog` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <Dialog defaultOpen modal={false}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete tank?</DialogTitle>
        <DialogDescription>
          This will permanently remove Tank A1 and its readings. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">Delete tank</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
```
