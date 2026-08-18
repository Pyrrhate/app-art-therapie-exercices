import { Redirect } from "expo-router";
import { ROUTES } from "@/lib/routes";

export default function JournalIndexRedirect() {
  return <Redirect href={ROUTES.fil} />;
}
