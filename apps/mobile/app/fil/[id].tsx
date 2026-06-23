import { Redirect, useLocalSearchParams } from "expo-router";
import { ROUTES } from "@/lib/routes";

/** Redirection des anciennes URLs /fil/:id → /app/fil/:id */
export default function LegacyFilEntryRedirect() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const entryId = Array.isArray(id) ? id[0] : id;

  if (!entryId) {
    return <Redirect href={ROUTES.fil} />;
  }

  return <Redirect href={ROUTES.filEntry(entryId)} />;
}
