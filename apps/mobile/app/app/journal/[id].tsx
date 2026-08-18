import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/ui/Button";
import { getFilEntryByAnyId } from "@/lib/fil/storage";
import { ROUTES } from "@/lib/routes";

export default function JournalEntryRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setTarget(ROUTES.fil);
      return;
    }
    void getFilEntryByAnyId(id).then((entry) => {
      setTarget(entry ? ROUTES.filEntry(entry.id) : ROUTES.fil);
    });
  }, [id]);

  if (!target) {
    return (
      <ScreenContainer>
        <ActivityIndicator color="#6B8F71" />
      </ScreenContainer>
    );
  }

  return <Redirect href={target} />;
}
