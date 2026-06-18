/** Classes Tailwind communes selon le thème actif. */
export function screenBg(isDark: boolean, focus = false): string {
  if (isDark) return focus ? "bg-sand-800" : "bg-sand-900";
  return focus ? "bg-sand-100" : "bg-sand-50";
}

export function panelBg(isDark: boolean): string {
  return isDark
    ? "bg-sand-800 border-sand-700"
    : "bg-white border-sand-200";
}

export function textPrimary(isDark: boolean): string {
  return isDark ? "text-sand-100" : "text-sand-800";
}

export function textSecondary(isDark: boolean): string {
  return isDark ? "text-sand-300" : "text-sand-600";
}

export function textMuted(isDark: boolean): string {
  return isDark ? "text-sand-400" : "text-sand-500";
}

export function borderDefault(isDark: boolean): string {
  return isDark ? "border-sand-700" : "border-sand-200";
}
