"use client";

import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" className={styles.logoutButton} onClick={handleLogout}>
      Déconnexion
    </button>
  );
}
