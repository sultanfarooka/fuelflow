import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/designs")({
  component: DesignsLayout,
});

function DesignsLayout() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" />;
  }
  return <Outlet />;
}
