import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/auth/admin-session";
import { getUsageSummary } from "@/lib/admin/usage-query";
import {
  AI_USAGE_EVENT_TYPES,
  AI_USAGE_EVENT_LABELS,
} from "@/lib/admin/usage-types";
import styles from "./admin.module.css";
import { AdminNav } from "./AdminNav";
import { LogoutButton } from "./feedback/LogoutButton";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminDashboardPage() {
  if (!(await isAdminSession())) {
    redirect("/admin/login");
  }

  const summary = await getUsageSummary();

  if (!summary) {
    return (
      <main className={styles.shell}>
        <p>Impossible de charger les statistiques (Supabase indisponible).</p>
      </main>
    );
  }

  const grandTotal = AI_USAGE_EVENT_TYPES.reduce(
    (sum, type) => sum + summary.allTime[type].total,
    0
  );
  const grandTotalAi = AI_USAGE_EVENT_TYPES.reduce(
    (sum, type) => sum + summary.allTime[type].ai,
    0
  );

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Tableau de bord Pastek Art</h1>
          <p className={styles.subtitle}>
            Usage IA et retours utilisateurs — lecture seule.
          </p>
        </div>
        <LogoutButton />
      </header>

      <AdminNav active="dashboard" />

      <section className={styles.cardGrid} aria-label="Vue d'ensemble">
        <div className={styles.card}>
          <div className={styles.cardLabel}>Appels IA (total)</div>
          <div className={styles.cardValue}>{grandTotal}</div>
          <div className={styles.muted}>{grandTotalAi} via modèle IA</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Dernières 24 h</div>
          <div className={styles.cardValue}>
            {AI_USAGE_EVENT_TYPES.reduce(
              (sum, type) => sum + summary.last24Hours[type],
              0
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>7 derniers jours</div>
          <div className={styles.cardValue}>
            {AI_USAGE_EVENT_TYPES.reduce(
              (sum, type) => sum + summary.last7Days[type],
              0
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Feedbacks miroir</div>
          <div className={styles.cardValue}>{summary.feedbackTotal}</div>
        </div>
      </section>

      <p className={styles.muted} style={{ marginBottom: "1.5rem" }}>
        Premier événement : {formatDate(summary.firstEventAt)} · Dernier :{" "}
        {formatDate(summary.lastEventAt)}
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Total</th>
              <th>IA</th>
              <th>Secours</th>
              <th>24 h</th>
              <th>7 j</th>
            </tr>
          </thead>
          <tbody>
            {AI_USAGE_EVENT_TYPES.map((type) => {
              const counts = summary.allTime[type];
              return (
                <tr key={type}>
                  <td>{AI_USAGE_EVENT_LABELS[type]}</td>
                  <td>
                    <strong>{counts.total}</strong>
                  </td>
                  <td className={styles.muted}>{counts.ai}</td>
                  <td className={styles.muted}>{counts.fallback}</td>
                  <td>{summary.last24Hours[type]}</td>
                  <td>{summary.last7Days[type]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.note}>
        Les compteurs démarrent à partir du déploiement de la migration{" "}
        <code>005_ai_usage_events</code>. L&apos;historique antérieur n&apos;est
        pas reconstruit.
      </p>
    </main>
  );
}
