import { createFileRoute } from "@tanstack/react-router";
import { AdminGate } from "@/components/bunny/admin-gate";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Bunny RTC" }, { name: "robots", content: "noindex" }] }),
  component: AdminGate,
});
