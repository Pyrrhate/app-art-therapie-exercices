export type CloudProviderId = "google_drive" | "onedrive";

export interface CloudIntegrationStatus {
  provider: CloudProviderId;
  connected: boolean;
  connectedAt: string | null;
  providerAccountId: string | null;
  configured: boolean;
}

export interface CloudConnectResponse {
  status: "oauth" | "stub" | "disconnected";
  authUrl?: string;
  message?: string;
}
