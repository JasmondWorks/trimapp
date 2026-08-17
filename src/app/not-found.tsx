import { StatusScreen } from "@/components/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Page not found"
      description="The page you're looking for has been trimmed away."
      primaryAction={{ label: "Back home", href: "/" }}
      secondaryAction={{ label: "Browse vendors", href: "/discover" }}
    />
  );
}
