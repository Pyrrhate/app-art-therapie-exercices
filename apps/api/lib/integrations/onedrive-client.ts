/**
 * OneDrive (Microsoft Graph) — relais local-first.
 * Le jeton utilisateur transite uniquement dans la requête
 * et n'est jamais stocké côté serveur (aucun secret Vercel).
 */
const GRAPH = "https://graph.microsoft.com/v1.0";
const PASTEK_FOLDER = "Pastek Art";
const BACKUP_FILENAME = "pastek-art-backup.json";

type GraphError = {
  error?: { code?: string; message?: string };
};

function authHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...extra,
  };
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const msg = (payload as GraphError).error?.message?.trim();
  const code = (payload as GraphError).error?.code?.trim();
  if (msg && code) return `${msg} (${code})`;
  if (msg) return msg;
  if (code) return code;
  return fallback;
}

async function graphJson<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: authHeaders(token, init?.headers),
    signal: AbortSignal.timeout(90_000),
  });
  const raw = await response.text();
  let payload: unknown = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { error: { message: raw.slice(0, 200) } };
  }
  if (!response.ok) {
    throw new Error(
      extractErrorMessage(
        payload,
        `OneDrive / Graph HTTP ${response.status}`
      )
    );
  }
  return payload as T;
}

export async function probeOneDrive(token: string): Promise<{
  accountHint: string;
}> {
  const me = await graphJson<{
    mail?: string;
    userPrincipalName?: string;
    displayName?: string;
  }>(token, "/me");
  await graphJson(token, "/me/drive");
  const accountHint =
    me.mail?.trim() ||
    me.userPrincipalName?.trim() ||
    me.displayName?.trim() ||
    "OneDrive";
  return { accountHint };
}

async function ensurePastekFolder(token: string): Promise<void> {
  const encoded = encodeURIComponent(PASTEK_FOLDER);
  const existing = await fetch(`${GRAPH}/me/drive/root:/${encoded}`, {
    headers: authHeaders(token),
    signal: AbortSignal.timeout(30_000),
  });
  if (existing.ok) return;

  try {
    await graphJson(token, "/me/drive/root/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: PASTEK_FOLDER,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail",
      }),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (/nameAlreadyExists|already exists/i.test(msg)) return;
    throw error;
  }
}

function backupPath(): string {
  return `${encodeURIComponent(PASTEK_FOLDER)}/${encodeURIComponent(BACKUP_FILENAME)}`;
}

export async function uploadJsonBackup(input: {
  token: string;
  json: string;
}): Promise<{ fileId: string }> {
  await ensurePastekFolder(input.token);
  const bytes = Buffer.from(input.json, "utf8");
  const response = await fetch(
    `${GRAPH}/me/drive/root:/${backupPath()}:/content`,
    {
      method: "PUT",
      headers: authHeaders(input.token, {
        "Content-Type": "application/json",
      }),
      body: bytes as unknown as BodyInit,
      signal: AbortSignal.timeout(90_000),
    }
  );
  const raw = await response.text();
  let payload: { id?: string; error?: GraphError["error"] } = {};
  try {
    payload = raw ? (JSON.parse(raw) as typeof payload) : {};
  } catch {
    /* ignore */
  }
  if (!response.ok || !payload.id) {
    throw new Error(
      extractErrorMessage(
        payload,
        "Échec de l'envoi de la sauvegarde vers OneDrive."
      )
    );
  }
  return { fileId: payload.id };
}

export async function downloadJsonBackup(token: string): Promise<string> {
  await ensurePastekFolder(token);
  const response = await fetch(
    `${GRAPH}/me/drive/root:/${backupPath()}:/content`,
    {
      headers: authHeaders(token),
      redirect: "follow",
      signal: AbortSignal.timeout(90_000),
    }
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error(
        "Aucune sauvegarde Pastek Art trouvée sur OneDrive (fichier pastek-art-backup.json)."
      );
    }
    throw new Error(
      extractErrorMessage(payload, "Impossible de lire la sauvegarde OneDrive.")
    );
  }
  return response.text();
}

export async function uploadArtworkBytes(input: {
  token: string;
  filename: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<{ fileId: string } | null> {
  try {
    await ensurePastekFolder(input.token);
    const safeName = input.filename.replace(/[\\/:*?"<>|]/g, "_").slice(0, 160);
    const path = `${encodeURIComponent(PASTEK_FOLDER)}/${encodeURIComponent(safeName)}`;
    const response = await fetch(
      `${GRAPH}/me/drive/root:/${path}:/content`,
      {
        method: "PUT",
        headers: authHeaders(input.token, {
          "Content-Type": input.mimeType || "application/octet-stream",
        }),
        body: input.bytes as unknown as BodyInit,
        signal: AbortSignal.timeout(90_000),
      }
    );
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
    };
    return payload.id ? { fileId: payload.id } : null;
  } catch {
    return null;
  }
}

export { PASTEK_FOLDER, BACKUP_FILENAME };
