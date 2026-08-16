/**
 * Relais Infomaniak kDrive — le jeton utilisateur transite uniquement
 * dans la requête et n'est jamais stocké côté serveur.
 */
const API_BASE = "https://api.infomaniak.com";
const PASTEK_FOLDER = "Pastek Art";
const BACKUP_FILENAME = "pastek-art-backup.json";
/** Racine privée kDrive (convention Infomaniak). */
const ROOT_DIRECTORY_ID = 1;

export type KDriveFile = {
  id: number;
  name: string;
  type?: string;
  parent_id?: number;
};

type InfomaniakListResponse = {
  result?: string;
  data?: KDriveFile[] | { files?: KDriveFile[] };
  error?: { code?: string; description?: string; message?: string };
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
  if (err?.description) return err.description;
  if (err?.message) return err.message;
  if (err?.code) return `${fallback} (${err.code})`;
  return fallback;
}

function asFileList(data: InfomaniakListResponse["data"]): KDriveFile[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.files)) return data.files;
  return [];
}

async function listChildren(
  token: string,
  driveId: number,
  directoryId: number
): Promise<KDriveFile[]> {
  const url = `${API_BASE}/3/drive/${driveId}/files/${directoryId}/files?with=path`;
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

export async function probeKDrive(input: {
  token: string;
  driveId: number;
}): Promise<{ driveId: number; folderReady: boolean }> {
  // Vérifie l'accès en listant la racine privée.
  await listChildren(input.token, input.driveId, ROOT_DIRECTORY_ID);
  return { driveId: input.driveId, folderReady: true };
}

export async function ensurePastekFolder(input: {
  token: string;
  driveId: number;
}): Promise<number> {
  const children = await listChildren(
    input.token,
    input.driveId,
    ROOT_DIRECTORY_ID
  );
  const existing = children.find((f) => f.name === PASTEK_FOLDER);
  if (existing?.id) return existing.id;

  const res = await fetch(
    `${API_BASE}/3/drive/${input.driveId}/files/${ROOT_DIRECTORY_ID}/directory`,
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
    error?: { description?: string; message?: string; code?: string };
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
  url.searchParams.set("conflict", "version");

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
    error?: { description?: string; message?: string; code?: string };
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
    throw new Error("Impossible de lire la sauvegarde sur kDrive.");
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
