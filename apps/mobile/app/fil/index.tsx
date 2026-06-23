import { Redirect } from "expo-router";
import { ROUTES } from "@/lib/routes";

/** Redirection des anciennes URLs /fil → /app/fil */
export default function LegacyFilIndexRedirect() {
  return <Redirect href={ROUTES.fil} />;
}
