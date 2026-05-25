import { enabledOAuthProviders } from "@/lib/oauth-config";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return <RegisterForm enabled={enabledOAuthProviders()} />;
}
