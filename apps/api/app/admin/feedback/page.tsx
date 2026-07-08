import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/auth/admin-session";
import { listFeedback } from "@/lib/admin/feedback-query";
import styles from "../admin.module.css";
import { AdminNav } from "../AdminNav";
import { LogoutButton } from "./LogoutButton";

const RATING_LABELS: Record<number, string> = {
  3: "🌟 Parfait",
  2: "🌿 Intéressant",
  1: "🥀 À côté",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ratingClass(rating: number): string {
  if (rating === 3) return styles.rating3;
  if (rating === 2) return styles.rating2;
  return styles.rating1;
}

interface PageProps {
  searchParams: Promise<{
    rating?: string;
    version?: string;
  }>;
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  if (!(await isAdminSession())) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const ratingParam = params.rating;
  const rating =
    ratingParam === "1" || ratingParam === "2" || ratingParam === "3"
      ? (Number(ratingParam) as 1 | 2 | 3)
      : undefined;
  const promptVersion = params.version?.trim() || undefined;

  const result = await listFeedback({ rating, promptVersion });

  if (!result) {
    return (
      <main className={styles.shell}>
        <p>Impossible de charger les feedbacks (Supabase indisponible).</p>
      </main>
    );
  }

  const { items, stats, byVersion } = result;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Feedbacks miroir IA</h1>
          <p className={styles.subtitle}>
            Evals loop Pastek Art — lecture seule, accès privé.
          </p>
        </div>
        <LogoutButton />
      </header>

      <AdminNav active="feedback" />

      <section className={styles.cardGrid} aria-label="Statistiques">
        <div className={styles.card}>
          <div className={styles.cardLabel}>Total</div>
          <div className={styles.cardValue}>{stats.total}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Parfait</div>
          <div className={styles.cardValue}>{stats.perfect}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Intéressant</div>
          <div className={styles.cardValue}>{stats.interesting}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>À côté</div>
          <div className={styles.cardValue}>{stats.missed}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Avec commentaire</div>
          <div className={styles.cardValue}>{stats.withComment}</div>
        </div>
      </section>

      {byVersion.length > 0 ? (
        <section className={styles.versionList} aria-label="Par version de prompt">
          {byVersion.map((row) => (
            <span key={row.prompt_version} className={styles.versionChip}>
              {row.prompt_version} · {row.total} retours · moy. {row.avgRating}
            </span>
          ))}
        </section>
      ) : null}

      <form className={styles.filters} method="get">
        <label>
          Note
          <select name="rating" defaultValue={ratingParam ?? ""}>
            <option value="">Toutes</option>
            <option value="3">🌟 Parfait</option>
            <option value="2">🌿 Intéressant</option>
            <option value="1">🥀 À côté</option>
          </select>
        </label>
        <label>
          Version prompt
          <select name="version" defaultValue={promptVersion ?? ""}>
            <option value="">Toutes</option>
            {byVersion.map((row) => (
              <option key={row.prompt_version} value={row.prompt_version}>
                {row.prompt_version}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={styles.button}>
          Filtrer
        </button>
        {(rating || promptVersion) && (
          <Link href="/admin/feedback" className={styles.logoutButton}>
            Réinitialiser
          </Link>
        )}
      </form>

      <div className={styles.tableWrap}>
        {items.length === 0 ? (
          <p className={styles.empty}>Aucun retour pour ces filtres.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Note</th>
                <th>Version</th>
                <th>Session</th>
                <th>Commentaire</th>
                <th>Réflexion IA</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td className={styles.muted}>{formatDate(row.created_at)}</td>
                  <td>
                    <span
                      className={`${styles.ratingBadge} ${ratingClass(row.rating)}`}
                    >
                      {RATING_LABELS[row.rating] ?? row.rating}
                    </span>
                  </td>
                  <td className={styles.muted}>{row.prompt_version}</td>
                  <td className={styles.muted}>
                    <code>{row.session_id.slice(0, 8)}…</code>
                    {row.user_id ? (
                      <div className={styles.muted}>user {row.user_id.slice(0, 8)}…</div>
                    ) : null}
                  </td>
                  <td>
                    {row.comment?.trim() ? (
                      <span className={styles.comment}>{row.comment}</span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td>
                    <details className={styles.details}>
                      <summary>Lire la réflexion</summary>
                      <pre>{row.ai_response_text}</pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
