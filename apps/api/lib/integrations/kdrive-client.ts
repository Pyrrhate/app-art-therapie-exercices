/**
 * Relais Infomaniak kDrive — le jeton utilisateur transite uniquement
 * dans la requête et n'est jamais stocké côté serveur.
 */
const API_BASE = "https://api.infomaniak.com";
const PASTEK_FOLDER = "Pastek Art";
const BACKUP_FILENAME = "pastek-art-backup.json";
/** Racine technique kDrive (contient souvent Privé / Documents communs). */
const ROOT_DIRECTORY_ID = 1;

export type KDriveFile = {
  id: number;
  name: string;
  type?: string;
  parent_id?: number;
  visibility?: string;
  color?: string | null;
};

type InfomaniakError = {
  code?: string | number;
  description?: string;
  message?: string;
};

type InfomaniakListResponse = {
  result?: string;
  data?: KDriveFile[] | { files?: KDriveFile[] };
  error?: InfomaniakError;
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
  const err = (payload as InfomaniakListResponse).error;
  const raw =
    err?.description?.trim() ||
    err?.message?.trim() ||
    (err?.code != null ? String(err.code) : "");
  if (!raw) return fallback;

  const lower = raw.toLowerCase();
  if (
    lower.includes("permission") ||
    lower.includes("forbidden") ||
    lower.includes("not allowed") ||
    lower.includes("access denied")
  ) {
    return `${raw} — recréez un jeton API Infomaniak avec le produit kDrive et les droits d'écriture (pas lecture seule), et vérifiez l'ID du drive. L'écriture se fait dans l'espace Privé.`;
  }
  return raw;
}

function asFileList(data: InfomaniakListResponse["data"]): KDriveFile[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.files)) return data.files;
  return [];
}

function isDirectory(file: KDriveFile): boolean {
  if (file.type === "dir" || file.type === "directory") return true;
  // Les dossiers kDrive ont souvent type "file" + une couleur / visibilité d'espace.
  if (file.color) return true;
  if (
    file.visibility === "is_private_space" ||
    file.visibility === "is_team_space" ||
    file.visibility === "is_shared_space" ||
    file.visibility === "is_root"
  ) {
    return true;
  }
  return false;
}

function isPrivateSpaceFolder(file: KDriveFile): boolean {
  if (file.visibility === "is_private_space") return true;
  const name = file.name.trim().toLowerCase();
  return (
    name === "privé" ||
    name === "prive" ||
    name === "private" ||
    name === "mon espace" ||
    name === "my files" ||
    name === "personal"
  );
}

async function listChildren(
  token: string,
  driveId: number,
  directoryId: number
): Promise<KDriveFile[]> {
  const url = `${API_BASE}/3/drive/${driveId}/files/${directoryId}/files?with=capabilities`;
  const res = await fetch(url, { headers: authHeaders(token) });
  const payload = (await res.json().catch(() => ({}))) as InfomaniakListResponse;
  if (!res.ok || payload.result === "error") {
    throw new Error(
      extractErrorMessage(
        payload,
        `Impossible de lister le dossier kDrive (${res.status}).`
      )
    );
  }
  return asFileList(payload.data);
}

/**
 * Trouve un parent où l'utilisateur peut écrire.
 * Sur beaucoup de kDrive, la racine (1) n'est pas writable : il faut le dossier Privé.
 */
async function resolveWritableParent(
  token: string,
  driveId: number
): Promise<number> {
  const children = await listChildren(token, driveId, ROOT_DIRECTORY_ID);
  const privateSpace = children.find(
    (f) => isDirectory(f) && isPrivateSpaceFolder(f)
  );
  if (privateSpace?.id) return privateSpace.id;

  // Espace personnel solo : parfois on peut écrire directement à la racine.
  return ROOT_DIRECTORY_ID;
}

export async function probeKDrive(input: {
  token: string;
  driveId: number;
}): Promise<{ driveId: number; folderReady: boolean; parentId: number }> {
  const parentId = await resolveWritableParent(input.token, input.driveId);
  // Vérifie aussi qu'on peut lister le parent writable.
  await listChildren(input.token, input.driveId, parentId);
  return { driveId: input.driveId, folderReady: true, parentId };
}

export async function ensurePastekFolder(input: {
  token: string;
  driveId: number;
}): Promise<number> {
  const parentId = await resolveWritableParent(input.token, input.driveId);
  const children = await listChildren(input.token, input.driveId, parentId);
  const existing = children.find((f) => f.name === PASTEK_FOLDER);
  if (existing?.id) return existing.id;

  const res = await fetch(
    `${API_BASE}/3/drive/${input.driveId}/files/${parentId}/directory`,
    {
      method: "POST",
      headers: authHeaders(input.token, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ name: PASTEK_FOLDER }),
    }
  );
  const payload = (await res.json().catch(() => ({}))) as {
    result?: string;
    data?: { id?: number };
    error?: InfomaniakError;
  };
  if (!res.ok || payload.result === "error" || !payload.data?.id) {
    throw new Error(
      extractErrorMessage(
        payload,
        "Impossible de créer le dossier « Pastek Art » sur kDrive."
      )
    );
  }
  return payload.data.id;
}

async function findFileInDirectory(input: {
  token: string;
  driveId: number;
  directoryId: number;
  filename: string;
}): Promise<KDriveFile | null> {
  const children = await listChildren(
    input.token,
    input.driveId,
    input.directoryId
  );
  return children.find((f) => f.name === input.filename) ?? null;
}

export async function uploadJsonBackup(input: {
  token: string;
  driveId: number;
  json: string;
}): Promise<{ fileId: number }> {
  const directoryId = await ensurePastekFolder(input);
  const bytes = Buffer.from(new TextEncoder().encode(input.json));
  const url = new URL(`${API_BASE}/3/drive/${input.driveId}/upload`);
  url.searchParams.set("directory_id", String(directoryId));
  url.searchParams.set("file_name", BACKUP_FILENAME);
  url.searchParams.set("total_size", String(bytes.byteLength));
  // `rename` est plus permissif que `version` sur certains comptes.
  url.searchParams.set("conflict", "rename");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: authHeaders(input.token, {
      "Content-Type": "application/octet-stream",
    }),
    body: bytes,
  });
  const payload = (await res.json().catch(() => ({}))) as {
    result?: string;
    data?: { id?: number };
    error?: InfomaniakError;
  };
  if (!res.ok || payload.result === "error" || !payload.data?.id) {
    throw new Error(
      extractErrorMessage(payload, "Échec de l'envoi de la sauvegarde vers kDrive.")
    );
  }
  return { fileId: payload.data.id };
}

export async function downloadJsonBackup(input: {
  token: string;
  driveId: number;
}): Promise<string> {
  const directoryId = await ensurePastekFolder(input);
  const file = await findFileInDirectory({
    token: input.token,
    driveId: input.driveId,
    directoryId,
    filename: BACKUP_FILENAME,
  });
  if (!file?.id) {
    throw new Error(
      "Aucune sauvegarde Pastek Art trouvée sur kDrive (fichier pastek-art-backup.json)."
    );
  }

  const res = await fetch(
    `${API_BASE}/2/drive/${input.driveId}/files/${file.id}/download`,
    {
      headers: authHeaders(input.token),
      redirect: "follow",
    }
  );
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(
      extractErrorMessage(payload, "Impossible de lire la sauvegarde sur kDrive.")
    );
  }
  return res.text();
}

export async function uploadArtworkBytes(input: {
  token: string;
  driveId: number;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}): Promise<{ fileId: number } | null> {
  try {
    const directoryId = await ensurePastekFolder(input);
    const body = Buffer.from(input.bytes);
    const url = new URL(`${API_BASE}/3/drive/${input.driveId}/upload`);
    url.searchParams.set("directory_id", String(directoryId));
    url.searchParams.set("file_name", input.filename);
    url.searchParams.set("total_size", String(body.byteLength));
    url.searchParams.set("conflict", "rename");

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: authHeaders(input.token, {
        "Content-Type": input.mimeType || "application/octet-stream",
      }),
      body,
    });
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => ({}))) as {
      data?: { id?: number };
    };
    return payload.data?.id ? { fileId: payload.data.id } : null;
  } catch {
    return null;
  }
}

export { PASTEK_FOLDER, BACKUP_FILENAME, ROOT_DIRECTORY_ID };
