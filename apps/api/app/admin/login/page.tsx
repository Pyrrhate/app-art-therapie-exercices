import { redirect } from "next/navigation";
import {
  isAdminSession,
  isAdminViewerConfigured,
} from "@/lib/auth/admin-session";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  if (!isAdminViewerConfigured()) {
    return (
      <main className="shell" style={{ padding: "2rem", textAlign: "center" }}>
        <p>
          Accès admin non configuré. Définissez{" "}
          <code>ADMIN_VIEWER_TOKEN</code> sur Vercel puis redéployez.
        </p>
      </main>
    );
  }

  if (await isAdminSession()) {
    redirect("/admin/feedback");
  }

  return <LoginForm />;
}
