import { createFileRoute } from "@tanstack/react-router";
import { Room } from "@/components/bunny/room";

export const Route = createFileRoute("/")({
  component: Room,
});
