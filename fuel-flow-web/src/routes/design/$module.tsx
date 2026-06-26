import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { findModule } from "@/design/catalogue";

export const Route = createFileRoute("/design/$module")({
  loader: ({ params }) => {
    const module = findModule(params.module);
    if (!module) throw notFound();
    return { module };
  },
  component: ModuleLayout,
});

function ModuleLayout() {
  return <Outlet />;
}
