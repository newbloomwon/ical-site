import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isRevocableCredentialType,
  revokeOAuthCredential,
} from "@calcom/app-store/_utils/oauth/revokeOAuthCredential";

vi.mock("@calcom/app-store/zoomvideo/lib/getZoomAppKeys", () => ({
  getZoomAppKeys: vi.fn(async () => ({
    client_id: "zoom-client-id",
    client_secret: "zoom-client-secret",
  })),
}));

describe("revokeOAuthCredential", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.stubEnv("STRIPE_PRIVATE_KEY", "sk_test_123");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns true for revocable credential types", () => {
    expect(isRevocableCredentialType("google_calendar")).toBe(true);
    expect(isRevocableCredentialType("zoom_video")).toBe(true);
    expect(isRevocableCredentialType("stripe_payment")).toBe(true);
    expect(isRevocableCredentialType("office365_video")).toBe(true);
    expect(isRevocableCredentialType("office365_calendar")).toBe(true);
  });

  it("revokes google credentials using refresh token", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const result = await revokeOAuthCredential({
      credentialType: "google_calendar",
      credentialKey: {
        access_token: "google-access-token",
        refresh_token: "google-refresh-token",
      },
    });

    expect(result.revoked).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/revoke",
      expect.objectContaining({
        method: "POST",
        body: new URLSearchParams({ token: "google-refresh-token" }),
      })
    );
  });

  it("revokes zoom credentials with basic auth", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    const expectedAuthorizationHeader = `Basic ${Buffer.from("zoom-client-id:zoom-client-secret").toString(
      "base64"
    )}`;

    const result = await revokeOAuthCredential({
      credentialType: "zoom_video",
      credentialKey: {
        access_token: "zoom-access-token",
      },
    });

    expect(result.revoked).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://zoom.us/oauth/revoke",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expectedAuthorizationHeader,
        }),
      })
    );
  });

  it("revokes stripe credentials with stripe_user_id", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const result = await revokeOAuthCredential({
      credentialType: "stripe_payment",
      credentialKey: {
        stripe_user_id: "acct_123",
      },
    });

    expect(result.revoked).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://connect.stripe.com/oauth/deauthorize",
      expect.objectContaining({
        method: "POST",
        body: new URLSearchParams({
          client_secret: "sk_test_123",
          stripe_user_id: "acct_123",
        }),
      })
    );
  });

  it("revokes office365 credentials via Microsoft Graph", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const result = await revokeOAuthCredential({
      credentialType: "office365_video",
      credentialKey: {
        access_token: "microsoft-access-token",
      },
    });

    expect(result.revoked).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/me/revokeSignInSessions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer microsoft-access-token",
        }),
      })
    );
  });

  it("does not attempt stripe revocation without stripe_user_id", async () => {
    const result = await revokeOAuthCredential({
      credentialType: "stripe_payment",
      credentialKey: {},
    });

    expect(result).toEqual(
      expect.objectContaining({
        attempted: false,
        revoked: false,
      })
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
