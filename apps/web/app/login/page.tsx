import { enabledOAuthProviders } from "@/lib/oauth-config";
import { LoginForm } from "./LoginForm";

// Server component: reads the env on the server to decide which OAuth
// buttons to render, then hands the result to the client form.
export default function LoginPage() {
  return <LoginForm enabled={enabledOAuthProviders()} />;
}
