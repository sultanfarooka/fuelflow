Sidebar from fuel-flow-web. Use via `window.FuelFlowDS.Sidebar` (bundle loaded from the root `_ds_bundle.js`).

## Examples

### Default

```jsx
() => (
  <SidebarProvider style={{ height: 360 }}>
    <Sidebar collapsible="none">
      <SidebarHeader>
        <div style={{ padding: '8px 12px', fontWeight: 600 }}>Fuel Flow</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>Dashboard</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Shifts</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Inventory</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Credit customers</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Setup</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Stations</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Users</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--muted-foreground)' }}>
          Owner · Karachi
        </div>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset>
      <div style={{ padding: 16, fontSize: 14, color: 'var(--muted-foreground)' }}>
        Main content
      </div>
    </SidebarInset>
  </SidebarProvider>
)
```
