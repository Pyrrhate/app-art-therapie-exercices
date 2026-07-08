import Link from "next/link";
import styles from "./admin.module.css";

interface AdminNavProps {
  active: "dashboard" | "feedback";
}

export function AdminNav({ active }: AdminNavProps) {
  return (
    <nav className={styles.nav} aria-label="Navigation admin">
      <Link
        href="/admin"
        className={active === "dashboard" ? styles.navActive : styles.navLink}
      >
        Tableau de bord
      </Link>
      <Link
        href="/admin/feedback"
        className={active === "feedback" ? styles.navActive : styles.navLink}
      >
        Feedbacks miroir
      </Link>
    </nav>
  );
}
