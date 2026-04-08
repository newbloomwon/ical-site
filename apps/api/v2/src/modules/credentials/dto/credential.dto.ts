// Member 2 & 3: API
// Defines the shape of data going in and out of the credentials endpoints.

export class CredentialResponseDto {
  id: number;
  type: string;         // e.g. "google_calendar", "zoom_video"
  appId: string;        // e.g. "google-calendar"
  lastUsedAt: Date | null;
  isStale: boolean;     // true if lastUsedAt > 30 days ago or never used
}

export class RevokeCredentialResponseDto {
  success: boolean;
  message: string;
}
