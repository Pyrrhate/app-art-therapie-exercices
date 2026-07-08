"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export function LoginForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Accès refusé.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.loginCard}>
        <h1>Accès admin</h1>
        <p>Consultation privée des retours sur les miroirs créatifs IA.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-token">Mot de passe admin</label>
          <input
            id="admin-token"
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="ADMIN_VIEWER_TOKEN"
            required
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Connexion…" : "Entrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
