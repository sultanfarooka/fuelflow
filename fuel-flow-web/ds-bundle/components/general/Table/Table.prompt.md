Table from fuel-flow-web. Use via `window.FuelFlowDS.Table` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <div style={{ padding: 16, maxWidth: 640 }}>
    <Table>
      <TableCaption>Open shifts across stations</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Station</TableHead>
          <TableHead>Nozzleman</TableHead>
          <TableHead>Started</TableHead>
          <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Karachi - North</TableCell>
          <TableCell>Asif Khan</TableCell>
          <TableCell>06:00</TableCell>
          <TableCell style={{ textAlign: 'right' }}>
            <Badge>Open</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Lahore - DHA</TableCell>
          <TableCell>Bilal Ahmed</TableCell>
          <TableCell>06:00</TableCell>
          <TableCell style={{ textAlign: 'right' }}>
            <Badge>Open</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Islamabad - F-10</TableCell>
          <TableCell>Hamza Iqbal</TableCell>
          <TableCell>14:00</TableCell>
          <TableCell style={{ textAlign: 'right' }}>
            <Badge variant="secondary">Closed</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
)
```
