Tabs from fuel-flow-web. Use via `window.FuelFlowDS.Tabs` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <div style={{ padding: 16, maxWidth: 480 }}>
    <Tabs defaultValue="sales">
      <TabsList>
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="credit">Credit</TabsTrigger>
      </TabsList>
      <TabsContent value="sales">
        <p style={{ fontSize: 14, padding: '12px 0' }}>
          Today's sales: Rs. 1,25,000 across 3 nozzles. Petrol leads at 60%.
        </p>
      </TabsContent>
      <TabsContent value="inventory">
        <p style={{ fontSize: 14, padding: '12px 0' }}>
          Tank A1 (Petrol) at 8,400 L of 12,000 L capacity.
        </p>
      </TabsContent>
      <TabsContent value="credit">
        <p style={{ fontSize: 14, padding: '12px 0' }}>
          12 udhaar customers. Total outstanding: Rs. 4,80,500.
        </p>
      </TabsContent>
    </Tabs>
  </div>
)
```
