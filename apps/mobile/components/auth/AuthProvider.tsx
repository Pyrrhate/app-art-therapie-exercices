import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth/store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    return init();
  }, [init]);

  return children;
}
