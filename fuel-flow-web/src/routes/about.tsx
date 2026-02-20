import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold">About Fuel Flow</h1>
      <p className="text-muted-foreground">
        Phase 1.1: Project Setup - Complete!
      </p>
    </div>
  );
}
